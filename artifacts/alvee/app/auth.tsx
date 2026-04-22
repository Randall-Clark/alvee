import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { DEFAULT_DIAL, PhoneInput } from "@/components/PhoneInput";
import type { DialCode } from "@/utils/dialCodes";

type Mode = "choice" | "login" | "register-credentials" | "register-profile";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, register, socialLogin } = useApp();

  const [mode, setMode] = useState<Mode>("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dialCode, setDialCode] = useState<DialCode>(DEFAULT_DIAL);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialProfile, setSocialProfile] = useState<{ name: string; email: string; provider: "google" | "apple" | "facebook" } | null>(null);

  const fullPhone = phoneNumber.trim() ? `${dialCode.dial}${phoneNumber.trim().replace(/^0/, "")}` : "";

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs requis", "Email et mot de passe sont obligatoires");
      return;
    }
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      Alert.alert("Erreur", "Identifiants incorrects");
    }
  };

  const handleRegisterStep1 = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs requis", "Email et mot de passe obligatoires");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Mot de passe trop court", "Minimum 6 caractères");
      return;
    }
    setMode("register-profile");
  };

  const handleFinalSubmit = async () => {
    if (!username.trim()) {
      Alert.alert("Nom d'utilisateur requis", "Choisissez un nom d'utilisateur");
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert("Numéro requis", "Saisissez votre numéro de téléphone");
      return;
    }
    setLoading(true);
    let ok = false;
    if (socialProfile) {
      ok = await socialLogin(socialProfile.provider, {
        name: username.trim(),
        email: socialProfile.email,
        country: dialCode.code,
        phone: fullPhone,
      });
    } else {
      ok = await register(username.trim(), email.trim(), password, dialCode.code, fullPhone);
    }
    setLoading(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      Alert.alert("Erreur", "Cet email est déjà utilisé");
    }
  };

  const handleSocial = async (provider: "google" | "apple" | "facebook") => {
    if (provider === "apple" && Platform.OS === "ios") {
      try {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        const name = credential.fullName?.givenName || "Utilisateur Apple";
        setSocialProfile({ name, email: credential.email || `${credential.user}@privaterelay.appleid.com`, provider });
        setUsername(name);
        setMode("register-profile");
      } catch (e: any) {
        if (e.code !== "ERR_REQUEST_CANCELED") Alert.alert("Erreur Apple", e.message);
      }
      return;
    }
    Alert.alert(
      `${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
      `La connexion ${provider} nécessite une configuration côté serveur (clé OAuth). Pour la démo, un profil test sera créé.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer en démo",
          onPress: () => {
            const demoEmail = `demo_${provider}_${Date.now()}@alvee.app`;
            const demoName = `Utilisateur ${provider.charAt(0).toUpperCase() + provider.slice(1)}`;
            setSocialProfile({ name: demoName, email: demoEmail, provider });
            setUsername(demoName);
            setMode("register-profile");
          },
        },
      ],
    );
  };

  // ============ RENDER ============

  const renderChoice = () => (
    <View style={styles.contentInner}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.gold }]}>
          <Feather name="zap" size={32} color="#0D0D0D" />
        </View>
        <Text style={[styles.brand, { color: colors.foreground }]}>Alvee</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Rejoignez la communauté
        </Text>
      </View>

      <Pressable
        style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
        onPress={() => setMode("register-credentials")}
      >
        <Feather name="mail" size={18} color="#0D0D0D" />
        <Text style={styles.primaryBtnText}>Continuer avec l'email</Text>
      </Pressable>

      <View style={styles.orRow}>
        <View style={[styles.orLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.orText, { color: colors.mutedForeground }]}>ou continuer avec</Text>
        <View style={[styles.orLine, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.socialRow}>
        <Pressable style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSocial("google")}>
          <Text style={[styles.socialIcon, { color: "#4285F4" }]}>G</Text>
          <Text style={[styles.socialLabel, { color: colors.foreground }]}>Google</Text>
        </Pressable>
        <Pressable style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSocial("facebook")}>
          <Text style={[styles.socialIcon, { color: "#1877F2" }]}>f</Text>
          <Text style={[styles.socialLabel, { color: colors.foreground }]}>Facebook</Text>
        </Pressable>
      </View>

      {Platform.OS === "ios" && (
        <Pressable style={[styles.appleBtn, { backgroundColor: colors.foreground }]} onPress={() => handleSocial("apple")}>
          <Feather name="smartphone" size={16} color={colors.background} />
          <Text style={[styles.appleText, { color: colors.background }]}>Continuer avec Apple</Text>
        </Pressable>
      )}

      <Pressable onPress={() => setMode("login")} style={{ marginTop: 16, alignItems: "center" }}>
        <Text style={[styles.link, { color: colors.mutedForeground }]}>
          Déjà un compte ? <Text style={{ color: colors.gold, fontFamily: "Inter_600SemiBold" }}>Se connecter</Text>
        </Text>
      </Pressable>

      <View style={[styles.featuresBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feature text="Découvrez des événements près de chez vous" colors={colors} />
        <Feature text="Billets QR et cartes NFC Alvee" colors={colors} />
        <Feature text="Prix affichés dans votre devise locale" colors={colors} />
      </View>
    </View>
  );

  const renderLogin = () => (
    <View style={styles.contentInner}>
      <Pressable onPress={() => setMode("choice")} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>Bon retour 👋</Text>
      <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Connectez-vous à votre compte Alvee</Text>

      <View style={styles.form}>
        <Field label="Email" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="vous@email.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </Field>

        <Field label="Mot de passe" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.foreground, flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <Pressable onPress={() => setShowPassword(s => !s)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
          </Pressable>
        </Field>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.gold, opacity: loading ? 0.6 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0D0D0D" />
            : <Text style={styles.primaryBtnText}>Se connecter</Text>}
        </Pressable>

        <Pressable onPress={() => setMode("register-credentials")} style={{ alignItems: "center", marginTop: 12 }}>
          <Text style={[styles.link, { color: colors.mutedForeground }]}>
            Pas encore de compte ? <Text style={{ color: colors.gold, fontFamily: "Inter_600SemiBold" }}>S'inscrire</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderRegStep1 = () => (
    <View style={styles.contentInner}>
      <Pressable onPress={() => setMode("choice")} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, { backgroundColor: colors.gold }]} />
        <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>Créez votre compte</Text>
      <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Étape 1 sur 2 — Identifiants</Text>

      <View style={styles.form}>
        <Field label="Email" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="vous@email.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </Field>

        <Field label="Mot de passe (min. 6)" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.foreground, flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(s => !s)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
          </Pressable>
        </Field>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
          onPress={handleRegisterStep1}
        >
          <Text style={styles.primaryBtnText}>Continuer</Text>
          <Feather name="arrow-right" size={18} color="#0D0D0D" />
        </Pressable>
      </View>
    </View>
  );

  const renderRegStep2 = () => (
    <View style={styles.contentInner}>
      <Pressable onPress={() => setMode(socialProfile ? "choice" : "register-credentials")} style={styles.backBtn}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </Pressable>
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, { backgroundColor: colors.gold }]} />
        <View style={[styles.stepDot, { backgroundColor: colors.gold }]} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>Votre profil</Text>
      <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
        Étape 2 sur 2 — Nom & téléphone
      </Text>

      <View style={styles.form}>
        <Field label="Nom d'utilisateur" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="ex: Marie L."
            placeholderTextColor={colors.mutedForeground}
            value={username}
            onChangeText={setUsername}
            autoComplete="name"
          />
        </Field>

        <View style={{ gap: 6 }}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Téléphone</Text>
          <PhoneInput
            dialCode={dialCode}
            number={phoneNumber}
            onDialChange={setDialCode}
            onNumberChange={setPhoneNumber}
          />
        </View>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.gold, opacity: loading ? 0.6 : 1, marginTop: 8 }]}
          onPress={handleFinalSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0D0D0D" />
            : <>
                <Text style={styles.primaryBtnText}>Créer mon compte</Text>
                <Feather name="check" size={18} color="#0D0D0D" />
              </>}
        </Pressable>

        <Text style={[styles.legalText, { color: colors.mutedForeground }]}>
          En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>

          {mode === "choice" && renderChoice()}
          {mode === "login" && renderLogin()}
          {mode === "register-credentials" && renderRegStep1()}
          {mode === "register-profile" && renderRegStep2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, colors, children }: { label: string; colors: any; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function Feature({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureDot, { backgroundColor: colors.gold }]} />
      <Text style={[styles.featureText, { color: colors.foreground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(120,120,120,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  contentInner: { flex: 1, marginTop: 24 },
  backBtn: { marginBottom: 18 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { width: 70, height: 70, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  brand: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  stepIndicator: { flexDirection: "row", gap: 6, marginBottom: 14 },
  stepDot: { width: 32, height: 4, borderRadius: 2 },
  stepTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 24 },
  form: { gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  inputBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: Platform.OS === "web" ? 13 : 14 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16, marginTop: 6 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  socialRow: { flexDirection: "row", gap: 10 },
  socialBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  socialIcon: { fontSize: 18, fontFamily: "Inter_700Bold" },
  socialLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  appleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 12, paddingVertical: 14, marginTop: 10 },
  appleText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  link: { fontSize: 13, fontFamily: "Inter_400Regular" },
  featuresBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 22, gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureDot: { width: 5, height: 5, borderRadius: 3 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detectedBox: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  detectedFlag: { fontSize: 28 },
  detectedLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  detectedName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  detectedHint: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  legalText: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16, marginTop: 12 },
});
