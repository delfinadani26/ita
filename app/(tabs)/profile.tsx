import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  ActivityIndicator, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useAccessControl } from "@/lib/useAccessControl";

const CATEGORY_LABELS: Record<string, string> = {
  docente: "Docente/Investigador",
  estudante: "Estudante",
  outro: "Outro",
  preletor: "Preletor (Autor)",
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: Colors.warning },
  approved: { label: "Aprovado — Aguarda Pagamento", color: Colors.info },
  paid: { label: "Pago", color: Colors.success },
  exempt: { label: "Isento", color: Colors.textSecondary },
};

function buildQrValue(user: any): string {
  if (!user?.qr_code) return "sem-qr";
  return JSON.stringify({
    id: user.qr_code,
    nome: user.full_name,
    categoria: CATEGORY_LABELS[user.category] || user.category,
    tipo: `${CATEGORY_LABELS[user.category] || user.category} (${user.affiliation === "urnm" ? "URNM" : "Externo"})`,
    instituicao: user.institution || (user.affiliation === "urnm" ? "Universidade Rainha N'Jinga Mbande" : "Instituição Externa"),
    congresso: "CSA URNM 2026",
  });
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={Colors.primary} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const access = useAccessControl(user);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [showQrModal, setShowQrModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.error("Logout error:", error);
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  if (!user) return null;

  const payStatus = PAYMENT_STATUS[user.payment_status] || PAYMENT_STATUS.pending;
  const qrValue = buildQrValue(user);
  const typeLabel = `${CATEGORY_LABELS[user.category] || user.category} (${user.affiliation === "urnm" ? "URNM" : "Externo"})`;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          style={styles.profileBanner}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user.full_name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={[styles.rolePill, {
            backgroundColor: user.role === "admin" ? Colors.danger :
              user.role === "avaliador" ? Colors.warning : Colors.accent,
          }]}>
            <Text style={styles.rolePillText}>
              {user.role === "admin" ? "Super Admin" : user.role === "avaliador" ? "Avaliador" : "Participante"}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.qrCard}>
          <View style={styles.qrLeft}>
            <Text style={styles.qrTitle}>Código QR</Text>
            <Text style={styles.qrSub}>Apresente na entrada do congresso</Text>
            <Text style={styles.qrType}>{typeLabel}</Text>
            {access.canViewQR ? (
              <Pressable
                style={({ pressed }) => [styles.qrBtn, pressed && { opacity: 0.8 }]}
                onPress={() => setShowQrModal(true)}
              >
                <Ionicons name="expand-outline" size={16} color={Colors.primary} />
                <Text style={styles.qrBtnText}>Ver completo</Text>
              </Pressable>
            ) : (
              <View style={styles.blockedQRBtn}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.danger} />
                <Text style={styles.blockedQRBtnText}>Bloqueado até aprovação</Text>
              </View>
            )}
          </View>
          <View style={styles.qrPreview}>
            {user.qr_code && access.canViewQR ? (
              <QRCode value={qrValue} size={80} color={Colors.primary} />
            ) : (
              <View style={[styles.qrPlaceholder, !access.canViewQR && { opacity: 0.4 }]}>
                <Ionicons 
                  name={access.canViewQR ? "qr-code-outline" : "lock-closed-outline"} 
                  size={40} 
                  color={Colors.mediumGray} 
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <Ionicons name="card-outline" size={20} color={payStatus.color} />
            <Text style={[styles.paymentStatus, { color: payStatus.color }]}>{payStatus.label}</Text>
          </View>
          {user.payment_amount && (
            <Text style={styles.paymentAmount}>
              Valor: <Text style={{ color: Colors.primary, fontFamily: "Poppins_700Bold" }}>
                {user.payment_amount.toLocaleString("pt-AO")} Kz
              </Text>
            </Text>
          )}
          {user.payment_status === "approved" && (
            <Text style={styles.paymentNote}>
              A sua apresentação foi aprovada. Effectue o pagamento para confirmar a sua participação.
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Informações Pessoais</Text>
          <InfoRow icon="person-outline" label="Nome Completo" value={user.full_name} />
          <InfoRow icon="mail-outline" label="Email" value={user.email} />
          <InfoRow icon="school-outline" label="Grau Académico" value={user.academic_degree || "—"} />
          <InfoRow icon="people-outline" label="Categoria" value={CATEGORY_LABELS[user.category] || user.category} />
          <InfoRow icon="ribbon-outline" label="Tipo" value={typeLabel} />
          <InfoRow icon="business-outline" label="Instituição de Origem" value={user.institution || (user.affiliation === "urnm" ? "Universidade Rainha N'Jinga Mbande" : "—")} />
          <InfoRow icon="calendar-outline" label="Registado em" value={new Date(user.created_at).toLocaleDateString("pt-PT")} />
          {user.is_checked_in && (
            <View style={styles.checkedInBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.checkedInText}>Check-in realizado</Text>
            </View>
          )}
        </View>

        {user.role === "admin" && (
          <Pressable
            style={({ pressed }) => [styles.adminBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push("/admin-participants")}
          >
            <Ionicons name="people-outline" size={20} color={Colors.white} />
            <Text style={styles.adminBtnText}>Lista de Participantes (QR)</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.white} />
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color={Colors.danger} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={styles.logoutText}>Terminar Sessão</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={showQrModal} animationType="slide" transparent onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Código QR de Credenciamento</Text>
              <Pressable onPress={() => setShowQrModal(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.darkGray} />
              </Pressable>
            </View>
            <Text style={styles.modalName}>{user.full_name}</Text>
            <Text style={styles.modalCategory}>{typeLabel}</Text>
            <Text style={styles.modalInstitution}>
              {user.institution || (user.affiliation === "urnm" ? "Universidade Rainha N'Jinga Mbande" : "Instituição Externa")}
            </Text>
            <View style={styles.qrLarge}>
              {user.qr_code ? (
                <QRCode value={qrValue} size={220} color={Colors.primary} />
              ) : (
                <Ionicons name="qr-code-outline" size={100} color={Colors.mediumGray} />
              )}
            </View>
            <View style={styles.qrDetailsBox}>
              <QrDetailRow label="Nome" value={user.full_name} />
              <QrDetailRow label="Categoria" value={CATEGORY_LABELS[user.category] || user.category} />
              <QrDetailRow label="Tipo" value={typeLabel} />
              <QrDetailRow
                label="Instituição"
                value={user.institution || (user.affiliation === "urnm" ? "Universidade Rainha N'Jinga Mbande" : "Instituição Externa")}
              />
            </View>
            <Text style={styles.qrNote}>Apresente este código na entrada do congresso</Text>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação Logout */}
      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent
        onRequestClose={() => !loggingOut && setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="alert-circle" size={48} color={Colors.danger} />
            </View>
            
            <Text style={styles.logoutModalTitle}>Terminar Sessão</Text>
            <Text style={styles.logoutModalMessage}>
              Tem a certeza que deseja terminar a sessão?
            </Text>

            <View style={styles.logoutModalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.logoutModalBtnCancel,
                  pressed && !loggingOut && { opacity: 0.7 }
                ]}
                onPress={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                <Text style={styles.logoutModalBtnCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.logoutModalBtnConfirm,
                  pressed && !loggingOut && { opacity: 0.85 }
                ]}
                onPress={confirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.logoutModalBtnConfirmText}>Terminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function QrDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.qrDetailRow}>
      <Text style={styles.qrDetailLabel}>{label}:</Text>
      <Text style={styles.qrDetailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { gap: 14, paddingHorizontal: 16, paddingTop: 8 },
  profileBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 26, fontFamily: "Poppins_700Bold", color: Colors.white },
  profileName: { fontSize: 20, fontFamily: "Poppins_700Bold", color: Colors.white },
  profileEmail: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.7)" },
  rolePill: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, marginTop: 4 },
  rolePillText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  qrCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  qrLeft: { gap: 4, flex: 1 },
  qrTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.text },
  qrSub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  qrType: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: Colors.accent },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.primary + "12",
    alignSelf: "flex-start",
  },
  qrBtnText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.primary },
  blockedQRBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.danger + "12",
    alignSelf: "flex-start",
  },
  blockedQRBtnText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.danger },
  qrPreview: { padding: 8, borderRadius: 10, backgroundColor: Colors.offWhite },
  qrPlaceholder: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  paymentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  paymentStatus: { fontSize: 15, fontFamily: "Poppins_600SemiBold" },
  paymentAmount: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  paymentNote: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
    padding: 10,
    backgroundColor: Colors.info + "10",
    borderRadius: 8,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  infoCardTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.text, marginBottom: 8 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: 12,
  },
  infoIcon: { width: 24 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight },
  infoValue: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.text, marginTop: 1 },
  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  checkedInText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.success },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  adminBtnText: { flex: 1, fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.danger + "40",
    backgroundColor: Colors.danger + "08",
    marginBottom: 8,
  },
  logoutText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.danger },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
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
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.text },
  modalName: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.text },
  modalCategory: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.accent },
  modalInstitution: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center" },
  qrLarge: {
    padding: 20,
    backgroundColor: Colors.offWhite,
    borderRadius: 16,
    marginVertical: 8,
  },
  qrDetailsBox: {
    width: "100%",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  qrDetailRow: { flexDirection: "row", gap: 8 },
  qrDetailLabel: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary, minWidth: 80 },
  qrDetailValue: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.text },
  qrNote: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    paddingBottom: 20,
  },
  // ✅ MODAL LOGOUT
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    width: "90%",
    maxWidth: 340,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.danger + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  logoutModalMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  logoutModalButtons: {
    width: "100%",
    gap: 10,
    marginTop: 12,
    flexDirection: "row",
  },
  logoutModalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutModalBtnCancelText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textSecondary,
  },
  logoutModalBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutModalBtnConfirmText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
});
