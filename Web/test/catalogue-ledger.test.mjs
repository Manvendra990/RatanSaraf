import test from 'node:test';
import assert from 'node:assert/strict';
import { coinProduct, ledgerTotals, fixedUnits } from '../src/admin/catalogue-ledger.mjs';
test('coins and jewellery stay separate',()=>{assert(coinProduct({category:'Coins'}));assert(coinProduct({coinWeight:'0.5'}));assert(!coinProduct({category:'Rings',coinWeight:null}));});
test('posted sale uses negative grams and amounts remain separate',()=>{const t=ledgerTotals([{kind:'BUY',grams:'5000000',amountPaise:'500000'},{kind:'SELL',grams:'-2000000',amountPaise:'240000'}]);assert.equal(t.net,3000000n);assert.equal(t.bought,5000000n);assert.equal(t.sold,2000000n);assert.equal(t.buyAmount,500000n);assert.equal(t.sellAmount,240000n);assert.equal(ledgerTotals([]).net,0n);});
test('totals retain precision above JS safe integer',()=>{assert.equal(fixedUnits(900719925474099312n,2),'9,00,71,99,25,47,40,993.12');assert.equal(fixedUnits(-1n,6),'-0.000001');});
