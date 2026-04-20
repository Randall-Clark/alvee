import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.handle} />

          <View style={[styles.iconWrap, { backgroundColor: colors.gold + "20" }]}>
            <Feather name="star" size={28} color={colors.gold} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>Sondage de satisfaction</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {eventTitle}
          </Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Comment s'est passé cet événement ?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(i => (
              <Pressable
                key={i}
                onPress={() => {
                  setRating(i);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.starBtn}
              >
                <Feather
                  name={i <= rating ? "star" : "star"}
                  size={36}
                  color={i <= rating ? colors.gold : colors.border}
                />
              </Pressable>
            ))}
          </View>

          <View style={[styles.inputWrap, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Partagez votre expérience (optionnel)..."
              placeholderTextColor={colors.mutedForeground}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.bonusInfo, { backgroundColor: colors.gold + "15" }]}>
            <Feather name="zap" size={14} color={colors.gold} />
            <Text style={[styles.bonusText, { color: colors.gold }]}>
              +{50 + (rating * 10)} points bonus pour ce sondage !
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Plus tard</Text>
            </Pressable>
            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary, opacity: rating > 0 ? 1 : 0.4 },
              ]}
              onPress={handleSubmit}
              disabled={rating === 0}
            >
              <Text style={styles.submitText}>Envoyer</Text>
            </Pressable>
          </View>
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
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
    textAlign: "center",
  },
  stars: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  starBtn: {
    padding: 4,
  },
  inputWrap: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    minHeight: 80,
  },
  input: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 60,
  },
  bonusInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 20,
  },
  bonusText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  submitBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
