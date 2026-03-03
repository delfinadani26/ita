import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable, Platform,
  ActivityIndicator, Modal, ScrollView, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";

const ENTRY_QR_TOKEN = "CSA-ALIMENTAR-URNM-2026-ENTRADA";

const CATEGORY_LABELS: Record<string, string> = {
  docente: "Docente/Investigador",
  estudante: "Estudante",
  outro: "Outro",
  preletor: "Preletor",
};

function buildQrValue(u: any): string {
  return JSON.stringify({
    id: u.qr_code,
    nome: u.full_name,
    categoria: CATEGORY_LABELS[u.category] || u.category,
    tipo: `${CATEGORY_LABELS[u.category] || u.category} (${u.affiliation === "urnm" ? "URNM" : "Externo"})`,
    instituicao: u.institution || (u.affiliation === "urnm" ? "Universidade Rainha N'Jinga Mbande" : "Instituição Externa"),
    congresso: "CSA URNM 2026",
  });
}

export default function AdminParticipantsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [blinkOpacity] = useState(new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkOpacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(blinkOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [blinkOpacity]);

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin",
  });

  const participants = users.filter(u => u.role === "participant");
  
  // Contar participantes por categoria
  const statsByCategory = {
    docente: participants.filter(p => p.category === "docente").length,
    estudante: participants.filter(p => p.category === "estudante").length,
    preletor: participants.filter(p => p.category === "preletor").length,
    outro: participants.filter(p => p.category === "outro").length,
  };

  if (user?.role !== "admin") {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPad }]}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.mediumGray} />
        <Text style={styles.noAccessText}>Acesso restrito ao Super Administrador</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Lista de Participantes</Text>
          <Text style={styles.headerSub}>{participants.length} participante(s)</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : participants.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={56} color={Colors.mediumGray} />
          <Text style={styles.emptyText}>Nenhum participante registado ainda.</Text>
        </View>
      ) : (
        <>
          {/* Stat Cards - Contagem por Categoria */}
          <View style={styles.statsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScrollContent}
              scrollEventThrottle={16}
            >
              <StatCard
                title="Docente/Investigador"
                count={statsByCategory.docente}
                color="#FF6B6B"
                icon="person"
              />
              <StatCard
                title="Estudante"
                count={statsByCategory.estudante}
                color="#4ECDC4"
                icon="school"
              />
              <StatCard
                title="Preletor"
                count={statsByCategory.preletor}
                color="#FFE66D"
                icon="mic"
              />
              <StatCard
                title="Outro"
                count={statsByCategory.outro}
                color="#95E1D3"
                icon="help-circle"
              />
            </ScrollView>
            
            {/* Blinking scroll indicator */}
            <Animated.View style={[styles.scrollIndicator, { opacity: blinkOpacity }]}>
              <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
            </Animated.View>
          </View>

          <FlatList
            data={participants}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 80 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Pressable
                style={({ pressed }) => [styles.participantCard, pressed && { opacity: 0.85 }]}
                onPress={() => setSelectedUser(item)}
              >
                <View style={styles.positionBadge}>
                  <Text style={styles.positionNumber}>{index + 1}</Text>
                </View>
                <View style={styles.cardMiddle}>
                  <Text style={styles.participantName} numberOfLines={1}>{item.full_name}</Text>
                  <Text style={styles.participantCat}>
                    {CATEGORY_LABELS[item.category]} · {item.affiliation === "urnm" ? "URNM" : "Externo"}
                  </Text>
                  <Text style={styles.participantInstitution} numberOfLines={1}>
                    {item.institution || "—"}
                  </Text>
                </View>
                <View style={styles.qrThumb}>
                  {item.qr_code ? (
                    <QRCode
                      value={buildQrValue(item)}
                      size={48}
                      color={Colors.primary}
                    />
                  ) : (
                    <Ionicons name="qr-code-outline" size={32} color={Colors.mediumGray} />
                  )}
                </View>
              </Pressable>
            )}
          />
        </>
      )}

      <Modal
        visible={!!selectedUser}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Código QR</Text>
              <Pressable onPress={() => setSelectedUser(null)}>
                <Ionicons name="close-circle" size={28} color={Colors.darkGray} />
              </Pressable>
            </View>
            {selectedUser && (
              <>
                <View style={styles.qrPositionBadge}>
                  <Text style={styles.qrPositionText}>
                    #{(participants.findIndex(p => p.id === selectedUser.id) + 1).toString().padStart(3, "0")}
                  </Text>
                </View>
                <Text style={styles.modalName}>{selectedUser.full_name}</Text>
                <Text style={styles.modalCat}>
                  {CATEGORY_LABELS[selectedUser.category]} ({selectedUser.affiliation === "urnm" ? "URNM" : "Externo"})
                </Text>
                <Text style={styles.modalInstitution}>
                  {selectedUser.institution || "Instituição não especificada"}
                </Text>
                <View style={styles.qrBox}>
                  {selectedUser.qr_code ? (
                    <QRCode
                      value={buildQrValue(selectedUser)}
                      size={220}
                      color={Colors.primary}
                    />
                  ) : (
                    <Ionicons name="qr-code-outline" size={100} color={Colors.mediumGray} />
                  )}
                </View>
                <View style={styles.qrInfoBox}>
                  <QrInfoRow label="Nome" value={selectedUser.full_name} />
                  <QrInfoRow label="Categoria" value={CATEGORY_LABELS[selectedUser.category] || selectedUser.category} />
                  <QrInfoRow
                    label="Tipo"
                    value={`${CATEGORY_LABELS[selectedUser.category]} (${selectedUser.affiliation === "urnm" ? "URNM" : "Externo"})`}
                  />
                  <QrInfoRow
                    label="Instituição"
                    value={selectedUser.institution || (selectedUser.affiliation === "urnm" ? "Universidade Rainha N'Jinga Mbande" : "Externa")}
                  />
                </View>
                <Text style={styles.modalNote}>Apresente na entrada do congresso</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function QrInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.qrInfoRow}>
      <Text style={styles.qrInfoLabel}>{label}:</Text>
      <Text style={styles.qrInfoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function StatCard({ title, count, color, icon }: { title: string; count: number; color: string; icon: string }) {
  return (
    <LinearGradient
      colors={[color + "15", color + "08"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCard}
    >
      <View style={[styles.statCardIconContainer, { backgroundColor: color + "25" }]}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <View style={styles.statCardContent}>
        <Text style={styles.statCardTitle} numberOfLines={2}>{title}</Text>
        <Text style={[styles.statCardCount, { color }]}>{count}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  noAccessText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary, textAlign: "center" },
  backBtn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: Colors.lightGray },
  backBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBack: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.text },
  headerSub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  
  // Stat Cards Styles
  statsSection: {
    paddingTop: 12,
    paddingHorizontal: 0,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: 140,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#00000008",
    alignItems: "center",
    gap: 8,
    minHeight: 120,
    justifyContent: "center",
  },
  statCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardContent: {
    alignItems: "center",
    gap: 4,
  },
  statCardTitle: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
    textAlign: "center",
    height: 28,
  },
  statCardCount: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
  },
  scrollIndicator: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  
  list: { padding: 16, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center" },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  positionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  positionNumber: { fontSize: 14, fontFamily: "Poppins_700Bold", color: Colors.white },
  cardMiddle: { flex: 1, gap: 2 },
  participantName: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  participantCat: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  participantInstitution: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight },
  qrThumb: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    backgroundColor: Colors.offWhite,
    borderRadius: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.text },
  qrPositionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.primary + "15",
    borderRadius: 20,
  },
  qrPositionText: { fontSize: 14, fontFamily: "Poppins_700Bold", color: Colors.primary },
  modalName: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.text, textAlign: "center" },
  modalCat: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.accent },
  modalInstitution: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center" },
  qrBox: {
    padding: 20,
    backgroundColor: Colors.offWhite,
    borderRadius: 16,
    marginVertical: 8,
  },
  qrInfoBox: {
    width: "100%",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  qrInfoRow: { flexDirection: "row", gap: 8 },
  qrInfoLabel: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary, minWidth: 80 },
  qrInfoValue: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.text },
  modalNote: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textLight,
    paddingBottom: 16,
  },
});
