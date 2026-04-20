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
import { KeyboardAwareScrollViewCompat } from "react-native-keyboard-controller";

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

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.notAuthHeader, { paddingTop: topPadding + 16 }]}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Créer un événement</Text>
        </View>
        <View style={styles.center}>
          <Feather name="lock" size={48} color={colors.mutedForeground} />
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Connexion requise</Text>
          <Text style={[styles.authText, { color: colors.mutedForeground }]}>
            Connectez-vous pour créer des événements
          </Text>
          <Pressable
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.authBtnText}>Se connecter</Text>
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
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        category,
        date,
        time,
        location: location.trim(),
        address: address.trim(),
        price: priceNum,
        maxParticipants: maxP,
        organizerId: user!.id,
        organizerName: user!.name,
        requiresNFC,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Votre événement a été créé !", [
        { text: "OK", onPress: () => router.push("/") },
      ]);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créer l'événement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Créer un événement</Text>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 120 : 90 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <Section title="Informations de base" colors={colors}>
          <Field label="Titre *" colors={colors}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Nom de l'événement"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          <Field label="Description" colors={colors}>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Décrivez votre événement..."
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>

          <Field label="Catégorie" colors={colors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: category === cat ? colors.primary : colors.card,
                      borderColor: category === cat ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: category === cat ? "#fff" : colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Field>
        </Section>

        <Section title="Date & Lieu" colors={colors}>
          <View style={styles.row}>
            <Field label="Date *" colors={colors} style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={colors.mutedForeground}
                value={date}
                onChangeText={setDate}
              />
            </Field>
            <Field label="Heure *" colors={colors} style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="HH:MM"
                placeholderTextColor={colors.mutedForeground}
                value={time}
                onChangeText={setTime}
              />
            </Field>
          </View>

          <Field label="Lieu *" colors={colors}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Nom du lieu"
              placeholderTextColor={colors.mutedForeground}
              value={location}
              onChangeText={setLocation}
            />
          </Field>

          <Field label="Adresse" colors={colors}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Adresse complète"
              placeholderTextColor={colors.mutedForeground}
              value={address}
              onChangeText={setAddress}
            />
          </Field>
        </Section>

        <Section title="Participants & Prix" colors={colors}>
          <View style={styles.row}>
            <Field label="Prix (€) *" colors={colors} style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </Field>
            <Field label="Places max *" colors={colors} style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="50"
                placeholderTextColor={colors.mutedForeground}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="numeric"
              />
            </Field>
          </View>

          {totalPoints > 0 && (
            <View style={[styles.pointsPreview, { backgroundColor: colors.gold + "15" }]}>
              <Feather name="zap" size={14} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pointsPreviewTitle, { color: colors.gold }]}>
                  {totalPoints.toLocaleString("fr-FR")} points à distribuer
                </Text>
                <Text style={[styles.pointsPreviewSub, { color: colors.mutedForeground }]}>
                  70% ({Math.floor(totalPoints * 0.7)} pts) aux 40% premiers inscrits
                </Text>
                <Text style={[styles.pointsPreviewSub, { color: colors.mutedForeground }]}>
                  30% ({Math.floor(totalPoints * 0.3)} pts) aux 60% restants
                </Text>
              </View>
            </View>
          )}
        </Section>

        <Section title="Options" colors={colors}>
          <View style={[styles.switchRow, { borderColor: colors.border }]}>
            <View style={styles.switchLeft}>
              <Feather name="credit-card" size={18} color={colors.primary} />
              <View>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Requiert une carte NFC</Text>
                <Text style={[styles.switchSub, { color: colors.mutedForeground }]}>Pass physique Alvee nécessaire</Text>
              </View>
            </View>
            <Switch
              value={requiresNFC}
              onValueChange={setRequiresNFC}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </Section>

        <Pressable
          style={[styles.createBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Feather name="plus-circle" size={18} color="#fff" />
          <Text style={styles.createBtnText}>{loading ? "Création..." : "Créer l'événement"}</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function Field({ label, children, colors, style }: { label: string; children: React.ReactNode; colors: any; style?: any }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  screenTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  notAuthHeader: { paddingHorizontal: 16, paddingBottom: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  authTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  authText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  authBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  authBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  field: {},
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 80 },
  row: { flexDirection: "row", gap: 12 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pointsPreview: { borderRadius: 12, padding: 12, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  pointsPreviewTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  pointsPreviewSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, padding: 12 },
  switchLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  switchLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  switchSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  createBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
