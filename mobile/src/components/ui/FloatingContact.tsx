import React,{useEffect,useRef,useState} from 'react';
import {Alert,Animated,Keyboard,Linking,Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useCatalog} from '../../context/CatalogContext';
import {STORE} from '../../constants/store';
import {colors} from '../../constants/theme';
import {AppIcon,type IconName} from './AppIcon';
function phone(value:string){const d=value.replace(/\D/g,'');return d.length===10?'91'+d:d;}
export function FloatingContact(){
 useCatalog();const insets=useSafeAreaInsets(),[open,setOpen]=useState(false),[keyboard,setKeyboard]=useState(false),progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const a=Keyboard.addListener('keyboardDidShow',()=>setKeyboard(true)),b=Keyboard.addListener('keyboardDidHide',()=>setKeyboard(false));return()=>{a.remove();b.remove();};},[]);
 useEffect(()=>{Animated.timing(progress,{toValue:open?1:0,duration:200,useNativeDriver:true}).start();},[open]);
 const bottom=insets.bottom+74;
 const links:{name:string;icon:IconName;color:string;url:string}[]=[
  {name:'Call',icon:'phone',color:'#B7780B',url:STORE.phone?'tel:+'+phone(STORE.phone):''},
  {name:'WhatsApp',icon:'whatsapp',color:'#159947',url:STORE.whatsapp?'https://wa.me/'+phone(STORE.whatsapp):''},
  {name:'Facebook',icon:'facebook',color:'#1877F2',url:STORE.facebook},
  {name:'Instagram',icon:'instagram',color:'#C13584',url:STORE.instagram},
  {name:'YouTube',icon:'youtube',color:'#E02020',url:STORE.youtube},
  {name:'Directions',icon:'map',color:'#3475BA',url:STORE.googleMaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.mapQuery)}`},
 ];
 async function go(url:string){setOpen(false);if(!url){Alert.alert('Contact unavailable','The store has not configured this contact link yet.');return;}try{if(!/^(https?:\/\/|tel:)/.test(url))throw new Error();await Linking.openURL(url);}catch{Alert.alert('Unable to open','Please check that the required app is available on your device.');}}
 const toggle=<Pressable accessibilityRole="button" accessibilityLabel={open?'Close contact options':'Open contact options'} accessibilityState={{expanded:open}} style={s.toggle} onPress={()=>setOpen(v=>!v)}><AppIcon name={open?'close':'contact'} size={25} color={colors.goldLight}/></Pressable>;
 if(keyboard&&!open)return null;
 return <><View style={[s.anchor,{bottom}]}>{toggle}</View><Modal visible={open} transparent animationType="none" onRequestClose={()=>setOpen(false)}><Pressable accessibilityRole="button" accessibilityLabel="Close contact menu" onPress={()=>setOpen(false)} style={s.backdrop}/><Animated.View style={[s.panel,{bottom:bottom+64,top:insets.top+55,opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[20,0]})}]}]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow:1,justifyContent:'flex-end',gap:10,paddingVertical:4}}>{links.map(x=><Pressable key={x.name} accessibilityRole="button" accessibilityLabel={x.name} onPress={()=>void go(x.url)} style={s.item}><Text style={s.label}>{x.name}</Text><View style={[s.circle,{backgroundColor:x.color,opacity:x.url?1:0.55}]}><AppIcon name={x.icon} size={25} color="#fff"/></View></Pressable>)}</ScrollView></Animated.View><View style={[s.anchor,{bottom}]}>{toggle}</View></Modal></>;
}
const s=StyleSheet.create({anchor:{position:'absolute',right:18},toggle:{width:52,height:52,borderRadius:26,backgroundColor:colors.maroon,borderWidth:1,borderColor:colors.gold,alignItems:'center',justifyContent:'center',elevation:5,shadowColor:'#000',shadowOpacity:0.15,shadowRadius:6},backdrop:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#00000088'},panel:{position:'absolute',right:18,width:176},item:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:10},circle:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center'},label:{backgroundColor:colors.paper,color:colors.maroon,fontSize:12,fontWeight:'700',paddingVertical:7,paddingHorizontal:11,borderRadius:9}});
