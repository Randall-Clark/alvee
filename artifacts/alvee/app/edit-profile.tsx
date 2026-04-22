import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhoneInput, DEFAULT_DIAL } from "@/components/PhoneInput";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { DialCode } from "@/utils/dialCodes";
import { DIAL_CODES } from "@/utils/dialCodes";

type Step = "menu" | "verify" | "edit-name" | "edit-email" | "edit-phone";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function findDialForPhone(phone: string): { dial: DialCode; number: string } {
  let best = DEFAULT_DIAL;
  let bestLen = 0;
  for (const d of DIAL_CODES) {
    const raw = d.dial.replace(/-.*/, "");
    if (phone.startsWith(raw) && raw.length > bestLen) {
      best = d;
      bestLen = raw.length;
    }
  }
  const number = bestLen > 0 ? phone.slice(bestLen) : phone;
  return { dial: best, number };
}

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState<Step>("menu");
  const [editTarget, setEditTarget] = useState<"email" | "phone" | "name">("email");
  const [sentCode, setSentCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState(user?.name ?? "");
  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [dialCode, setDialCode] = useState<DialCode>(() => {
    if (user?.phone) return findDialForPhone(user.phone).dial;
    return DEFAULT_DIAL;
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (user?.phone) return findDialForPhone(user.phone).number;
    return "";
  });

  if (!user) return null;

  const fullPhone = phoneNumber.trim() ? `${dialCode.dial}${phoneNumber.trim().replace(/^0/, "")}` : user.phone ?? "";

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès à votre galerie photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setSaving(true);
      await updateProfile({ avatar: result.assets[0].uri });
      setSaving(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleStartEdit = (target: "email" | "phone" | "name") => {
    if (target === "name") {
      setNewName(user.name);
      setStep("edit-name");
      return;
    }
    setEditTarget(target);
    const code = generateCode();
    setSentCode(code);
    setEnteredCode("");
    Alert.alert(
      "Code envoyé",
      `Un code de vérification a été envoyé à votre ${target === "email" ? "adresse e-mail" : "numéro de téléphone"} actuel.`,
      [{ text: "OK" }]
    );
    setStep("verify");
  };

  const handleVerify = () => {
    if (enteredCode.trim() !== sentCode) {
      Alert.alert("Code incorrect", "Le code saisi ne correspond pas. Vérifiez et réessayez.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep(editTarget === "email" ? "edit-email" : "edit-phone");
    setEnteredCode("");
  };

  const handleSaveName = async () => {
    if (!newName.trim()) { Alert.alert("Champ requis", "Le nom ne peut pas être vide."); return; }
    setSaving(true);
    await updateProfile({ name: newName.trim() });
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep("menu");
    Alert.alert("Mis à jour !", "Votre nom a été modifié.");
  };

  const handleSaveEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) { Alert.alert("Email invalide"); return; }
    setSaving(true);
    await updateProfile({ email: newEmail.trim() });
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep("menu");
    Alert.alert("Mis à jour !", "Votre email a été modifié.");
  };

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) { Alert.alert("Numéro requis"); return; }
    setSaving(true);
    await updateProfile({ phone: fullPhone });
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep("menu");
    Alert.alert("Mis à jour !", "Votre numéro a été modifié.");
  };

  const renderMenu = () => (
    <View style={styles.content}>
      <Pressable style={styles.photoSection} onPress={handlePickPhoto}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatarLarge} contentFit="cover" />
        ) : (
          <View style={[styles.avatarLarge, styles.avatarFallback, { backgroundColor: colors.gold }]}>
            <Text style={styles.avatarFallbackText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.photoBadge, { backgroundColor: colors.gold }]}>
          {saving ? <ActivityIndicator size="small" color="#0D0D0D" /> : <Feather name="camera" size={14} color="#0D0D0D" />}
        </View>
        <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>Appuyez pour modifier la photo</Text>
      </Pressable>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Informations personnelles</Text>
        <EditRow
          icon="user"
          label="Nom d'utilisateur"
          value={user.name}
          colors={colors}
          onPress={() => handleStartEdit("name")}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <EditRow
          icon="mail"
          label="Email"
          value={user.email}
          colors={colors}
          onPress={() => handleStartEdit("email")}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <EditRow
          icon="phone"
          label="Téléphone"
          value={user.phone || "Non renseigné"}
          colors={colors}
          onPress={() => handleStartEdit("phone")}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Mon code de parrainage</Text>
        <View style={styles.referralBox}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.referralCode, { color: colors.gold }]}>{user.referralCode ?? "—"}</Text>
            <Text style={[styles.referralSub, { color: colors.mutedForeground }]}>
              {user.referralCount ?? 0} / 10 parrainages · {(user.referralCount ?? 0) * 100} / 1 000 pts
            </Text>
          </View>
          <View style={[styles.referralProgress, { backgroundColor: colors.muted }]}>
            <View
              style={[styles.referralProgressFill, { backgroundColor: colors.gold, width: `${Math.min(((user.referralCount ?? 0) / 10) * 100, 100)}%` as any }]}
            />
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Entrer un code de parrainage</Text>
        <ReferralInput colors={colors} />
      </View>
    </View>
  );

  const renderVerify = () => (
    <View style={styles.content}>
      <View style={[styles.verifyCard, { backgroundColor: colors.card }]}>
        <View style={[styles.verifyIcon, { backgroundColor: colors.gold + "20" }]}>
          <Feather name="shield" size={28} color={colors.gold} />
        </View>
        <Text style={[styles.verifyTitle, { color: colors.foreground }]}>Vérification requise</Text>
        <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>
          Entrez le code à 6 chiffres envoyé à votre {editTarget === "email" ? "email" : "téléphone"} actuel.
        </Text>
        <TextInput
          style={[styles.codeInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          placeholder="000000"
          placeholderTextColor={colors.mutedForeground}
          value={enteredCode}
          onChangeText={t => setEnteredCode(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
        <Pressable
          style={[styles.verifyBtn, { backgroundColor: enteredCode.length === 6 ? colors.gold : colors.muted }]}
          onPress={handleVerify}
          disabled={enteredCode.length !== 6}
        >
          <Text style={[styles.verifyBtnText, { color: enteredCode.length === 6 ? "#0D0D0D" : colors.mutedForeground }]}>
            Confirmer le code
          </Text>
        </Pressable>
        <Pressable onPress={() => setStep("menu")} style={styles.cancelLink}>
          <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEditName = () => (
    <View style={styles.content}>
      <View style={[styles.editCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Nouveau nom d'utilisateur</Text>
        <TextInput
          style={[styles.editInput, { backgroundColor: colors.muted, color: colors.foreground }]}
          value={newName}
          onChangeText={setNewName}
          placeholder="Votre nom"
          placeholderTextColor={colors.mutedForeground}
          autoFocus
        />
        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.gold, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSaveName}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
        </Pressable>
        <Pressable onPress={() => setStep("menu")} style={styles.cancelLink}>
          <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEditEmail = () => (
    <View style={styles.content}>
      <View style={[styles.editCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Nouvel email</Text>
        <TextInput
          style={[styles.editInput, { backgroundColor: colors.muted, color: colors.foreground }]}
          value={newEmail}
          onChangeText={setNewEmail}
          placeholder="vous@email.com"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />
        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.gold, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSaveEmail}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
        </Pressable>
        <Pressable onPress={() => setStep("menu")} style={styles.cancelLink}>
          <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEditPhone = () => (
    <View style={styles.content}>
      <View style={[styles.editCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Nouveau numéro</Text>
        <PhoneInput dialCode={dialCode} number={phoneNumber} onDialChange={setDialCode} onNumberChange={setPhoneNumber} />
        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.gold, opacity: saving ? 0.6 : 1, marginTop: 8 }]}
          onPress={handleSavePhone}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
        </Pressable>
        <Pressable onPress={() => setStep("menu")} style={styles.cancelLink}>
          <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => step !== "menu" ? setStep("menu") : router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Feather name={step !== "menu" ? "arrow-left" : "x"} size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {step === "menu" ? "Modifier le profil"
            : step === "verify" ? "Vérification"
            : step === "edit-name" ? "Modifier le nom"
            : step === "edit-email" ? "Modifier l'email"
            : "Modifier le téléphone"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
          {step === "menu" && renderMenu()}
          {step === "verify" && renderVerify()}
          {step === "edit-name" && renderEditName()}
          {step === "edit-email" && renderEditEmail()}
          {step === "edit-phone" && renderEditPhone()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function EditRow({ icon, label, value, colors, onPress }: { icon: string; label: string; value: string; colors: any; onPress: () => void }) {
  return (
    <Pressable style={styles.editRow} onPress={onPress}>
      <View style={[styles.editRowIcon, { backgroundColor: colors.gold + "20" }]}>
        <Feather name={icon as any} size={14} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.editRowLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.editRowValue, { color: colors.foreground }]} numberOfLines={1}>{value}</Text>
      </View>
      <Feather name="edit-3" size={14} color={colors.mutedForeground} />
    </Pressable>
  );
}

function ReferralInput({ colors }: { colors: any }) {
  const { applyReferralCode } = useApp();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    const result = await applyReferralCode(code.trim().toUpperCase());
    setLoading(false);
    setCode("");
    if (result === "ok") Alert.alert("Code accepté !", "Vous avez gagné 50 points de parrainage.");
    else if (result === "self") Alert.alert("Oops", "Vous ne pouvez pas utiliser votre propre code.");
    else if (result === "maxed") Alert.alert("Code épuisé", "Ce parrain a atteint son maximum de 10 parrainages.");
    else Alert.alert("Code invalide", "Ce code de parrainage n'existe pas.");
  };

  return (
    <View style={styles.referralInputRow}>
      <TextInput
        style={[styles.referralTextInput, { backgroundColor: colors.muted, color: colors.foreground }]}
        placeholder="Entrer un code (ex: JEAN1A2B)"
        placeholderTextColor={colors.mutedForeground}
        value={code}
        onChangeText={t => setCode(t.toUpperCase())}
        autoCapitalize="characters"
      />
      <Pressable
        style={[styles.referralApplyBtn, { backgroundColor: code.length >= 3 ? colors.gold : colors.muted }]}
        onPress={handleApply}
        disabled={loading || code.length < 3}
      >
        {loading ? <ActivityIndicator size="small" color="#0D0D0D" /> : <Text style={[styles.referralApplyText, { color: code.length >= 3 ? "#0D0D0D" : colors.mutedForeground }]}>Appliquer</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  content: { padding: 20, gap: 14 },
  photoSection: { alignItems: "center", paddingVertical: 16, gap: 10 },
  avatarLarge: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { color: "#0D0D0D", fontSize: 34, fontFamily: "Inter_700Bold" },
  photoBadge: { position: "absolute", bottom: 38, right: "30%", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#0D0D0D" },
  photoHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, overflow: "hidden" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  divider: { height: 1, marginHorizontal: 16 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  editRowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  editRowLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 1 },
  editRowValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  referralBox: { padding: 16, gap: 10 },
  referralCode: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  referralSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  referralProgress: { height: 6, borderRadius: 3, overflow: "hidden" },
  referralProgressFill: { height: "100%", borderRadius: 3 },
  referralInputRow: { flexDirection: "row", gap: 8, padding: 12 },
  referralTextInput: { flex: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_500Medium" },
  referralApplyBtn: { borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  referralApplyText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  verifyCard: { borderRadius: 20, padding: 24, gap: 14, alignItems: "center" },
  verifyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  verifyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  verifySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  codeInput: { fontSize: 32, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: 10, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 20, width: "100%" },
  verifyBtn: { width: "100%", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  verifyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  cancelLink: { paddingVertical: 12 },
  cancelLinkText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  editCard: { borderRadius: 20, padding: 20, gap: 12 },
  editLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  editInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
});
