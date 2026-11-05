/** Run against a dedicated *_test database only. Never against customer data. */
import 'dotenv/config';
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
async function main(){
 const url=process.env.TEST_DATABASE_URL;if(!url||!new URL(url).pathname.endsWith('_test'))throw new Error('Set TEST_DATABASE_URL to a dedicated empty database ending in _test');
 const db=await mysql.createConnection(url),run=async(sql:string,args:any[]=[])=>{const [r]=await db.execute(sql,args);return r as any[];};
 const port=3019,base=`http://127.0.0.1:${port}/api`,origin='http://localhost:5173',suffix=randomUUID(),admin=randomUUID(),customer=randomUUID(),password=randomBytes(24).toString('hex');let child:ReturnType<typeof spawn>|undefined;
 try{
  const [existingTables]=await db.query('SHOW TABLES');assert.equal((existingTables as any[]).length,0,'Use an empty isolated test database; existing data is never cleared');
  for(const s of readFileSync('schema.sql','utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.query(s);
  await run("INSERT INTO users(id,name,email,phone,password,role) VALUES(?,?,?,?,?,'ADMIN')",[admin,'Test Admin',`${suffix}@admin.test`,suffix.slice(0,15),await bcrypt.hash(password,4)]);
  child=spawn(process.execPath,['dist/main.js'],{env:{...process.env,DATABASE_URL:url,PORT:String(port),JWT_SECRET:randomBytes(32).toString('hex'),ADMIN_ORIGIN:origin,NODE_ENV:'test',PAYMENTS_ENABLED:'false',KYC_API_URL:'',KYC_API_KEY:'',KYC_WEBHOOK_SECRET:'',KYC_ENCRYPTION_KEY:randomBytes(32).toString('hex')},stdio:'ignore'});
  for(let i=0;i<80;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  async function request(path:string,body?:any,token?:string,cookie?:string,method?:string){const r=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',Origin:origin,...(token?{Authorization:`Bearer ${token}`} :{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
  const bank={bankName:'TEST BANK',accountHolderName:'Test Customer',accountNumber:'001234567890',confirmAccountNumber:'001234567890',ifsc:'SBIN0001234'};
  const a=await request('/auth/admin-login',{login:`${suffix}@admin.test`,password});assert.equal(a.status,201);const cookie=a.cookie!;
  const u=await request('/auth/register',{name:'Gold Test Customer',login:`${suffix}@user.test`,email:`${suffix}@user.test`,phone:'9'+Date.now().toString().slice(-9),password});assert.equal(u.status,201);const token=u.data.token;const userId=u.data.user.id;
  // Real-provider KYC remains unavailable. Use the manual submission/review endpoints with test data.
  assert.equal((await request('/kyc/start',{consent:true},token)).status,503);
  const form=new FormData();
  const profile={name:'Gold Test Customer',country:'India',phone:u.data.user.phone,address:'Test fixture address',city:'Gwalior',pincode:'474001',state:'Madhya Pradesh',dob:'2000-01-01',pan:'ABCDE1234F',consent:'true'};
  for(const [key,value] of Object.entries(profile))form.append(key,value);
  form.append('document',new Blob(['%PDF-1.4\nTEST DOCUMENT ONLY'],{type:'application/pdf'}),'fixture.pdf');
  const submission=await fetch(base+'/manual-kyc/submit',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:form});assert.equal(submission.status,201);const manual=await submission.json() as any;
  const second=await request('/auth/register',{name:'Second Test Customer',login:`${suffix}@other.test`,email:`${suffix}@other.test`,phone:'8'+Date.now().toString().slice(-9),password});
  assert.equal((await fetch(base+`/manual-kyc/${manual.id}/document`,{headers:{Authorization:`Bearer ${second.data.token}`}})).status,403);
  const privateDocument=await fetch(base+`/manual-kyc/${manual.id}/document`,{headers:{Cookie:cookie}});assert.equal(privateDocument.status,200);assert.match(await privateDocument.text(),/TEST DOCUMENT ONLY/);
  const detail=await request('/manual-kyc/admin/'+manual.id,undefined,undefined,cookie);assert.equal(detail.data.profile.pan,profile.pan);
  assert.equal((await request('/manual-kyc/admin/'+manual.id+'/decision',{action:'APPROVE',version:manual.version,note:'Test manual review completed'},undefined,cookie)).status,201);
  assert.equal((await request('/sip/subscriptions',{planId:randomUUID(),amount:'1000'},token)).status,410);
  assert.equal((await request('/sip/payments',{},token)).status,410);
  const quote=await request('/admin/rates',{metal:'Gold',buy:'10000.51',sell:'9500',source:'INTEGRATION TEST'},undefined,cookie);assert.equal(quote.status,201);
  // Whole grams, exact server amount, pending balance, role protection and retry idempotency.
  const buyBody={rateId:quote.data.id,grams:2,reference:'BUY-'+suffix};
  assert.equal((await request('/gold/purchases',{...buyBody,amountPaise:'1'},token)).status,400);
  const payment=await request('/gold/purchases',buyBody,token);assert.equal(payment.status,201);assert.equal(payment.data.grams,'2000000');assert.equal(payment.data.amountPaise,'2000102');
  const retry=await request('/gold/purchases',buyBody,token);assert.equal(retry.data.id,payment.data.id);
  assert.equal((await request('/gold/purchases',{...buyBody,grams:3},token)).status,400);
  assert.equal((await request('/gold/purchases',buyBody,second.data.token)).status,400);
  assert.equal((await request('/admin/purchases/'+payment.data.id+'/decision',{action:'APPROVE',reference:'FORGED-ALLOC',note:'Invalid role'},token)).status,403);
  let d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.balance,'0.000000');assert.equal(d.data.purchases.length,1);
  const newer=await request('/admin/rates',{metal:'Gold',buy:'12000',sell:'11000',source:'NEW TEST QUOTE'},undefined,cookie);assert.equal(newer.status,201);
  assert.equal((await request('/gold/dashboard',undefined,token)).data.purchases[0].amountPaise,'2000102');
  // Duplicate bank allocation references must roll the entire approval back.
  const decision={action:'APPROVE',reference:'ALLOC-'+suffix,note:'Test bank and allocation verified'};
  const twice=await Promise.all([request(`/admin/purchases/${payment.data.id}/decision`,decision,undefined,cookie),request(`/admin/purchases/${payment.data.id}/decision`,decision,undefined,cookie)]);assert.ok(twice.every(r=>r.status===201));
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.balance,'2.000000');assert.equal(d.data.ledger.length,1);
  const another=await request('/gold/purchases',{rateId:newer.data.id,grams:1,reference:'OTHER-'+suffix},token);assert.equal(another.status,201);
  assert.equal((await request(`/admin/purchases/${another.data.id}/decision`,decision,undefined,cookie)).status,409);
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.balance,'2.000000');assert.equal(d.data.purchases.find((p:any)=>p.id===another.data.id).status,'PENDING');
  const rejected={action:'REJECT',note:'Test rejected payment'};
  assert.equal((await request(`/admin/purchases/${another.data.id}/decision`,rejected,undefined,cookie)).status,201);
  assert.equal((await request(`/admin/purchases/${another.data.id}/decision`,decision,undefined,cookie)).status,400);
  // Simultaneous sells cannot reserve the same available gold twice.
  const sales=await Promise.all([request('/gold/sales',{rateId:newer.data.id,grams:'1.5',...bank},token),request('/gold/sales',{rateId:newer.data.id,grams:'1.5',...bank},token)]);assert.deepEqual(sales.map(r=>r.status).sort(),[201,400]);
  const sale=sales.find(r=>r.status===201)!.data;
  const beforeInvalid=(await request('/gold/dashboard',undefined,token)).data.reserved;
  for(const invalid of [{...bank,confirmAccountNumber:'001234567899'},{...bank,ifsc:'INVALID'},{...bank,accountNumber:'123',confirmAccountNumber:'123'}])assert.equal((await request('/gold/sales',{rateId:newer.data.id,grams:'0.1',...invalid},token)).status,400);
  assert.equal((await request('/gold/dashboard',undefined,token)).data.reserved,beforeInvalid);
  const userSales=(await request('/gold/dashboard',undefined,token)).data.sales;const ownSale=userSales.find((x:any)=>x.id===sale.id);
  assert.equal(ownSale.bankName,'TEST BANK');assert.equal(ownSale.accountLast4,'7890');assert.ok(!JSON.stringify(userSales).includes(bank.accountNumber));assert.equal(ownSale.accountEncrypted,undefined);
  const adminSales=(await request('/admin/sales',undefined,undefined,cookie)).data;assert.ok(!JSON.stringify(adminSales).includes(bank.accountNumber));assert.ok(adminSales.every((x:any)=>!x.accountEncrypted));
  assert.equal((await request(`/admin/sales/${sale.id}/bank`,undefined,token)).status,403);
  const bankView=await request(`/admin/sales/${sale.id}/bank`,undefined,undefined,cookie);assert.equal(bankView.status,200);assert.equal(bankView.data.accountNumber,bank.accountNumber);assert.equal(bankView.data.ifsc,bank.ifsc);assert.equal(bankView.data.confirmAccountNumber,undefined);
  const [storedBank]=await run('SELECT accountEncrypted FROM sales WHERE id=?',[sale.id]);assert.ok(storedBank.accountEncrypted&&!storedBank.accountEncrypted.includes(bank.accountNumber));
  const [bankAudit]=await run("SELECT COUNT(*) AS n FROM audit WHERE action='SALE_BANK_VIEW' AND referenceId=?",[sale.id]);assert.equal(Number(bankAudit.n),1);

  assert.equal((await request(`/admin/sales/${sale.id}/decision`,{action:'APPROVE',note:'Test approval'},undefined,cookie)).status,201);
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.balance,'2.000000');assert.equal(d.data.reserved,'1.500000');
  const paid={action:'PAID',reference:'PAYOUT-'+suffix,note:'Test payout confirmed'};await Promise.all([request(`/admin/sales/${sale.id}/decision`,paid,undefined,cookie),request(`/admin/sales/${sale.id}/decision`,paid,undefined,cookie)]);
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.balance,'0.500000');assert.equal(d.data.reserved,'0.000000');assert.equal(d.data.ledger.length,2);
  const toReject=await request('/gold/sales',{rateId:newer.data.id,grams:'0.25',...bank},token);assert.equal(toReject.status,201);
  assert.equal((await request(`/admin/sales/${toReject.data.id}/decision`,{action:'REJECT',note:'Test rejected sale'},undefined,cookie)).status,201);
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.balance,'0.500000');assert.equal(d.data.reserved,'0.000000');
  const inbox=await request('/admin/purchases',undefined,undefined,cookie);assert.equal(inbox.data.filter((p:any)=>p.userId===userId).length,2);
  const staleId=randomUUID();await run("INSERT INTO rates(id,metal,buyPaise,sellPaise,source,createdAt) VALUES(?,'Gold',1000000,900000,'STALE TEST',UTC_TIMESTAMP()-INTERVAL 1 HOUR)",[staleId]);
  assert.equal((await request('/gold/purchases',{rateId:staleId,grams:1,reference:'STALE-'+suffix},token)).status,400);
  assert.equal((await request('/gold/purchases',{rateId:newer.data.id,grams:1,reference:'NO-KYC-'+suffix},second.data.token)).status,403);
  // Existing monthly-plan records remain reviewable, but cannot reuse a new trade's allocation.
  const legacyPlan=randomUUID(),legacySub=randomUUID(),legacyPay=randomUUID(),legacyBank='LEGACY-'+suffix;
  await run("INSERT INTO plans(id,name,months,minPaise) VALUES(?,'Historical plan',1,100000)",[legacyPlan]);
  await run('INSERT INTO subscriptions(id,userId,planId,amountPaise,anchorAt,nextDue) VALUES(?,?,?,250000,UTC_TIMESTAMP(),UTC_TIMESTAMP())',[legacySub,userId,legacyPlan]);
  await run('INSERT INTO payments(id,userId,subscriptionId,rateId,reference,amountPaise,grams) VALUES(?,?,?,?,?,250000,250000)',[legacyPay,userId,legacySub,quote.data.id,legacyBank]);
  await run("INSERT INTO trade_references(kind,value,recordId) VALUES('PAYMENT',?,?)",[legacyBank,legacyPay]);
  assert.equal((await request('/gold/purchases',{rateId:newer.data.id,grams:1,reference:legacyBank},token)).status,409);
  assert.equal((await request(`/admin/payments/${legacyPay}/decision`,decision,undefined,cookie)).status,409);
  assert.equal((await request(`/admin/payments/${legacyPay}/decision`,{action:'APPROVE',reference:'LEGACY-ALLOC-'+suffix,note:'Historical bank and allocation verified'},undefined,cookie)).status,201);
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.balance,'0.750000');assert.equal(d.data.ledger.length,3);assert.equal(d.data.payments.length,1);
  const [legacyCount]=await run('SELECT paidCount FROM subscriptions WHERE id=?',[legacySub]);assert.equal(Number(legacyCount.paidCount),1);
  assert.equal((await request('/admin/users',undefined,token)).status,403);
  // Current rate is shared by Home and trading; separate legacy sell input cannot change payout.
  const published=await request('/gold/rates',undefined,token);assert.equal(published.status,200);
  const latestGold=published.data.find((r:any)=>r.metal==='Gold');assert.equal(latestGold.id,newer.data.id);assert.equal(latestGold.buyPaise,latestGold.sellPaise);assert.equal(latestGold.pricingPolicy,'SINGLE_STORE_RATE');
  const home=await request('/home');assert.equal(home.data.rates.find((r:any)=>r.metal==='Gold').pricePaise,latestGold.buyPaise);
  const saleRows=(await request('/gold/dashboard',undefined,token)).data.sales;assert.ok(saleRows.some((r:any)=>r.id===sale.id&&r.metal==='Gold'&&r.status==='PAID'));
  // Both metals use manual requests even with online payments disabled.
  const goldBefore=(await request('/gold/dashboard',undefined,token)).data.balance;
  const silverQuote=await request('/admin/rates',{metal:'Silver',buy:'200',sell:'180',source:'SILVER DAILY TEST'},undefined,cookie);
  const silverBuy=await request('/gold/purchases',{rateId:silverQuote.data.id,grams:5,reference:'SILVER-'+suffix},token);assert.equal(silverBuy.status,201);assert.equal(silverBuy.data.amountPaise,'100000');
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.holdings.Silver.balance,'0.000000');
  const silverApproval={action:'APPROVE',reference:'SILVER-ALLOC-'+suffix,note:'Verified silver allocation'};
  const approvals=await Promise.all([request(`/admin/purchases/${silverBuy.data.id}/decision`,silverApproval,undefined,cookie),request(`/admin/purchases/${silverBuy.data.id}/decision`,silverApproval,undefined,cookie)]);assert.ok(approvals.every(r=>r.status===201));
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.holdings.Silver.balance,'5.000000');assert.equal(d.data.balance,goldBefore);
  const silverNew=await request('/admin/rates',{metal:'Silver',buy:'220',sell:'210',source:'UPDATED SILVER DAILY TEST'},undefined,cookie);
  assert.equal((await request('/gold/sales',{rateId:silverQuote.data.id,grams:'2',...bank},token)).status,400);
  const silverSale=await request('/gold/sales',{rateId:silverNew.data.id,grams:'2',...bank},token);assert.equal(silverSale.status,201);assert.equal(silverSale.data.amount,'440.00');
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.holdings.Silver.available,'3.000000');assert.equal(d.data.holdings.Silver.reserved,'2.000000');assert.equal(d.data.balance,goldBefore);
  await request(`/admin/sales/${silverSale.data.id}/decision`,{action:'APPROVE',note:'Silver sale verified'},undefined,cookie);
  const silverPaid={action:'PAID',note:'Silver payout completed',reference:'SILVER-PAYOUT-'+suffix};
  await Promise.all([request(`/admin/sales/${silverSale.data.id}/decision`,silverPaid,undefined,cookie),request(`/admin/sales/${silverSale.data.id}/decision`,silverPaid,undefined,cookie)]);
  d=await request('/gold/dashboard',undefined,token);assert.equal(d.data.holdings.Silver.balance,'3.000000');assert.equal(d.data.holdings.Silver.reserved,'0.000000');assert.equal(d.data.balance,goldBefore);assert.equal(d.data.ledger.filter((l:any)=>l.metal==='Silver').length,2);
  const silverOverview=await request('/admin/overview?metal=Silver',undefined,undefined,cookie);assert.equal(silverOverview.status,200);assert.equal(silverOverview.data.totalGrams,'3.000000');assert.equal(silverOverview.data.currentValue,'660.00');
  // Multiple publications in the same timestamp use a transactional current pointer, not UUID sorting.
  const older=await request('/admin/rates',{metal:'Silver',buy:'221',source:'FIRST QUICK PUBLISH'},undefined,cookie);
  const newest=await request('/admin/rates',{metal:'Silver',buy:'222',source:'SECOND QUICK PUBLISH'},undefined,cookie);
  await run('UPDATE rates SET createdAt=? WHERE id IN (?,?)',['2026-11-02 10:00:00',older.data.id,newest.data.id]);
  const current=(await request('/gold/rates')).data.find((r:any)=>r.metal==='Silver');assert.equal(current.id,newest.data.id);assert.equal(current.sellPaise,'22200');
  const afterHome=await request('/home');assert.equal(afterHome.data.rates.find((r:any)=>r.metal==='Silver').pricePaise,'22200');
  assert.equal((await request('/admin/displayrates',{},undefined,cookie)).status,410);
  const retained=(await request('/gold/dashboard',undefined,token)).data.sales.find((r:any)=>r.id===silverSale.data.id);assert.equal(retained.amountPaise,'44000');
  const noCache=await fetch(base+'/gold/rates');assert.equal(noCache.headers.get('cache-control'),'no-store');
  assert.equal((await request('/gold/purchases',{rateId:older.data.id,grams:1,reference:'SUPERSEDED-'+suffix},token)).status,400);

  // Gender survives create/update/catalogue; legacy unclassified products stay visible.
  const category=await request('/admin/categories',{name:'Rings',metal:'Gold',active:true},undefined,cookie);assert.equal(category.status,201);
  const productBase={name:'Gender Fixture Ring',metal:'Gold',categoryId:category.data.id,price:'100',weight:'1 g',purity:'22K',image:'',description:'Fixture',stock:1,active:true,featured:false};
  const women=await request('/admin/products',{...productBase,gender:'Women'},undefined,cookie);assert.equal(women.status,201);
  const children=await request('/admin/products',{...productBase,name:'Child Fixture Ring',gender:'Children'},undefined,cookie);assert.equal(children.status,201);
  const legacyProduct=await request('/admin/products',{...productBase,name:'Unclassified fixture'},undefined,cookie);assert.equal(legacyProduct.status,201);
  assert.equal((await request('/admin/products',{...productBase,gender:'BAD'},undefined,cookie)).status,400);
  const catalog=(await request('/catalog')).data.products;assert.equal(catalog.find((p:any)=>p.id===women.data.id).gender,'Women');assert.equal(catalog.find((p:any)=>p.id===children.data.id).gender,'Children');assert.equal(catalog.find((p:any)=>p.id===legacyProduct.data.id).gender,null);
  assert.equal(catalog.find((p:any)=>p.id===women.data.id).price,undefined);
  const settings={name:'Fixture Store',ownerName:'Fixture Owner',tagline:'Fixture',descriptor:'JEWELLERS',addressLine1:'Fixture street',city:'Gwalior',state:'Madhya Pradesh',pincode:'474001',mapQuery:'Gwalior',latitude:26,longitude:78,phone:'919685057574',whatsapp:'919685057574',facebook:'https://www.facebook.com/fixture',instagram:'https://www.instagram.com/fixture',youtube:'https://www.youtube.com/@fixture',googleMaps:'https://maps.google.com/?q=Gwalior'};
  assert.equal((await request('/admin/settings',settings,undefined,cookie,'PUT')).status,200);
  assert.equal((await request('/store')).data.instagram,settings.instagram);
  assert.equal((await request('/admin/settings',{...settings,instagram:'javascript:alert(1)'},undefined,cookie,'PUT')).status,400);
  // One durable notification per actual price change; per-user read state and pagination.
  assert.equal((await request('/notifications')).status,401);
  const notes=await request('/notifications',undefined,token);assert.equal(notes.status,200);assert.ok(notes.data.items.length>=4);assert.ok(notes.data.items.every((n:any)=>n.createdAt&&n.amountPaise&&n.metal));
  const event=notes.data.items[0];assert.equal((await request(`/notifications/${event.id}/read`,{},token)).status,201);
  const readNotes=(await request('/notifications',undefined,token)).data;assert.equal(readNotes.items.find((n:any)=>n.id===event.id).isRead,true);assert.equal(readNotes.unreadCount,notes.data.unreadCount-1);
  assert.equal((await request('/notifications',undefined,second.data.token)).data.items.find((n:any)=>n.id===event.id).isRead,false);
  assert.equal((await request('/notifications?before=not-a-cursor',undefined,token)).status,400);
  assert.equal((await request('/notifications?before='+event.id,undefined,token)).data.items.some((n:any)=>n.id===event.id),false);
  const countBefore=(await request('/notifications',undefined,token)).data.items.length;
  await request('/admin/rates',{metal:'Silver',buy:'222',source:'SAME PRICE TEST'},undefined,cookie);
  assert.equal((await request('/notifications',undefined,token)).data.items.length,countBefore);
  await request('/notifications/read-all',{},token);assert.equal((await request('/notifications',undefined,token)).data.unreadCount,0);assert.ok((await request('/notifications',undefined,second.data.token)).data.unreadCount>0);
  const failed=await request('/admin/rates',{metal:'Gold',buy:'0',source:'INVALID RATE'},undefined,cookie);assert.equal(failed.status,400);assert.equal((await request('/notifications',undefined,token)).data.items.length,countBefore);
  console.log('PASS: bank field validation, encrypted storage, masked customer/list response, audited admin bank view, gender create/catalogue and durable price notifications with isolated read state.');
  console.log('PASS: shared Home/trading current rate, single-price payouts, same-timestamp publication order, uncached rates and complete Gold sell history.');
  console.log('PASS: payments-disabled manual requests, Silver 5g buy / 2g sell / 3g remaining, current daily rate, isolated Gold balance, duplicate approval/payout and filtered admin valuation.');
  console.log('PASS: real MySQL KYC, whole-gram buys, exact amount and quote snapshot, retry idempotency, duplicate allocation rollback, rejection, concurrent approvals/oversell, sale approval/reservation/payout/rejection, stale quote, role guards and retired plan endpoints.');
  console.log('Test records intentionally retained in the isolated test database for inspection.');
 }finally{child?.kill();await db.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
