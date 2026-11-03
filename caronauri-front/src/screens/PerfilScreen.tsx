import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MOCK_USER } from '../types';
import Button from '../components/UI/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tela de Perfil ────────────────────────────────────────────────────────────
interface PerfilScreenProps {
  onNavigate?: (screen: string) => void;
  onEditProfile?: () => void;
  onLogout?: () => void;
}

export function PerfilScreen({
  onNavigate,
  onEditProfile,
  onLogout,
  navigation,
}: PerfilScreenProps & { navigation?: any }) {

  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    whatsapp: '',
    course: '',
    rating: '0',
    totalRides: '0',
    initials: '',
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'course' | 'whatsapp'>('name');
  const [editingValue, setEditingValue] = useState('');
  const API_BASE = process.env.EXPO_PUBLIC_API_URL;

  const navigate = (r: string) => (onNavigate ? onNavigate(r) : navigation?.navigate?.(r));

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        const response = await fetch(`${API_BASE}/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.log(data.error);
          return;
        }

      setUser({
        id: data.user.id ?? '',
        name: data.user.name ?? '',
        email: data.user.email ?? '',
        whatsapp: data.user.whatsapp ?? '',
        course: '',
        rating: '0',
        totalRides: '0',
        initials: data.user.name
          ? data.user.name.charAt(0).toUpperCase()
          : '',
      });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');

      if (onLogout) {
        onLogout();
      } else {
        navigation?.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const openEdit = (field: 'name' | 'course' | 'whatsapp') => {
    setEditingField(field);
    setEditingValue(field === 'name' ? user.name : field === 'course' ? user.course : user.whatsapp);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    try {
      const updatedUser = {
        ...user,
        [editingField]: editingValue,
      };

      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_BASE}/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedUser.name,
          whatsapp: updatedUser.whatsapp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(data.error);
        return;
      }

      // atualiza state local
      setUser((prev) => ({
        ...prev,
        name: data.user.name,
        whatsapp: data.user.whatsapp,
        initials: data.user.name
          ? data.user.name.charAt(0).toUpperCase()
          : '',
      }));

      setEditModalVisible(false);

    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header com avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user.initials}</Text>
            </View>
            {/* <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="pencil" size={12} color={COLORS.white} />
            </TouchableOpacity> */}
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          {/* <Text style={styles.userCourse}>{user.course}</Text> */}

          {/* <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="star" size={13} color={COLORS.white} />
              <Text style={styles.statBadgeText}>{user.rating}</Text>
            </View>
            <View style={[styles.statBadge, styles.statBadgeGray]}>
              <Text style={styles.statBadgeGrayText}>{user.totalRides} caronas</Text>
            </View>
          </View> */}
        </View>

        {/* Dados pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DADOS PESSOAIS</Text>

          <View style={styles.dataCard}>
            <InfoRow
              icon="person-outline"
              label="NOME"
              value={user.name}
              onPress={() => openEdit('name')}
            />
            {/* <View style={styles.divider} />
            <InfoRow
              icon="book-outline"
              label="CURSO"
              value={user.course}
              onPress={() => openEdit('course')}
            /> */}
            <View style={styles.divider} />
            <InfoRow
              icon="call-outline"
              label="WHATSAPP"
              value={user.whatsapp}
              onPress={() => openEdit('whatsapp')}
            />
          </View>

          <Modal visible={editModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Editar</Text>
                <Text style={styles.fieldLabel}>{editingField === 'name' ? 'NOME' : editingField === 'course' ? 'CURSO' : 'WHATSAPP'}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name={editingField === 'name' ? 'person-outline' : editingField === 'course' ? 'book-outline' : 'call-outline'}
                    size={17}
                    color={COLORS.primaryLight}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={editingValue}
                    onChangeText={setEditingValue}
                    style={styles.input}
                    autoFocus
                    placeholder={editingField === 'name' ? 'Nome completo' : editingField === 'course' ? 'Curso' : 'WhatsApp'}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                <View style={styles.modalButtonsRow}>
                  <Button title="Cancelar" onPress={() => setEditModalVisible(false)} variant="secondary" style={{ flex: 1, marginRight: 10 }} />
                  <Button title="Salvar" onPress={saveEdit} style={{ flex: 1 }} />
                </View>
              </View>
            </View>
          </Modal>
        </View>

        {/* Ações */}
          <View style={styles.section}>
          <Button title="Sair da conta" onPress={handleLogout} variant="secondary" icon="log-out-outline" style={[styles.actionButton, styles.logoutButton, { alignSelf: 'stretch' }]} textStyle={styles.logoutButtonText} />
        </View>
      </ScrollView>

      {/* Bottom tab provided by React Navigation; custom BottomNav removed to avoid duplicate bars */}
    </SafeAreaView>
  );
}

// ─── Sub-componente linha de info ──────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.infoRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.infoIconWrapper}>
        <Ionicons name={icon as any} size={17} color={COLORS.primaryLight} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

// ─── Tela Editar Perfil ────────────────────────────────────────────────────────
interface EditarPerfilScreenProps {
  onBack?: () => void;
  onSave?: (data: object) => void;
}

export function EditarPerfilScreen({ onBack, onSave, navigation }: EditarPerfilScreenProps & { navigation?: any }) {
  const [name, setName] = useState(MOCK_USER.name);
  const [whatsapp, setWhatsapp] = useState(MOCK_USER.whatsapp);
  const API_BASE = process.env.EXPO_PUBLIC_API_URL;

  const handleSave = () => {
    // Exemplo de chamada à API (comentado) para salvar perfil a partir da tela EditarPerfil
     const handleSave = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        const response = await fetch(`${API_BASE}/profile`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            whatsapp,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.log(data.error);
          return;
        }

        onSave?.(data.user);

        navigation?.goBack();

      } catch (error) {
        console.error('Erro ao salvar perfil:', error);
      }
    };

    onSave?.({ name, whatsapp });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={() => (onBack ? onBack() : navigation?.goBack?.())} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color={COLORS.white} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.editHeaderTitle}>Editar Perfil</Text>
        <Text style={styles.editHeaderSubtitle}>Atualize suas informações</Text>
      </View>

      <ScrollView
        style={styles.editScroll}
        contentContainerStyle={styles.editScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>DADOS PESSOAIS</Text>

        {/* Nome */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NOME COMPLETO</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={17}
              color={COLORS.primaryLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* WhatsApp */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>WHATSAPP</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="call-outline"
              size={17}
              color={COLORS.primaryLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Endereço removido conforme especificação do usuário */}

        {/* Salvar */}
        <Button title="Salvar alterações" onPress={handleSave} icon="save-outline" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Profile header
  profileHeader: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  userCourse: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  statBadgeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  statBadgeGray: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statBadgeGrayText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  // Data card
  dataCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 62,
  },

  // Action buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutButton: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.red,
  },

  // Edit header
  editHeader: {
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
  editHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  editHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  editScroll: {
    flex: 1,
  },
  editScrollContent: {
    padding: 20,
    gap: 0,
  },

  // Edit fields
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
  fieldHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
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
    fontSize: 20,
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

  editFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 48,
    backgroundColor: COLORS.white,
  },
  editModalInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  modalAction: {
    flex: 1,
  },

  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    height: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
  },

  // Save
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    height: 52,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
