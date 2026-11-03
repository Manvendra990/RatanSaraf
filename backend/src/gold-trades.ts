import { Body, Controller, Get, Param, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Auth, Admin } from './auth';
import { rows, tx } from './db';
import { GoldBuy, Decision } from './dto';
import { verified } from './routes';
import { directPurchaseAmount } from './gold-values';
const check=(ok:unknown,message:string)=>{if(!ok)throw new BadRequestException(message);};
@Controller('gold')
@UseGuards(Auth)
export class GoldController {
 @Post('purchases') async buy(@Req() req:any,@Body() body:GoldBuy){
  const reference=body.reference.trim();check(reference.length>=6,'Missing purchase request reference');
  return tx(async db=>{
   // Serialize retries by customer. Never trust a client-supplied amount or balance.
   await rows('SELECT id FROM users WHERE id=? FOR UPDATE',[req.user.id],db);
   const [previous]=await rows('SELECT * FROM gold_purchases WHERE reference=?',[reference],db);
   if(previous){check(previous.userId===req.user.id&&previous.rateId===body.rateId&&BigInt(previous.grams)===BigInt(body.grams)*1000000n,'Request reference already used for a different request');return previous;}
   await verified(req.user.id,db);
   const [quote]=await rows("SELECT *,TIMESTAMPDIFF(SECOND,createdAt,UTC_TIMESTAMP()) AS age FROM rates r WHERE id=? AND id=(SELECT p.rateId FROM rate_publications p WHERE p.metal=r.metal)",[body.rateId],db);
   check(quote&&Number(quote.age)>=0,'Store rate changed. Refresh the current rate and submit again.');
   let amount:bigint;try{amount=directPurchaseAmount(body.grams,BigInt(quote.buyPaise));}catch{throw new BadRequestException('Choose between 1 and 10000 whole grams with a valid store quote');}
   const id=randomUUID(),micrograms=(BigInt(body.grams)*1000000n).toString();
   await rows("INSERT INTO trade_references(kind,value,recordId) VALUES('PAYMENT',?,?)",[reference,id],db);
   await rows('INSERT INTO gold_purchases(id,userId,rateId,grams,amountPaise,reference) VALUES(?,?,?,?,?,?)',[id,req.user.id,quote.id,micrograms,amount.toString(),reference],db);
   await rows('INSERT INTO audit(id,actor,action,referenceId) VALUES(?,?,?,?)',[randomUUID(),req.user.id,'GOLD_BUY_REQUEST',id],db);
   return {id,grams:micrograms,amountPaise:amount.toString(),status:'PENDING',reference};
  });
 }
}
@Controller('admin')
@UseGuards(Auth,Admin)
export class GoldAdminController {
 @Get('purchases') async purchases(){
  const [direct,legacy]=await Promise.all([
   rows('SELECT g.*,r.metal,u.name,u.email,r.buyPaise,reviewer.name AS reviewedByName FROM gold_purchases g JOIN users u ON u.id=g.userId JOIN rates r ON r.id=g.rateId LEFT JOIN users reviewer ON reviewer.id=g.reviewedBy ORDER BY g.createdAt DESC'),
   rows('SELECT p.*,r.metal,u.name,u.email,r.buyPaise FROM payments p JOIN users u ON u.id=p.userId JOIN rates r ON r.id=p.rateId ORDER BY p.createdAt DESC'),
  ]);
  return [...direct.map(p=>({...p,requestType:'GRAMS'})),...legacy.map(p=>({...p,requestType:'LEGACY'}))].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
 }
 @Post('purchases/:id/decision') async decision(@Req() req:any,@Param('id') id:string,@Body() body:Decision){
  check(['APPROVE','REJECT'].includes(body.action),'Choose approve or reject');check(body.note.trim().length>=3,'Enter the verification/rejection reason');
  return tx(async db=>{
   const [purchase]=await rows('SELECT g.*,r.metal FROM gold_purchases g JOIN rates r ON r.id=g.rateId WHERE g.id=? FOR UPDATE',[id],db);check(purchase,'Purchase not found');
   const target=body.action==='APPROVE'?'APPROVED':'REJECTED';
   if(purchase.status===target)return {ok:true,status:target};check(purchase.status==='PENDING','Purchase already finalized');
   if(target==='APPROVED'){
    check(body.reference&&body.reference.trim().length>=3,'Enter the actual metal allocation reference after bank verification');
    await verified(purchase.userId,db);
    await rows("INSERT INTO trade_references(kind,value,recordId) VALUES('ALLOCATION',?,?)",[body.reference!.trim(),id],db);
    const [account]=await rows('SELECT userId FROM accounts WHERE userId=? FOR UPDATE',[purchase.userId],db);check(account,'Customer metal account not found');
    const column=purchase.metal==='Silver'?'silverGrams':'grams';
    await rows(`UPDATE accounts SET ${column}=${column}+? WHERE userId=?`,[purchase.grams,purchase.userId],db);
    await rows("INSERT INTO ledger(id,userId,kind,referenceId,grams,amountPaise,metal) VALUES(?,?,'BUY',?,?,?,?)",[randomUUID(),purchase.userId,id,purchase.grams,purchase.amountPaise,purchase.metal],db);
   }
   await rows('UPDATE gold_purchases SET status=?,allocationRef=?,note=?,reviewedAt=UTC_TIMESTAMP(),reviewedBy=? WHERE id=?',[target,target==='APPROVED'?body.reference!.trim():null,body.note.trim(),req.user.id,id],db);
   await rows('INSERT INTO audit(id,actor,action,referenceId) VALUES(?,?,?,?)',[randomUUID(),req.user.id,'GOLD_BUY_'+target,id],db);
   return {ok:true,status:target};
  });
 }
}
