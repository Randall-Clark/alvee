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

import { EventMap } from "@/components/EventMap";
import { NFCScanner } from "@/components/NFCScanner";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { SurveyModal } from "@/components/SurveyModal";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getEventImage } from "@/utils/eventImages";

const ROLES = ["Fondateur", "Investisseur", "Designer", "Développeur", "Entrepreneur", "Curieux"];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { events, user, isAuthenticated, bookEvent, getUserBookingForEvent, linkNFCToBooking, cancelBooking, sendMessage, canAccessEvent } = useApp();

  const [loading, setLoading] = useState(false);
  const [nfcVisible, setNfcVisible] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [msgModal, setMsgModal] = useState(false);
  const [msgText, setMsgText] = useState("");

  const event = events.find(e => e.id === id);
  const booking = event ? getUserBookingForEvent(event.id) : undefined;

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={[styles.backBtnWrap, { top: (Platform.OS === "web" ? 67 : insets.top) + 12 }]} onPress={() => router.back()}>
          <View style={styles.backBtnInner}><Feather name="arrow-left" size={18} color="#fff" /></View>
        </Pressable>
        <View style={styles.center}><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Événement introuvable</Text></View>
      </View>
    );
  }

  const isFull = event.currentParticipants >= event.maxParticipants;
  const accessible = canAccessEvent(event.price);
  const cardRequired = event.price >= 300;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleBook = async () => {
    if (!isAuthenticated) { router.push("/auth"); return; }
    if (isFull) return;
    if (!accessible) {
      Alert.alert("Carte Prime requise", "Cet événement (300 $ CAD et plus) nécessite au minimum une carte Alvee Prime.", [
        { text: "Voir les cartes", onPress: () => router.push("/nfc-card") },
        { text: "Annuler", style: "cancel" },
      ]);
      return;
    }
    setRoleModal(true);
  };

  const handleConfirmRole = async (role: string) => {
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
      Alert.alert("Succès !", "Votre billet est enregistré sur votre carte NFC Alvee.\n\nVous pouvez maintenant utiliser votre carte physique comme moyen d'entrée.");
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    Alert.alert(
      "Annuler ma participation",
      "Voulez-vous annuler votre réservation ? Un remboursement sera effectué selon les conditions de votre carte Alvee.",
      [
        { text: "Non, garder", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            const result = await cancelBooking(booking.id);
            Alert.alert(result.refunded ? "Annulé & remboursé" : "Annulé", result.message);
          },
        },
      ]
    );
  };

  const handleSendMsg = async () => {
    if (!msgText.trim()) return;
    await sendMessage(event.id, event.title, event.organizerId, event.organizerName, msgText.trim());
    setMsgText("");
    setMsgModal(false);
    Alert.alert("Message envoyé", `Votre message a été envoyé à ${event.organizerName}.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + bottomPad }}>
        <View style={styles.hero}>
          <Image
            source={event.coverImageUri ? { uri: event.coverImageUri } : getEventImage(event.coverImage)}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.5)", colors.background]} style={styles.heroGrad} />

          <Pressable style={[styles.backBtnWrap, { top: topPad + 12 }]} onPress={() => router.back()}>
            <View style={styles.backBtnInner}><Feather name="arrow-left" size={18} color="#fff" /></View>
          </Pressable>

          {user?.id === event.organizerId && (
            <Pressable style={[styles.manageBtn, { top: topPad + 12 }]} onPress={() => router.push("/manage")}>
              <View style={styles.backBtnInner}><Feather name="settings" size={18} color="#fff" /></View>
            </Pressable>
          )}

          <View style={styles.heroBadges}>
            <View style={[styles.catPill, { backgroundColor: "rgba(201,168,76,0.3)", borderColor: "rgba(201,168,76,0.5)" }]}>
              <Text style={[styles.catPillText, { color: colors.gold }]}>{event.category}</Text>
            </View>
            {cardRequired && (
              <View style={[styles.catPill, { backgroundColor: "rgba(201,168,76,0.25)", borderColor: "rgba(201,168,76,0.4)" }]}>
                <Feather name="credit-card" size={10} color={colors.gold} />
                <Text style={[styles.catPillText, { color: colors.gold }]}>Carte Prime requise</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>

          <View style={styles.orgRow}>
            <View style={[styles.orgAvatar, { backgroundColor: colors.gold + "30" }]}>
              <Feather name="user" size={12} color={colors.gold} />
            </View>
            <Text style={[styles.orgName, { color: colors.mutedForeground }]}>{event.organizerName}</Text>
            {user?.id !== event.organizerId && (
              <Pressable style={[styles.msgOrgBtn, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]} onPress={() => setMsgModal(true)}>
                <Feather name="message-circle" size={13} color={colors.gold} />
                <Text style={[styles.msgOrgText, { color: colors.gold }]}>Contacter</Text>
              </Pressable>
            )}
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <InfoRow icon="tag" label={`Entrée — ${event.price === 0 ? "Gratuit" : `${event.price} $ CAD`}`} value="" colors={colors} highlight />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="calendar" label={new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} value="" colors={colors} />
            <InfoRow icon="clock" label={event.time} value="" colors={colors} />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="map-pin" label={event.location} value={event.address} colors={colors} />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="users" label={`${event.currentParticipants} / ${event.maxParticipants} participants`} value="" colors={colors} />
          </View>

          {(event.latitude && event.longitude) ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Carte & localisation</Text>
              <EventMap
                latitude={event.latitude}
                longitude={event.longitude}
                title={event.title}
                address={event.address}
              />
            </>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Détails de l'événement</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{event.description}</Text>

          <View style={[styles.nfcInfoCard, { backgroundColor: colors.card }]}>
            <Feather name="credit-card" size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.nfcInfoTitle, { color: colors.foreground }]}>
                {event.nfcOnlyEntry ? "Carte NFC requise uniquement" : "QR code ou Carte NFC acceptés"}
              </Text>
              <Text style={[styles.nfcInfoSub, { color: colors.mutedForeground }]}>
                {event.nfcOnlyEntry
                  ? "L'organisateur exige la carte physique Alvee comme seul moyen d'entrée."
                  : "Présentez votre QR code à l'entrée ou passez votre carte Alvee si vous l'avez enregistrée sur votre billet."}
              </Text>
            </View>
          </View>

          {booking && (
            <View style={styles.ticketSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Votre billet</Text>
              <View style={[styles.ticketCard, { backgroundColor: colors.card }]}>
                <QRCodeDisplay value={booking.qrCode} size={160} />
                <Text style={[styles.ticketOrder, { color: colors.mutedForeground }]}>Inscription #{booking.registrationOrder}{booking.role ? ` · ${booking.role}` : ""}</Text>
                {booking.role && (
                  <View style={[styles.roleBadge, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}>
                    <Text style={[styles.roleText, { color: colors.gold }]}>{booking.role}</Text>
                  </View>
                )}
                <Pressable
                  style={[styles.nfcLinkBtn, booking.nfcLinked
                    ? { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }
                    : { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]}
                  onPress={booking.nfcLinked ? undefined : () => setNfcVisible(true)}
                >
                  <Feather name={booking.nfcLinked ? "check-circle" : "credit-card"} size={15} color={booking.nfcLinked ? colors.success : colors.gold} />
                  <Text style={[styles.nfcLinkText, { color: booking.nfcLinked ? colors.success : colors.gold }]}>
                    {booking.nfcLinked ? "Carte NFC enregistrée ✓" : "Enregistrer sur ma carte NFC"}
                  </Text>
                </Pressable>
                <Pressable style={[styles.cancelBtn, { borderColor: colors.destructive + "40" }]} onPress={handleCancel}>
                  <Feather name="x-circle" size={14} color={colors.destructive} />
                  <Text style={[styles.cancelBtnText, { color: colors.destructive }]}>Annuler ma participation</Text>
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
            <Text style={[styles.footerPrice, { color: colors.foreground }]}>{event.price === 0 ? "Gratuit" : `${event.price} $`}</Text>
          </View>
          <Pressable
            style={[styles.bookBtn, { backgroundColor: !accessible ? colors.muted : isFull ? colors.muted : colors.gold, opacity: loading ? 0.7 : 1 }]}
            onPress={handleBook}
            disabled={isFull || loading}
          >
            <Text style={[styles.bookBtnText, { color: !accessible || isFull ? colors.mutedForeground : "#0D0D0D" }]}>
              {loading ? "Réservation..." : !accessible ? "Carte Prime requise" : isFull ? "Complet" : "S'inscrire"}
            </Text>
          </Pressable>
        </View>
      )}

      <Modal visible={roleModal} transparent animationType="slide" onRequestClose={() => setRoleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.roleSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>Je rejoins cet événement pour rencontrer…</Text>
            <Text style={[styles.roleSub, { color: colors.mutedForeground }]}>Choisissez le profil qui vous correspond</Text>
            {ROLES.map(role => (
              <Pressable key={role} style={[styles.roleOption, { borderColor: colors.border }]} onPress={() => handleConfirmRole(role)}>
                <Text style={[styles.roleOptionText, { color: colors.foreground }]}>{role}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
            <Pressable onPress={() => handleConfirmRole("")} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Passer cette étape</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={msgModal} transparent animationType="slide" onRequestClose={() => setMsgModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.roleSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>Contacter l'organisateur</Text>
            <Text style={[styles.roleSub, { color: colors.mutedForeground }]}>{event.organizerName}</Text>
            <View style={[styles.msgInputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text
                style={[styles.msgInput, { color: msgText ? colors.foreground : colors.mutedForeground }]}
                numberOfLines={4}
                onPress={() => {}}
              >
                {msgText || "Tapez votre message..."}
              </Text>
            </View>
            <Pressable style={[styles.msgSendBtn, { backgroundColor: colors.gold }]} onPress={handleSendMsg}>
              <Text style={styles.msgSendText}>Envoyer</Text>
            </Pressable>
            <Pressable onPress={() => setMsgModal(false)} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <NFCScanner visible={nfcVisible} onClose={() => setNfcVisible(false)} onNFCDetected={handleNFCLink} title="Enregistrer sur carte NFC" />
      <SurveyModal visible={surveyVisible} eventTitle={event.title} onSubmit={async () => { setSurveyVisible(false); }} onClose={() => setSurveyVisible(false)} />
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
        <Text style={[infoStyles.label, { color: highlight ? colors.gold : colors.foreground, fontFamily: highlight ? "Inter_700Bold" : "Inter_500Medium" }]}>{label}</Text>
        {!!value && <Text style={[infoStyles.value, { color: colors.mutedForeground }]}>{value}</Text>}
      </View>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
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
  backBtnWrap: { position: "absolute", left: 16 },
  backBtnInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  manageBtn: { position: "absolute", right: 16 },
  heroBadges: { position: "absolute", bottom: 20, left: 20, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  catPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  eventTitle: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 33 },
  orgRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orgAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  orgName: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  msgOrgBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  msgOrgText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  infoCard: { borderRadius: 16, overflow: "hidden" },
  infoDiv: { height: 1, marginHorizontal: 14 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  nfcInfoCard: { borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  nfcInfoTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  nfcInfoSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  ticketSection: {},
  ticketCard: { borderRadius: 16, padding: 20, alignItems: "center", gap: 12 },
  ticketOrder: { fontSize: 12, fontFamily: "Inter_400Regular" },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  nfcLinkBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, width: "100%", justifyContent: "center" },
  nfcLinkText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, width: "100%", justifyContent: "center" },
  cancelBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  footerLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  footerPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  bookBtn: { flex: 1, marginLeft: 20, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  bookBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  roleSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, backgroundColor: "#444", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  roleTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 6, textAlign: "center" },
  roleSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  roleOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1 },
  roleOptionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  skipBtn: { paddingVertical: 16, alignItems: "center" },
  skipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  msgInputWrap: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 80, marginBottom: 8 },
  msgInput: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  msgSendBtn: { width: "100%", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  msgSendText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
});
