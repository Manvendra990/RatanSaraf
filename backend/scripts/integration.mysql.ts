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
  for(const s of readFileSync('schema.sql','utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.query(s);
  await run("INSERT INTO users(id,name,email,phone,password,role) VALUES(?,?,?,?,?,'ADMIN')",[admin,'Test Admin',`${suffix}@admin.test`,suffix.slice(0,15),await bcrypt.hash(password,4)]);
  child=spawn(process.execPath,['dist/main.js'],{env:{...process.env,DATABASE_URL:url,PORT:String(port),JWT_SECRET:randomBytes(32).toString('hex'),ADMIN_ORIGIN:origin,NODE_ENV:'test',PAYMENTS_ENABLED:'true',KYC_API_URL:'',KYC_API_KEY:'',KYC_WEBHOOK_SECRET:'',KYC_ENCRYPTION_KEY:randomBytes(32).toString('hex')},stdio:'ignore'});
  for(let i=0;i<80;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  async function request(path:string,body?:any,token?:string,cookie?:string){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:origin,...(token?{Authorization:`Bearer ${token}`} :{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
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
  const planId=randomUUID();await run('INSERT INTO plans(id,name,months,minPaise) VALUES(?,?,1,100000)',[planId,'TEST '+suffix]);
  const quote=await request('/admin/rates',{metal:'Gold',buy:'10000',sell:'9500',source:'INTEGRATION TEST'},undefined,cookie);assert.equal(quote.status,201);
  const sub=await request('/sip/subscriptions',{planId,amount:'1000'},token);assert.equal(sub.status,201);
  const payment=await request('/sip/payments',{subscriptionId:sub.data.id,rateId:quote.data.id,reference:suffix},token);assert.equal(payment.status,201);
  const decision={action:'APPROVE',reference:'ALLOC-'+suffix,note:'Test bank and allocation verified'};
  const twice=await Promise.all([request(`/admin/payments/${payment.data.id}/decision`,decision,undefined,cookie),request(`/admin/payments/${payment.data.id}/decision`,decision,undefined,cookie)]);assert.ok(twice.every(r=>r.status===201));
  let d=await request('/sip/dashboard',undefined,token);assert.equal(d.data.balance,'0.100000');assert.equal(d.data.ledger.length,1);
  // Simultaneous sells cannot reserve the same gold twice.
  const sales=await Promise.all([request('/sip/sales',{rateId:quote.data.id,grams:'0.075',payoutDetails:'TEST ONLY'},token),request('/sip/sales',{rateId:quote.data.id,grams:'0.075',payoutDetails:'TEST ONLY'},token)]);assert.deepEqual(sales.map(r=>r.status).sort(),[201,400]);
  const sale=sales.find(r=>r.status===201)!.data;
  assert.equal((await request(`/admin/sales/${sale.id}/decision`,{action:'APPROVE',note:'Test approval'},undefined,cookie)).status,201);
  const paid={action:'PAID',reference:'PAYOUT-'+suffix,note:'Test payout confirmed'};await Promise.all([request(`/admin/sales/${sale.id}/decision`,paid,undefined,cookie),request(`/admin/sales/${sale.id}/decision`,paid,undefined,cookie)]);
  d=await request('/sip/dashboard',undefined,token);assert.equal(d.data.balance,'0.025000');assert.equal(d.data.reserved,'0.000000');assert.equal(d.data.ledger.length,2);
  assert.equal((await request('/admin/users',undefined,token)).status,403);
  console.log('PASS: real MySQL auth, disabled KYC, manual payment, concurrent approval idempotency, oversell prevention, reserved gold, payout idempotency and role enforcement.');
  console.log('Test records intentionally retained in the isolated test database for inspection.');
 }finally{child?.kill();await db.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
