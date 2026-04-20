import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { useColors } from "@/hooks/useColors";

interface Props {
  latitude: number;
  longitude: number;
  title: string;
  address: string;
}

export function EventMap({ latitude, longitude, title, address }: Props) {
  const colors = useColors();
  const zoom = 15;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.007}%2C${longitude + 0.01}%2C${latitude + 0.007}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { borderColor: colors.border }]}>
        <iframe
          src={mapUrl}
          style={{ width: "100%", height: "100%", border: "none", borderRadius: 16 }}
          title={title}
          loading="lazy"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <WebView
        source={{ uri: mapUrl }}
        style={styles.webview}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.overlay, { backgroundColor: colors.background + "00" }]}>
        <Pressable
          style={[styles.openBtn, { backgroundColor: colors.gold }]}
          onPress={() => {
            const { Linking } = require("react-native");
            Linking.openURL(mapsUrl);
          }}
        >
          <Text style={styles.openBtnText}>Ouvrir dans Maps</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 200, borderRadius: 16, overflow: "hidden", borderWidth: 1, position: "relative" },
  webview: { flex: 1 },
  overlay: { position: "absolute", bottom: 10, right: 10 },
  openBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  openBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#0D0D0D" },
});
