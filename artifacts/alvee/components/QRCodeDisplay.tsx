import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 180 }: Props) {
  const colors = useColors();

  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };

  const gridSize = 10;
  const cellSize = Math.floor(size / gridSize);
  const seed = hash(value);

  const grid: boolean[][] = Array.from({ length: gridSize }, (_, row) =>
    Array.from({ length: gridSize }, (_, col) => {
      if (row < 3 && col < 3) return true;
      if (row < 3 && col >= gridSize - 3) return true;
      if (row >= gridSize - 3 && col < 3) return true;
      const idx = row * gridSize + col;
      return ((seed >> (idx % 31)) & 1) === 1;
    })
  );

  return (
    <View style={[styles.container, { padding: 16, backgroundColor: "#ffffff", borderRadius: 16 }]}>
      <View style={[styles.qr, { width: gridSize * cellSize, height: gridSize * cellSize }]}>
        {grid.map((row, r) =>
          row.map((filled, c) => (
            <View
              key={`${r}-${c}`}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  left: c * cellSize,
                  top: r * cellSize,
                  backgroundColor: filled ? "#000000" : "transparent",
                },
              ]}
            />
          ))
        )}
      </View>
      <Text style={[styles.code, { color: colors.mutedForeground }]} numberOfLines={1}>
        {value.split("-").slice(-1)[0]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  qr: {
    position: "relative",
  },
  cell: {
    position: "absolute",
    borderRadius: 1,
  },
  code: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
});
