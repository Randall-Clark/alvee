import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Event } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  event: Event;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Music: "#7C3AED",
  Sport: "#10b981",
  Art: "#f59e0b",
  Tech: "#3b82f6",
  Food: "#ef4444",
  Social: "#ec4899",
  Networking: "#6366f1",
  Party: "#FF6B6B",
};

const CATEGORY_ICONS: Record<string, string> = {
  Music: "music",
  Sport: "activity",
  Art: "aperture",
  Tech: "cpu",
  Food: "coffee",
  Social: "users",
  Networking: "globe",
  Party: "star",
};

export function EventCard({ event, compact }: Props) {
  const colors = useColors();
  const categoryColor = CATEGORY_COLORS[event.category] ?? colors.primary;
  const fillRate = event.maxParticipants > 0 ? event.currentParticipants / event.maxParticipants : 0;
  const spotsLeft = event.maxParticipants - event.currentParticipants;
  const isFull = spotsLeft <= 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/event/${event.id}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.93, transform: [{ scale: 0.98 }] },
      ]}
      onPress={handlePress}
    >
      <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "20" }]}>
        <Feather name={CATEGORY_ICONS[event.category] as any ?? "calendar"} size={12} color={categoryColor} />
        <Text style={[styles.categoryText, { color: categoryColor }]}>{event.category}</Text>
        {event.requiresNFC && (
          <View style={[styles.nfcBadge, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="credit-card" size={10} color={colors.primary} />
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {event.title}
      </Text>

      {!compact && (
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {event.description}
        </Text>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.time}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(fillRate * 100, 100)}%` as any,
                  backgroundColor: isFull ? colors.destructive : (fillRate > 0.7 ? colors.warning : colors.success),
                },
              ]}
            />
          </View>
          <Text style={[styles.spotsText, { color: isFull ? colors.destructive : colors.mutedForeground }]}>
            {isFull ? "Complet" : `${spotsLeft} place${spotsLeft > 1 ? "s" : ""} restante${spotsLeft > 1 ? "s" : ""}`}
          </Text>
        </View>
        <View style={styles.footerRight}>
          <View style={[styles.pointsBadge, { backgroundColor: colors.gold + "20" }]}>
            <Feather name="zap" size={10} color={colors.gold} />
            <Text style={[styles.pointsText, { color: colors.gold }]}>{event.totalPoints} pts</Text>
          </View>
          <Text style={[styles.price, { color: colors.primary }]}>
            {event.price === 0 ? "Gratuit" : `${event.price}€`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  nfcBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flex: 1,
    marginRight: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  spotsText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  footerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
