import 'reflect-metadata';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plainToInstance} from 'class-transformer';
import {validateSync} from 'class-validator';
import {DisplayRateDto} from '../src/dto';
import {prisma} from '../src/prisma.service';
import {ApiController} from '../src/routes';
test('catalogue removes jewellery prices but retains coin prices and specifications',async()=>{
 const previousProducts=prisma.product.findMany,previousCategories=prisma.category.findMany;
 try{
  (prisma.product as any).findMany=async()=>[
   {id:'internal-jewellery',name:'Ring',metal:'Gold',category:{name:'Rings'},pricePaise:123456n,coinWeight:null,productCode:'GLR-20',weight:'3 g',purity:'916'},
   {id:'internal-coin',name:'Coin',metal:'Gold',category:{name:'Coins'},pricePaise:100000n,coinWeight:1},
  ];
  (prisma.category as any).findMany=async()=>[];
  const result=await new ApiController().catalog();
  assert.equal(result.products[0].price,undefined);assert.equal(result.products[0].pricePaise,undefined);
  assert.equal(result.products[0].productCode,'GLR-20');assert.equal(result.products[0].purity,'916');
  assert.equal(result.products[1].price,1000);
 }finally{(prisma.product as any).findMany=previousProducts;(prisma.category as any).findMany=previousCategories;}
});
test('display rate input rejects invalid purity and hidden approval fields',()=>{
 const options={whitelist:true,forbidNonWhitelisted:true};
 const errors=validateSync(plainToInstance(DisplayRateDto,{metal:'Gold',purity:'made-up',price:'10',taxBasis:'unknown',source:'Store',active:true,approved:true}),options);
 for(const field of ['purity','taxBasis','approved'])assert.ok(errors.some(e=>e.property===field));
});
