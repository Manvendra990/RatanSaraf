import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
export type StoreRate={id:string;metal:'Gold'|'Silver';buyPaise:string;sellPaise:string;createdAt:string;source:string;pricingPolicy?:string};
/** Focus, foreground and short polling all read the same uncached backend publication. */
export function useStoreRates(){
 const [rates,setRates]=useState<StoreRate[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const epoch=useRef(0);
 const refresh=useCallback(async()=>{const current=++epoch.current;setLoading(true);try{const result=await api('/gold/rates');if(current===epoch.current){setRates(result);setError('');}return result as StoreRate[];}catch(e:any){if(current===epoch.current)setError(e.message||'Store rate could not refresh');throw e;}finally{if(current===epoch.current)setLoading(false);}},[]);
 useFocusEffect(useCallback(()=>{const run=()=>{if(AppState.currentState==='active')void refresh().catch(()=>{});};run();const timer=setInterval(run,10000);const listener=AppState.addEventListener('change',state=>{if(state==='active')run();});return()=>{epoch.current++;clearInterval(timer);listener.remove();};},[refresh]));
 return {rates,error,loading,refresh};
}
