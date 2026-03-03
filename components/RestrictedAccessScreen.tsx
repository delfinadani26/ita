import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";

interface RestrictedAccessProps {
  title: string;
  message: string;
  icon?: string;
}

export function RestrictedAccessScreen({
  title = "Acesso Restrito",
  message = "Sua inscrição está aguardando aprovação.",
  icon = "lock-closed"
}: RestrictedAccessProps) {
  return (
    <>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={72} color={Colors.accent} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={Colors.info} />
            <Text style={styles.infoText}>
              Assim que sua inscrição for aprovada, você terá acesso a todas as funcionalidades.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(52, 152, 219, 0.15)",
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.white,
    lineHeight: 20,
  },
});
