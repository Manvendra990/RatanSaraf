import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useCatalog} from '../../context/CatalogContext';
import {STORE} from '../../constants/store';
import {colors} from '../../constants/theme';
import {Logo} from './Logo';
export function HeaderBrand({onMenuPress}:{onMenuPress:()=>void}){
 useCatalog();return <View style={s.row}><Pressable onPress={onMenuPress} accessibilityRole="button" accessibilityLabel="Open sidebar" style={s.menu}><View style={s.bar}/><View style={s.bar}/><View style={s.bar}/></Pressable><Logo width={32}/><Text style={s.name} numberOfLines={2}>{STORE.name}</Text></View>;
}
const s=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:6,maxWidth:210},menu:{width:32,height:44,alignItems:'center',justifyContent:'center',gap:5},bar:{width:21,height:2,borderRadius:2,backgroundColor:colors.goldLight},name:{flexShrink:1,fontSize:11,lineHeight:15,fontWeight:'700',color:colors.goldLight,maxWidth:105}});
