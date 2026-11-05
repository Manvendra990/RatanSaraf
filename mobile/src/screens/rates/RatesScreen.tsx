import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import {
  Button,
  Caption,
  Heading,
  MetalToggle,
  Screen,
  Subheading,
} from "../../components/ui";

import { colors, radius, shadow } from "../../constants/theme";
import type { RootStack } from "../../navigation/types";
import type { Metal } from "../../types";
import { inr } from "../../utils/format";

import {
  getMetalHistory,
  type HistoryPoint,
} from "../../services/metalHistory";
import { messageOf, quoteTime } from "../../services/metalPrices";
import { useStoreRates } from "../../hooks/useStoreRates";
import { useMetalPrices } from "../../hooks/useMetalPrices";
import {
  dayLabel,
  MetalPriceChart,
  usd,
} from "../../components/MetalPriceChart";

export function RatesScreen() {
  const route = useRoute<RouteProp<RootStack, "Rates">>();
  const [metal, setMetal] = useState<Metal>(route.params?.metal ?? "Gold");
  const [days, setDays] = useState<7 | 14 | 30>(30);
  const prices = useMetalPrices();
  const store = useStoreRates();
  const storeRate = store.rates.find((r) => r.metal === metal);
  const [history, setHistory] = useState<{
    key: string;
    points: HistoryPoint[];
  } | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const key = `${metal}-${days}`;
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setChartLoading(true);
    setChartError(null);
    getMetalHistory(metal, days, controller.signal)
      .then((points) => {
        if (active) setHistory({ key: `${metal}-${days}`, points });
      })
      .catch((e) => {
        if (active) setChartError(messageOf(e));
      })
      .finally(() => {
        if (active) setChartLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [metal, days, retry]);
  const rate = prices.data?.[metal];
  const values = history?.key === key ? history.points : [];
  const first = values[0],
    last = values[values.length - 1];
  const change = first && last ? (last.close / first.close - 1) * 100 : null;
  const accent = metal === "Gold" ? colors.gold : "#718096";
  const high = values.length
    ? Math.max(...values.map((p) => p.high ?? p.close))
    : null;
  const low = values.length
    ? Math.min(...values.map((p) => p.low ?? p.close))
    : null;
  return (
    <Screen>
      <Heading>Gold & Silver Rates</Heading>
      <MetalToggle value={metal} onChange={setMetal} />
      <View style={[styles.card, { backgroundColor: colors.maroon }]}>
        <Text style={{ color: colors.onDark, fontSize: 12, fontWeight: "700" }}>
          CURRENT STORE {metal.toUpperCase()} RATE
        </Text>
        <Text style={[styles.value, { color: colors.onDark }]}>
          {storeRate ? inr(Number(storeRate.buyPaise) / 100) : "—"}{" "}
          <Text style={styles.unit}>/ gram</Text>
        </Text>
        <Text style={{ color: colors.onDark, marginTop: 10 }}>
          One rate for buy, sell & current value
        </Text>
        {storeRate && (
          <Text style={{ color: colors.onDark, fontSize: 11, marginTop: 8 }}>
            Updated {new Date(storeRate.createdAt).toLocaleString()}
          </Text>
        )}
        {!!store.error && (
          <Text style={{ color: "#FFD8CE", marginTop: 10 }}>
            {store.error} · Last received rate may be outdated.
          </Text>
        )}
        <Button
          title={store.loading ? "Refreshing…" : "Refresh Store Rate"}
          variant="secondary"
          onPress={() => void store.refresh().catch(() => {})}
        />
      </View>
      <View style={styles.card}>
        <Caption>OROPOCKET · BUY RATE · INR/GRAM</Caption>
        <Text style={styles.value}>
          {rate ? inr(rate.buy) : "—"} <Text style={styles.unit}>/ gram</Text>
        </Text>
        <Caption>Before GST · Provider quote</Caption>
        {rate && (
          <>
            {rate.change24h !== null && (
              <Text
                style={[
                  styles.change,
                  { color: rate.change24h >= 0 ? "#247457" : colors.red },
                ]}
              >
                {rate.change24h >= 0 ? "+" : ""}
                {rate.change24h.toFixed(2)}% buy rate · 24h
              </Text>
            )}
            <View style={styles.stats}>
              <View style={styles.flex}>
                <Caption>Sell / gram</Caption>
                <Text style={styles.stat}>{inr(rate.sell)}</Text>
              </View>
              <View style={styles.flex}>
                <Caption>Buy incl. GST / gram</Caption>
                <Text style={styles.stat}>{inr(rate.buyWithGst)}</Text>
              </View>
            </View>
          </>
        )}
        {prices.loading && (
          <ActivityIndicator
            color={colors.gold}
            style={{ marginVertical: 8 }}
          />
        )}
        {prices.data && (
          <Caption>
            Updated {quoteTime(prices.data.timestamp)}
            {prices.stale ? " · Quote older than 5 min" : ""}
          </Caption>
        )}
        {prices.error && (
          <Text style={styles.error}>
            {prices.error}
            {rate ? " Showing last received quote." : ""}
          </Text>
        )}
        <Button
          title={prices.loading ? "Refreshing…" : "Refresh Rates"}
          variant="secondary"
          onPress={() => {
            if (!prices.loading) void prices.refresh();
          }}
        />
      </View>
      <View style={styles.card}>
        <Subheading style={{ marginTop: 0 }}>
          {metal} International Trend
        </Subheading>
        <Caption>Daily spot prices · USD per gram</Caption>
        <View style={styles.ranges}>
          {([7, 14, 30] as const).map((d) => (
            <TouchableOpacity
              key={d}
              accessibilityRole="button"
              accessibilityState={{ selected: days === d }}
              onPress={() => setDays(d)}
              style={[
                styles.range,
                days === d && { backgroundColor: colors.maroon },
              ]}
            >
              <Text
                style={{
                  color: days === d ? colors.goldLight : colors.maroon,
                  fontWeight: "700",
                }}
              >
                {d}D
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {chartLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={accent} />
            <Caption>Loading historical prices…</Caption>
          </View>
        ) : chartError ? (
          <View style={styles.empty}>
            <Text style={styles.error}>{chartError}</Text>
            <Button
              title="Retry Chart"
              variant="secondary"
              onPress={() => setRetry((r) => r + 1)}
            />
          </View>
        ) : values.length === 0 ? (
          <View style={styles.empty}>
            <Caption>No prices returned for this date range.</Caption>
          </View>
        ) : (
          <>
            <Text style={styles.chartValue}>
              {usd(last.close)} <Text style={styles.unit}>/ gram</Text>
            </Text>
            <Text
              style={[
                styles.change,
                { color: (change ?? 0) >= 0 ? "#247457" : colors.red },
              ]}
            >
              {values.length > 1
                ? `${(change ?? 0) >= 0 ? "+" : ""}${change!.toFixed(2)}% · first to last displayed close`
                : "One observation · period change unavailable"}
            </Text>
            <MetalPriceChart data={values} accent={accent} />
            <View style={styles.stats}>
              <View style={styles.flex}>
                <Caption>Period high</Caption>
                <Text style={styles.stat}>{usd(high!)}</Text>
              </View>
              <View style={styles.flex}>
                <Caption>Period low</Caption>
                <Text style={styles.stat}>{usd(low!)}</Text>
              </View>
            </View>
            <Caption>
              {dayLabel(first.date)} – {dayLabel(last.date)} · {values.length}{" "}
              observations
            </Caption>
            {values.some((p) => p.provisional) && (
              <Caption>
                Includes a provisional, still-forming daily bar.
              </Caption>
            )}
          </>
        )}
      </View>
      <Caption style={{ marginTop: 16 }}>
        Current quotes: OroPocket. Historical spot prices: goldprice.dev. These
        are different feeds; the chart does not show OroPocket buy prices or MCX
        rates.
      </Caption>
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 20,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 16,
    ...shadow,
  },
  value: {
    fontSize: 29,
    color: colors.maroon,
    fontWeight: "700",
    marginTop: 8,
  },
  unit: { fontSize: 13, fontWeight: "400" },
  chartValue: {
    fontSize: 26,
    color: colors.maroon,
    fontWeight: "700",
    marginTop: 8,
  },
  stats: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  flex: { flex: 1 },
  stat: { fontSize: 16, fontWeight: "700", color: colors.maroon, marginTop: 4 },
  change: { fontSize: 12, marginTop: 8 },
  error: { color: colors.red, marginVertical: 10, fontSize: 12 },
  ranges: { flexDirection: "row", gap: 8, marginTop: 16 },
  range: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  empty: { paddingVertical: 40, gap: 12 },
});
