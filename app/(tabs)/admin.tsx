import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  TextInput, Alert, ActivityIndicator, RefreshControl, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { router } from "expo-router";
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

const PAYMENT_COLORS: Record<string, string> = {
  pending: Colors.warning,
  approved: Colors.info,
  paid: Colors.success,
  exempt: Colors.textSecondary,
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  paid: "Pago",
  exempt: "Isento",
};

const AXES = [
  "Eixo 1: Ensino e Investigação agro-alimentar",
  "Eixo 2: Contribuição agro na economia nacional",
  "Eixo 3: Integração empresarial e políticas de desenvolvimento",
];

export default function AdminScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [tab, setTab] = useState<"submissions" | "participants" | "financials">("submissions");
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: submissions = [], isLoading: subsLoading, refetch: refetchSubs } = useQuery<any[]>({
    queryKey: ["/api/submissions"],
  });

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin",
  });

  const { data: financial } = useQuery<any>({
    queryKey: ["/api/stats/financial"],
    enabled: user?.role === "admin",
  });

  const { data: stats } = useQuery<Record<string, number>>({
    queryKey: ["/api/stats"],
  });

  const filteredSubs = submissions.filter(s =>
    submissionFilter === "all" ? true : s.status === submissionFilter
  );

  const handleReview = async (status: "approved" | "rejected") => {
    if (!reviewModal) return;
    setReviewLoading(true);
    try {
      await apiRequest("PUT", `/api/submissions/${reviewModal.id}/review`, { status, note: reviewNote });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/financial"] });
      setReviewModal(null);
      setReviewNote("");
      Alert.alert("Sucesso", `Submissão ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso.`);
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao rever submissão");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleMarkPaid = async (userId: number) => {
    try {
      await apiRequest("POST", `/api/users/${userId}/payment`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/financial"] });
      Alert.alert("Sucesso", "Pagamento registado.");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao registar pagamento");
    }
  };

  const totalParticipants = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {user?.role === "admin" ? "Painel de Gestão" : "Revisão"}
        </Text>
        {user?.role === "admin" && (
          <Pressable onPress={() => router.push("/scanner")} style={styles.scanBtn}>
            <Ionicons name="qr-code-outline" size={22} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, tab === "submissions" && styles.tabItemActive]}
          onPress={() => setTab("submissions")}
        >
          <Text style={[styles.tabText, tab === "submissions" && styles.tabTextActive]}>Submissões</Text>
        </Pressable>
        {user?.role === "admin" && (
          <>
            <Pressable
              style={[styles.tabItem, tab === "participants" && styles.tabItemActive]}
              onPress={() => setTab("participants")}
            >
              <Text style={[styles.tabText, tab === "participants" && styles.tabTextActive]}>Participantes</Text>
            </Pressable>
            <Pressable
              style={[styles.tabItem, tab === "financials" && styles.tabItemActive]}
              onPress={() => setTab("financials")}
            >
              <Text style={[styles.tabText, tab === "financials" && styles.tabTextActive]}>Financeiro</Text>
            </Pressable>
          </>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={subsLoading || usersLoading}
            onRefresh={() => { refetchSubs(); refetchUsers(); }}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
      >
        {tab === "submissions" && (
          <>
            <View style={styles.filterRow}>
              {(["all", "pending", "approved", "rejected"] as const).map(f => (
                <Pressable
                  key={f}
                  style={[styles.filterBtn, submissionFilter === f && styles.filterBtnActive]}
                  onPress={() => setSubmissionFilter(f)}
                >
                  <Text style={[styles.filterText, submissionFilter === f && styles.filterTextActive]}>
                    {f === "all" ? "Todos" : STATUS_LABELS[f]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {subsLoading ? (
              <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
            ) : filteredSubs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={Colors.mediumGray} />
                <Text style={styles.emptyText}>Sem submissões</Text>
              </View>
            ) : (
              filteredSubs.map(sub => (
                <View key={sub.id} style={styles.subCard}>
                  <View style={styles.subCardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[sub.status] + "20" }]}>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[sub.status] }]} />
                      <Text style={[styles.statusText, { color: STATUS_COLORS[sub.status] }]}>
                        {STATUS_LABELS[sub.status]}
                      </Text>
                    </View>
                    <Text style={styles.subDate}>{new Date(sub.submitted_at).toLocaleDateString("pt-PT")}</Text>
                  </View>
                  <Text style={styles.subTitle} numberOfLines={2}>{sub.title}</Text>
                  <Text style={styles.subAuthor}>{sub.user_name} · {sub.user_email}</Text>
                  <Text style={styles.subAxis}>{AXES[(sub.thematic_axis || 1) - 1]}</Text>
                  {sub.review_note && (
                    <Text style={styles.reviewNote}>Nota: {sub.review_note}</Text>
                  )}
                  <View style={styles.subActions}>
                    <Pressable
                      style={styles.chatBtn}
                      onPress={() => router.push(`/chat/${sub.user_id}`)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                      <Text style={styles.chatBtnText}>Mensagem</Text>
                    </Pressable>
                    {sub.status === "pending" && (
                      <Pressable
                        style={styles.reviewBtn}
                        onPress={() => { setReviewModal(sub); setReviewNote(""); }}
                      >
                        <Ionicons name="eye-outline" size={16} color={Colors.white} />
                        <Text style={styles.reviewBtnText}>Rever</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === "participants" && user?.role === "admin" && (
          <>
            <View style={styles.statsSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNum}>{totalParticipants}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: Colors.success }]}>
                  {users.filter(u => u.payment_status === "paid").length}
                </Text>
                <Text style={styles.summaryLabel}>Pagos</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: Colors.warning }]}>
                  {users.filter(u => u.payment_status === "approved").length}
                </Text>
                <Text style={styles.summaryLabel}>Aprovados</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: Colors.info }]}>
                  {users.filter(u => u.is_checked_in).length}
                </Text>
                <Text style={styles.summaryLabel}>Check-in</Text>
              </View>
            </View>

            {usersLoading ? (
              <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
            ) : (
              users.filter(u => u.role === "participant").map(u => (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {u.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.full_name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <Text style={styles.userCat}>{u.category} · {u.affiliation?.toUpperCase()}</Text>
                    <View style={[styles.payBadge, { backgroundColor: PAYMENT_COLORS[u.payment_status] + "20" }]}>
                      <Text style={[styles.payBadgeText, { color: PAYMENT_COLORS[u.payment_status] }]}>
                        {PAYMENT_LABELS[u.payment_status]}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    {u.is_checked_in && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    )}
                    {u.payment_status === "approved" && (
                      <Pressable
                        style={styles.payBtn}
                        onPress={() => handleMarkPaid(u.id)}
                      >
                        <Ionicons name="card-outline" size={16} color={Colors.white} />
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.msgBtn}
                      onPress={() => router.push(`/chat/${u.id}`)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === "financials" && user?.role === "admin" && financial && (
          <>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.financialHero}>
              <Text style={styles.financialLabel}>Receita Total</Text>
              <Text style={styles.financialAmount}>
                {parseFloat(financial.total_revenue || 0).toLocaleString("pt-AO")} Kz
              </Text>
            </LinearGradient>
            <View style={styles.financialGrid}>
              <FinCard label="Pagamentos Confirmados" value={financial.paid_count} color={Colors.success} icon="checkmark-circle-outline" />
              <FinCard label="Aprovados (por pagar)" value={financial.approved_not_paid} color={Colors.warning} icon="time-outline" />
              <FinCard label="Pendentes" value={financial.pending_count} color={Colors.info} icon="hourglass-outline" />
              <FinCard label="Submissões Aprovadas" value={financial.approved} color={Colors.success} icon="document-text-outline" />
              <FinCard label="Submissões Rejeitadas" value={financial.rejected} color={Colors.danger} icon="close-circle-outline" />
              <FinCard label="Submissões Pendentes" value={financial.pending} color={Colors.warning} icon="document-outline" />
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={!!reviewModal} animationType="slide" transparent onRequestClose={() => setReviewModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rever Submissão</Text>
              <Pressable onPress={() => setReviewModal(null)}>
                <Ionicons name="close-circle" size={28} color={Colors.darkGray} />
              </Pressable>
            </View>
            {reviewModal && (
              <>
                <Text style={styles.modalSubTitle} numberOfLines={2}>{reviewModal.title}</Text>
                <Text style={styles.modalAuthor}>{reviewModal.user_name}</Text>
                <Text style={styles.notesLabel}>Nota de revisão (opcional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Comentários para o autor..."
                  placeholderTextColor={Colors.mediumGray}
                  value={reviewNote}
                  onChangeText={setReviewNote}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.modalActions}>
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
        </View>
      </Modal>
    </View>
  );
}

function FinCard({ label, value, color, icon }: { label: string; value: any; color: string; icon: string }) {
  return (
    <View style={[styles.finCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.finValue, { color }]}>{value ?? 0}</Text>
      <Text style={styles.finLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.text },
  scanBtn: { padding: 8 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary },
  subCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  subCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  subDate: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight },
  subTitle: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  subAuthor: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  subAxis: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight, fontStyle: "italic" },
  reviewNote: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    backgroundColor: Colors.lightGray,
    padding: 8,
    borderRadius: 8,
  },
  subActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
    backgroundColor: Colors.primary + "08",
  },
  chatBtnText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.primary },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  reviewBtnText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  statsSummary: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryItem: { alignItems: "center" },
  summaryNum: { fontSize: 24, fontFamily: "Poppins_700Bold", color: Colors.text },
  summaryLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  userCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { fontSize: 15, fontFamily: "Poppins_700Bold", color: Colors.white },
  userInfo: { flex: 1, gap: 1 },
  userName: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  userEmail: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  userCat: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight },
  payBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 2 },
  payBadgeText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  userActions: { flexDirection: "row", gap: 6, alignItems: "center" },
  payBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.success, alignItems: "center", justifyContent: "center" },
  msgBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary + "15", alignItems: "center", justifyContent: "center" },
  financialHero: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  financialLabel: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.7)" },
  financialAmount: { fontSize: 32, fontFamily: "Poppins_700Bold", color: Colors.accent },
  financialGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  finCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  finValue: { fontSize: 24, fontFamily: "Poppins_700Bold" },
  finLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center" },
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
    gap: 10,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.text },
  modalSubTitle: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.text, marginTop: 4 },
  modalAuthor: { fontSize: 13, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  notesLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary, marginTop: 8 },
  notesInput: {
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
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8, paddingBottom: 16 },
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
  rejectBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
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
  approveBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
});
