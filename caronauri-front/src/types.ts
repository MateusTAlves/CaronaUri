// navigation/types.ts
// Tipos de navegação compartilhados entre todas as telas

export type RootTabParamList = {
  Home: undefined;
  Publicar: undefined;
  Avaliacoes: undefined;
  Perfil: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  EditarPerfil: undefined;
};

// Dados mockados para desenvolvimento
export const MOCK_USER = {
  id: '1',
  name: 'João Silva',
  initials: 'JS',
  course: 'Engenharia de Software',
  whatsapp: '54999991234',
  address: 'Rua Olavo Bilac, 123 — Erechim',
  rating: 4.8,
  totalRides: 23,
};

export const MOCK_RIDES = [
  {
    id: '1',
    type: 'PROCURA CARONA',
    name: 'Maria Clara',
    initials: 'MC',
    course: 'Engenharia',
    origin: 'URI — Erechim',
    destination: 'Centro — Erechim',
    date: '10/04/2026',
    time: '17:30',
    rating: 5,
    accept_status : null,
  },

  // {
  //   id: '2',
  //   type: 'PROCURA CARONA',
  //   name: 'João Vitor',
  //   initials: 'JV',
  //   course: 'Direito',
  //   origin: 'URI — Erechim',
  //   destination: 'Bela Vista — Erechim',
  //   date: '10/04/2026',
  //   time: '18:00',
  //   rating: 5,
  // },
  // {
  //   id: '3',
  //   type: 'OFERECE CARONA',
  //   name: 'Carlos Alberto',
  //   initials: 'CA',
  //   course: 'Administração',
  //   origin: 'Praça da Bandeira — Erechim',
  //   destination: 'URI — Erechim',
  //   date: '26/04/2026',
  //   time: '07:15',
  //   rating: 4,
  // },
  // {
  //   id: '4',
  //   type: 'OFERECE CARONA',
  //   name: 'Ana Paula',
  //   initials: 'AP',
  //   course: 'Odontologia',
  //   origin: 'Centro — Erechim',
  //   destination: 'URI — Erechim',
  //   date: '26/04/2026',
  //   time: '08:00',
  //   rating: 5,
  // },
  // {
  //   id: '5',
  //   type: 'PROCURA CARONA',
  //   name: 'Mariana Lima',
  //   initials: 'ML',
  //   course: 'Enfermagem',
  //   origin: 'Bela Vista — Erechim',
  //   destination: 'URI — Erechim',
  //   date: '27/04/2026',
  //   time: '16:45',
  //   rating: 3,
  // },
  // {
  //   id: '6',
  //   type: 'OFERECE CARONA',
  //   name: 'Diego Souza',
  //   initials: 'DS',
  //   course: 'Matemática',
  //   origin: 'Rodoviária — Erechim',
  //   destination: 'URI — Erechim',
  //   date: '27/04/2026',
  //   time: '17:30',
  //   rating: 5,
  // },
  // {
  //   id: '7',
  //   type: 'PROCURA CARONA',
  //   name: 'Carla Mendes',
  //   initials: 'CM',
  //   course: 'Biologia',
  //   origin: 'Santo Antônio — Erechim',
  //   destination: 'URI — Erechim',
  //   date: '28/04/2026',
  //   time: '07:00',
  //   rating: 4,
  // },
  // {
  //   id: '8',
  //   type: 'OFERECE CARONA',
  //   name: 'Felipe Rocha',
  //   initials: 'FR',
  //   course: 'Física',
  //   origin: 'URI — Erechim',
  //   destination: 'Jardim América — Erechim',
  //   date: '28/04/2026',
  //   time: '18:30',
  //   rating: 4,
  // },
];

export const MOCK_PENDING_EVALUATIONS = [
  {
    id: '1',
    name: 'Maria Clara',
    initials: 'MC',
    route: 'URI → Centro — Erechim',
    date: '10/04/2026',
    selected: true,
  },
  {
    id: '2',
    name: 'Carla Mendes',
    initials: 'CM',
    route: 'URI → Bela Vista — Erechim',
    date: '08/04/2026',
    selected: false,
  },
];

export const MOCK_HISTORY_EVALUATIONS = [
  {
    id: '1',
    name: 'Diego Souza',
    initials: 'DS',
    route: 'URI → Erechim Centro',
    date: '02/04/2026',
    rating: 5,
    comment: 'Pontual e simpático!',
  },
  {
    id: '2',
    name: 'João Vitor',
    initials: 'JV',
    route: 'URI → Bela Vista — Erechim',
    date: '28/03/2026',
    rating: 4,
    comment: 'Tranquilo, recomendo.',
  },
  {
    id: '3',
    name: 'Ana Paula',
    initials: 'AP',
    route: 'URI → Passo Fundo',
    date: '20/03/2026',
    rating: 5,
    comment: '',
  },
];

// Cores globais
export const COLORS = {
  primary: '#00668F',
  primaryLight: '#00668F',
  primaryBg: '#EBF4FF',
  orange: '#F59E0B',
  text: '#3a3a3a',
  textMuted: '#666666',
  textLight: '#AAAAAA',
  border: '#E0E0E0',
  bg: '#F5F7FA',
  white: '#FFFFFF',
  red: '#EF4444',
  green: 'rgb(0 175 64)',
};

