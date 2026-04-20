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

import { NFCScanner } from "@/components/NFCScanner";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { SurveyModal } from "@/components/SurveyModal";
import type { Booking, Event } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookings, events, user, isAuthenticated, linkNFCToBooking, completeSurvey } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [nfcTarget, setNfcTarget] = useState<Booking | null>(null);
  const [surveyEvent, setSurveyEvent] = useState<Event | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={styles.title}>Mes billets</Text>
        </View>
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Feather name="bookmark" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Connexion requise</Text>
          <Text style={[styles.authText, { color: colors.mutedForeground }]}>Connectez-vous pour voir vos billets</Text>
          <Pressable style={[styles.authBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/auth")}>
            <Text style={styles.authBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const myBookings = bookings.filter(b => b.userId === user?.id && b.status !== "cancelled");
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
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mes billets</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.gold + "20" }]}>
          <Text style={[styles.countText, { color: colors.gold }]}>{myBookings.length}</Text>
        </View>
      </View>

      <FlatList
        data={myBookings}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 100 : 80 + insets.bottom }]}
        ListEmptyComponent={
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <Feather name="bookmark" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.authTitle, { color: colors.foreground }]}>Aucun billet</Text>
            <Text style={[styles.authText, { color: colors.mutedForeground }]}>Inscrivez-vous à un événement pour voir vos billets ici</Text>
            <Pressable style={[styles.authBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/")}>
              <Text style={styles.authBtnText}>Explorer les événements</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: booking }) => {
          const event = getEvent(booking.eventId);
          if (!event) return null;
          const isOpen = expanded === booking.id;
          const isUsed = booking.status === "used";
          const canSurvey = isUsed && !event.surveyCompleted;
          const earlyThreshold = Math.floor(event.maxParticipants * 0.4);
          const isEarly = booking.registrationOrder <= earlyThreshold;

          return (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Pressable onPress={() => setExpanded(isOpen ? null : booking.id)}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <View style={[styles.statusDot, { backgroundColor: isUsed ? colors.mutedForeground : colors.success }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventName, { color: colors.foreground }]} numberOfLines={1}>{event.title}</Text>
                      <View style={styles.cardMeta}>
                        <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                          {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {event.time}
                        </Text>
                        {isEarly && (
                          <View style={[styles.earlyBadge, { backgroundColor: colors.gold + "20" }]}>
                            <Text style={[styles.earlyText, { color: colors.gold }]}>Inscrit tôt</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardTopRight}>
                    <View style={[styles.ptsBadge, { backgroundColor: colors.gold + "15" }]}>
                      <Feather name="zap" size={9} color={colors.gold} />
                      <Text style={[styles.ptsText, { color: colors.gold }]}>+{booking.pointsEarned}</Text>
                    </View>
                    <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={15} color={colors.mutedForeground} />
                  </View>
                </View>
              </Pressable>

              {isOpen && (
                <View style={styles.expanded}>
                  <View style={[styles.expDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.qrWrap}>
                    <QRCodeDisplay value={booking.qrCode} size={160} />
                    <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>
                      Billet #{booking.registrationOrder} · {booking.role ?? "Participant"}
                    </Text>
                  </View>

                  <View style={styles.expActions}>
                    {!booking.nfcLinked && !isUsed && (
                      <Pressable
                        style={[styles.expBtn, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]}
                        onPress={() => setNfcTarget(booking)}
                      >
                        <Feather name="credit-card" size={14} color={colors.gold} />
                        <Text style={[styles.expBtnText, { color: colors.gold }]}>Lier ma carte NFC</Text>
                      </Pressable>
                    )}
                    {booking.nfcLinked && (
                      <View style={[styles.expBtn, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
                        <Feather name="check-circle" size={14} color={colors.success} />
                        <Text style={[styles.expBtnText, { color: colors.success }]}>Carte NFC liée</Text>
                      </View>
                    )}
                    <Pressable
                      style={[styles.expBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                      onPress={() => router.push(`/event/${event.id}`)}
                    >
                      <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.expBtnText, { color: colors.mutedForeground }]}>Voir l'événement</Text>
                    </Pressable>
                  </View>

                  {canSurvey && (
                    <Pressable
                      style={[styles.surveyBtn, { backgroundColor: colors.gold }]}
                      onPress={() => setSurveyEvent(event)}
                    >
                      <Feather name="star" size={14} color="#0D0D0D" />
                      <Text style={styles.surveyBtnText}>Donner mon avis (+points)</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      <NFCScanner visible={!!nfcTarget} onClose={() => setNfcTarget(null)} onNFCDetected={handleNFCLink} title="Lier ma carte Alvee" />
      <SurveyModal visible={!!surveyEvent} eventTitle={surveyEvent?.title ?? ""} onSubmit={handleSurvey} onClose={() => setSurveyEvent(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40, paddingTop: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  authTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  authText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  authBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  authBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
  list: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },
  card: { borderRadius: 18, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  eventName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  earlyBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  earlyText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  ptsBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ptsText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  expanded: { paddingHorizontal: 16, paddingBottom: 16 },
  expDivider: { height: 1, marginBottom: 16 },
  qrWrap: { alignItems: "center", gap: 10, marginBottom: 16 },
  orderLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  expActions: { gap: 8, marginBottom: 8 },
  expBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  expBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  surveyBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, justifyContent: "center", marginTop: 4 },
  surveyBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
});
