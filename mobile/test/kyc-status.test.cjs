const {test}=require('node:test');const assert=require('node:assert/strict');
const {kycPresentation}=require('../.test-build/kycStatus.js');
test('pending KYC has an amber card and an explicit pending label',()=>{const r=kycPresentation('PENDING');assert.equal(r.key,'pending');assert.equal(r.background,'#FFF6DA');assert.match(r.title,/pending/i);});
test('manual approval has a green verified state',()=>{const r=kycPresentation('APPROVED');assert.equal(r.key,'verified');assert.equal(r.background,'#EAF7EF');assert.equal(r.symbol,'✓');});
test('rejected KYC asks for correction instead of showing approval',()=>{const r=kycPresentation('REJECTED');assert.equal(r.key,'rejected');assert.match(r.description,/correct/i);});
test('new accounts show an unsubmitted state',()=>{assert.equal(kycPresentation().key,'new');});
test('existing verified provider status stays eligible',()=>{assert.equal(kycPresentation(undefined,'VERIFIED').key,'verified');assert.equal(kycPresentation('PENDING','VERIFIED').key,'verified');});
