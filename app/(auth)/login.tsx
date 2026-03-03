import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, Platform, ActivityIndicator, Modal, SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useBiometricAuth } from "@/lib/useBiometricAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const { biometricInfo, isLoading: biometricLoading, authenticateWithBiometric, hasStoredCredentials, getStoredEmail, enableBiometric } = useBiometricAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);

  // ✅ INIT: Verificar se tem credenciais biométricas armazenadas
  useEffect(() => {
    const checkCredentials = async () => {
      const hasCredentials = await hasStoredCredentials();
      setHasBiometricCredentials(hasCredentials);
      
      if (hasCredentials) {
        const storedEmail = await getStoredEmail();
        if (storedEmail) setEmail(storedEmail);
      }
    };
    checkCredentials();
  }, [hasStoredCredentials, getStoredEmail]);

  // ✅ LOGIN com biometria
  const handleBiometricLogin = async () => {
    if (biometricLoading) return;
    
    // Mostrar tela de autenticação biométrica profissional
    setShowBiometricAuth(true);
    
    // Pequeno delay para transição visual
    setTimeout(async () => {
      setLoading(true);
      try {
        const credentials = await authenticateWithBiometric();
        
        if (!credentials) {
          throw new Error("Autenticação biométrica falhou. Tente novamente.");
        }

        // ✅ Fazer login com credenciais recuperadas
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Operação expirada. Tente novamente.")), 15000)
        );
        
        await Promise.race([
          login(credentials.email, credentials.password),
          timeoutPromise
        ]);
        
        setShowBiometricAuth(false);
        router.replace("/(tabs)");
      } catch (err: any) {
        setShowBiometricAuth(false);
        const msg = (err.message || "Erro na autenticação").toLowerCase();
        let errorMsg = "Erro na autenticação biométrica";
        
        if (msg.includes("autenticação biométrica falhou")) {
          errorMsg = "Autenticação biométrica foi cancelada ou não reconhecida.";
        } else if (msg.includes("credenciais inválidas")) {
          errorMsg = "Suas credenciais armazenadas não são mais válidas. Faça login manualmente.";
        } else if (msg.includes("aguarda aprovação")) {
          errorMsg = "Sua inscrição aguarda aprovação do administrador.";
        } else if (msg.includes("foi rejeitada")) {
          errorMsg = "Sua inscrição foi rejeitada.";
        }
        
        setErrorMessage(errorMsg);
        setErrorModalVisible(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleLogin = async () => {
    // ⏱️ THROTTLE: Se já está enviando, não faz novamente
    if (isSubmitting) return;
    
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor preencha todos os campos");
      setErrorModalVisible(true);
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Operação expirada. Tente novamente.")), 15000)
      );
      
      await Promise.race([
        login(email.trim().toLowerCase(), password),
        timeoutPromise
      ]);

      // ✅ Oferecer ativar biometria após login bem-sucedido
      if (biometricInfo.available && !biometricInfo.isEnabled) {
        // Mostrar prompt para ativar biometria (opcional)
        setShowBiometricPrompt(true);
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const msg = (err.message || "Credenciais inválidas").toLowerCase();
      
      let errorMsg = "Credenciais inválidas";
      
      // ✅ MENSAGENS ESPECÍFICAS
      if (msg.includes("aguarda aprovação")) {
        errorMsg = "Sua inscrição aguarda aprovação do administrador.\n\nReceberá um email assim que for aprovado.";
      } else if (msg.includes("foi rejeitada")) {
        errorMsg = "Sua inscrição foi rejeitada pelo administrador.\n\nContacte o suporte para mais informações.";
      } else if (msg.includes("rate limit")) {
        errorMsg = "Limite de requisições do servidor atingido. Aguarde alguns minutos antes de tentar novamente.";
      } else if (msg.includes("invalid") || msg.includes("wrong") || msg.includes("credentials")) {
        errorMsg = "Email ou palavra-passe incorretos.";
      } else if (msg.includes("email not found") || msg.includes("not found") || msg.includes("user not")) {
        errorMsg = "Este email não está registado. Crie uma conta primeiro.";
      } else if (msg.includes("network") || msg.includes("timeout")) {
        errorMsg = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (msg.includes("expirada")) {
        errorMsg = "Operação expirada. Tente novamente.";
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

  const handleEnableBiometric = async () => {
    try {
      await enableBiometric({ email: email.trim().toLowerCase(), password });
      setShowBiometricPrompt(false);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erro ao ativar biometria:", error);
      // Mesmo com erro, deixar o user continuar
      setShowBiometricPrompt(false);
      router.replace("/(tabs)");
    }
  };

  const handleSkipBiometric = () => {
    setShowBiometricPrompt(false);
    router.replace("/(tabs)");
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
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.accent }}>CSA</Text>
          </View>
          <Text style={styles.title}>Bem-vindo</Text>
          <Text style={styles.subtitle}>Inicie sessão para continuar</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor={Colors.mediumGray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Palavra-passe</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.mediumGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Biometric Login Button */}
          {biometricInfo.available && biometricInfo.isEnabled && hasBiometricCredentials && (
            <Pressable
              style={({ pressed }) => [
                styles.biometricBtn,
                (biometricLoading || isSubmitting) && { opacity: 0.6 },
                pressed && !biometricLoading && !isSubmitting && { opacity: 0.85 }
              ]}
              onPress={handleBiometricLogin}
              disabled={biometricLoading || isSubmitting}
            >
              <Ionicons 
                name={biometricInfo.biometryType === "facial" ? "shield-checkmark" : "finger-print"} 
                size={24} 
                color={Colors.accent} 
              />
              <Text style={styles.biometricBtnText}>
                Entrar com {biometricInfo.biometryType === "facial" ? "Face ID" : biometricInfo.biometryType === "fingerprint" ? "Touch ID" : "Biometria"}
              </Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.loginBtn,
              (loading || isSubmitting) && { opacity: 0.6 },
              pressed && !loading && !isSubmitting && { opacity: 0.85 }
            ]}
            onPress={handleLogin}
            disabled={loading || isSubmitting}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentDark]}
              style={styles.loginBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={Colors.white} size="small" />
                  <Text style={styles.loadingText}>{isSubmitting ? "Processando..." : "Entrando..."}</Text>
                </View>
              ) : (
                <Text style={styles.loginBtnText}>Entrar</Text>
              )}
            </LinearGradient>
          </Pressable>

          {errorMessage && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
              <Text style={styles.infoBoxText}>Dica: Se tiver erro de limite, aguarde alguns minutos ou tente com outro email.</Text>
            </View>
          )}

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Não tem conta? </Text>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.registerLink}>Registar</Text>
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

      {/* Biometric Setup Modal */}
      <Modal
        visible={showBiometricPrompt}
        animationType="fade"
        transparent
        onRequestClose={() => setShowBiometricPrompt(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <View style={[styles.errorIconContainer, { backgroundColor: Colors.accentLight }]}>
              <Ionicons 
                name={biometricInfo.biometryType === "facial" ? "shield-checkmark" : "finger-print"} 
                size={48} 
                color={Colors.accent} 
              />
            </View>
            
            <Text style={styles.errorModalTitle}>Ativar Biometria?</Text>
            <Text style={styles.errorModalMessage}>
              Use {biometricInfo.biometryType === "facial" ? "Face ID" : "Touch ID"} para entrar mais rápido na próxima vez.
            </Text>

            <View style={styles.biometricModalBtns}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
                onPress={handleSkipBiometric}
              >
                <Text style={styles.cancelBtnText}>Mais Tarde</Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [styles.enableBioBtn, pressed && { opacity: 0.8 }]}
                onPress={handleEnableBiometric}
              >
                <Text style={styles.enableBioBtnText}>Ativar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔐 Biometric Authentication Modal - Professional */}
      <Modal
        visible={showBiometricAuth}
        animationType="fade"
        transparent
        onRequestClose={() => !loading && setShowBiometricAuth(false)}
      >
        <View style={styles.bioAuthOverlay}>
          <View style={styles.bioAuthContainer}>
            {/* Logo da Aplicação */}
            <View style={styles.bioAuthLogoBox}>
              <LinearGradient
                colors={[Colors.accent, Colors.accentDark]}
                style={styles.bioAuthLogoBg}
              >
                <Ionicons name="lock-closed-outline" size={40} color={Colors.white} />
              </LinearGradient>
            </View>

            {/* Nome da Conferência */}
            <Text style={styles.bioAuthConferenceName}>CSA 2026</Text>

            {/* Título */}
            <Text style={styles.bioAuthTitle}>Autenticação Biométrica</Text>

            {/* Subtítulo */}
            <Text style={styles.bioAuthSubtitle}>
              Faça a sua autenticação biométrica
            </Text>

            {/* Sensor Icon e Instruções */}
            <View style={styles.bioAuthSensorContainer}>
              {loading ? (
                <>
                  <View style={styles.bioAuthPulse}>
                    <Ionicons 
                      name={biometricInfo.biometryType === "facial" ? "shield-checkmark" : "finger-print"}
                      size={64}
                      color={Colors.accent}
                    />
                  </View>
                  <Text style={styles.bioAuthProcessingText}>
                    {biometricInfo.biometryType === "facial" ? "Detectando rosto..." : "Detectando impressão digital..."}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons 
                    name={biometricInfo.biometryType === "facial" ? "shield-checkmark" : "finger-print"}
                    size={80}
                    color={Colors.accent}
                  />
                  <Text style={styles.bioAuthSensorText}>
                    Toque no sensor de {biometricInfo.biometryType === "facial" ? "câmara" : "impressões digitais"}
                  </Text>
                </>
              )}
            </View>

            {/* Botão Alternativo */}
            {!loading && (
              <Pressable
                style={({ pressed }) => [styles.bioAuthFallbackBtn, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  setShowBiometricAuth(false);
                }}
              >
                <Ionicons name="key-outline" size={20} color={Colors.primary} />
                <Text style={styles.bioAuthFallbackBtnText}>Usar Palavra-chave</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  subtitle: {
    fontSize: 14,
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
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 16 },
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
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
  },
  eyeBtn: { padding: 14 },
  loginBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  loginBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  biometricBtn: {
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.lightGray,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  biometricBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.accent,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  adminHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 4,
  },
  adminHintText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.textLight,
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
  biometricModalBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  enableBioBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  enableBioBtnText: {
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

  // 🔐 Biometric Authentication Modal Styles
  bioAuthOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  bioAuthContainer: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  bioAuthLogoBox: {
    marginBottom: 20,
  },
  bioAuthLogoBg: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  bioAuthConferenceName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.accent,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  bioAuthTitle: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  bioAuthSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.textSecondary,
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 20,
  },
  bioAuthSensorContainer: {
    alignItems: "center",
    marginVertical: 24,
    paddingVertical: 20,
  },
  bioAuthPulse: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  bioAuthProcessingText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.accent,
    marginTop: 12,
  },
  bioAuthSensorText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  bioAuthFallbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primaryLight + "20",
    marginTop: 16,
    width: "100%",
  },
  bioAuthFallbackBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
});
