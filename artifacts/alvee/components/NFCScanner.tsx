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
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startAnimation();
    }
    return () => {
      pulseAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [visible]);

  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleSimulateNFC = () => {
    setScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      const fakeId = `NFC-${Date.now().toString(36).toUpperCase()}`;
      setScanning(false);
      onNFCDetected(fakeId);
    }, 1500);
  };

  const handleManualSubmit = () => {
    if (manualId.trim()) {
      onNFCDetected(manualId.trim().toUpperCase());
      setManualId("");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>

          <View style={styles.nfcArea}>
            <Animated.View
              style={[
                styles.nfcRing,
                {
                  borderColor: colors.primary + "40",
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <View style={[styles.nfcInner, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="wifi" size={40} color={colors.primary} />
            </View>
          </View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Approchez la carte NFC Alvee du téléphone
          </Text>

          <Pressable
            style={[styles.simulateBtn, { backgroundColor: colors.primary }]}
            onPress={handleSimulateNFC}
          >
            <Feather name="zap" size={16} color="#fff" />
            <Text style={styles.simulateBtnText}>
              {scanning ? "Détection en cours..." : "Simuler détection NFC"}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>ou saisir manuellement</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={[styles.inputRow, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="ID de la carte (ex: NFC-ABC123)"
              placeholderTextColor={colors.mutedForeground}
              value={manualId}
              onChangeText={setManualId}
              autoCapitalize="characters"
            />
            <Pressable
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: manualId.trim() ? 1 : 0.5 }]}
              onPress={handleManualSubmit}
              disabled={!manualId.trim()}
            >
              <Feather name="arrow-right" size={16} color="#fff" />
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 24,
  },
  nfcArea: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  nfcRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  nfcInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  simulateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
  },
  simulateBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  submitBtn: {
    padding: 12,
    margin: 4,
    borderRadius: 8,
  },
  cancelBtn: {
    padding: 12,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
