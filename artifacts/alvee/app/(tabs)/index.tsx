import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
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
const SORT_OPTIONS = [
  { key: "date", label: "Date (proche)" },
  { key: "price_asc", label: "Prix (croissant)" },
  { key: "price_desc", label: "Prix (décroissant)" },
  { key: "spots", label: "Places restantes" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, events, unreadNotifCount } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [filterModal, setFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [priceMax, setPriceMax] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredEvents = useMemo(() => {
    let result = events.filter(e => {
      if (e.status === "cancelled") return false;
      const matchCat = selectedCategory === "Tous" || e.category === selectedCategory;
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
      const matchFree = !onlyFree || e.price === 0;
      const matchPrice = !priceMax || e.price <= parseFloat(priceMax);
      return matchCat && matchSearch && matchFree && matchPrice;
    });

    if (sortBy === "price_asc") result = result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") result = result.sort((a, b) => b.price - a.price);
    else if (sortBy === "spots") result = result.sort((a, b) => (a.maxParticipants - a.currentParticipants) - (b.maxParticipants - b.currentParticipants));
    else result = result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }, [events, search, selectedCategory, sortBy, priceMax, onlyFree]);

  const featured = filteredEvents.slice(0, 3);
  const filtersActive = sortBy !== "date" || !!priceMax || onlyFree;

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
                  <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                    {user?.name ? `Bonjour, ${user.name.split(" ")[0]} 👋` : "Découvrez"}
                  </Text>
                  <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mes événements</Text>
                </View>
                <View style={styles.headerRight}>
                  {user && (
                    <Pressable
                      style={[styles.pointsPill, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}
                      onPress={() => router.push("/(tabs)/profile")}
                    >
                      <Feather name="zap" size={12} color={colors.gold} />
                      <Text style={[styles.pointsNum, { color: colors.gold }]}>{user.points.toLocaleString("fr-FR")}</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => router.push(user ? "/notifications" : "/auth")}
                    style={{ position: "relative" }}
                  >
                    <Feather name="bell" size={22} color={colors.mutedForeground} />
                    {unreadNotifCount > 0 && (
                      <View style={[styles.bellBadge, { backgroundColor: colors.gold }]}>
                        <Text style={styles.bellText}>{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</Text>
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(user ? "/(tabs)/profile" : "/auth")}
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

              <View style={styles.searchRow}>
                <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
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
                <Pressable
                  style={[styles.filterBtn, { backgroundColor: filtersActive ? colors.gold : colors.card, borderColor: filtersActive ? colors.gold : colors.border }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilterModal(true); }}
                >
                  <Feather name="sliders" size={16} color={filtersActive ? "#0D0D0D" : colors.mutedForeground} />
                  {filtersActive && <View style={styles.filterDot} />}
                </Pressable>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedCategory(cat); }}
                  style={[styles.catChip, selectedCategory === cat
                    ? { backgroundColor: colors.gold, borderColor: colors.gold }
                    : { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[styles.catText, { color: selectedCategory === cat ? "#0D0D0D" : colors.mutedForeground }]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {filteredEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>À venir</Text>
                  <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{filteredEvents.length} événements</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
                  {featured.map(ev => <EventCard key={ev.id} event={ev} horizontal />)}
                </ScrollView>
                {filteredEvents.length > 3 && (
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tous les événements</Text>
                  </View>
                )}
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          if (index < 3) return null;
          return <View style={styles.listItem}><EventCard event={item} /></View>;
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <Feather name="calendar" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun événement</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Essayez une autre catégorie ou créez votre propre événement</Text>
            <Pressable style={[styles.createBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/create")}>
              <Text style={styles.createBtnText}>Créer un événement</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={filterModal} transparent animationType="slide" onRequestClose={() => setFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.filterSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.filterTitle, { color: colors.foreground }]}>Filtres & tri</Text>

            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Trier par</Text>
            {SORT_OPTIONS.map(opt => (
              <Pressable
                key={opt.key}
                style={[styles.sortOption, { borderColor: colors.border }]}
                onPress={() => setSortBy(opt.key)}
              >
                <Text style={[styles.sortOptionText, { color: colors.foreground }]}>{opt.label}</Text>
                {sortBy === opt.key && <Feather name="check" size={16} color={colors.gold} />}
              </Pressable>
            ))}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Prix maximum ($ CAD)</Text>
            <View style={[styles.priceInput, { backgroundColor: colors.muted }]}>
              <TextInput
                style={[styles.priceInputText, { color: colors.foreground }]}
                placeholder="Ex: 100"
                placeholderTextColor={colors.mutedForeground}
                value={priceMax}
                onChangeText={setPriceMax}
                keyboardType="numeric"
              />
              {!!priceMax && (
                <Pressable onPress={() => setPriceMax("")}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            <Pressable
              style={[styles.freeToggle, { backgroundColor: onlyFree ? colors.gold + "20" : colors.muted, borderColor: onlyFree ? colors.gold : colors.border }]}
              onPress={() => setOnlyFree(v => !v)}
            >
              <Feather name={onlyFree ? "check-square" : "square"} size={16} color={onlyFree ? colors.gold : colors.mutedForeground} />
              <Text style={[styles.freeToggleText, { color: onlyFree ? colors.gold : colors.foreground }]}>Événements gratuits uniquement</Text>
            </Pressable>

            <View style={styles.filterActions}>
              <Pressable style={[styles.resetBtn, { borderColor: colors.border }]} onPress={() => { setSortBy("date"); setPriceMax(""); setOnlyFree(false); }}>
                <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Réinitialiser</Text>
              </Pressable>
              <Pressable style={[styles.applyBtn, { backgroundColor: colors.gold }]} onPress={() => setFilterModal(false)}>
                <Text style={styles.applyBtnText}>Appliquer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  pointsPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pointsNum: { fontSize: 12, fontFamily: "Inter_700Bold" },
  bellBadge: { position: "absolute", top: -4, right: -6, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  bellText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterBtn: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  filterDot: { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: "#0D0D0D" },
  catList: { paddingHorizontal: 20, paddingBottom: 4, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  featuredList: { paddingLeft: 20, paddingRight: 8, paddingBottom: 4 },
  listItem: { paddingHorizontal: 20 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  createBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0D0D0D" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  filterSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, gap: 8 },
  sheetHandle: { width: 36, height: 4, backgroundColor: "#444", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  filterTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 8 },
  filterLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 4 },
  sortOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1 },
  sortOptionText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginVertical: 4 },
  priceInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  priceInputText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  freeToggle: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 13 },
  freeToggleText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  filterActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  resetBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  applyBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  applyBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
});
