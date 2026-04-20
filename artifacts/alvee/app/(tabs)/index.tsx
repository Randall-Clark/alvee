import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventCard } from "@/components/EventCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Tous", "Music", "Tech", "Sport", "Art", "Food", "Social", "Networking", "Party"];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, events } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.status === "cancelled") return false;
      const matchCat = selectedCategory === "Tous" || e.category === selectedCategory;
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [events, search, selectedCategory]);

  const featured = filteredEvents.slice(0, 3);
  const rest = filteredEvents.slice(3);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : 80 + insets.bottom }}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { paddingTop: topPad + 16 }]}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.greeting}>
                    {user?.name ? `Bonjour, ${user.name.split(" ")[0]}` : "Découvrez"} 👋
                  </Text>
                  <Text style={styles.headerTitle}>Mes événements</Text>
                </View>
                <View style={styles.headerRight}>
                  {user && (
                    <Pressable
                      style={[styles.pointsPill, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}
                      onPress={() => router.push("/profile")}
                    >
                      <Feather name="zap" size={12} color={colors.gold} />
                      <Text style={[styles.pointsNum, { color: colors.gold }]}>
                        {user.points.toLocaleString("fr-FR")}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => router.push(user ? "/profile" : "/auth")}
                    style={[styles.avatarBtn, { backgroundColor: user ? colors.gold : colors.muted }]}
                  >
                    {user ? (
                      <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                    ) : (
                      <Feather name="user" size={18} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Chercher un événement..."
                  placeholderTextColor={colors.mutedForeground}
                  value={search}
                  onChangeText={setSearch}
                />
                {!!search && (
                  <Pressable onPress={() => setSearch("")}>
                    <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.catChip,
                    selectedCategory === cat
                      ? { backgroundColor: colors.gold, borderColor: colors.gold }
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[
                    styles.catText,
                    { color: selectedCategory === cat ? "#0D0D0D" : colors.mutedForeground },
                  ]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {filteredEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Événements à venir</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
                  {featured.map(ev => (
                    <EventCard key={ev.id} event={ev} horizontal />
                  ))}
                </ScrollView>

                {rest.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tous les événements</Text>
                  </View>
                )}
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          if (index < 3 && !search && selectedCategory === "Tous") return null;
          return (
            <View style={styles.listItem}>
              <EventCard event={item} />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <Feather name="calendar" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun événement</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Essayez une autre catégorie ou créez votre propre événement
            </Text>
            <Pressable
              style={[styles.createBtn, { backgroundColor: colors.gold }]}
              onPress={() => router.push("/create")}
            >
              <Text style={styles.createBtnText}>Créer un événement</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888888", marginBottom: 2 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  pointsPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  pointsNum: { fontSize: 12, fontFamily: "Inter_700Bold" },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  catList: { paddingHorizontal: 20, paddingBottom: 4, gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  featuredList: { paddingLeft: 20, paddingRight: 8, paddingBottom: 4 },
  listItem: { paddingHorizontal: 20 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  createBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0D0D0D" },
});
