import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NFCScanner } from "@/components/NFCScanner";
import { PointsBadge } from "@/components/PointsBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout, orderNFCCard, pointTransactions } = useApp();
  const [nfcVisible, setNfcVisible] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profil</Text>
        </View>
        <View style={styles.center}>
          <Feather name="user" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Bienvenue sur Alvee</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Connectez-vous pour accéder à votre profil, vos points et votre carte NFC
          </Text>
          <Pressable
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.loginBtnText}>Se connecter / S'inscrire</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleOrderNFC = async () => {
    if (user?.nfcCardOrdered) return;
    setOrdering(true);
    const success = await orderNFCCard();
    setOrdering(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Commande confirmée !",
        `Votre carte NFC Alvee (ID: ${user?.nfcCardId}) est en cours d'envoi. Vous la recevrez dans 3-5 jours ouvrés.`
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profil</Text>
        <Pressable onPress={handleLogout}>
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 90 + 34 : 90 + insets.bottom }]}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user!.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user!.name}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user!.email}</Text>
          </View>
          <PointsBadge points={user!.points} size="md" />
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user!.eventsAttended}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Participations</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="plus-circle" size={20} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user!.eventsCreated}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Créés</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="zap" size={20} color={colors.gold} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user!.points.toLocaleString("fr-FR")}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Points</Text>
          </View>
        </View>

        <View style={[styles.nfcCard, { backgroundColor: colors.primary, }]}>
          <View style={styles.nfcCardLeft}>
            <View style={[styles.nfcIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="credit-card" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.nfcCardTitle}>Carte NFC Alvee</Text>
              <Text style={styles.nfcCardSub}>
                {user!.nfcCardOrdered
                  ? user!.nfcCardId
                    ? `ID: ${user!.nfcCardId}`
                    : "En cours d'envoi..."
                  : "Commandez votre pass physique"}
              </Text>
            </View>
          </View>
          {!user!.nfcCardOrdered ? (
            <Pressable
              style={[styles.orderBtn, { backgroundColor: "rgba(255,255,255,0.25)" }]}
              onPress={handleOrderNFC}
              disabled={ordering}
            >
              <Text style={styles.orderBtnText}>{ordering ? "..." : "Commander"}</Text>
            </Pressable>
          ) : (
            <View style={[styles.orderBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="check" size={14} color="#fff" />
              <Text style={styles.orderBtnText}>Commandée</Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Historique des points</Text>
        {pointTransactions.length === 0 ? (
          <View style={[styles.emptyTx, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="zap" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTxText, { color: colors.mutedForeground }]}>
              Participez à des événements pour gagner des points !
            </Text>
          </View>
        ) : (
          pointTransactions.slice(0, 10).map(tx => (
            <View key={tx.id} style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === "survey_bonus" ? colors.gold + "20" : colors.primary + "20" }]}>
                <Feather
                  name={tx.type === "survey_bonus" ? "star" : tx.type === "referral" ? "users" : "zap"}
                  size={14}
                  color={tx.type === "survey_bonus" ? colors.gold : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
                <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                  {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <Text style={[styles.txPoints, { color: colors.gold }]}>+{tx.points}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  loginBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  profileCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1 },
  userName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  userEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  nfcCard: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nfcCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  nfcIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  nfcCardTitle: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  nfcCardSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  orderBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  orderBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 4 },
  emptyTx: { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  emptyTxText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 13, fontFamily: "Inter_500Medium" },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  txPoints: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
