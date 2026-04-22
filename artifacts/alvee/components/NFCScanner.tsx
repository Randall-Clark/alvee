import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onNFCDetected: (cardId: string) => void;
  title?: string;
}

type ScanState = "idle" | "scanning" | "success" | "error" | "unavailable";

function getNfcManager() {
  try {
    return require("react-native-nfc-manager").default as any;
  } catch {
    return null;
  }
}

function getNfcTech() {
  try {
    return require("react-native-nfc-manager").NfcTech as any;
  } catch {
    return null;
  }
}

export function NFCScanner({ visible, onClose, onNFCDetected, title = "Scanner NFC" }: Props) {
  const colors = useColors();
  const [state, setState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const scanning = useRef(false);

  const startPulse = useCallback(() => {
    pulseLoop.current?.stop();
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [pulseAnim]);

  const cancelScan = useCallback(async () => {
    scanning.current = false;
    try {
      const NfcManager = getNfcManager();
      if (NfcManager) await NfcManager.cancelTechnologyRequest();
    } catch {}
    stopPulse();
  }, [stopPulse]);

  const startScan = useCallback(async () => {
    if (Platform.OS === "web") {
      setState("unavailable");
      setErrorMsg("NFC non disponible sur le web.");
      return;
    }

    const NfcManager = getNfcManager();
    const NfcTech = getNfcTech();

    if (!NfcManager || !NfcTech) {
      setState("unavailable");
      setErrorMsg("NFC non disponible dans Expo Go. Un build natif est requis.");
      return;
    }

    try {
      const supported = await NfcManager.isSupported();
      if (!supported) {
        setState("unavailable");
        setErrorMsg("NFC non supporté sur cet appareil.");
        return;
      }
      const enabled = await NfcManager.isEnabled();
      if (!enabled) {
        setState("unavailable");
        setErrorMsg("Activez le NFC dans les paramètres de votre téléphone.");
        return;
      }
      await NfcManager.start();
    } catch (e: any) {
      if (!e?.message?.includes("already")) {
        setState("unavailable");
        setErrorMsg("Impossible d'initialiser le NFC.");
        return;
      }
    }

    setState("scanning");
    scanning.current = true;
    startPulse();

    try {
      await NfcManager.requestTechnology([
        NfcTech.Ndef,
        NfcTech.NfcA,
        NfcTech.NfcB,
        NfcTech.NfcF,
        NfcTech.NfcV,
        NfcTech.IsoDep,
      ]);
      const tag = await NfcManager.getTag();

      const cardId = tag?.id
        ? (Array.isArray(tag.id)
          ? tag.id.map((b: number) => b.toString(16).padStart(2, "0")).join(":").toUpperCase()
          : String(tag.id))
        : `NFC-${Date.now().toString(36).toUpperCase()}`;

      setState("success");
      stopPulse();
      scanning.current = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try { await NfcManager.cancelTechnologyRequest(); } catch {}
      onNFCDetected(cardId);
    } catch (ex: any) {
      scanning.current = false;
      stopPulse();
      const msg: string = ex?.message ?? "";
      if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("user")) {
        setState("idle");
      } else {
        setState("error");
        setErrorMsg(msg || "Erreur de lecture NFC.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      try { const NfcManager2 = getNfcManager(); if (NfcManager2) await NfcManager2.cancelTechnologyRequest(); } catch {}
    }
  }, [startPulse, stopPulse, onNFCDetected]);

  useEffect(() => {
    if (visible) {
      setState("idle");
      setErrorMsg("");
      startScan();
    } else {
      cancelScan();
      setState("idle");
    }
    return () => { if (visible) cancelScan(); };
  }, [visible]);

  const handleClose = () => {
    cancelScan();
    setState("idle");
    setErrorMsg("");
    onClose();
  };

  const handleRetry = () => {
    setState("idle");
    setErrorMsg("");
    startScan();
  };

  const ringColor = state === "success"
    ? (colors.success ?? "#00AA44") + "80"
    : state === "error" || state === "unavailable"
    ? "#FF444460"
    : "rgba(201,168,76,0.4)";

  const innerBg = state === "success"
    ? (colors.success ?? "#00AA44") + "25"
    : state === "error" || state === "unavailable"
    ? "#FF444425"
    : colors.gold + "20";

  const statusColor = state === "success"
    ? (colors.success ?? "#00AA44")
    : state === "error" || state === "unavailable"
    ? "#FF4444"
    : state === "scanning"
    ? colors.gold
    : colors.mutedForeground;

  const statusText = state === "scanning"
    ? "En attente d'une carte NFC…"
    : state === "success"
    ? "Carte détectée !"
    : state === "error" || state === "unavailable"
    ? (errorMsg || "NFC non disponible.")
    : "Approchez votre carte NFC Alvee";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: "#1A1A1A" }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <View style={styles.nfcArea}>
            <Animated.View style={[
              styles.nfcRing,
              { borderColor: ringColor },
              { transform: [{ scale: state === "scanning" ? pulseAnim : 1 }] },
            ]} />
            <View style={[styles.nfcInner, { backgroundColor: innerBg }]}>
              {state === "success" ? (
                <Feather name="check-circle" size={36} color={colors.success ?? "#00AA44"} />
              ) : state === "error" || state === "unavailable" ? (
                <Feather name="wifi-off" size={36} color="#FF4444" />
              ) : (
                <Feather name="wifi" size={36} color={colors.gold} />
              )}
            </View>
          </View>

          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>

          {state === "scanning" && (
            <View style={styles.dotsRow}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.dot, { backgroundColor: colors.gold }]} />
              ))}
            </View>
          )}

          {(state === "error" || state === "idle") && (
            <Pressable style={[styles.retryBtn, { backgroundColor: colors.gold }]} onPress={handleRetry}>
              <Feather name="refresh-cw" size={15} color="#0D0D0D" />
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </Pressable>
          )}

          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, alignItems: "center", gap: 14 },
  handle: { width: 36, height: 4, backgroundColor: "#333", borderRadius: 2 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  nfcArea: { width: 130, height: 130, alignItems: "center", justifyContent: "center", marginVertical: 8 },
  nfcRing: { position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 2 },
  nfcInner: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  statusText: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 20 },
  dotsRow: { flexDirection: "row", gap: 6, height: 16, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, opacity: 0.7 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, width: "100%", justifyContent: "center" },
  retryBtnText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
