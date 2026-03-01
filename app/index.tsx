import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function SplashRedirect() {
  const { user, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => {
        if (user) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user]);

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="school" size={64} color={Colors.accent} />
        </View>
        <Text style={styles.title}>URNM</Text>
        <Text style={styles.subtitle}>CONGRESSO</Text>
        <Text style={styles.tagline}>2026</Text>
        <View style={styles.divider} />
        <Text style={styles.description}>
          Gestão de Eventos Académicos
        </Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim, paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>Universidade Rovuma do Norte de Moçambique</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  title: {
    fontSize: 48,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.accent,
    letterSpacing: 12,
  },
  tagline: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 4,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    marginVertical: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
