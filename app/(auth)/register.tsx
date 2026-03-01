import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, Alert, Platform, ActivityIndicator,
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
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    academic_degree: "",
    category: "estudante",
    affiliation: "externo",
    institution: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim() || !form.institution.trim()) {
      Alert.alert("Erro", "Por favor preencha todos os campos obrigatórios");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Erro", "As palavras-passe não coincidem");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("Erro", "A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }
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
      Alert.alert("Erro", err.message || "Erro ao registar");
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
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
          <Text style={styles.subtitle}>Preencha os dados para se registar</Text>
        </View>

        <View style={styles.card}>
          <InputField icon="person-outline" label="Nome Completo *" placeholder="O seu nome completo" value={form.full_name} onChangeText={set("full_name")} />
          <InputField icon="mail-outline" label="Email *" placeholder="seuemail@exemplo.com" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
          <InputField icon="business-outline" label="Instituição de Origem *" placeholder="Nome da sua instituição" value={form.institution} onChangeText={set("institution")} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grau Académico</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              <View style={styles.hRow}>
                {DEGREES.map(d => (
                  <SelectButton key={d} label={d} selected={form.academic_degree === d} onPress={() => set("academic_degree")(d)} />
                ))}
              </View>
            </ScrollView>
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Palavra-passe *</Text>
            <View style={styles.inputWrapper}>
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
          </View>

          <InputField icon="lock-closed-outline" label="Confirmar Palavra-passe *" placeholder="Repita a palavra-passe" value={form.confirmPassword} onChangeText={set("confirmPassword")} secureTextEntry />

          <Pressable
            style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.85 }]}
            onPress={handleRegister}
            disabled={loading}
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
                <Text style={styles.registerBtnText}>Criar Conta</Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem conta? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.loginLink}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function InputField({ icon, label, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
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
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.6)",
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
});
