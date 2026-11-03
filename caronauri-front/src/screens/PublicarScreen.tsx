import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../types';
import Button from '../components/UI/Button';
import MapView, { Marker, PROVIDER_DEFAULT } from '../components/MapProvider';
import { lookupCoords, reverseLookupCoords, searchPlaces } from '../utils/geocode';
import { Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
} from 'react-native';
// custom BottomNav removed; using React Navigation tab bar instead

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

type Mode = 'Solicitar' | 'Oferecer';

interface PublicarScreenProps {
  onSubmit?: (data: object) => void;
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export default function PublicarScreen({
  onSubmit,
  onBack,
  onNavigate,
  navigation,
}: PublicarScreenProps & { navigation?: any }) {
  const [mode, setMode] = useState<Mode>('Solicitar');
  const [origin, setOrigin] = useState('');
  const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | null>(lookupCoords('URI — Erechim'));
  const [destination, setDestination] = useState('');
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [notes, setNotes] = useState('');
  // Map selection modal states
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapSearch, setMapSearch] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

  const handleSubmit = () => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE}/rides`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            is_offer: mode === 'Solicitar' ? false : true,
            origin_lat: originCoords?.latitude,
            origin_lng: originCoords?.longitude,
            destination_campus: destination,
            departure_time: selectedDate.toISOString(),
            observations: notes
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Falha ao publicar carona');

        onSubmit?.({ mode, origin, originCoords, destination, datetime: selectedDate.toISOString(), notes });

        Alert.alert(
          'Sucesso',
          mode === 'Solicitar'
            ? 'Solicitação de carona cadastrada com sucesso!'
            : 'Carona publicada com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              })
            },
          ]
        );

      } catch (err) {
        console.error(err);
        Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao publicar carona');
      }
    })();
  };
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === 'Solicitar' ? 'Solicitar Carona' : 'Oferecer Carona'}
          </Text>
          <Text style={styles.headerSubtitle}>Preencha os dados abaixo</Text>
          <TouchableOpacity style={styles.headerIconCard} onPress={() => { /* placeholder: ajuda/publicar */ }}>
            <Ionicons name="map-outline" size={20} color={COLORS.primaryLight} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Toggle Solicitar / Oferecer */}
          <View style={styles.modeToggle}>
            {(['Solicitar', 'Oferecer'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modeButton,
                  mode === m && styles.modeButtonActive,
                ]}
                onPress={() => setMode(m)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={m === 'Solicitar' ? 'person-outline' : 'car-outline'}
                  size={16}
                  color={mode === m ? COLORS.white : COLORS.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === m && styles.modeButtonTextActive,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Origem (editável + lançar mapa) */}
          <View style={[styles.fieldGroup, { marginTop: 6 }]}>
            <Text style={styles.fieldLabel}>ORIGEM</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="navigate-outline"
                size={17}
                color={COLORS.primaryLight}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                value={origin} // <- importante
                onChangeText={(v) => {
                  setOrigin(v);

                  const c = lookupCoords(v);
                  setOriginCoords(c);
                }}
                placeholder="Digite o endereço ou selecione no mapa"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <TouchableOpacity
              style={styles.mapLaunchButton}
              onPress={() => {
                setTempCoords(null);
                setMapModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="map-outline"
                size={16}
                color={COLORS.white}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.mapLaunchButtonText}>
                Selecionar no mapa
              </Text>
            </TouchableOpacity>
          </View>

          {/* Campo Destino (apenas Campus) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>DESTINO (Campus)</Text>
            <TouchableOpacity onPress={() => setShowCampusModal(true)} activeOpacity={0.8}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="location-outline"
                  size={17}
                  color={COLORS.primaryLight}
                  style={styles.inputIcon}
                />
                <Text style={[styles.input, { color: destination ? COLORS.text : COLORS.textLight }]}> 
                  {destination || 'Selecione o campus'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Modal visible={showCampusModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecione o campus</Text>
                {['URI — Erechim', 'Campus Centro — Erechim', 'Campus Santo Antônio — Erechim'].map((c) => (
                  <TouchableOpacity key={c} style={styles.modalItem} onPress={() => { setDestination(c); setShowCampusModal(false); }}>
                    <Text style={styles.modalItemText}>{c}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.modalItem, styles.modalCancel]} onPress={() => setShowCampusModal(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* Campo Horário (data completa) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              HORÁRIO
            </Text>

            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() =>
                setShowDateModal(true)
              }
            >
              <Ionicons
                name="time-outline"
                size={17}
                color={COLORS.primaryLight}
                style={styles.inputIcon}
              />

              <Text style={styles.input}>
                {selectedDate.toLocaleString(
                  'pt-BR'
                )}
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={showDateModal}
            animationType="slide"
            transparent
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Selecionar data e hora
                </Text>

                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontWeight: '600',
                    }}
                  >
                    Data
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                    }}
                  >
                    {/* DIA */}
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="number-pad"
                      placeholder="DD"
                      value={String(
                        selectedDate.getDate()
                      )}
                      onChangeText={(
                        text
                      ) => {
                        const newDate =
                          new Date(
                            selectedDate
                          );

                        newDate.setDate(
                          Number(text) ||
                            1
                        );

                        setSelectedDate(
                          newDate
                        );
                      }}
                    />

                    {/* MÊS */}
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="number-pad"
                      placeholder="MM"
                      value={String(
                        selectedDate.getMonth() +
                          1
                      )}
                      onChangeText={(
                        text
                      ) => {
                        const newDate =
                          new Date(
                            selectedDate
                          );

                        newDate.setMonth(
                          (Number(
                            text
                          ) || 1) - 1
                        );

                        setSelectedDate(
                          newDate
                        );
                      }}
                    />

                    {/* ANO */}
                    <TextInput
                      style={[
                        styles.smallInput,
                        { flex: 1 },
                      ]}
                      keyboardType="number-pad"
                      placeholder="AAAA"
                      value={String(
                        selectedDate.getFullYear()
                      )}
                      onChangeText={(
                        text
                      ) => {
                        const newDate =
                          new Date(
                            selectedDate
                          );

                        newDate.setFullYear(
                          Number(
                            text
                          ) || 2026
                        );

                        setSelectedDate(
                          newDate
                        );
                      }}
                    />
                  </View>

                  <Text
                    style={{
                      fontWeight: '600',
                    }}
                  >
                    Hora
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                    }}
                  >
                    {/* HORA */}
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="number-pad"
                      placeholder="HH"
                      value={String(
                        selectedDate.getHours()
                      ).padStart(2, '0')}
                      onChangeText={(
                        text
                      ) => {
                        const value =
                          Number(text);

                        if (
                          value > 23
                        )
                          return;

                        const newDate =
                          new Date(
                            selectedDate
                          );

                        newDate.setHours(
                          value || 0
                        );

                        setSelectedDate(
                          newDate
                        );
                      }}
                    />

                    {/* MINUTOS */}
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="number-pad"
                      placeholder="MM"
                      value={String(
                        selectedDate.getMinutes()
                      ).padStart(2, '0')}
                      onChangeText={(
                        text
                      ) => {
                        const value =
                          Number(text);

                        if (
                          value > 59
                        )
                          return;

                        const newDate =
                          new Date(
                            selectedDate
                          );

                        newDate.setMinutes(
                          value || 0
                        );

                        setSelectedDate(
                          newDate
                        );
                      }}
                    />
                  </View>
                </View>

                <View
                  style={{
                    marginTop: 16,
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      { flex: 1 },
                    ]}
                    onPress={() =>
                      setShowDateModal(
                        false
                      )
                    }
                  >
                    <Text
                      style={
                        styles.modalItemText
                      }
                    >
                      Fechar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal full-screen para seleção no mapa */}
          <Modal visible={mapModalVisible} animationType="slide" transparent={false}>
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
             <View style={{ flex: 1, position: 'relative' }}>
                <View style={styles.searchBox}>
                  <TextInput
                    placeholder="Digite um endereço para buscar"
                    placeholderTextColor={COLORS.textLight}
                    style={styles.searchInput}
                    value={mapSearch}
                    onChangeText={setMapSearch}
                    onSubmitEditing={async () => {
                      if (!mapSearch.trim()) return;

                      // busca lugares online
                      const results =
                        await searchPlaces(mapSearch);

                      setMapSearchResults(results);

                      // move mapa pro primeiro
                      if (results.length > 0) {
                        const first = results[0];

                        const coords = {
                          latitude: first.latitude,
                          longitude: first.longitude,
                        };

                        setTempCoords(coords);

                        mapRef.current?.animateToRegion(
                          {
                            ...coords,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          },
                          300
                        );
                      }
                    }} />
                </View>
                {mapSearchResults.length > 0 && (
                  <View style={styles.searchResultsContainer}>
                    <ScrollView style={{ maxHeight: 160 }} contentContainerStyle={{ paddingHorizontal: 12 }}>
                      {mapSearchResults.map((r) => (
                        <TouchableOpacity key={r.id} style={styles.searchResultItem} onPress={() => { setTempCoords({ latitude: r.latitude, longitude: r.longitude }); setMapSearchResults([]); mapRef.current?.animateToRegion({ latitude: r.latitude, longitude: r.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300); }}>
                          <Text style={{ fontWeight: '700' }}>{r.name}</Text>
                          <Text style={{ color: COLORS.textMuted }}>{r.address}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  provider={PROVIDER_DEFAULT}
                  initialRegion={{
                      latitude: (tempCoords ?? originCoords)?.latitude ?? -27.6344,
                      longitude: (tempCoords ?? originCoords)?.longitude ?? -52.2682,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                      onPress={(e: any) => setTempCoords(e.nativeEvent.coordinate)}
                >
                      {(tempCoords ?? originCoords) && (
                        <Marker coordinate={(tempCoords ?? originCoords) as { latitude: number; longitude: number }} />
                      )}
                  </MapView>

                  <View style={styles.mapModalControls}>
                  <TouchableOpacity style={styles.mapModalButton} onPress={() => { setTempCoords(null); setMapModalVisible(false); setMapSearch(''); setMapSearchResults([]); }}>
                    <Text style={styles.mapModalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.mapModalButton, styles.mapModalConfirm]}
                        onPress={async () => {
                          if (!tempCoords) return;

                          try {
                            const result = await reverseLookupCoords(
                              tempCoords.latitude,
                              tempCoords.longitude
                            );

                            // prioridade para endereço amigável
                            const locationName =
                              result.formattedAddress ||
                              result.street ||
                              result.name ||
                              'Local selecionado';

                            // atualiza input
                            setOrigin(locationName);
                            setOriginCoords(tempCoords);
                          } catch (err) {
                            console.log('Erro ao buscar endereço:', err);

                            // fallback
                            setOrigin('Local selecionado');
                            setOriginCoords(tempCoords);
                          }

                          // limpa modal
                          setTempCoords(null);
                          setMapModalVisible(false);
                          setMapSearch('');
                          setMapSearchResults([]);
                        }}
                      >
                        <Text
                          style={[
                            styles.mapModalButtonText,
                            { color: COLORS.white },
                          ]}
                        >
                          Confirmar
                        </Text>
                      </TouchableOpacity>
                    </View>
              </View>
            </SafeAreaView>
          </Modal>

          {/* Vagas removidas conforme especificação */}

          {/* Campo Observações */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>OBSERVAÇÕES (OPCIONAL)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Ionicons
                name="document-text-outline"
                size={17}
                color={COLORS.primaryLight}
                style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 2 }]}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={
                  mode === 'Solicitar'
                    ? 'Ex: Aceito dividir com mais passageiros'
                    : 'Ex: Saio da URI às 17:30, faço trajeto pela BR-153'
                }
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {/* Botão principal */}
          <Button
            title={mode === 'Solicitar' ? 'Solicitar Carona' : 'Publicar Carona'}
            onPress={handleSubmit}
            fullWidth
          />
        </ScrollView>

        {/* Bottom Nav */}
        {/* Bottom tab provided by React Navigation; custom BottomNav removed to avoid duplicate bars */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backText: {
    color: COLORS.white,
    fontSize: 14,
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

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 0,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modeButtonTextActive: {
    color: COLORS.white,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    height: 50,
  },
  textAreaWrapper: {
    height: 90,
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  textArea: {
    height: 66,
    paddingTop: 0,
  },

  mapPreview: {
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.text,
  },
  modalCancel: {
    borderBottomWidth: 0,
    marginTop: 8,
    backgroundColor: '#FFF5F5',
  },
  modalCancelText: {
    color: COLORS.red,
    fontWeight: '700',
    textAlign: 'center',
  },
  smallInput: {
    width: 64,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
    textAlign: 'center',
  },

  // Submit
  submitButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  
  mapModalControls: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
  },
  mapModalButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#EFEFEF',
  },
  mapModalButtonText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  mapModalConfirm: {
    backgroundColor: COLORS.primaryLight,
  },
  headerIconRight: {
    position: 'absolute',
    right: 18,
    top: 18,
    zIndex: 20,
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
  mapLaunchButton: {
    marginTop: 8,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  mapLaunchButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  searchBox: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    borderRadius: 8,
    elevation: 10,
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 64,
    left: 12,
    right: 12,
    maxHeight: 220,
    backgroundColor: '#fff',
    borderRadius: 14,
    zIndex: 999,
    elevation: 8,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },

  searchResultItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
