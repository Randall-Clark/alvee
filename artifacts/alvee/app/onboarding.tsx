import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Slide {
  icon: string;
  title: string;
  text: string;
  highlight: string;
}

const SLIDES: Slide[] = [
  {
    icon: "zap",
    title: "Bienvenue sur Alvee",
    text: "La plateforme premium pour découvrir et créer des événements sociaux qui vous ressemblent.",
    highlight: "Rencontrez. Vibrez. Connectez.",
  },
  {
    icon: "compass",
    title: "Comment ça marche",
    text: "Explorez les événements près de chez vous, réservez votre place et obtenez votre billet QR ou NFC. Les organisateurs créent leurs propres soirées et vous y accueillent.",
    highlight: "Simple, rapide, fluide.",
  },
  {
    icon: "credit-card",
    title: "Vos cartes Alvee NFC",
    text: "Standard, Prime ou Platinum — votre pass physique Alvee débloque l'entrée NFC, l'accès aux événements premium et des avantages exclusifs.",
    highlight: "À partir de 12$ / an.",
  },
  {
    icon: "arrow-right-circle",
    title: "Prêt à commencer ?",
    text: "Créez votre compte en quelques secondes. Nous détecterons automatiquement votre pays et afficherons les prix dans votre devise.",
    highlight: "C'est parti !",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== index) setIndex(i);
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  const handleSkip = () => finish();

  const finish = async () => {
    await AsyncStorage.setItem("alvee_onboarding_done", "true");
    router.replace("/auth");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        {index < SLIDES.length - 1 && (
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Passer</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => `slide_${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_W, minHeight: SCREEN_H - 220 }]}>
            <View style={[styles.iconBg, { backgroundColor: colors.gold + "20" }]}>
              <LinearGradient
                colors={[colors.gold, colors.gold + "80"]}
                style={styles.iconCircle}
              >
                <Feather name={item.icon as any} size={48} color="#0D0D0D" />
              </LinearGradient>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{item.text}</Text>
            <Text style={[styles.highlight, { color: colors.gold }]}>{item.highlight}</Text>
          </View>
        )}
      />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index
                  ? { width: 24, backgroundColor: colors.gold }
                  : { width: 8, backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>

        <Pressable
          style={[styles.cta, { backgroundColor: colors.gold }]}
          onPress={handleNext}
        >
          <Text style={styles.ctaText}>
            {index === SLIDES.length - 1 ? "Commencer" : "Suivant"}
          </Text>
          <Feather
            name={index === SLIDES.length - 1 ? "arrow-right-circle" : "arrow-right"}
            size={18}
            color="#0D0D0D"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, height: 60 },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  slide: { paddingHorizontal: 36, alignItems: "center", justifyContent: "center" },
  iconBg: {
    width: 180, height: 180, borderRadius: 90,
    alignItems: "center", justifyContent: "center", marginBottom: 36,
  },
  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 14, letterSpacing: -0.5 },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23, marginBottom: 18 },
  highlight: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center", letterSpacing: 0.3 },
  bottom: { paddingHorizontal: 24, gap: 22 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center" },
  dot: { height: 8, borderRadius: 4 },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 16, paddingVertical: 17,
  },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
});
