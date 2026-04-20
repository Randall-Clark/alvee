import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
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

import { PointsBadge } from "@/components/PointsBadge";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { NFCScanner } from "@/components/NFCScanner";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { events, user, isAuthenticated, bookEvent, getUserBookingForEvent, linkNFCToBooking } = useApp();

  const [loading, setLoading] = useState(false);
  const [nfcVisible, setNfcVisible] = useState(false);

  const event = events.find(e => e.id === id);
  const booking = event ? getUserBookingForEvent(event.id) : undefined;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Événement introuvable</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: colors.primary }]}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isFull = event.currentParticipants >= event.maxParticipants;
  const fillRate = event.maxParticipants > 0 ? event.currentParticipants / event.maxParticipants : 0;
  const earlyThreshold = Math.floor(event.maxParticipants * 0.4);
  const earlyPool = Math.floor(event.totalPoints * 0.7);
  const latePool = Math.floor(event.totalPoints * 0.3);
  const earlyPerPerson = earlyThreshold > 0 ? Math.floor(earlyPool / earlyThreshold) : 0;
  const latePerPerson = (event.maxParticipants - earlyThreshold) > 0 ? Math.floor(latePool / (event.maxParticipants - earlyThreshold)) : 0;

  const userIsEarly = booking && booking.registrationOrder <= earlyThreshold;

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (isFull) return;

    setLoading(true);
    try {
      const result = await bookEvent(event.id);
      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Réservation confirmée !", `+${result.pointsEarned} points gagnés !`);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de réserver.");
    } finally {
      setLoading(false);
    }
  };

  const handleNFCLink = async (cardId: string) => {
    if (!booking) return;
    setNfcVisible(false);
    const ok = await linkNFCToBooking(booking.id, cardId);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Carte NFC liée à votre billet !");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topPadding, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        {user?.id === event.organizerId && (
          <Pressable style={[styles.manageLink, { backgroundColor: colors.primary + "15" }]} onPress={() => router.push("/manage")}>
            <Feather name="settings" size={14} color={colors.primary} />
            <Text style={[styles.manageLinkText, { color: colors.primary }]}>Gérer</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 120 : 100 + insets.bottom }]}
      >
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{event.category}</Text>
          {event.requiresNFC && (
            <View style={[styles.nfcTag, { backgroundColor: colors.accent + "20" }]}>
              <Feather name="credit-card" size={10} color={colors.accent} />
              <Text style={[styles.nfcTagText, { color: colors.accent }]}>NFC requis</Text>
            </View>
          )}
        </View>

        <Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>

        <View style={styles.metaBlock}>
          <MetaRow icon="calendar" label={new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} colors={colors} />
          <MetaRow icon="clock" label={`À ${event.time}`} colors={colors} />
          <MetaRow icon="map-pin" label={`${event.location}${event.address ? ` — ${event.address}` : ""}`} colors={colors} />
          <MetaRow icon="user" label={`Organisé par ${event.organizerName}`} colors={colors} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>À propos</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{event.description}</Text>

        <View style={[styles.pointsCard, { backgroundColor: colors.gold + "12", borderColor: colors.gold + "30" }]}>
          <View style={styles.pointsCardHeader}>
            <Feather name="zap" size={18} color={colors.gold} />
            <Text style={[styles.pointsCardTitle, { color: colors.gold }]}>
              {event.totalPoints.toLocaleString("fr-FR")} points à gagner
            </Text>
          </View>
          <View style={styles.pointsDistrib}>
            <View style={[styles.pointsTier, { backgroundColor: "#fff", borderColor: colors.gold + "30" }]}>
              <Text style={[styles.pointsTierLabel, { color: colors.mutedForeground }]}>
                40% premiers inscrits
              </Text>
              <Text style={[styles.pointsTierValue, { color: colors.gold }]}>{earlyPerPerson} pts</Text>
              <Text style={[styles.pointsTierSub, { color: colors.mutedForeground }]}>70% du total</Text>
            </View>
            <View style={[styles.pointsTier, { backgroundColor: "#fff", borderColor: colors.border }]}>
              <Text style={[styles.pointsTierLabel, { color: colors.mutedForeground }]}>
                60% restants
              </Text>
              <Text style={[styles.pointsTierValue, { color: colors.mutedForeground }]}>{latePerPerson} pts</Text>
              <Text style={[styles.pointsTierSub, { color: colors.mutedForeground }]}>30% du total</Text>
            </View>
          </View>
          {booking && (
            <View style={[styles.yourPoints, { backgroundColor: colors.gold }]}>
              <Feather name="star" size={14} color="#fff" />
              <Text style={styles.yourPointsText}>
                Vous gagnez {booking.pointsEarned} pts ({userIsEarly ? "Inscrit tôt" : "Inscription standard"})
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.capacityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.capacityHeader}>
            <Text style={[styles.capacityTitle, { color: colors.foreground }]}>Capacité</Text>
            <Text style={[styles.capacityCount, { color: isFull ? colors.destructive : colors.primary }]}>
              {event.currentParticipants}/{event.maxParticipants}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(fillRate * 100, 100)}%` as any,
                  backgroundColor: isFull ? colors.destructive : fillRate > 0.7 ? colors.warning : colors.success,
                },
              ]}
            />
          </View>
          <Text style={[styles.spotsText, { color: isFull ? colors.destructive : colors.mutedForeground }]}>
            {isFull ? "Complet — plus de places disponibles" : `${event.maxParticipants - event.currentParticipants} place${event.maxParticipants - event.currentParticipants > 1 ? "s" : ""} restante${event.maxParticipants - event.currentParticipants > 1 ? "s" : ""}`}
          </Text>
        </View>

        {booking && (
          <View style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.ticketTitle, { color: colors.foreground }]}>Votre billet</Text>
            <QRCodeDisplay value={booking.qrCode} size={160} />
            <Text style={[styles.ticketOrder, { color: colors.mutedForeground }]}>
              Inscription #{booking.registrationOrder}
            </Text>
            {!booking.nfcLinked ? (
              <Pressable
                style={[styles.nfcLinkBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                onPress={() => setNfcVisible(true)}
              >
                <Feather name="credit-card" size={16} color={colors.primary} />
                <Text style={[styles.nfcLinkText, { color: colors.primary }]}>Enregistrer sur ma carte NFC</Text>
              </Pressable>
            ) : (
              <View style={[styles.nfcLinkBtn, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
                <Feather name="check-circle" size={16} color={colors.success} />
                <Text style={[styles.nfcLinkText, { color: colors.success }]}>Carte NFC enregistrée</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {!booking && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }]}>
          <View style={styles.footerLeft}>
            <Text style={[styles.footerPrice, { color: colors.primary }]}>
              {event.price === 0 ? "Gratuit" : `${event.price}€`}
            </Text>
            <PointsBadge points={booking ? (booking as any).pointsEarned : earlyPerPerson} size="sm" />
          </View>
          <Pressable
            style={[
              styles.bookBtn,
              { backgroundColor: isFull ? colors.muted : colors.primary, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleBook}
            disabled={isFull || loading}
          >
            <Text style={[styles.bookBtnText, { color: isFull ? colors.mutedForeground : "#fff" }]}>
              {loading ? "Réservation..." : isFull ? "Complet" : "Réserver maintenant"}
            </Text>
          </Pressable>
        </View>
      )}

      <NFCScanner
        visible={nfcVisible}
        onClose={() => setNfcVisible(false)}
        onNFCDetected={handleNFCLink}
        title="Enregistrer sur carte NFC"
      />
    </View>
  );
}

function MetaRow({ icon, label, colors }: { icon: any; label: string; colors: any }) {
  return (
    <View style={metaStyles.row}>
      <View style={[metaStyles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={[metaStyles.label, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular" },
  backLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  manageLink: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  manageLinkText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  categoryBadge: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  categoryText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  nfcTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  nfcTagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  eventTitle: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 32, marginTop: -4 },
  metaBlock: { gap: 2 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginTop: -8 },
  pointsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  pointsCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  pointsCardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  pointsDistrib: { flexDirection: "row", gap: 8 },
  pointsTier: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  pointsTierLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  pointsTierValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  pointsTierSub: { fontSize: 10, fontFamily: "Inter_400Regular" },
  yourPoints: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10 },
  yourPointsText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  capacityCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  capacityHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  capacityTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  capacityCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  spotsText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ticketCard: { borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 12 },
  ticketTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", alignSelf: "flex-start" },
  ticketOrder: { fontSize: 12, fontFamily: "Inter_400Regular" },
  nfcLinkBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, width: "100%", justifyContent: "center" },
  nfcLinkText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 12 },
  footerLeft: { gap: 4 },
  footerPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  bookBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14 },
  bookBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
