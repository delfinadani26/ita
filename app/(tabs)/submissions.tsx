import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { fetch } from "expo/fetch";
import { LinearGradient } from "expo-linear-gradient";

const AXES = [
  "Ensino e Investigação aplicada ao sector agro-alimentar",
  "Contribuição sector agro na economia nacional",
  "Integração empresarial na criação de políticas de desenvolvimento do sector agro em Angola",
];

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

function StatusBadge({ status }: { status: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] + "20" }]}>
      <View style={[styles.badgeDot, { backgroundColor: STATUS_COLORS[status] }]} />
      <Text style={[styles.badgeText, { color: STATUS_COLORS[status] }]}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

export default function SubmissionsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [selectedAxis, setSelectedAxis] = useState(0);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: submissions = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/submissions"],
  });

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    });
    if (!result.canceled && result.assets?.[0]) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Erro", "O título é obrigatório");
      return;
    }
    setSubmitting(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/submissions", baseUrl);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("abstract", abstract.trim());
      formData.append("keywords", keywords.trim());
      formData.append("thematic_axis", String(selectedAxis + 1));

      if (selectedFile) {
        formData.append("file", {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || "application/octet-stream",
        } as any);
      }

      const res = await fetch(url.toString(), {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao submeter");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setShowForm(false);
      setTitle("");
      setAbstract("");
      setKeywords("");
      setSelectedAxis(0);
      setSelectedFile(null);
      Alert.alert("Sucesso", "Comunicação submetida com sucesso! Aguarde a aprovação.");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao submeter");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Submissões</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setShowForm(!showForm)}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentDark]}
            style={styles.addBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name={showForm ? "close" : "add"} size={22} color={Colors.white} />
            <Text style={styles.addBtnText}>{showForm ? "Fechar" : "Nova"}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentInsetAdjustmentBehavior="automatic"
      >
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nova Comunicação Científica</Text>

            <Text style={styles.formLabel}>Título da Comunicação *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Digite o título da sua comunicação"
              placeholderTextColor={Colors.mediumGray}
              value={title}
              onChangeText={setTitle}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.formLabel}>Resumo</Text>
            <TextInput
              style={[styles.formInput, styles.formInputTall]}
              placeholder="Escreva o resumo da sua comunicação (máx. 300 palavras)"
              placeholderTextColor={Colors.mediumGray}
              value={abstract}
              onChangeText={setAbstract}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.formLabel}>Palavras-Chave</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: agricultura, inovação, sustentabilidade"
              placeholderTextColor={Colors.mediumGray}
              value={keywords}
              onChangeText={setKeywords}
            />
            <Text style={styles.formHint}>Separe as palavras-chave com vírgulas</Text>

            <Text style={styles.formLabel}>Eixo Temático *</Text>
            {AXES.map((axis, i) => (
              <Pressable
                key={i}
                style={[styles.axisOption, selectedAxis === i && styles.axisOptionSelected]}
                onPress={() => setSelectedAxis(i)}
              >
                <View style={[styles.axisRadio, selectedAxis === i && styles.axisRadioSelected]}>
                  {selectedAxis === i && <View style={styles.axisRadioInner} />}
                </View>
                <Text style={[styles.axisOptionText, selectedAxis === i && styles.axisOptionTextSelected]}>
                  {i + 1}. {axis}
                </Text>
              </Pressable>
            ))}

            <Text style={styles.formLabel}>Ficheiro (PDF / DOCX)</Text>
            <Pressable style={styles.filePickerBtn} onPress={pickFile}>
              <Ionicons name="cloud-upload-outline" size={24} color={Colors.primary} />
              <Text style={styles.filePickerText}>
                {selectedFile ? selectedFile.name : "Selecionar ficheiro"}
              </Text>
            </Pressable>
            {selectedFile && (
              <View style={styles.fileInfo}>
                <Ionicons name="document-outline" size={16} color={Colors.success} />
                <Text style={styles.fileInfoText} numberOfLines={1}>{selectedFile.name}</Text>
                <Pressable onPress={() => setSelectedFile(null)}>
                  <Ionicons name="close-circle" size={16} color={Colors.danger} />
                </Pressable>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.submitBtnGrad}>
                {submitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color={Colors.white} />
                    <Text style={styles.submitBtnText}>Submeter</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : submissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color={Colors.mediumGray} />
            <Text style={styles.emptyTitle}>Sem submissões</Text>
            <Text style={styles.emptyText}>Submeta a sua primeira comunicação científica.</Text>
          </View>
        ) : (
          submissions.map((sub) => (
            <Pressable
              key={sub.id}
              style={({ pressed }) => [styles.submissionCard, pressed && { opacity: 0.9 }]}
              onPress={() => router.push(`/submission/${sub.id}`)}
            >
              <View style={styles.submissionTop}>
                <StatusBadge status={sub.status} />
                <Text style={styles.submissionDate}>
                  {new Date(sub.submitted_at).toLocaleDateString("pt-PT")}
                </Text>
              </View>
              <Text style={styles.submissionTitle} numberOfLines={2}>{sub.title}</Text>
              {sub.abstract ? (
                <Text style={styles.submissionAbstract} numberOfLines={2}>{sub.abstract}</Text>
              ) : null}
              {sub.keywords ? (
                <View style={styles.keywordsRow}>
                  <Ionicons name="pricetag-outline" size={12} color={Colors.textLight} />
                  <Text style={styles.keywordsText} numberOfLines={1}>{sub.keywords}</Text>
                </View>
              ) : null}
              <View style={styles.submissionMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="list-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>Eixo {sub.thematic_axis}</Text>
                </View>
                {sub.file_name && (
                  <View style={styles.metaItem}>
                    <Ionicons name="document-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>{sub.file_name}</Text>
                  </View>
                )}
              </View>
              {sub.user_name && (
                <Text style={styles.submissionAuthor}>{sub.user_name}</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={Colors.mediumGray} style={styles.chevron} />
            </Pressable>
          ))
        )}
      </ScrollView>
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
  addBtn: { borderRadius: 20, overflow: "hidden" },
  addBtnGrad: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, gap: 4 },
  addBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  formTitle: { fontSize: 17, fontFamily: "Poppins_700Bold", color: Colors.text, marginBottom: 16 },
  formLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary, marginBottom: 8, marginTop: 12 },
  formHint: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight, marginTop: 4 },
  formInput: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
    minHeight: 48,
  },
  formInputTall: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  axisOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.lightGray,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  axisOptionSelected: { backgroundColor: Colors.primary + "12", borderColor: Colors.primary },
  axisRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.mediumGray,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  axisRadioSelected: { borderColor: Colors.primary },
  axisRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  axisOptionText: { flex: 1, fontSize: 13, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  axisOptionTextSelected: { color: Colors.primary, fontFamily: "Poppins_600SemiBold" },
  filePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary + "40",
    borderStyle: "dashed",
    backgroundColor: Colors.primary + "05",
  },
  filePickerText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.primary, flex: 1 },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.success + "10",
    borderRadius: 8,
  },
  fileInfoText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.success },
  submitBtn: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
  submitBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  submitBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },
  submissionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: "relative",
  },
  submissionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  submissionDate: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textLight },
  submissionTitle: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.text, marginBottom: 4, paddingRight: 20 },
  submissionAbstract: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  keywordsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  keywordsText: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight, flex: 1, fontStyle: "italic" },
  submissionMeta: { flexDirection: "row", gap: 14, flexWrap: "wrap", marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  submissionAuthor: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.textLight, marginTop: 4 },
  chevron: { position: "absolute", right: 14, top: "50%" },
});
