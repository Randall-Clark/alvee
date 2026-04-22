import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { DEFAULT_DIAL, DIAL_CODES, type DialCode } from "@/utils/dialCodes";

interface Props {
  dialCode: DialCode;
  number: string;
  onDialChange: (d: DialCode) => void;
  onNumberChange: (n: string) => void;
}

export function PhoneInput({ dialCode, number, onDialChange, onNumberChange }: Props) {
  const colors = useColors();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return DIAL_CODES;
    return DIAL_CODES.filter(
      d => d.name.toLowerCase().includes(q) || d.dial.includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <>
      <View style={styles.row}>
        <Pressable
          style={[styles.dialBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={() => { setSearch(""); setModalOpen(true); }}
        >
          <Text style={styles.flag}>{dialCode.flag}</Text>
          <Text style={[styles.dial, { color: colors.foreground }]}>{dialCode.dial}</Text>
          <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
        </Pressable>

        <TextInput
          style={[styles.numInput, { color: colors.foreground, backgroundColor: colors.muted }]}
          placeholder="6 12 34 56 78"
          placeholderTextColor={colors.mutedForeground}
          value={number}
          onChangeText={onNumberChange}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
      </View>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Indicatif pays</Text>
            <Pressable onPress={() => setModalOpen(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Rechercher un pays…"
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x-circle" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryRow,
                  { borderBottomColor: colors.border },
                  item.code === dialCode.code && { backgroundColor: colors.gold + "15" },
                ]}
                onPress={() => { onDialChange(item); setModalOpen(false); }}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={[styles.countryName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.countryDial, { color: colors.mutedForeground }]}>{item.dial}</Text>
                {item.code === dialCode.code && <Feather name="check" size={14} color={colors.gold} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

export { DEFAULT_DIAL };

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  dialBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1,
  },
  flag: { fontSize: 18 },
  dial: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  numInput: {
    flex: 1, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 11,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    margin: 16, padding: 12, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  countryRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1,
  },
  countryFlag: { fontSize: 20, width: 28 },
  countryName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  countryDial: { fontSize: 13, fontFamily: "Inter_400Regular", minWidth: 44, textAlign: "right" },
});
