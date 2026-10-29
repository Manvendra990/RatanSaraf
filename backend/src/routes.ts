import { FileInterceptor } from '@nestjs/platform-express';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { Body, Controller, Get, Post, Put, Param, Req, Res, UseGuards, BadRequestException, ForbiddenException, UnauthorizedException, ServiceUnavailableException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { rows, tx, prisma, normalize } from './db';
import { Auth, Admin, digest } from './auth';
import * as D from './dto';
import { parseUnits, buyGrams, sellPaise, display, nextDue } from './money';
const id = randomUUID;
const requireThat = (ok: any, message: string) => { if(!ok) throw new BadRequestException(message); };
function units(v:string,p:number) { try{return parseUnits(v,p);}catch(e:any){throw new BadRequestException(e.message);} }
const audit = (db:any, actor:string, action:string, ref:string) => rows('INSERT INTO audit(id,actor,action,referenceId) VALUES(?,?,?,?)',[id(),actor,action,ref],db);
async function verified(user:string, db?:any) {
 const [k]=await rows("SELECT id FROM kyc WHERE userId=? AND status='VERIFIED' LIMIT 1",[user],db);
 const [m]=await rows("SELECT id FROM manual_kyc WHERE userId=? AND status='APPROVED' LIMIT 1",[user],db);
 if(!k&&!m)throw new ForbiddenException('Complete identity review first');
}
async function quote(rateId:string,db:any,maxAge:number) { const [r]=await rows("SELECT *,TIMESTAMPDIFF(SECOND,createdAt,UTC_TIMESTAMP()) AS age FROM rates WHERE id=? AND metal='Gold'",[rateId],db); requireThat(r && r.age<=maxAge,'Quote expired; refresh the Gold SIP rate'); return r; }
const productSelect='SELECT p.*,c.name AS category FROM products p JOIN categories c ON c.id=p.categoryId';
function product(p:any) {return {...p,price:Number(p.pricePaise)/100,coinWeight:p.coinWeight===null?undefined:Number(p.coinWeight),active:!!p.active};}
@Controller('auth')
export class AuthController {
 constructor(private jwt:JwtService){}
 async session(user:any,res:any,cookie:boolean) {
  const token=this.jwt.sign({sub:user.id,jti:id()});
  await rows('INSERT INTO sessions(hash,userId,expiresAt) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 8 HOUR))',[digest(token),user.id]);
  if(cookie) res.cookie('session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',maxAge:8*3600000,path:'/api'});
  const {password,...safe}=user; return cookie?{user:safe}:{user:safe,token};
 }
 @Post('register') async register(@Body() b:D.Register,@Res({passthrough:true}) res:any) {
  const user={id:id(),name:b.name,email:b.email.toLowerCase(),phone:b.phone,role:'USER'};
  requireThat(Buffer.byteLength(b.password,'utf8')<=72,'Password must be at most 72 UTF-8 bytes');
  const password=await bcrypt.hash(b.password,12);
  await tx(async db=>{await rows('INSERT INTO users(id,name,email,phone,password) VALUES(?,?,?,?,?)',[user.id,user.name,user.email,user.phone,password],db);await rows('INSERT INTO accounts(userId) VALUES(?)',[user.id],db);});
  return this.session(user,res,false);
 }
 @Post('login') async login(@Body() b:D.Login,@Res({passthrough:true}) res:any){return this.signin(b,res,false);}
 @Post('admin-login') async adminLogin(@Body() b:D.Login,@Req() req:any,@Res({passthrough:true}) res:any){if(req.headers.origin!==process.env.ADMIN_ORIGIN)throw new ForbiddenException();return this.signin(b,res,true);}
 async signin(b:D.Login,res:any,admin:boolean) {requireThat(Buffer.byteLength(b.password,'utf8')<=72,'Password is too long');const [u]=await rows('SELECT * FROM users WHERE (email=? OR phone=?) AND active=1',[b.login.toLowerCase(),b.login]);if(!u || !await bcrypt.compare(b.password,u.password) || (admin && u.role!=='ADMIN'))throw new UnauthorizedException('Invalid login details');return this.session(u,res,admin);}
 @Get('me') @UseGuards(Auth) me(@Req() req:any){return req.user;}
 @Post('logout') @UseGuards(Auth) async logout(@Req() req:any,@Res({passthrough:true}) res:any){if(req.cookies?.session && req.headers.origin!==process.env.ADMIN_ORIGIN)throw new ForbiddenException();await rows('DELETE FROM sessions WHERE hash=?',[digest(req.token)]);res.clearCookie('session',{path:'/api'});return {ok:true};}
}
@Controller()
export class ApiController {
 @Get('ready') async ready(){try{await rows('SELECT 1 FROM users LIMIT 1');return {ok:true,database:true};}catch{throw new ServiceUnavailableException('Database unavailable or schema not initialized');}}
 @Get('health') health(){return {ok:true,service:'Ratan Lal Saraf API'};}
 @Get('catalog') async catalog(){const [items,categories]=await Promise.all([prisma.product.findMany({where:{active:true,category:{active:true}},include:{category:true}}),prisma.category.findMany({where:{active:true},orderBy:[{metal:'asc'},{name:'asc'}]})]);return {products:items.map(p=>product({...normalize(p),category:p.category.name})),categories:normalize(categories)};}
 @Get('store') async store(){const s=await prisma.setting.findUnique({where:{id:1}});return {...((s?.data as Record<string,unknown>)||{}),paymentInstructions:process.env.MERCHANT_PAYMENT_INSTRUCTIONS,paymentsEnabled:process.env.PAYMENTS_ENABLED==='true',privacyUrl:process.env.PRIVACY_URL||''};}
 @Get('sip/plans') async plans(){return normalize(await prisma.plan.findMany({where:{active:true}}));}
 @Get('sip/rates') async rates(){return rows('SELECT * FROM rates r WHERE r.id=(SELECT x.id FROM rates x WHERE x.metal=r.metal ORDER BY x.createdAt DESC,x.id DESC LIMIT 1)');}
 @Get('shop') @UseGuards(Auth) async shop(@Req() req:any){const [s]=await rows('SELECT cart,favorites FROM shop WHERE userId=?',[req.user.id]);return s||{cart:[],favorites:[]};}
 @Put('shop') @UseGuards(Auth) async saveShop(@Req() req:any,@Body() b:any){
  requireThat(Array.isArray(b.cart)&&Array.isArray(b.favorites)&&b.cart.length<=200&&b.favorites.length<=500,'Invalid shop data');
  const cart=b.cart.map((v:any)=>{requireThat(typeof v.id==='string'&&v.id.length<=60&&Number.isInteger(v.qty)&&v.qty>0&&v.qty<=999,'Invalid cart line');return {id:v.id,qty:v.qty};});
  requireThat(b.favorites.every((v:any)=>typeof v==='string'&&v.length<=60),'Invalid favorites');
  requireThat(new Set(cart.map((v:any)=>v.id)).size===cart.length,'Duplicate cart line');
  await rows('INSERT INTO shop(userId,cart,favorites) VALUES(?,?,?) ON DUPLICATE KEY UPDATE cart=VALUES(cart),favorites=VALUES(favorites)',[req.user.id,JSON.stringify(cart),JSON.stringify([...new Set(b.favorites)])]);return {ok:true};
 }
 @Post('enquiries') @UseGuards(Auth) async enquiry(@Req() req:any,@Body() b:D.Enquiry){await rows('INSERT INTO enquiries(id,userId,productId,message) VALUES(?,?,?,?)',[id(),req.user.id,b.productId,b.message]);return {ok:true};}
 @Get('sip/dashboard') @UseGuards(Auth) async dashboard(@Req() req:any) {
  const u=req.user.id;
  const [a]=await rows('SELECT * FROM accounts WHERE userId=?',[u]);
  const [k]=await rows('SELECT id,status,updatedAt FROM kyc WHERE userId=? ORDER BY consentAt DESC LIMIT 1',[u]);
  return {balance:display(a?.grams||'0',6),reserved:display(a?.reserved||'0',6),available:display(BigInt(a?.grams||0)-BigInt(a?.reserved||0),6),kyc:k||null,manualKyc:(await rows('SELECT id,status,note,submittedAt,reviewedAt FROM manual_kyc WHERE userId=?',[u]))[0]||null,
   subscriptions:await rows('SELECT s.*,p.name,p.months FROM subscriptions s JOIN plans p ON p.id=s.planId WHERE s.userId=? ORDER BY s.anchorAt DESC',[u]),
   payments:await rows('SELECT p.*,r.buyPaise FROM payments p JOIN rates r ON r.id=p.rateId WHERE userId=? ORDER BY p.createdAt DESC',[u]),
   sales:await rows('SELECT * FROM sales WHERE userId=? ORDER BY createdAt DESC',[u]),ledger:await rows('SELECT * FROM ledger WHERE userId=? ORDER BY createdAt DESC',[u])};
 }
 @Post('kyc/start') @UseGuards(Auth) async kyc(@Req() req:any,@Body() b:D.KycConsent) {
  if(!process.env.KYC_API_URL||!process.env.KYC_API_KEY||!process.env.KYC_WEBHOOK_SECRET)throw new ServiceUnavailableException('Aadhaar KYC provider is not configured. Contact the store.');
  const ref=id();
  await rows("INSERT INTO kyc(id,userId,status,consentVersion,consentAt) VALUES(?,?,'PENDING','aadhaar-v1',UTC_TIMESTAMP())",[ref,req.user.id]);
  let result:any;
  try {const response=await fetch(process.env.KYC_API_URL,{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${process.env.KYC_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({reference:ref,customer:{name:req.user.name,email:req.user.email,phone:req.user.phone},callbackUrl:`${process.env.PUBLIC_API_URL}/kyc/webhook`})});if(!response.ok)throw new Error();result=await response.json();requireThat(typeof result.providerRef==='string'&&result.providerRef.length<=190&&typeof result.redirectUrl==='string'&&new URL(result.redirectUrl).protocol==='https:','Invalid provider response');}
  catch {await rows("UPDATE kyc SET status='REJECTED' WHERE id=?",[ref]);throw new ServiceUnavailableException('KYC provider unavailable. Retry later');}
  await rows('UPDATE kyc SET providerRef=? WHERE id=?',[result.providerRef,ref]);return {redirectUrl:result.redirectUrl,reference:ref};
 }
 @Post('kyc/webhook') async webhook(@Req() req:any,@Body() b:D.KycResult) {
  const secret=process.env.KYC_WEBHOOK_SECRET, stamp=req.headers['x-kyc-timestamp'], signature=req.headers['x-kyc-signature'];
  if(!secret||typeof stamp!=='string'||typeof signature!=='string'||!/^\d+$/.test(stamp)||Math.abs(Date.now()/1000-Number(stamp))>300||!/^[a-f0-9]{64}$/.test(signature))throw new UnauthorizedException();
  const expected=createHmac('sha256',secret).update(`${stamp}.`).update(req.rawBody).digest();if(!timingSafeEqual(expected,Buffer.from(signature,'hex')))throw new UnauthorizedException();
  await tx(async db=>{const [k]=await rows('SELECT * FROM kyc WHERE id=? AND providerRef=? FOR UPDATE',[b.reference,b.providerRef],db);requireThat(k,'Unknown verification');if(k.status!=='PENDING'){requireThat(k.status===b.status,'Verification already finalized');return;}await rows('UPDATE kyc SET status=? WHERE id=?',[b.status,b.reference],db);await audit(db,k.userId,'KYC_'+b.status,k.id);});return {ok:true};
 }
 @Post('sip/subscriptions') @UseGuards(Auth) async subscribe(@Req() req:any,@Body() b:D.Subscribe) {
  await verified(req.user.id);const [p]=await rows('SELECT * FROM plans WHERE id=? AND active=1',[b.planId]);const amount=units(b.amount,2);requireThat(p&&amount>=BigInt(p.minPaise),'Choose an active plan and meet its minimum');const ref=id();
  await rows('INSERT INTO subscriptions(id,userId,planId,amountPaise,anchorAt,nextDue) VALUES(?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())',[ref,req.user.id,p.id,amount.toString()]);return {id:ref};
 }
 @Put('sip/subscriptions/:id') @UseGuards(Auth) async subscription(@Req() req:any,@Param('id') ref:string,@Body() b:D.SubscriptionStatus){
  return tx(async db=>{const [s]=await rows('SELECT * FROM subscriptions WHERE id=? AND userId=? FOR UPDATE',[ref,req.user.id],db);requireThat(s&&s.status!=='CANCELLED','Subscription not found or already cancelled');await rows('UPDATE subscriptions SET status=? WHERE id=?',[b.status,ref],db);return {ok:true};});
 }
 @Post('sip/payments') @UseGuards(Auth) async pay(@Req() req:any,@Body() b:D.Payment) {
  requireThat(b.reference.trim().length>=6,'Enter a valid bank transaction reference');
  requireThat(process.env.PAYMENTS_ENABLED==='true','Payments are not yet enabled by the store');
  return tx(async db=>{await verified(req.user.id,db);const [s]=await rows('SELECT * FROM subscriptions WHERE id=? AND userId=? FOR UPDATE',[b.subscriptionId,req.user.id],db);requireThat(s&&s.status==='ACTIVE','Choose an active SIP');requireThat(!(await rows("SELECT id FROM payments WHERE subscriptionId=? AND status='PENDING'",[s.id],db)).length,'A payment is already pending for this SIP');const r=await quote(b.rateId,db,900);const grams=buyGrams(BigInt(s.amountPaise),BigInt(r.buyPaise));requireThat(grams>0n,'Amount too small');const ref=id();await rows('INSERT INTO payments(id,userId,subscriptionId,reference,rateId,amountPaise,grams) VALUES(?,?,?,?,?,?,?)',[ref,req.user.id,s.id,b.reference.trim(),r.id,s.amountPaise,grams.toString()],db);return {id:ref,grams:display(grams,6)};});
 }
 @Post('sip/sales') @UseGuards(Auth) async sell(@Req() req:any,@Body() b:D.Sale) {
  return tx(async db=>{await verified(req.user.id,db);const [a]=await rows('SELECT * FROM accounts WHERE userId=? FOR UPDATE',[req.user.id],db);const grams=units(b.grams,6);requireThat(b.payoutDetails.trim().length>=5,'Enter valid payout details');requireThat(a&&grams<=BigInt(a.grams)-BigInt(a.reserved),'Insufficient available gold');const r=await quote(b.rateId,db,300);const amount=sellPaise(grams,BigInt(r.sellPaise));requireThat(amount>0n,'Sale too small');const ref=id();await rows('INSERT INTO sales(id,userId,rateId,grams,amountPaise,payoutDetails) VALUES(?,?,?,?,?,?)',[ref,req.user.id,r.id,grams.toString(),amount.toString(),b.payoutDetails],db);await rows('UPDATE accounts SET reserved=reserved+? WHERE userId=?',[grams.toString(),req.user.id],db);return {id:ref,amount:display(amount,2)};});
 }
}
@Controller('admin')
@UseGuards(Auth,Admin)
export class AdminController {
 @Post('images') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:5*1024*1024,files:1}}))
 async image(@UploadedFile() file:any){
  requireThat(file?.buffer,'Choose an image');const b:Buffer=file.buffer;
  const ext=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':b[0]===255&&b[1]===216&&b[2]===255?'jpg':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'webp':null;
  requireThat(ext,'Only PNG, JPEG or WebP images are accepted');const name=id()+'.'+ext;await mkdir(join(process.cwd(),'uploads'),{recursive:true});await writeFile(join(process.cwd(),'uploads',name),b,{flag:'wx'});
  return {url:(process.env.PUBLIC_API_URL||'http://localhost:3004/api').replace(/\/api\/?$/,'')+'/media/'+name};
 }
 @Get('settings') async settings(){const [s]=await rows('SELECT data FROM settings WHERE id=1');return s?.data||{};}
 @Put('settings') async settingsSave(@Req() req:any,@Body() b:D.StoreSettings){await tx(async db=>{await rows('INSERT INTO settings(id,data) VALUES(1,?) ON DUPLICATE KEY UPDATE data=VALUES(data)',[JSON.stringify(b)],db);await audit(db,req.user.id,'STORE_SETTINGS','1');});return {ok:true};}
 @Get('overview') async overview(){const [[users],[payments],[sales],[gold]]=await Promise.all([rows("SELECT COUNT(*) AS count FROM users WHERE role='USER'"),rows("SELECT COUNT(*) AS count FROM payments WHERE status='PENDING'"),rows("SELECT COUNT(*) AS count FROM sales WHERE status IN ('PENDING','APPROVED')"),rows('SELECT COALESCE(SUM(grams),0) AS total FROM accounts')]);return {customers:users.count,pendingPayments:payments.count,pendingSales:sales.count,goldGrams:display(gold.total,6)};}
 @Get('products') async products(){return (await prisma.product.findMany({include:{category:true}})).map(p=>product({...normalize(p),category:p.category.name}));}
 @Get('categories') async categories(){return normalize(await prisma.category.findMany({orderBy:[{metal:'asc'},{name:'asc'}]}));}
 @Post('categories') async category(@Req() req:any,@Body() b:D.Category){const ref=id();await tx(async db=>{await rows('INSERT INTO categories(id,name,metal,active) VALUES(?,?,?,?)',[ref,b.name,b.metal,b.active],db);await audit(db,req.user.id,'CATEGORY_CREATE',ref);});return {id:ref};}
 @Put('categories/:id') async categoryUpdate(@Req() req:any,@Param('id') ref:string,@Body() b:D.Category){await tx(async db=>{const [c]=await rows('SELECT * FROM categories WHERE id=? FOR UPDATE',[ref],db);requireThat(c,'Category missing');requireThat(c.name!=='Coins'||b.name==='Coins','Coins is a reserved catalogue category; edit its products instead');requireThat(c.metal===b.metal||!(await rows('SELECT id FROM products WHERE categoryId=? LIMIT 1',[ref],db)).length,'Cannot change metal of a category with products');await rows('UPDATE categories SET name=?,metal=?,active=? WHERE id=?',[b.name,b.metal,b.active,ref],db);await audit(db,req.user.id,'CATEGORY_UPDATE',ref);});return {ok:true};}
 @Post('products') createProduct(@Req() req:any,@Body() b:D.ProductDto){return this.saveProduct(req,id(),b,false);}
 @Put('products/:id') updateProduct(@Req() req:any,@Param('id') ref:string,@Body() b:D.ProductDto){return this.saveProduct(req,ref,b,true);}
 async saveProduct(req:any,ref:string,b:D.ProductDto,update:boolean){
  const price=units(b.price,2);requireThat(!b.image||/^https?:\/\//.test(b.image),'Use an HTTP(S) image URL');
  await tx(async db=>{const [c]=await rows('SELECT * FROM categories WHERE id=? FOR UPDATE',[b.categoryId],db);requireThat(c&&c.metal===b.metal,'Category must match product metal');requireThat(c.name!=='Coins'||(b.coinWeight&&[0.5,1,10,20,50].includes(Number(b.coinWeight))),'Select a supported coin weight: 0.5, 1, 10, 20 or 50 grams');if(update)requireThat((await rows('SELECT id FROM products WHERE id=?',[ref],db)).length,'Product not found');const vals=[b.name,b.metal,b.categoryId,price.toString(),b.weight,b.purity,b.image,b.description,b.coinWeight||null,b.stock,b.active];await rows(update?'UPDATE products SET name=?,metal=?,categoryId=?,pricePaise=?,weight=?,purity=?,image=?,description=?,coinWeight=?,stock=?,active=? WHERE id=?':'INSERT INTO products(name,metal,categoryId,pricePaise,weight,purity,image,description,coinWeight,stock,active,id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[...vals,ref],db);await audit(db,req.user.id,'PRODUCT_SAVE',ref);});return {id:ref};
 }
 @Post('rates') async rate(@Req() req:any,@Body() b:D.Rate){const buy=units(b.buy,2),sell=units(b.sell,2);requireThat(sell<=buy,'Sell rate cannot exceed buy rate');const ref=id();await tx(async db=>{await rows('INSERT INTO rates(id,metal,buyPaise,sellPaise,source) VALUES(?,?,?,?,?)',[ref,b.metal,buy.toString(),sell.toString(),b.source],db);await audit(db,req.user.id,'RATE_PUBLISH',ref);});return {id:ref};}
 @Get('plans') async plans(){return normalize(await prisma.plan.findMany());}
 @Post('plans') createPlan(@Req() req:any,@Body() b:D.Plan){return this.savePlan(req,id(),b,false);}
 @Put('plans/:id') updatePlan(@Req() req:any,@Param('id') ref:string,@Body() b:D.Plan){return this.savePlan(req,ref,b,true);}
 async savePlan(req:any,ref:string,b:D.Plan,update:boolean){const amount=units(b.minimum,2);await tx(async db=>{if(update){const [p]=await rows('SELECT * FROM plans WHERE id=? FOR UPDATE',[ref],db);requireThat(p,'Plan not found');requireThat(p.months===b.months,'Frequency cannot change; create a new plan');}await rows(update?'UPDATE plans SET name=?,months=?,minPaise=?,active=? WHERE id=?':'INSERT INTO plans(name,months,minPaise,active,id) VALUES(?,?,?,?,?)',[b.name,b.months,amount.toString(),b.active,ref],db);await audit(db,req.user.id,'PLAN_SAVE',ref);});return {id:ref};}
 @Get('users') users(){return rows("SELECT id,name,email,phone,role,active,createdAt FROM users WHERE role='USER' ORDER BY createdAt DESC");}
 @Get('kyc') kyc(){return rows('SELECT k.*,u.name,u.email FROM kyc k JOIN users u ON u.id=k.userId ORDER BY consentAt DESC');}
 @Get('subscriptions') subscriptions(){return rows('SELECT s.*,u.name,p.name AS planName FROM subscriptions s JOIN users u ON u.id=s.userId JOIN plans p ON p.id=s.planId ORDER BY anchorAt DESC');}
 @Get('payments') payments(){return rows('SELECT p.*,u.name FROM payments p JOIN users u ON u.id=p.userId ORDER BY p.createdAt DESC');}
 @Get('sales') sales(){return rows('SELECT s.*,u.name FROM sales s JOIN users u ON u.id=s.userId ORDER BY s.createdAt DESC');}
 @Get('ledger') ledger(){return rows('SELECT l.*,u.name FROM ledger l JOIN users u ON u.id=l.userId ORDER BY l.createdAt DESC');}
 @Get('enquiries') enquiries(){return rows('SELECT e.*,u.name FROM enquiries e JOIN users u ON u.id=e.userId ORDER BY e.createdAt DESC');}
 @Get('audit') audits(){return rows('SELECT * FROM audit ORDER BY createdAt DESC LIMIT 500');}
 @Post('payments/:id/decision') async paymentDecision(@Req() req:any,@Param('id') ref:string,@Body() b:D.Decision){
  requireThat(b.note.trim().length>=3,'Enter a verification note');
  requireThat(b.action!=='PAID','Choose approve or reject');
  return tx(async db=>{const [p]=await rows('SELECT * FROM payments WHERE id=? FOR UPDATE',[ref],db);requireThat(p,'Payment not found');const target=b.action==='APPROVE'?'APPROVED':'REJECTED';if(p.status===target)return {ok:true};requireThat(p.status==='PENDING','Payment already finalized');
   if(b.action==='APPROVE'){
    requireThat(b.reference&&b.reference.trim().length>=3,'Record the actual gold allocation reference');await verified(p.userId,db);
    const [s]=await rows('SELECT s.*,pl.months FROM subscriptions s JOIN plans pl ON pl.id=s.planId WHERE s.id=? FOR UPDATE',[p.subscriptionId],db);const count=s.paidCount+1;
    await rows('SELECT userId FROM accounts WHERE userId=? FOR UPDATE',[p.userId],db);
    await rows('UPDATE accounts SET grams=grams+? WHERE userId=?',[p.grams,p.userId],db);
    await rows('INSERT INTO ledger(id,userId,kind,referenceId,grams,amountPaise) VALUES(?,?,\'BUY\',?,?,?)',[id(),p.userId,p.id,p.grams,p.amountPaise],db);
    await rows('UPDATE subscriptions SET paidCount=?,nextDue=? WHERE id=?',[count,nextDue(s.anchorAt,count,s.months),s.id],db);
   }
   await rows('UPDATE payments SET status=?,allocationRef=?,note=? WHERE id=?',[target,b.action==='APPROVE'?b.reference:null,b.note,p.id],db);await audit(db,req.user.id,'PAYMENT_'+target,ref);return {ok:true};});
 }
 @Post('sales/:id/decision') async saleDecision(@Req() req:any,@Param('id') ref:string,@Body() b:D.Decision){
  return tx(async db=>{const [s]=await rows('SELECT * FROM sales WHERE id=? FOR UPDATE',[ref],db);requireThat(s,'Sale not found');const target=b.action==='APPROVE'?'APPROVED':b.action==='REJECT'?'REJECTED':'PAID';if(s.status===target)return {ok:true};
   requireThat(target==='PAID'?s.status==='APPROVED':s.status==='PENDING','Invalid sale status transition');
   const [a]=await rows('SELECT * FROM accounts WHERE userId=? FOR UPDATE',[s.userId],db);requireThat(a&&BigInt(a.reserved)>=BigInt(s.grams),'Reservation missing');
   if(target==='REJECTED')await rows('UPDATE accounts SET reserved=reserved-? WHERE userId=?',[s.grams,s.userId],db);
   if(target==='PAID'){
    requireThat(b.reference&&b.reference.trim().length>=3,'Enter verified bank payout reference');requireThat(BigInt(a.grams)>=BigInt(s.grams),'Insufficient account gold');
    await rows('UPDATE accounts SET grams=grams-?,reserved=reserved-? WHERE userId=?',[s.grams,s.grams,s.userId],db);
    await rows("INSERT INTO ledger(id,userId,kind,referenceId,grams,amountPaise) VALUES(?,?,'SELL',?,?,?)",[id(),s.userId,s.id,(-BigInt(s.grams)).toString(),s.amountPaise],db);
   }
   await rows('UPDATE sales SET status=?,payoutReference=?,note=? WHERE id=?',[target,target==='PAID'?b.reference:null,b.note,ref],db);await audit(db,req.user.id,'SALE_'+target,ref);return {ok:true};});
 }
}
