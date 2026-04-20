import { Feather } from "@expo/vector-icons";
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

import { type PaymentMethod, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CARD_ICONS: Record<string, string> = { visa: "💳", mastercard: "💳", amex: "💳" };

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, addPaymentMethod, removePaymentMethod, isAuthenticated } = useApp();
  const [adding, setAdding] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const methods = user?.savedPaymentMethods ?? [];

  const detectType = (num: string): PaymentMethod["type"] => {
    if (num.startsWith("4")) return "visa";
    if (num.startsWith("5") || num.startsWith("2")) return "mastercard";
    return "amex";
  };

  const formatCardNum = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handleAdd = () => {
    const digits = cardNum.replace(/\s/g, "");
    if (digits.length < 16 || expiry.length < 5 || cvv.length < 3 || !name.trim()) {
      Alert.alert("Champs incomplets", "Veuillez remplir tous les champs."); return;
    }
    addPaymentMethod({ type: detectType(digits), last4: digits.slice(-4), expiry, isDefault: methods.length === 0 });
    setAdding(false); setCardNum(""); setExpiry(""); setCvv(""); setName("");
    Alert.alert("Carte ajoutée !", "Votre moyen de paiement est enregistré.");
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Feather name="x" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Paiement</Text>
        <Pressable onPress={() => setAdding(v => !v)} style={[styles.addBtn, { backgroundColor: colors.gold }]}>
          <Feather name={adding ? "x" : "plus"} size={16} color="#0D0D0D" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        {adding && (
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>Ajouter une carte</Text>
            <Field label="Nom sur la carte" colors={colors}>
              <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="Jean Dupont" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} autoCapitalize="words" />
            </Field>
            <Field label="Numéro de carte" colors={colors}>
              <View style={[styles.inputRow, { backgroundColor: colors.muted }]}>
                <TextInput style={[styles.inputFlex, { color: colors.foreground }]} placeholder="1234 5678 9012 3456" placeholderTextColor={colors.mutedForeground} value={cardNum} onChangeText={v => setCardNum(formatCardNum(v))} keyboardType="numeric" maxLength={19} />
                <Text style={{ fontSize: 16 }}>{detectType(cardNum.replace(/\s/g, "")) === "visa" ? "💳" : "💳"}</Text>
              </View>
            </Field>
            <View style={styles.row}>
              <Field label="Date d'expiration" colors={colors} style={{ flex: 1 }}>
                <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="MM/AA" placeholderTextColor={colors.mutedForeground} value={expiry} onChangeText={v => setExpiry(formatExpiry(v))} keyboardType="numeric" maxLength={5} />
              </Field>
              <Field label="CVV" colors={colors} style={{ flex: 1 }}>
                <TextInput style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]} placeholder="•••" placeholderTextColor={colors.mutedForeground} value={cvv} onChangeText={setCvv} keyboardType="numeric" maxLength={4} secureTextEntry />
              </Field>
            </View>
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.gold }]} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Enregistrer la carte</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mes moyens de paiement</Text>

        {methods.length === 0 && !adding ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Feather name="credit-card" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucun moyen de paiement enregistré</Text>
            <Pressable onPress={() => setAdding(true)} style={[styles.addFirstBtn, { backgroundColor: colors.gold }]}>
              <Text style={styles.addFirstBtnText}>Ajouter une carte</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {methods.map(pm => (
              <View key={pm.id} style={[styles.pmCard, { backgroundColor: colors.card }]}>
                <View style={[styles.pmIconWrap, { backgroundColor: pm.type === "visa" ? "#1A1F71" + "30" : "#EB001B" + "20" }]}>
                  <Text style={{ fontSize: 18 }}>💳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pmName, { color: colors.foreground }]}>
                    {pm.type.charAt(0).toUpperCase() + pm.type.slice(1)} •••• {pm.last4}
                  </Text>
                  <Text style={[styles.pmExpiry, { color: colors.mutedForeground }]}>Expire {pm.expiry}{pm.isDefault ? " · Défaut" : ""}</Text>
                </View>
                {pm.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.gold + "20" }]}>
                    <Text style={[styles.defaultText, { color: colors.gold }]}>Défaut</Text>
                  </View>
                )}
                <Pressable onPress={() => Alert.alert("Supprimer ?", "Retirer ce moyen de paiement ?", [
                  { text: "Annuler", style: "cancel" },
                  { text: "Supprimer", style: "destructive", onPress: () => removePaymentMethod(pm.id) },
                ])}>
                  <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={14} color={colors.gold} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Vos informations de paiement sont chiffrées et sécurisées. Alvee ne stocke jamais votre numéro de carte complet.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Historique des transactions</Text>
        <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune transaction récente</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  formCard: { borderRadius: 16, padding: 16, gap: 12 },
  formTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  input: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, gap: 8 },
  inputFlex: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  row: { flexDirection: "row", gap: 10 },
  saveBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  emptyCard: { borderRadius: 14, padding: 24, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  addFirstBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addFirstBtnText: { color: "#0D0D0D", fontSize: 13, fontFamily: "Inter_700Bold" },
  pmCard: { borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  pmIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  pmName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pmExpiry: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  defaultText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  infoBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
});
