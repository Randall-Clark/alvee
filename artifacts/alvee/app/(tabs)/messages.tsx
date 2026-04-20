import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations, messages, user, isAuthenticated, sendMessage, markMsgRead, events } = useApp();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Feather name="message-circle" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Connexion requise</Text>
          <Pressable style={[styles.loginBtn, { backgroundColor: colors.gold }]} onPress={() => router.push("/auth")}>
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const activeConvData = conversations.find(c => c.id === activeConv);
  const convMessages = activeConvData
    ? messages.filter(m =>
        m.eventId === activeConvData.eventId &&
        ((m.senderId === user!.id && m.receiverId === activeConvData.otherUserId) ||
         (m.senderId === activeConvData.otherUserId && m.receiverId === user!.id))
      ).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];

  const handleSend = async () => {
    if (!activeConvData || !newMessage.trim()) return;
    await sendMessage(activeConvData.eventId, activeConvData.eventTitle, activeConvData.otherUserId, activeConvData.otherUserName, newMessage.trim());
    setNewMessage("");
  };

  const handleOpenConv = (convId: string) => {
    setActiveConv(convId);
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      messages.filter(m => m.senderId === conv.otherUserId && m.receiverId === user!.id && m.eventId === conv.eventId).forEach(m => markMsgRead(m.id));
    }
  };

  const myEvents = events.filter(e => e.organizerId === user?.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>Messages</Text>
        {myEvents.length > 0 && (
          <Pressable style={[styles.composeBtn, { backgroundColor: colors.gold }]}>
            <Feather name="edit-3" size={14} color="#0D0D0D" />
          </Pressable>
        )}
      </View>

      {conversations.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Feather name="message-circle" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun message</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Vos conversations avec les organisateurs apparaîtront ici
          </Text>
          <Pressable style={[styles.loginBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={() => router.push("/")}>
            <Text style={[styles.loginBtnText, { color: colors.foreground }]}>Explorer les événements</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.convList, { paddingBottom: Platform.OS === "web" ? 100 : 80 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: conv }) => (
            <Pressable
              style={[styles.convCard, { backgroundColor: colors.card }]}
              onPress={() => handleOpenConv(conv.id)}
            >
              <View style={[styles.convAvatar, { backgroundColor: conv.unreadCount > 0 ? colors.gold + "30" : colors.muted }]}>
                <Text style={[styles.convAvatarText, { color: conv.unreadCount > 0 ? colors.gold : colors.mutedForeground }]}>
                  {conv.otherUserName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.convTop}>
                  <Text style={[styles.convName, { color: colors.foreground }]}>{conv.otherUserName}</Text>
                  <Text style={[styles.convTime, { color: colors.mutedForeground }]}>
                    {new Date(conv.lastAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <Text style={[styles.convEvent, { color: colors.gold }]} numberOfLines={1}>📅 {conv.eventTitle}</Text>
                <Text style={[styles.convLast, { color: conv.unreadCount > 0 ? colors.foreground : colors.mutedForeground, fontFamily: conv.unreadCount > 0 ? "Inter_600SemiBold" : "Inter_400Regular" }]} numberOfLines={1}>
                  {conv.lastMessage}
                </Text>
              </View>
              {conv.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.gold }]}>
                  <Text style={styles.unreadCount}>{conv.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}

      <Modal visible={!!activeConv} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveConv(null)}>
        {activeConvData && (
          <KeyboardAvoidingView style={[styles.chatContainer, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={[styles.chatHeader, { borderBottomColor: colors.border, paddingTop: Platform.OS === "web" ? 20 : 60 }]}>
              <Pressable onPress={() => setActiveConv(null)}>
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.chatName, { color: colors.foreground }]}>{activeConvData.otherUserName}</Text>
                <Text style={[styles.chatEvent, { color: colors.gold }]} numberOfLines={1}>{activeConvData.eventTitle}</Text>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.msgList} showsVerticalScrollIndicator={false}>
              {convMessages.length === 0 && (
                <View style={styles.noMsg}>
                  <Text style={[styles.noMsgText, { color: colors.mutedForeground }]}>Démarrez la conversation !</Text>
                </View>
              )}
              {convMessages.map(msg => {
                const isMine = msg.senderId === user?.id;
                return (
                  <View key={msg.id} style={[styles.msgRow, isMine && styles.msgRowMine]}>
                    <View style={[styles.bubble, isMine ? { backgroundColor: colors.gold } : { backgroundColor: colors.card }]}>
                      <Text style={[styles.bubbleText, { color: isMine ? "#0D0D0D" : colors.foreground }]}>{msg.content}</Text>
                      <Text style={[styles.bubbleTime, { color: isMine ? "rgba(0,0,0,0.5)" : colors.mutedForeground }]}>
                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.msgInput, { color: colors.foreground, backgroundColor: colors.muted }]}
                placeholder="Écrire un message..."
                placeholderTextColor={colors.mutedForeground}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <Pressable
                style={[styles.sendBtn, { backgroundColor: colors.gold, opacity: newMessage.trim() ? 1 : 0.4 }]}
                onPress={handleSend}
                disabled={!newMessage.trim()}
              >
                <Feather name="send" size={16} color="#0D0D0D" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  composeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  loginBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  loginBtnText: { color: "#0D0D0D", fontSize: 14, fontFamily: "Inter_700Bold" },
  convList: { paddingHorizontal: 20, paddingTop: 4, gap: 8 },
  convCard: { borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  convAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  convAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  convTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  convName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  convTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  convEvent: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 3 },
  convLast: { fontSize: 13 },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  unreadCount: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  chatName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  chatEvent: { fontSize: 11, fontFamily: "Inter_500Medium" },
  msgList: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  noMsg: { alignItems: "center", paddingTop: 40 },
  noMsgText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  msgRow: { flexDirection: "row" },
  msgRowMine: { justifyContent: "flex-end" },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  bubbleTime: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, borderTopWidth: 1 },
  msgInput: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
