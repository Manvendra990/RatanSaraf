import 'reflect-metadata';
import 'dotenv/config';
import { Module, ValidationPipe, BadRequestException, Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import helmet from 'helmet';
import express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { ApiController, AdminController, AuthController } from './routes';
import { PrismaService, prisma } from './prisma.service';
import { ManualKycController } from './manual-kyc';
import { Auth, Admin } from './auth';
@Catch()
class Errors implements ExceptionFilter {
 catch(e: any, host: ArgumentsHost) {
  const res = host.switchToHttp().getResponse();
  if(e instanceof HttpException) return res.status(e.getStatus()).json(e.getResponse());
  if(e.code==='ER_DUP_ENTRY' || e.code==='P2002' || (e.code==='P2010' && String(e.meta?.code)==='1062')) return res.status(409).json({message:'This reference or record already exists'});
  if(e.code==='ER_ROW_IS_REFERENCED_2' || e.code==='P2003') return res.status(409).json({message:'Record is in use; archive it instead'});
  if(e.code==='P2034') return res.status(409).json({message:'Concurrent update; refresh and retry safely.'});
  console.error('Request failed', e.code || e.name);
  res.status(500).json({message:'Unable to complete request. Please retry.'});
 }
}
@Module({imports:[JwtModule.register({secret:process.env.JWT_SECRET, signOptions:{expiresIn:'8h'}})],controllers:[ApiController,AdminController,AuthController,ManualKycController],providers:[Auth,Admin,{provide:PrismaService,useValue:prisma}]})
class AppModule {}
async function main() {
 if(!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length<32 || /REPLACE|CHANGE/.test(process.env.JWT_SECRET)) throw new Error('Set DATABASE_URL and a random JWT_SECRET (32+ characters)');
 if(process.env.NODE_ENV==='production' && (!process.env.ADMIN_ORIGIN?.startsWith('https://') || !process.env.PUBLIC_API_URL?.startsWith('https://'))) throw new Error('Production requires HTTPS ADMIN_ORIGIN and PUBLIC_API_URL');
 if(process.env.KYC_API_URL && !process.env.KYC_API_URL.startsWith('https://')) throw new Error('KYC_API_URL must use HTTPS');
 const app = await NestFactory.create(AppModule, {rawBody:true});
 app.setGlobalPrefix('api'); app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
 app.use('/media',express.static(join(process.cwd(),'uploads'),{dotfiles:'deny',fallthrough:false})); app.use(cookieParser());
 const origin=process.env.ADMIN_ORIGIN || 'http://localhost:5173';
 app.enableCors({origin,credentials:true});
 app.use((req:any,res:any,next:any)=>{if((req.path.startsWith('/api/admin') || req.path.startsWith('/api/manual-kyc/admin')) && !['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.origin!==origin) return res.status(403).json({message:'Untrusted admin origin'});next();});
 app.use('/api/',rateLimit({windowMs:60000,limit:240,standardHeaders:true,legacyHeaders:false}));
 app.use('/api/auth/',rateLimit({windowMs:15*60000,limit:40,standardHeaders:true,legacyHeaders:false}));
 app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true})); app.useGlobalFilters(new Errors());
 app.enableShutdownHooks(); await app.listen(Number(process.env.PORT||3004),process.env.HOST||'0.0.0.0');
}
void main();
