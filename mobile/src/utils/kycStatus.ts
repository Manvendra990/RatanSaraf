export function kycPresentation(manual?:string,provider?:string){
 if(manual==='APPROVED'||provider==='VERIFIED')return {key:'verified',title:'KYC verified',description:'Your identity review is complete. You can request a gold purchase or sale.',background:'#EAF7EF',border:'#9ACFAF',ink:'#176438',symbol:'✓'};
 if(manual==='PENDING'||provider==='PENDING')return {key:'pending',title:'KYC review pending',description:'Your details are with the store admin. Gold buying and selling will unlock after approval.',background:'#FFF6DA',border:'#E7C870',ink:'#805B00',symbol:'◷'};
 if(manual==='REJECTED'||provider==='REJECTED')return {key:'rejected',title:'KYC needs correction',description:'Read the admin note, correct your details and submit them again.',background:'#FFF0ED',border:'#EBB0A4',ink:'#9B3025',symbol:'!'};
 return {key:'new',title:'Complete your KYC',description:'Submit your personal details and PAN document for manual review by the store.',background:'#F6F0E6',border:'#E9DCC8',ink:'#4A0B12',symbol:'○'};
}
