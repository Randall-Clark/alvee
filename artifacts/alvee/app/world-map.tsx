import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo, useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { COUNTRIES, WORLD_OPTION, searchCountries, type Country } from "@/utils/countries";

export default function WorldMapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedCountry, setSelectedCountry } = useApp();
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = useMemo(() => searchCountries(query), [query]);

  const handleSelect = useCallback(
    (country: Country | null) => {
      setSelectedCountry(country);
      router.back();
    },
    [setSelectedCountry],
  );

  const isWorld = !selectedCountry || selectedCountry.code === "WORLD";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Carte du monde</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Choisissez votre zone de découverte</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Rechercher un pays..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          !query ? (
            <>
              {/* World option */}
              <Pressable
                onPress={() => handleSelect(WORLD_OPTION)}
                style={[styles.worldRow, {
                  backgroundColor: isWorld ? colors.gold + "18" : colors.card,
                  borderColor: isWorld ? colors.gold : colors.border,
                }]}
              >
                <Text style={styles.worldFlag}>🌍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.worldName, { color: colors.foreground }]}>Monde entier</Text>
                  <Text style={[styles.worldSub, { color: colors.mutedForeground }]}>
                    Voir les tendances mondiales et les événements près de vous
                  </Text>
                </View>
                {isWorld && <Feather name="check-circle" size={20} color={colors.gold} />}
              </Pressable>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {COUNTRIES.length} pays disponibles
              </Text>
            </>
          ) : null
        }
        renderItem={({ item }) => {
          const active = selectedCountry?.code === item.code;
          return (
            <Pressable
              onPress={() => handleSelect(item)}
              style={[styles.countryRow, { borderBottomColor: colors.border }]}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <Text style={[styles.countryName, { color: colors.foreground }]}>{item.name}</Text>
              {active && <Feather name="check" size={18} color={colors.gold} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Aucun pays trouvé pour «{query}»
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  worldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 4,
  },
  worldFlag: { fontSize: 36 },
  worldName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  worldSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  divider: { height: 1, marginHorizontal: 20, marginTop: 16, marginBottom: 4 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flag: { fontSize: 26, width: 36, textAlign: "center" },
  countryName: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  emptyWrap: { paddingTop: 40, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
