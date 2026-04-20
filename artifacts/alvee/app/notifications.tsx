import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AppNotification, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const NOTIF_ICONS: Record<AppNotification["type"], { icon: string; color: (c: any) => string }> = {
  booking: { icon: "check-circle", color: (c) => c.success },
  event_reminder: { icon: "clock", color: (c) => c.warning },
  points: { icon: "zap", color: (c) => c.gold },
  walk_in_request: { icon: "wifi", color: (c) => c.gold },
  refund: { icon: "rotate-ccw", color: (c) => c.primary },
  message: { icon: "message-circle", color: (c) => c.primary },
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, markNotifRead, markAllNotifsRead } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Feather name="x" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
        {unread > 0 ? (
          <Pressable onPress={markAllNotifsRead}>
            <Text style={[styles.markAll, { color: colors.gold }]}>Tout lire</Text>
          </Pressable>
        ) : <View style={{ width: 60 }} />}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <Feather name="bell" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune notification</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Vous serez notifié lors de vos réservations, rappels d'événements et mises à jour de points.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = NOTIF_ICONS[item.type] ?? NOTIF_ICONS.booking;
          return (
            <Pressable
              style={[
                styles.notifCard,
                {
                  backgroundColor: !item.read ? colors.card : colors.background,
                  borderColor: !item.read ? colors.border : "transparent",
                  borderWidth: 1,
                },
              ]}
              onPress={() => markNotifRead(item.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: cfg.color(colors) + "20" }]}>
                <Feather name={cfg.icon as any} size={16} color={cfg.color(colors)} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.notifTop}>
                  <Text style={[styles.notifTitle, { color: colors.foreground }]}>{item.title}</Text>
                  {!item.read && <View style={[styles.dot, { backgroundColor: colors.gold }]} />}
                </View>
                <Text style={[styles.notifBody, { color: colors.mutedForeground }]}>{item.body}</Text>
                <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  markAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  notifCard: { borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  notifTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 5 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
