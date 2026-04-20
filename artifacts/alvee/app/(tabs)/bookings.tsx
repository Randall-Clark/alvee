import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { NFCScanner } from "@/components/NFCScanner";
import { SurveyModal } from "@/components/SurveyModal";
import { useApp } from "@/context/AppContext";
import type { Booking, Event } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookings, events, user, isAuthenticated, linkNFCToBooking, completeSurvey } = useApp();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [nfcTarget, setNfcTarget] = useState<Booking | null>(null);
  const [surveyEvent, setSurveyEvent] = useState<Event | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Mes réservations</Text>
        </View>
        <View style={styles.center}>
          <Feather name="ticket" size={48} color={colors.mutedForeground} />
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Connexion requise</Text>
          <Pressable style={[styles.authBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/auth")}>
            <Text style={styles.authBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const myBookings = bookings.filter(b => b.userId === user?.id && b.status !== "cancelled");
  const completedBookings = bookings.filter(b => b.userId === user?.id && b.status === "used");

  const getEvent = (id: string) => events.find(e => e.id === id);

  const handleNFCLink = async (cardId: string) => {
    if (!nfcTarget) return;
    await linkNFCToBooking(nfcTarget.id, cardId);
    setNfcTarget(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSurvey = async (rating: number, feedback: string) => {
    if (!surveyEvent) return;
    await completeSurvey(surveyEvent.id, rating, feedback);
    setSurveyEvent(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mes réservations</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {myBookings.length} billet{myBookings.length !== 1 ? "s" : ""} actif{myBookings.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={myBookings}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 90 + 34 : 90 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="ticket" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune réservation</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Inscrivez-vous à un événement pour voir vos billets ici
            </Text>
            <Pressable style={[styles.exploreBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/")}>
              <Text style={styles.exploreBtnText}>Explorer les événements</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: booking }) => {
          const event = getEvent(booking.eventId);
          if (!event) return null;

          const isCompleted = booking.status === "used";
          const canSurvey = isCompleted && !event.surveyCompleted;
          const isExpanded = selectedBooking?.id === booking.id;

          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable onPress={() => setSelectedBooking(isExpanded ? null : booking)}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.statusDot, { backgroundColor: isCompleted ? colors.mutedForeground : colors.success }]} />
                    <View>
                      <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>
                        {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à {event.time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <View style={[styles.pointsBadge, { backgroundColor: colors.gold + "20" }]}>
                      <Feather name="zap" size={10} color={colors.gold} />
                      <Text style={[styles.pointsText, { color: colors.gold }]}>+{booking.pointsEarned}</Text>
                    </View>
                    <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                  </View>
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.cardExpanded}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.qrSection}>
                    <Text style={[styles.qrLabel, { color: colors.mutedForeground }]}>Votre billet</Text>
                    <QRCodeDisplay value={booking.qrCode} size={150} />
                    <Text style={[styles.orderText, { color: colors.mutedForeground }]}>
                      Inscription #{booking.registrationOrder}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    {!booking.nfcLinked && !isCompleted && (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                        onPress={() => setNfcTarget(booking)}
                      >
                        <Feather name="credit-card" size={16} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Lier ma carte NFC</Text>
                      </Pressable>
                    )}

                    {booking.nfcLinked && (
                      <View style={[styles.actionBtn, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
                        <Feather name="check-circle" size={16} color={colors.success} />
                        <Text style={[styles.actionText, { color: colors.success }]}>Carte NFC liée</Text>
                      </View>
                    )}

                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      onPress={() => router.push(`/event/${event.id}`)}
                    >
                      <Feather name="info" size={16} color={colors.foreground} />
                      <Text style={[styles.actionText, { color: colors.foreground }]}>Voir l'événement</Text>
                    </Pressable>
                  </View>

                  {canSurvey && (
                    <Pressable
                      style={[styles.surveyBtn, { backgroundColor: colors.gold }]}
                      onPress={() => setSurveyEvent(event)}
                    >
                      <Feather name="star" size={16} color="#fff" />
                      <Text style={styles.surveyBtnText}>Donner mon avis (+points)</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      <NFCScanner
        visible={!!nfcTarget}
        onClose={() => setNfcTarget(null)}
        onNFCDetected={handleNFCLink}
        title="Lier ma carte Alvee"
      />

      <SurveyModal
        visible={!!surveyEvent}
        eventTitle={surveyEvent?.title ?? ""}
        onSubmit={handleSurvey}
        onClose={() => setSurveyEvent(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  authTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  authBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  authBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  eventTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", maxWidth: 200 },
  eventDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  pointsBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pointsText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardExpanded: { paddingHorizontal: 16, paddingBottom: 16 },
  divider: { height: 1, marginBottom: 16 },
  qrSection: { alignItems: "center", gap: 8, marginBottom: 16 },
  qrLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  orderText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actions: { gap: 8, marginBottom: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  actionText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  surveyBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, justifyContent: "center", marginTop: 4 },
  surveyBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  exploreBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  exploreBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
