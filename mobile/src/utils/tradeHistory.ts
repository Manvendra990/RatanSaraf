export type HistoryFilter='All'|'Buy'|'Sell';
export type TradeRow={id:string;metal?:string;grams:string;amountPaise:string;createdAt:string;status:string;note?:string;reference?:string;payoutReference?:string;bankName?:string;accountLast4?:string;ifsc?:string;tradeType:'Buy'|'Sell';legacy?:boolean};
/** Pending sells belong in history immediately, before the completed-only ledger. */
export function tradeHistory(data:any,metal:'Gold'|'Silver',filter:HistoryFilter='All'):TradeRow[]{
 const all:TradeRow[]=[...(data?.purchases||[]).map((p:any)=>({...p,tradeType:'Buy'})),...(data?.payments||[]).map((p:any)=>({...p,metal:p.metal||'Gold',tradeType:'Buy',legacy:true})),...(data?.sales||[]).map((p:any)=>({...p,tradeType:'Sell'}))];
 return all.filter(p=>(p.metal||'Gold')===metal&&(filter==='All'||p.tradeType===filter)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()||a.id.localeCompare(b.id));
}
