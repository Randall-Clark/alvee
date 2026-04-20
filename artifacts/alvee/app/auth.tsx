import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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

import { COUNTRIES, Country } from "@/constants/countries";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

type Step = "choice" | "login" | "reg_account" | "reg_profile" | "reg_location" | "social_complete";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, register, socialLogin } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState<Step>("choice");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [countryModal, setCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [address, setAddress] = useState("");
  const [socialProfile, setSocialProfile] = useState<{ name: string; email: string; provider: "google" | "apple" | "facebook" } | null>(null);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.phonePrefix.includes(countrySearch)
  );

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs requis", "Veuillez saisir votre email et mot de passe.");
      return;
    }
    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        Alert.alert("Compte introuvable", "Vérifiez vos identifiants ou créez un compte.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegStep1 = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs requis", "Veuillez saisir votre email et mot de passe.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Mot de passe trop court", "Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setStep("reg_profile");
  };

  const handleRegStep2 = () => {
    if (!name.trim()) {
      Alert.alert("Champs requis", "Veuillez saisir votre nom complet.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Téléphone requis", "Un numéro de téléphone est requis pour la vérification.");
      return;
    }
    setStep("reg_location");
  };

  const handleRegComplete = async () => {
    if (!selectedCountry) {
      Alert.alert("Pays requis", "Veuillez sélectionner votre pays de résidence.");
      return;
    }
    setLoading(true);
    try {
      const ok = await register(name.trim(), email.trim(), password, selectedCountry.code, phone.trim(), address.trim() || undefined);
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        Alert.alert("Email déjà utilisé", "Un compte existe déjà avec cet email. Connectez-vous à la place.");
        setStep("login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialComplete = async () => {
    if (!socialProfile) return;
    if (!selectedCountry) {
      Alert.alert("Pays requis", "Veuillez sélectionner votre pays de résidence.");
      return;
    }
    setLoading(true);
    try {
      const ok = await socialLogin(socialProfile.provider, {
        name: socialProfile.name,
        email: socialProfile.email,
        country: selectedCountry.code,
        phone: phone.trim() || undefined,
      });
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      Alert.alert(
        "Connexion Google",
        "Pour activer Google Sign In, vous devez configurer un Client ID Google OAuth dans app.json (expo.ios.googleServicesFile / expo.android.googleServicesFile).\n\nPour l'instant, utilisez email/mot de passe.",
        [{ text: "OK" }]
      );
    } catch (e) {
      Alert.alert("Erreur", "La connexion Google a échoué.");
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Apple Sign In", "Disponible uniquement sur iPhone/iPad.");
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ") || "Utilisateur Apple";
      const userEmail = credential.email ?? `apple_${credential.user}@privaterelay.appleid.com`;
      setSocialProfile({ name: fullName, email: userEmail, provider: "apple" });
      setName(fullName);
      setEmail(userEmail);
      setStep("social_complete");
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Erreur Apple", "La connexion Apple a échoué. Réessayez.");
      }
    }
  };

  const handleFacebookLogin = () => {
    Alert.alert(
      "Connexion Facebook",
      "Pour activer Facebook Login, vous devez créer une application sur developers.facebook.com et configurer expo-facebook.\n\nPour l'instant, utilisez email/mot de passe.",
      [{ text: "OK" }]
    );
  };

  const StepIndicator = ({ total, current }: { total: number; current: number }) => (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.stepDot, { backgroundColor: i < current ? colors.gold : colors.border }]}
        />
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.close} onPress={() => router.back()}>
          <View style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </View>
        </Pressable>

        <View style={styles.brand}>
          <View style={[styles.brandIcon, { backgroundColor: colors.gold }]}>
            <Feather name="zap" size={28} color="#0D0D0D" />
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>Alvee</Text>
          <Text style={[styles.brandTagline, { color: colors.mutedForeground }]}>
            {step === "choice" && "Rejoignez la communauté"}
            {step === "login" && "Bon retour parmi nous"}
            {step === "reg_account" && "Créer votre compte"}
            {step === "reg_profile" && "Vos informations"}
            {step === "reg_location" && "Votre pays"}
            {step === "social_complete" && "Finaliser votre profil"}
          </Text>
        </View>

        {step === "choice" && (
          <ChoiceStep
            colors={colors}
            onEmail={() => setStep("reg_account")}
            onLogin={() => setStep("login")}
            onGoogle={handleGoogleLogin}
            onApple={handleAppleLogin}
            onFacebook={handleFacebookLogin}
          />
        )}

        {step === "login" && (
          <View style={styles.form}>
            <Field label="Adresse email" colors={colors}>
              <InputWrap icon="mail" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="email@exemple.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </InputWrap>
            </Field>
            <Field label="Mot de passe" colors={colors}>
              <InputWrap icon="lock" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <Pressable onPress={() => setShowPw(v => !v)}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </Pressable>
              </InputWrap>
            </Field>

            <GoldButton label={loading ? "Connexion..." : "Se connecter"} onPress={handleLogin} disabled={loading} colors={colors} />

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>ou</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <SocialButtons onGoogle={handleGoogleLogin} onApple={handleAppleLogin} onFacebook={handleFacebookLogin} colors={colors} />

            <BackLink label="Pas encore de compte ? S'inscrire" onPress={() => setStep("choice")} colors={colors} />
          </View>
        )}

        {step === "reg_account" && (
          <View style={styles.form}>
            <StepIndicator total={3} current={1} />
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Créer un compte</Text>

            <Field label="Adresse email" colors={colors}>
              <InputWrap icon="mail" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="email@exemple.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </InputWrap>
            </Field>
            <Field label="Mot de passe" colors={colors}>
              <InputWrap icon="lock" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Min. 8 caractères"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <Pressable onPress={() => setShowPw(v => !v)}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </Pressable>
              </InputWrap>
            </Field>

            <GoldButton label="Continuer" onPress={handleRegStep1} colors={colors} />

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>ou s'inscrire avec</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <SocialButtons onGoogle={handleGoogleLogin} onApple={handleAppleLogin} onFacebook={handleFacebookLogin} colors={colors} />
            <BackLink label="Déjà un compte ? Se connecter" onPress={() => setStep("login")} colors={colors} />
          </View>
        )}

        {step === "reg_profile" && (
          <View style={styles.form}>
            <StepIndicator total={3} current={2} />
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Vos informations</Text>

            <Field label="Nom complet" colors={colors}>
              <InputWrap icon="user" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Jean Dupont"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </InputWrap>
            </Field>

            <Field label="Numéro de téléphone" colors={colors}>
              <InputWrap icon="phone" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="+1 514 000 0000"
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </InputWrap>
            </Field>

            <InfoBox colors={colors} text="Votre numéro de téléphone est utilisé uniquement pour vérifier votre identité. Il ne sera jamais partagé publiquement." />

            <GoldButton label="Continuer" onPress={handleRegStep2} colors={colors} />
            <BackLink label="Retour" onPress={() => setStep("reg_account")} colors={colors} />
          </View>
        )}

        {(step === "reg_location" || step === "social_complete") && (
          <View style={styles.form}>
            <StepIndicator total={3} current={3} />
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              {step === "social_complete" ? "Finaliser votre profil" : "Votre pays de résidence"}
            </Text>

            {step === "social_complete" && (
              <Field label="Numéro de téléphone" colors={colors}>
                <InputWrap icon="phone" colors={colors}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="+1 514 000 0000"
                    placeholderTextColor={colors.mutedForeground}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </InputWrap>
              </Field>
            )}

            <Field label="Pays de résidence *" colors={colors}>
              <Pressable
                style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setCountryModal(true)}
              >
                <Feather name="globe" size={16} color={colors.mutedForeground} />
                {selectedCountry ? (
                  <Text style={[styles.input, { color: colors.foreground }]}>
                    {selectedCountry.flag} {selectedCountry.name} ({selectedCountry.currency})
                  </Text>
                ) : (
                  <Text style={[styles.input, { color: colors.mutedForeground }]}>
                    Sélectionnez votre pays
                  </Text>
                )}
                <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
              </Pressable>
            </Field>

            <Field label="Adresse (optionnel)" colors={colors}>
              <InputWrap icon="map-pin" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="123 Rue Exemple, Montréal"
                  placeholderTextColor={colors.mutedForeground}
                  value={address}
                  onChangeText={setAddress}
                  autoCapitalize="words"
                  autoComplete="street-address"
                />
              </InputWrap>
            </Field>

            <InfoBox
              colors={colors}
              text={`Les prix seront affichés dans la devise de votre pays${selectedCountry ? ` : ${selectedCountry.currency} (${selectedCountry.currencySymbol})` : ""}.`}
            />

            <GoldButton
              label={loading ? "Création du compte..." : step === "social_complete" ? "Terminer" : "Créer mon compte"}
              onPress={step === "social_complete" ? handleSocialComplete : handleRegComplete}
              disabled={loading}
              colors={colors}
            />
            <BackLink label="Retour" onPress={() => setStep(step === "social_complete" ? "choice" : "reg_profile")} colors={colors} />
          </View>
        )}
      </ScrollView>

      <Modal visible={countryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCountryModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Choisissez votre pays</Text>
            <Pressable onPress={() => { setCountryModal(false); setCountrySearch(""); }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Rechercher un pays..."
              placeholderTextColor={colors.mutedForeground}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={c => c.code}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryRow,
                  { borderBottomColor: colors.border },
                  selectedCountry?.code === item.code && { backgroundColor: colors.gold + "18" },
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setPhone(prev => {
                    if (!prev || COUNTRIES.some(c => prev.startsWith(c.phonePrefix))) {
                      return item.phonePrefix + " ";
                    }
                    return prev;
                  });
                  setCountryModal(false);
                  setCountrySearch("");
                }}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.countryName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.countryCurrency, { color: colors.mutedForeground }]}>{item.currency} · {item.phonePrefix}</Text>
                </View>
                {selectedCountry?.code === item.code && (
                  <Feather name="check" size={16} color={colors.gold} />
                )}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ChoiceStep({ colors, onEmail, onLogin, onGoogle, onApple, onFacebook }: {
  colors: any;
  onEmail: () => void;
  onLogin: () => void;
  onGoogle: () => void;
  onApple: () => void;
  onFacebook: () => void;
}) {
  return (
    <View style={styles.form}>
      <GoldButton label="Continuer avec l'email" onPress={onEmail} colors={colors} icon="mail" />

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>ou continuer avec</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <SocialButtons onGoogle={onGoogle} onApple={onApple} onFacebook={onFacebook} colors={colors} />

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: colors.mutedForeground }]}>Déjà un compte ? </Text>
        <Pressable onPress={onLogin}>
          <Text style={[styles.switchLink, { color: colors.gold }]}>Se connecter</Text>
        </Pressable>
      </View>

      <View style={[styles.perks, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          "Découvrez des événements près de chez vous",
          "Billets QR et cartes NFC Alvee",
          "Prix affichés dans votre devise locale",
        ].map((f, i) => (
          <View key={i} style={styles.perkRow}>
            <View style={[styles.perkDot, { backgroundColor: colors.gold }]} />
            <Text style={[styles.perkText, { color: colors.mutedForeground }]}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SocialButtons({ onGoogle, onApple, onFacebook, colors }: { onGoogle: () => void; onApple: () => void; onFacebook: () => void; colors: any }) {
  return (
    <View style={styles.socialRow}>
      <Pressable style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onGoogle}>
        <Text style={styles.socialBtnIcon}>G</Text>
        <Text style={[styles.socialBtnLabel, { color: colors.foreground }]}>Google</Text>
      </Pressable>

      {Platform.OS === "ios" && (
        <Pressable style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onApple}>
          <Feather name="smartphone" size={16} color={colors.foreground} />
          <Text style={[styles.socialBtnLabel, { color: colors.foreground }]}>Apple</Text>
        </Pressable>
      )}

      <Pressable style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onFacebook}>
        <Text style={styles.socialBtnIcon}>f</Text>
        <Text style={[styles.socialBtnLabel, { color: colors.foreground }]}>Facebook</Text>
      </Pressable>
    </View>
  );
}

function GoldButton({ label, onPress, disabled, colors, icon }: { label: string; onPress: () => void; disabled?: boolean; colors: any; icon?: string }) {
  return (
    <Pressable
      style={[styles.submit, { backgroundColor: colors.gold, opacity: disabled ? 0.7 : 1 }]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <Feather name={icon as any} size={16} color="#0D0D0D" />}
      <Text style={styles.submitText}>{label}</Text>
    </Pressable>
  );
}

function BackLink({ label, onPress, colors }: { label: string; onPress: () => void; colors: any }) {
  return (
    <Pressable onPress={onPress} style={styles.backLink}>
      <Text style={[styles.switchLink, { color: colors.mutedForeground, fontSize: 13 }]}>{label}</Text>
    </Pressable>
  );
}

function InfoBox({ colors, text }: { colors: any; text: string }) {
  return (
    <View style={[styles.infoBox, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "40" }]}>
      <Feather name="info" size={13} color={colors.gold} />
      <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
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

function InputWrap({ icon, children, colors }: { icon: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon as any} size={16} color={colors.mutedForeground} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  close: { alignSelf: "flex-start", marginBottom: 20 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  brand: { alignItems: "center", marginBottom: 28 },
  brandIcon: { width: 68, height: 68, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  brandName: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  brandTagline: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  stepRow: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 4 },
  stepDot: { width: 28, height: 4, borderRadius: 2 },
  stepTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 4 },
  form: { gap: 14 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  submit: { borderRadius: 14, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 4 },
  submitText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  socialRow: { flexDirection: "row", gap: 10 },
  socialBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 13 },
  socialBtnIcon: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#4285F4" },
  socialBtnLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  switchRow: { flexDirection: "row", justifyContent: "center" },
  switchLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  switchLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  backLink: { alignItems: "center" },
  perks: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, marginTop: 4 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  perkText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  infoBox: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, alignItems: "flex-start" },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  countryRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  countryFlag: { fontSize: 26 },
  countryName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  countryCurrency: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
