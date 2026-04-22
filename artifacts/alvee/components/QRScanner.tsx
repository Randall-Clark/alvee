import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
  title?: string;
}

export function QRScanner({ visible, onClose, onScanned, title = "Scanner QR" }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cooldown = useRef(false);

  const handleBarcode = ({ data }: { data: string }) => {
    if (cooldown.current || scanned) return;
    cooldown.current = true;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onScanned(data);
    setTimeout(() => { cooldown.current = false; setScanned(false); }, 2000);
  };

  const handleClose = () => {
    setScanned(false);
    cooldown.current = false;
    onClose();
  };

  if (Platform.OS === "web") {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: 40 }]}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            <View style={styles.webMsg}>
              <Feather name="camera-off" size={40} color="#888" />
              <Text style={styles.webMsgText}>La caméra n'est pas disponible sur web.</Text>
              <Text style={styles.webMsgSub}>Utilisez l'application mobile pour scanner un QR code.</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.fullScreen}>
        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#C9A84C" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Feather name="camera-off" size={48} color="#C9A84C" />
            <Text style={styles.permText}>Accès à la caméra requis</Text>
            <Pressable style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Autoriser la caméra</Text>
            </Pressable>
            <Pressable style={styles.cancelLinkBtn} onPress={handleClose}>
              <Text style={styles.cancelLinkText}>Annuler</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanned ? undefined : handleBarcode}
            />

            <View style={styles.overlay2} pointerEvents="none">
              <View style={styles.topDim} />
              <View style={styles.middleRow}>
                <View style={styles.sideDim} />
                <View style={styles.scanBox}>
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                  {scanned && (
                    <View style={styles.scannedOverlay}>
                      <Feather name="check-circle" size={40} color="#C9A84C" />
                    </View>
                  )}
                </View>
                <View style={styles.sideDim} />
              </View>
              <View style={styles.bottomDim}>
                <Text style={styles.scanHint}>Centrez le QR code dans le cadre</Text>
              </View>
            </View>

            <View style={styles.topBar}>
              <Pressable style={styles.topCloseBtn} onPress={handleClose}>
                <Feather name="x" size={22} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.topTitle}>{title}</Text>
              <View style={{ width: 40 }} />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const DIM = "rgba(0,0,0,0.72)";
const GOLD = "#C9A84C";

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#1A1A1A", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: "center", gap: 16 },
  handle: { width: 36, height: 4, backgroundColor: "#333", borderRadius: 2 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  webMsg: { alignItems: "center", gap: 10, paddingVertical: 20 },
  webMsgText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF", textAlign: "center" },
  webMsgSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center" },
  closeBtn: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  closeBtnText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  fullScreen: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "#0D0D0D" },
  permText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF", textAlign: "center", marginTop: 8 },
  permBtn: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 4 },
  permBtnText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  cancelLinkBtn: { paddingVertical: 12 },
  cancelLinkText: { color: "#888", fontSize: 14, fontFamily: "Inter_400Regular" },
  camera: { flex: 1 },
  overlay2: { ...StyleSheet.absoluteFillObject },
  topDim: { flex: 1, backgroundColor: DIM },
  middleRow: { flexDirection: "row", height: 260 },
  sideDim: { flex: 1, backgroundColor: DIM },
  scanBox: { width: 260, height: 260, position: "relative" },
  scannedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" },
  bottomDim: { flex: 1, backgroundColor: DIM, alignItems: "center", justifyContent: "flex-start", paddingTop: 24 },
  scanHint: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "Inter_500Medium" },
  corner: { position: "absolute", width: 28, height: 28, borderColor: GOLD, borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 54, paddingBottom: 16 },
  topCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
});
