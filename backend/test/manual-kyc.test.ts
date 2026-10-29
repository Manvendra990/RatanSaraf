import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'crypto';
import {seal,unseal,documentType} from '../src/kyc-crypto';
import {plainToInstance} from 'class-transformer';
import {validateSync} from 'class-validator';
import {ManualKyc} from '../src/dto';
test('manual KYC encrypts documents, detects tampering and fails closed without key',()=>{
 const previous=process.env.KYC_ENCRYPTION_KEY;process.env.KYC_ENCRYPTION_KEY=randomBytes(32).toString('hex');
 try{const data=Buffer.from('Private identity document test fixture');const encrypted=seal(data);assert.ok(!encrypted.includes(data));assert.deepEqual(unseal(encrypted),data);assert.notDeepEqual(seal(data),encrypted);encrypted[encrypted.length-1]^=1;assert.throws(()=>unseal(encrypted));delete process.env.KYC_ENCRYPTION_KEY;assert.throws(()=>seal(data),/not configured/);}finally{if(previous)process.env.KYC_ENCRYPTION_KEY=previous;else delete process.env.KYC_ENCRYPTION_KEY;}
});
test('manual documents are limited to supported signatures',()=>{assert.equal(documentType(Buffer.from('%PDF-1.4\nfixture')),'application/pdf');assert.equal(documentType(Buffer.from('<script>alert(1)</script>')),null);assert.equal(documentType(Buffer.from([255,216,255,0])),'image/jpeg');});
test('customer cannot inject manual approval, skip consent or omit PAN',()=>{
 const invalid=plainToInstance(ManualKyc,{name:'Test User',country:'India',phone:'9999999999',address:'Example address',city:'Gwalior',pincode:'474001',state:'Madhya Pradesh',dob:'2000-01-01',pan:'INVALID',consent:'false',status:'APPROVED'});
 const errors=validateSync(invalid,{whitelist:true,forbidNonWhitelisted:true});assert.ok(errors.some(x=>x.property==='pan'));assert.ok(errors.some(x=>x.property==='consent'));assert.ok(errors.some(x=>x.property==='status'));
});
