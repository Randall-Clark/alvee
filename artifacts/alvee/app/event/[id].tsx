import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NFCScanner } from "@/components/NFCScanner";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getEventImage } from "@/utils/eventImages";

const ROLES = ["Fondateur", "Investisseur", "Designer", "Développeur", "Entrepreneur", "Curieux"];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { events, user, isAuthenticated, bookEvent, getUserBookingForEvent, linkNFCToBooking } = useApp();

  const [loading, setLoading] = useState(false);
  const [nfcVisible, setNfcVisible] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const event = events.find(e => e.id === id);
  const booking = event ? getUserBookingForEvent(event.id) : undefined;

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Événement introuvable</Text>
        </View>
      </View>
    );
  }

  const isFull = event.currentParticipants >= event.maxParticipants;
  const fillRate = Math.min((event.currentParticipants / Math.max(event.maxParticipants, 1)) * 100, 100);
  const earlyThreshold = Math.floor(event.maxParticipants * 0.4);
  const earlyPerPerson = earlyThreshold > 0 ? Math.floor((event.totalPoints * 0.7) / earlyThreshold) : 0;
  const lateCount = event.maxParticipants - earlyThreshold;
  const latePerPerson = lateCount > 0 ? Math.floor((event.totalPoints * 0.3) / lateCount) : 0;

  const handleBook = async () => {
    if (!isAuthenticated) { router.push("/auth"); return; }
    if (isFull) return;
    setRoleModal(true);
  };

  const handleConfirmRole = async (role: string) => {
    setSelectedRole(role);
    setRoleModal(false);
    setLoading(true);
    try {
      const result = await bookEvent(event.id, role);
      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Réservation confirmée !", `Vous avez gagné +${result.pointsEarned} points !`);
      }
    } catch { Alert.alert("Erreur", "Impossible de réserver."); }
    finally { setLoading(false); }
  };

  const handleNFCLink = async (cardId: string) => {
    if (!booking) return;
    setNfcVisible(false);
    const ok = await linkNFCToBooking(booking.id, cardId);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès !", "Votre billet est enregistré sur votre carte NFC Alvee.");
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + bottomPad }}>
        <View style={styles.hero}>
          <Image source={getEventImage(event.coverImage)} style={styles.heroImage} contentFit="cover" />
          <LinearGradient colors={["rgba(13,13,13,0)", "rgba(13,13,13,0.5)", "#0D0D0D"]} style={styles.heroGrad} />

          <Pressable style={[styles.backBtn, { top: (Platform.OS === "web" ? 67 : insets.top) + 12 }]} onPress={() => router.back()}>
            <View style={styles.backBtnInner}>
              <Feather name="arrow-left" size={18} color="#fff" />
            </View>
          </Pressable>

          {user?.id === event.organizerId && (
            <Pressable style={[styles.manageBtn, { top: (Platform.OS === "web" ? 67 : insets.top) + 12 }]} onPress={() => router.push("/manage")}>
              <View style={styles.manageBtnInner}>
                <Feather name="settings" size={18} color="#fff" />
              </View>
            </Pressable>
          )}

          <View style={styles.heroBadges}>
            <View style={[styles.catPill, { backgroundColor: "rgba(201,168,76,0.25)", borderColor: "rgba(201,168,76,0.5)" }]}>
              <Text style={[styles.catPillText, { color: colors.gold }]}>{event.category}</Text>
            </View>
            {event.requiresNFC && (
              <View style={[styles.catPill, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="credit-card" size={10} color="#fff" />
                <Text style={[styles.catPillText, { color: "#fff" }]}>NFC requis</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.eventTitle}>{event.title}</Text>

          <View style={styles.orgRow}>
            <View style={[styles.orgAvatar, { backgroundColor: colors.gold + "30" }]}>
              <Feather name="user" size={12} color={colors.gold} />
            </View>
            <Text style={[styles.orgName, { color: colors.mutedForeground }]}>{event.organizerName}</Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <InfoRow icon="tag" label={`Entrée — ${event.price === 0 ? "Gratuit" : `${event.price}€`}`} value="" colors={colors} highlight />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="calendar" label={new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} value="" colors={colors} />
            <InfoRow icon="clock" label={`${event.time}`} value="" colors={colors} />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="map-pin" label={event.location} value={event.address} colors={colors} />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="users" label={`${event.currentParticipants} / ${event.maxParticipants} participants`} value="" colors={colors} />
          </View>

          <Text style={styles.sectionTitle}>Détails de l'événement</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{event.description}</Text>

          <Text style={styles.sectionTitle}>Système de points</Text>
          <View style={[styles.pointsCard, { backgroundColor: colors.card }]}>
            <View style={styles.pointsCardHeader}>
              <Feather name="zap" size={16} color={colors.gold} />
              <Text style={[styles.pointsTotal, { color: colors.gold }]}>{event.totalPoints.toLocaleString("fr-FR")} points à distribuer</Text>
            </View>
            <View style={styles.pointsTiers}>
              <View style={[styles.tier, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]}>
                <Text style={[styles.tierPct, { color: colors.gold }]}>40% premiers</Text>
                <Text style={[styles.tierPts, { color: colors.gold }]}>{earlyPerPerson} pts</Text>
                <Text style={[styles.tierSub, { color: colors.mutedForeground }]}>70% du pool</Text>
              </View>
              <View style={[styles.tier, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.tierPct, { color: colors.foreground }]}>60% restants</Text>
                <Text style={[styles.tierPts, { color: colors.foreground }]}>{latePerPerson} pts</Text>
                <Text style={[styles.tierSub, { color: colors.mutedForeground }]}>30% du pool</Text>
              </View>
            </View>
            <View style={[styles.progressWrap, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { width: `${fillRate}%` as any, backgroundColor: fillRate > 80 ? colors.destructive : colors.gold }]} />
            </View>
            <Text style={[styles.spotsLeft, { color: colors.mutedForeground }]}>
              {isFull ? "Événement complet" : `${event.maxParticipants - event.currentParticipants} places restantes`}
            </Text>
          </View>

          {booking && (
            <View style={styles.ticketSection}>
              <Text style={styles.sectionTitle}>Votre billet</Text>
              <View style={[styles.ticketCard, { backgroundColor: colors.card }]}>
                <QRCodeDisplay value={booking.qrCode} size={170} />
                <Text style={[styles.ticketOrder, { color: colors.mutedForeground }]}>
                  Inscription #{booking.registrationOrder} · +{booking.pointsEarned} pts gagnés
                </Text>
                {booking.role && (
                  <View style={[styles.roleBadge, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}>
                    <Text style={[styles.roleText, { color: colors.gold }]}>{booking.role}</Text>
                  </View>
                )}
                <Pressable
                  style={[
                    styles.nfcLinkBtn,
                    booking.nfcLinked
                      ? { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }
                      : { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" },
                  ]}
                  onPress={booking.nfcLinked ? undefined : () => setNfcVisible(true)}
                >
                  <Feather name={booking.nfcLinked ? "check-circle" : "credit-card"} size={15} color={booking.nfcLinked ? colors.success : colors.gold} />
                  <Text style={[styles.nfcLinkText, { color: booking.nfcLinked ? colors.success : colors.gold }]}>
                    {booking.nfcLinked ? "Carte NFC enregistrée" : "Enregistrer sur ma carte NFC"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {!booking && (
        <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: bottomPad + 12, borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>Entrée</Text>
            <Text style={styles.footerPrice}>{event.price === 0 ? "Gratuit" : `${event.price}€`}</Text>
          </View>
          <Pressable
            style={[styles.bookBtn, { backgroundColor: isFull ? colors.muted : colors.gold, opacity: loading ? 0.7 : 1 }]}
            onPress={handleBook}
            disabled={isFull || loading}
          >
            <Text style={[styles.bookBtnText, { color: isFull ? colors.mutedForeground : "#0D0D0D" }]}>
              {loading ? "Réservation..." : isFull ? "Complet" : "S'inscrire"}
            </Text>
          </Pressable>
        </View>
      )}

      <Modal visible={roleModal} transparent animationType="slide" onRequestClose={() => setRoleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.roleSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.roleTitle}>Je rejoins cet événement pour rencontrer…</Text>
            <Text style={[styles.roleSub, { color: colors.mutedForeground }]}>
              Choisissez le profil qui vous correspond le mieux
            </Text>
            {ROLES.map(role => (
              <Pressable
                key={role}
                style={[styles.roleOption, { borderColor: colors.border }]}
                onPress={() => handleConfirmRole(role)}
              >
                <Text style={[styles.roleOptionText, { color: colors.foreground }]}>{role}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
            <Pressable onPress={() => setRoleModal(false)} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Passer cette étape</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <NFCScanner
        visible={nfcVisible}
        onClose={() => setNfcVisible(false)}
        onNFCDetected={handleNFCLink}
        title="Enregistrer sur carte NFC"
      />
    </View>
  );
}

function InfoRow({ icon, label, value, colors, highlight }: { icon: any; label: string; value: string; colors: any; highlight?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <View style={[infoStyles.iconWrap, { backgroundColor: highlight ? colors.gold + "20" : colors.muted }]}>
        <Feather name={icon} size={13} color={highlight ? colors.gold : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: highlight ? colors.gold : colors.foreground, fontFamily: highlight ? "Inter_700Bold" : "Inter_500Medium" }]}>
          {label}
        </Text>
        {!!value && <Text style={[infoStyles.value, { color: colors.mutedForeground }]}>{value}</Text>}
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 1 },
  label: { fontSize: 14 },
  value: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { height: 320, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200 },
  backBtn: { position: "absolute", left: 16 },
  backBtnInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  manageBtn: { position: "absolute", right: 16 },
  manageBtnInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  heroBadges: { position: "absolute", bottom: 20, left: 20, flexDirection: "row", gap: 8 },
  catPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  eventTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFFFFF", lineHeight: 33, marginBottom: 8 },
  orgRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  orgAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  orgName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoCard: { borderRadius: 16, padding: 4, marginBottom: 24 },
  infoDiv: { height: 1, marginHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 12 },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 24 },
  pointsCard: { borderRadius: 16, padding: 16, marginBottom: 24, gap: 12 },
  pointsCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  pointsTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  pointsTiers: { flexDirection: "row", gap: 10 },
  tier: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, gap: 3 },
  tierPct: { fontSize: 11, fontFamily: "Inter_500Medium" },
  tierPts: { fontSize: 20, fontFamily: "Inter_700Bold" },
  tierSub: { fontSize: 10, fontFamily: "Inter_400Regular" },
  progressWrap: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  spotsLeft: { fontSize: 11, fontFamily: "Inter_400Regular" },
  ticketSection: { marginBottom: 12 },
  ticketCard: { borderRadius: 16, padding: 20, alignItems: "center", gap: 12 },
  ticketOrder: { fontSize: 12, fontFamily: "Inter_400Regular" },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  nfcLinkBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, width: "100%", justifyContent: "center" },
  nfcLinkText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  footerLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  footerPrice: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  bookBtn: { flex: 1, marginLeft: 20, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  bookBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  roleSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 0 },
  sheetHandle: { width: 36, height: 4, backgroundColor: "#444", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  roleTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 6, textAlign: "center" },
  roleSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  roleOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1 },
  roleOptionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  skipBtn: { paddingVertical: 16, alignItems: "center" },
  skipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
