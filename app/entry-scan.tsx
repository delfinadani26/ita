import React, { useState } from "react";
import {
  View, Text, StyleSheet, Pressable, Platform, ActivityIndicator, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "react-native-qrcode-svg";

const ENTRY_QR_TOKEN = "CSA-ALIMENTAR-URNM-2026-ENTRADA";

const CATEGORY_LABELS: Record<string, string> = {
  docente: "Docente/Investigador",
  estudante: "Estudante",
  outro: "Outro",
  preletor: "Preletor (Autor)",
};

export default function EntryScanScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultModal, setResultModal] = useState<"welcome" | "pending" | "not_registered" | null>(null);
  const [mode, setMode] = useState<"camera" | "status">("status");

  const userType = user
    ? `${CATEGORY_LABELS[user.category] || user.category} (${user.affiliation === "urnm" ? "URNM" : "Externo"})`
    : "";

  const accessStatus = user?.payment_status === "paid" || user?.payment_status === "exempt"
    ? "welcome"
    : user?.payment_status === "approved"
    ? "pending"
    : "not_registered";

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setLoading(false);

    if (data === ENTRY_QR_TOKEN) {
      setResultModal(accessStatus);
    } else {
      setResultModal(accessStatus);
    }
  };

  const closeModal = () => {
    setResultModal(null);
    setScanned(false);
    setMode("status");
  };

  if (!user) return null;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Acesso ao Congresso</Text>
        <View style={{ width: 36 }} />
      </View>

      {mode === "status" && (
        <View style={styles.statusContent}>
          {/* QR CODE DISPLAY - Mostrar código QR do participante */}
          <View style={styles.qrDisplayBox}>
            <Text style={styles.qrDisplayTitle}>Seu Código QR</Text>
            <Text style={styles.qrDisplaySub}>Apresente este código na entrada</Text>
            <View style={styles.qrCodeContainer}>
              {user?.qr_code ? (
                <QRCode
                  value={JSON.stringify({
                    id: user.qr_code,
                    nome: user.full_name,
                    categoria: CATEGORY_LABELS[user.category] || user.category,
                    tipo: userType,
                    instituicao: user.institution || (user.affiliation === "urnm" ? "Universidade Rainha N'Jinga Mbande" : "Instituição Externa"),
                    congresso: "CSA URNM 2026",
                  })}
                  size={200}
                  color={Colors.primary}
                />
              ) : (
                <Ionicons name="qr-code-outline" size={100} color={Colors.mediumGray} />
              )}
            </View>
            <View style={styles.qrInfoBox}>
              <Text style={styles.qrInfoName}>{user.full_name}</Text>
              <Text style={styles.qrInfoType}>{userType}</Text>
              <Text style={styles.qrInfoInstitution}>
                {user.institution || (user.affiliation === "urnm" ? "Universidade Rainha N'Jinga Mbande" : "Instituição Externa")}
              </Text>
            </View>
          </View>

          {/* STATUS VERIFICATION */}
          {accessStatus === "welcome" && (
            <LinearGradient colors={[Colors.success, Colors.success + "CC"]} style={styles.statusCard}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.white} />
              <Text style={styles.statusTitle}>Acesso Confirmado</Text>
              <Text style={styles.statusConfirm}>Seu acesso ao congresso está confirmado ✓</Text>
            </LinearGradient>
          )}

          {accessStatus === "pending" && (
            <LinearGradient colors={[Colors.info, Colors.info + "CC"]} style={styles.statusCard}>
              <Ionicons name="card-outline" size={56} color={Colors.white} />
              <Text style={styles.statusTitle}>Aprovado</Text>
              <Text style={styles.statusPending}>
                Aguardando pagamento para confirmar acesso ao congresso
              </Text>
            </LinearGradient>
          )}

          {accessStatus === "not_registered" && (
            <LinearGradient colors={[Colors.warning, Colors.warning + "CC"]} style={styles.statusCard}>
              <Ionicons name="hourglass-outline" size={56} color={Colors.white} />
              <Text style={styles.statusTitle}>Aguardando Aprovação</Text>
              <Text style={styles.statusPending}>
                A sua inscrição está a ser verificada. Por favor contacte a organização.
              </Text>
            </LinearGradient>
          )}

          <Pressable
            style={({ pressed }) => [styles.scanEntranceBtn, pressed && { opacity: 0.85 }]}
            onPress={() => setMode("camera")}
          >
            <Ionicons name="scan-outline" size={20} color={Colors.white} />
            <Text style={styles.scanEntranceBtnText}>Escanear QR da Entrada</Text>
          </Pressable>

          <Text style={styles.scanHint}>
            Aponte a câmara para o código QR exibido na entrada do congresso para verificar o seu acesso
          </Text>
        </View>
      )}

      {mode === "camera" && (
        <>
          {!permission?.granted ? (
            <View style={styles.permBox}>
              <Ionicons name="camera-outline" size={56} color={Colors.mediumGray} />
              <Text style={styles.permTitle}>Permissão de Câmara</Text>
              <Text style={styles.permText}>Necessário para verificar o código QR da entrada</Text>
              <Pressable style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Permitir Câmara</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => setMode("status")}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              <LinearGradient
                colors={["rgba(10,32,64,0.7)", "transparent"]}
                style={[styles.cameraTopOverlay, { paddingTop: 20 }]}
              >
                <Pressable onPress={() => setMode("status")} style={styles.closeCameraBtn}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </Pressable>
                <Text style={styles.cameraTitle}>Escanear Entrada</Text>
                <View style={{ width: 44 }} />
              </LinearGradient>
              <View style={styles.cameraOverlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
              </View>
              <LinearGradient
                colors={["transparent", "rgba(10,32,64,0.8)"]}
                style={[styles.cameraBottomOverlay, { paddingBottom: bottomPad + 20 }]}
              >
                <Text style={styles.cameraInstruction}>
                  Aponte para o QR de entrada do congresso
                </Text>
              </LinearGradient>
            </View>
          )}
        </>
      )}

      <Modal visible={!!resultModal} animationType="fade" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {resultModal === "welcome" && (
              <>
                <View style={[styles.resultIcon, { backgroundColor: Colors.success + "20" }]}>
                  <Ionicons name="checkmark-circle-outline" size={56} color={Colors.success} />
                </View>
                <Text style={styles.modalWelcome}>Bem-vindo(a) ao</Text>
                <Text style={styles.modalCongress}>Congresso sobre Sistemas{"\n"}Alimentares 2026</Text>
                <Text style={styles.modalName}>{user.full_name}</Text>
                <Text style={styles.modalType}>{userType}</Text>
                <Pressable style={[styles.modalBtn, { backgroundColor: Colors.success }]} onPress={closeModal}>
                  <Text style={styles.modalBtnText}>Obrigado!</Text>
                </Pressable>
              </>
            )}
            {(resultModal === "pending" || resultModal === "not_registered") && (
              <>
                <View style={[styles.resultIcon, { backgroundColor: Colors.warning + "20" }]}>
                  <Ionicons name="warning-outline" size={56} color={Colors.warning} />
                </View>
                <Text style={styles.modalWarning}>
                  {resultModal === "pending" ? "Pagamento Pendente" : "Inscrição Não Confirmada"}
                </Text>
                <Text style={styles.modalName}>{user.full_name}</Text>
                <Text style={styles.modalWarningText}>
                  {resultModal === "pending"
                    ? "A sua apresentação foi aprovada. Efectue o pagamento para confirmar o acesso."
                    : "A sua inscrição ainda não foi confirmada. Por favor contacte a organização do congresso."}
                </Text>
                <Pressable style={[styles.modalBtn, { backgroundColor: Colors.warning }]} onPress={closeModal}>
                  <Text style={styles.modalBtnText}>Fechar</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.text },
  statusContent: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  
  // QR Display Styles
  qrDisplayBox: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  qrDisplayTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.text },
  qrDisplaySub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  qrCodeContainer: {
    backgroundColor: Colors.offWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.primary + "30",
  },
  qrInfoBox: {
    width: "100%",
    backgroundColor: Colors.lightGray,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  qrInfoName: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  qrInfoType: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  qrInfoInstitution: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight, textAlign: "center" },
  
  statusCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 8,
    minHeight: 160,
    justifyContent: "center",
  },
  statusTitle: { fontSize: 20, fontFamily: "Poppins_700Bold", color: Colors.white },
  statusName: { fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.white, textAlign: "center" },
  statusType: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.85)", textAlign: "center" },
  statusInstitution: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.7)", textAlign: "center" },
  statusDivider: { width: 60, height: 1, backgroundColor: "rgba(255,255,255,0.3)", marginVertical: 4 },
  statusCongress: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "rgba(255,255,255,0.9)", textAlign: "center" },
  statusConfirm: { fontSize: 14, fontFamily: "Poppins_700Bold", color: Colors.white },
  statusPending: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 18 },
  scanEntranceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  scanEntranceBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  scanHint: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textLight, textAlign: "center", lineHeight: 18 },
  permBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 32 },
  permTitle: { fontSize: 20, fontFamily: "Poppins_700Bold", color: Colors.text },
  permText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center" },
  permBtn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  permBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  cancelBtn: { paddingVertical: 12 },
  cancelBtnText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  cameraContainer: { flex: 1, position: "relative" },
  cameraTopOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  closeCameraBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  cameraTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.white },
  cameraOverlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  scanFrame: { width: 250, height: 250, position: "relative" },
  corner: { position: "absolute", width: 40, height: 40, borderColor: Colors.accent },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  cameraBottomOverlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    alignItems: "center",
    paddingTop: 32, paddingHorizontal: 32,
    zIndex: 10,
  },
  cameraInstruction: {
    fontSize: 14, fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.85)", textAlign: "center",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  resultIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  modalWelcome: { fontSize: 16, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  modalCongress: { fontSize: 20, fontFamily: "Poppins_700Bold", color: Colors.text, textAlign: "center" },
  modalName: { fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.text, textAlign: "center" },
  modalType: { fontSize: 13, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  modalWarning: { fontSize: 20, fontFamily: "Poppins_700Bold", color: Colors.text, textAlign: "center" },
  modalWarningText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  modalBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 8 },
  modalBtnText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.white },
});
