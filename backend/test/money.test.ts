import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUnits, buyGrams, sellPaise, nextDue, display } from '../src/money';
test('money parsing rejects precision loss, signs, exponent and zero',()=>{assert.equal(parseUnits('1000.50',2),100050n);for(const n of ['0','-1','1e3','NaN','1.001'])assert.throws(()=>parseUnits(n,2));});
test('gold credit floors at microgram precision; sell never creates money',()=>{const p=parseUnits('1000',2),rate=parseUnits('7250',2);const g=buyGrams(p,rate);assert.equal(g,137931n);assert.ok(sellPaise(g,rate)<=p);assert.equal(display(g,6),'0.137931');});
test('calendar schedules preserve original month-end anchor',()=>{assert.equal(nextDue('2026-01-31T00:00:00Z',1,1).toISOString(),'2026-02-28T00:00:00.000Z');assert.equal(nextDue('2026-01-31T00:00:00Z',2,1).toISOString(),'2026-03-31T00:00:00.000Z');assert.equal(nextDue('2024-02-29T00:00:00Z',1,12).toISOString(),'2025-02-28T00:00:00.000Z');});
