import React from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const THEMATIC_AXES = [
  { n: 1, title: "Ensino e Investigação aplicada ao sector agro-alimentar" },
  { n: 2, title: "Contribuição sector agro na economia nacional" },
  { n: 3, title: "Integração empresarial na criação de políticas de desenvolvimento do sector agro em Angola" },
];

const PRICING = [
  { cat: "Docentes/Investigadores", urnm: "5.000 Kz", ext: "7.000 Kz" },
  { cat: "Estudantes", urnm: "3.000 Kz", ext: "4.000 Kz" },
  { cat: "Outros", urnm: "5.000 Kz", ext: "10.000 Kz" },
];

const CATEGORY_LABELS: Record<string, string> = {
  docente: "Docente/Investigador",
  estudante: "Estudante",
  outro: "Outro",
  preletor: "Preletor (Autor)",
};

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AccessStatusCard({ user }: { user: any }) {
  let status: "confirmed" | "pending" | "unverified" = "unverified";
  let title = "";
  let subtitle = "";
  let bgColor = Colors.warning;
  let icon = "time-outline";

  if (user.payment_status === "paid" || user.payment_status === "exempt") {
    status = "confirmed";
    title = `Bem-vindo(a), ${user.full_name.split(" ")[0]}!`;
    subtitle = "Acesso ao congresso confirmado";
    bgColor = Colors.success;
    icon = "checkmark-circle-outline";
  } else if (user.payment_status === "approved") {
    status = "pending";
    title = "Aprovado — Aguarda Pagamento";
    subtitle = `Efectue o pagamento de ${user.payment_amount?.toLocaleString("pt-AO") || "—"} Kz para confirmar`;
    bgColor = Colors.info;
    icon = "card-outline";
  } else {
    status = "unverified";
    title = "Inscrição Pendente";
    subtitle = "Aguarde a aprovação da sua comunicação ou contacte a organização";
    bgColor = Colors.warning;
    icon = "hourglass-outline";
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.accessCard, pressed && { opacity: 0.9 }]}
      onPress={() => router.push("/entry-scan")}
    >
      <LinearGradient
        colors={[bgColor, bgColor + "CC"]}
        style={styles.accessCardGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.accessLeft}>
          <Ionicons name={icon as any} size={32} color={Colors.white} />
        </View>
        <View style={styles.accessMiddle}>
          <Text style={styles.accessTitle}>{title}</Text>
          <Text style={styles.accessSub}>{subtitle}</Text>
        </View>
        <Ionicons name="qr-code-outline" size={22} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: stats } = useQuery<Record<string, number>>({
    queryKey: ["/api/stats"],
  });

  const total = stats
    ? Object.values(stats).reduce((a, b) => a + b, 0)
    : 0;

  const today = new Date();
  const start = new Date("2026-03-01");
  const end = new Date("2026-04-30");
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const hasStarted = today >= start;
  const isOver = today > end;

  const categoryLabel = user ? (CATEGORY_LABELS[user.category] || user.category) : "";
  const typeLabel = user ? `${categoryLabel} (${user.affiliation === "urnm" ? "URNM" : "Externo"})` : "";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, {
        paddingTop: topPad + 8,
        paddingBottom: bottomPad + 100,
      }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      {showWelcome && (
        <View style={styles.welcomeToast}>
          <LinearGradient
            colors={[Colors.success, Colors.success + "DD"]}
            style={styles.welcomeToastGrad}
          >
            <Ionicons name="person-circle-outline" size={24} color={Colors.white} />
            <Text style={styles.welcomeToastText}>Bem-vindo de volta, {user?.full_name}!</Text>
          </LinearGradient>
        </View>
      )}

      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.heroBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroBadge}>
          <Ionicons name="restaurant" size={14} color={Colors.accent} />
          <Text style={styles.heroBadgeText}>CSA · URNM</Text>
        </View>
        <Text style={styles.heroTitle}>CSA 2026</Text>
        <Text style={styles.heroSub}>Congresso sobre Sistemas Alimentares</Text>
        <View style={styles.heroDates}>
          <Ionicons name="calendar-outline" size={16} color={Colors.accent} />
          <Text style={styles.heroDatesText}>01 Março — 30 Abril 2026</Text>
        </View>
        <Text style={styles.heroUniversity}>Universidade Rainha N'Jinga Mbande</Text>
        {!isOver && (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownNum}>{daysLeft}</Text>
            <Text style={styles.countdownLabel}>
              {hasStarted ? "dias restantes" : "dias para o início"}
            </Text>
          </View>
        )}
        {isOver && (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownLabel}>Congresso concluído</Text>
          </View>
        )}
      </LinearGradient>

      {user && (
        <View style={styles.welcomeCard}>
          <View>
            <Text style={styles.welcomeGreeting}>Olá, {user.full_name.split(" ")[0]}</Text>
            <Text style={styles.welcomeSub}>{typeLabel}</Text>
          </View>
          <View style={[styles.roleBadge, {
            backgroundColor: user.role === "admin" ? Colors.danger :
              user.role === "avaliador" ? Colors.warning : Colors.primary,
          }]}>
            <Text style={styles.roleText}>
              {user.role === "admin" ? "Admin" : user.role === "avaliador" ? "Avaliador" : "Participante"}
            </Text>
          </View>
        </View>
      )}

      {user && user.role === "participant" && (
        <AccessStatusCard user={user} />
      )}

      {user && (
        <Pressable
          style={({ pressed }) => [styles.entryScanBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/entry-scan")}
        >
          <Ionicons name="scan-outline" size={20} color={Colors.primary} />
          <Text style={styles.entryScanText}>Verificar Acesso ao Congresso</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Participantes Registados</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard label="Total" value={total} color={Colors.primary} icon="people-outline" />
          <StatCard label="Docentes URNM" value={stats?.["docente_urnm"] ?? 0} color={Colors.accent} icon="school-outline" />
          <StatCard label="Docentes Externos" value={stats?.["docente_externo"] ?? 0} color={Colors.info} icon="briefcase-outline" />
          <StatCard label="Estudantes URNM" value={stats?.["estudante_urnm"] ?? 0} color={Colors.success} icon="book-outline" />
          <StatCard label="Estudantes Externos" value={stats?.["estudante_externo"] ?? 0} color="#8B5CF6" icon="reader-outline" />
          <StatCard label="Outros URNM" value={stats?.["outro_urnm"] ?? 0} color={Colors.warning} icon="person-outline" />
          <StatCard label="Outros Externos" value={stats?.["outro_externo"] ?? 0} color={Colors.danger} icon="globe-outline" />
          <StatCard label="Prelectores" value={(stats?.["preletor_urnm"] ?? 0) + (stats?.["preletor_externo"] ?? 0)} color="#EC4899" icon="mic-outline" />
        </View>
      </ScrollView>

      <Text style={styles.sectionTitle}>Eixos Temáticos</Text>
      {THEMATIC_AXES.map(ax => (
        <View key={ax.n} style={styles.axisCard}>
          <View style={styles.axisNum}>
            <Text style={styles.axisNumText}>{ax.n}</Text>
          </View>
          <Text style={styles.axisTitle}>{ax.title}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Tabela de Inscrição</Text>
      <View style={styles.pricingCard}>
        <View style={styles.pricingHeader}>
          <Text style={[styles.pricingHeadCell, { flex: 2 }]}>Categoria</Text>
          <Text style={styles.pricingHeadCell}>URNM</Text>
          <Text style={styles.pricingHeadCell}>Externo</Text>
        </View>
        {PRICING.map((row, i) => (
          <View key={i} style={[styles.pricingRow, i % 2 === 1 && styles.pricingRowAlt]}>
            <Text style={[styles.pricingCell, { flex: 2, fontFamily: "Poppins_600SemiBold" }]}>{row.cat}</Text>
            <Text style={[styles.pricingCell, { color: Colors.success }]}>{row.urnm}</Text>
            <Text style={[styles.pricingCell, { color: Colors.danger }]}>{row.ext}</Text>
          </View>
        ))}
        <View style={[styles.pricingRow, styles.pricingRowAlt]}>
          <Text style={[styles.pricingCell, { flex: 2, fontFamily: "Poppins_600SemiBold" }]}>Prelectores (Autores)</Text>
          <Text style={[styles.pricingCell, { color: Colors.accent, fontFamily: "Poppins_700Bold" }]} numberOfLines={1}>20.000 Kz</Text>
          <Text style={[styles.pricingCell, { color: Colors.accent, fontFamily: "Poppins_700Bold" }]} numberOfLines={1}>20.000 Kz</Text>
        </View>
      </View>

      {user?.role === "admin" && (
        <Pressable
          style={({ pressed }) => [styles.scannerBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/scanner")}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.scannerBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="qr-code-outline" size={22} color={Colors.white} />
            <Text style={styles.scannerBtnText}>Scanner QR — Check-in</Text>
          </LinearGradient>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  heroBanner: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    gap: 8,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  heroBadgeText: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: Colors.accent, letterSpacing: 1 },
  heroTitle: { fontSize: 36, fontFamily: "Poppins_700Bold", color: Colors.white, letterSpacing: 2 },
  heroSub: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "rgba(255,255,255,0.85)" },
  heroUniversity: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.6)" },
  heroDates: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  heroDatesText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.accentLight },
  countdownBox: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  countdownNum: { fontSize: 28, fontFamily: "Poppins_700Bold", color: Colors.accent },
  countdownLabel: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.8)" },
  welcomeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeGreeting: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  welcomeSub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, marginTop: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  roleText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  accessCard: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  accessCardGrad: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  accessLeft: { width: 44, alignItems: "center" },
  accessMiddle: { flex: 1, gap: 3 },
  accessTitle: { fontSize: 14, fontFamily: "Poppins_700Bold", color: Colors.white },
  accessSub: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.85)", lineHeight: 16 },
  entryScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary + "30",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  entryScanText: { flex: 1, fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.primary },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  statsRow: { flexDirection: "row", gap: 10, paddingRight: 16, marginBottom: 24 },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    width: 110,
    alignItems: "center",
    gap: 4,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.text },
  statLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center" },
  axisCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  axisNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  axisNumText: { fontSize: 14, fontFamily: "Poppins_700Bold", color: Colors.white },
  axisTitle: { flex: 1, fontSize: 13, fontFamily: "Poppins_400Regular", color: Colors.text, lineHeight: 20 },
  pricingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pricingHeader: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pricingHeadCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
    textAlign: "center",
  },
  pricingRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  pricingRowAlt: { backgroundColor: Colors.lightGray },
  pricingCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
    textAlign: "center",
  },
  scannerBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  scannerBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  scannerBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  welcomeToast: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  welcomeToastGrad: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  welcomeToastText: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
