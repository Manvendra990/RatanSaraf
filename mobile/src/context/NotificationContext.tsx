import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {useAuth} from './AuthContext';
import {api} from '../services/api';
export type RateNotice={id:string;metal:'Gold'|'Silver';amountPaise:string;createdAt:string;isRead:boolean};
type State={items:RateNotice[];unreadCount:number;error:string;loading:boolean;nextCursor:string|null;refresh:()=>Promise<void>;more:()=>Promise<void>;mark:(id:string)=>Promise<void>;markAll:()=>Promise<void>};
const Context=createContext<State>(null!);
export function NotificationProvider({children}:{children:React.ReactNode}){
 const {user}=useAuth();const owner=useRef(user?.id);owner.current=user?.id;
 const [items,setItems]=useState<RateNotice[]>([]),[unreadCount,setUnread]=useState(0),[error,setError]=useState(''),[loading,setLoading]=useState(false),[nextCursor,setNext]=useState<string|null>(null);
 const request=useRef(0),inFlight=useRef(false),expanded=useRef(false);
 const refresh=useCallback(async()=>{const uid=user?.id;if(!uid||inFlight.current)return;const n=++request.current;inFlight.current=true;setLoading(true);try{const r=await api('/notifications');if(owner.current!==uid||n!==request.current)return;setItems(old=>{const map=new Map(old.map(x=>[x.id,x]));r.items.forEach((x:RateNotice)=>map.set(x.id,x));return [...map.values()].sort((a,b)=>BigInt(a.id)>BigInt(b.id)?-1:1);});setUnread(r.unreadCount);if(!expanded.current)setNext(r.nextCursor);setError('');}catch(e:any){if(owner.current===uid)setError(e.message);}finally{inFlight.current=false;if(owner.current===uid)setLoading(false);}},[user?.id]);
 useEffect(()=>{request.current++;inFlight.current=false;expanded.current=false;setItems([]);setUnread(0);setNext(null);setError('');void refresh();const timer=setInterval(()=>{if(AppState.currentState==='active')void refresh();},15000);const listener=AppState.addEventListener('change',s=>{if(s==='active')void refresh();});return()=>{clearInterval(timer);listener.remove();request.current++;};},[refresh]);
 async function more(){if(!nextCursor||loading||!user)return;const uid=user.id;setLoading(true);try{const r=await api('/notifications?before='+nextCursor);if(owner.current!==uid)return;setItems(old=>{const m=new Map(old.map(x=>[x.id,x]));r.items.forEach((x:RateNotice)=>m.set(x.id,x));return [...m.values()].sort((a,b)=>BigInt(a.id)>BigInt(b.id)?-1:1);});expanded.current=true;setNext(r.nextCursor);setUnread(r.unreadCount);}catch(e:any){if(owner.current===uid)setError(e.message);}finally{if(owner.current===uid)setLoading(false);}}
 async function mark(id:string){const uid=user?.id;await api(`/notifications/${id}/read`,'POST',{});if(owner.current!==uid)return;setItems(old=>old.map(x=>x.id===id?{...x,isRead:true}:x));void refresh();}
 async function markAll(){const uid=user?.id;await api('/notifications/read-all','POST',{});if(owner.current!==uid)return;setItems(old=>old.map(x=>({...x,isRead:true})));void refresh();}
 return <Context.Provider value={{items,unreadCount,error,loading,nextCursor,refresh,more,mark,markAll}}>{children}</Context.Provider>;
}
export const useNotifications=()=>useContext(Context);
