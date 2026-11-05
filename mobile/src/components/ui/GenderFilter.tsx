import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text} from 'react-native';
import type {Gender} from '../../types';
import {colors} from '../../constants/theme';
export function GenderFilter({value,onChange}:{value:Gender|'All';onChange:(value:Gender|'All')=>void}){
 return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{(['All','Men','Women','Unisex','Children'] as const).map(g=><Pressable key={g} accessibilityRole="button" accessibilityLabel={`Show ${g} jewellery`} accessibilityState={{selected:value===g}} onPress={()=>onChange(g)} style={[s.chip,value===g&&s.active]}><Text style={{color:value===g?colors.onDark:colors.maroon,fontSize:12,fontWeight:'700'}}>{g}</Text></Pressable>)}</ScrollView>;
}
const s=StyleSheet.create({row:{gap:7,paddingVertical:12},chip:{minHeight:40,paddingHorizontal:14,paddingVertical:11,borderRadius:20,borderWidth:1,borderColor:colors.line,backgroundColor:colors.paper},active:{backgroundColor:colors.maroon,borderColor:colors.maroon}});
