/** Tests forward migration only on a brand-new dedicated *_test database. */
import 'dotenv/config';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import mysql from 'mysql2/promise';
import assert from 'node:assert/strict';
async function main(){
 const url=process.env.TEST_MIGRATION_DATABASE_URL;if(!url||!new URL(url).pathname.endsWith('_test'))throw new Error('Set TEST_MIGRATION_DATABASE_URL to a new dedicated *_test database');
 const db=await mysql.createConnection(url);const temp=mkdtempSync(resolve('.migration-check-'));
 try{
  const [tables]=await db.query('SHOW TABLES');assert.equal((tables as any[]).length,0,'Migration fixture database must be empty; no existing data is cleared');
  const migrations=join(temp,'migrations');mkdirSync(migrations);copyFileSync('prisma/migrations/migration_lock.toml',join(migrations,'migration_lock.toml'));
  for(const name of ['202610270001_initial','202610270002_manual_kyc','202610300001_home_catalogue']){mkdirSync(join(migrations,name));copyFileSync(join('prisma/migrations',name,'migration.sql'),join(migrations,name,'migration.sql'));}
  const config=join(temp,'prisma.config.ts');writeFileSync(config,`import {defineConfig} from 'prisma/config';export default defineConfig({schema:${JSON.stringify(resolve('prisma/schema.prisma'))},migrations:{path:${JSON.stringify(migrations)}}});`);
  const cli=require.resolve('prisma/build/index.js');
  function deploy(args:string[]){const result=spawnSync(process.execPath,[cli,'migrate','deploy',...args],{env:{...process.env,DATABASE_URL:url},encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr||result.stdout);}
  deploy(['--config',config]);
  const user=randomUUID(),plan=randomUUID(),subscription=randomUUID(),rate=randomUUID(),payment=randomUUID(),ledger=randomUUID();
  await db.execute("INSERT INTO users(id,name,email,phone,password) VALUES(?,'Migration Fixture','migration@test.invalid','9000000001','fixture-not-a-login')",[user]);
  await db.execute('INSERT INTO accounts(userId,grams,reserved) VALUES(?,2000000,0)',[user]);
  await db.execute("INSERT INTO plans(id,name,months,minPaise) VALUES(?,'Historical Monthly Plan',1,100000)",[plan]);
  await db.execute("INSERT INTO subscriptions(id,userId,planId,amountPaise,anchorAt,nextDue,paidCount) VALUES(?,?,?,2000000,UTC_TIMESTAMP(),UTC_TIMESTAMP(),1)",[subscription,user,plan]);
  await db.execute("INSERT INTO rates(id,metal,buyPaise,sellPaise,source) VALUES(?,'Gold',1000000,900000,'Migration fixture')",[rate]);
  await db.execute("INSERT INTO payments(id,userId,subscriptionId,reference,rateId,amountPaise,grams,status,allocationRef) VALUES(?,?,?,'LEGACY-BANK',?,2000000,2000000,'APPROVED','LEGACY-ALLOC')",[payment,user,subscription,rate]);
  await db.execute("INSERT INTO ledger(id,userId,kind,referenceId,grams,amountPaise) VALUES(?,?,'BUY',?,2000000,2000000)",[ledger,user,payment]);
  await db.execute("INSERT INTO banners(id,title,subtitle,image,buttonLabel,target,sortOrder,active) VALUES(?,'Archived banner','','','View','Sip',0,1)",[randomUUID()]);
  const category=randomUUID(),product=randomUUID(),sale=randomUUID();
  await db.execute("INSERT INTO categories(id,name,metal,active) VALUES(?,'Legacy rings','Gold',1)",[category]);
  await db.execute("INSERT INTO products(id,name,metal,categoryId,pricePaise,weight,purity,description) VALUES(?,'Legacy ring','Gold',?,10000,'1 g','22K','Prior catalogue record')",[product,category]);
  await db.execute("INSERT INTO sales(id,userId,rateId,grams,amountPaise,payoutDetails,status) VALUES(?,?,?,100000,90000,'Legacy bank details','REJECTED')",[sale,user,rate]);
  deploy([]);deploy([]); // Repeated deploy must be a no-op.
  const [account]=await db.execute<any[]>('SELECT grams,reserved,silverGrams,silverReserved FROM accounts WHERE userId=?',[user]);assert.equal(String(account[0].grams),'2000000');assert.equal(String(account[0].reserved),'0');assert.equal(String(account[0].silverGrams),'0');assert.equal(String(account[0].silverReserved),'0');
  const [metals]=await db.query<any[]>('SELECT metal FROM ledger');assert.equal(metals[0].metal,'Gold');
  for(const table of ['users','plans','subscriptions','payments','ledger','banners']){const [rows]=await db.query<any[]>('SELECT COUNT(*) AS n FROM '+table);assert.equal(Number(rows[0].n),1);}
  const [references]=await db.query<any[]>('SELECT * FROM trade_references ORDER BY kind');assert.equal(references.length,2);assert.equal(references[0].value,'LEGACY-ALLOC');assert.equal(references[1].value,'LEGACY-BANK');
  await assert.rejects(db.execute("INSERT INTO trade_references(kind,value,recordId) VALUES('PAYMENT','LEGACY-BANK',?)",[randomUUID()]));
  const [publication]=await db.query<any[]>('SELECT rateId FROM rate_publications');assert.equal(publication.length,1);assert.equal(publication[0].rateId,rate);
  const [buys]=await db.query<any[]>('SELECT COUNT(*) AS n FROM gold_purchases');assert.equal(Number(buys[0].n),0);
  const [oldProduct]=await db.query<any[]>('SELECT gender FROM products WHERE id=?',[product]);assert.equal(oldProduct[0].gender,null);
  const [oldSale]=await db.query<any[]>('SELECT bankName,accountEncrypted,payoutDetails FROM sales WHERE id=?',[sale]);assert.equal(oldSale[0].bankName,null);assert.equal(oldSale[0].accountEncrypted,null);assert.equal(oldSale[0].payoutDetails,'Legacy bank details');
  const [notifications]=await db.query<any[]>('SELECT COUNT(*) AS n FROM rate_notifications');assert.equal(Number(notifications[0].n),0);
  console.log('PASS: forward Prisma migrations on real MySQL preserve historical SIP/user/account/ledger/banner rows, protect prior references, and deploy twice safely.');
 }finally{await db.end();rmSync(temp,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
