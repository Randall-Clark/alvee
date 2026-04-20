import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type CardTier, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");

interface CardPlan {
  tier: CardTier;
  name: string;
  price: string;
  priceNum: number;
  tagline: string;
  gradient: [string, string, ...string[]];
  textColor: string;
  accent: string;
  features: { text: string; included: boolean }[];
}

const PLANS: CardPlan[] = [
  {
    tier: "standard",
    name: "Standard",
    price: "12 $ / an",
    priceNum: 12,
    tagline: "L'essentiel pour commencer",
    gradient: ["#3A3A3A", "#1A1A1A"],
    textColor: "#FFFFFF",
    accent: "#888888",
    features: [
      { text: "Entrée QR ou NFC à tous les événements", included: true },
      { text: "Remboursement 24h à l'avance", included: true },
      { text: "Accumulation de points", included: true },
      { text: "Walk-in sans billet préalable", included: false },
      { text: "Accès événements +300 $", included: false },
      { text: "Support prioritaire", included: false },
    ],
  },
  {
    tier: "prime",
    name: "Prime",
    price: "60 $ / an",
    priceNum: 60,
    tagline: "Pour les habitués des événements",
    gradient: ["#E5BB58", "#A07830", "#6B4F1A"],
    textColor: "#0D0D0D",
    accent: "#FFFFFF",
    features: [
      { text: "Entrée QR ou NFC à tous les événements", included: true },
      { text: "Remboursement le jour même", included: true },
      { text: "Accumulation de points ×1.5", included: true },
      { text: "Walk-in sans billet (facturé à l'entrée)", included: true },
      { text: "Accès événements +300 $", included: true },
      { text: "Support prioritaire", included: false },
    ],
  },
  {
    tier: "platinum",
    name: "Platinum",
    price: "100 $ / an",
    priceNum: 100,
    tagline: "L'expérience ultime Alvee",
    gradient: ["#F8F8F8", "#C4C4C4", "#8A8A8A"],
    textColor: "#0D0D0D",
    accent: "#0D0D0D",
    features: [
      { text: "Entrée QR ou NFC à tous les événements", included: true },
      { text: "Remboursement le jour même", included: true },
      { text: "Accumulation de points ×2", included: true },
      { text: "Walk-in sans billet (facturé à l'entrée)", included: true },
      { text: "Accès événements +300 $", included: true },
      { text: "Support prioritaire 24/7", included: true },
    ],
  },
];

const TIER_ORDER: CardTier[] = ["none", "standard", "prime", "platinum"];

const CARD_W = Math.min(SCREEN_W - 80, 360);
const CARD_H = CARD_W * 0.62;

export default function NFCCardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, orderNFCCard, upgradeCard } = useApp();
  const [loading, setLoading] = useState<CardTier | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const currentTierIdx = TIER_ORDER.indexOf(user?.nfcCardTier ?? "none");

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== activeIdx) setActiveIdx(i);
  };

  const goToCard = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setActiveIdx(i);
  };

  const handleOrder = async (plan: CardPlan) => {
    const planIdx = TIER_ORDER.indexOf(plan.tier);
    const isUpgrade = currentTierIdx > 0 && planIdx > currentTierIdx;

    Alert.alert(
      `${isUpgrade ? "Mise à niveau" : "Commander"} — Carte ${plan.name}`,
      `${plan.price} CAD\n\nEn confirmant, le montant sera débité sur votre moyen de paiement par défaut.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setLoading(plan.tier);
            const ok = isUpgrade ? await upgradeCard(plan.tier) : await orderNFCCard(plan.tier);
            setLoading(null);
            if (ok) {
              Alert.alert("Succès !", `Carte ${plan.name} ${isUpgrade ? "activée" : "commandée"} ! Livraison sous 3-5 jours.`, [
                { text: "OK", onPress: () => router.back() }
              ]);
            }
          },
        },
      ]
    );
  };

  const renderCardVisual = (plan: CardPlan) => {
    const cardNumber = plan.tier === "standard" ? "•••• •••• •••• 0124" : plan.tier === "prime" ? "•••• •••• •••• 0260" : "•••• •••• •••• 0100";
    const holderName = user?.name?.toUpperCase() || "VOTRE NOM";

    return (
      <LinearGradient
        colors={plan.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardVisual, { width: CARD_W, height: CARD_H }]}
      >
        {/* Decorative pattern */}
        <View style={[styles.cardPattern1, { backgroundColor: plan.accent + "15" }]} />
        <View style={[styles.cardPattern2, { backgroundColor: plan.accent + "10" }]} />

        {/* Top row */}
        <View style={styles.cardTopRow}>
          <View>
            <Text style={[styles.cardBrand, { color: plan.textColor }]}>ALVEE</Text>
            <Text style={[styles.cardTier, { color: plan.textColor + "BB" }]}>
              {plan.name.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.nfcWavesBox]}>
            <Feather name="wifi" size={22} color={plan.textColor} style={{ transform: [{ rotate: "90deg" }] }} />
          </View>
        </View>

        {/* Chip */}
        <View style={[styles.chipBox, { backgroundColor: plan.accent + "30" }]}>
          <View style={[styles.chipInner, { borderColor: plan.accent + "70" }]}>
            <View style={[styles.chipLine, { backgroundColor: plan.accent + "70" }]} />
            <View style={[styles.chipLine, { backgroundColor: plan.accent + "70" }]} />
            <View style={[styles.chipLine, { backgroundColor: plan.accent + "70" }]} />
          </View>
        </View>

        {/* Card number */}
        <Text style={[styles.cardNumber, { color: plan.textColor }]}>{cardNumber}</Text>

        {/* Bottom row */}
        <View style={styles.cardBottomRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: plan.textColor + "99" }]}>TITULAIRE</Text>
            <Text style={[styles.cardHolder, { color: plan.textColor }]} numberOfLines={1}>{holderName}</Text>
          </View>
          <View>
            <Text style={[styles.cardLabel, { color: plan.textColor + "99" }]}>VALIDITÉ</Text>
            <Text style={[styles.cardExpiry, { color: plan.textColor }]}>1 AN</Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const activePlan = PLANS[activeIdx];
  const planIdx = TIER_ORDER.indexOf(activePlan.tier);
  const isCurrent = user?.nfcCardTier === activePlan.tier;
  const isUpgrade = currentTierIdx > 0 && planIdx > currentTierIdx;
  const isDowngrade = currentTierIdx > 0 && planIdx < currentTierIdx;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Feather name="x" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cartes Alvee</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}>
        {user?.nfcCardTier && user.nfcCardTier !== "none" && (
          <View style={[styles.currentBanner, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "40" }]}>
            <Feather name="credit-card" size={14} color={colors.gold} />
            <Text style={[styles.currentText, { color: colors.gold }]}>
              Carte active : <Text style={{ fontFamily: "Inter_700Bold" }}>{user.nfcCardTier.charAt(0).toUpperCase() + user.nfcCardTier.slice(1)}</Text>
            </Text>
          </View>
        )}

        {/* Tab selector */}
        <View style={styles.tabRow}>
          {PLANS.map((p, i) => (
            <Pressable
              key={p.tier}
              onPress={() => goToCard(i)}
              style={[styles.tab, activeIdx === i
                ? { backgroundColor: colors.gold }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Text style={[styles.tabText, { color: activeIdx === i ? "#0D0D0D" : colors.mutedForeground }]}>
                {p.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Carousel */}
        <FlatList
          ref={listRef}
          data={PLANS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          keyExtractor={(p) => p.tier}
          renderItem={({ item }) => (
            <View style={[styles.cardSlide, { width: SCREEN_W }]}>
              {renderCardVisual(item)}
            </View>
          )}
          style={{ flexGrow: 0 }}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {PLANS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIdx === i
                  ? { width: 24, backgroundColor: colors.gold }
                  : { width: 8, backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>

        {/* Active plan info */}
        <View style={styles.planInfo}>
          <View style={styles.planTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: colors.foreground }]}>Carte {activePlan.name}</Text>
              <Text style={[styles.planTagline, { color: colors.mutedForeground }]}>{activePlan.tagline}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.planPrice, { color: colors.gold }]}>{activePlan.price}</Text>
              <Text style={[styles.planCad, { color: colors.mutedForeground }]}>CAD</Text>
            </View>
          </View>

          <View style={[styles.featuresBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {activePlan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: f.included ? colors.success + "20" : colors.muted }]}>
                  <Feather name={f.included ? "check" : "x"} size={12} color={f.included ? colors.success : colors.mutedForeground} />
                </View>
                <Text style={[styles.featureText, { color: f.included ? colors.foreground : colors.mutedForeground, textDecorationLine: f.included ? "none" : "line-through" }]}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          {!isDowngrade ? (
            <Pressable
              style={[
                styles.orderBtn,
                isCurrent
                  ? { backgroundColor: colors.success + "20", borderColor: colors.success, borderWidth: 1 }
                  : { backgroundColor: activePlan.tier === "platinum" ? "#E0E0E0" : colors.gold },
              ]}
              onPress={() => !isCurrent && handleOrder(activePlan)}
              disabled={isCurrent || loading !== null}
            >
              <Feather
                name={isCurrent ? "check-circle" : isUpgrade ? "arrow-up-circle" : "credit-card"}
                size={16}
                color={isCurrent ? colors.success : "#0D0D0D"}
              />
              <Text style={[styles.orderBtnText, { color: isCurrent ? colors.success : "#0D0D0D" }]}>
                {loading === activePlan.tier ? "Traitement..."
                  : isCurrent ? "Carte actuelle"
                  : isUpgrade ? `Mettre à niveau vers ${activePlan.name}`
                  : `Commander la carte ${activePlan.name}`}
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.downgradeBox, { backgroundColor: colors.muted }]}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text style={[styles.downgradeText, { color: colors.mutedForeground }]}>
                Vous bénéficiez déjà d'une carte supérieure
              </Text>
            </View>
          )}

          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="truck" size={14} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Livraison physique sous 3-5 jours ouvrés. Utilisable immédiatement via NFC sur smartphone.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  currentBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginHorizontal: 20, marginTop: 16 },
  currentText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginTop: 16, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardSlide: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  cardVisual: {
    borderRadius: 22,
    padding: 22,
    overflow: "hidden",
    justifyContent: "space-between",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 8 },
      web: { boxShadow: "0 8px 24px rgba(0,0,0,0.3)" } as any,
    }),
  },
  cardPattern1: { position: "absolute", width: 200, height: 200, borderRadius: 100, top: -80, right: -60 },
  cardPattern2: { position: "absolute", width: 140, height: 140, borderRadius: 70, bottom: -60, left: -40 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardBrand: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  cardTier: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginTop: 2 },
  nfcWavesBox: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  chipBox: {
    width: 42, height: 32, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
    marginVertical: 6,
  },
  chipInner: { width: 32, height: 22, borderRadius: 3, borderWidth: 1, padding: 3, justifyContent: "space-between" },
  chipLine: { height: 1.5, borderRadius: 1 },
  cardNumber: { fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  cardBottomRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  cardLabel: { fontSize: 8, fontFamily: "Inter_500Medium", letterSpacing: 1, marginBottom: 2 },
  cardHolder: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  cardExpiry: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 18 },
  dot: { height: 6, borderRadius: 3 },
  planInfo: { paddingHorizontal: 20, gap: 14 },
  planTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  planName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  planTagline: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  planPrice: { fontSize: 20, fontFamily: "Inter_700Bold" },
  planCad: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  featuresBox: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  orderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15 },
  orderBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  downgradeBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12 },
  downgradeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start", marginTop: 4 },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
});
