
import React, { useEffect, useState } from "react";
import {
  AppState,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

import {
  Button,
  Caption,
  Grid,
  ListRow,
  ProductCard,
  Screen,
  Subheading,
} from "../../components/ui";

import { STORE, fullAddress } from "../../constants/store";
import { colors } from "../../constants/theme";
import { useCatalog } from "../../context/CatalogContext";
import { useRootNavigation } from "../../hooks/useRootNavigation";
import { quoteTime } from "../../services/metalPrices";
import { inr } from "../../utils/format";
import { useStoreRates } from '../../hooks/useStoreRates';
import { useMetalPrices } from "../../hooks/useMetalPrices";

const goldSipKycBanner = require(
  "../../assets/images/gold-sip-kyc-banner.png"
);

// Get actual bundled image dimensions.
const bannerAsset = Image.resolveAssetSource(goldSipKycBanner);

const BANNER_ASPECT_RATIO =
  bannerAsset && typeof bannerAsset.width === "number" && typeof bannerAsset.height === "number" && bannerAsset.width > 0 && bannerAsset.height > 0
    ? bannerAsset.width / bannerAsset.height
    : 947 / 450;

const HORIZONTAL_PADDING = 18;

export function HomeScreen() {
  const {
    products,
    homeError,
    error: catalogError,
    refresh: refreshCatalog,
  } = useCatalog();

  const navigation = useRootNavigation();
  const storePrices=useStoreRates();
  const focused = useIsFocused();

  const {
    data,
    loading,
    error,
    stale,
    refresh,
  } = useMetalPrices();

  const [metal, setMetal] = useState<"Gold" | "Silver">(
    "Gold"
  );


  // Automatically switch between gold and silver.
  useEffect(() => {
    if (!focused) {
      return;
    }

    const timer = setInterval(() => {
      if (AppState.currentState !== "active") {
        return;
      }

      setMetal((current) =>
        current === "Gold" ? "Silver" : "Gold"
      );
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, [focused]);

  // Store rates.
  const storeRate = storePrices.rates.find(
    (rate: any) => rate.metal === metal
  );

  // Filter gold jewellery.
  const jewellery = products.filter(
    (product) =>
      product.metal === "Gold" &&
      !product.coinWeight &&
      product.category !== "Coins"
  );

  // Featured products first.
  const featured = [
    ...jewellery.filter((product) => product.featured),
    ...jewellery.filter((product) => !product.featured),
  ].slice(0, 4);

  // Switch metal helper.
  const toggleMetal = () => {
    setMetal((current) =>
      current === "Gold" ? "Silver" : "Gold"
    );
  };

  // Refresh both rates and catalog.
  const handleRefreshRates = () => {
    void refresh();
    void refreshCatalog();
    void storePrices.refresh().catch(()=>{});
  };

  return (
    <Screen>
      {/* Responsive KYC promotional banner */}
  
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Open KYC"
  onPress={() => navigation.navigate("ManualKyc")}
  style={s.promoContainer}
>
  <Image
    source={goldSipKycBanner}
    resizeMode="contain"
    style={s.promoImage}
  />
</Pressable>


      {/* Metal rate card */}
      <View style={s.rates}>
        <Text style={s.rateTitle}>
          Current {metal} Rate
        </Text>

        <View style={s.rateRow}>
          {/* Previous metal */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous metal"
            onPress={toggleMetal}
            style={s.arrowButton}
          >
            <Text style={s.arrow}>‹</Text>
          </Pressable>

          {/* Live market */}
          <View style={s.column}>
            <Text style={s.subtitle}>
              Live Market
            </Text>

            <Text
              style={s.price}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.7}
            >
              {data
                ? inr(data[metal].buy)
                : "Unavailable"}

              <Text style={s.unit}> /g</Text>
            </Text>

            {/* <Text style={s.small}>
              OroPocket · Before GST
            </Text>

            <Text style={s.small}>
              Purity not supplied by feed
            </Text> */}
          </View>

          <View style={s.divider} />

          {/* Store rate */}
          <View style={s.column}>
            <Text style={s.subtitle}>
              Our Store
            </Text>

            <Text
              style={s.price}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.7}
            >
              {storeRate
                ? inr(
                    Number(storeRate.buyPaise) / 100
                  )
                : "Not published"}

              <Text style={s.unit}>
                {storeRate ? " /g" : ""}
              </Text>
            </Text>

            <Text style={s.small}>
              {storeRate ? 'Store rate · buy & sell' : 'Ask the store for a rate'}
            </Text>
          </View>

          {/* Next metal */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next metal"
            onPress={toggleMetal}
            style={s.arrowButton}
          >
            <Text style={s.arrow}>›</Text>
          </Pressable>
        </View>

        {/* <Text style={s.small}>
          Reference rates • Confirm matching purity
          and tax basis
        </Text>

        {data && (
          <Text style={s.small}>
            Market: {quoteTime(data.timestamp)}
            {stale ? " · Stale quote" : ""}
          </Text>
        )} 

        {/* Store timestamp */}
        {storeRate && (
          <Text style={s.small}>
            Store: {quoteTime(storeRate.createdAt)}
          </Text>
        )}
      </View>

      {/* Gold / Silver selection */}
      <View style={s.pagination}>
        {(["Gold", "Silver"] as const).map(
          (item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Show ${item} rates`}
              onPress={() => setMetal(item)}
            >
              <Text
                style={[
                  s.paginationText,
                  {
                    color:
                      metal === item
                        ? colors.maroon
                        : colors.muted,
                  },
                ]}
              >
                ● {item}
              </Text>
            </Pressable>
          )
        )}
      </View>

      {/* Market error */}
      {error && (
        <Caption>
          {error}
          {data
            ? " Showing last received quote."
            : ""}
        </Caption>
      )}

      {/* Store rate error */}
      {(homeError || storePrices.error) && (
        <Caption>
          Store display rates could not refresh.{" "}
          {storePrices.error || homeError}
        </Caption>
      )}

      {/* Rate action buttons */}
      <View style={s.actionRow}>
        <View style={s.actionColumn}>
          <Button
            title={
              loading
                ? "Refreshing…"
                : "Refresh Rates"
            }
            variant="secondary"
            onPress={handleRefreshRates}
          />
        </View>

        <View style={s.actionColumn}>
          <Button
            title="Price Charts"
            variant="secondary"
            onPress={() =>
              navigation.navigate("Rates", {
                metal,
              })
            }
          />
        </View>
      </View>

      {/* Jewellery heading */}
      <View style={s.section}>
        <Subheading>
          Gold Jewellery
        </Subheading>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all gold jewellery"
          onPress={() =>
            navigation.navigate("Listing", {
              metal: "Gold",
            })
          }
        >
          <Text style={s.viewAll}>
            View all ›
          </Text>
        </Pressable>
      </View>

      {/* Catalog error */}
      {catalogError && (
        <Caption>{catalogError}</Caption>
      )}

      {/* Featured jewellery */}
      {featured.length > 0 ? (
        <Grid>
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() =>
                navigation.navigate("Product", {
                  id: product.id,
                })
              }
            />
          ))}
        </Grid>
      ) : (
        <Caption>
          Gold jewellery will appear here when
          the store publishes its collection.
        </Caption>
      )}

      {/* Store information */}
      <Subheading>
        Visit Our Store
      </Subheading>

      <ListRow
        label={STORE.name}
        hint={fullAddress()}
        onPress={() =>
          navigation.navigate("StoreInfo")
        }
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  // KYC banner container

promoContainer: {
  width: "100%",
  aspectRatio: BANNER_ASPECT_RATIO,
  alignSelf: "center",
  overflow: "hidden",
  borderRadius: 12,
  marginBottom: 16,
},

promoImage: {
  width: "100%",
  height: "100%",
},

  // Pagination
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginVertical: 14,
  },

  paginationText: {
    fontWeight: "600",
  },

  // Rates card
  rates: {
    backgroundColor: colors.maroon,
    borderRadius: 16,
    padding: 11,
  },

  rateTitle: {
    color: colors.goldLight,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  rateRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 6,
  },

  column: {
    flex: 1,
    minWidth: 0,
  },

  subtitle: {
    color: colors.onDark,
    fontSize: 12,
    lineHeight: 17,
  },

  price: {
    color: colors.goldLight,
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 3,
  },

  unit: {
    fontSize: 11,
  },

  small: {
    color: colors.onDark,
    fontSize: 9,
    lineHeight: 13,
  },

  arrowButton: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 18,
    minHeight: 40,
  },

  arrow: {
    color: colors.goldLight,
    fontSize: 30,
  },

  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.goldLight,
    opacity: 0.4,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  actionColumn: {
    flex: 1,
    minWidth: 0,
  },

  // Product section
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  viewAll: {
    color: colors.maroon,
  },
});
