import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  ActivityIndicator, Alert, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  approved: Colors.success,
  rejected: Colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const AXES = [
  "Ensino e Investigação aplicada ao sector agro-alimentar",
  "Contribuição sector agro na economia nacional",
  "Integração empresarial na criação de políticas de desenvolvimento do sector agro em Angola",
];

export default function SubmissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const { data: submission, isLoading } = useQuery<any>({
    queryKey: ["/api/submissions", id],
  });

  const handleReview = async (status: "approved" | "rejected") => {
    setReviewLoading(true);
    try {
      await apiRequest("PUT", `/api/submissions/${id}/review`, { status, note: reviewNote });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      Alert.alert("Sucesso", `Submissão ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso.`);
      router.back();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao rever submissão");
    } finally {
      setReviewLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Submissão não encontrada</Text>
      </View>
    );
  }

  const canReview = (user?.role === "admin" || user?.role === "avaliador") && submission.status === "pending";
  const statusColor = STATUS_COLORS[submission.status] || Colors.warning;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[statusColor + "20", statusColor + "08"]}
        style={styles.statusBanner}
      >
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {STATUS_LABELS[submission.status]}
          </Text>
        </View>
        <Text style={styles.submittedDate}>
          Submetido em {new Date(submission.submitted_at).toLocaleDateString("pt-PT")}
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Título</Text>
        <Text style={styles.titleText}>{submission.title}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Eixo Temático</Text>
        <View style={styles.axisRow}>
          <View style={styles.axisNum}>
            <Text style={styles.axisNumText}>{submission.thematic_axis}</Text>
          </View>
          <Text style={styles.axisText}>
            {AXES[(submission.thematic_axis || 1) - 1]}
          </Text>
        </View>
      </View>

      {(user?.role === "admin" || user?.role === "avaliador" || submission.user_id === user?.id) && (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Autor</Text>
          <Text style={styles.infoText}>{submission.user_name}</Text>
          <Text style={styles.infoTextSub}>{submission.user_email}</Text>
        </View>
      )}

      {submission.file_name && (
        <View style={styles.fileCard}>
          <Ionicons name="document-outline" size={28} color={Colors.primary} />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{submission.file_name}</Text>
            <Text style={styles.fileLabel}>Ficheiro anexado</Text>
          </View>
          <Ionicons name="arrow-down-circle-outline" size={24} color={Colors.primary} />
        </View>
      )}

      {submission.review_note && (
        <View style={styles.reviewNoteCard}>
          <View style={styles.reviewNoteHeader}>
            <Ionicons name="chatbox-outline" size={18} color={Colors.primary} />
            <Text style={styles.reviewNoteTitle}>Nota do Avaliador</Text>
          </View>
          <Text style={styles.reviewNoteText}>{submission.review_note}</Text>
          {submission.reviewer_name && (
            <Text style={styles.reviewerName}>— {submission.reviewer_name}</Text>
          )}
          {submission.reviewed_at && (
            <Text style={styles.reviewedDate}>
              {new Date(submission.reviewed_at).toLocaleDateString("pt-PT")}
            </Text>
          )}
        </View>
      )}

      {(user?.role === "admin" || user?.role === "avaliador") && submission.user_id !== user?.id && (
        <Pressable
          style={({ pressed }) => [styles.msgBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push(`/chat/${submission.user_id}`)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
          <Text style={styles.msgBtnText}>Enviar mensagem ao autor</Text>
        </Pressable>
      )}

      {canReview && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Rever Submissão</Text>

          {!showReview ? (
            <Pressable style={styles.startReviewBtn} onPress={() => setShowReview(true)}>
              <Ionicons name="eye-outline" size={18} color={Colors.primary} />
              <Text style={styles.startReviewBtnText}>Iniciar Revisão</Text>
            </Pressable>
          ) : (
            <>
              <Text style={styles.reviewLabel}>Nota de revisão (opcional)</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Comentários para o autor..."
                placeholderTextColor={Colors.mediumGray}
                value={reviewNote}
                onChangeText={setReviewNote}
                multiline
                numberOfLines={4}
              />
              <View style={styles.reviewActions}>
                <Pressable
                  style={[styles.rejectBtn, reviewLoading && { opacity: 0.6 }]}
                  onPress={() => handleReview("rejected")}
                  disabled={reviewLoading}
                >
                  <Ionicons name="close-outline" size={18} color={Colors.white} />
                  <Text style={styles.rejectBtnText}>Rejeitar</Text>
                </Pressable>
                <Pressable
                  style={[styles.approveBtn, reviewLoading && { opacity: 0.6 }]}
                  onPress={() => handleReview("approved")}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-outline" size={18} color={Colors.white} />
                      <Text style={styles.approveBtnText}>Aprovar</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 14 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  statusBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  submittedDate: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  fieldLabel: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: Colors.textLight, textTransform: "uppercase", letterSpacing: 0.5 },
  titleText: { fontSize: 17, fontFamily: "Poppins_700Bold", color: Colors.text, lineHeight: 26 },
  axisRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  axisNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  axisNumText: { fontSize: 14, fontFamily: "Poppins_700Bold", color: Colors.white },
  axisText: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.text, lineHeight: 20 },
  infoText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  infoTextSub: { fontSize: 13, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + "30",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  fileLabel: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  reviewNoteCard: {
    backgroundColor: Colors.primary + "08",
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary + "20",
  },
  reviewNoteHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewNoteTitle: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.primary },
  reviewNoteText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.text, lineHeight: 20 },
  reviewerName: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary },
  reviewedDate: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight },
  msgBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
    backgroundColor: Colors.primary + "08",
  },
  msgBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.primary },
  reviewSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  reviewTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.text },
  startReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
    backgroundColor: Colors.primary + "08",
  },
  startReviewBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.primary },
  reviewLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary },
  reviewInput: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
    minHeight: 100,
  },
  reviewActions: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.danger,
  },
  rejectBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.success,
  },
  approveBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.white },
});
