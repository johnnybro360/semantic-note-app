import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    type AppStateStatus,
    Pressable,
    Text,
    View,
} from "react-native";

import * as LocalAuthentication from "expo-local-authentication";

export function BiometricAppLock({ children }: PropsWithChildren) {
  const [isLocked, setIsLocked] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const authenticationInProgressRef = useRef(false);

  const authenticate = useCallback(async () => {
    if (authenticationInProgressRef.current) {
      return;
    }

    authenticationInProgressRef.current = true;
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      if (!hasHardware) {
        setErrorMessage(
          "Biometric authentication is not available on this device.",
        );
        return;
      }

      if (!isEnrolled) {
        setErrorMessage(
          "Set up fingerprint or face authentication in Android settings first.",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Notes",
        promptSubtitle: "Authenticate to access your notes",
        cancelLabel: "Cancel",
        biometricsSecurityLevel: "strong",
      });

      if (result.success) {
        setIsLocked(false);
        setErrorMessage(null);
        return;
      }

      const wasCancelled = [
        "user_cancel",
        "system_cancel",
        "app_cancel",
      ].includes(result.error);

      if (!wasCancelled) {
        setErrorMessage("Authentication failed. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Biometric authentication failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not start biometric authentication.",
      );
    } finally {
      authenticationInProgressRef.current = false;
      setIsAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    void authenticate();
  }, [authenticate]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      // Android's biometric system screen can temporarily change AppState.
      if (authenticationInProgressRef.current) {
        return;
      }

      if (nextState !== "active") {
        setIsLocked(true);
        return;
      }

      if (previousState !== "active") {
        setIsLocked(true);
        void authenticate();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [authenticate]);

  return (
    <View className="flex-1">
      <View
        className="flex-1"
        importantForAccessibility={isLocked ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>

      {isLocked ? (
        <View className="absolute inset-0 z-50 items-center justify-center bg-slate-950 px-8">
          <Text className="text-3xl font-bold text-white">Notes locked</Text>

          <Text className="mt-3 text-center text-base leading-6 text-slate-400">
            Authenticate with your fingerprint or face to access your notes.
          </Text>

          {errorMessage ? (
            <Text className="mt-4 text-center text-sm leading-5 text-red-400">
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            className={`mt-8 min-w-48 items-center rounded-xl bg-blue-500 px-6 py-4 ${
              isAuthenticating ? "opacity-50" : "active:bg-blue-600"
            }`}
            disabled={isAuthenticating}
            onPress={() => void authenticate()}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-semibold text-white">Unlock</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
