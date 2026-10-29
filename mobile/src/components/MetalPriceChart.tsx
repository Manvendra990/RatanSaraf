import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';
import type { HistoryPoint } from '../services/metalHistory';
import { colors } from '../constants/theme';

export const usd = (n: number) => `$${n.toFixed(2)}`;
export const dayLabel = (date: string) => new Date(date).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short' });
export function MetalPriceChart({ data, accent }: { data: HistoryPoint[]; accent: string }) {
  const [selected, setSelected] = useState(data.length - 1);
  const [width, setWidth] = useState(1);
  useEffect(() => setSelected(data.length - 1), [data]);
  if (!data.length) return <Text>No historical observations available for this range.</Text>;
  const W = 360, H = 225, left = 53, right = 345, top = 12, bottom = 182;
  const low = Math.min(...data.map(p => p.close)), high = Math.max(...data.map(p => p.close));
  const pad = Math.max((high - low) * 0.16, high * 0.002);
  const min = low - pad, max = high + pad;
  const first = Date.parse(data[0].date), last = Date.parse(data[data.length - 1].date);
  const x = (p: HistoryPoint) => first === last ? (left + right) / 2 : left + (Date.parse(p.date) - first) / (last - first) * (right - left);
  const y = (p: HistoryPoint) => bottom - (p.close - min) / (max - min) * (bottom - top);
  const line = data.map((p, i) => `${i ? 'L' : 'M'} ${x(p)} ${y(p)}`).join(' ');
  const area = `${line} L ${x(data[data.length - 1])} ${bottom} L ${x(data[0])} ${bottom} Z`;
  const active = data[Math.min(selected, data.length - 1)];
  const choose = (localX: number) => {
    const target = localX / Math.max(width, 1) * W;
    let nearest = 0;
    data.forEach((p, i) => { if (Math.abs(x(p) - target) < Math.abs(x(data[nearest]) - target)) nearest = i; });
    setSelected(nearest);
  };
  const indices = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])];
  return (
    <View>
      <View style={styles.detail} accessibilityLiveRegion="polite">
        <Text style={styles.date}>{dayLabel(active.date)} · {active.provisional ? 'In progress' : 'Daily close'}</Text>
        <Text style={[styles.price, { color: accent }]}>{usd(active.close)} / gram</Text>
      </View>
      <View onLayout={e => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={e => choose(e.nativeEvent.locationX)}
        onResponderMove={e => choose(e.nativeEvent.locationX)}
        accessible accessibilityRole="adjustable" accessibilityLabel="Historical price chart"
        accessibilityValue={{ min: 0, max: data.length - 1, now: selected, text: `${dayLabel(active.date)}, ${usd(active.close)} per gram` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={e => setSelected(i => Math.max(0, Math.min(data.length - 1, i + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs><LinearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={accent} stopOpacity={0.25} /><Stop offset="1" stopColor={accent} stopOpacity={0.02} /></LinearGradient></Defs>
          {[0, 1, 2, 3].map(i => {
            const level = min + (max - min) * i / 3, yy = bottom - i / 3 * (bottom - top);
            return <React.Fragment key={i}><Line x1={left} x2={right} y1={yy} y2={yy} stroke={colors.line} strokeDasharray="4 5" /><SvgText x={left - 8} y={yy + 4} textAnchor="end" fill={colors.maroon} fontSize={10}>{usd(level)}</SvgText></React.Fragment>;
          })}
          <Path d={area} fill="url(#priceFill)" />
          <Path d={line} stroke={accent} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" fill="none" />
          <Line x1={x(active)} x2={x(active)} y1={top} y2={bottom} stroke={accent} strokeDasharray="3 4" strokeOpacity={0.6} />
          <Circle cx={x(active)} cy={y(active)} r={6} fill={accent} stroke={colors.paper} strokeWidth={3} />
          {indices.map((i, j) => <SvgText key={i} x={x(data[i])} y={207} textAnchor={j === 0 && indices.length > 1 ? 'start' : j === indices.length - 1 && indices.length > 1 ? 'end' : 'middle'} fontSize={11} fill={colors.maroon}>{dayLabel(data[i].date)}</SvgText>)}
        </Svg>
      </View>
      <Text style={styles.hint}>Touch or drag to explore daily prices · USD/gram · Dates in UTC</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  detail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginVertical: 14 },
  date: { color: colors.maroon, fontSize: 12 }, price: { fontWeight: '700', fontSize: 16 },
  hint: { color: colors.maroon, opacity: 0.65, fontSize: 11, textAlign: 'center' },
});
