import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

import { NFCScanner } from "@/components/NFCScanner";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout, orderNFCCard, pointTransactions } = useApp();
  const [ordering, setOrdering] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={styles.title}>Profil</Text>
        </View>
        <View style={styles.center}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.card }]}>
            <Feather name="user" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={styles.authTitle}>Bienvenue sur Alvee</Text>
          <Text style={[styles.authText, { color: colors.mutedForeground }]}>
            Connectez-vous pour accéder à votre profil, vos points et votre carte NFC Alvee
          </Text>
          <Pressable style={[styles.loginBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/auth")}>
            <Text style={styles.loginBtnText}>Se connecter / S'inscrire</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleOrderNFC = async () => {
    if (user?.nfcCardOrdered) return;
    setOrdering(true);
    const ok = await orderNFCCard();
    setOrdering(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Commande confirmée !", `ID carte: ${user?.nfcCardId}\nLivraison sous 3-5 jours ouvrés.`);
    }
  };

  const handleLogout = () => Alert.alert("Déconnexion", "Sûr de vouloir vous déconnecter ?", [
    { text: "Annuler", style: "cancel" },
    { text: "Déconnecter", style: "destructive", onPress: logout },
  ]);

  const TX_ICONS: Record<string, string> = { event_booking: "zap", survey_bonus: "star", referral: "users" };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>Profil</Text>
        <Pressable onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 100 : 80 + insets.bottom }]}>
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
            <Text style={styles.avatarText}>{user!.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user!.name}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user!.email}</Text>
          </View>
          <View style={[styles.pointsPill, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}>
            <Feather name="zap" size={12} color={colors.gold} />
            <Text style={[styles.pointsNum, { color: colors.gold }]}>{user!.points.toLocaleString("fr-FR")}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { icon: "calendar", val: user!.eventsAttended.toString(), label: "Participations" },
            { icon: "plus-circle", val: user!.eventsCreated.toString(), label: "Créés" },
            { icon: "zap", val: user!.points.toString(), label: "Points" },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Feather name={s.icon as any} size={18} color={colors.gold} />
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.nfcCard, { backgroundColor: "#1A1500" }]}>
          <View style={styles.nfcLeft}>
            <View style={[styles.nfcIcon, { backgroundColor: colors.gold + "25" }]}>
              <Feather name="credit-card" size={22} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nfcTitle, { color: colors.gold }]}>Carte NFC Alvee</Text>
              <Text style={[styles.nfcSub, { color: colors.mutedForeground }]}>
                {user!.nfcCardOrdered ? (user!.nfcCardId ?? "En cours d'envoi...") : "Votre pass physique premium"}
              </Text>
            </View>
          </View>
          {!user!.nfcCardOrdered ? (
            <Pressable style={[styles.orderBtn, { backgroundColor: colors.gold }]} onPress={handleOrderNFC} disabled={ordering}>
              <Text style={styles.orderBtnText}>{ordering ? "..." : "Commander"}</Text>
            </Pressable>
          ) : (
            <View style={[styles.orderBtn, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40", borderWidth: 1 }]}>
              <Feather name="check" size={12} color={colors.gold} />
              <Text style={[styles.orderBtnText, { color: colors.gold }]}>Commandée</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Historique des points</Text>

        {pointTransactions.length === 0 ? (
          <View style={[styles.emptyTx, { backgroundColor: colors.card }]}>
            <Feather name="zap" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTxText, { color: colors.mutedForeground }]}>
              Participez à des événements pour gagner des points
            </Text>
          </View>
        ) : (
          <View style={[styles.txList, { backgroundColor: colors.card }]}>
            {pointTransactions.slice(0, 15).map((tx, i) => (
              <View key={tx.id}>
                {i > 0 && <View style={[styles.txDiv, { backgroundColor: colors.border }]} />}
                <View style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: tx.type === "survey_bonus" ? colors.gold + "20" : colors.muted }]}>
                    <Feather name={TX_ICONS[tx.type] as any ?? "zap"} size={13} color={tx.type === "survey_bonus" ? colors.gold : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txDesc}>{tx.description}</Text>
                    <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{new Date(tx.createdAt).toLocaleDateString("fr-FR")}</Text>
                  </View>
                  <Text style={[styles.txPts, { color: colors.gold }]}>+{tx.points}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  authTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF", textAlign: "center" },
  authText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  loginBtnText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  profileCard: { borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#0D0D0D", fontSize: 20, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pointsPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pointsNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 6 },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  nfcCard: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(201,168,76,0.2)" },
  nfcLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  nfcIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  nfcTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  nfcSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  orderBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  orderBtnText: { color: "#0D0D0D", fontSize: 12, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  emptyTx: { borderRadius: 14, padding: 24, alignItems: "center", gap: 10 },
  emptyTxText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  txList: { borderRadius: 16, overflow: "hidden" },
  txDiv: { height: 1, marginHorizontal: 16 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#FFFFFF" },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  txPts: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
