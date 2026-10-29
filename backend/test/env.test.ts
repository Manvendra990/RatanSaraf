import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('configuration check catches missing database/JWT before connecting',()=>{
 const result=spawnSync(process.execPath,['scripts/check-env.cjs'],{encoding:'utf8',env:{...process.env,DATABASE_URL:'',JWT_SECRET:'',ADMIN_ORIGIN:''}});
 assert.equal(result.status,1);assert.match(result.stderr,/DATABASE_URL/);assert.match(result.stderr,/JWT_SECRET/);
});
test('configuration check accepts environment credentials and never prints them',()=>{
 const secret='a'.repeat(64),password='test-private-password';
 const result=spawnSync(process.execPath,['scripts/check-env.cjs'],{encoding:'utf8',env:{...process.env,DATABASE_URL:`mysql://testuser:${password}@127.0.0.1:3306/example`,JWT_SECRET:secret,ADMIN_ORIGIN:'http://localhost:5173'}});
 assert.equal(result.status,0);assert.ok(!result.stdout.includes(secret));assert.ok(!result.stdout.includes(password));
});
