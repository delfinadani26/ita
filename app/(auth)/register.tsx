import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, Platform, ActivityIndicator, Modal,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { value: "docente", label: "Docente/Investigador" },
  { value: "estudante", label: "Estudante" },
  { value: "outro", label: "Outro" },
  { value: "preletor", label: "Preletor (Autor)" },
];

const AFFILIATIONS = [
  { value: "urnm", label: "URNM" },
  { value: "externo", label: "Externo" },
];

const DEGREES = [
  "Licenciatura", "Mestrado", "Doutoramento", "Pós-Doutoramento", "Outro"
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function SelectButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.selectBtn, selected && styles.selectBtnActive]}
    >
      {selected && <Ionicons name="checkmark-circle" size={16} color={Colors.white} style={{ marginRight: 4 }} />}
      <Text style={[styles.selectBtnText, selected && styles.selectBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    academic_degree: "",
    category: "docente",
    affiliation: "urnm",
    institution: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 3) {
      newErrors.full_name = "Nome deve ter pelo menos 3 caracteres";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "Formato de email inválido";
    }
    if (!form.institution.trim()) {
      newErrors.institution = "Instituição de origem é obrigatória";
    }
    if (!form.academic_degree) {
      newErrors.academic_degree = "Seleccione o grau académico";
    }
    if (!form.password) {
      newErrors.password = "Palavra-passe é obrigatória";
    } else if (form.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "As palavras-passe não coincidem";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    // ⏱️ THROTTLE: Se já está enviando, não faz novamente
    if (isSubmitting) return;
    
    if (!validate()) {
      setErrorMessage("Por favor corrija os erros assinalados");
      setErrorModalVisible(true);
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        academic_degree: form.academic_degree,
        category: form.category,
        affiliation: form.affiliation,
        institution: form.institution.trim(),
      });
      
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = (err.message || "Erro ao registar").toLowerCase();
      
      let errorMsg = "Erro ao registar";
      
      if (msg.includes("rate limit")) {
        errorMsg = "Limite de requisições do servidor atingido. Aguarde alguns minutos antes de tentar novamente com outro email.";
      } else if (msg.includes("409") || msg.includes("já registado") || msg.includes("already registered")) {
        errorMsg = "Este email já está registado. Faça login ou use outro email.";
      } else if (msg.includes("invalid email")) {
        errorMsg = "Formato de email inválido.";
      } else if (msg.includes("password")) {
        errorMsg = "A palavra-passe deve ter pelo menos 6 caracteres.";
      } else if (msg.includes("network")) {
        errorMsg = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else {
        errorMsg = msg.charAt(0).toUpperCase() + msg.slice(1);
      }
      
      setErrorMessage(errorMsg);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.gradient}
      >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPadding + 20, paddingBottom: bottomPadding + 20 }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <View style={styles.logoBox}>
            <Ionicons name="person-add" size={32} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Congresso sobre Sistemas Alimentares 2026</Text>
        </View>

        <View style={styles.card}>
          <InputField
            icon="person-outline"
            label="Nome Completo *"
            placeholder="O seu nome completo"
            value={form.full_name}
            onChangeText={set("full_name")}
            error={errors.full_name}
          />
          <InputField
            icon="mail-outline"
            label="Email *"
            placeholder="seuemail@exemplo.com"
            value={form.email}
            onChangeText={set("email")}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <InputField
            icon="business-outline"
            label="Instituição de Origem *"
            placeholder="Nome da sua instituição"
            value={form.institution}
            onChangeText={set("institution")}
            error={errors.institution}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grau Académico *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              <View style={styles.hRow}>
                {DEGREES.map(d => (
                  <SelectButton key={d} label={d} selected={form.academic_degree === d} onPress={() => set("academic_degree")(d)} />
                ))}
              </View>
            </ScrollView>
            {errors.academic_degree ? <Text style={styles.errorText}>{errors.academic_degree}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria *</Text>
            <View style={styles.grid2}>
              {CATEGORIES.map(c => (
                <SelectButton key={c.value} label={c.label} selected={form.category === c.value} onPress={() => set("category")(c.value)} />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Filiação *</Text>
            <View style={styles.hRow}>
              {AFFILIATIONS.map(a => (
                <SelectButton key={a.value} label={a.label} selected={form.affiliation === a.value} onPress={() => set("affiliation")(a.value)} />
              ))}
            </View>
            <Text style={styles.affiliationNote}>
              {form.category === "preletor"
                ? "Taxa única de 20.000 Kz independente da filiação"
                : form.affiliation === "urnm"
                ? "Tarifa URNM aplicada"
                : "Tarifa externa aplicada"}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Palavra-passe *</Text>
            <View style={[styles.inputWrapper, errors.password ? styles.inputWrapperError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.mediumGray}
                value={form.password}
                onChangeText={set("password")}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <InputField
            icon="lock-closed-outline"
            label="Confirmar Palavra-passe *"
            placeholder="Repita a palavra-passe"
            value={form.confirmPassword}
            onChangeText={set("confirmPassword")}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Pressable
            style={({ pressed }) => [
              styles.registerBtn,
              (loading || isSubmitting) && { opacity: 0.6 },
              pressed && !loading && !isSubmitting && { opacity: 0.85 }
            ]}
            onPress={handleRegister}
            disabled={loading || isSubmitting}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentDark]}
              style={styles.registerBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.registerBtnText}>{isSubmitting ? "Processando..." : "Criar Conta"}</Text>
              )}
            </LinearGradient>
          </Pressable>

          {errorMessage && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
              <Text style={styles.infoBoxText}>Dica: Se tiver erro de limite, use um email diferente e tente novamente.</Text>
            </View>
          )}

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem conta? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.loginLink}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      </LinearGradient>

      {/* Custom Error Modal */}
      <Modal
        visible={errorModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={48} color={Colors.danger} />
            </View>
            
            <Text style={styles.errorModalTitle}>Erro</Text>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
            
            <Pressable
              style={({ pressed }) => [styles.errorModalBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.errorModalBtnText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function InputField({ icon, label, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, error }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.mediumGray}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize || "words"}
          secureTextEntry={secureTextEntry}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 24 },
  backBtn: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    gap: 4,
  },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
  },
  eyeBtn: { padding: 14 },
  hScroll: { marginTop: 2 },
  hRow: { flexDirection: "row", gap: 8 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  selectBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  selectBtnTextActive: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
  },
  affiliationNote: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textLight,
    fontStyle: "italic",
    marginTop: 6,
  },
  errorText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.danger,
    marginTop: 4,
  },
  registerBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  registerBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  registerBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },

  // Error Modal
  errorModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  errorIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.danger}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorModalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },
  errorModalMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  errorModalBtn: {
    backgroundColor: Colors.danger,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  errorModalBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.info + "15",
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
    marginTop: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.info,
    lineHeight: 16,
  },
});
