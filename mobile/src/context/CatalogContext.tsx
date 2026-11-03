import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { STORE } from '../constants/store';
import { api } from '../services/api';
import type { Metal,Product } from '../types';
type Catalog={home:any;homeError:string;products:Product[];categories:Record<Metal,string[]>;loading:boolean;error:string;refresh:()=>Promise<void>};
const Context=createContext<Catalog>(null!);
export function CatalogProvider({children}:{children:React.ReactNode}){
 const [products,setProducts]=useState<Product[]>([]),[categories,setCategories]=useState<Record<Metal,string[]>>({Gold:[],Silver:[]}),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [home,setHome]=useState<any>({rates:[]}),[homeError,setHomeError]=useState('');
 const refreshHome=useCallback(async()=>{try{setHome(await api('/home'));setHomeError('');}catch(e:any){setHomeError(e.message);}},[]);
 const refresh = useCallback(async()=>{void refreshHome();try{const [r,store]=await Promise.all([api('/catalog'),api('/store')]);Object.keys(STORE).forEach(key=>{if(store[key]!==undefined)(STORE as any)[key]=store[key];});setProducts(r.products);setCategories({Gold:r.categories.filter((c:any)=>c.metal==='Gold'&&c.name!=='Coins').map((c:any)=>c.name),Silver:r.categories.filter((c:any)=>c.metal==='Silver'&&c.name!=='Coins').map((c:any)=>c.name)});setError('');}catch(e:any){setError(e.message);}finally{setLoading(false);}},[]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),30000);const sub=AppState.addEventListener('change',s=>{if(s==='active')void refresh();});return()=>{clearInterval(timer);sub.remove();};},[]);
 return <Context.Provider value={{home,homeError,products,categories,loading,error,refresh}}>{children}</Context.Provider>;
}
export const useCatalog=()=>useContext(Context);
