import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  points: number;
  size?: "sm" | "md" | "lg";
}

export function PointsBadge({ points, size = "md" }: Props) {
  const colors = useColors();

  const sizes = {
    sm: { icon: 12, text: 12, padding: 4 },
    md: { icon: 14, text: 14, padding: 6 },
    lg: { icon: 18, text: 20, padding: 8 },
  };

  const s = sizes[size];

  return (
    <View style={[styles.badge, { backgroundColor: colors.gold + "22", paddingHorizontal: s.padding + 4, paddingVertical: s.padding }]}>
      <Feather name="zap" size={s.icon} color={colors.gold} />
      <Text style={[styles.text, { color: colors.gold, fontSize: s.text, fontFamily: "Inter_700Bold" }]}>
        {points.toLocaleString("fr-FR")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
  },
  text: {
    fontWeight: "700",
  },
});
