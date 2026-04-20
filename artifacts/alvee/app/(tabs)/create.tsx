import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Music", "Tech", "Sport", "Art", "Food", "Social", "Networking", "Party"];

export default function CreateEventScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createEvent, user, isAuthenticated } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Social");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [requiresNFC, setRequiresNFC] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={styles.title}>Créer</Text>
        </View>
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Feather name="lock" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>Connexion requise</Text>
          <Pressable style={[styles.ctaBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/auth")}>
            <Text style={styles.ctaBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const priceNum = parseFloat(price) || 0;
  const maxP = parseInt(maxParticipants) || 0;
  const totalPoints = Math.floor(priceNum * maxP * 10);

  const handleCreate = async () => {
    if (!title.trim() || !date || !time || !location.trim() || !maxParticipants) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs obligatoires."); return;
    }
    setLoading(true);
    try {
      await createEvent({ title: title.trim(), description: description.trim(), category, date, time, location: location.trim(), address: address.trim(), price: priceNum, maxParticipants: maxP, organizerId: user!.id, organizerName: user!.name, requiresNFC });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Événement créé !", "Votre événement est maintenant visible.", [{ text: "OK", onPress: () => router.push("/") }]);
    } catch { Alert.alert("Erreur", "Impossible de créer l'événement."); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>Créer un événement</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 120 : 100 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Section title="Informations" colors={colors}>
          <Field label="Titre *" colors={colors}>
            <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="Nom de l'événement" placeholderTextColor={colors.mutedForeground} value={title} onChangeText={setTitle} />
          </Field>
          <Field label="Description" colors={colors}>
            <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="Décrivez votre événement..." placeholderTextColor={colors.mutedForeground} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
          </Field>
          <Field label="Catégorie" colors={colors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map(cat => (
                <Pressable key={cat} onPress={() => setCategory(cat)} style={[styles.catChip, category === cat ? { backgroundColor: colors.gold } : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={{ color: category === cat ? "#0D0D0D" : colors.mutedForeground, fontSize: 12, fontFamily: "Inter_500Medium" }}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Field>
        </Section>

        <Section title="Date & Lieu" colors={colors}>
          <View style={styles.row}>
            <Field label="Date * (AAAA-MM-JJ)" colors={colors} style={{ flex: 1 }}>
              <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="2026-06-15" placeholderTextColor={colors.mutedForeground} value={date} onChangeText={setDate} />
            </Field>
            <Field label="Heure *" colors={colors} style={{ flex: 1 }}>
              <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="20:00" placeholderTextColor={colors.mutedForeground} value={time} onChangeText={setTime} />
            </Field>
          </View>
          <Field label="Lieu *" colors={colors}>
            <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="Nom du lieu" placeholderTextColor={colors.mutedForeground} value={location} onChangeText={setLocation} />
          </Field>
          <Field label="Adresse" colors={colors}>
            <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="Adresse complète" placeholderTextColor={colors.mutedForeground} value={address} onChangeText={setAddress} />
          </Field>
        </Section>

        <Section title="Participants & Prix" colors={colors}>
          <View style={styles.row}>
            <Field label="Prix (€)" colors={colors} style={{ flex: 1 }}>
              <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="0" placeholderTextColor={colors.mutedForeground} value={price} onChangeText={setPrice} keyboardType="numeric" />
            </Field>
            <Field label="Places max *" colors={colors} style={{ flex: 1 }}>
              <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="50" placeholderTextColor={colors.mutedForeground} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" />
            </Field>
          </View>

          {totalPoints > 0 && (
            <View style={[styles.pointsPreview, { backgroundColor: colors.gold + "15" }]}>
              <Feather name="zap" size={14} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.ptsTitle, { color: colors.gold }]}>{totalPoints.toLocaleString("fr-FR")} points à distribuer</Text>
                <Text style={[styles.ptsSub, { color: colors.mutedForeground }]}>
                  40% premiers → {Math.floor(totalPoints * 0.7 / Math.max(Math.floor(maxP * 0.4), 1))} pts/pers (70% pool)
                </Text>
                <Text style={[styles.ptsSub, { color: colors.mutedForeground }]}>
                  60% restants → {Math.floor(totalPoints * 0.3 / Math.max(maxP - Math.floor(maxP * 0.4), 1))} pts/pers (30% pool)
                </Text>
              </View>
            </View>
          )}
        </Section>

        <Section title="Options" colors={colors}>
          <View style={[styles.switchRow, { borderColor: colors.border }]}>
            <Feather name="credit-card" size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Carte NFC requise</Text>
              <Text style={[styles.switchSub, { color: colors.mutedForeground }]}>Pass physique Alvee nécessaire pour l'entrée</Text>
            </View>
            <Switch value={requiresNFC} onValueChange={setRequiresNFC} trackColor={{ false: colors.border, true: colors.gold + "80" }} thumbColor={requiresNFC ? colors.gold : "#888"} />
          </View>
        </Section>

        <Pressable style={[styles.createBtn, { backgroundColor: colors.gold, opacity: loading ? 0.7 : 1 }]} onPress={handleCreate} disabled={loading}>
          <Feather name="plus-circle" size={18} color="#0D0D0D" />
          <Text style={styles.createBtnText}>{loading ? "Création..." : "Créer l'événement"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={sStyles.section}>
      <Text style={sStyles.sectionTitle}>{title}</Text>
      <View style={[sStyles.card, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );
}

function Field({ label, children, colors, style }: { label: string; children: React.ReactNode; colors: any; style?: any }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</Text>
      {children}
    </View>
  );
}

const sStyles = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#C9A84C", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { borderRadius: 16, padding: 16, gap: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  ctaBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  ctaBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 0 },
  input: { borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 80 },
  row: { flexDirection: "row", gap: 10 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  pointsPreview: { borderRadius: 12, padding: 12, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  ptsTitle: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 3 },
  ptsSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  switchLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  switchSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  createBtnText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
});
