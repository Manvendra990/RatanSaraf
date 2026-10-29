import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, restoreToken, setToken } from '../services/api';
type User={id:string;name:string;email:string;phone:string};
type AuthType={user:User|null;ready:boolean;login:(login:string,password:string)=>Promise<void>;register:(body:any)=>Promise<void>;logout:()=>Promise<void>};
const Context=createContext<AuthType>(null!);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{restoreToken().then(t=>t?api('/auth/me').then(setUser):undefined).catch(()=>setToken(null)).finally(()=>setReady(true));},[]);
 const accept=async(result:any)=>{await setToken(result.token);setUser(result.user);};
 return <Context.Provider value={{user,ready,login:async(login,password)=>accept(await api('/auth/login','POST',{login,password})),register:async b=>accept(await api('/auth/register','POST',{...b,login:b.email})),logout:async()=>{try{await api('/auth/logout','POST');}finally{await setToken(null);setUser(null);}}}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
