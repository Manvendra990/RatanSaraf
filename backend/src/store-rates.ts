import { rows } from './db';
/** One authoritative store rate. Historic quotes and transaction amounts stay immutable. */
export async function currentStoreRates(){
 const rates=await rows('SELECT r.* FROM rate_publications p JOIN rates r ON r.id=p.rateId ORDER BY p.metal');
 return rates.map(rate=>({...rate,sellPaise:rate.buyPaise,pricingPolicy:'SINGLE_STORE_RATE'}));
}
