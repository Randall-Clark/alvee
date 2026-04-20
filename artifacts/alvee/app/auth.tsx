import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
  const [showPassword, setShowPassword] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erreur", "Email et mot de passe requis.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      Alert.alert("Erreur", "Votre nom est requis.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const ok = await login(email.trim(), password);
        if (ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)");
        } else {
          Alert.alert("Erreur", "Email non trouvé. Créez un compte d'abord.");
        }
      } else {
        const ok = await register(name.trim(), email.trim(), password);
        if (ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)");
        } else {
          Alert.alert("Erreur", "Cet email est déjà utilisé.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 20, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.brandSection}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <Feather name="zap" size={36} color="#fff" />
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>Alvee</Text>
          <Text style={[styles.brandTagline, { color: colors.mutedForeground }]}>
            {mode === "login" ? "Bon retour parmi nous !" : "Rejoignez la communauté"}
          </Text>
        </View>

        <View style={styles.tabs}>
          {(["login", "register"] as const).map(m => (
            <Pressable
              key={m}
              style={[
                styles.tab,
                { borderBottomColor: mode === m ? colors.primary : colors.border, borderBottomWidth: mode === m ? 2 : 1 },
              ]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.tabText, { color: mode === m ? colors.primary : colors.mutedForeground }]}>
                {m === "login" ? "Connexion" : "Inscription"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          {mode === "register" && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Votre nom</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Jean Dupont"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="email@exemple.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Mot de passe</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(v => !v)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Text>
          </Pressable>

          <View style={styles.switchMode}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
              {mode === "login" ? "Pas encore de compte ? " : "Déjà un compte ? "}
            </Text>
            <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
              <Text style={[styles.switchLink, { color: colors.primary }]}>
                {mode === "login" ? "S'inscrire" : "Se connecter"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.features, { backgroundColor: colors.surface }]}>
          {["Découvrez des événements près de chez vous", "Gagnez des points à chaque participation", "Obtenez votre carte NFC Alvee"].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 20, width: 40, height: 40, justifyContent: "center" },
  brandSection: { alignItems: "center", marginBottom: 32 },
  brandIcon: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  brandName: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  brandTagline: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  tabs: { flexDirection: "row", marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  form: { gap: 16, marginBottom: 24 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  switchMode: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  switchLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  features: { borderRadius: 14, padding: 16, gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
});
