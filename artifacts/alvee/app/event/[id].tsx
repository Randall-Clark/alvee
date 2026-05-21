import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

import { EventMap } from "@/components/EventMap";
import { NFCScanner } from "@/components/NFCScanner";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { SurveyModal } from "@/components/SurveyModal";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getEventImage } from "@/utils/eventImages";

const ROLES = ["Fondateur", "Investisseur", "Designer", "Développeur", "Entrepreneur", "Curieux"];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { events, user, isAuthenticated, bookEvent, getUserBookingForEvent, linkNFCToBooking, cancelBooking, sendMessage, canAccessEvent, addComment } = useApp();

  const [loading, setLoading] = useState(false);
  const [nfcVisible, setNfcVisible] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [msgModal, setMsgModal] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(5);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [bookingQty, setBookingQty] = useState(1);
  const [bookingRole, setBookingRole] = useState("Participant");
  const [participantName, setParticipantName] = useState("");

  const event = events.find(e => e.id === id);
  const booking = event ? getUserBookingForEvent(event.id) : undefined;

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={[styles.backBtnWrap, { top: (Platform.OS === "web" ? 67 : insets.top) + 12 }]} onPress={() => router.back()}>
          <View style={styles.backBtnInner}><Feather name="arrow-left" size={18} color="#fff" /></View>
        </Pressable>
        <View style={styles.center}><Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Événement introuvable</Text></View>
      </View>
    );
  }

  const isFull = event.currentParticipants >= event.maxParticipants;
  const accessible = canAccessEvent(event.price);
  const cardRequired = event.price >= 300;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleBook = async () => {
    if (!isAuthenticated) { router.push("/auth"); return; }
    if (isFull) return;
    if (!accessible) {
      Alert.alert("Carte Prime requise", "Cet événement (300 $ CAD et plus) nécessite au minimum une carte Alvee Prime.", [
        { text: "Voir les cartes", onPress: () => router.push("/nfc-card") },
        { text: "Annuler", style: "cancel" },
      ]);
      return;
    }
    setParticipantName(user?.name ?? "");
    setBookingQty(1);
    setBookingRole("Participant");
    setBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    setBookingModal(false);
    setLoading(true);
    try {
      const result = await bookEvent(event.id, bookingRole);
      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Réservation confirmée !", "Votre place est réservée. Retrouvez votre billet dans l'onglet Activités → Mes Inscriptions.");
      }
    } catch { Alert.alert("Erreur", "Impossible de réserver."); }
    finally { setLoading(false); }
  };

  const handleNFCLink = async (cardId: string) => {
    if (!booking) return;
    setNfcVisible(false);
    const ok = await linkNFCToBooking(booking.id, cardId);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès !", "Votre billet est enregistré sur votre carte NFC Alvee.\n\nVous pouvez maintenant utiliser votre carte physique comme moyen d'entrée.");
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    Alert.alert(
      "Annuler ma participation",
      "Voulez-vous annuler votre réservation ? Un remboursement sera effectué selon les conditions de votre carte Alvee.",
      [
        { text: "Non, garder", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            const result = await cancelBooking(booking.id);
            Alert.alert(result.refunded ? "Annulé & remboursé" : "Annulé", result.message);
          },
        },
      ]
    );
  };

  const handleSendMsg = async () => {
    if (!msgText.trim()) return;
    await sendMessage(event.id, event.title, event.organizerId, event.organizerName, msgText.trim());
    setMsgText("");
    setMsgModal(false);
    Alert.alert("Message envoyé", `Votre message a été envoyé à ${event.organizerName}.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + bottomPad }}>
        <View style={styles.hero}>
          <Image
            source={event.coverImageUri ? { uri: event.coverImageUri } : getEventImage(event.coverImage)}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.5)", colors.background]} style={styles.heroGrad} />

          <Pressable style={[styles.backBtnWrap, { top: topPad + 12 }]} onPress={() => router.back()}>
            <View style={styles.backBtnInner}><Feather name="arrow-left" size={18} color="#fff" /></View>
          </Pressable>

          {user?.id === event.organizerId && (
            <Pressable style={[styles.manageBtn, { top: topPad + 12 }]} onPress={() => router.push("/manage")}>
              <View style={styles.backBtnInner}><Feather name="settings" size={18} color="#fff" /></View>
            </Pressable>
          )}

          <View style={styles.heroBadges}>
            <View style={[styles.catPill, { backgroundColor: "rgba(201,168,76,0.3)", borderColor: "rgba(201,168,76,0.5)" }]}>
              <Text style={[styles.catPillText, { color: colors.gold }]}>{event.category}</Text>
            </View>
            {cardRequired && (
              <View style={[styles.catPill, { backgroundColor: "rgba(201,168,76,0.25)", borderColor: "rgba(201,168,76,0.4)" }]}>
                <Feather name="credit-card" size={10} color={colors.gold} />
                <Text style={[styles.catPillText, { color: colors.gold }]}>Carte Prime requise</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>

          <View style={styles.orgRow}>
            <View style={[styles.orgAvatar, { backgroundColor: colors.gold + "30" }]}>
              <Feather name="user" size={12} color={colors.gold} />
            </View>
            <Text style={[styles.orgName, { color: colors.mutedForeground }]}>{event.organizerName}</Text>
            {user?.id !== event.organizerId && (
              <Pressable style={[styles.msgOrgBtn, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]} onPress={() => setMsgModal(true)}>
                <Feather name="message-circle" size={13} color={colors.gold} />
                <Text style={[styles.msgOrgText, { color: colors.gold }]}>Contacter</Text>
              </Pressable>
            )}
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <InfoRow icon="tag" label={`Entrée — ${event.price === 0 ? "Gratuit" : `${event.price} $ CAD`}`} value="" colors={colors} highlight />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="calendar" label={new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} value="" colors={colors} />
            <InfoRow icon="clock" label={event.time} value="" colors={colors} />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="map-pin" label={event.location} value={event.address} colors={colors} />
            <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />
            <InfoRow icon="users" label={`${event.currentParticipants} / ${event.maxParticipants} participants`} value="" colors={colors} />
          </View>

          {(event.latitude && event.longitude) ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Carte & localisation</Text>
              <EventMap
                latitude={event.latitude}
                longitude={event.longitude}
                title={event.title}
                address={event.address}
              />
            </>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Détails de l'événement</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{event.description}</Text>

          <View style={[styles.nfcInfoCard, { backgroundColor: colors.card }]}>
            <Feather name="credit-card" size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.nfcInfoTitle, { color: colors.foreground }]}>
                {event.nfcOnlyEntry ? "Carte NFC requise uniquement" : "QR code ou Carte NFC acceptés"}
              </Text>
              <Text style={[styles.nfcInfoSub, { color: colors.mutedForeground }]}>
                {event.nfcOnlyEntry
                  ? "L'organisateur exige la carte physique Alvee comme seul moyen d'entrée."
                  : "Présentez votre QR code à l'entrée ou passez votre carte Alvee si vous l'avez enregistrée sur votre billet."}
              </Text>
            </View>
          </View>

          {/* COMMENTS SECTION */}
          <View>
            <View style={styles.commentsTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Commentaires {event.comments && event.comments.length > 0 ? `(${event.comments.length})` : ""}
              </Text>
              {isAuthenticated && !showCommentForm && (
                <Pressable
                  style={[styles.addCommentBtn, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}
                  onPress={() => setShowCommentForm(true)}
                >
                  <Feather name="edit-2" size={12} color={colors.gold} />
                  <Text style={[styles.addCommentText, { color: colors.gold }]}>Commenter</Text>
                </Pressable>
              )}
            </View>

            {showCommentForm && (
              <View style={[styles.commentForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>Note</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Pressable key={s} onPress={() => setCommentRating(s)}>
                      <Feather name="star" size={24} color={s <= commentRating ? colors.gold : colors.border} />
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={[styles.commentInput, { backgroundColor: colors.muted, color: colors.foreground }]}
                  placeholder="Partagez votre expérience…"
                  placeholderTextColor={colors.mutedForeground}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <View style={styles.commentFormBtns}>
                  <Pressable
                    style={[styles.commentCancelBtn, { borderColor: colors.border }]}
                    onPress={() => { setShowCommentForm(false); setCommentText(""); setCommentRating(5); }}
                  >
                    <Text style={[styles.commentCancelText, { color: colors.mutedForeground }]}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.commentSubmitBtn, { backgroundColor: colors.gold }]}
                    onPress={() => {
                      if (!commentText.trim()) return;
                      addComment(event.id, commentText.trim(), commentRating);
                      setShowCommentForm(false);
                      setCommentText("");
                      setCommentRating(5);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Text style={styles.commentSubmitText}>Publier</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {(!event.comments || event.comments.length === 0) && !showCommentForm && (
              <View style={[styles.noComments, { backgroundColor: colors.card }]}>
                <Feather name="message-square" size={22} color={colors.mutedForeground} />
                <Text style={[styles.noCommentsText, { color: colors.mutedForeground }]}>Aucun commentaire pour l'instant</Text>
              </View>
            )}

            {event.comments?.map(c => (
              <View key={c.id} style={[styles.commentCard, { backgroundColor: colors.card }]}>
                <View style={styles.commentHeader}>
                  <View style={[styles.commentAvatar, { backgroundColor: colors.gold + "30" }]}>
                    <Text style={[styles.commentAvatarText, { color: colors.gold }]}>{c.userName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.commentName, { color: colors.foreground }]}>{c.userName}</Text>
                    <Text style={[styles.commentDate, { color: colors.mutedForeground }]}>
                      {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </Text>
                  </View>
                  <View style={styles.commentStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Feather key={s} name="star" size={11} color={s <= c.rating ? colors.gold : colors.border} />
                    ))}
                  </View>
                </View>
                <Text style={[styles.commentText, { color: colors.foreground }]}>{c.text}</Text>
              </View>
            ))}
          </View>

          {booking && (
            <View style={styles.ticketSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Votre billet</Text>
              <View style={[styles.ticketCard, { backgroundColor: colors.card }]}>
                <QRCodeDisplay value={booking.qrCode} size={160} />
                <Text style={[styles.ticketOrder, { color: colors.mutedForeground }]}>Inscription #{booking.registrationOrder}{booking.role ? ` · ${booking.role}` : ""}</Text>
                {booking.role && (
                  <View style={[styles.roleBadge, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}>
                    <Text style={[styles.roleText, { color: colors.gold }]}>{booking.role}</Text>
                  </View>
                )}
                <Pressable
                  style={[styles.nfcLinkBtn, booking.nfcLinked
                    ? { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }
                    : { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]}
                  onPress={booking.nfcLinked ? undefined : () => setNfcVisible(true)}
                >
                  <Feather name={booking.nfcLinked ? "check-circle" : "credit-card"} size={15} color={booking.nfcLinked ? colors.success : colors.gold} />
                  <Text style={[styles.nfcLinkText, { color: booking.nfcLinked ? colors.success : colors.gold }]}>
                    {booking.nfcLinked ? "Carte NFC enregistrée ✓" : "Enregistrer sur ma carte NFC"}
                  </Text>
                </Pressable>
                <Pressable style={[styles.cancelBtn, { borderColor: colors.destructive + "40" }]} onPress={handleCancel}>
                  <Feather name="x-circle" size={14} color={colors.destructive} />
                  <Text style={[styles.cancelBtnText, { color: colors.destructive }]}>Annuler ma participation</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {!booking && (
        <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: bottomPad + 12, borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>Entrée</Text>
            <Text style={[styles.footerPrice, { color: colors.foreground }]}>{event.price === 0 ? "Gratuit" : `${event.price} $`}</Text>
          </View>
          <Pressable
            style={[styles.bookBtn, { backgroundColor: !accessible ? colors.muted : isFull ? colors.muted : colors.gold, opacity: loading ? 0.7 : 1 }]}
            onPress={handleBook}
            disabled={isFull || loading}
          >
            <Text style={[styles.bookBtnText, { color: !accessible || isFull ? colors.mutedForeground : "#0D0D0D" }]}>
              {loading ? "Réservation..." : !accessible ? "Carte Prime requise" : isFull ? "Complet" : "Réserver"}
            </Text>
          </Pressable>
        </View>
      )}

      <Modal visible={bookingModal} transparent animationType="slide" onRequestClose={() => setBookingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.roleSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>Réserver ma place</Text>
            <Text style={[styles.roleSub, { color: colors.mutedForeground }]}>{event.title}</Text>

            {/* Ticket type */}
            <View style={styles.bookingSection}>
              <Text style={[styles.bookingLabel, { color: colors.mutedForeground }]}>Type de billet</Text>
              <View style={[styles.ticketTypeBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="tag" size={14} color={colors.gold} />
                <Text style={[styles.ticketTypeText, { color: colors.foreground }]}>
                  {event.price === 0 ? "Entrée gratuite" : `Billet standard — ${event.price} $ CAD`}
                </Text>
              </View>
            </View>

            {/* Quantity */}
            <View style={styles.bookingSection}>
              <Text style={[styles.bookingLabel, { color: colors.mutedForeground }]}>Quantité de billets</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={[styles.qtyBtn, { backgroundColor: bookingQty <= 1 ? colors.muted : colors.gold + "20", borderColor: bookingQty <= 1 ? colors.border : colors.gold + "40" }]}
                  onPress={() => setBookingQty(q => Math.max(1, q - 1))}
                >
                  <Feather name="minus" size={16} color={bookingQty <= 1 ? colors.mutedForeground : colors.gold} />
                </Pressable>
                <Text style={[styles.qtyNum, { color: colors.foreground }]}>{bookingQty}</Text>
                <Pressable
                  style={[styles.qtyBtn, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "40" }]}
                  onPress={() => setBookingQty(q => Math.min(10, q + 1))}
                >
                  <Feather name="plus" size={16} color={colors.gold} />
                </Pressable>
              </View>
            </View>

            {/* Participant name */}
            <View style={styles.bookingSection}>
              <Text style={[styles.bookingLabel, { color: colors.mutedForeground }]}>Nom du participant</Text>
              <View style={[styles.nameInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="user" size={14} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.nameInputText, { color: colors.foreground }]}
                  value={participantName}
                  onChangeText={setParticipantName}
                  placeholder="Votre nom complet"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            {/* Profile / role */}
            <View style={styles.bookingSection}>
              <Text style={[styles.bookingLabel, { color: colors.mutedForeground }]}>Profil</Text>
              <View style={styles.rolesWrap}>
                {ROLES.map(r => (
                  <Pressable
                    key={r}
                    onPress={() => setBookingRole(r)}
                    style={[styles.roleChip, bookingRole === r
                      ? { backgroundColor: colors.gold, borderColor: colors.gold }
                      : { backgroundColor: colors.muted, borderColor: colors.border }]}
                  >
                    <Text style={[styles.roleChipText, { color: bookingRole === r ? "#0D0D0D" : colors.mutedForeground }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Payment method */}
            <View style={styles.bookingSection}>
              <Text style={[styles.bookingLabel, { color: colors.mutedForeground }]}>Mode de paiement</Text>
              <Pressable
                style={[styles.payMethodRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => router.push("/payment")}
              >
                <Feather name="credit-card" size={16} color={colors.gold} />
                <Text style={[styles.payMethodText, { color: colors.foreground }]}>
                  {user?.savedPaymentMethods?.length ? `Carte ···· ${user.savedPaymentMethods[0].last4}` : "Ajouter un mode de paiement"}
                </Text>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Total */}
            <View style={[styles.totalRow, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "30" }]}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
              <Text style={[styles.totalAmount, { color: colors.gold }]}>
                {event.price === 0 ? "Gratuit" : `${(event.price * bookingQty).toFixed(2)} $ CAD`}
              </Text>
            </View>

            <Pressable style={[styles.confirmBtn, { backgroundColor: colors.gold }]} onPress={handleConfirmBooking}>
              <Text style={styles.confirmBtnText}>Confirmer la réservation</Text>
            </Pressable>
            <Pressable onPress={() => setBookingModal(false)} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={msgModal} transparent animationType="slide" onRequestClose={() => setMsgModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.roleSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>Contacter l'organisateur</Text>
            <Text style={[styles.roleSub, { color: colors.mutedForeground }]}>{event.organizerName}</Text>
            <View style={[styles.msgInputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text
                style={[styles.msgInput, { color: msgText ? colors.foreground : colors.mutedForeground }]}
                numberOfLines={4}
                onPress={() => {}}
              >
                {msgText || "Tapez votre message..."}
              </Text>
            </View>
            <Pressable style={[styles.msgSendBtn, { backgroundColor: colors.gold }]} onPress={handleSendMsg}>
              <Text style={styles.msgSendText}>Envoyer</Text>
            </Pressable>
            <Pressable onPress={() => setMsgModal(false)} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <NFCScanner visible={nfcVisible} onClose={() => setNfcVisible(false)} onNFCDetected={handleNFCLink} title="Enregistrer sur carte NFC" />
      <SurveyModal visible={surveyVisible} eventTitle={event.title} onSubmit={async () => { setSurveyVisible(false); }} onClose={() => setSurveyVisible(false)} />
    </View>
  );
}

function InfoRow({ icon, label, value, colors, highlight }: { icon: any; label: string; value: string; colors: any; highlight?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <View style={[infoStyles.iconWrap, { backgroundColor: highlight ? colors.gold + "20" : colors.muted }]}>
        <Feather name={icon} size={13} color={highlight ? colors.gold : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: highlight ? colors.gold : colors.foreground, fontFamily: highlight ? "Inter_700Bold" : "Inter_500Medium" }]}>{label}</Text>
        {!!value && <Text style={[infoStyles.value, { color: colors.mutedForeground }]}>{value}</Text>}
      </View>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 1 },
  label: { fontSize: 14 },
  value: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { height: 320, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200 },
  backBtnWrap: { position: "absolute", left: 16 },
  backBtnInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  manageBtn: { position: "absolute", right: 16 },
  heroBadges: { position: "absolute", bottom: 20, left: 20, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  catPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  eventTitle: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 33 },
  orgRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orgAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  orgName: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  msgOrgBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  msgOrgText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  infoCard: { borderRadius: 16, overflow: "hidden" },
  infoDiv: { height: 1, marginHorizontal: 14 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  nfcInfoCard: { borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  nfcInfoTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  nfcInfoSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  ticketSection: {},
  ticketCard: { borderRadius: 16, padding: 20, alignItems: "center", gap: 12 },
  ticketOrder: { fontSize: 12, fontFamily: "Inter_400Regular" },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  nfcLinkBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, width: "100%", justifyContent: "center" },
  nfcLinkText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, width: "100%", justifyContent: "center" },
  cancelBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  footerLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  footerPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  bookBtn: { flex: 1, marginLeft: 20, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  bookBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  roleSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, backgroundColor: "#444", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  roleTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 6, textAlign: "center" },
  roleSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  roleOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1 },
  roleOptionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  skipBtn: { paddingVertical: 16, alignItems: "center" },
  skipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  msgInputWrap: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 80, marginBottom: 8 },
  msgInput: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  msgSendBtn: { width: "100%", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  msgSendText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
  commentsTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addCommentBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  addCommentText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  commentForm: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 10, gap: 10 },
  ratingLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  starsRow: { flexDirection: "row", gap: 6 },
  commentInput: { borderRadius: 10, padding: 10, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 70 },
  commentFormBtns: { flexDirection: "row", gap: 10 },
  commentCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  commentCancelText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  commentSubmitBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  commentSubmitText: { color: "#0D0D0D", fontSize: 13, fontFamily: "Inter_700Bold" },
  noComments: { borderRadius: 14, padding: 20, alignItems: "center", gap: 8, marginTop: 8 },
  noCommentsText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  commentCard: { borderRadius: 14, padding: 14, marginTop: 8, gap: 8 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  commentAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  commentName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  commentDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  commentStars: { flexDirection: "row", gap: 2 },
  commentText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  bookingSection: { marginBottom: 14 },
  bookingLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  ticketTypeBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 13 },
  ticketTypeText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 },
  qtyBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 24, fontFamily: "Inter_700Bold", minWidth: 40, textAlign: "center" },
  nameInput: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  nameInputText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  rolesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  roleChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  payMethodRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  payMethodText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 8 },
  totalLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  confirmBtn: { width: "100%", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  confirmBtnText: { color: "#0D0D0D", fontSize: 15, fontFamily: "Inter_700Bold" },
});
