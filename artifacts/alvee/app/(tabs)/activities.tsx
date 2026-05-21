import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NFCScanner } from "@/components/NFCScanner";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { QRScanner } from "@/components/QRScanner";
import { SurveyModal } from "@/components/SurveyModal";
import type { Booking, Event } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Tab = "inscriptions" | "publications";

export default function ActivitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("inscriptions");
  const { isAuthenticated } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Activités</Text>
        </View>
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Feather name="layers" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Connexion requise</Text>
          <Text style={[styles.authText, { color: colors.mutedForeground }]}>Connectez-vous pour voir vos inscriptions et publications</Text>
          <Pressable style={[styles.authBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/auth")}>
            <Text style={styles.authBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Activités</Text>
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={[styles.tabBtn, activeTab === "inscriptions" && { backgroundColor: colors.gold }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab("inscriptions"); }}
        >
          <Feather name="bookmark" size={14} color={activeTab === "inscriptions" ? "#0D0D0D" : colors.mutedForeground} />
          <Text style={[styles.tabBtnText, { color: activeTab === "inscriptions" ? "#0D0D0D" : colors.mutedForeground }]}>
            Mes Inscriptions
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === "publications" && { backgroundColor: colors.gold }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab("publications"); }}
        >
          <Feather name="calendar" size={14} color={activeTab === "publications" ? "#0D0D0D" : colors.mutedForeground} />
          <Text style={[styles.tabBtnText, { color: activeTab === "publications" ? "#0D0D0D" : colors.mutedForeground }]}>
            Mes Publications
          </Text>
        </Pressable>
      </View>

      {activeTab === "inscriptions" ? <InscriptionsTab /> : <PublicationsTab />}
    </View>
  );
}

function InscriptionsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookings, events, user, linkNFCToBooking, completeSurvey } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [nfcTarget, setNfcTarget] = useState<Booking | null>(null);
  const [surveyEvent, setSurveyEvent] = useState<Event | null>(null);

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
    <>
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
            <Text style={[styles.authTitle, { color: colors.foreground }]}>Aucune inscription</Text>
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
    </>
  );
}

function PublicationsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, events, validateQRCode, validateNFC, cancelEvent, getEventBookings } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [nfcVisible, setNfcVisible] = useState(false);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);

  const myEvents = events.filter(e => e.organizerId === user?.id && e.status !== "cancelled");

  const handleCameraQR = async (data: string) => {
    setQrScannerVisible(false);
    if (!selectedEvent) return;
    const result = await validateQRCode(selectedEvent.id, data);
    setScanResult(result);
    Haptics.notificationAsync(result.success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  };

  const handleNFCScan = async (cardId: string) => {
    if (!selectedEvent) return;
    setNfcVisible(false);
    const result = await validateNFC(selectedEvent.id, cardId);
    setScanResult(result);
    Haptics.notificationAsync(result.success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  };

  const handleCancel = (eventId: string) => Alert.alert("Annuler", "Annuler cet événement ?", [
    { text: "Non", style: "cancel" },
    { text: "Annuler", style: "destructive", onPress: () => { cancelEvent(eventId); if (selectedEvent?.id === eventId) setSelectedEvent(null); } },
  ]);

  const eBookings = selectedEvent ? getEventBookings(selectedEvent.id) : [];
  const activeB = eBookings.filter(b => b.status === "active");
  const usedB = eBookings.filter(b => b.status === "used");

  if (myEvents.length === 0) {
    return (
      <View style={styles.center}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
          <Feather name="calendar" size={40} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.authTitle, { color: colors.foreground }]}>Aucun événement créé</Text>
        <Text style={[styles.authText, { color: colors.mutedForeground }]}>Créez votre premier événement</Text>
        <Pressable style={[styles.authBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/create")}>
          <Text style={styles.authBtnText}>Créer un événement</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={myEvents}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 100 : 80 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Pressable style={[styles.newEventBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/create")}>
            <Feather name="plus" size={16} color="#0D0D0D" />
            <Text style={styles.newEventBtnText}>Créer un événement</Text>
          </Pressable>
        }
        renderItem={({ item: ev }) => {
          const eb = getEventBookings(ev.id);
          const used = eb.filter(b => b.status === "used").length;
          const fill = (ev.currentParticipants / Math.max(ev.maxParticipants, 1)) * 100;

          return (
            <View style={[styles.evCard, { backgroundColor: colors.card }]}>
              <View style={styles.evTop}>
                <Text style={[styles.evTitle, { color: colors.foreground }]} numberOfLines={1}>{ev.title}</Text>
                <View style={[styles.evStatus, { backgroundColor: colors.gold + "20" }]}>
                  <Text style={[styles.evStatusText, { color: colors.gold }]}>À venir</Text>
                </View>
              </View>
              <View style={styles.evMeta}>
                <View style={styles.evMetaItem}>
                  <Feather name="calendar" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.evMetaText, { color: colors.mutedForeground }]}>
                    {new Date(ev.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <View style={styles.evMetaItem}>
                  <Feather name="users" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.evMetaText, { color: colors.mutedForeground }]}>{ev.currentParticipants}/{ev.maxParticipants}</Text>
                </View>
                <View style={styles.evMetaItem}>
                  <Feather name="check" size={11} color={colors.success} />
                  <Text style={[styles.evMetaText, { color: colors.success }]}>{used} validés</Text>
                </View>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, { width: `${fill}%` as any, backgroundColor: colors.gold }]} />
              </View>
              <View style={styles.evActions}>
                <Pressable style={[styles.manageBtn, { backgroundColor: colors.gold }]} onPress={() => { setScanResult(null); setSelectedEvent(ev); }}>
                  <Feather name="settings" size={14} color="#0D0D0D" />
                  <Text style={styles.manageBtnText}>Gérer</Text>
                </Pressable>
                <Pressable style={[styles.deleteBtn, { borderColor: colors.destructive + "40" }]} onPress={() => handleCancel(ev.id)}>
                  <Feather name="x" size={14} color={colors.destructive} />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={!!selectedEvent} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => { setSelectedEvent(null); setScanResult(null); }}>
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>{selectedEvent.title}</Text>
              <View style={{ width: 20 }} />
            </View>
            <View style={styles.modalStats}>
              {[
                { icon: "users", val: activeB.length.toString(), label: "Inscrits", color: colors.gold },
                { icon: "check-circle", val: usedB.length.toString(), label: "Validés", color: colors.success },
                { icon: "bar-chart-2", val: `${selectedEvent.currentParticipants}/${selectedEvent.maxParticipants}`, label: "Places", color: colors.mutedForeground },
              ].map(s => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Feather name={s.icon as any} size={16} color={s.color} />
                  <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.scanCard, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
              <Text style={[styles.scanTitle, { color: colors.foreground }]}>Valider une entrée</Text>
              <Pressable style={[styles.cameraBtn, { backgroundColor: colors.gold }]} onPress={() => setQrScannerVisible(true)}>
                <Feather name="camera" size={16} color="#0D0D0D" />
                <Text style={styles.cameraBtnText}>Scanner un code QR</Text>
              </Pressable>
              <Pressable style={[styles.nfcBtn, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]} onPress={() => setNfcVisible(true)}>
                <Feather name="wifi" size={15} color={colors.gold} />
                <Text style={[styles.nfcBtnText, { color: colors.gold }]}>Lire une carte NFC</Text>
              </Pressable>
              {scanResult && (
                <View style={[styles.scanResult, { backgroundColor: scanResult.success ? colors.success + "15" : colors.destructive + "15" }]}>
                  <Feather name={scanResult.success ? "check-circle" : "x-circle"} size={16} color={scanResult.success ? colors.success : colors.destructive} />
                  <Text style={[styles.scanResultText, { color: scanResult.success ? colors.success : colors.destructive }]}>{scanResult.message}</Text>
                </View>
              )}
            </View>
            <FlatList
              data={activeB}
              keyExtractor={item => item.id}
              style={{ flex: 1, marginTop: 16 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              ListHeaderComponent={
                <Text style={[styles.participantsLabel, { color: colors.mutedForeground }]}>Participants ({activeB.length})</Text>
              }
              renderItem={({ item: b }) => (
                <View style={[styles.participantRow, { backgroundColor: colors.card }]}>
                  <View style={[styles.pAvatar, { backgroundColor: colors.gold + "30" }]}>
                    <Text style={[styles.pAvatarText, { color: colors.gold }]}>{b.userName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pName, { color: colors.foreground }]}>{b.userName}</Text>
                    <Text style={[styles.pMeta, { color: colors.mutedForeground }]}>#{b.registrationOrder}{b.role ? ` · ${b.role}` : ""}{b.nfcLinked ? " · NFC lié" : ""}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </Modal>

      <NFCScanner visible={nfcVisible} onClose={() => setNfcVisible(false)} onNFCDetected={handleNFCScan} title="Lire carte NFC" />
      <QRScanner visible={qrScannerVisible} onClose={() => setQrScannerVisible(false)} onScanned={handleCameraQR} title="Scanner code QR" />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  tabSwitcher: { flexDirection: "row", marginHorizontal: 20, marginBottom: 12, borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
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
  newEventBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, marginBottom: 4 },
  newEventBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
  evCard: { borderRadius: 18, padding: 16 },
  evTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  evTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1, marginRight: 8 },
  evStatus: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  evStatusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  evMeta: { flexDirection: "row", gap: 14, marginBottom: 10 },
  evMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  evMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressBar: { height: 3, borderRadius: 2, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", borderRadius: 2 },
  evActions: { flexDirection: "row", gap: 8 },
  manageBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12 },
  manageBtnText: { color: "#0D0D0D", fontSize: 13, fontFamily: "Inter_700Bold" },
  deleteBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  modalStats: { flexDirection: "row", gap: 10, padding: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  scanCard: { borderRadius: 16, padding: 16, gap: 10 },
  scanTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cameraBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14 },
  cameraBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
  nfcBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  nfcBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scanResult: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  scanResultText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  participantsLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  participantRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12 },
  pAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  pName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  pMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
