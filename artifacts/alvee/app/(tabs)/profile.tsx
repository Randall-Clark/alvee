import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
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

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";

const TIER_NAMES: Record<string, string> = { none: "Aucune", standard: "Standard", prime: "Prime", platinum: "Platinum" };
const TIER_COLORS: Record<string, string> = { none: "#555", standard: "#888", prime: "#C9A84C", platinum: "#D0D0D0" };

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { user, isAuthenticated, logout, pointTransactions, unreadNotifCount } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profil</Text>
        </View>
        <View style={styles.center}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.card }]}>
            <Feather name="user" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Bienvenue sur Alvee</Text>
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

  const handleLogout = () => Alert.alert("Déconnexion", "Sûr de vouloir vous déconnecter ?", [
    { text: "Annuler", style: "cancel" },
    { text: "Déconnecter", style: "destructive", onPress: logout },
  ]);

  const TX_ICONS: Record<string, string> = { event_booking: "zap", survey_bonus: "star", referral: "users", walk_in: "wifi" };

  const THEME_OPTIONS: Array<{ mode: "dark" | "light" | "system"; label: string; icon: string }> = [
    { mode: "dark", label: "Sombre", icon: "moon" },
    { mode: "light", label: "Clair", icon: "sun" },
    { mode: "system", label: "Système", icon: "smartphone" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profil</Text>
        <View style={styles.headerRight}>
          <Pressable
            style={{ position: "relative" }}
            onPress={() => router.push("/notifications")}
          >
            <Feather name="bell" size={20} color={colors.mutedForeground} />
            {unreadNotifCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: colors.gold }]}>
                <Text style={styles.bellBadgeText}>{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={handleLogout}>
            <Feather name="log-out" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 100 : 80 + insets.bottom }]}>
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
            <Text style={styles.avatarText}>{user!.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user!.name}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user!.email}</Text>
            <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[user!.nfcCardTier] + "25" }]}>
              <Feather name="credit-card" size={10} color={TIER_COLORS[user!.nfcCardTier]} />
              <Text style={[styles.tierText, { color: TIER_COLORS[user!.nfcCardTier] }]}>
                Carte {TIER_NAMES[user!.nfcCardTier]}
              </Text>
            </View>
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
              <Text style={[styles.statVal, { color: colors.foreground }]}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Mon compte</Text>
          <MenuItem icon="credit-card" label="Carte Alvee" sub={`${TIER_NAMES[user!.nfcCardTier]} · Gérer ou commander`} colors={colors} onPress={() => router.push("/nfc-card")} accentColor={TIER_COLORS[user!.nfcCardTier]} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="dollar-sign" label="Paiement" sub="Gérer mes moyens de paiement" colors={colors} onPress={() => router.push("/payment")} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="bell" label="Notifications" sub={unreadNotifCount > 0 ? `${unreadNotifCount} non lues` : "Tout à jour"} colors={colors} onPress={() => router.push("/notifications")} badge={unreadNotifCount} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Apparence</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(opt => (
              <Pressable
                key={opt.mode}
                style={[
                  styles.themeBtn,
                  themeMode === opt.mode
                    ? { backgroundColor: colors.gold, borderColor: colors.gold }
                    : { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setThemeMode(opt.mode); }}
              >
                <Feather name={opt.icon as any} size={15} color={themeMode === opt.mode ? "#0D0D0D" : colors.mutedForeground} />
                <Text style={[styles.themeBtnText, { color: themeMode === opt.mode ? "#0D0D0D" : colors.mutedForeground }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Historique des points</Text>
        {pointTransactions.length === 0 ? (
          <View style={[styles.emptyTx, { backgroundColor: colors.card }]}>
            <Feather name="zap" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTxText, { color: colors.mutedForeground }]}>Participez à des événements pour gagner des points</Text>
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
                    <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
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

function MenuItem({ icon, label, sub, colors, onPress, accentColor, badge }: { icon: string; label: string; sub: string; colors: any; onPress: () => void; accentColor?: string; badge?: number }) {
  return (
    <Pressable style={mStyles.row} onPress={onPress}>
      <View style={[mStyles.iconWrap, { backgroundColor: (accentColor ?? colors.gold) + "20" }]}>
        <Feather name={icon as any} size={15} color={accentColor ?? colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[mStyles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[mStyles.sub, { color: colors.mutedForeground }]}>{sub}</Text>
      </View>
      {badge && badge > 0 ? (
        <View style={[mStyles.badge, { backgroundColor: colors.gold }]}>
          <Text style={mStyles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const mStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginRight: 4 },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  bellBadge: { position: "absolute", top: -4, right: -6, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  bellBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  authTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  authText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  loginBtnText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  profileCard: { borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#0D0D0D", fontSize: 20, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 1 },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  tierText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  pointsPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pointsNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 6 },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: { borderRadius: 16, overflow: "hidden" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  divider: { height: 1, marginHorizontal: 16 },
  themeRow: { flexDirection: "row", gap: 8, padding: 12 },
  themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  themeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyTx: { borderRadius: 14, padding: 24, alignItems: "center", gap: 10 },
  emptyTxText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  txList: { borderRadius: 16, overflow: "hidden" },
  txDiv: { height: 1, marginHorizontal: 16 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 13, fontFamily: "Inter_500Medium" },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  txPts: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
