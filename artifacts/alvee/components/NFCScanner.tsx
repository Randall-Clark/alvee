import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onNFCDetected: (cardId: string) => void;
  title?: string;
}

export function NFCScanner({ visible, onClose, onNFCDetected, title = "Scanner NFC" }: Props) {
  const colors = useColors();
  const [manualId, setManualId] = useState("");
  const [scanning, setScanning] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
    return () => pulseAnim.stopAnimation();
  }, [visible]);

  const handleSimulate = () => {
    setScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setScanning(false);
      onNFCDetected(`NFC-${Date.now().toString(36).toUpperCase()}`);
    }, 1500);
  };

  const handleManual = () => {
    if (manualId.trim()) { onNFCDetected(manualId.trim().toUpperCase()); setManualId(""); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: "#1A1A1A" }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <View style={styles.nfcArea}>
            <Animated.View style={[styles.nfcRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={[styles.nfcInner, { backgroundColor: colors.gold + "20" }]}>
              <Feather name="wifi" size={36} color={colors.gold} />
            </View>
          </View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Approchez votre carte NFC Alvee</Text>

          <Pressable style={[styles.simBtn, { backgroundColor: colors.gold }]} onPress={handleSimulate}>
            <Feather name="zap" size={16} color="#0D0D0D" />
            <Text style={styles.simBtnText}>{scanning ? "Détection..." : "Simuler détection NFC"}</Text>
          </Pressable>

          <View style={styles.divRow}>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.divText, { color: colors.mutedForeground }]}>ou saisir manuellement</Text>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={[styles.manualRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <TextInput
              style={[styles.manualInput, { color: colors.foreground }]}
              placeholder="ID carte (ex: NFC-ABC123)"
              placeholderTextColor={colors.mutedForeground}
              value={manualId}
              onChangeText={setManualId}
              autoCapitalize="characters"
            />
            <Pressable style={[styles.manualSubmit, { backgroundColor: colors.gold, opacity: manualId.trim() ? 1 : 0.4 }]} onPress={handleManual} disabled={!manualId.trim()}>
              <Feather name="arrow-right" size={16} color="#0D0D0D" />
            </Pressable>
          </View>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, alignItems: "center", gap: 16 },
  handle: { width: 36, height: 4, backgroundColor: "#333", borderRadius: 2 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  nfcArea: { width: 130, height: 130, alignItems: "center", justifyContent: "center" },
  nfcRing: { position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: "rgba(201,168,76,0.35)" },
  nfcInner: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  simBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, width: "100%", justifyContent: "center" },
  simBtnText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  divRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%" },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  manualRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, overflow: "hidden", width: "100%" },
  manualInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  manualSubmit: { padding: 12, margin: 4, borderRadius: 9 },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
