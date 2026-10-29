const fs=require('node:fs'),path=require('node:path');
const envPath=path.resolve(__dirname,'../.env');
require('dotenv').config({path:envPath});
const errors=[];
const missingFile=!fs.existsSync(envPath);
if(missingFile&&fs.existsSync(envPath+'.txt')) errors.push('Found .env.txt. Rename it to .env; Windows must not add a .txt extension.');
const placeholder=s=>/REPLACE|CHANGE|YOUR_|PASTE_|SET_YOUR/.test(s||'');
try{
 const value=process.env.DATABASE_URL;
 if(!value)throw new Error('missing');
 const u=new URL(value);
 if(u.protocol!=='mysql:'||!u.username||!u.password||u.pathname.length<2||placeholder(value))throw new Error('incomplete');
}catch{errors.push('DATABASE_URL must contain the actual MySQL username, encoded password, host and database name.');}
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32||placeholder(process.env.JWT_SECRET))errors.push('JWT_SECRET must be a random secret of at least 32 characters, not a placeholder.');
try{const u=new URL(process.env.ADMIN_ORIGIN||'');if(!['http:','https:'].includes(u.protocol))throw new Error();}catch{errors.push('Set ADMIN_ORIGIN (normally http://localhost:5173 for local setup).');}
if(errors.length){if(missingFile)errors.unshift('backend/.env is missing and required configuration is incomplete. Copy .env.example to .env and fill actual credentials, or supply the environment variables.');for(const e of errors)console.error('CONFIG: '+e);console.error('No credentials were printed. Fix backend/.env, then retry.');process.exitCode=1;}
else console.log('Configuration format OK. Database credentials were not printed; connectivity is checked by migrations/readiness.');
