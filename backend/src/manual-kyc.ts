import { Body, Controller, Get, Post, Param, Req, Res, UseGuards, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { Auth, Admin } from './auth';
import { rows, tx } from './db';
import { ManualKyc, ManualKycDecision } from './dto';
import { seal, unseal, documentType } from './kyc-crypto';
const check=(ok:any,message:string)=>{if(!ok)throw new BadRequestException(message);};
function date(value:string){const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value&&+d<=Date.now();}
const phone=(v:string)=>{const n=v.replace(/\D/g,'');return n.length===12&&n.startsWith('91')?n.slice(2):n;};
const summary='id,userId,status,version,panLast4,consentVersion,submittedAt,reviewedAt,note';
@Controller('manual-kyc')
@UseGuards(Auth)
export class ManualKycController {
 @Get('me') async me(@Req() req:any){const [r]=await rows(`SELECT ${summary} FROM manual_kyc WHERE userId=?`,[req.user.id]);return r||null;}
 @Post('submit') @UseInterceptors(FileInterceptor('document',{limits:{fileSize:5*1024*1024,files:1}}))
 async submit(@Req() req:any,@Body() b:ManualKyc,@UploadedFile() file:any){
  check(file?.buffer,'Upload a PAN card photo or PDF');const mime=documentType(file.buffer);check(mime,'Upload a JPEG, PNG or PDF document (max 5 MB)');
  check(date(b.dob),'Enter a valid date of birth, not a future date');
  check(!b.spouseDob||date(b.spouseDob),'Enter a valid spouse date of birth');check(!b.anniversary||date(b.anniversary),'Enter a valid anniversary date');
  check(phone(b.phone)===phone(req.user.phone),'Use your registered mobile number');
  const encryptedProfile=seal(Buffer.from(JSON.stringify({...b,consent:undefined}), 'utf8')).toString('base64');const encryptedDocument=seal(file.buffer);
  return tx(async db=>{
   await rows('SELECT id FROM users WHERE id=? FOR UPDATE',[req.user.id],db);
   const [old]=await rows('SELECT id,status,version FROM manual_kyc WHERE userId=? FOR UPDATE',[req.user.id],db);
   check(!old||old.status==='REJECTED',old?.status==='APPROVED'?'Your details are already approved':'Your submission is awaiting admin review');
   const ref=old?.id||randomUUID();
   if(old)await rows("UPDATE manual_kyc SET status='PENDING',version=version+1,profileCipher=?,documentCipher=?,documentMime=?,panLast4=?,consentVersion='manual-pan-v1',consentAt=UTC_TIMESTAMP(),submittedAt=UTC_TIMESTAMP(),reviewedAt=NULL,reviewedBy=NULL,note=NULL WHERE id=?",[encryptedProfile,encryptedDocument,mime,b.pan.slice(-4),ref],db);
   else await rows("INSERT INTO manual_kyc(id,userId,profileCipher,documentCipher,documentMime,panLast4,consentVersion,consentAt,submittedAt) VALUES(?,?,?,?,?,?,'manual-pan-v1',UTC_TIMESTAMP(),UTC_TIMESTAMP())",[ref,req.user.id,encryptedProfile,encryptedDocument,mime,b.pan.slice(-4)],db);
   await rows('INSERT INTO audit(id,actor,action,referenceId) VALUES(?,?,?,?)',[randomUUID(),req.user.id,'MANUAL_KYC_SUBMIT',ref],db);return {id:ref,status:'PENDING',version:old?old.version+1:1};
  });
 }
 @Get('admin') @UseGuards(Admin) inbox(){return rows('SELECT m.id,m.userId,m.status,m.version,m.panLast4,m.submittedAt,m.reviewedAt,m.note,u.name,u.email FROM manual_kyc m JOIN users u ON u.id=m.userId ORDER BY m.submittedAt DESC');}
 @Get('admin/:id') @UseGuards(Admin) async detail(@Req() req:any,@Param('id') id:string){
  const [r]=await rows(`SELECT ${summary},profileCipher FROM manual_kyc WHERE id=?`,[id]);if(!r)throw new NotFoundException();
  const profile=JSON.parse(unseal(Buffer.from(r.profileCipher,'base64')).toString('utf8'));delete r.profileCipher;
  await rows('INSERT INTO audit(id,actor,action,referenceId) VALUES(?,?,?,?)',[randomUUID(),req.user.id,'MANUAL_KYC_VIEW',id]);return {...r,profile};
 }
 @Get(':id/document') async document(@Req() req:any,@Param('id') id:string,@Res() res:any){
  const [r]=await rows('SELECT userId,documentCipher,documentMime FROM manual_kyc WHERE id=?',[id]);if(!r)throw new NotFoundException();if(req.user.role!=='ADMIN'&&r.userId!==req.user.id)throw new ForbiddenException();
  const bytes=unseal(Buffer.from(r.documentCipher));const ext=r.documentMime==='application/pdf'?'pdf':r.documentMime==='image/png'?'png':'jpg';
  await rows('INSERT INTO audit(id,actor,action,referenceId) VALUES(?,?,?,?)',[randomUUID(),req.user.id,'MANUAL_KYC_DOCUMENT',id]);
  res.set({'Content-Type':r.documentMime,'Cache-Control':'no-store','Content-Disposition':`inline; filename="pan-${id}.${ext}"`,'X-Content-Type-Options':'nosniff'});res.send(bytes);
 }
 @Post('admin/:id/decision') @UseGuards(Admin) async decision(@Req() req:any,@Param('id') id:string,@Body() b:ManualKycDecision){
  check(b.note.trim().length>=3,'Enter your review reason');return tx(async db=>{
   const [lookup]=await rows('SELECT userId FROM manual_kyc WHERE id=?',[id],db);if(!lookup)throw new NotFoundException();
   check(lookup.userId!==req.user.id,'You cannot review your own submission');
   await rows('SELECT id FROM users WHERE id=? FOR UPDATE',[lookup.userId],db);
   const [r]=await rows('SELECT status,version,profileCipher FROM manual_kyc WHERE id=? FOR UPDATE',[id],db);const target=b.action==='APPROVE'?'APPROVED':'REJECTED';
   check(r.version===b.version,'Submission changed. Reopen and review the latest details before deciding.');
   if(r.status===target)return {ok:true,status:target};check(r.status==='PENDING','Review already finalized');
   // Approval requires the stored details to remain readable with the configured key.
   unseal(Buffer.from(r.profileCipher,'base64'));
   await rows('UPDATE manual_kyc SET status=?,note=?,reviewedAt=UTC_TIMESTAMP(),reviewedBy=? WHERE id=?',[target,b.note.trim(),req.user.id,id],db);
   await rows('INSERT INTO audit(id,actor,action,referenceId) VALUES(?,?,?,?)',[randomUUID(),req.user.id,'MANUAL_KYC_'+target,id],db);return {ok:true,status:target};
  });
 }
}
