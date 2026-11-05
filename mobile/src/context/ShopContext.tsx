import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import { Alert } from 'react-native';
import type { CartLine } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
type Shop={cart:CartLine[];favorites:string[];add:(id:string)=>void;change:(id:string,delta:number)=>void;toggle:(id:string)=>void;clear:()=>void};
const Context=createContext<Shop>(null!);
export function ShopProvider({children}:{children:React.ReactNode}){
 const {user}=useAuth(),[state,setState]=useState<{cart:CartLine[];favorites:string[]}>({cart:[],favorites:[]});
 const current=useRef(state),owner=useRef<string|null>(null),loading=useRef(false),queue=useRef(Promise.resolve());
 const prevUser=useRef(user?.id);prevUser.current=user?.id;
 useEffect(()=>{owner.current=user?.id||null;loading.current=true;current.current={cart:[],favorites:[]};setState(current.current);if(user){const uid=user.id;void api('/shop').then(s=>{if(owner.current===uid){current.current=s;setState(s);}}).catch((e:any)=>Alert.alert('Unable to load saved cart',e.message)).finally(()=>{if(owner.current===uid)loading.current=false;});}else loading.current=false;},[user?.id]);
 const mutate=(fn:(s:typeof state)=>typeof state)=>{if(loading.current){Alert.alert('Please wait','Your saved cart is loading');return;}const next=fn(current.current);current.current=next;setState(next);const uid=owner.current;if(uid){queue.current=queue.current.catch(()=>{}).then(async()=>{if(owner.current!==uid)return;try{await api('/shop','PUT',next);}catch(e:any){Alert.alert('Cart not saved',e.message+' Changes remain on this device until retry.');}});}};
 return <Context.Provider value={{...state,add:id=>mutate(s=>({...s,cart:s.cart.some(x=>x.id===id)?s.cart.map(x=>x.id===id?{...x,qty:Math.min(x.qty+1,999)}:x):[...s.cart,{id,qty:1}]})),change:(id,delta)=>mutate(s=>({...s,cart:s.cart.map(x=>x.id===id?{...x,qty:Math.min(x.qty+delta,999)}:x).filter(x=>x.qty>0)})),toggle:id=>mutate(s=>({...s,favorites:s.favorites.includes(id)?s.favorites.filter(x=>x!==id):[...s.favorites,id]})),clear:()=>mutate(s=>({...s,cart:[]}))}}>{children}</Context.Provider>;
}
export const useShop=()=>useContext(Context);
