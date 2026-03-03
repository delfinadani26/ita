import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, Platform, Alert, Modal, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { apiRequest } from "@/lib/query-client";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const CATEGORY_LABELS: Record<string, string> = {
  docente: "Docente/Investigador",
  estudante: "Estudante",
  outro: "Outro",
  preletor: "Preletor",
};

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [resultModal, setResultModal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      let qrCode = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed?.id) qrCode = parsed.id;
      } catch {}

      const res = await apiRequest("POST", "/api/scanner/checkin", { qr_code: qrCode });
      const result = await res.json();
      setResultModal(result);
    } catch (err: any) {
      // ✅ TRATAMENTO DE ERROS ESPECÍFICOS
      let errorTitle = "Erro";
      let errorMsg = err.message || "Código QR não reconhecido";
      
      if (err.message?.includes("Participante ainda não foi aprovado")) {
        errorTitle = "⚠️ Aprovação Pendente";
        errorMsg = "Este participante ainda aguarda aprovação do administrador.";
      } else if (err.message?.includes("foi rejeitado")) {
        errorTitle = "❌ Inscrição Rejeitada";
        errorMsg = "Este participante foi rejeitado e não pode fazer check-in.";
      } else if (err.message?.includes("Código QR não encontrado")) {
        errorTitle = "❌ QR não reconhecido";
        errorMsg = "Este código QR não está registado no sistema.";
      } else if (err.message?.includes("Sem permissão")) {
        errorTitle = "❌ Sem Permissão";
        errorMsg = "Apenas administradores podem fazer check-in.";
      }
      
      Alert.alert(errorTitle, errorMsg);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setResultModal(null);
    setScanned(false);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <Ionicons name="camera-outline" size={64} color={Colors.mediumGray} />
        <Text style={styles.permTitle}>Permissão de Câmara</Text>
        <Text style={styles.permText}>Precisamos de acesso à câmara para ler os códigos QR.</Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Permitir Acesso</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "code39"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <LinearGradient
        colors={["rgba(10,32,64,0.7)", "transparent"]}
        style={[styles.topOverlay, { paddingTop: topPad + 10 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.scannerTitle}>Scanner QR</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        )}
      </View>

      <LinearGradient
        colors={["transparent", "rgba(10,32,64,0.8)"]}
        style={[styles.bottomOverlay, { paddingBottom: bottomPad + 20 }]}
      >
        <Text style={styles.scanInstruction}>Aponte a câmara para o código QR do participante</Text>
        {scanned && !resultModal && (
          <Pressable style={styles.rescanBtn} onPress={() => setScanned(false)}>
            <Ionicons name="refresh-outline" size={18} color={Colors.white} />
            <Text style={styles.rescanBtnText}>Novo scan</Text>
          </Pressable>
        )}
      </LinearGradient>

      <Modal visible={!!resultModal} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {resultModal && (
              <>
                <View style={[styles.resultIcon, {
                  backgroundColor: (resultModal.already_checked_in || resultModal.can_checkin === false) 
                    ? (resultModal.reason === "pending_approval" ? Colors.warning : Colors.danger) + "20" 
                    : Colors.success + "20"
                }]}>
                  <Ionicons
                    name={resultModal.already_checked_in ? "warning-outline" : (resultModal.can_checkin === false ? "close-circle-outline" : "checkmark-circle-outline")}
                    size={48}
                    color={resultModal.already_checked_in ? Colors.warning : (resultModal.can_checkin === false ? Colors.danger : Colors.success)}
                  />
                </View>
                <Text style={styles.resultTitle}>
                  {resultModal.already_checked_in ? "Já fez check-in" : (resultModal.can_checkin === false ? "Check-in bloqueado" : "Check-in realizado!")}
                </Text>
                
                {resultModal.can_checkin === false && (
                  <View style={[styles.blockReasonBox, {
                    backgroundColor: resultModal.reason === "pending_approval" ? Colors.warning + "15" : Colors.danger + "15",
                    borderColor: resultModal.reason === "pending_approval" ? Colors.warning : Colors.danger
                  }]}>
                    <Ionicons 
                      name={resultModal.reason === "pending_approval" ? "alert-circle-outline" : "close-circle-outline"} 
                      size={20} 
                      color={resultModal.reason === "pending_approval" ? Colors.warning : Colors.danger}
                    />
                    <View style={styles.blockReasonText}>
                      <Text style={[styles.blockReasonTitle, {
                        color: resultModal.reason === "pending_approval" ? Colors.warning : Colors.danger
                      }]}>
                        {resultModal.reason === "pending_approval" ? "Aprovação Pendente" : 
                         resultModal.reason === "rejected" ? "Inscrição Rejeitada" : "Acesso Bloqueado"}
                      </Text>
                      <Text style={styles.blockReasonMsg}>
                        {resultModal.reason === "pending_approval" ? "Aguardando aprovação do administrador" :
                         resultModal.reason === "rejected" ? "Não é elegível para o congresso" : 
                         resultModal.message}
                      </Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.resultUserCard}>
                  <View style={styles.resultAvatar}>
                    <Text style={styles.resultAvatarText}>
                      {(resultModal.user?.full_name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.resultUserInfo}>
                    <Text style={styles.resultName}>{resultModal.user?.full_name}</Text>
                    <Text style={styles.resultEmail}>{resultModal.user?.email}</Text>
                    <Text style={styles.resultCat}>
                      {CATEGORY_LABELS[resultModal.user?.category]} · {resultModal.user?.affiliation?.toUpperCase()}
                    </Text>
                    <Text style={styles.resultInstitution}>{resultModal.user?.institution}</Text>
                    <View style={[styles.payStatus, {
                      backgroundColor: (resultModal.user?.payment_status === "paid" || resultModal.user?.payment_status === "exempt") 
                        ? Colors.success + "20" 
                        : (resultModal.user?.payment_status === "approved" ? Colors.info + "20" : Colors.warning + "20")
                    }]}>
                      <Text style={[styles.payStatusText, {
                        color: (resultModal.user?.payment_status === "paid" || resultModal.user?.payment_status === "exempt") 
                          ? Colors.success 
                          : (resultModal.user?.payment_status === "approved" ? Colors.info : Colors.warning)
                      }]}>
                        {resultModal.user?.payment_status === "paid" ? "✓ Pagamento confirmado" :
                         resultModal.user?.payment_status === "approved" ? "⏳ Aprovado, falta pagar" :
                         resultModal.user?.payment_status === "exempt" ? "✓ Isento de pagamento" :
                         "❌ Pagamento pendente"}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable style={styles.closeModalBtn} onPress={closeModal}>
                  <Text style={styles.closeModalBtnText}>Próximo scan</Text>
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
  container: { flex: 1, backgroundColor: Colors.primaryDark },
  centered: { alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  permTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.text, textAlign: "center" },
  permText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center" },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  permBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backBtnText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.white },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: Colors.accent,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  loadingOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 32,
    gap: 16,
    zIndex: 10,
  },
  scanInstruction: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  rescanBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    alignItems: "center",
    gap: 14,
    paddingBottom: 40,
  },
  resultIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.text },
  resultUserCard: {
    flexDirection: "row",
    backgroundColor: Colors.lightGray,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    width: "100%",
    alignItems: "flex-start",
  },
  resultAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  resultAvatarText: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.white },
  resultUserInfo: { flex: 1, gap: 2 },
  resultName: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.text },
  resultEmail: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  resultCat: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary },
  resultInstitution: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textLight },
  payStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  payStatusText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  blockReasonBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  blockReasonText: {
    flex: 1,
    gap: 4,
  },
  blockReasonTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  blockReasonMsg: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  closeModalBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  closeModalBtnText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.white },
});
