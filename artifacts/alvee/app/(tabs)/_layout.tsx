import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Explorer</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
        <Label>Créer</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bookings">
        <Icon sf={{ default: "ticket", selected: "ticket.fill" }} />
        <Label>Billets</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="manage">
        <Icon sf={{ default: "slider.horizontal.3", selected: "slider.horizontal.3" }} />
        <Label>Gérer</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "#555555",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#111111",
          borderTopWidth: 1,
          borderTopColor: "#222222",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111111" }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explorer",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Feather name="compass" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Créer",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="plus.circle" tintColor={color} size={22} /> : <Feather name="plus-circle" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Billets",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="ticket" tintColor={color} size={22} /> : <Feather name="bookmark" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: "Gérer",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="slider.horizontal.3" tintColor={color} size={22} /> : <Feather name="settings" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person" tintColor={color} size={22} /> : <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
