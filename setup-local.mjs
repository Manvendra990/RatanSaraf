import {randomBytes} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {existsSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline/promises';
const files=['.env','backend/.env','admin/.env','mobile/.env'];
if(files.some(existsSync))throw new Error('An .env file already exists. This script will not overwrite it. Edit existing settings manually.');
const rl=createInterface({input:process.stdin,output:process.stdout});
try{
 const addresses=Object.values(networkInterfaces()).flat().filter(x=>x&&!x.internal&&x.family==='IPv4');
 const ip=(await rl.question(`Computer LAN IPv4 address [${addresses[0]?.address||'192.168.1.10'}]: `)).trim()||addresses[0]?.address||'192.168.1.10';
 if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)||ip.split('.').some(x=>Number(x)>255))throw new Error('Enter a valid LAN IPv4 address');
 const email=(await rl.question('Initial admin email [admin@ratansaraf.local]: ')).trim()||'admin@ratansaraf.local';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email');
 const db=randomBytes(24).toString('hex'),root=randomBytes(24).toString('hex'),jwt=randomBytes(32).toString('hex'),password=randomBytes(16).toString('hex');
 writeFileSync('.env',`MYSQL_PASSWORD=${db}\nMYSQL_ROOT_PASSWORD=${root}\n`,{mode:0o600});
 writeFileSync('backend/.env',`NODE_ENV=development\nHOST=0.0.0.0\nPORT=3004\nDATABASE_URL=mysql://ratan_app:${db}@127.0.0.1:3306/ratan_saraf\nJWT_SECRET=${jwt}\nADMIN_ORIGIN=http://localhost:5173\nINITIAL_ADMIN_EMAIL=${email}\nINITIAL_ADMIN_PASSWORD=${password}\nPUBLIC_API_URL=http://${ip}:3004/api\nPAYMENTS_ENABLED=false\nMERCHANT_PAYMENT_INSTRUCTIONS=Payments are not yet configured. Contact the store.\nKYC_API_URL=\nKYC_API_KEY=\nKYC_WEBHOOK_SECRET=\nKYC_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\nPRIVACY_URL=\n`,{mode:0o600});
 writeFileSync('admin/.env','VITE_API_URL=http://localhost:3004/api\n',{mode:0o600});
 writeFileSync('mobile/.env',`EXPO_PUBLIC_API_URL=http://${ip}:3004/api\n`,{mode:0o600});
 console.log(`Local configuration created.\nAdmin email: ${email}\nInitial admin password: ${password}\nSave these securely. Read START_HERE.md for database and startup commands.\nAfter db:setup succeeds remove INITIAL_ADMIN_PASSWORD from backend/.env.\nThese settings use optional Docker MySQL; for existing MySQL update DATABASE_URL first.`);
}finally{rl.close();}
