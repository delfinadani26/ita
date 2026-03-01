import React from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: threads = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 10000,
  });

  const roleLabel = (role: string) => {
    if (role === "admin") return "Administrador";
    if (role === "avaliador") return "Avaliador";
    return "Participante";
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensagens</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentInsetAdjustmentBehavior="automatic"
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : threads.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={56} color={Colors.mediumGray} />
            <Text style={styles.emptyTitle}>Sem mensagens</Text>
            <Text style={styles.emptyText}>
              As mensagens aparecerão aqui quando interagir com avaliadores ou participantes.
            </Text>
          </View>
        ) : (
          threads.map((thread) => (
            <Pressable
              key={thread.other_user}
              style={({ pressed }) => [styles.threadCard, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(`/chat/${thread.other_user}`)}
            >
              <View style={styles.threadAvatar}>
                <Text style={styles.threadAvatarText}>
                  {(thread.other_name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                </Text>
              </View>
              <View style={styles.threadInfo}>
                <View style={styles.threadTop}>
                  <Text style={styles.threadName} numberOfLines={1}>{thread.other_name}</Text>
                  <Text style={styles.threadTime}>
                    {new Date(thread.last_at).toLocaleDateString("pt-PT")}
                  </Text>
                </View>
                <View style={styles.threadBottom}>
                  <Text style={styles.threadRole}>{roleLabel(thread.other_role)}</Text>
                </View>
                <Text style={styles.threadMessage} numberOfLines={1}>{thread.last_message}</Text>
              </View>
              {parseInt(thread.unread_count) > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{thread.unread_count}</Text>
                </View>
              )}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  threadCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  threadAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  threadAvatarText: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.white },
  threadInfo: { flex: 1 },
  threadTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  threadName: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.text, flex: 1 },
  threadTime: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textLight, marginLeft: 4 },
  threadBottom: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 },
  threadRole: { fontSize: 11, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  threadMessage: { fontSize: 13, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, marginTop: 3 },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { fontSize: 11, fontFamily: "Poppins_700Bold", color: Colors.white },
});
