/** Integer paisa and whole purchase grams: exact arithmetic, no floating point. */
export function directPurchaseAmount(grams:number,buyPaise:bigint){
 if(!Number.isSafeInteger(grams)||grams<1||grams>10000||buyPaise<=0n)throw new Error('Invalid grams or rate');
 return BigInt(grams)*buyPaise;
}
