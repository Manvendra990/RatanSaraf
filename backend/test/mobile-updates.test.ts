import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plainToInstance} from 'class-transformer';
import {validateSync} from 'class-validator';
import {Sale,ProductDto} from '../src/dto';
const options={whitelist:true,forbidNonWhitelisted:true};
test('structured payout preserves leading zeroes and rejects missing or malformed bank fields',()=>{
 const bank={rateId:'550e8400-e29b-41d4-a716-446655440000',grams:'2',bankName:'Fixture Bank',accountHolderName:'Fixture Customer',accountNumber:'001234567890',confirmAccountNumber:'001234567890',ifsc:'SBIN0001234'};
 assert.equal(validateSync(plainToInstance(Sale,bank),options).length,0);
 for(const patch of [{accountNumber:1234567890},{ifsc:'sbin0001234'},{accountNumber:'123'},{bankName:undefined},{accountHolderName:undefined},{confirmAccountNumber:undefined},{userId:'forged'}])assert.ok(validateSync(plainToInstance(Sale,{...bank,...patch}),options).length>0);
});
test('gender vocabulary accepts only Men Women Unisex Children and remains optional for old clients',()=>{
 const base={name:'Fixture Ring',metal:'Gold',categoryId:'550e8400-e29b-41d4-a716-446655440000',price:'100',weight:'1 g',purity:'22K',image:'',description:'',stock:1,active:true};
 for(const gender of [undefined,'Men','Women','Unisex','Children'])assert.equal(validateSync(plainToInstance(ProductDto,{...base,gender}),options).length,0);
 for(const gender of ['Both','Child','anything',123])assert.ok(validateSync(plainToInstance(ProductDto,{...base,gender}),options).some(e=>e.property==='gender'));
});
