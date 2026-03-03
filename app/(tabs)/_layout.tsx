import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";

function NativeTabLayout({ isAdmin, isAvaliador }: { isAdmin: boolean; isAvaliador: boolean }) {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Início</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="program">
        <Icon sf={{ default: "calendar", selected: "calendar.badge" }} />
        <Label>Programa</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="submissions">
        <Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} />
        <Label>Submissões</Label>
      </NativeTabs.Trigger>
      {(isAdmin || isAvaliador) && (
        <NativeTabs.Trigger name="admin">
          <Icon sf={{ default: "person.badge.shield.checkmark", selected: "person.badge.shield.checkmark.fill" }} />
          <Label>Gestão</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Mensagens</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout({ isAdmin, isAvaliador }: { isAdmin: boolean; isAvaliador: boolean }) {
  const isDark = useColorScheme() === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.darkGray,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isWeb ? Colors.white : Colors.white,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.white }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          title: "Programa",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={24} />
            ) : (
              <Ionicons name="calendar-outline" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="submissions"
        options={{
          title: "Submissões",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="doc.text" tintColor={color} size={24} />
            ) : (
              <Ionicons name="document-text-outline" size={24} color={color} />
            ),
        }}
      />
      {(isAdmin || isAvaliador) ? (
        <Tabs.Screen
          name="admin"
          options={{
            title: "Gestão",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="person.badge.shield.checkmark" tintColor={color} size={24} />
              ) : (
                <Ionicons name="shield-checkmark-outline" size={24} color={color} />
              ),
          }}
        />
      ) : (
        <Tabs.Screen name="admin" options={{ href: null }} />
      )}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Mensagens",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="message" tintColor={color} size={24} />
            ) : (
              <Ionicons name="chatbubble-outline" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.circle" tintColor={color} size={24} />
            ) : (
              <Ionicons name="person-circle-outline" size={24} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isAvaliador = user?.role === "avaliador";

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout isAdmin={isAdmin} isAvaliador={isAvaliador} />;
  }
  return <ClassicTabLayout isAdmin={isAdmin} isAvaliador={isAvaliador} />;
}
