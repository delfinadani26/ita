import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform, Image } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";

export default function SplashRedirect() {
  const { user, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 2500, useNativeDriver: false }),
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
      }, 2800);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require("../assets/images/favicon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.universityName}>Universidade Rainha N'Jinga Mbande</Text>
        <Text style={styles.subtitle}>Congresso de Alimentação 2026</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Gestão de Eventos Académicos</Text>
      </Animated.View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>A carregar...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: Platform.OS === "web" ? 67 : 0,
    paddingBottom: Platform.OS === "web" ? 34 : 0,
  },
  content: {
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 8,
  },
  universityName: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.accent,
    textAlign: "center",
  },
  divider: {
    width: 50,
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    marginVertical: 4,
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  progressContainer: {
    width: "100%",
    paddingBottom: 60,
    alignItems: "center",
    gap: 10,
  },
  progressBg: {
    width: "80%",
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textLight,
  },
});
