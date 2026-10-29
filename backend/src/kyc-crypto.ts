import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ServiceUnavailableException } from '@nestjs/common';
function key(){const value=process.env.KYC_ENCRYPTION_KEY;if(!value||! /^[a-fA-F0-9]{64}$/.test(value))throw new ServiceUnavailableException('Manual KYC storage is not configured. Ask the store to set KYC_ENCRYPTION_KEY.');return Buffer.from(value,'hex');}
export function seal(data:Buffer){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);const body=Buffer.concat([cipher.update(data),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]);}
export function unseal(data:Buffer){const decipher=createDecipheriv('aes-256-gcm',key(),data.subarray(0,12));decipher.setAuthTag(data.subarray(12,28));return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]);}
export function documentType(data:Buffer){if(data.subarray(0,5).toString()==='%PDF-')return 'application/pdf';if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(data[0]===255&&data[1]===216&&data[2]===255)return 'image/jpeg';return null;}
