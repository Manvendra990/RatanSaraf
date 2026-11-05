import React,{useCallback} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Button,Caption,Heading,Screen} from '../../components/ui';
import {useNotifications} from '../../context/NotificationContext';
import {useAuth} from '../../context/AuthContext';
import {colors} from '../../constants/theme';
const amount=(value:string)=>{const n=BigInt(value);return '₹'+(n/100n).toLocaleString('en-IN')+'.'+(n%100n).toString().padStart(2,'0');};
export function NotificationsScreen(){
 const n=useNotifications(),{user}=useAuth();
 useFocusEffect(useCallback(()=>{void n.refresh();},[n.refresh]));
 const run=(fn:()=>Promise<void>)=>void fn().catch(e=>Alert.alert('Unable to update notifications',e.message));
 return <Screen><Heading>Notifications</Heading><Caption>Store rate updates · ₹ per gram</Caption>{!user?<Caption>Sign in to view your notifications.</Caption>:<><View style={s.tools}><Caption>{n.unreadCount} unread</Caption><Pressable onPress={()=>run(n.markAll)} accessibilityRole="button"><Text style={s.action}>Mark all read</Text></Pressable></View><Button title={n.loading?'Refreshing…':'Refresh'} variant="secondary" onPress={()=>run(n.refresh)}/>{!!n.error&&<Text style={{color:colors.red}}>{n.error}</Text>}{!n.items.length&&!n.loading&&<View style={s.card}><Caption>No rate updates yet. New updates appear when the admin changes a Gold or Silver price.</Caption></View>}{n.items.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.metal} rate ${amount(item.amountPaise)} per gram, ${item.isRead?'read':'unread'}`} onPress={()=>!item.isRead&&run(()=>n.mark(item.id))} style={[s.card,!item.isRead&&s.unread]}><View style={s.tools}><Text style={s.title}>{item.metal} rate updated</Text>{!item.isRead&&<View style={s.dot}/>}</View><Text style={s.price}>{amount(item.amountPaise)} <Text style={{fontSize:13}}>/ gram</Text></Text><Caption>{new Date(item.createdAt).toLocaleString()}</Caption></Pressable>)}{n.nextCursor&&<Button title="Load older updates" variant="secondary" onPress={()=>run(n.more)}/>}</>}</Screen>;
}
const s=StyleSheet.create({tools:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,marginVertical:8},action:{color:colors.maroon,fontWeight:'700',fontSize:12},card:{padding:16,borderRadius:14,borderWidth:1,borderColor:colors.line,backgroundColor:colors.paper,marginVertical:6},unread:{backgroundColor:'#FFF8E4',borderColor:colors.gold},dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.gold},title:{fontSize:14,fontWeight:'700',color:colors.maroon},price:{fontSize:21,fontWeight:'700',color:colors.ink,marginVertical:5}});
