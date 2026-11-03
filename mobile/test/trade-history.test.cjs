const {test}=require('node:test');const assert=require('node:assert/strict');
const {tradeHistory}=require('../.test-build/tradeHistory.js');
const row=(id,metal,createdAt,status='PENDING')=>({id,metal,createdAt,status,grams:'2000000',amountPaise:'200000'});
test('all history interleaves buys and sells newest first, including pending sells',()=>{
 const result=tradeHistory({purchases:[row('buy','Gold','2026-11-01')],sales:[row('sell','Gold','2026-11-02')]},'Gold');
 assert.deepEqual(result.map(x=>[x.id,x.tradeType]),[['sell','Sell'],['buy','Buy']]);assert.equal(result[0].status,'PENDING');
});
test('Sell filter shows pending approved paid and rejected requests without buy rows',()=>{
 const data={purchases:[row('b','Gold','2026-11-01')],sales:['PENDING','APPROVED','PAID','REJECTED'].map((status,i)=>row('s'+i,'Gold','2026-11-02',status))};
 assert.equal(tradeHistory(data,'Gold','Sell').length,4);assert.ok(tradeHistory(data,'Gold','Sell').every(x=>x.tradeType==='Sell'));
});
test('metal filters keep Silver separate and retain legacy Gold payments',()=>{
 const data={purchases:[row('g','Gold','2026-11-01'),row('s','Silver','2026-11-01')],payments:[row('legacy',undefined,'2026-10-31')],sales:[row('ss','Silver','2026-11-02')]};
 assert.deepEqual(tradeHistory(data,'Silver').map(x=>x.id),['ss','s']);assert.equal(tradeHistory(data,'Gold','Buy').length,2);assert.equal(tradeHistory(data,'Gold','Buy')[1].legacy,true);
});
