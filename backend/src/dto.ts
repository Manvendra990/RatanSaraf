import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, IsUUID, IsNumber } from 'class-validator';
export class Login { @IsString() @Length(3,190) login!: string; @IsString() @Length(8,72) password!: string; }
export class Register extends Login { @IsString() @Length(2,120) name!: string; @IsEmail() @MaxLength(190) email!: string; @Matches(/^\+?[0-9]{10,15}$/) phone!: string; }
export class Category { @IsString() @Length(1,100) name!: string; @IsIn(['Gold','Silver']) metal!: string; @IsBoolean() active!: boolean; }
export class ProductDto { @IsString() @Length(1,160) name!: string; @IsIn(['Gold','Silver']) metal!: string; @IsUUID() categoryId!: string; @Matches(/^\d+(\.\d{1,2})?$/) price!: string; @IsString() @Length(1,60) weight!: string; @IsString() @Length(1,60) purity!: string; @IsString() @MaxLength(2000) image!: string; @IsString() @MaxLength(10000) description!: string; @IsOptional() @Matches(/^\d+(\.\d{1,3})?$/) coinWeight?: string; @IsInt() @Min(0) @Max(1000000) stock!: number; @IsBoolean() active!: boolean; }
export class Rate { @IsIn(['Gold','Silver']) metal!: string; @Matches(/^\d+(\.\d{1,2})?$/) buy!: string; @Matches(/^\d+(\.\d{1,2})?$/) sell!: string; @IsString() @Length(2,120) source!: string; }
export class Plan { @IsString() @Length(2,100) name!: string; @IsIn([1,3,12]) months!: number; @Matches(/^\d+(\.\d{1,2})?$/) minimum!: string; @IsBoolean() active!: boolean; }
export class Subscribe { @IsUUID() planId!: string; @Matches(/^\d+(\.\d{1,2})?$/) amount!: string; }
export class Payment { @IsUUID() subscriptionId!: string; @IsUUID() rateId!: string; @IsString() @Length(6,120) reference!: string; }
export class Sale { @IsUUID() rateId!: string; @Matches(/^\d+(\.\d{1,6})?$/) grams!: string; @IsString() @Length(5,500) payoutDetails!: string; }
export class Decision { @IsIn(['APPROVE','REJECT','PAID']) action!: string; @IsOptional() @IsString() @Length(3,190) reference?: string; @IsString() @Length(3,500) note!: string; }
export class SubscriptionStatus { @IsIn(['ACTIVE','PAUSED','CANCELLED']) status!: string; }
export class KycConsent { @IsIn([true]) consent!: boolean; }
export class KycResult { @IsUUID() reference!: string; @IsString() @Length(1,190) providerRef!: string; @IsIn(['VERIFIED','REJECTED']) status!: string; }
export class Enquiry { @IsString() @Length(1,60) productId!: string; @IsString() @Length(1,1000) message!: string; }

export class StoreSettings {
 @IsString() @Length(2,120) name!:string;
 @IsString() @Length(1,120) ownerName!:string;
 @IsString() @MaxLength(200) tagline!:string;
 @IsString() @MaxLength(100) descriptor!:string;
 @IsString() @Length(1,200) addressLine1!:string;
 @IsString() @Length(1,100) city!:string;
 @IsString() @Length(1,100) state!:string;
 @Matches(/^\d{6}$/) pincode!:string;
 @IsString() @MaxLength(500) mapQuery!:string;
 @IsNumber() @Min(-90) @Max(90) latitude!:number;
 @IsNumber() @Min(-180) @Max(180) longitude!:number;
 @Matches(/^(?:[0-9]{10,15})?$/) whatsapp!:string;
 @Matches(/^(?:[+0-9]{10,16})?$/) phone!:string;
}
export class ManualKyc {
 @IsString() @Length(2,120) name!:string;
 @IsOptional() @IsEmail() @MaxLength(190) email?:string;
 @IsIn(['India']) country!:string;
 @Matches(/^\+?[0-9]{10,15}$/) phone!:string;
 @IsString() @Length(5,500) address!:string;
 @IsString() @Length(2,100) city!:string;
 @Matches(/^[1-9][0-9]{5}$/) pincode!:string;
 @IsString() @Length(2,100) state!:string;
 @Matches(/^\d{4}-\d{2}-\d{2}$/) dob!:string;
 @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) spouseDob?:string;
 @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) anniversary?:string;
 @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/) pan!:string;
 @IsIn(['true']) consent!:string;
}
export class ManualKycDecision {
 @IsInt() @Min(1) version!:number;
 @IsIn(['APPROVE','REJECT']) action!:string;
 @IsString() @Length(3,500) note!:string;
}
