import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useRootNavigation} from '../../hooks/useRootNavigation';
import {useNotifications} from '../../context/NotificationContext';
import {colors} from '../../constants/theme';
import {AppIcon} from './AppIcon';
export function HeaderActions(){
 const navigation=useRootNavigation(),{unreadCount}=useNotifications();
 return <View style={s.row}>{([{name:'heart',label:'Wishlist',route:'Wishlist'},{name:'cart',label:'Cart',route:'Cart'},{name:'bell',label:'Notifications',route:'Notifications'}] as const).map(x=><Pressable key={x.route} accessibilityRole="button" accessibilityLabel={x.label==='Notifications'?`Notifications, ${unreadCount} unread`:x.label} onPress={()=>navigation.navigate(x.route)} style={s.button}><AppIcon name={x.name} size={22} color={colors.goldLight}/>{x.route==='Notifications'&&unreadCount>0&&<View style={s.badge}><Text style={s.count}>{unreadCount>99?'99+':unreadCount}</Text></View>}</Pressable>)}</View>;
}
const s=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:1},button:{minWidth:38,minHeight:44,alignItems:'center',justifyContent:'center'},badge:{position:'absolute',right:0,top:2,backgroundColor:'#B3261E',borderRadius:10,minWidth:17,height:17,paddingHorizontal:3,alignItems:'center',justifyContent:'center'},count:{color:'#fff',fontSize:9,fontWeight:'800'}});
