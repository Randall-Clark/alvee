import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Event } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getEventImage } from "@/utils/eventImages";
import { formatPrice } from "@/utils/currency";

interface Props {
  event: Event;
  compact?: boolean;
  horizontal?: boolean;
}

export function EventCard({ event, compact, horizontal }: Props) {
  const colors = useColors();
  const { user } = useApp();
  const isFull = event.currentParticipants >= event.maxParticipants;
  const fillPct = Math.min((event.currentParticipants / Math.max(event.maxParticipants, 1)) * 100, 100);
  const requiresPrime = event.price >= 300;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/event/${event.id}`);
  };

  const dateStr = new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).toUpperCase();

  if (horizontal) {
    return (
      <Pressable
        style={({ pressed }) => [styles.hCard, pressed && { opacity: 0.9 }]}
        onPress={handlePress}
      >
        <Image source={getEventImage(event.coverImage)} style={styles.hImage} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={styles.hGradient}
        />
        <View style={styles.hContent}>
          <View style={styles.hTop}>
            <View style={[styles.catPill, { backgroundColor: "rgba(201,168,76,0.25)", borderColor: "rgba(201,168,76,0.4)" }]}>
              <Text style={[styles.catPillText, { color: colors.gold }]}>{event.category}</Text>
            </View>
            {event.nfcOnlyEntry && (
              <View style={[styles.nfcPill, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Feather name="credit-card" size={9} color="#fff" />
              </View>
            )}
            {requiresPrime && (
              <View style={[styles.nfcPill, { backgroundColor: "rgba(201,168,76,0.3)" }]}>
                <Feather name="credit-card" size={9} color={colors.gold} />
                <Text style={[styles.nfcText, { color: colors.gold }]}>Prime</Text>
              </View>
            )}
          </View>
          <Text style={styles.hTitle} numberOfLines={2}>{event.title}</Text>
          <View style={styles.hMeta}>
            <Feather name="calendar" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={styles.hMetaText}>{dateStr} · {event.time}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card }, pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] }]}
      onPress={handlePress}
    >
      <View style={styles.imageWrap}>
        <Image source={getEventImage(event.coverImage)} style={styles.image} contentFit="cover" />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.imageGradient} />
        <View style={styles.imageBadges}>
          <View style={[styles.catPill, { backgroundColor: "rgba(201,168,76,0.3)", borderColor: "rgba(201,168,76,0.5)" }]}>
            <Text style={[styles.catPillText, { color: colors.gold }]}>{event.category}</Text>
          </View>
          {event.nfcOnlyEntry && (
            <View style={[styles.nfcPill, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="credit-card" size={9} color="#fff" />
              <Text style={styles.nfcText}>NFC only</Text>
            </View>
          )}
          {requiresPrime && (
            <View style={[styles.nfcPill, { backgroundColor: "rgba(201,168,76,0.25)" }]}>
              <Feather name="credit-card" size={9} color={colors.gold} />
              <Text style={[styles.nfcText, { color: colors.gold }]}>Prime requis</Text>
            </View>
          )}
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceTagText}>{formatPrice(event.price, user?.country)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <View style={styles.organizer}>
          <View style={[styles.orgAvatar, { backgroundColor: colors.gold + "30" }]}>
            <Feather name="user" size={10} color={colors.gold} />
          </View>
          <Text style={[styles.orgName, { color: colors.mutedForeground }]}>{event.organizerName}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.footer}>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Feather name="calendar" size={11} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{dateStr} · {event.time}</Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={11} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>{event.location}</Text>
            </View>
          </View>
          <View style={styles.footerRight}>
            <View style={[styles.pointsBadge, { backgroundColor: colors.gold + "18" }]}>
              <Feather name="zap" size={10} color={colors.gold} />
              <Text style={[styles.pointsText, { color: colors.gold }]}>{event.totalPoints}pts</Text>
            </View>
            <View style={styles.spotsRow}>
              <Text style={[styles.spotsText, { color: isFull ? colors.destructive : colors.mutedForeground }]}>
                {isFull ? "Complet" : `${event.maxParticipants - event.currentParticipants} places`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 14,
  },
  imageWrap: { position: "relative", height: 180 },
  image: { width: "100%", height: "100%" },
  imageGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80 },
  imageBadges: { position: "absolute", top: 12, left: 12, flexDirection: "row", gap: 6 },
  catPill: {
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
    flexDirection: "row", alignItems: "center",
  },
  catPillText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  nfcPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 20 },
  nfcText: { fontSize: 9, color: "#fff", fontFamily: "Inter_600SemiBold" },
  priceTag: {
    position: "absolute", bottom: 10, right: 12,
    backgroundColor: "rgba(201,168,76,0.9)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  priceTagText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  body: { padding: 14 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 6, lineHeight: 22 },
  organizer: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  orgAvatar: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  orgName: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginBottom: 10 },
  footer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  metaCol: { flex: 1, gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  footerRight: { alignItems: "flex-end", gap: 4 },
  pointsBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pointsText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  spotsRow: {},
  spotsText: { fontSize: 10, fontFamily: "Inter_400Regular" },

  hCard: { width: 220, height: 260, borderRadius: 20, overflow: "hidden", marginRight: 12 },
  hImage: { width: "100%", height: "100%" },
  hGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 130 },
  hContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
  hTop: { flexDirection: "row", gap: 6, marginBottom: 8 },
  hTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFFFFF", lineHeight: 20, marginBottom: 6 },
  hMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  hMetaText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
});
