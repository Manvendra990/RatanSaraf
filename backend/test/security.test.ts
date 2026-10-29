import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
test('HTTP guards reject admin access and unsigned identity callbacks',async()=>{
 const port=19000+Math.floor(Math.random()*10000),base=`http://127.0.0.1:${port}/api`;
 const child=spawn(process.execPath,['dist/main.js'],{env:{...process.env,PORT:String(port),JWT_SECRET:randomBytes(32).toString('hex'),DATABASE_URL:'mysql://test:test@127.0.0.1:3306/unused_test',ADMIN_ORIGIN:'http://localhost:5173',NODE_ENV:'test'},stdio:'ignore'});
 try {
  let ready=false;for(let i=0;i<60;i++){try{const r=await fetch(base+'/health');ready=r.ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'Server must start');
  assert.equal((await fetch(base+'/admin/overview')).status,401);
  assert.equal((await fetch(base+'/manual-kyc/admin')).status,401);
  assert.equal((await fetch(base+'/manual-kyc/550e8400-e29b-41d4-a716-446655440000/document')).status,401);
  assert.equal((await fetch(base+'/admin/rates',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal((await fetch(base+'/kyc/webhook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference:'550e8400-e29b-41d4-a716-446655440000',providerRef:'forged',status:'VERIFIED'})})).status,401);
  assert.equal((await fetch(base+'/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Test',login:'test@example.com',email:'test@example.com',phone:'9999999999',password:'password123',role:'ADMIN'})})).status,400);
 }finally{child.kill();}
});
