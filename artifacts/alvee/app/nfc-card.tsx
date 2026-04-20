import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

interface CardPlan {
  tier: CardTier;
  name: string;
  price: string;
  priceNum: number;
  tagline: string;
  gradient: [string, string, ...string[]];
  textColor: string;
  features: { text: string; included: boolean }[];
}

const PLANS: CardPlan[] = [
  {
    tier: "standard",
    name: "Standard",
    price: "12 $ / an",
    priceNum: 12,
    tagline: "L'essentiel pour commencer",
    gradient: ["#2A2A2A", "#1A1A1A"],
    textColor: "#FFFFFF",
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
    gradient: ["#C9A84C", "#A07830"],
    textColor: "#0D0D0D",
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
    gradient: ["#E8E8E8", "#A0A0A0"],
    textColor: "#0D0D0D",
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

export default function NFCCardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, orderNFCCard, upgradeCard } = useApp();
  const [loading, setLoading] = useState<CardTier | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const currentTierIdx = TIER_ORDER.indexOf(user?.nfcCardTier ?? "none");

  const handleOrder = async (plan: CardPlan) => {
    const planIdx = TIER_ORDER.indexOf(plan.tier);
    const isUpgrade = currentTierIdx > 0 && planIdx > currentTierIdx;
    const action = isUpgrade ? "mise à niveau" : "commande";

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Feather name="x" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cartes Alvee</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.heroText}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Votre pass physique premium</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            La carte Alvee vous permet d'entrer aux événements en passant simplement votre carte, de réserver à la dernière minute et d'accéder à des événements exclusifs.
          </Text>
        </View>

        {user?.nfcCardTier && user.nfcCardTier !== "none" && (
          <View style={[styles.currentBanner, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}>
            <Feather name="credit-card" size={16} color={colors.gold} />
            <Text style={[styles.currentText, { color: colors.gold }]}>
              Carte active : <Text style={{ fontFamily: "Inter_700Bold" }}>{user.nfcCardTier.charAt(0).toUpperCase() + user.nfcCardTier.slice(1)}</Text>
              {user.nfcCardId ? ` · ${user.nfcCardId}` : ""}
            </Text>
          </View>
        )}

        {PLANS.map((plan) => {
          const planIdx = TIER_ORDER.indexOf(plan.tier);
          const isCurrent = user?.nfcCardTier === plan.tier;
          const isUpgrade = currentTierIdx > 0 && planIdx > currentTierIdx;
          const isDowngrade = currentTierIdx > 0 && planIdx < currentTierIdx;

          return (
            <View key={plan.tier} style={[styles.planCard, { borderColor: isCurrent ? colors.gold : colors.border }]}>
              <LinearGradient colors={plan.gradient} style={styles.planHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.planHeaderTop}>
                  <View>
                    <Text style={[styles.planName, { color: plan.textColor }]}>{plan.name}</Text>
                    <Text style={[styles.planTagline, { color: plan.textColor + "BB" }]}>{plan.tagline}</Text>
                  </View>
                  <View>
                    <Text style={[styles.planPrice, { color: plan.textColor }]}>{plan.price}</Text>
                    <Text style={[styles.planCad, { color: plan.textColor + "99" }]}>CAD</Text>
                  </View>
                </View>
                <View style={styles.planCardVisual}>
                  <Feather name="wifi" size={14} color={plan.textColor + "80"} />
                  <Text style={[styles.planCardName, { color: plan.textColor + "80" }]}>ALVEE {plan.name.toUpperCase()}</Text>
                </View>
              </LinearGradient>

              <View style={[styles.planFeatures, { backgroundColor: colors.card }]}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: f.included ? colors.success + "20" : colors.muted }]}>
                      <Feather name={f.included ? "check" : "x"} size={11} color={f.included ? colors.success : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.featureText, { color: f.included ? colors.foreground : colors.mutedForeground }]}>{f.text}</Text>
                  </View>
                ))}

                {!isDowngrade && (
                  <Pressable
                    style={[
                      styles.orderBtn,
                      isCurrent
                        ? { backgroundColor: colors.success + "20", borderColor: colors.success + "40", borderWidth: 1 }
                        : { backgroundColor: plan.tier === "prime" ? colors.gold : plan.tier === "platinum" ? "#E0E0E0" : colors.muted },
                    ]}
                    onPress={() => !isCurrent && handleOrder(plan)}
                    disabled={isCurrent || loading !== null}
                  >
                    <Text style={[styles.orderBtnText, {
                      color: isCurrent ? colors.success
                        : plan.tier === "platinum" ? "#111"
                        : plan.tier === "prime" ? "#0D0D0D"
                        : colors.mutedForeground,
                    }]}>
                      {loading === plan.tier ? "Traitement..."
                        : isCurrent ? "✓ Carte actuelle"
                        : isUpgrade ? `Mettre à niveau → ${plan.name}`
                        : `Commander la carte ${plan.name}`}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            La carte physique est envoyée sous 3-5 jours ouvrés à votre adresse. Elle peut être utilisée immédiatement via NFC sur smartphone.
          </Text>
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
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  heroText: { gap: 8, marginBottom: 4 },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  currentBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  currentText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  planCard: { borderRadius: 20, overflow: "hidden", borderWidth: 1.5 },
  planHeader: { padding: 20 },
  planHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  planName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  planTagline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  planPrice: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "right" },
  planCad: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  planCardVisual: { flexDirection: "row", alignItems: "center", gap: 8 },
  planCardName: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  planFeatures: { padding: 16, gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  orderBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 6 },
  orderBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  infoBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
});
