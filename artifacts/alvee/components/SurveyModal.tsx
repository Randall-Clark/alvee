import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  eventTitle: string;
  onSubmit: (rating: number, feedback: string) => void;
  onClose: () => void;
}

export function SurveyModal({ visible, eventTitle, onSubmit, onClose }: Props) {
  const colors = useColors();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (rating === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(rating, feedback);
    setRating(0);
    setFeedback("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: "#1A1A1A" }]}>
          <View style={styles.handle} />

          <View style={[styles.iconWrap, { backgroundColor: colors.gold + "20" }]}>
            <Feather name="star" size={26} color={colors.gold} />
          </View>

          <Text style={styles.title}>Sondage de satisfaction</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{eventTitle}</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Comment s'est passé cet événement ?</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(i => (
              <Pressable key={i} onPress={() => { setRating(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Feather name="star" size={38} color={i <= rating ? colors.gold : "#333"} />
              </Pressable>
            ))}
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Votre retour (optionnel)..."
              placeholderTextColor={colors.mutedForeground}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {rating > 0 && (
            <View style={[styles.bonus, { backgroundColor: colors.gold + "15" }]}>
              <Feather name="zap" size={13} color={colors.gold} />
              <Text style={[styles.bonusText, { color: colors.gold }]}>+{50 + rating * 10} points bonus !</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable style={[styles.skipBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Plus tard</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, { backgroundColor: colors.gold, opacity: rating > 0 ? 1 : 0.4 }]} onPress={handleSubmit} disabled={rating === 0}>
              <Text style={styles.submitText}>Envoyer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, alignItems: "center", gap: 12 },
  handle: { width: 36, height: 4, backgroundColor: "#333", borderRadius: 2 },
  iconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 19, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  label: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
  stars: { flexDirection: "row", gap: 10 },
  inputWrap: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 80 },
  input: { fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 60 },
  bonus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  bonusText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  skipBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  submitBtn: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  submitText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
});
