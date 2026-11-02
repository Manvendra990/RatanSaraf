import React, { useCallback, useRef, useState } from 'react';
import { Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Caption, Field, Heading, Screen } from '../../components/ui';
import { GoldAction, KycStatusCard } from '../../components/ui/KycStatusCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useStoreRates } from '../../hooks/useStoreRates';
import { tradeHistory, type HistoryFilter } from '../../utils/tradeHistory';
import { colors } from '../../constants/theme';
import type { RootStack } from '../../navigation/types';
const money=(value:any)=>{try{const n=BigInt(value||0);return '₹'+(n/100n).toLocaleString('en-IN')+'.'+(n%100n).toString().padStart(2,'0');}catch{return '—';}};
const micrograms=(value:string)=>{if(!/^\d+(\.\d{1,6})?$/.test(value))return 0n;const [whole,fraction='']=value.split('.');try{return BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));}catch{return 0n;}};
const weight=(value:any)=>{try{const n=BigInt(value||0),fraction=(n%1000000n).toString().padStart(6,'0').replace(/0+$/,'').padEnd(3,'0');return `${n/1000000n}.${fraction} g`;}catch{return '—';}};
const requestReference=()=>`REQ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
type Page='Overview'|'KYC'|'Buy'|'Sell'|'History';
function Choice({label,selected,onPress,disabled=false}:{label:string;selected:boolean;onPress:()=>void;disabled?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityState={{selected,disabled}} disabled={disabled} onPress={onPress} style={[s.choice,selected&&s.selected,disabled&&{opacity:0.5}]}><Text style={[s.choiceText,selected&&{color:colors.onDark}]}>{label}</Text></Pressable>;
}
function Status({status}:{status:string}){
 const good=['APPROVED','PAID','VERIFIED'].includes(status),bad=status==='REJECTED';
 return <View style={[s.badge,{backgroundColor:good?'#E5F3EA':bad?'#FCEAE7':'#FFF1C9'}]}><Text style={{fontSize:11,fontWeight:'800',color:good?'#176438':bad?colors.red:'#775500'}}>{status==='APPROVED'?'APPROVED':status}</Text></View>;
}
export function SipScreen({navigation}:NativeStackScreenProps<RootStack,'Sip'>){
 const {user,ready}=useAuth(),store=useStoreRates();
 const [metal,setMetal]=useState<'Gold'|'Silver'>('Gold'),[page,setPage]=useState<Page>('Overview'),[historyFilter,setHistoryFilter]=useState<HistoryFilter>('All');
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [buyGrams,setBuyGrams]=useState('1'),[sellGrams,setSellGrams]=useState(''),[payout,setPayout]=useState('');
 const requestKey=useRef(requestReference()),submitting=useRef(false),epoch=useRef(0);
 const load=useCallback(async()=>{const current=++epoch.current;try{const result=await api('/gold/dashboard');if(current===epoch.current){setData(result);setError('');}}catch(e:any){if(current===epoch.current)setError(e.message);}finally{if(current===epoch.current)setLoading(false);}},[]);
 useFocusEffect(useCallback(()=>{const run=()=>{if(user&&AppState.currentState==='active'&&!submitting.current)void load();};run();const timer=setInterval(run,10000);const listener=AppState.addEventListener('change',state=>{if(state==='active')run();});return()=>{epoch.current++;clearInterval(timer);listener.remove();};},[user?.id,load]));
 async function refresh(){setLoading(true);await Promise.all([load(),store.refresh().catch(()=>{})]);}
 async function act(fn:()=>Promise<void>){if(submitting.current)return;submitting.current=true;setBusy(true);setError('');try{await fn();await load();}catch(e:any){setError(e.message);}finally{submitting.current=false;setBusy(false);}}
 const rate=store.rates.find(r=>r.metal===metal),singleRate=rate?.pricingPolicy==='SINGLE_STORE_RATE';
 const account=data?.holdings?.[metal]||(metal==='Gold'?data:{balance:'0',available:'0',reserved:'0'});
 const kycOk=data?.manualKyc?.status==='APPROVED'||data?.kyc?.status==='VERIFIED';
 const count=/^\d+$/.test(buyGrams)?Number(buyGrams):0;
 const buyTotal=rate&&Number.isSafeInteger(count)&&count>=1&&count<=10000?BigInt(count)*BigInt(rate.buyPaise):null;
 const sellWeight=micrograms(sellGrams),sellTotal=rate?sellWeight*BigInt(rate.buyPaise)/1000000n:0n;
 const history=tradeHistory(data,metal,historyFilter),buys=tradeHistory(data,metal,'Buy'),sales=tradeHistory(data,metal,'Sell');
 const bought=buys.filter(p=>p.status==='APPROVED').reduce((n,p)=>n+BigInt(p.grams),0n),sold=sales.filter(p=>p.status==='PAID').reduce((n,p)=>n+BigInt(p.grams),0n);
 const locked=busy||loading||!kycOk||!singleRate||!!store.error;
 async function checkLatest(){
  const latest=(await store.refresh()).find(r=>r.metal===metal);
  if(!latest||latest.id!==rate?.id){Alert.alert('Rate updated','The store rate changed. Review the refreshed amount, then submit again.');return false;}
  if(latest.pricingPolicy!=='SINGLE_STORE_RATE')throw new Error('Update the backend to the current single-rate version before trading.');
  return true;
 }
 function submitBuy(){
  if(locked||!rate||buyTotal===null)return;
  const accepted={rateId:rate.id,grams:count,reference:requestKey.current};
  Alert.alert(`Request ${metal.toLowerCase()} purchase`,`${count} g × ${money(rate.buyPaise)}/g = ${money(buyTotal)}. Your balance increases only after admin approval.`,[{text:'Cancel',style:'cancel'},{text:'Send request',onPress:()=>void act(async()=>{if(!await checkLatest())return;await api('/gold/purchases','POST',accepted);requestKey.current=requestReference();setHistoryFilter('Buy');setPage('History');})}]);
 }
 function submitSale(){
  if(locked||!rate)return;
  if(sellWeight<=0n||sellWeight>micrograms(account?.available||'0')||payout.trim().length<5){Alert.alert('Check sale details','Enter a weight within your available balance and valid bank / UPI payout details.');return;}
  const accepted={rateId:rate.id,grams:sellGrams,payoutDetails:payout.trim()};
  Alert.alert(`Request ${metal.toLowerCase()} sale`,`${weight(sellWeight)} × ${money(rate.buyPaise)}/g = ${money(sellTotal)}. The requested grams stay reserved until admin confirms payout or rejects the request.`,[{text:'Cancel',style:'cancel'},{text:'Send request',onPress:()=>void act(async()=>{if(!await checkLatest())return;await api('/gold/sales','POST',accepted);setSellGrams('');setPayout('');setHistoryFilter('Sell');setPage('History');})}]);
 }
 const rateCard=<View style={s.rateCard}><View style={s.row}><Text style={s.eyebrow}>CURRENT STORE RATE</Text><Text style={s.metalBadge}>{metal.toUpperCase()}</Text></View><Text style={s.rateValue}>{rate?money(rate.buyPaise):'—'}<Text style={s.unit}> / gram</Text></Text><Text style={s.onDark}>{singleRate?'One rate for buy, sell & current value':'Publish a current store rate to start'}</Text>{rate&&<Text style={s.rateDate}>Updated {new Date(rate.createdAt).toLocaleString()}</Text>}</View>;
 if(!ready)return <Screen><Caption>Loading account…</Caption></Screen>;
 if(!user)return <Screen><Heading>Gold & Silver</Heading><Caption>Sign in to complete KYC and manage your metals.</Caption><GoldAction title="Login / Register" onPress={()=>navigation.navigate('Login')}/></Screen>;
 return <Screen contentStyle={{paddingTop:14}}>
  <View style={s.row}><View><Text style={s.title}>Your metal account</Text><Caption>Buy, sell and track your holdings</Caption></View><Pressable accessibilityRole="button" accessibilityLabel="Refresh rates and history" disabled={busy||loading} onPress={()=>void refresh()} style={s.refresh}><Text style={s.refreshText}>{loading||store.loading?'…':'↻'}</Text></Pressable></View>
  <View style={s.segment}>{(['Gold','Silver'] as const).map(m=><Choice key={m} label={m} selected={metal===m} disabled={busy} onPress={()=>{setMetal(m);setSellGrams('');requestKey.current=requestReference();}}/>)}</View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.nav}>{(['Overview','KYC','Buy','Sell','History'] as Page[]).map(p=><Choice key={p} label={p} selected={page===p} disabled={busy} onPress={()=>setPage(p)}/>)}</ScrollView>
  {!!(error||store.error)&&<Text accessibilityRole="alert" style={s.error}>{error||store.error} {store.error?'Last received rate may be outdated. Refresh before trading.':''}</Text>}
  {!!rate&&!singleRate&&<Text style={s.error}>Backend update required. Run the latest backend and database upgrade to use one store rate.</Text>}
  {page==='Overview'&&<>
   <View style={s.balanceCard}><Text style={s.label}>YOUR {metal.toUpperCase()} HOLDING</Text><Text style={s.balance}>{weight(micrograms(account?.balance||'0'))}</Text><Text style={s.value}>{rate?money(micrograms(account?.balance||'0')*BigInt(rate.buyPaise)/1000000n):'—'}</Text><Caption>Current value at the latest store rate</Caption><View style={s.divider}/><View style={s.row}><View><Caption>Available</Caption><Text style={s.metric}>{weight(micrograms(account?.available||'0'))}</Text></View><View><Caption>Reserved for sale</Caption><Text style={s.metric}>{weight(micrograms(account?.reserved||'0'))}</Text></View></View></View>
   <View style={s.twoColumns}><View style={s.smallCard}><Caption>Total bought</Caption><Text style={s.metric}>{weight(bought)}</Text></View><View style={s.smallCard}><Caption>Total sold</Caption><Text style={s.metric}>{weight(sold)}</Text></View></View>
   {rateCard}<View style={s.twoColumns}><View style={s.flex}><GoldAction title={`Buy ${metal}`} disabled={locked} onPress={()=>setPage('Buy')}/></View><View style={s.flex}><GoldAction title={`Sell ${metal}`} secondary disabled={locked} onPress={()=>setPage('Sell')}/></View></View>
   <KycStatusCard manual={data?.manualKyc?.status} provider={data?.kyc?.status} note={data?.manualKyc?.note}/>{!kycOk&&<GoldAction title="Complete / Check KYC" secondary disabled={busy} onPress={()=>setPage('KYC')}/>}
  </>}
  {page==='KYC'&&<>
   <Text style={s.sectionTitle}>Identity verification</Text><KycStatusCard manual={data?.manualKyc?.status} provider={data?.kyc?.status} note={data?.manualKyc?.note}/>
   <View style={s.card}><Text style={s.label}>YOUR NEXT STEPS</Text><Text style={s.body}>1. Submit personal details and PAN{ '\n'}2. Store admin reviews your documents{ '\n'}3. Buy or sell after approval</Text><Caption>Manual store review is separate from an external PAN / Aadhaar API verification.</Caption></View>
   {kycOk?<GoldAction title={`Continue to buy ${metal}`} onPress={()=>setPage('Buy')}/>:data?.manualKyc?.status==='PENDING'?<GoldAction title="Awaiting admin review" disabled onPress={()=>{}}/>:<GoldAction title={data?.manualKyc?.status==='REJECTED'?'Correct & resubmit KYC':'Start KYC verification'} disabled={busy||loading||!data} onPress={()=>navigation.navigate('ManualKyc')}/>}
  </>}
  {page==='Buy'&&<>
   <Text style={s.sectionTitle}>Buy {metal.toLowerCase()}</Text>{rateCard}
   {!kycOk&&<KycStatusCard manual={data?.manualKyc?.status} provider={data?.kyc?.status}/>}
   <View style={s.card}><Text style={s.label}>CHOOSE WEIGHT</Text><View style={s.weights}>{[1,2,3,5,10].map(n=><Choice key={n} label={`${n} g`} selected={buyGrams===String(n)} disabled={busy} onPress={()=>setBuyGrams(String(n))}/>)}</View><Text style={s.fieldLabel}>Weight in grams</Text><Field placeholder="Whole grams (1–10000)" value={buyGrams} onChangeText={setBuyGrams} keyboardType="number-pad"/><View style={s.totalBox}><Caption>Purchase amount</Caption><Text style={s.total}>{buyTotal===null?'—':money(buyTotal)}</Text></View></View>
   <GoldAction title={busy?'Sending…':`Request ${metal.toLowerCase()} purchase`} disabled={locked||buyTotal===null} onPress={submitBuy}/><Caption>Pending requests appear in history. Grams are added after admin approval.</Caption>
  </>}
  {page==='Sell'&&<>
   <Text style={s.sectionTitle}>Sell {metal.toLowerCase()}</Text>{rateCard}
   <View style={s.availability}><Text style={s.label}>Available to sell</Text><Text style={s.metric}>{weight(micrograms(account?.available||'0'))}</Text></View>
   {!kycOk&&<KycStatusCard manual={data?.manualKyc?.status} provider={data?.kyc?.status}/>}
   <View style={s.card}><Text style={s.fieldLabel}>Grams to sell</Text><Field placeholder="Enter weight (up to 6 decimals)" value={sellGrams} onChangeText={setSellGrams} keyboardType="decimal-pad"/><Text style={s.fieldLabel}>Bank / UPI payout details</Text><Field placeholder="Account & IFSC or UPI ID" value={payout} onChangeText={setPayout}/><View style={s.totalBox}><Caption>Estimated payout</Caption><Text style={s.total}>{money(sellTotal)}</Text><Caption>{weight(sellWeight)} × {rate?money(rate.buyPaise):'—'} per gram</Caption></View></View>
   <GoldAction title={busy?'Sending…':`Request ${metal.toLowerCase()} sale`} disabled={locked||sellWeight<=0n} onPress={submitSale}/><Caption>Grams are reserved on submission. Balance decreases when admin confirms payout. Rejection releases the reservation.</Caption>
  </>}
  {page==='History'&&<>
   <Text style={s.sectionTitle}>{metal} transaction history</Text><View style={s.segment}>{(['All','Buy','Sell'] as const).map(f=><Choice key={f} label={`${f}${f==='Buy'?` (${buys.length})`:f==='Sell'?` (${sales.length})`:''}`} selected={historyFilter===f} onPress={()=>setHistoryFilter(f)}/>)}</View>
   {!history.length&&<View style={s.card}><Text style={s.label}>No {historyFilter==='All'?'transactions':historyFilter.toLowerCase()+' requests'} yet</Text><Caption>Your {metal.toLowerCase()} requests will appear here, including pending and rejected requests.</Caption></View>}
   {history.map(item=><View key={`${item.tradeType}-${item.id}`} style={s.historyCard}><View style={s.row}><Text style={[s.tradeType,{color:item.tradeType==='Sell'?'#9A4F16':'#176438'}]}>{item.tradeType==='Buy'?'↙ BUY':'↗ SELL'} {metal.toUpperCase()}</Text><Status status={item.status}/></View><View style={[s.row,{marginVertical:12}]}><Text style={s.historyWeight}>{weight(item.grams)}</Text><Text style={s.historyAmount}>{money(item.amountPaise)}</Text></View><Caption>{new Date(item.createdAt).toLocaleString()}</Caption>{item.tradeType==='Sell'&&<Caption>{item.status==='PAID'?'Payout completed':item.status==='APPROVED'?'Approved · awaiting payout':item.status==='PENDING'?'Awaiting admin review · grams reserved':'Reservation released'}</Caption>}{item.legacy&&<Caption>Earlier SIP payment</Caption>}{!!item.note&&<Text style={s.note}>Admin: {item.note}</Text>}{!!item.payoutReference&&<Caption>Payout reference: {item.payoutReference}</Caption>}</View>)}
  </>}
 </Screen>;
}
const s=StyleSheet.create({
 row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},flex:{flex:1},title:{fontSize:23,fontWeight:'800',color:colors.maroon},refresh:{width:44,height:44,borderRadius:22,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},refreshText:{fontSize:28,color:colors.maroon},segment:{flexDirection:'row',gap:6,backgroundColor:'#EFE7DA',padding:5,borderRadius:16,marginVertical:15},choice:{minHeight:42,minWidth:46,paddingVertical:11,paddingHorizontal:14,borderRadius:12,justifyContent:'center',alignItems:'center'},choiceText:{color:colors.maroon,fontSize:13,fontWeight:'700'},selected:{backgroundColor:colors.maroon},nav:{gap:5,paddingBottom:12},card:{backgroundColor:colors.paper,padding:18,borderRadius:20,borderWidth:1,borderColor:colors.line,marginVertical:10},rateCard:{padding:20,backgroundColor:colors.maroon,borderRadius:20,marginVertical:10},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.2,color:'#DCC68D'},metalBadge:{fontSize:10,fontWeight:'800',color:colors.onDark,letterSpacing:1},rateValue:{fontSize:32,fontWeight:'800',color:colors.onDark,marginVertical:12},unit:{fontSize:13,fontWeight:'500',color:'#DCC68D'},onDark:{fontSize:12,color:colors.onDark},rateDate:{fontSize:10,color:'#DCC68D',marginTop:10},balanceCard:{backgroundColor:colors.paper,padding:22,borderRadius:22,borderWidth:1,borderColor:'#D6BD86',marginVertical:10},balance:{fontSize:38,fontWeight:'800',color:colors.maroon,marginTop:12},value:{fontSize:24,fontWeight:'700',color:colors.gold,marginVertical:8},label:{fontSize:12,fontWeight:'800',color:colors.maroon,letterSpacing:0.4},metric:{fontSize:17,fontWeight:'700',color:colors.maroon,marginTop:5},divider:{height:1,backgroundColor:colors.line,marginVertical:18},twoColumns:{flexDirection:'row',gap:10},smallCard:{flex:1,padding:16,backgroundColor:'#F1E9D8',borderRadius:16,marginVertical:6},sectionTitle:{fontSize:21,fontWeight:'800',color:colors.maroon,marginTop:10,marginBottom:8},body:{fontSize:14,lineHeight:28,color:colors.ink,marginVertical:12},weights:{flexDirection:'row',flexWrap:'wrap',gap:4,marginVertical:12},fieldLabel:{fontSize:13,fontWeight:'700',color:colors.ink,marginTop:12,marginBottom:5},totalBox:{backgroundColor:'#FBF6EC',borderRadius:14,padding:16,marginTop:14},total:{fontSize:28,fontWeight:'800',color:colors.maroon,marginVertical:5},availability:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,backgroundColor:'#F1E9D8',borderRadius:14,marginVertical:8},historyCard:{backgroundColor:colors.paper,borderRadius:18,padding:18,borderWidth:1,borderColor:colors.line,marginVertical:7},tradeType:{fontSize:11,fontWeight:'800',letterSpacing:0.7},badge:{paddingHorizontal:9,paddingVertical:6,borderRadius:20},historyWeight:{fontSize:20,fontWeight:'800',color:colors.maroon},historyAmount:{fontSize:19,fontWeight:'700',color:colors.ink},note:{fontSize:12,lineHeight:20,color:colors.muted,marginTop:10},error:{fontSize:13,color:colors.red,lineHeight:20,marginVertical:10},
});
