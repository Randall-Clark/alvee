import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
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
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [nfcOnlyEntry, setNfcOnlyEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Créer</Text>
        </View>
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Feather name="lock" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Connexion requise</Text>
          <Pressable style={[styles.ctaBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/auth")}>
            <Text style={styles.ctaBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const priceNum = parseFloat(price) || 0;
  const maxP = parseInt(maxParticipants) || 0;
  const totalPoints = priceNum < 100 ? 20 : priceNum <= 500 ? 45 : 100;

  const formatDate = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const formatTime = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission requise", "Autorisez l'accès à votre galerie pour ajouter une image."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [16, 9] });
    if (!result.canceled && result.assets[0]) setCoverImageUri(result.assets[0].uri);
  };

  const handleCreate = async () => {
    if (!title.trim() || !location.trim() || !maxParticipants) {
      Alert.alert("Champs manquants", "Titre, lieu et nombre de places sont obligatoires."); return;
    }
    setLoading(true);
    try {
      await createEvent({
        title: title.trim(), description: description.trim(), category, date: dateStr, time: timeStr,
        location: location.trim(), address: address.trim(), price: priceNum, maxParticipants: maxP,
        organizerId: user!.id, organizerName: user!.name, nfcOnlyEntry, coverImageUri: coverImageUri ?? undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Événement créé !", "Votre événement est maintenant visible.", [{ text: "OK", onPress: () => router.push("/") }]);
    } catch { Alert.alert("Erreur", "Impossible de créer l'événement."); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Créer un événement</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 120 : 100 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Pressable style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: coverImageUri ? colors.gold : colors.border }]} onPress={pickImage}>
          {coverImageUri ? (
            <>
              <Image source={{ uri: coverImageUri }} style={styles.imagePreview} contentFit="cover" />
              <View style={styles.imageOverlay}>
                <Feather name="camera" size={18} color="#fff" />
                <Text style={styles.imageOverlayText}>Changer l'image</Text>
              </View>
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={[styles.imageIconWrap, { backgroundColor: colors.gold + "20" }]}>
                <Feather name="camera" size={24} color={colors.gold} />
              </View>
              <Text style={[styles.imagePickerTitle, { color: colors.foreground }]}>Ajouter une bannière</Text>
              <Text style={[styles.imagePickerSub, { color: colors.mutedForeground }]}>Format 16:9 recommandé</Text>
            </View>
          )}
        </Pressable>

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

        <Section title="Date & Heure" colors={colors}>
          <Pressable style={[styles.dateBtn, { backgroundColor: colors.muted }]} onPress={() => setShowDatePicker(true)}>
            <Feather name="calendar" size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateBtnLabel, { color: colors.mutedForeground }]}>Date de l'événement</Text>
              <Text style={[styles.dateBtnValue, { color: colors.foreground }]}>{formatDate(date)}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>

          <Pressable style={[styles.dateBtn, { backgroundColor: colors.muted }]} onPress={() => setShowTimePicker(true)}>
            <Feather name="clock" size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateBtnLabel, { color: colors.mutedForeground }]}>Heure de début</Text>
              <Text style={[styles.dateBtnValue, { color: colors.foreground }]}>{formatTime(date)}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>

          {(showDatePicker || showTimePicker) && (
            <DateTimePicker
              value={date}
              mode={showDatePicker ? "date" : "time"}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selected) => {
                setShowDatePicker(false);
                setShowTimePicker(false);
                if (selected) setDate(selected);
              }}
              minimumDate={new Date()}
            />
          )}
        </Section>

        <Section title="Lieu" colors={colors}>
          <Field label="Nom du lieu *" colors={colors}>
            <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="Ex: Station F, Le Grand Rex..." placeholderTextColor={colors.mutedForeground} value={location} onChangeText={setLocation} />
          </Field>
          <Field label="Adresse complète" colors={colors}>
            <View style={[styles.addressWrap, { backgroundColor: colors.muted }]}>
              <Feather name="map-pin" size={14} color={colors.gold} style={{ marginTop: 12, flexShrink: 0 }} />
              <TextInput
                style={[styles.inputFlex, { color: colors.foreground }]}
                placeholder={"Ex: 5 Parvis Alan Turing\nParis 75013"}
                placeholderTextColor={colors.mutedForeground}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </Field>
        </Section>

        <Section title="Participants & Prix" colors={colors}>
          <View style={styles.row}>
            <Field label="Prix ($ CAD)" colors={colors} style={{ flex: 1 }}>
              <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="0" placeholderTextColor={colors.mutedForeground} value={price} onChangeText={setPrice} keyboardType="numeric" />
            </Field>
            <Field label="Places max *" colors={colors} style={{ flex: 1 }}>
              <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="50" placeholderTextColor={colors.mutedForeground} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" />
            </Field>
          </View>
          {priceNum > 0 && (
            <View style={[styles.pointsPreview, { backgroundColor: colors.gold + "15" }]}>
              <Feather name="zap" size={13} color={colors.gold} />
              <Text style={[styles.ptsText, { color: colors.gold }]}>
                {totalPoints} points distribués aux participants
                {priceNum >= 300 ? " · Carte Prime requise" : ""}
              </Text>
            </View>
          )}
        </Section>

        <Section title="Options d'accès" colors={colors}>
          <View style={[styles.switchRow, { borderColor: colors.border }]}>
            <Feather name="credit-card" size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Carte NFC uniquement</Text>
              <Text style={[styles.switchSub, { color: colors.mutedForeground }]}>
                {nfcOnlyEntry
                  ? "Seule la carte physique Alvee sera acceptée à l'entrée."
                  : "Par défaut : QR code ET carte NFC acceptés à l'entrée."}
              </Text>
            </View>
            <Switch value={nfcOnlyEntry} onValueChange={setNfcOnlyEntry} trackColor={{ false: colors.border, true: colors.gold + "80" }} thumbColor={nfcOnlyEntry ? colors.gold : "#888"} />
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
      <Text style={[sStyles.sectionTitle, { color: colors.gold }]}>{title}</Text>
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
  sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { borderRadius: 16, padding: 16, gap: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  ctaBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  ctaBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  imagePicker: { height: 180, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", marginBottom: 16, overflow: "hidden" },
  imagePreview: { width: "100%", height: "100%" },
  imageOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10 },
  imageOverlayText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imageIconWrap: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  imagePickerTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  imagePickerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  input: { borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  inputFlex: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 11, paddingRight: 13 },
  textArea: { minHeight: 80 },
  addressWrap: { flexDirection: "row", gap: 8, borderRadius: 12, paddingLeft: 13, alignItems: "flex-start", minHeight: 60 },
  row: { flexDirection: "row", gap: 10 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  dateBtnLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  dateBtnValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  pointsPreview: { borderRadius: 10, padding: 10, flexDirection: "row", gap: 8, alignItems: "center" },
  ptsText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  switchLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  switchSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 8, marginBottom: 8 },
  createBtnText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
});
