import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  MOCK_PENDING_EVALUATIONS,
  MOCK_HISTORY_EVALUATIONS,
} from '../types';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ─── Estrelas interativas ──────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={36}
            color={COLORS.orange}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Estrelas estáticas ────────────────────────────────────────────────────────
function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={14}
          color={COLORS.orange}
        />
      ))}
    </View>
  );
}

// ─── Avatar com iniciais ───────────────────────────────────────────────────────
function Avatar({ initials }: { initials: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Aba Pendentes ─────────────────────────────────────────────────────────────
function PendentesTab() {
  const [selected, setSelected] = useState<string>('1');
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const API_BASE = process.env.EXPO_PUBLIC_API_URL;
  const loadPendingEvaluations = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_BASE}/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      const pending = data.filter(
        (item: any) =>
          item.score === null ||
          item.score === undefined
      )
      .map((item: any) => ({
        ...item,
        initials: item.evaluated_name
          ?.split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((name: string) => name[0].toUpperCase())
          .join('') || '?'
      }));

      setPendingList(pending);

      if (pending.length > 0) {
        setSelected(String(pending[0].id));
      }
      
    } catch (err) {
      console.error(err);

      Alert.alert(
        'Erro',
        'Não foi possível carregar avaliações pendentes'
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPendingEvaluations();
    }, [])
  );

  const handleSubmitEvaluation = async () => {
    try {
      if (!selected) {
        Alert.alert(
          'Atenção',
          'Selecione uma avaliação'
        );

        return;
      }

      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(
        `${API_BASE}/reviews/${selected}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            score: rating,
            comment
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Erro ao enviar avaliação'
        );
      }

  Alert.alert(
    'Sucesso',
    'Avaliação realizada com sucesso!',
    [
      {
        text: 'OK',
        onPress: () => loadPendingEvaluations(),
      },
    ]
  );

      setPendingList((prev) =>
        prev.filter(
          (item) =>
            String(item.id) !== selected
        )
      );

      setComment('');
      setRating(4);

      const remaining = pendingList.filter(
        (item) =>
          String(item.id) !== selected
      );

      if (remaining.length > 0) {
        setSelected(
          String(remaining[0].id)
        );
      } else {
        setSelected('');
      }
    } catch (err) {
      console.error(err);

      Alert.alert(
        'Erro',
        'Não foi possível enviar avaliação'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>CARONAS A AVALIAR</Text>

      {pendingList.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.pendingItem,
            selected === item.id && styles.pendingItemSelected,
          ]}
          onPress={() => setSelected(item.id)}
          activeOpacity={0.8}
        >
          <Avatar initials={item.initials} />
          <View style={styles.pendingItemInfo}>
            <Text style={styles.pendingItemName}>{item.evaluated_name}</Text>
            <Text style={styles.pendingItemRoute}>
              {item.evaluated_email}
            </Text>
          </View>
          <View
            style={[
              styles.radioOuter,
              selected === item.id && styles.radioOuterSelected,
            ]}
          >
            {selected === item.id && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      ))}

      {/* Card de avaliação */}
      <View style={styles.ratingCard}>
        <Text style={styles.ratingTitle}>Sua nota</Text>
        <View style={{ marginTop: 12, marginBottom: 20 }}>
          <StarRating value={rating} onChange={setRating} />
        </View>

        <Text style={styles.fieldLabel}>COMENTÁRIO (OPCIONAL)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Conte como foi a carona..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={handleSubmitEvaluation}>
        <Text style={styles.submitButtonText}>Enviar avaliação</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Aba Histórico ─────────────────────────────────────────────────────────────
function HistoricoTab() {
  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>HISTÓRICO DE AVALIAÇÕES</Text>

      {MOCK_HISTORY_EVALUATIONS.map((item) => (
        <View key={item.id} style={styles.historyCard}>
          <View style={styles.historyCardHeader}>
            <View style={styles.historyCardLeft}>
              <Avatar initials={item.initials} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.pendingItemName}>{item.name}</Text>
                <Text style={styles.pendingItemRoute}>
                  {item.route} • {item.date}
                </Text>
              </View>
            </View>
            <Stars count={item.rating} />
          </View>
          {!!item.comment && (
            <Text style={styles.historyComment}>"{item.comment}"</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
interface AvaliacoesScreenProps {
  userName?: string;
  onNavigate?: (screen: string) => void;
}

export default function AvaliacoesScreen({
  userName = 'João',
  onNavigate,
  navigation,
}: AvaliacoesScreenProps & { navigation?: any }) {
  const [activeTab, setActiveTab] = useState<'Pendentes' | 'Histórico'>(
    'Pendentes',
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Avaliações</Text>
        <Text style={styles.headerSubtitle}>Avalie e veja seu histórico</Text>
        <TouchableOpacity style={styles.headerIconCard} onPress={() => { /* placeholder: avaliações */ }}>
          <Ionicons name="star" size={18} color={COLORS.primaryLight} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['Pendentes', 'Histórico'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conteúdo da aba */}
      {activeTab === 'Pendentes' ? <PendentesTab /> : <HistoricoTab />}

      {/* Bottom tab provided by React Navigation; custom BottomNav removed to avoid duplicate bars */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerIconCard: {
    position: 'absolute',
    right: 18,
    top: 12,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // Tab content
  tabContent: {
    flex: 1,
  },
  tabContentInner: {
    padding: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },

  // Pending items
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 12,
  },
  pendingItemSelected: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#F0F7FF',
  },
  pendingItemInfo: {
    flex: 1,
  },
  pendingItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  pendingItemRoute: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primaryLight,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryLight,
  },

  // Rating card
  ratingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
  },

  // Submit
  submitButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // History
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyComment: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginLeft: 52,
  },
});
