import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, register } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert("Erreur", "Email et mot de passe requis."); return; }
    if (mode === "register" && !name.trim()) { Alert.alert("Erreur", "Votre nom est requis."); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const ok = await login(email.trim(), password);
        if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.replace("/(tabs)"); }
        else Alert.alert("Compte introuvable", "Vérifiez vos identifiants ou créez un compte.");
      } else {
        const ok = await register(name.trim(), email.trim(), password);
        if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.replace("/(tabs)"); }
        else Alert.alert("Email déjà utilisé", "Connectez-vous à la place.");
      }
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.close} onPress={() => router.back()}>
          <View style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </View>
        </Pressable>

        <View style={styles.brand}>
          <View style={[styles.brandIcon, { backgroundColor: colors.gold }]}>
            <Feather name="zap" size={30} color="#0D0D0D" />
          </View>
          <Text style={styles.brandName}>Alvee</Text>
          <Text style={[styles.brandTagline, { color: colors.mutedForeground }]}>
            {mode === "login" ? "Bon retour parmi nous" : "Rejoignez la communauté"}
          </Text>
        </View>

        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {(["login", "register"] as const).map(m => (
            <Pressable key={m} style={[styles.tab, mode === m && { borderBottomColor: colors.gold, borderBottomWidth: 2 }]} onPress={() => setMode(m)}>
              <Text style={[styles.tabText, { color: mode === m ? colors.gold : colors.mutedForeground }]}>
                {m === "login" ? "Connexion" : "Inscription"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          {mode === "register" && (
            <Field label="Votre nom" colors={colors}>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="Jean Dupont" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} autoCapitalize="words" />
              </View>
            </Field>
          )}
          <Field label="Email" colors={colors}>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="email@exemple.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </Field>
          <Field label="Mot de passe" colors={colors}>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="••••••••" placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
              <Pressable onPress={() => setShowPw(v => !v)}>
                <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </Field>

          <Pressable style={[styles.submit, { backgroundColor: colors.gold, opacity: loading ? 0.7 : 1 }]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitText}>{loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.mutedForeground }]}>{mode === "login" ? "Pas encore de compte ? " : "Déjà un compte ? "}</Text>
            <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
              <Text style={[styles.switchLink, { color: colors.gold }]}>{mode === "login" ? "S'inscrire" : "Se connecter"}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.perks, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {["Découvrez des événements près de chez vous", "Gagnez des points à chaque participation", "Carte NFC Alvee — votre pass physique premium"].map((f, i) => (
            <View key={i} style={styles.perkRow}>
              <View style={[styles.perkDot, { backgroundColor: colors.gold }]} />
              <Text style={[styles.perkText, { color: colors.mutedForeground }]}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  close: { alignSelf: "flex-start", marginBottom: 24 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  brand: { alignItems: "center", marginBottom: 36 },
  brandIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  brandName: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -0.5 },
  brandTagline: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  form: { gap: 16, marginBottom: 24 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  submit: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  submitText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
  switchRow: { flexDirection: "row", justifyContent: "center" },
  switchLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  switchLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  perks: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  perkText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
});
