import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, MOCK_RIDES } from '../types';
import Button from '../components/UI/Button';
import { on as onEvent } from '../utils/events';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

// ─── Haversine: distância em km entre dois pontos ────────────────────────────
function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Sub-componente: Avatar com iniciais ─────────────────────────────────────
function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Sub-componente: Estrelas ─────────────────────────────────────────────────
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

// ─── Sub-componente: Card de carona ──────────────────────────────────────────
function RideCard({
  ride,
  onAccept,
  accepted,
  onPress,
}: {
  ride: (typeof MOCK_RIDES)[0];
  onAccept: (id: string) => void;
  accepted?: boolean;
  onPress?: (ride: (typeof MOCK_RIDES)[0]) => void;
}) {
  const isOffer = (ride.type || '').toLowerCase().includes('oferece');
  const tagColor = isOffer ? COLORS.green : COLORS.orange;
  const tagBg = isOffer ? 'rgba(34,197,94,0.1)' : 'rgba(251,146,60,0.1)';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onPress?.(ride)}
    >
      {/* Header: tag + estrelas */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardTagBadge, { backgroundColor: tagBg }]}>
          <Text style={[styles.cardTag, { color: tagColor }]}>{ride.type}</Text>
        </View>
        <Stars count={ride.rating} />
      </View>

      {/* Pessoa */}
      <View style={styles.cardPerson}>
        <Avatar initials={ride.initials} size={48} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.cardName}>{ride.name}</Text>
          <Text style={styles.cardCourse}>{ride.course}</Text>
        </View>
      </View>

      {/* Rota visual */}
      <View style={styles.routeContainer}>
        <View style={styles.routeDots}>
          <Ionicons name="navigate" size={14} color={COLORS.primaryLight} />
          <View style={styles.routeLine} />
          <Ionicons name="location" size={14} color={COLORS.primaryLight} />
        </View>
        <View style={styles.routeTexts}>
          <Text style={styles.routeOrigin}>{ride.origin}</Text>
          <Text style={styles.routeDest}>{ride.destination}</Text>
        </View>
      </View>

      {/* Meta: data + hora */}
      <View style={styles.cardMeta}>
        <View style={styles.cardMetaItem}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.cardMetaText}>{ride.date}</Text>
        </View>
        <View style={styles.cardMetaDivider} />
        <View style={styles.cardMetaItem}>
          <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.cardMetaText}>{ride.time}</Text>
        </View>
      </View>

      {/* Botão */}
      <Button
        title={accepted ? 'Aceita' : 'Aceitar carona'}
        onPress={() => !accepted && onAccept(ride.id)}
        disabled={!!accepted}
        icon={accepted ? 'checkmark-circle' : 'checkmark-circle-outline'}
        style={[styles.acceptButton, accepted && styles.acceptedButton]}
        textStyle={[styles.acceptButtonText, accepted && styles.acceptedButtonText]}
      />
    </TouchableOpacity>
  );
}

// ─── Filtro de raio ───────────────────────────────────────────────────────────
const RADIUS_OPTIONS = [5, 10, 15, 20, 30, 50] as const;
type RadiusOption = (typeof RADIUS_OPTIONS)[number] | null;

function RadiusFilter({
  selected,
  onChange,
  locationGranted,
}: {
  selected: RadiusOption;
  onChange: (r: RadiusOption) => void;
  locationGranted: boolean;
}) {
  if (!locationGranted) {
    return (
      <View style={styles.radiusUnavailable}>
        <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
        <Text style={styles.radiusUnavailableText}>
          Permita o acesso à localização para filtrar por raio
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.radiusRow}>
      <Ionicons name="radio-outline" size={16} color={COLORS.primaryLight} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.radiusScroll}
      >
        {/* Chip "Todos" */}
        <TouchableOpacity
          style={[styles.radiusChip, selected === null && styles.radiusChipActive]}
          onPress={() => onChange(null)}
        >
          <Text
            style={[
              styles.radiusChipText,
              selected === null && styles.radiusChipTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        {RADIUS_OPTIONS.map((km) => (
          <TouchableOpacity
            key={km}
            style={[styles.radiusChip, selected === km && styles.radiusChipActive]}
            onPress={() => onChange(km === selected ? null : km)}
          >
            <Text
              style={[
                styles.radiusChipText,
                selected === km && styles.radiusChipTextActive,
              ]}
            >
              {km} km
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
type Tab = 'Todas' | 'Pedidas' | 'Oferecidas';

interface HomeScreenProps {
  userName?: string;
  onNavigate?: (screen: string) => void;
}

export default function HomeScreen({
  onNavigate,
  navigation,
}: HomeScreenProps & { navigation?: any }) {
  const [userName, setUserName] = useState('...');
  const [activeTab, setActiveTab] = useState<Tab>('Todas');
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [rides, setRides] = useState([] as typeof MOCK_RIDES);

  // ── Localização e filtro por raio ──────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState<RadiusOption>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationGranted(false);
        return;
      }
      setLocationGranted(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    })();
  }, []);

  // ── Usuário ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          setUserName(parsedUser.name);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadUser();
  }, []);

  // ── Caronas ────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await fetch(`${API_BASE}/rides`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          if (!res.ok) return;

          const formattedRides = data.rides.map((ride: any) => {
            const dateObj = new Date(ride.departure_time);
            return {
              id: String(ride.id),
              type: ride.is_offer ? 'OFERECE CARONA' : 'PROCURA CARONA',
              name: ride.name,
              initials: ride.name
                .split(' ')
                .map((n: string) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase(),
              course: ride.destination_campus,
              // Mantém lat/lng separados para o cálculo de distância
              originLat: parseFloat(ride.origin_lat),
              originLng: parseFloat(ride.origin_lng),
              origin: `Lat: ${ride.origin_lat.toFixed(2)}, Lng: ${ride.origin_lng.toFixed(2)}`,
              destination: ride.destination_campus,
              date: dateObj.toLocaleDateString('pt-BR'),
              time: dateObj.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              rating: 5,
              observations: ride.observations,
              accept_status: ride.accept_status,
            };
          });

          setRides(formattedRides);
        } catch (err) {
          console.error(err);
        }
      })();
    }, [])
  );

  // Remove ride from list when it's marked completed elsewhere
  useEffect(() => {
    const unsub = onEvent('rideCompleted', (id: string) => {
      if (!id) return;
      setRides((r) => r.filter((x) => x.id !== id));
      setAcceptedIds((s) => s.filter((i) => i !== id));
    });
    return () => unsub();
  }, []);

  // ── Accept ─────────────────────────────────────────────────────────────────
  const handleAccept = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE}/ride-accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_ride_posts: id, status: 'accepted' }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data);
        return;
      }
      const ride = rides.find((r) => r.id === id);
      if (!acceptedIds.includes(id)) {
        setAcceptedIds((s) => [...s, id]);
        navigation?.navigate('DetalhesStack', {
          screen: 'Detalhes',
          params: { ride: { ...ride, accept_status: 'accepted' } },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navigateToDetails = (ride: (typeof MOCK_RIDES)[0]) => {
    navigation.navigate('DetalhesStack', {
      screen: 'DetalhesView',
      params: {
        ride,
        canComplete: ride.accept_status === 'accepted',
      },
    });
  };
  // ── Filtro combinado: aba + raio ───────────────────────────────────────────
  const visibleRides = rides.filter((ride) => {
    // Filtro de aba
    if (activeTab === 'Pedidas' && !(ride.type || '').toLowerCase().includes('procura'))
      return false;
    if (activeTab === 'Oferecidas' && !(ride.type || '').toLowerCase().includes('oferece'))
      return false;

    // Filtro de raio (só aplica se tiver raio selecionado + localização disponível)
    if (selectedRadius !== null && userLocation) {
      const lat = (ride as any).originLat;
      const lng = (ride as any).originLng;
      if (lat != null && lng != null) {
        const dist = haversineDistanceKm(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng
        );
        if (dist > selectedRadius) return false;
      }
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header azul */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerAvatarRight}
          onPress={() => navigation?.navigate('Perfil')}
        >
          <Avatar
            initials={userName
              .split(' ')
              .map((s) => s[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
            size={44}
          />
        </TouchableOpacity>
        <Text style={styles.headerGreeting}>Olá, {userName}</Text>
        <Text style={styles.headerTitle}>Solicitações de carona</Text>
        <View style={styles.passengerBadge}>
          <Ionicons name="people" size={16} color={COLORS.white} />
          <Text style={styles.passengerBadgeText}>
            {visibleRides.length} passageiro{visibleRides.length !== 1 ? 's' : ''} aguardando
          </Text>
        </View>
      </View>

      {/* Tabs filtro */}
      <View style={styles.tabsContainer}>
        {(['Todas', 'Pedidas', 'Oferecidas'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtro de raio */}
      <View style={styles.radiusContainer}>
        <RadiusFilter
          selected={selectedRadius}
          onChange={setSelectedRadius}
          locationGranted={locationGranted}
        />
      </View>

      {/* Lista de caronas */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {visibleRides.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>
              Nenhuma carona encontrada{selectedRadius ? ` em até ${selectedRadius} km` : ''}
            </Text>
          </View>
        ) : (
          visibleRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onAccept={handleAccept}
              accepted={
                ride.accept_status === 'accepted' || acceptedIds.includes(ride.id)
              }
              onPress={navigateToDetails}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
export function BottomNav({
  active,
  onNavigate,
}: {
  active: 'Home' | 'Publicar' | 'Avaliacoes' | 'Perfil';
  onNavigate?: (screen: string) => void;
}) {
  const items = [
    { key: 'Home', label: 'Início', icon: 'home-outline', iconActive: 'home' },
    { key: 'Publicar', label: 'Publicar', icon: 'add-outline', iconActive: 'add' },
    { key: 'Avaliacoes', label: 'Avaliações', icon: 'star-outline', iconActive: 'star' },
    { key: 'Perfil', label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
  ] as const;

  return (
    <View style={navStyles.container}>
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={navStyles.item}
            onPress={() => onNavigate?.(item.key)}
          >
            <Ionicons
              name={isActive ? item.iconActive : item.icon}
              size={22}
              color={isActive ? COLORS.primaryLight : COLORS.textLight}
            />
            <Text style={[navStyles.label, isActive && navStyles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const navStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 8,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  labelActive: {
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
});

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
  headerAvatarRight: {
    position: 'absolute',
    right: 18,
    top: 18,
    zIndex: 20,
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
    marginBottom: 14,
  },
  passengerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  passengerBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // Raio
  radiusContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radiusScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  radiusChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryLight,
  },
  radiusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  radiusChipTextActive: {
    color: COLORS.white,
  },
  radiusUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  radiusUnavailableText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 10,
  },
  avatar: {
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardCourse: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Rota visual
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 12,
  },
  routeDots: {
    alignItems: 'center',
    gap: 2,
  },
  routeLine: {
    width: 1.5,
    height: 18,
    backgroundColor: COLORS.border,
  },
  routeTexts: {
    flex: 1,
    gap: 8,
  },
  routeOrigin: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  routeDest: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Meta
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardMetaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  cardMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Botão
  acceptButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  acceptedButton: {
    backgroundColor: COLORS.green,
  },
  acceptedButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
