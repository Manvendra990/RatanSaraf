import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { kycPresentation } from '../../utils/kycStatus';
export function GoldAction({title,onPress,secondary=false,disabled=false,variant}:{title:string;onPress:()=>void;secondary?:boolean;disabled?:boolean;variant?:'secondary'}){
 secondary=secondary||variant==='secondary';
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[s.button,{backgroundColor:secondary?colors.paper:colors.maroon,borderColor:colors.maroon},(disabled||pressed)&&{opacity:disabled?0.4:0.75}]}><Text style={{color:secondary?colors.maroon:colors.goldLight,fontSize:15,fontWeight:'700',textAlign:'center'}}>{title}</Text></Pressable>;
}
export function KycStatusCard({manual,provider,note}:{manual?:string;provider?:string;note?:string}){
 const state=kycPresentation(manual,provider);
 return <View accessibilityLiveRegion="polite" style={[s.card,{backgroundColor:state.background,borderColor:state.border}]}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={[s.symbol,{borderColor:state.border}]}><Text style={{color:state.ink,fontSize:24,fontWeight:'700'}}>{state.symbol}</Text></View><Text style={{flex:1,fontSize:20,fontWeight:'700',color:state.ink}}>{state.title}</Text></View><Text style={{fontSize:14,lineHeight:22,color:state.ink,marginTop:12}}>{state.description}</Text>{!!note&&<View style={s.note}><Text style={{color:state.ink,fontSize:13,lineHeight:21}}>Admin note: {note}</Text></View>}</View>;
}
const s=StyleSheet.create({card:{padding:18,borderWidth:1,borderRadius:18,marginVertical:10},symbol:{height:44,width:44,borderRadius:22,borderWidth:1,alignItems:'center',justifyContent:'center'},button:{minHeight:52,borderWidth:1,borderRadius:14,padding:15,justifyContent:'center',marginVertical:7},note:{borderTopWidth:1,borderColor:'#00000012',marginTop:12,paddingTop:12}});
