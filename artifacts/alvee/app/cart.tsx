import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type CartItem } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getEventImage } from "@/utils/eventImages";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" });
}

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart, cartCount, removeFromCart, clearCart, bookEvent, addNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const subtotal = cart.reduce((sum, item) => sum + item.ticketPrice * item.quantity, 0);
  const isFree = subtotal === 0;

  const handleRemove = (item: CartItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFromCart(item.id);
  };

  const handleClear = () => {
    Alert.alert("Vider le panier", "Supprimer tous les billets du panier ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Vider", style: "destructive", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); clearCart(); } },
    ]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let successCount = 0;
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          const result = await bookEvent(item.eventId, item.role);
          if (result) successCount++;
        }
      }
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addNotification({
        type: "booking",
        title: "Paiement confirmé !",
        body: `${successCount} billet${successCount > 1 ? "s" : ""} réservé${successCount > 1 ? "s" : ""} avec succès.`,
      });
      Alert.alert(
        "Paiement confirmé !",
        `${successCount} billet${successCount > 1 ? "s réservés" : " réservé"} avec succès. Retrouvez vos billets dans Activités → Mes Inscriptions.`,
        [{ text: "Voir mes billets", onPress: () => router.replace("/(tabs)/activities") }],
      );
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue lors du paiement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mon Panier</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Feather name="shopping-cart" size={38} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Votre panier est vide</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Parcourez les événements et ajoutez des billets à votre panier pour les retrouver ici.
          </Text>
          <Pressable style={[styles.exploreBtn, { backgroundColor: colors.gold }]} onPress={() => router.replace("/(tabs)")}>
            <Feather name="compass" size={16} color="#0D0D0D" />
            <Text style={styles.exploreBtnText}>Explorer les événements</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mon Panier</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {cartCount} billet{cartCount > 1 ? "s" : ""} · {cart.length} événement{cart.length > 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable onPress={handleClear} style={[styles.clearBtn, { borderColor: colors.border }]}>
          <Feather name="trash-2" size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <FlatList
        data={cart}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 200 + bottomPad }}
        renderItem={({ item }) => (
          <View style={[styles.cartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Event image + title row */}
            <View style={styles.cardTop}>
              <Image
                source={item.eventImage ? { uri: item.eventImage } : getEventImage(item.eventImage)}
                style={styles.cardThumb}
                contentFit="cover"
              />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.eventTitle}</Text>
                <View style={styles.cardMeta}>
                  <Feather name="calendar" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>{formatDate(item.eventDate)} · {item.eventTime}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>{item.eventLocation}</Text>
                </View>
              </View>
              <Pressable onPress={() => handleRemove(item)} style={styles.removeBtn} hitSlop={8}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Details row */}
            <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
              <View style={styles.cardChip}>
                <Feather name="user" size={11} color={colors.mutedForeground} />
                <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{item.participantName || "Participant"}</Text>
              </View>
              <View style={styles.cardChip}>
                <Feather name="tag" size={11} color={colors.mutedForeground} />
                <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{item.role}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <View style={styles.priceBox}>
                <Text style={[styles.qty, { color: colors.mutedForeground }]}>×{item.quantity}</Text>
                <Text style={[styles.price, { color: colors.gold }]}>
                  {item.ticketPrice === 0 ? "Gratuit" : `${(item.ticketPrice * item.quantity).toFixed(2)} $`}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Récapitulatif</Text>
            {cart.map(item => (
              <View key={item.id} style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.eventTitle} ×{item.quantity}
                </Text>
                <Text style={[styles.summaryVal, { color: colors.foreground }]}>
                  {item.ticketPrice === 0 ? "Gratuit" : `${(item.ticketPrice * item.quantity).toFixed(2)} $`}
                </Text>
              </View>
            ))}
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotal, { color: colors.foreground }]}>Total</Text>
              <Text style={[styles.summaryTotalVal, { color: colors.gold }]}>
                {isFree ? "Gratuit" : `${subtotal.toFixed(2)} $ CAD`}
              </Text>
            </View>
          </View>
        }
      />

      {/* Sticky checkout button */}
      <View style={[styles.checkoutBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <View style={styles.checkoutTotal}>
          <Text style={[styles.checkoutTotalLabel, { color: colors.mutedForeground }]}>Total</Text>
          <Text style={[styles.checkoutTotalAmount, { color: colors.foreground }]}>
            {isFree ? "Gratuit" : `${subtotal.toFixed(2)} $ CAD`}
          </Text>
        </View>
        <Pressable
          style={[styles.payBtn, { backgroundColor: colors.gold, opacity: loading ? 0.7 : 1 }]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0D0D0D" />
          ) : (
            <>
              <Feather name="lock" size={16} color="#0D0D0D" />
              <Text style={styles.payBtnText}>{isFree ? "Réserver gratuitement" : "Payer maintenant"}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  clearBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  exploreBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 6 },
  exploreBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  cartCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardTop: { flexDirection: "row", gap: 12, padding: 14 },
  cardThumb: { width: 60, height: 60, borderRadius: 12 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  removeBtn: { padding: 4 },
  cardDetails: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
    flexWrap: "wrap",
  },
  cardChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  chipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  priceBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  qty: { fontSize: 12, fontFamily: "Inter_500Medium" },
  price: { fontSize: 15, fontFamily: "Inter_700Bold" },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  summaryTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, marginRight: 8 },
  summaryVal: { fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryDivider: { height: 1, marginVertical: 4 },
  summaryTotal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  summaryTotalVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  checkoutTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  checkoutTotalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  checkoutTotalAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 15,
  },
  payBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
});
