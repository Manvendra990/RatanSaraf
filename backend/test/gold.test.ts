import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plainToInstance} from 'class-transformer';
import {validateSync} from 'class-validator';
import {GoldBuy} from '../src/dto';
import {directPurchaseAmount} from '../src/gold-values';
test('whole-gram buys use exact integer paisa at the accepted admin quote',()=>{
 assert.equal(directPurchaseAmount(3,1430051n),4290153n);
 assert.equal(directPurchaseAmount(10000,999999999999n),9999999999990000n);
 for(const weight of [0,-1,0.5,NaN,Infinity,10001])assert.throws(()=>directPurchaseAmount(weight,100000n));
 assert.throws(()=>directPurchaseAmount(1,0n));
});
test('purchase DTO rejects client amount/status injection and fractional or string grams',()=>{
 const base={rateId:'550e8400-e29b-41d4-a716-446655440000',grams:2,reference:'TEST-BANK-REF'};
 const options={whitelist:true,forbidNonWhitelisted:true};
 assert.equal(validateSync(plainToInstance(GoldBuy,base),options).length,0);
 for(const grams of [0,1.5,'2',10001])assert.ok(validateSync(plainToInstance(GoldBuy,{...base,grams}),options).some(e=>e.property==='grams'));
 const errors=validateSync(plainToInstance(GoldBuy,{...base,amountPaise:'1',status:'APPROVED'}),options);
 for(const field of ['amountPaise','status'])assert.ok(errors.some(e=>e.property===field));
});
