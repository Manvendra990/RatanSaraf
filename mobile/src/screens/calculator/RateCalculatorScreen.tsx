import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants/theme';
import { calculateJewellery } from '../../utils/jewelleryCalculator';

const purities = [{ label: 'GOLD 22 KT (916)', fineness: 916 }, { label: 'GOLD 18 KT (750)', fineness: 750 }, { label: 'GOLD 14 KT (585)', fineness: 585 }, { label: 'GOLD 9 KT (375)', fineness: 375 }];
const empty = { rate: '', weight: '', makingPercent: '', discountPercent: '', diamond: '', other: '', gstPercent: '3' };
const money = (v: number) => '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function RateCalculatorScreen() {
  const [purity, setPurity] = useState(0);
  const [fields, setFields] = useState({ ...empty });
  const [result, setResult] = useState<ReturnType<typeof calculateJewellery> | null>(null);
  const change = (key: keyof typeof empty, value: string) => { setFields(f => ({ ...f, [key]: value })); setResult(null); };
  const field = (key: keyof typeof empty, label: string) => <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} keyboardType="decimal-pad" value={fields[key]} onChangeText={v => change(key, v)} placeholder="0.00" maxLength={14} placeholderTextColor={colors.muted} /></View>;
  const run = () => {
    try {
      if (Object.values(fields).some(v => v.trim() && !/^\d+(\.\d*)?$/.test(v.trim()))) throw new Error('Use numbers only, without commas or currency symbols.');
      setResult(calculateJewellery(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, Number(v)])) as Parameters<typeof calculateJewellery>[0]));
    } catch (e) { Alert.alert('Check values', e instanceof Error ? e.message : 'Invalid values'); }
  };
  const row = (label: string, value: string) => <View style={s.row}><Text style={s.rowLabel}>{label}</Text><Text style={s.value}>{value}</Text></View>;
  return <Screen>
    <Text style={s.title}>Jewellery Rate Calculator</Text>
    <Text style={s.label}>Choose Your Karat Value (KT)</Text>
    <View style={s.grid}>{purities.map((p, i) => <Pressable key={p.fineness} accessibilityRole="radio" accessibilityState={{ checked: purity === i }} onPress={() => { setPurity(i); change('rate', ''); }} style={s.option}><Text style={s.optionText}>{purity === i ? '◉' : '○'}  {p.label}</Text></Pressable>)}</View>
    <Text style={s.note}>Enter the store's current per-gram rate for {purities[purity].label}. Rates are entered manually; no fixed or live rate is assumed.</Text>
    {field('rate', 'Selected purity rate (₹ / gram)*')}
    <View style={s.pair}>{field('weight', 'Weight (grams)*')}{field('makingPercent', 'Making charges (%)')}</View>
    <View style={s.pair}>{field('diamond', 'Diamond charges (₹)')}{field('other', 'Other charges (₹)')}</View>
    <View style={s.pair}>{field('discountPercent', 'Making discount (%)')}{field('gstPercent', 'GST (%)')}</View>
    <View style={s.pair}><View style={{ flex: 1 }}><Button title="Reset" variant="secondary" onPress={() => { setFields({ ...empty }); setPurity(0); setResult(null); }} /></View><View style={{ flex: 1 }}><Button title="Calculate" onPress={run} /></View></View>
    <View style={s.card}>
      {row('GOLD Weight', `${result?.weight ?? 0} g`)}
      {row('GOLD Weight Amount', money(result?.gold ?? 0))}
      {row('Making Charges', money(result?.making ?? 0))}
      {row('Diamond Charges', money(result?.diamond ?? 0))}
      {row('Other Charges', money(result?.other ?? 0))}
      {row('Making Charges Disc.', '− ' + money(result?.discount ?? 0))}
      {row('GST' + (result ? ` (${result.gstPercent}%)` : ''), money(result?.gst ?? 0))}
      <View style={s.total}><Text style={s.optionText}>Payable Amount</Text><Text style={s.optionText}>{money(result?.total ?? 0)}</Text></View>
    </View>
    <Text style={s.note}>Estimate only. Discount applies to making charges. GST applies to gold + discounted making + diamond + other charges. The editable 3% default is an estimate assumption; confirm the applicable rate and final invoice with the store.</Text>
  </Screen>;
}
const s = StyleSheet.create({
  title: { color: colors.ink, fontSize: 23, fontWeight: '700', marginBottom: 20 },
  label: { color: colors.ink, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 10 },
  option: { width: '48%', minHeight: 82, backgroundColor: colors.maroon, borderRadius: 10, padding: 14, justifyContent: 'center' },
  optionText: { color: colors.goldLight, fontWeight: '700', fontSize: 16 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 20, marginVertical: 14 },
  pair: { flexDirection: 'row', gap: 12 }, field: { flex: 1, marginBottom: 14 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.paper, padding: 12, minHeight: 50, color: colors.ink, fontSize: 17 },
  card: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, borderRadius: 12, overflow: 'hidden', marginTop: 16 },
  row: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: colors.ink, flex: 1, fontSize: 15 }, value: { color: colors.ink, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  total: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, padding: 16, backgroundColor: colors.maroon, flexWrap: 'wrap' },
});
