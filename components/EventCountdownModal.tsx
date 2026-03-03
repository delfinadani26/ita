import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";

interface EventCountdownModalProps {
  visible: boolean;
  onClose: () => void;
  onQRPress?: () => void;
  onCameraPress?: () => void;
  onCheckInPress?: () => void;
  eventStartDate?: Date;
  eventEndDate?: Date;
}

function formatTimeRemaining(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export default function EventCountdownModal({
  visible,
  onClose,
  onQRPress,
  onCameraPress,
  onCheckInPress,
  eventStartDate = new Date("2026-03-01"),
  eventEndDate = new Date("2026-04-30"),
}: EventCountdownModalProps) {
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!visible) return;

    const updateCountdown = () => {
      const now = new Date();
      const timeRemaining = eventStartDate.getTime() - now.getTime();

      if (timeRemaining > 0) {
        setCountdown(formatTimeRemaining(timeRemaining));
      } else {
        // Event has started, show time until end
        const timeUntilEnd = eventEndDate.getTime() - now.getTime();
        if (timeUntilEnd > 0) {
          setCountdown(formatTimeRemaining(timeUntilEnd));
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [visible, eventStartDate, eventEndDate]);

  const now = new Date();
  const hasStarted = now >= eventStartDate;
  const isOver = now > eventEndDate;

  if (isOver) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#1BA098", "#0D7A73"]}
          style={styles.modalContainer}
        >
          {/* Close Button */}
          <Pressable 
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]} 
            onPress={onClose}
          >
            <Ionicons name="close-circle" size={24} color={Colors.white} />
          </Pressable>

          {/* Title */}
          <Text style={styles.mainTitle}>
            {hasStarted ? "Congresso em Andamento!" : "Faça seu Check-in"}
          </Text>

          {/* Countdown Timer */}
          <View style={styles.countdownContainer}>
            <CountdownUnit value={countdown.days} label="D" />
            <Text style={styles.separator}>:</Text>
            <CountdownUnit value={countdown.hours} label="H" />
            <Text style={styles.separator}>:</Text>
            <CountdownUnit value={countdown.minutes} label="M" />
            <Text style={styles.separator}>:</Text>
            <CountdownUnit value={countdown.seconds} label="S" />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.description}>
            Faça seu check-in ao chegar no congresso
          </Text>

          {/* Two Images Side by Side */}
          <View style={styles.imagesContainer}>
            <Pressable 
              style={({ pressed }) => [styles.imageBox, pressed && styles.imageBoxPressed]} 
              onPress={onQRPress}
            >
              <Ionicons name="qr-code" size={42} color={Colors.white} />
              <Text style={styles.imageLabel}>Seu QR</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [styles.imageBox, pressed && styles.imageBoxPressed]} 
              onPress={onCameraPress}
            >
              <Ionicons name="camera" size={42} color={Colors.white} />
              <Text style={styles.imageLabel}>Scanner</Text>
            </Pressable>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureRow icon="checkmark-circle" text="Mostrar código QR" />
            <FeatureRow icon="checkmark-circle" text="Confirmar presença" />
            <FeatureRow icon="checkmark-circle" text="Certificado" />
          </View>

          {/* CTA Button */}
          <Pressable 
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]} 
            onPress={onCheckInPress}
          >
            <Text style={styles.ctaButtonText}>Fazer Check-in Agora!</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countdownUnit}>
      <Text style={styles.countdownValue}>{String(value).padStart(2, "0")}</Text>
      <Text style={styles.countdownLabel}>{label}</Text>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon as any} size={16} color={Colors.white} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  mainTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 14,
  },
  offerBadge: {
    alignItems: "center",
    marginBottom: 12,
    display: "none",
  },
  badgeText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "rgba(255, 255, 255, 0.9)",
  },
  badgeOffer: {
    fontSize: 48,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
    lineHeight: 50,
  },
  countdownContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    gap: 6,
  },
  countdownUnit: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 46,
  },
  countdownValue: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  countdownLabel: {
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 1,
  },
  separator: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: "100%",
    marginVertical: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    width: "100%",
  },
  imageBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 6,
  },
  imageBoxPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    opacity: 0.8,
  },
  imageLabel: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
    textAlign: "center",
  },
  featuresContainer: {
    width: "100%",
    gap: 7,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.white,
    flex: 1,
  },
  ctaButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  ctaButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    opacity: 0.9,
  },
  ctaButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: "#1BA098",
  },
});
