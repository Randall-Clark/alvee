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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NFCScanner } from "@/components/NFCScanner";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { useApp } from "@/context/AppContext";
import type { Event } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ManageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, events, bookings, isAuthenticated, validateQRCode, validateNFC, cancelEvent, getEventBookings } = useApp();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [scanMode, setScanMode] = useState<"qr" | "nfc" | null>(null);
  const [qrInput, setQrInput] = useState("");
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [nfcVisible, setNfcVisible] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Gérer mes événements</Text>
        </View>
        <View style={styles.center}>
          <Feather name="settings" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Connexion requise</Text>
          <Pressable style={[styles.authBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/auth")}>
            <Text style={styles.authBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const myEvents = events.filter(e => e.organizerId === user?.id && e.status !== "cancelled");

  const handleScanQR = async () => {
    if (!selectedEvent || !qrInput.trim()) return;
    const result = await validateQRCode(selectedEvent.id, qrInput.trim());
    setScanResult(result);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setQrInput("");
  };

  const handleNFCScan = async (cardId: string) => {
    if (!selectedEvent) return;
    setNfcVisible(false);
    const result = await validateNFC(selectedEvent.id, cardId);
    setScanResult(result);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCancelEvent = (eventId: string) => {
    Alert.alert(
      "Annuler l'événement",
      "Êtes-vous sûr de vouloir annuler cet événement ? Cette action est irréversible.",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            cancelEvent(eventId);
            if (selectedEvent?.id === eventId) setSelectedEvent(null);
          },
        },
      ]
    );
  };

  const eventBookings = selectedEvent ? getEventBookings(selectedEvent.id) : [];
  const activeBookings = eventBookings.filter(b => b.status === "active");
  const usedBookings = eventBookings.filter(b => b.status === "used");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mes événements</Text>
        <Pressable
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/create")}
        >
          <Feather name="plus" size={16} color="#fff" />
        </Pressable>
      </View>

      {myEvents.length === 0 ? (
        <View style={styles.center}>
          <Feather name="calendar" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun événement créé</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Créez votre premier événement</Text>
          <Pressable style={[styles.authBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/create")}>
            <Text style={styles.authBtnText}>Créer un événement</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={myEvents}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 90 + 34 : 90 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: event }) => {
            const eb = getEventBookings(event.id);
            const active = eb.filter(b => b.status === "active").length;
            const used = eb.filter(b => b.status === "used").length;
            const fillRate = event.maxParticipants > 0 ? event.currentParticipants / event.maxParticipants : 0;

            return (
              <Pressable
                style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setSelectedEvent(event)}
              >
                <View style={styles.eventCardTop}>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: event.status === "upcoming" ? colors.primary + "20" : colors.mutedForeground + "20" }]}>
                    <Text style={[styles.statusText, { color: event.status === "upcoming" ? colors.primary : colors.mutedForeground }]}>
                      {event.status === "upcoming" ? "À venir" : event.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventMeta}>
                  <View style={styles.metaItem}>
                    <Feather name="calendar" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="users" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {event.currentParticipants}/{event.maxParticipants}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="check" size={12} color={colors.success} />
                    <Text style={[styles.metaText, { color: colors.success }]}>{used} validés</Text>
                  </View>
                </View>

                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${fillRate * 100}%` as any, backgroundColor: colors.primary }]} />
                </View>

                <View style={styles.eventCardActions}>
                  <Pressable
                    style={[styles.manageBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setSelectedEvent(event)}
                  >
                    <Feather name="settings" size={14} color="#fff" />
                    <Text style={styles.manageBtnText}>Gérer</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.cancelEventBtn, { borderColor: colors.destructive + "40" }]}
                    onPress={() => handleCancelEvent(event.id)}
                  >
                    <Feather name="x" size={14} color={colors.destructive} />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={!!selectedEvent} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => { setSelectedEvent(null); setScanResult(null); }}>
                <Feather name="x" size={22} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
                {selectedEvent.title}
              </Text>
              <View style={{ width: 22 }} />
            </View>

            <View style={styles.modalStats}>
              <StatCard label="Inscrits" value={activeBookings.length.toString()} color={colors.primary} icon="users" colors={colors} />
              <StatCard label="Validés" value={usedBookings.length.toString()} color={colors.success} icon="check-circle" colors={colors} />
              <StatCard label="Places" value={`${selectedEvent.currentParticipants}/${selectedEvent.maxParticipants}`} color={colors.accent} icon="bar-chart-2" colors={colors} />
            </View>

            <View style={[styles.scanSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.scanTitle, { color: colors.foreground }]}>Scanner une entrée</Text>

              <View style={[styles.qrInputRow, { borderColor: colors.border }]}>
                <Feather name="maximize" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.qrInput, { color: colors.foreground }]}
                  placeholder="Coller ou saisir le code QR"
                  placeholderTextColor={colors.mutedForeground}
                  value={qrInput}
                  onChangeText={setQrInput}
                />
                <Pressable
                  style={[styles.scanSubmitBtn, { backgroundColor: colors.primary, opacity: qrInput.trim() ? 1 : 0.4 }]}
                  onPress={handleScanQR}
                  disabled={!qrInput.trim()}
                >
                  <Feather name="check" size={16} color="#fff" />
                </Pressable>
              </View>

              <Pressable
                style={[styles.nfcBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                onPress={() => setNfcVisible(true)}
              >
                <Feather name="wifi" size={16} color={colors.primary} />
                <Text style={[styles.nfcBtnText, { color: colors.primary }]}>Scanner une carte NFC</Text>
              </Pressable>

              {scanResult && (
                <View style={[styles.scanResult, { backgroundColor: scanResult.success ? colors.success + "15" : colors.destructive + "15" }]}>
                  <Feather name={scanResult.success ? "check-circle" : "x-circle"} size={18} color={scanResult.success ? colors.success : colors.destructive} />
                  <Text style={[styles.scanResultText, { color: scanResult.success ? colors.success : colors.destructive }]}>
                    {scanResult.message}
                  </Text>
                </View>
              )}
            </View>

            <FlatList
              data={activeBookings}
              keyExtractor={item => item.id}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, gap: 8 }}
              ListHeaderComponent={
                <Text style={[styles.listHeader, { color: colors.mutedForeground }]}>Participants inscrits ({activeBookings.length})</Text>
              }
              renderItem={({ item: b }) => (
                <View style={[styles.participantRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.avatarSmall, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarSmallText}>{b.userName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.participantName, { color: colors.foreground }]}>{b.userName}</Text>
                    <Text style={[styles.participantMeta, { color: colors.mutedForeground }]}>#{b.registrationOrder} • {b.nfcLinked ? "NFC lié" : "QR uniquement"}</Text>
                  </View>
                  <Feather name="check" size={14} color={colors.success} style={{ opacity: b.nfcLinked ? 1 : 0 }} />
                </View>
              )}
            />
          </View>
        )}
      </Modal>

      <NFCScanner
        visible={nfcVisible}
        onClose={() => setNfcVisible(false)}
        onNFCDetected={handleNFCScan}
        title="Scanner carte NFC"
      />
    </View>
  );
}

function StatCard({ label, value, color, icon, colors }: any) {
  return (
    <View style={[statStyles.card, { backgroundColor: color + "15", borderColor: color + "30" }]}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: 12, borderWidth: 1, alignItems: "center", padding: 12, gap: 4 },
  value: { fontSize: 20, fontFamily: "Inter_700Bold" },
  label: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  authBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  authBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  eventCard: { borderRadius: 16, borderWidth: 1, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  eventCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  eventTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  eventMeta: { flexDirection: "row", gap: 12, marginBottom: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressBar: { height: 3, borderRadius: 2, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", borderRadius: 2 },
  eventCardActions: { flexDirection: "row", gap: 8 },
  manageBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  manageBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cancelEventBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  modalStats: { flexDirection: "row", gap: 8, padding: 16 },
  scanSection: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  scanTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  qrInputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, overflow: "hidden" },
  qrInput: { flex: 1, paddingVertical: 10, fontSize: 13, fontFamily: "Inter_400Regular" },
  scanSubmitBtn: { padding: 8, margin: 4, borderRadius: 8 },
  nfcBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  nfcBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  scanResult: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  scanResultText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  listHeader: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  participantRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarSmallText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  participantName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  participantMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
