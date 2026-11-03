export const DEFAULT_STORE = {
    name: 'Ratan Lal Saraf', ownerName: 'Ratan Lal Saraf', tagline: 'Timeless Beauty For Your Special Moments', descriptor: 'JEWELLERS',
    addressLine1: 'Daulat Ganj', city: 'Gwalior', state: 'Madhya Pradesh', pincode: '474001',
    mapQuery: 'RATAN LAL SARAF GWALIOR, Daulat Ganj, Gwalior, Madhya Pradesh 474001',
    latitude: 26.2014464, longitude: 78.1506222, whatsapp: '', phone: ''
};
export const CATEGORIES = {
    Gold: ['Necklaces', 'Earrings', 'Rings', 'Bangles', 'Chains', 'Pendants', 'Mangalsutra', 'Bracelets'],
    Silver: ['Jewellery', 'Rings', 'Bracelets', 'Anklets', 'Chains', 'Coins', 'Pooja Items', 'Gifts']
};
export const COIN_WEIGHTS = [0.5, 1, 10, 20, 50];
const sample = [
    { id: 'RG-001', name: 'Traditional Gold Necklace', metal: 'Gold', category: 'Necklaces', price: 145000, weight: '18.5 grams', purity: '22K (916)', image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=900', description: 'Elegant traditional jewellery, crafted for special occasions.' },
    { id: 'RG-002', name: 'Temple Gold Necklace', metal: 'Gold', category: 'Necklaces', price: 192000, weight: '24 grams', purity: '22K (916)', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900', description: 'A statement necklace inspired by temple jewellery.' },
    { id: 'RG-003', name: 'Designer Gold Ring', metal: 'Gold', category: 'Rings', price: 38500, weight: '5.1 grams', purity: '22K (916)', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900', description: 'Fine detailing in a graceful designer ring.' },
    { id: 'RG-004', name: 'Gold Earrings', metal: 'Gold', category: 'Earrings', price: 48000, weight: '6.2 grams', purity: '22K (916)', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900', description: 'Classic earrings for every celebration.' },
    { id: 'RG-005', name: 'Gold Bangles', metal: 'Gold', category: 'Bangles', price: 88000, weight: '12 grams', purity: '22K (916)', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900', description: 'Traditional gold bangles with a timeless silhouette.' },
    { id: 'RG-006', name: 'Silver Ring', metal: 'Silver', category: 'Rings', price: 2800, weight: '14 grams', purity: '925 Sterling', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900', description: 'A polished silver ring for everyday elegance.' },
    { id: 'RG-007', name: 'Silver Bracelet', metal: 'Silver', category: 'Bracelets', price: 4300, weight: '28 grams', purity: '925 Sterling', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900', description: 'A refined silver bracelet.' },
    { id: 'RG-008', name: 'Silver Chain', metal: 'Silver', category: 'Chains', price: 3600, weight: '22 grams', purity: '925 Sterling', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900', description: 'A clean and minimal silver chain.' }
];
const DEMO_GRAM_RATES = { Gold: 7250, Silver: 85 };
export const SAMPLE_PRODUCTS = [
    ...sample,
    ...['Gold', 'Silver'].flatMap(metal => COIN_WEIGHTS.map(weight => ({
        id: `RG-COIN-${metal.toUpperCase()}-${weight}`, name: `${metal} Coin ${weight}g`, metal,
        category: 'Coins', coinWeight: weight, price: Math.round(DEMO_GRAM_RATES[metal] * weight),
        weight: `${weight} grams`, purity: metal === 'Gold' ? '24K (999)' : '999 Fine Silver', image: '',
        description: `${weight} gram ${metal.toLowerCase()} coin. Sample product only; confirm stock, purity and final pricing with the store.`
    })))
];
export const inr = (amount, digits = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(amount || 0);
export const paise = (amount) => inr(Number(amount || 0) / 100, 2);
export const grams = (amount) => `${(Number(amount || 0) / 1e6).toFixed(6)} g`;
export const storeAddress = (store) => `${store.addressLine1}, ${store.city}, ${store.state} ${store.pincode}`;
export const directions = (store) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapQuery || storeAddress(store))}`;
export const prettyTime = (value) => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' IST';
export function calculateJewellery(x) {
    if (Object.values(x).some(v => !Number.isFinite(v) || v < 0) || x.rate <= 0 || x.weight <= 0 || x.discountPercent > 100 || x.makingPercent > 100 || x.gstPercent > 100 || x.rate > 1e7 || x.weight > 1e5 || x.diamond > 1e8 || x.other > 1e8)
        throw new Error('Enter a positive rate and weight. Percentages must be 0–100.');
    const round = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
    const gold = round(x.rate * x.weight), making = round(gold * x.makingPercent / 100), discount = round(making * x.discountPercent / 100);
    const subtotal = round(gold + making - discount + x.diamond + x.other), gst = round(subtotal * x.gstPercent / 100);
    return { ...x, gold, making, discount, subtotal, gst, total: round(subtotal + gst) };
}
