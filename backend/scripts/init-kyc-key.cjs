const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const p=path.resolve(__dirname,'../.env');if(!fs.existsSync(p))throw new Error('Create backend/.env first');
const text=fs.readFileSync(p,'utf8'),parsed=require('dotenv').parse(text);
if(/^[a-fA-F0-9]{64}$/.test(parsed.KYC_ENCRYPTION_KEY||'')){console.log('Existing KYC encryption key preserved.');}
else if(parsed.KYC_ENCRYPTION_KEY?.trim()){throw new Error('Existing KYC key is invalid. Restore the original key from backup; no changes were made.');}
else {const lines=text.split(/\r?\n/).filter(x=>!/^\s*KYC_ENCRYPTION_KEY=/.test(x));lines.push('KYC_ENCRYPTION_KEY='+crypto.randomBytes(32).toString('hex'));fs.writeFileSync(p,lines.join('\n'));console.log('KYC encryption key configured. Back it up securely; losing it makes stored documents unreadable.');}
