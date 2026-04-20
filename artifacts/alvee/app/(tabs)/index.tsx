import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { formatDistance, haversineDistance } from "@/utils/distance";

const CATEGORIES = ["Tous", "Music", "Tech", "Sport", "Art", "Food", "Social", "Networking", "Party"];
const SORT_OPTIONS = [
  { key: "date", label: "Date (proche)" },
  { key: "price_asc", label: "Prix (croissant)" },
  { key: "price_desc", label: "Prix (décroissant)" },
  { key: "spots", label: "Places restantes" },
  { key: "distance", label: "Distance (proche)" },
];
const RADIUS_OPTIONS = [
  { km: 5, label: "5 km" },
  { km: 10, label: "10 km" },
  { km: 25, label: "25 km" },
  { km: 50, label: "50 km" },
  { km: 100, label: "100 km" },
  { km: 0, label: "Sans limite" },
];
const DATE_FILTERS = [
  { key: "all", label: "Toutes dates" },
  { key: "today", label: "Aujourd'hui" },
  { key: "tomorrow", label: "Demain" },
  { key: "week", label: "Cette semaine" },
  { key: "weekend", label: "Ce week-end" },
  { key: "month", label: "Ce mois" },
];
type LocationMode = "all" | "around" | "city" | "country";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, events, unreadNotifCount } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [filterModal, setFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState("date");

  // Filters
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyNfc, setOnlyNfc] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");

  // Location
  const [locationMode, setLocationMode] = useState<LocationMode>("all");
  const [radiusKm, setRadiusKm] = useState(25);
  const [cityFilter, setCityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const requestLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Activez la localisation dans les paramètres pour voir les événements près de vous");
        setLocLoading(false);
        return false;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setLocLoading(false);
      return true;
    } catch (e) {
      Alert.alert("Erreur", "Impossible de récupérer votre position");
      setLocLoading(false);
      return false;
    }
  };

  const handleEnableAround = async () => {
    if (!userCoords) {
      const ok = await requestLocation();
      if (!ok) return;
    }
    setLocationMode("around");
  };

  // Match date filter helper
  const matchesDate = (eventDate: string): boolean => {
    if (dateFilter === "all") return true;
    const ev = new Date(eventDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const evDay = new Date(ev.getFullYear(), ev.getMonth(), ev.getDate());
    const diffDays = Math.round((evDay.getTime() - today.getTime()) / 86400000);
    if (dateFilter === "today") return diffDays === 0;
    if (dateFilter === "tomorrow") return diffDays === 1;
    if (dateFilter === "week") return diffDays >= 0 && diffDays <= 7;
    if (dateFilter === "weekend") {
      const dow = ev.getDay();
      return diffDays >= 0 && diffDays <= 14 && (dow === 0 || dow === 6 || dow === 5);
    }
    if (dateFilter === "month") return ev.getMonth() === now.getMonth() && ev.getFullYear() === now.getFullYear();
    return true;
  };

  const filteredEvents = useMemo(() => {
    let result = events.filter(e => {
      if (e.status === "cancelled") return false;
      const matchCat = selectedCategory === "Tous" || e.category === selectedCategory;
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
      const matchFree = !onlyFree || e.price === 0;
      const matchPriceMin = !priceMin || e.price >= parseFloat(priceMin);
      const matchPriceMax = !priceMax || e.price <= parseFloat(priceMax);
      const matchAvail = !onlyAvailable || e.currentParticipants < e.maxParticipants;
      const matchNfc = !onlyNfc || e.nfcOnlyEntry;
      const matchDateF = matchesDate(e.date);

      // Location filtering
      let matchLoc = true;
      if (locationMode === "around" && userCoords && e.latitude && e.longitude) {
        const dist = haversineDistance(userCoords.lat, userCoords.lon, e.latitude, e.longitude);
        matchLoc = radiusKm === 0 || dist <= radiusKm;
      } else if (locationMode === "city" && cityFilter.trim()) {
        matchLoc = e.location.toLowerCase().includes(cityFilter.trim().toLowerCase()) ||
                   e.address.toLowerCase().includes(cityFilter.trim().toLowerCase());
      } else if (locationMode === "country" && countryFilter.trim()) {
        matchLoc = e.address.toLowerCase().includes(countryFilter.trim().toLowerCase());
      }

      return matchCat && matchSearch && matchFree && matchPriceMin && matchPriceMax && matchAvail && matchNfc && matchDateF && matchLoc;
    });

    // Sort with distance support
    if (sortBy === "price_asc") result = result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") result = result.sort((a, b) => b.price - a.price);
    else if (sortBy === "spots") result = result.sort((a, b) => (a.maxParticipants - a.currentParticipants) - (b.maxParticipants - b.currentParticipants));
    else if (sortBy === "distance" && userCoords) {
      result = result.sort((a, b) => {
        const dA = a.latitude && a.longitude ? haversineDistance(userCoords.lat, userCoords.lon, a.latitude, a.longitude) : 99999;
        const dB = b.latitude && b.longitude ? haversineDistance(userCoords.lat, userCoords.lon, b.latitude, b.longitude) : 99999;
        return dA - dB;
      });
    } else result = result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }, [events, search, selectedCategory, sortBy, priceMin, priceMax, onlyFree, onlyAvailable, onlyNfc, dateFilter, locationMode, radiusKm, cityFilter, countryFilter, userCoords]);

  const featured = filteredEvents.slice(0, 3);
  const filtersActive = sortBy !== "date" || !!priceMax || !!priceMin || onlyFree || onlyAvailable || onlyNfc || dateFilter !== "all" || locationMode !== "all";
  const activeFilterCount = [priceMin, priceMax, onlyFree, onlyAvailable, onlyNfc, dateFilter !== "all", locationMode !== "all", sortBy !== "date"].filter(Boolean).length;

  const resetFilters = () => {
    setSortBy("date");
    setPriceMin("");
    setPriceMax("");
    setOnlyFree(false);
    setOnlyAvailable(false);
    setOnlyNfc(false);
    setDateFilter("all");
    setLocationMode("all");
    setRadiusKm(25);
    setCityFilter("");
    setCountryFilter("");
  };

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
                  {activeFilterCount > 0 && (
                    <View style={[styles.filterCountBadge, { backgroundColor: "#0D0D0D" }]}>
                      <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {locationMode === "around" && userCoords && (
                <View style={[styles.locChip, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "40" }]}>
                  <Feather name="map-pin" size={12} color={colors.gold} />
                  <Text style={[styles.locChipText, { color: colors.gold }]}>
                    Autour de moi · {radiusKm === 0 ? "sans limite" : `${radiusKm} km`}
                  </Text>
                  <Pressable onPress={() => setLocationMode("all")}>
                    <Feather name="x" size={12} color={colors.gold} />
                  </Pressable>
                </View>
              )}
              {locationMode === "city" && cityFilter && (
                <View style={[styles.locChip, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "40" }]}>
                  <Feather name="navigation" size={12} color={colors.gold} />
                  <Text style={[styles.locChipText, { color: colors.gold }]}>Ville : {cityFilter}</Text>
                  <Pressable onPress={() => { setLocationMode("all"); setCityFilter(""); }}>
                    <Feather name="x" size={12} color={colors.gold} />
                  </Pressable>
                </View>
              )}
              {locationMode === "country" && countryFilter && (
                <View style={[styles.locChip, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "40" }]}>
                  <Feather name="flag" size={12} color={colors.gold} />
                  <Text style={[styles.locChipText, { color: colors.gold }]}>Pays : {countryFilter}</Text>
                  <Pressable onPress={() => { setLocationMode("all"); setCountryFilter(""); }}>
                    <Feather name="x" size={12} color={colors.gold} />
                  </Pressable>
                </View>
              )}
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
                  {featured.map(ev => {
                    const dist = userCoords && ev.latitude && ev.longitude
                      ? haversineDistance(userCoords.lat, userCoords.lon, ev.latitude, ev.longitude)
                      : null;
                    return (
                      <View key={ev.id}>
                        <EventCard event={ev} horizontal />
                        {dist !== null && (
                          <Text style={[styles.distText, { color: colors.mutedForeground }]}>
                            📍 {formatDistance(dist)}
                          </Text>
                        )}
                      </View>
                    );
                  })}
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
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Essayez d'élargir vos filtres ou créez votre propre événement
            </Text>
            {filtersActive && (
              <Pressable style={[styles.createBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={resetFilters}>
                <Text style={[styles.createBtnText, { color: colors.foreground }]}>Réinitialiser les filtres</Text>
              </Pressable>
            )}
            <Pressable style={[styles.createBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/create")}>
              <Text style={styles.createBtnText}>Créer un événement</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={filterModal} transparent animationType="slide" onRequestClose={() => setFilterModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModal(false)}>
          <Pressable style={[styles.filterSheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTopRow}>
              <Text style={[styles.filterTitle, { color: colors.foreground }]}>Filtres & tri</Text>
              <Pressable onPress={() => setFilterModal(false)} style={styles.closeIconBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* LOCATION */}
              <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Localisation</Text>
              <View style={styles.locModeRow}>
                <LocChip active={locationMode === "all"} onPress={() => setLocationMode("all")} colors={colors} icon="globe" label="Partout" />
                <LocChip
                  active={locationMode === "around"}
                  onPress={handleEnableAround}
                  colors={colors}
                  icon="map-pin"
                  label="Autour de moi"
                  loading={locLoading}
                />
                <LocChip active={locationMode === "city"} onPress={() => setLocationMode("city")} colors={colors} icon="navigation" label="Ville" />
                <LocChip active={locationMode === "country"} onPress={() => setLocationMode("country")} colors={colors} icon="flag" label="Pays" />
              </View>

              {locationMode === "around" && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>Rayon de recherche</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusRow}>
                    {RADIUS_OPTIONS.map(r => (
                      <Pressable
                        key={r.km}
                        onPress={() => setRadiusKm(r.km)}
                        style={[styles.radiusChip, radiusKm === r.km
                          ? { backgroundColor: colors.gold, borderColor: colors.gold }
                          : { backgroundColor: colors.muted, borderColor: colors.border }]}
                      >
                        <Text style={[styles.radiusText, { color: radiusKm === r.km ? "#0D0D0D" : colors.foreground }]}>{r.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {locationMode === "city" && (
                <View style={[styles.textInputBox, { backgroundColor: colors.muted, marginTop: 10 }]}>
                  <Feather name="navigation" size={14} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.textInputField, { color: colors.foreground }]}
                    placeholder="Ex : Montréal, Paris, Casablanca..."
                    placeholderTextColor={colors.mutedForeground}
                    value={cityFilter}
                    onChangeText={setCityFilter}
                  />
                </View>
              )}

              {locationMode === "country" && (
                <View style={[styles.textInputBox, { backgroundColor: colors.muted, marginTop: 10 }]}>
                  <Feather name="flag" size={14} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.textInputField, { color: colors.foreground }]}
                    placeholder="Ex : Canada, France, Maroc..."
                    placeholderTextColor={colors.mutedForeground}
                    value={countryFilter}
                    onChangeText={setCountryFilter}
                  />
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* DATE */}
              <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Date</Text>
              <View style={styles.dateRow}>
                {DATE_FILTERS.map(df => (
                  <Pressable
                    key={df.key}
                    onPress={() => setDateFilter(df.key)}
                    style={[styles.dateChip, dateFilter === df.key
                      ? { backgroundColor: colors.gold, borderColor: colors.gold }
                      : { backgroundColor: colors.muted, borderColor: colors.border }]}
                  >
                    <Text style={[styles.dateChipText, { color: dateFilter === df.key ? "#0D0D0D" : colors.foreground }]}>{df.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* SORT */}
              <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Trier par</Text>
              {SORT_OPTIONS.filter(o => o.key !== "distance" || userCoords).map(opt => (
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

              {/* PRICE */}
              <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Fourchette de prix</Text>
              <View style={styles.priceRangeRow}>
                <View style={[styles.priceInput, { backgroundColor: colors.muted, flex: 1 }]}>
                  <Text style={[styles.pricePrefix, { color: colors.mutedForeground }]}>Min</Text>
                  <TextInput
                    style={[styles.priceInputText, { color: colors.foreground }]}
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    value={priceMin}
                    onChangeText={setPriceMin}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.priceInput, { backgroundColor: colors.muted, flex: 1 }]}>
                  <Text style={[styles.pricePrefix, { color: colors.mutedForeground }]}>Max</Text>
                  <TextInput
                    style={[styles.priceInputText, { color: colors.foreground }]}
                    placeholder="∞"
                    placeholderTextColor={colors.mutedForeground}
                    value={priceMax}
                    onChangeText={setPriceMax}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* TOGGLES */}
              <ToggleRow value={onlyFree} onToggle={() => setOnlyFree(v => !v)} colors={colors} icon="gift" label="Événements gratuits uniquement" />
              <ToggleRow value={onlyAvailable} onToggle={() => setOnlyAvailable(v => !v)} colors={colors} icon="users" label="Places disponibles uniquement" />
              <ToggleRow value={onlyNfc} onToggle={() => setOnlyNfc(v => !v)} colors={colors} icon="credit-card" label="Entrée NFC obligatoire" />

              <View style={styles.filterActions}>
                <Pressable style={[styles.resetBtn, { borderColor: colors.border }]} onPress={resetFilters}>
                  <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Réinitialiser</Text>
                </Pressable>
                <Pressable style={[styles.applyBtn, { backgroundColor: colors.gold }]} onPress={() => setFilterModal(false)}>
                  <Text style={styles.applyBtnText}>
                    Voir {filteredEvents.length} {filteredEvents.length > 1 ? "résultats" : "résultat"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function LocChip({ active, onPress, colors, icon, label, loading }: { active: boolean; onPress: () => void; colors: any; icon: string; label: string; loading?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.locModeChip, active
        ? { backgroundColor: colors.gold, borderColor: colors.gold }
        : { backgroundColor: colors.muted, borderColor: colors.border }]}
    >
      {loading
        ? <ActivityIndicator size="small" color={active ? "#0D0D0D" : colors.gold} />
        : <Feather name={icon as any} size={13} color={active ? "#0D0D0D" : colors.foreground} />}
      <Text style={[styles.locModeText, { color: active ? "#0D0D0D" : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({ value, onToggle, colors, icon, label }: { value: boolean; onToggle: () => void; colors: any; icon: string; label: string }) {
  return (
    <Pressable
      style={[styles.freeToggle, { backgroundColor: value ? colors.gold + "20" : colors.muted, borderColor: value ? colors.gold : colors.border }]}
      onPress={onToggle}
    >
      <Feather name={icon as any} size={16} color={value ? colors.gold : colors.mutedForeground} />
      <Text style={[styles.freeToggleText, { flex: 1, color: value ? colors.gold : colors.foreground }]}>{label}</Text>
      <Feather name={value ? "check-square" : "square"} size={18} color={value ? colors.gold : colors.mutedForeground} />
    </Pressable>
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
  filterCountBadge: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
  filterCountText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  locChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start", marginTop: 10 },
  locChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  catList: { paddingHorizontal: 20, paddingBottom: 4, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  featuredList: { paddingLeft: 20, paddingRight: 8, paddingBottom: 4 },
  distText: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 4, paddingLeft: 4 },
  listItem: { paddingHorizontal: 20 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  createBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0D0D0D" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  filterSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 24, gap: 6, maxHeight: "88%" },
  sheetHandle: { width: 36, height: 4, backgroundColor: "#444", borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  sheetTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  closeIconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  filterTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  filterLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 6 },
  smallLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 6 },
  locModeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  locModeChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  locModeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  radiusRow: { gap: 6 },
  radiusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  radiusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  textInputBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  textInputField: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dateChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  dateChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sortOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  sortOptionText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginVertical: 14 },
  priceRangeRow: { flexDirection: "row", gap: 8 },
  priceInput: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  pricePrefix: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase" },
  priceInputText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  freeToggle: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 6 },
  freeToggleText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  filterActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  resetBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, borderWidth: 1, paddingVertical: 13 },
  resetBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  applyBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  applyBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
});
