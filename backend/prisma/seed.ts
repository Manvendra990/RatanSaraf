import 'dotenv/config';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { Metal, Prisma } from '@prisma/client';
import { prisma } from '../src/prisma.service';

async function seed() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
  if (!email) throw new Error('Set INITIAL_ADMIN_EMAIL');
  const existing = await prisma.user.findUnique({where:{email}});
  if (existing && existing.role !== 'ADMIN') throw new Error('Initial admin email belongs to a customer; choose a different email');
  if (!existing) {
    const password=process.env.INITIAL_ADMIN_PASSWORD;
    if(!password || password.length<12 || Buffer.byteLength(password,'utf8')>72 || /REPLACE|CHANGE/.test(password)) throw new Error('Set INITIAL_ADMIN_PASSWORD (12+ characters, max 72 UTF-8 bytes) for first setup');
    await prisma.user.create({data:{id:randomUUID(),name:'Store Admin',email,phone:'admin-'+randomUUID().slice(0,8),password:await bcrypt.hash(password,12),role:'ADMIN'}});
  }
  const store=JSON.parse(readFileSync('seed-store.json','utf8')) as Prisma.InputJsonValue;
  const products=JSON.parse(readFileSync('seed-products.json','utf8'));
  await prisma.$transaction(async db => {
    await db.setting.upsert({where:{id:1},update:{},create:{id:1,data:store}});
    for (const p of products) {
      const category=await db.category.upsert({where:{metal_name:{metal:p.metal as Metal,name:p.category}},update:{},create:{id:randomUUID(),metal:p.metal,name:p.category,active:true}});
      await db.product.upsert({where:{id:p.id},update:{},create:{id:p.id,name:p.name,metal:p.metal,categoryId:category.id,pricePaise:BigInt(Math.round(p.price*100)),weight:p.weight,purity:p.purity,image:p.image,description:p.description,coinWeight:p.coinWeight??null,stock:10,active:true}});
    }
    if (await db.plan.count()===0) {
      for (const [index,name,months] of [[1,'Monthly',1],[2,'Quarterly',3],[3,'Yearly',12]] as const) {
        const id=`00000000-0000-4000-8000-${String(index).padStart(12,'0')}`;
        await db.plan.upsert({where:{id},update:{},create:{id,name:name+' Gold SIP',months,minPaise:100000n,active:true}});
      }
    }
  },{maxWait:10000,timeout:60000});
  console.log('Admin and sample catalogue seeded through Prisma. Existing records were preserved. No KYC, trade rates or gold balances were seeded.');
}
seed().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
