import React, { useState } from "react";
import { 
  View, Text, StyleSheet, FlatList, Pressable, Alert, Modal, 
  TextInput, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/lib/useAccessControl";
import { RestrictedAccessScreen } from "@/components/RestrictedAccessScreen";

interface ProgramItem {
  id: number;
  title: string;
  description?: string;
  date: string;
  location?: string;
  is_completed: boolean;
}

interface ProgramActivity {
  time: string;
  title: string;
}

export default function ProgramScreen() {
  const { user } = useAuth();
  const access = useAccessControl(user);
  const insets = useSafeAreaInsets();
  const [program, setProgram] = useState<ProgramItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [completedItems, setCompletedItems] = useState<{ [key: string]: boolean }>({});

  // ⛔ Bloqueia acesso se participante não aprovado
  if (!access.canViewProgram) {
    return (
      <RestrictedAccessScreen
        title="Programa Indisponível"
        message={access.pendingApprovalMessage}
        icon="calendar-outline"
      />
    );
  }

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    location: "",
    activities: [] as ProgramActivity[],
  });
  const [currentActivityTime, setCurrentActivityTime] = useState("09:00");
  const [currentActivityTitle, setCurrentActivityTitle] = useState("");

  // Load program on mount and subscribe to realtime changes
  React.useEffect(() => {
    loadProgram();
    // ❌ SUPABASE REALTIME DESATIVADO - Migrado para Firebase
  }, []);

  const loadProgram = async () => {
    try {
      setLoading(true);
      // ❌ SUPABASE DESATIVADO - Buscar via API ao invés
      const response = await fetch("http://localhost:5000/api/program", {
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Erro ao buscar programa");
      const data = await response.json();
      setProgram(data || []);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    // ❌ SUPABASE DESATIVADO - Criar endpoints de API para isso
    Alert.alert("Função desativada", "Criar/editar programa está desativado. Use o admin panel.");
    /*
    if (!formData.title.trim() || !formData.date || (formData.activities?.length || 0) === 0) {
      Alert.alert("Erro", "Preencha o título, data e adicione pelo menos 1 atividade");
      return;
    }

    try {
      setLoading(true);
      
      // Format activities as description
      const activitiesText = (formData.activities || [])
        .map(a => `${a.time} - ${a.title}`)
        .join("\n");

      // Use the time of first activity
      const firstActivityTime = (formData.activities && formData.activities[0]) ? formData.activities[0].time : "09:00";
      const dateTime = `${formData.date}T${firstActivityTime}:00`;

      if (editingId) {
        const { error } = await supabase
          .from("congress_program")
          .update({
            title: formData.title,
            description: activitiesText,
            date: dateTime,
            location: formData.location,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("congress_program")
          .insert([{
            title: formData.title,
            description: activitiesText,
            date: dateTime,
            location: formData.location,
            is_completed: false,
          }]);

        if (error) throw error;
      }

      await loadProgram();
      setShowModal(false);
      setFormData({ title: "", date: new Date().toISOString().split('T')[0], location: "", activities: [] });
      setCurrentActivityTime("09:00");
      setCurrentActivityTitle("");
      setEditingId(null);
      Alert.alert("Sucesso", editingId ? "Programa atualizado! ✅" : "Programa criado! ✅");
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
    */
  };

  const handleDeleteEvent = async (id: number) => {
    Alert.alert("Confirmar", "Deseja remover este evento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            // ⛔ SUPABASE DESATIVADO - Migrado para Firebase
            // const { error } = await supabase
            //   .from("congress_program")
            //   .delete()
            //   .eq("id", id);
            // if (error) throw error;
            
            // Chamar API para deletar
            const response = await fetch(`http://localhost:5000/api/program/${id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });
            
            if (!response.ok) throw new Error("Falha ao remover evento");
            await loadProgram();
            Alert.alert("Sucesso", "Evento removido! ✅");
          } catch (error: any) {
            Alert.alert("Erro", error.message);
          }
        },
      },
    ]);
  };

  const handleEditEvent = (item: ProgramItem) => {
    const [date] = item.date.split('T');
    
    // Parse activities from description
    const activities: ProgramActivity[] = [];
    if (item.description) {
      const lines = item.description.split("\n").filter(l => l.trim());
      lines.forEach(line => {
        const match = line.match(/^(\d{2}:\d{2})\s*-\s*(.+)$/);
        if (match) {
          activities.push({ time: match[1], title: match[2] });
        }
      });
    }

    setFormData({
      title: item.title,
      date,
      location: item.location || "",
      activities,
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    // ❌ SUPABASE DESATIVADO
    Alert.alert("Função desativada", "Marcar como completo está desativado. Use o admin panel.");
    /*
    try {
      const { error } = await supabase
        .from("congress_program")
        .update({ is_completed: !completed })
        .eq("id", id);

      if (error) throw error;
      await loadProgram();
      Alert.alert("Sucesso", !completed ? "Programa marcado como completo! ✅" : "Programa desmarcado! 📝");
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
    */
  };

  const handleToggleActivityComplete = (programId: number, activityIndex: number) => {
    const key = `${programId}-${activityIndex}`;
    setCompletedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddActivity = () => {
    if (!currentActivityTime.trim() || !currentActivityTitle.trim()) {
      Alert.alert("Erro", "Preencha a hora e a atividade");
      return;
    }

    // Check if time already exists
    if (formData.activities.some(a => a.time === currentActivityTime)) {
      Alert.alert("Aviso", "Já existe uma atividade nessa hora");
      return;
    }

    const newActivity: ProgramActivity = {
      time: currentActivityTime,
      title: currentActivityTitle,
    };

    // Sort activities by time
    const updatedActivities = [...formData.activities, newActivity].sort((a, b) => 
      a.time.localeCompare(b.time)
    );

    setFormData({ ...formData, activities: updatedActivities });
    setCurrentActivityTime("09:00");
    setCurrentActivityTitle("");
  };

  const handleRemoveActivity = (index: number) => {
    const updatedActivities = formData.activities.filter((_, i) => i !== index);
    setFormData({ ...formData, activities: updatedActivities });
  };

  // Restrict access for non-paid participants
  if (user?.payment_status !== "paid" && user?.payment_status !== "exempt" && user?.role !== "admin") {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={64} color={Colors.mediumGray} />
        <Text style={styles.lockedText}>Acesso Restrito</Text>
        <Text style={styles.lockedSub}>O programa está disponível apenas para participantes com inscrição confirmada.</Text>
      </View>
    );
  }

  const renderProgramItem = ({ item, index }: { item: ProgramItem; index: number }) => {
    const eventDate = new Date(item.date);
    const now = new Date();
    const isUpcoming = eventDate > now;
    const isCompleted = item.is_completed;
    
    // Find next event
    const nextEvent = program?.length > 0 ? program.find(e => !e.is_completed && new Date(e.date) > now) : null;
    const isCurrentEvent = nextEvent?.id === item.id;

    return (
      <View style={styles.timelineContainer}>
        {/* Timeline dot */}
        <View style={styles.timelineMarker}>
          <View 
            style={[
              styles.timelineDot,
              isCurrentEvent && { backgroundColor: Colors.accent, width: 18, height: 18 },
              isCompleted && { backgroundColor: Colors.success },
            ]}
          />
          {isCurrentEvent && <View style={styles.timelinePulse} />}
          {index < (program?.length || 0) - 1 && <View style={styles.timelineLine} />}
        </View>

        {/* Event card */}
        <Pressable 
          style={[
            styles.eventCard,
            isCurrentEvent && styles.eventCardActive,
            isCompleted && styles.eventCardCompleted,
          ]}
          onPress={() => user?.role === "admin" && handleEditEvent(item)}
        >
          {/* Status badge */}
          {isCompleted && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.statusBadgeText}>Realizado</Text>
            </View>
          )}
          {isCurrentEvent && (
            <View style={styles.statusBadgeActive}>
              <Ionicons name="play-circle" size={16} color={Colors.accent} />
              <Text style={styles.statusBadgeActiveText}>Acontecendo agora</Text>
            </View>
          )}

          <View style={styles.eventHeader}>
            <Text style={[styles.eventTitle, isCurrentEvent && { color: Colors.accent }]}>
              {item.title}
            </Text>
            {user?.role === "admin" && (
              <Pressable 
                onPress={() => handleDeleteEvent(item.id)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </Pressable>
            )}
          </View>

          <View style={styles.eventMeta}>
            <Ionicons name="calendar-outline" size={14} color={isCurrentEvent ? Colors.accent : Colors.primary} />
            <Text style={[styles.metaText, isCurrentEvent && { color: Colors.accent, fontFamily: "Poppins_600SemiBold" }]}>
              {eventDate.toLocaleString("pt-PT", { 
                day: "2-digit", month: "2-digit", year: "numeric", 
                hour: "2-digit", minute: "2-digit" 
              })}
            </Text>
          </View>

          {item.location && (
            <View style={styles.eventMeta}>
              <Ionicons name="location-outline" size={14} color={isCurrentEvent ? Colors.accent : Colors.primary} />
              <Text style={[styles.metaText, isCurrentEvent && { color: Colors.accent }]}>{item.location}</Text>
            </View>
          )}

          {item.description && (
            <View style={styles.activitiesProgramList}>
              {item.description.split("\n").filter(l => l.trim()).map((activity, idx, arr) => {
                const match = activity.match(/^(\d{2}:\d{2})\s*-\s*(.+)$/);
                if (!match) return null;
                const [, time, title] = match;
                
                // Check if admin marked this item as complete
                const itemKey = `${item.id}-${idx}`;
                const isItemCompleted = completedItems[itemKey] || false;
                
                // Determina status de cada atividade
                const [activityHour, activityMin] = time.split(":").map(Number);
                const activityTime = new Date(eventDate);
                activityTime.setHours(activityHour, activityMin, 0);
                
                let activityStatus = "waiting"; // Default: aguardando
                if (isItemCompleted) {
                  activityStatus = "completed"; // Admin marcou como completo
                } else if (activityTime < now && !isCompleted) {
                  activityStatus = "progress"; // Em progresso se foi/está passado
                }
                
                // Cores e icones baseados no status
                const statusConfig: any = {
                  completed: {
                    bgColor: `${Colors.success}15`,
                    textColor: Colors.success,
                    icon: "checkmark-circle",
                    label: "Realizado"
                  },
                  progress: {
                    bgColor: `${Colors.accent}15`, 
                    textColor: Colors.accent,
                    icon: "play-circle",
                    label: "Realizando"
                  },
                  waiting: {
                    bgColor: Colors.border,
                    textColor: Colors.mediumGray,
                    icon: "ellipse-outline",
                    label: "Aguardando"
                  }
                };
                
                const config = statusConfig[activityStatus];
                
                return (
                  <View key={idx} style={[styles.activityProgramItem, { backgroundColor: config.bgColor, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      {user?.role === "admin" ? (
                        <Pressable 
                          onPress={() => handleToggleActivityComplete(item.id, idx)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons 
                            name={isItemCompleted ? "checkbox" : "checkbox-outline"} 
                            size={22} 
                            color={isItemCompleted ? Colors.success : Colors.mediumGray}
                          />
                        </Pressable>
                      ) : (
                        <Ionicons name={config.icon} size={18} color={config.textColor} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.activityProgramTime, { color: config.textColor, textDecorationLine: isItemCompleted ? "line-through" : "none" }]}>{time}</Text>
                        <Text style={[styles.activityProgramTitle, { color: config.textColor, marginTop: 2, textDecorationLine: isItemCompleted ? "line-through" : "none" }]}>{title}</Text>
                      </View>
                    </View>
                    {user?.role !== "admin" && activityStatus !== "waiting" && (
                      <View style={{ paddingLeft: 8 }}>
                        <Text style={{ fontSize: 10, color: config.textColor, fontFamily: "Poppins_600SemiBold" }}>
                          {config.label}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {user?.role === "admin" && (
            <>
              {/* Mostrar progresso de itens completos */}
              {item.description && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
                  {(() => {
                    const items = item.description.split("\n").filter(l => l.trim());
                    const completedCount = items.reduce((count, _, idx) => {
                      return count + (completedItems[`${item.id}-${idx}`] ? 1 : 0);
                    }, 0);
                    const totalCount = items.length;
                    
                    return (
                      <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: Colors.textSecondary }}>
                            Progresso: {completedCount}/{totalCount} itens
                          </Text>
                          <Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: completedCount === totalCount ? Colors.success : Colors.accent }}>
                            {Math.round((completedCount / totalCount) * 100)}%
                          </Text>
                        </View>
                        <View style={{ height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden" }}>
                          <View 
                            style={{
                              height: "100%",
                              backgroundColor: completedCount === totalCount ? Colors.success : Colors.accent,
                              width: `${(completedCount / totalCount) * 100}%`
                            }}
                          />
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}
              
              {/* Botão para marcar programa como completo */}
              <Pressable 
                style={[
                  styles.completeBtn, 
                  isCompleted && styles.completeBtnDone,
                  (() => {
                    if (!item.description) return {};
                    const items = item.description.split("\n").filter(l => l.trim());
                    const completedCount = items.reduce((count, _, idx) => {
                      return count + (completedItems[`${item.id}-${idx}`] ? 1 : 0);
                    }, 0);
                    return completedCount < items.length ? { opacity: 0.5 } : {};
                  })()
                ]}
                onPress={() => {
                  if (item.description) {
                    const items = item.description.split("\n").filter(l => l.trim());
                    const completedCount = items.reduce((count, _, idx) => {
                      return count + (completedItems[`${item.id}-${idx}`] ? 1 : 0);
                    }, 0);
                    
                    if (completedCount < items.length) {
                      Alert.alert("Atenção", `Marque todos os ${items.length} itens como completos antes de finalizar o programa.`);
                      return;
                    }
                  }
                  handleToggleComplete(item.id, isCompleted);
                }}
              >
                <Ionicons 
                  name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={isCompleted ? Colors.success : Colors.mediumGray}
                />
                <Text style={[styles.completeBtnText, isCompleted && { color: Colors.success }]}>
                  {isCompleted ? "✓ Programa Completo" : "Marcar Programa Completo"}
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Programa</Text>
          <Text style={styles.headerSub}>{program?.length || 0} eventos agendados</Text>
        </View>
        {user?.role === "admin" && (
          <Pressable 
            style={styles.addBtn}
            onPress={() => {
              setEditingId(null);
              setFormData({ 
                title: "", 
                date: new Date().toISOString().split('T')[0], 
                location: "", 
                activities: [] 
              });
              setShowModal(true);
            }}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </Pressable>
        )}
      </View>

      {/* Program List */}
      <FlatList
        data={program || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProgramItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.mediumGray} />
            <Text style={styles.emptyText}>O programa será publicado em breve</Text>
            {user?.role === "admin" && (
              <Text style={styles.emptySub}>Toque o + para adicionar eventos</Text>
            )}
          </View>
        }
      />

      {/* Admin Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>
                {editingId ? "✏️ Editar Programa" : "➕ Novo Programa"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {editingId ? "Atualize os detalhes do programa" : "Crie um novo programa com horário e atividades"}
              </Text>
            </View>
            <Pressable 
              onPress={() => setShowModal(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {/* Seção 1: Informações Básicas */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.formSectionTitle}>Informações Básicas</Text>
              </View>

              {/* Nome do Programa */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Nome do Programa <Text style={styles.labelRequired}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, !formData.title.trim() && styles.inputWrapperEmpty]}>
                  <Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Dia 1 - Congresso de Ciência"
                    placeholderTextColor={Colors.mediumGray}
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    maxLength={60}
                  />
                  {formData.title.trim() && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  )}
                </View>
                <Text style={styles.charCount}>{formData.title.length}/60 caracteres</Text>
              </View>

              {/* Data */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Data do Programa <Text style={styles.labelRequired}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, !formData.date && styles.inputWrapperEmpty]}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD (ex: 2026-03-05)"
                    placeholderTextColor={Colors.mediumGray}
                    value={formData.date}
                    onChangeText={(text) => setFormData({ ...formData, date: text })}
                    maxLength={10}
                  />
                  {formData.date && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  )}
                </View>
              </View>

              {/* Local */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Local (Opcional)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Auditório Principal, Sala 101"
                    placeholderTextColor={Colors.mediumGray}
                    value={formData.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                    maxLength={50}
                  />
                  {formData.location.trim() && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  )}
                </View>
              </View>
            </View>

            {/* Seção 2: Itens do Programa */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={20} color={Colors.primary} />
                <Text style={styles.formSectionTitle}>Itens da Agenda</Text>
                {(formData.activities?.length || 0) > 0 && (
                  <View style={styles.activityCountBadge}>
                    <Text style={styles.activityCountText}>{formData.activities?.length || 0}</Text>
                  </View>
                )}
              </View>

              {/* Add Activity Form */}
              <View style={styles.addActivityForm}>
                <Text style={styles.instructionText}>Adicione cada atividade com sua hora</Text>
                
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 0.6 }]}>
                    <Text style={styles.smallLabel}>Hora *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="time-outline" size={16} color={Colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { textAlign: "center" }]}
                        placeholder="HH:MM"
                        placeholderTextColor={Colors.mediumGray}
                        value={currentActivityTime}
                        onChangeText={setCurrentActivityTime}
                        maxLength={5}
                      />
                    </View>
                  </View>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.smallLabel}>Atividade *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="star-outline" size={16} color={Colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Abertura, Painel A"
                        placeholderTextColor={Colors.mediumGray}
                        value={currentActivityTitle}
                        onChangeText={setCurrentActivityTitle}
                        maxLength={40}
                      />
                    </View>
                  </View>
                </View>

                <Pressable 
                  style={[
                    styles.addActivityBtn,
                    (!currentActivityTime.trim() || !currentActivityTitle.trim()) && styles.addActivityBtnDisabled
                  ]}
                  onPress={handleAddActivity}
                  disabled={!currentActivityTime.trim() || !currentActivityTitle.trim()}
                >
                  <Ionicons name="add-circle" size={18} color={Colors.white} />
                  <Text style={styles.addActivityBtnText}>Adicionar Atividade</Text>
                </Pressable>
              </View>

              {/* Activities List */}
              {(formData.activities?.length || 0) > 0 ? (
                <View style={styles.activitiesList}>
                  {(formData.activities || []).map((activity, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.activityItem,
                        index === (formData.activities?.length || 0) - 1 && { marginBottom: 0 }
                      ]}
                    >
                      <View style={styles.activityContent}>
                        <View style={styles.activityTimeBox}>
                          <Ionicons name="time" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                          <Text style={styles.activityTime}>{activity.time}</Text>
                        </View>
                        <Text style={styles.activityItemTitle} numberOfLines={1}>{activity.title}</Text>
                      </View>
                      <Pressable 
                        onPress={() => handleRemoveActivity(index)}
                        style={styles.activityRemoveBtn}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyActivities}>
                  <Ionicons name="calendar-clear-outline" size={40} color={Colors.mediumGray} />
                  <Text style={styles.emptyActivitiesText}>Nenhuma atividade adicionada</Text>
                  <Text style={styles.emptyActivitiesHint}>Adicione pelo menos 1 atividade para continuar</Text>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              {(formData.activities?.length || 0) > 0 && (
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              )}
              
              <Pressable 
                style={[
                  styles.submitBtn,
                  (loading || (formData.activities?.length || 0) === 0) && styles.submitBtnDisabled,
                  (formData.activities?.length || 0) > 0 && styles.submitBtnActive
                ]}
                onPress={handleAddEvent}
                disabled={loading || (formData.activities?.length || 0) === 0}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={Colors.white} size="small" />
                    <Text style={styles.submitBtnText}>Salvando...</Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <Ionicons name={editingId ? "checkmark-done" : "cloud-upload-outline"} size={20} color={Colors.white} />
                    <Text style={styles.submitBtnText}>
                      {editingId ? "Atualizar Programa" : "Criar Programa"}
                    </Text>
                  </View>
                )}
              </Pressable>
              
              <Pressable 
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  lockedText: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.text, marginTop: 20 },
  lockedSub: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center", marginTop: 10 },
  
  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 28, fontFamily: "Poppins_700Bold", color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  timelineContainer: { flexDirection: "row", marginBottom: 20 },
  timelineMarker: { alignItems: "center", paddingRight: 16 },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: Colors.border,
    marginTop: 8,
  },
  timelinePulse: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    opacity: 0.3,
    top: 0,
    left: 0,
  },
  
  eventCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventCardActive: {
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}05`,
  },
  eventCardCompleted: {
    backgroundColor: `${Colors.success}08`,
  },
  
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.success}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: "Poppins_600SemiBold",
  },
  statusBadgeActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.accent}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  statusBadgeActiveText: {
    fontSize: 11,
    color: Colors.accent,
    fontFamily: "Poppins_600SemiBold",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eventTitle: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.text, flex: 1 },
  deleteBtn: { padding: 8 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  metaText: { fontSize: 12, color: Colors.primary, fontFamily: "Poppins_500Medium" },
  
  activitiesProgramList: {
    marginTop: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  activityProgramItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  activityProgramTime: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
    minWidth: 45,
  },
  activityProgramTitle: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
    flex: 1,
  },
  
  eventDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 12, lineHeight: 18 },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
  },
  completeBtnDone: {},
  completeBtnText: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Poppins_500Medium" },
  
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderContent: { flex: 1, marginRight: 12 },
  modalTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.text },
  modalSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: `${Colors.primary}10`,
  },
  modalForm: { padding: 16, backgroundColor: Colors.background },
  
  // Form Sections
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  formSectionTitle: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
    flex: 1,
  },
  activityCountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityCountText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  
  // Form Groups
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.text, marginBottom: 8 },
  labelRequired: { color: Colors.danger },
  smallLabel: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.text, marginBottom: 8 },
  
  // Input Styling
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 0,
    backgroundColor: Colors.white,
    height: 48,
  },
  inputWrapperEmpty: {
    borderColor: Colors.mediumGray,
    backgroundColor: `${Colors.primary}05`,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
    padding: 0,
    height: 48,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Poppins_400Regular",
    marginTop: 6,
  },
  instructionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Poppins_400Regular",
    marginBottom: 12,
  },

  // Activities List
  addActivityForm: {
    marginBottom: 16,
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addActivityBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addActivityBtnDisabled: {
    backgroundColor: Colors.mediumGray,
    opacity: 0.6,
  },
  addActivityBtnText: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  activitiesList: {
    gap: 10,
    marginTop: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: 10,
  },
  activityContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityTimeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  activityItemTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  activityRemoveBtn: {
    padding: 8,
    marginLeft: 8,
  },
  emptyActivities: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    marginTop: 12,
  },
  emptyActivitiesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontFamily: "Poppins_500Medium",
  },
  emptyActivitiesHint: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },
  
  // Submit Section
  submitSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    width: "100%",
  },
  submitBtn: {
    backgroundColor: Colors.mediumGray,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    height: 52,
  },
  submitBtnActive: {
    backgroundColor: Colors.primary,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8, justifyContent: "center", flex: 1 },
  emptyText: { fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.textSecondary, textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.textLight, textAlign: "center" },
  submitBtnText: { 
    color: Colors.white, 
    fontFamily: "Poppins_600SemiBold", 
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
});

