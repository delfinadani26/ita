import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  TextInput, Alert, ActivityIndicator, RefreshControl, Modal, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { adminService, submissionService } from "@/lib/supabase-service";

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  approved: Colors.success,
  rejected: Colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando Aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: Colors.warning,
  approved: Colors.info,
  paid: Colors.success,
  exempt: Colors.textSecondary,
  rejected: Colors.danger,
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  paid: "Pago",
  exempt: "Isento",
  rejected: "Rejeitado",
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
  const [permissionsModal, setPermissionsModal] = useState<any>(null);
  const [permissions, setPermissions] = useState({
    approve_participant: false,
    reject_participant: false,
    mark_as_paid: false,
    review_submissions: false,
    manage_admins: false,
    check_in: false,
    send_messages: false,
  });
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [participantStatus, setParticipantStatus] = useState<"all" | "pending" | "approved" | "paid" | "rejected">("all");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [participantsData, setParticipantsData] = useState<any>(null);
  const [subsLoading, setSubsLoading] = useState(false);
  
  // Scroll indicator animation
  const scrollIndicatorOpacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollIndicatorOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scrollIndicatorOpacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.reset();
  }, [scrollIndicatorOpacity]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [financial, setFinancial] = useState<any>(null);

  // Buscar submissões com realtime updates
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setSubsLoading(true);
        const data = await submissionService.getSubmissions();
        setSubmissions(data);
      } catch (error: any) {
        console.error("Erro ao buscar submissões:", error);
      } finally {
        setSubsLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchSubmissions();
      // ❌ SUPABASE REALTIME DESATIVADO - Migrado para Firebase
    }
  }, [user?.role]);

  // Buscar participantes com realtime updates
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setUsersLoading(true);
        const data = await adminService.getParticipants(
          currentPage,
          10,
          participantStatus === "all" ? undefined : participantStatus
        );
        setParticipantsData(data);
      } catch (error: any) {
        console.error("Erro ao buscar participantes:", error);
      } finally {
        setUsersLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchParticipants();
      // ❌ SUPABASE REALTIME DESATIVADO - Migrado para Firebase
    }
  }, [user?.role, currentPage, participantStatus]);

  // Buscar dados financeiros e de check-in com realtime updates
  useEffect(() => {
    const fetchFinancial = async () => {
      try {
        const participantsResponse = await adminService.getParticipants(1, 1000);
        const allParticipants = participantsResponse?.data || [];
        
        const paidCount = allParticipants.filter((p: any) => p.payment_status === "paid").length;
        const approvedNotPaid = allParticipants.filter((p: any) => p.payment_status === "approved").length;
        const pendingCount = allParticipants.filter((p: any) => p.payment_status === "pending").length;
        const checkedInCount = allParticipants.filter((p: any) => p.checked_in === true).length;
        
        const totalRevenue = paidCount * 150000; // 150.000 Kz por participante
        
        setFinancial({
          total_revenue: totalRevenue,
          paid_count: paidCount,
          approved_not_paid: approvedNotPaid,
          pending_count: pendingCount,
          checked_in_count: checkedInCount,
          approved: submissions.filter(s => s.status === "approved").length,
          rejected: submissions.filter(s => s.status === "rejected").length,
          pending: submissions.filter(s => s.status === "pending").length,
        });
      } catch (error: any) {
        console.error("Erro ao buscar dados financeiros:", error);
      }
    };

    if (user?.role === "admin") {
      fetchFinancial();
    }
  }, [user?.role, submissions]);

  const users = participantsData?.data || [];
  const pagination = participantsData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };
  const filteredSubs = submissions.filter(s =>
    submissionFilter === "all" ? true : s.status === submissionFilter
  );

  // Função centralizada para atualizar TODOS os dados em tempo real
  const refreshAllData = async () => {
    try {
      const [subs, participants] = await Promise.all([
        submissionService.getSubmissions(),
        adminService.getParticipants(currentPage, 10, participantStatus === "all" ? undefined : participantStatus),
      ]);

      setSubmissions(subs);
      setParticipantsData(participants);

      // Também atualizar dados financeiros
      const { data: allParticipants } = await adminService.getParticipants(1, 1000);
      const paidCount = allParticipants.filter((p: any) => p.payment_status === "paid").length;
      const approvedNotPaid = allParticipants.filter((p: any) => p.payment_status === "approved").length;
      const pendingCount = allParticipants.filter((p: any) => p.payment_status === "pending").length;
      const checkedInCount = allParticipants.filter((p: any) => p.checked_in === true).length;

      setFinancial({
        total_revenue: paidCount * 150000,
        paid_count: paidCount,
        approved_not_paid: approvedNotPaid,
        pending_count: pendingCount,
        checked_in_count: checkedInCount,
        approved: subs.filter(s => s.status === "approved").length,
        rejected: subs.filter(s => s.status === "rejected").length,
        pending: subs.filter(s => s.status === "pending").length,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar dados:", error);
    }
  };

  const handleApproveParticipant = async (userId: number) => {
    try {
      await adminService.approveParticipant(userId);
      Alert.alert("Sucesso", "Participante aprovado e notificado por email.");
      // Atualizar todos os dados em tempo real
      refreshAllData();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao aprovar participante");
    }
  };

  const handleRejectParticipant = async (userId: number) => {
    Alert.alert(
      "Rejeitar Participante",
      "Tem certeza que quer rejeitar este participante? Um email será enviado.",
      [
        { text: "Cancelar" },
        {
          text: "Rejeitar",
          onPress: async () => {
            try {
              await adminService.rejectParticipant(userId);
              Alert.alert("Sucesso", "Participante rejeitado e notificado por email.");
              // Atualizar todos os dados em tempo real
              refreshAllData();
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Erro ao rejeitar participante");
            }
          },
        },
      ]
    );
  };

  const handleMarkPaid = async (userId: number) => {
    try {
      await adminService.markAsPaid(userId);
      Alert.alert("Sucesso", "Participante marcado como pago com sucesso.");
      // Atualizar todos os dados em tempo real
      refreshAllData();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao marcar como pago");
    }
  };

  const handlePromoteAdmin = async (userId: number) => {
    Alert.alert(
      "Promover a Administrador",
      "Tem certeza que quer promover este utilizador a administrador?",
      [
        { text: "Cancelar" },
        {
          text: "Promover",
          onPress: async () => {
            try {
              await adminService.promoteToAdmin(userId);
              // Carregar permissões padrão (todas false)
              setPermissions({
                approve_participant: false,
                reject_participant: false,
                mark_as_paid: false,
                review_submissions: false,
                manage_admins: false,
                check_in: false,
                send_messages: false,
              });
              setPermissionsModal({ id: userId, full_name: "" });
              // Atualizar todos os dados em tempo real
              refreshAllData();
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Erro ao promover administrador");
            }
          },
        },
      ]
    );
  };

  const handleSavePermissions = async () => {
    if (!permissionsModal) return;
    try {
      await adminService.updateAdminPermissions(permissionsModal.id, permissions);
      Alert.alert("Sucesso", "Permissões atualizadas com sucesso.");
      setPermissionsModal(null);
      // Atualizar todos os dados em tempo real
      refreshAllData();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao salvar permissões");
    }
  };

  const PERMISSION_LABELS: Record<string, string> = {
    approve_participant: "Aprovar Participantes",
    reject_participant: "Rejeitar Participantes",
    mark_as_paid: "Marcar como Pago",
    review_submissions: "Revisar Submissões",
    manage_admins: "Gerenciar Admins",
    check_in: "Check-in via QR",
    send_messages: "Enviar Mensagens",
  };

  const handleDemoteAdmin = async (userId: number) => {
    Alert.alert(
      "Remover Privilégios de Administrador",
      "Tem certeza que quer remover os privilégios de administrador?",
      [
        { text: "Cancelar" },
        {
          text: "Remover",
          onPress: async () => {
            try {
              await adminService.demoteFromAdmin(userId);
              Alert.alert("Sucesso", "Privilégios de administrador removidos com sucesso.");
              // Atualizar todos os dados em tempo real
              refreshAllData();
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Erro ao remover privilégios");
            }
          },
        },
      ]
    );
  };

  const handleReview = async (status: "approved" | "rejected") => {
    if (!reviewModal) return;
    setReviewLoading(true);
    try {
      await submissionService.reviewSubmission(
        reviewModal.id,
        status,
        reviewNote,
        user?.id || 0
      );
      setReviewModal(null);
      setReviewNote("");
      Alert.alert("Sucesso", `Submissão ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso.`);
      // Atualizar todos os dados em tempo real
      refreshAllData();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao rever submissão");
    } finally {
      setReviewLoading(false);
    }
  };

  const totalParticipants = participantsData?.pagination?.total || 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {user?.role === "admin" ? "Painel de Gestão" : "Revisão"}
        </Text>
        <View style={styles.headerActions}>
          {user?.role === "admin" && (
            <Pressable onPress={() => router.push("/admin-participants")} style={styles.scanBtn}>
              <Ionicons name="people-outline" size={22} color={Colors.primary} />
            </Pressable>
          )}
          {user?.role === "admin" && (
            <Pressable onPress={() => router.push("/scanner")} style={styles.scanBtn}>
              <Ionicons name="qr-code-outline" size={22} color={Colors.primary} />
            </Pressable>
          )}
        </View>
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
            onRefresh={async () => {
              const subs = await submissionService.getSubmissions();
              setSubmissions(subs);
              const users = await adminService.getParticipants(currentPage, 10, participantStatus === "all" ? undefined : participantStatus);
              setParticipantsData(users);
            }}
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
            {/* � SEÇÃO: CARTÕES DE ENTRADA E ESTATÍSTICAS */}
            <View style={styles.statsGrid}>
              <LinearGradient colors={[Colors.success, Colors.successLight]} style={styles.statCard}>
                <View style={styles.statIconBox}>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{financial?.checked_in_count || 0}</Text>
                <Text style={styles.statLabel}>Entrada Confirmada</Text>
              </LinearGradient>
              
              <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.statCard}>
                <View style={styles.statIconBox}>
                  <Ionicons name="people-outline" size={28} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{participantsData?.pagination?.total || 0}</Text>
                <Text style={styles.statLabel}>Total Registrados</Text>
              </LinearGradient>

              <LinearGradient colors={[Colors.warning, Colors.warningLight]} style={styles.statCard}>
                <View style={styles.statIconBox}>
                  <Ionicons name="alert-circle-outline" size={28} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{financial?.pending_count || 0}</Text>
                <Text style={styles.statLabel}>Aguardando Aprovação</Text>
              </LinearGradient>

              <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.statCard}>
                <View style={styles.statIconBox}>
                  <Ionicons name="cash-outline" size={28} color={Colors.white} />
                </View>
                <Text style={styles.statValue}>{financial?.paid_count || 0}</Text>
                <Text style={styles.statLabel}>Pagamentos Confirmados</Text>
              </LinearGradient>
            </View>


            {/* SCROLL INDICATOR - Pulsing animation to show horizontal scroll */}
            <Animated.View style={{ opacity: scrollIndicatorOpacity }}>
              <View style={styles.scrollIndicatorContainer}>
                <Ionicons name="arrow-forward" size={20} color={Colors.accent} />
                <Text style={styles.scrollIndicatorText}>Roda para direita para ver outros cartões</Text>
              </View>
            </Animated.View>
            {users.filter((u: any) => u.role === "admin").length > 0 && (
              <>
                <View style={styles.adminsSection}>
                  <View style={styles.adminsSectionHeader}>
                  <Ionicons name="shield-outline" size={20} color={Colors.info} />
                  <Text style={styles.adminsSectionTitle}>
                    Administradores ({users.filter((u: any) => u.role === "admin").length})
                  </Text>
                </View>
                {users.filter((u: any) => u.role === "admin").map((u: any) => (
                  <View key={u.id} style={styles.adminCard}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {u.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.full_name}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                      <Text style={styles.userCat}>{u.category} · {u.affiliation?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.adminActions}>
                      <Pressable
                        style={[styles.adminBtn, { backgroundColor: Colors.warning }]}
                        onPress={() => handleDemoteAdmin(u.id)}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
                      </Pressable>
                      <Pressable
                        style={styles.msgBtn}
                        onPress={() => router.push(`/chat/${u.id}`)}
                      >
                        <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
            )}

            {/* ⭐ SEÇÃO: PARTICIPANTES PENDENTES DE APROVAÇÃO */}
            {users.filter((u: any) => u.role === "participant" && u.payment_status === "pending").length > 0 && (
              <View style={styles.pendingSection}>
                <View style={styles.pendingHeader}>
                  <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
                  <Text style={styles.pendingTitle}>
                    Aprovação Pendente ({users.filter((u: any) => u.role === "participant" && u.payment_status === "pending").length})
                  </Text>
                </View>
                {users.filter((u: any) => u.role === "participant" && u.payment_status === "pending").map((u: any) => (
                  <View key={u.id} style={styles.pendingUserCard}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {u.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.full_name}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                      <Text style={styles.userCat}>{u.category} · {u.affiliation?.toUpperCase()}</Text>
                      <Text style={styles.userInstitution}>{u.institution}</Text>
                    </View>
                    <View style={styles.pendingActions}>
                      <Pressable
                        style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => handleApproveParticipant(u.id)}
                      >
                        <Ionicons name="checkmark-outline" size={16} color={Colors.white} />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => handleRejectParticipant(u.id)}
                      >
                        <Ionicons name="close-outline" size={16} color={Colors.white} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 📄 Filtro de Status + Controle de Paginação */}
            <View style={styles.filterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {(["all", "pending", "approved", "paid", "rejected"] as const).map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.filterBtn,
                      participantStatus === status && styles.filterBtnActive
                    ]}
                    onPress={() => {
                      setParticipantStatus(status);
                      setCurrentPage(1);
                    }}
                  >
                    <Text style={[
                      styles.filterBtnText,
                      participantStatus === status && styles.filterBtnTextActive
                    ]}>
                      {status === "all" ? "Todos" : STATUS_LABELS[status] || status}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.statsSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNum}>{totalParticipants}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: Colors.success }]}>
                  {users.filter((u: any) => u.payment_status === "paid").length}
                </Text>
                <Text style={styles.summaryLabel}>Pagos</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: Colors.warning }]}>
                  {users.filter((u: any) => u.payment_status === "approved").length}
                </Text>
                <Text style={styles.summaryLabel}>Aprovados</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: Colors.info }]}>
                  {users.filter((u: any) => u.is_checked_in).length}
                </Text>
                <Text style={styles.summaryLabel}>Check-in</Text>
              </View>
            </View>

            {usersLoading ? (
              <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
            ) : (
              users.filter((u: any) => u.role === "participant").map((u: any) => (
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
                    {u.role === "participant" && (
                      <Pressable
                        style={[styles.adminBtn]}
                        onPress={() => handlePromoteAdmin(u.id)}
                      >
                        <Ionicons name="shield-outline" size={16} color={Colors.white} />
                      </Pressable>
                    )}
                    {u.role === "admin" && (
                      <Pressable
                        style={[styles.adminBtn, { backgroundColor: Colors.warning }]}
                        onPress={() => handleDemoteAdmin(u.id)}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
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

            {/* 📄 Controles de Paginação */}
            {pagination.pages > 1 && (
              <View style={styles.paginationContainer}>
                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    Página {pagination.page} de {pagination.pages} • {pagination.total} participantes
                  </Text>
                </View>
                <View style={styles.paginationButtons}>
                  <Pressable
                    style={[styles.paginationBtn, currentPage === 1 && styles.paginationBtnDisabled]}
                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <Ionicons name="chevron-back-outline" size={18} color={currentPage === 1 ? Colors.mediumGray : Colors.primary} />
                  </Pressable>

                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > pagination.pages) return null;
                    return (
                      <Pressable
                        key={pageNum}
                        style={[styles.paginationBtn, currentPage === pageNum && styles.paginationBtnActive]}
                        onPress={() => setCurrentPage(pageNum)}
                      >
                        <Text style={[styles.paginationBtnText, currentPage === pageNum && styles.paginationBtnTextActive]}>
                          {pageNum}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={[styles.paginationBtn, currentPage === pagination.pages && styles.paginationBtnDisabled]}
                    onPress={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                  >
                    <Ionicons name="chevron-forward-outline" size={18} color={currentPage === pagination.pages ? Colors.mediumGray : Colors.primary} />
                  </Pressable>
                </View>
              </View>
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

      {/* 🔐 MODAL DE PERMISSÕES */}
      <Modal visible={!!permissionsModal} animationType="slide" transparent onRequestClose={() => setPermissionsModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gerenciar Permissões</Text>
              <Pressable onPress={() => setPermissionsModal(null)}>
                <Ionicons name="close-circle" size={28} color={Colors.darkGray} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={styles.permissionsLabel}>Selecione as funcionalidades que este admin pode executar:</Text>
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <View key={key} style={styles.permissionItem}>
                  <Pressable
                    style={[styles.checkbox, permissions[key as keyof typeof permissions] && styles.checkboxActive]}
                    onPress={() => setPermissions({ ...permissions, [key]: !permissions[key as keyof typeof permissions] })}
                  >
                    {permissions[key as keyof typeof permissions] && (
                      <Ionicons name="checkmark" size={18} color={Colors.white} />
                    )}
                  </Pressable>
                  <Text style={styles.permissionText}>{label}</Text>
                </View>
              ))}
              <View style={styles.permissionsNote}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
                <Text style={styles.permissionsNoteText}>
                  Configure as permissões que deseja atribuir a este administrador. Deixe em branco para remover todas as permissões.
                </Text>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.cancelBtn]}
                onPress={() => setPermissionsModal(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.approveBtn]}
                onPress={handleSavePermissions}
              >
                <Ionicons name="checkmark-outline" size={18} color={Colors.white} />
                <Text style={styles.approveBtnText}>Guardar Permissões</Text>
              </Pressable>
            </View>
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
  headerActions: { flexDirection: "row", gap: 4 },
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
  
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  scrollIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: 8,
  },
  scrollIndicatorText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.accent,
    textAlign: "center",
  },
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
  rejectBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  approveBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
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
  adminBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.info, alignItems: "center", justifyContent: "center" },
  msgBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary + "15", alignItems: "center", justifyContent: "center" },
  
  // 👮 SEÇÃO ADMINISTRADORES
  adminsSection: {
    backgroundColor: Colors.info + "12",
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 0,
    marginBottom: 16,
    gap: 10,
  },
  adminsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminsSectionTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: Colors.info,
  },
  adminCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  adminActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: "auto",
  },
  
  // ⭐ SEÇÃO PENDING
  pendingSection: {
    backgroundColor: Colors.warning + "12",
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 0,
    marginBottom: 16,
    gap: 10,
  },
  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pendingTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: Colors.warning,
  },
  pendingUserCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  userInstitution: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: Colors.textLight,
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },

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

  // 📄 Filtros e Paginação
  filterBar: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.white,
  },
  
  paginationContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  paginationInfo: {
    alignItems: "center",
  },
  paginationText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  paginationButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  paginationBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paginationBtnDisabled: {
    opacity: 0.5,
  },
  paginationBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  paginationBtnTextActive: {
    color: Colors.white,
  },

  // 🔐 PERMISSÕES
  permissionsLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.darkGray,
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  permissionText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGray,
    flex: 1,
  },
  permissionsNote: {
    flexDirection: "row",
    backgroundColor: Colors.info + "12",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  permissionsNoteText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.info,
    flex: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.darkGray,
  },});