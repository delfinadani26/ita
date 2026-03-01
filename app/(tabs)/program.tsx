import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

interface ProgramItem {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  is_completed: boolean;
}

export default function ProgramScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: program, isLoading } = useQuery<ProgramItem[]>({
    queryKey: ["/api/program"],
  });

  const toggleComplete = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/program/${id}/toggle`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program"] });
    },
  });

  if (user?.payment_status !== "paid" && user?.payment_status !== "exempt" && user?.role !== "admin") {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={64} color={Colors.mediumGray} />
        <Text style={styles.lockedText}>Acesso Restrito</Text>
        <Text style={styles.lockedSub}>O programa está disponível apenas para participantes com inscrição confirmada.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ProgramItem }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>
          {new Date(item.date).toLocaleString("pt-PT", { 
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
          })} - {item.location}
        </Text>
        <Text style={styles.itemDesc}>{item.description}</Text>
      </View>
      {user?.role === "admin" && (
        <Pressable 
          onPress={() => toggleComplete.mutate(item.id)}
          style={[styles.checkBtn, item.is_completed && styles.checkBtnDone]}
        >
          <Ionicons 
            name={item.is_completed ? "checkmark-circle" : "ellipse-outline"} 
            size={28} 
            color={item.is_completed ? Colors.success : Colors.mediumGray} 
          />
        </Pressable>
      )}
      {user?.role !== "admin" && item.is_completed && (
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-done" size={16} color={Colors.success} />
          <Text style={styles.statusText}>Concluído</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={program}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>O programa será publicado em breve.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  lockedText: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.text, marginTop: 20 },
  lockedSub: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center", marginTop: 10 },
  list: { padding: 16 },
  card: { 
    backgroundColor: Colors.white, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    flexDirection: "row", 
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.text },
  itemDate: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.primary, marginVertical: 4 },
  itemDesc: { fontSize: 13, fontFamily: "Poppins_400Regular", color: Colors.textSecondary },
  checkBtn: { padding: 8 },
  checkBtnDone: {},
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.success + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, color: Colors.success, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 40, color: Colors.mediumGray, fontFamily: "Poppins_400Regular" },
});
