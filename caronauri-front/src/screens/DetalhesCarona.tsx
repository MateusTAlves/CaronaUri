// DetalhesCaronaScreen.tsx
// Tela de detalhes da carona — abre ao clicar em "Aceitar carona" (pode opcionalmente permitir concluir)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from '../components/MapProvider';
import { COLORS } from '../types';
import Button from '../components/UI/Button';
import { emit } from '../utils/events';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipo exportado para uso no Navigator ──────────────────────────────────────
export interface RideDetail {
  id: string;
  name: string;
  initial?: string;
  rating?: number;
  phone?: string;
  type?: 'Pedido de carona' | 'Oferta de carona' | string;
  origin?: string;
  destination?: string;
  date?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
  accept_status?: string;
}

const MOCK_DETAIL: RideDetail = {
  id: '1',
  name: 'Maria Clara',
  initial: 'M',
  rating: 4.6,
  phone: '5499999-0001',
  type: 'Pedido de carona',
  origin: 'URI — Erechim',
  destination: 'Passo Fundo',
  date: '10/04/2026',
  time: '17:30',
};

interface Props {
  ride?: RideDetail;
  onBack?: () => void;
  onComplete?: (id: string) => void;
  canComplete?: boolean;
  showMapActions?: boolean;
}

export default function DetalhesCarona(props: any) {
  // Suporta uso direto (props.ride) e via React Navigation (route.params.ride)
  const initialRide: RideDetail =
    props.ride ??
    props.route?.params?.ride ??
    MOCK_DETAIL;

  const [ride, setRide] = useState<RideDetail>(initialRide);
  const onBack = props.onBack ?? (() => props.navigation?.goBack?.());
  const onComplete = props.onComplete;
  const showMapActions: boolean = true;
  const API_BASE = process.env.EXPO_PUBLIC_API_URL;
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const incoming = props.ride ?? props.route?.params?.ride;
    if (incoming) setRide(incoming);
  }, [props.route?.params?.ride, props.ride]);

  const canComplete =
    props.route?.params?.canComplete ??
    ride?.accept_status === 'accepted';

  const loadRide = async (justAccepted = false) => {
      try {
        if (!ride?.id) return;

        const token = await AsyncStorage.getItem('token');

        const res = await fetch(`${API_BASE}/rides/${ride.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) return;

        const apiRide = data.ride;
        const dateObj = new Date(apiRide.departure_time);

        const formattedRide: RideDetail = {
          id: String(apiRide.id),
          name: apiRide.name,
          accept_status:
            ride?.accept_status === 'accepted'
              ? 'accepted'
              : apiRide.accept_status,
          initial: apiRide.name
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase(),

          rating: 5,
          phone: apiRide.whatsapp,

          type: apiRide.is_offer
            ? 'Oferta de carona'
            : 'Pedido de carona',

          origin: `Lat: ${apiRide.origin_lat}, Lng: ${apiRide.origin_lng}`,
          destination: apiRide.destination_campus,

          date: dateObj.toLocaleDateString('pt-BR'),

          time: dateObj.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),

          latitude: parseFloat(apiRide.origin_lat),
          longitude: parseFloat(apiRide.origin_lng),
        };

        setRide(formattedRide);

      } catch (err) {
        console.error(err);
      }
    };

  useEffect(() => {
    loadRide();
  }, [ride?.id]);

  // Coordenadas com fallback para evitar crash se chegarem undefined
  const lat =
    typeof ride.latitude === 'number' && !isNaN(ride.latitude)
      ? ride.latitude
      : -29.6344;

  const lng =
    typeof ride.longitude === 'number' && !isNaN(ride.longitude)
      ? ride.longitude
      : -52.2682;

  const [mapReady, setMapReady] = useState(false);

  const initials = (ride as any).initials ?? (ride as any).initial ?? (ride.name ? ride.name.split(' ').map((s: string) => s[0]).slice(0,2).join('').toUpperCase() : '');

  const handleWhatsApp = () => {
    const digits = (ride.phone ?? '').replace(/\D/g, '');
    const url = `https://wa.me/55${digits}`;
    Linking.canOpenURL(url).then((ok) => {
      if (ok) Linking.openURL(url);
      else Alert.alert('Erro', 'WhatsApp não está instalado.');
    });
  };

  useEffect(() => {
    if (!mapReady) return;

    // ignora fallback inicial
    if (
      lat === -29.6344 &&
      lng === -52.2682
    ) {
      return;
    }

    mapRef.current?.animateToRegion?.(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  }, [lat, lng, mapReady]);

  const handleRoute = () => {
    const label = encodeURIComponent(ride.origin ?? '');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  const handleOSM = () => {
    Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`
    );
  };

  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleComplete = () => {
    setConfirmVisible(true);
  };

  const confirmComplete = async () => {
    setConfirmVisible(false);

    try {
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(
        `${API_BASE}/rides/${ride.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao concluir carona');
      }

      emit('rideCompleted', ride.id);

      if (onComplete) onComplete(ride.id!);
      else onBack?.();

    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_BASE}/ride-accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_ride_posts: id,
          status: 'accepted',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      // recarrega a lista
      setRide((prev) => prev ? { ...prev, accept_status: 'accepted' } : prev);
      await loadRide(true);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header simplificado: somente título centralizado */}
      <View style={styles.headerCentered}>
        <Text style={styles.headerTitleCentered}>Detalhes da carona</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card passageiro (compacto) */}
        <View style={[styles.card, styles.personCard]}>
          <View style={styles.personRowCompact}>
            <View style={styles.avatarCompact}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.personInfoCompact}>
              <Text style={styles.personName}>{ride.name}</Text>
              <View style={styles.metaRow}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={COLORS.orange} />
                  <Text style={styles.ratingText}>{(ride.rating ?? 0).toFixed(1)}</Text>
                </View>
                <Text style={styles.phoneText}>{ride.phone}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleWhatsApp}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.whatsappButtonText}>Conversar no WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Card trajeto */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TRAJETO</Text>

          {/* <View style={styles.routeRow}>
            <View style={styles.routeIcon}>
              <Ionicons name="location-outline" size={17} color={COLORS.primaryLight} />
            </View>
            <View>
              <Text style={styles.routeLabel}>Origem</Text>
              <Text style={styles.routeValue}>{ride.origin}</Text>
            </View>
          </View> */}

          {/* <View style={styles.routeDivider} /> */}

          <View style={styles.routeRow}>
            <View style={styles.routeIcon}>
              <Ionicons name="navigate-outline" size={17} color={COLORS.primaryLight} />
            </View>
            <View>
              <Text style={styles.routeLabel}>Destino</Text>
              <Text style={styles.routeValue}>{ride.destination}</Text>
            </View>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.routeRow}>
            <View style={styles.routeIcon}>
              <Ionicons name="calendar-outline" size={17} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.routeValue}>{ride.date} • {ride.time}</Text>
          </View>
        </View>

        {/* Card mapa */}
        <View style={styles.card}>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionLabel}>LOCALIZAÇÃO DE ORIGEM</Text>
            <Text style={styles.coordsText}>
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </Text>
          </View>
        <View style={styles.mapContainer}>
          <MapView
            ref={(ref: any) => {
              mapRef.current = ref;
            }}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
          onMapReady={() => {
            setMapReady(true);
          }}
          >
            {mapReady && (
              <Marker
                coordinate={{
                  latitude: lat,
                  longitude: lng,
                }}
                title={ride.origin}
              />
            )}
          </MapView>
        </View>
          {showMapActions && (
            <View style={styles.mapActions}>
              <TouchableOpacity style={styles.routeButton} onPress={handleRoute} activeOpacity={0.85}>
                <Ionicons name="navigate" size={15} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.routeButtonText}>Traçar rota</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.osmButton} onPress={handleOSM} activeOpacity={0.85}>
                <Ionicons name="location-outline" size={15} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                <Text style={styles.osmButtonText}>OpenStreetMap</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botão fixo rodapé (apenas quando permitido) */}
      {canComplete && (
        <View style={styles.footer}>
          <Button title="Marcar como concluída" onPress={handleComplete} fullWidth />
        </View>
      )}

      {!canComplete && (
        <View style={styles.footer}>
            <Button
              title={'Aceitar carona'}
              onPress={() => handleAccept(ride.id)}
              icon={'checkmark-circle-outline'}
              style={[styles.acceptButton]}
              textStyle={[styles.acceptButtonText && styles.acceptedButtonText]}
            />
        </View>
      )}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Marcar como concluída</Text>
            <Text style={styles.confirmMessage}>Deseja concluir esta carona e removê-la da lista?</Text>
            <View style={styles.confirmButtons}>
              <Button title="Cancelar" onPress={() => setConfirmVisible(false)} variant="secondary" style={{ flex: 1, marginRight: 10 }} />
              <Button title="Confirmar" onPress={confirmComplete} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { color: COLORS.white, fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  headerCentered: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitleCentered: { fontSize: 22, fontWeight: '700', color: COLORS.white },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 24 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8 },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primaryLight },
  personInfo: { flex: 1, gap: 3 },
  personName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  phoneText: { fontSize: 13, color: COLORS.textMuted },

  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 10, height: 46,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  whatsappButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  /* Compact person card */
  personCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  personRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInfoCompact: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  whatsappIconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
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

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  routeLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.3 },
  routeValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 1 },
  routeDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 46 },

  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coordsText: { fontSize: 11, color: COLORS.textMuted },
  mapContainer: { borderRadius: 10, overflow: 'hidden', height: 180 },
  map: { flex: 1 },
  mapActions: { flexDirection: 'row', gap: 10 },
  routeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryLight, borderRadius: 10, height: 44,
  },
  routeButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  osmButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, height: 44, backgroundColor: COLORS.white,
  },
  osmButtonText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },

  footer: {
    padding: 16, paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  completeButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  confirmButtons: {
    flexDirection: 'row',
  },
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
