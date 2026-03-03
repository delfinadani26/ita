/**
 * 🔌 CIRCUIT BREAKER HOOK
 * 
 * Protege contra rate limit:
 * - Detecta erros de rate limit
 * - Desabilita requisições temporariamente
 * - Auto-reset depois de tempo
 */

import { useState, useCallback, useEffect } from "react";

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  nextRetryTime: number | null;
}

export function useCircuitBreaker(
  errorThreshold: number = 3,
  resetTimeMs: number = 60000 // 1 minuto
) {
  const [failureCount, setFailureCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [nextRetryTime, setNextRetryTime] = useState<number | null>(null);

  // 🔄 Efeito para resetar automaticamente
  useEffect(() => {
    if (!isOpen || !nextRetryTime) return;

    // Atualiza a cada segundo para mostrar countdown
    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = nextRetryTime - now;

      if (timeLeft <= 0) {
        // Reset automático
        setIsOpen(false);
        setFailureCount(0);
        setNextRetryTime(null);
        clearInterval(interval);
      }
    }, 100); // Atualiza a cada 100ms para ser preciso

    return () => clearInterval(interval);
  }, [isOpen, nextRetryTime]);

  // ❌ Registra falha
  const recordFailure = useCallback(() => {
    setFailureCount((prev) => {
      const newCount = prev + 1;

      if (newCount >= errorThreshold) {
        const retryTime = Date.now() + resetTimeMs;
        setIsOpen(true);
        setNextRetryTime(retryTime);
      }

      return newCount;
    });
  }, [errorThreshold, resetTimeMs]);

  // ✅ Registra sucesso
  const recordSuccess = useCallback(() => {
    setFailureCount(0);
    setIsOpen(false);
    setNextRetryTime(null);
  }, []);

  // 🔄 Reset manual
  const reset = useCallback(() => {
    setFailureCount(0);
    setIsOpen(false);
    setNextRetryTime(null);
  }, []);

  // ⏱️ Tempo até próxima tentativa (em segundos)
  const secondsUntilRetry = nextRetryTime
    ? Math.max(0, Math.ceil((nextRetryTime - Date.now()) / 1000))
    : 0;

  return {
    isOpen,
    failureCount,
    secondsUntilRetry,
    recordFailure,
    recordSuccess,
    reset,
  };
}

/**
 * Hook para Exponential Backoff
 * Aguarda progressivamente mais tempo a cada tentativa
 */
export function useExponentialBackoff(baseDelayMs: number = 1000) {
  const [attempt, setAttempt] = useState(0);

  const delay = (attemptNum?: number): Promise<void> => {
    const num = attemptNum ?? attempt;
    const delayTime = baseDelayMs * Math.pow(2, num);
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  };

  const reset = () => setAttempt(0);
  const increment = () => setAttempt((a) => a + 1);

  return { attempt, delay, reset, increment };
}
