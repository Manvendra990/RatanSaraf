import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { boundSql, normalize } from '../src/db';

test('Prisma values remain bound parameters, including SQL injection strings', () => {
  const attack="' OR 1=1; DROP TABLE users; --";
  const query=boundSql('SELECT * FROM users WHERE email=? AND active=?',[attack,true]);
  assert.equal(query.sql,'SELECT * FROM users WHERE email=? AND active=?');
  assert.deepEqual(query.values,[attack,true]);
  assert.throws(()=>boundSql('SELECT ?',[1,2]),/parameter count/);
});
test('Prisma bigint, decimal, date and JSON keep the mobile/admin response contract',()=>{
  const date=new Date('2026-01-01T00:00:00Z');
  const value=normalize({grams:1000001n,price:new Prisma.Decimal('1234.50'),date,cart:[{id:'RG-001',qty:2}],nested:{amount:9007199254740993n},active:true});
  assert.equal(value.grams,'1000001');assert.equal(value.price,'1234.5');assert.equal(value.date,date);
  assert.equal(value.nested.amount,'9007199254740993');assert.deepEqual(value.cart,[{id:'RG-001',qty:2}]);
  assert.equal(value.active,true);assert.doesNotThrow(()=>JSON.stringify(value));
});
