import * as SecureStore from 'expo-secure-store';
const BASE=process.env.EXPO_PUBLIC_API_URL||'http://localhost:3004/api';
let token:string|null=null;
export const hasSession=()=>!!token;
export const restoreToken=async()=>{token=await SecureStore.getItemAsync('session');return token;};
export async function setToken(value:string|null){token=value;if(value)await SecureStore.setItemAsync('session',value);else await SecureStore.deleteItemAsync('session');}
export async function api(path:string,method='GET',body?:any):Promise<any>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{const res=await fetch(BASE+path,{method,signal:controller.signal,headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});const data=await res.json();if(!res.ok)throw new Error(Array.isArray(data.message)?data.message.join(', '):data.message||'Request failed');return data;}finally{clearTimeout(timer);}
}

export async function apiMultipart(path:string,body:FormData){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{const res=await fetch(BASE+path,{method:'POST',signal:controller.signal,headers:{Accept:'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body});const data=await res.json();if(!res.ok)throw new Error(Array.isArray(data.message)?data.message.join(', '):data.message||'Upload failed');return data;}finally{clearTimeout(timer);}
}
