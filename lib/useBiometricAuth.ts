import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

export interface BiometricCredentials {
  email: string;
  password: string;
}

export interface BiometricInfo {
  available: boolean;
  biometryType: "fingerprint" | "facial" | "iris" | "none";
  isEnabled: boolean;
}

const BIOMETRIC_ENABLED_KEY = "biometric_enabled";
const BIOMETRIC_CREDENTIALS_KEY = "biometric_credentials";
const BIOMETRIC_EMAIL_KEY = "biometric_email";

export function useBiometricAuth() {
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    available: false,
    biometryType: "none",
    isEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 1. Verificar disponibilidade de biometria
  const checkBiometricAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setBiometricInfo({
          available: false,
          biometryType: "none",
          isEnabled: false,
        });
        return false;
      }

      const enrolledBiometrics = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometryType: "fingerprint" | "facial" | "iris" | "none" = "none";

      if (enrolledBiometrics.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = "facial";
      } else if (enrolledBiometrics.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometryType = "fingerprint";
      } else if (enrolledBiometrics.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometryType = "iris";
      }

      // ✅ Verificar se biometria está habilitada para este user
      const isEnabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);

      setBiometricInfo({
        available: true,
        biometryType,
        isEnabled: isEnabled === "true",
      });

      return true;
    } catch (error) {
      console.error("Erro ao verificar biometria:", error);
      setBiometricInfo({
        available: false,
        biometryType: "none",
        isEnabled: false,
      });
      return false;
    }
  }, []);

  // ✅ 2. Ativar biometria (após login bem-sucedido)
  const enableBiometric = useCallback(async (credentials: BiometricCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        throw new Error("Dispositivo não suporta biometria");
      }

      // 📦 Armazenar credenciais de forma segura
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify(credentials)
      );
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, credentials.email);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");

      // ✅ Atualizar estado local
      await checkBiometricAvailability();
      return true;
    } catch (error) {
      console.error("Erro ao ativar biometria:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkBiometricAvailability]);

  // ✅ 3. Desativar biometria
  const disableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);

      setBiometricInfo(prev => ({ ...prev, isEnabled: false }));
      return true;
    } catch (error) {
      console.error("Erro ao desativar biometria:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ 4. Autenticar com biometria
  const authenticateWithBiometric = useCallback(async (): Promise<BiometricCredentials | null> => {
    try {
      setIsLoading(true);

      // ✅ Verificar se biometria está habilitada
      const isEnabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      if (isEnabled !== "true") {
        throw new Error("Biometria não está habilitada");
      }

      // ✅ Autenticar com o dispositivo
      const biometryType = biometricInfo.biometryType;

      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        requireConfirmation: true,
      });

      if (!result.success) {
        throw new Error("Autenticação biométrica falhou");
      }

      // ✅ Recuperar credenciais armazenadas
      const credentialsJson = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!credentialsJson) {
        throw new Error("Credenciais não encontradas");
      }

      const credentials: BiometricCredentials = JSON.parse(credentialsJson);
      return credentials;
    } catch (error) {
      console.error("Erro na autenticação biométrica:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [biometricInfo.biometryType]);

  // ✅ 5. Verificar se há credenciais armazenadas
  const hasStoredCredentials = useCallback(async (): Promise<boolean> => {
    try {
      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const credentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      return !!(email && credentials);
    } catch {
      return false;
    }
  }, []);

  // ✅ 6. Obter email armazenado (para pré-preencher)
  const getStoredEmail = useCallback(async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    } catch {
      return null;
    }
  }, []);

  // ✅ 7. Inicializar ao montar
  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  return {
    biometricInfo,
    isLoading,
    checkBiometricAvailability,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    hasStoredCredentials,
    getStoredEmail,
  };
}
