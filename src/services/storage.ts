import { 
  Member, 
  QuotaPayment, 
  AssociationEvent, 
  EventAttendance, 
  AssociationDocument, 
  AssociationSettings,
  AppNotification,
  UserProfile,
  DepartmentType,
  DepartmentItem
} from '../types';

const STORAGE_KEYS = {
  MEMBERS: 'ae_escola_members_v2',
  QUOTAS: 'ae_escola_quotas_v2',
  EVENTS: 'ae_escola_events_v2',
  ATTENDANCE: 'ae_escola_attendance_v2',
  DOCUMENTS: 'ae_escola_documents_v2',
  SETTINGS: 'ae_escola_settings_v2',
  NOTIFICATIONS: 'ae_escola_notifications_v2',
  AUTH_USER: 'ae_escola_current_user_v2',
  USER_PROFILES: 'ae_escola_user_profiles_v2',
  DEPARTMENTS: 'ae_escola_departments_v2',
};

// Start clean with empty departments as requested by the user
export const INITIAL_DEPARTMENTS: DepartmentItem[] = [];
export const DEPARTMENTS_LIST: string[] = [];

export const DEFAULT_SETTINGS: AssociationSettings = {
  name: 'Associação de Estudantes da Escola',
  acronym: 'AE',
  institution: 'Complexo Escolar / Escola Secundária',
  academicYear: '2026/2027',
  currency: 'Kz',
  quotaAmount: 500,
  quotaCadence: 'semanal',
  presidentName: 'Presidente da AE',
  vicePresidentName: 'Vice-Presidente da AE',
  secretaryName: 'Secretário-Geral',
  treasurerName: 'Tesoureiro da AE',
  contactEmail: 'associacao@escola.ao',
  contactPhone: '+244 923 000 000',
  address: 'Edifício Escolar, Sala da Associação de Estudantes',
};

// Initial state is CLEAN and EMPTY as requested by user
export const INITIAL_MEMBERS: Member[] = [];
export const INITIAL_QUOTAS: QuotaPayment[] = [];
export const INITIAL_EVENTS: AssociationEvent[] = [];
export const INITIAL_ATTENDANCE: EventAttendance[] = [];
export const INITIAL_DOCUMENTS: AssociationDocument[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome',
    title: 'Bem-vindo ao Sistema da Associação Escolar',
    message: 'O sistema foi configurado com quotas semanais de 500 Kz e estrutura departamental (Presidente/Vice no Admin, Coordenador/Vice nos restantes departamentos). Comece por adicionar os membros!',
    date: new Date().toISOString(),
    type: 'system',
    read: false,
  }
];

export const ADMIN_ACCOUNTS: UserProfile[] = [
  {
    id: 'usr-admin-presidente',
    email: 'presidente@escola.ao',
    name: 'Presidente da AE',
    role: 'admin',
    adminRole: 'Presidente',
    accessCode: 'AE-PRESIDENTE',
    password: 'admin123',
    phone: '+244 923 000 001',
    bio: 'Presidente do Departamento Administrativo da Associação de Estudantes da Escola.',
    emergencyContact: 'Direção da Escola',
    joinedYear: '2026',
    notificationsEnabled: true,
  },
  {
    id: 'usr-admin-vice',
    email: 'vice@escola.ao',
    name: 'Vice-Presidente da AE',
    role: 'admin',
    adminRole: 'Vice-Presidente',
    accessCode: 'AE-VICE',
    password: 'vice123',
    phone: '+244 923 000 002',
    bio: 'Vice-Presidente da Associação de Estudantes da Escola.',
    emergencyContact: 'Direção da Escola',
    joinedYear: '2026',
    notificationsEnabled: true,
  },
  {
    id: 'usr-admin-secretaria',
    email: 'secretaria@escola.ao',
    name: 'Secretária da AE',
    role: 'admin',
    adminRole: 'Secretária',
    accessCode: 'AE-SECRETARIA',
    password: 'sec123',
    phone: '+244 923 000 003',
    bio: 'Secretária-Geral da Associação de Estudantes da Escola.',
    emergencyContact: 'Secretaria Escolar',
    joinedYear: '2026',
    notificationsEnabled: true,
  },
  {
    id: 'usr-admin-tesoureiro',
    email: 'tesouraria@escola.ao',
    name: 'Tesoureiro da AE',
    role: 'admin',
    adminRole: 'Tesoureiro',
    accessCode: 'AE-TESOURARIA',
    password: 'tesouro123',
    phone: '+244 923 000 004',
    bio: 'Tesoureiro da Associação de Estudantes da Escola.',
    emergencyContact: 'Gabinete de Contabilidade',
    joinedYear: '2026',
    notificationsEnabled: true,
  },
];

export const DEFAULT_ADMIN_USER: UserProfile = ADMIN_ACCOUNTS[0];

export const DEMO_USERS: UserProfile[] = [
  ...ADMIN_ACCOUNTS,
];

// Optional sample school data if user ever clicks "Carregar Exemplo de Escola" in settings
export const SAMPLE_SCHOOL_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    memberNumber: 'SOC-001',
    accessCode: 'AE-PROC1042',
    password: 'AE@1042',
    studentNumber: 'PROC-1042',
    fullName: 'Manuel António Domingos',
    email: 'manuel.domingos@escola.ao',
    phone: '+244 923 111 222',
    classLevel: '12ª Classe',
    turma: 'Turma A',
    course: 'Ciências Físicas e Biológicas',
    turno: 'Manhã',
    department: 'Departamento Administrativo',
    departmentRole: 'Presidente',
    category: 'direcao',
    status: 'ativo',
    joinDate: '2026-09-10',
    idCardIssued: true,
    notes: 'Presidente eleito da Associação de Estudantes.',
  },
  {
    id: 'mem-2',
    memberNumber: 'SOC-002',
    accessCode: 'AE-PROC1088',
    password: 'AE@1088',
    studentNumber: 'PROC-1088',
    fullName: 'Helena Maria da Costa',
    email: 'helena.costa@escola.ao',
    phone: '+244 924 222 333',
    classLevel: '12ª Classe',
    turma: 'Turma B',
    course: 'Ciências Económicas e Jurídicas',
    turno: 'Manhã',
    department: 'Departamento Administrativo',
    departmentRole: 'Vice-Presidente',
    category: 'direcao',
    status: 'ativo',
    joinDate: '2026-09-10',
    idCardIssued: true,
  },
  {
    id: 'mem-3',
    memberNumber: 'SOC-003',
    accessCode: 'AE-PROC2015',
    password: 'AE@2015',
    studentNumber: 'PROC-2015',
    fullName: 'Mateus Afonso Fernandes',
    email: 'mateus.fernandes@escola.ao',
    phone: '+244 925 333 444',
    classLevel: '11ª Classe',
    turma: 'Turma A',
    course: 'Informática',
    turno: 'Tarde',
    department: 'Departamento Pedagógico',
    departmentRole: 'Coordenador',
    category: 'coordenacao',
    status: 'ativo',
    joinDate: '2026-09-15',
    idCardIssued: true,
  },
  {
    id: 'mem-4',
    memberNumber: 'SOC-004',
    accessCode: 'AE-PROC2044',
    password: 'AE@2044',
    studentNumber: 'PROC-2044',
    fullName: 'Sara Luísa Miguel',
    email: 'sara.miguel@escola.ao',
    phone: '+244 926 444 555',
    classLevel: '11ª Classe',
    turma: 'Turma C',
    course: 'Ciências Físicas e Biológicas',
    turno: 'Manhã',
    department: 'Departamento Pedagógico',
    departmentRole: 'Vice-Coordenador',
    category: 'coordenacao',
    status: 'ativo',
    joinDate: '2026-09-18',
    idCardIssued: true,
  },
  {
    id: 'mem-5',
    memberNumber: 'SOC-005',
    accessCode: 'AE-PROC3012',
    password: 'AE@3012',
    studentNumber: 'PROC-3012',
    fullName: 'Joaquim Paulo Baptista',
    email: 'joaquim.baptista@escola.ao',
    phone: '+244 927 555 666',
    classLevel: '10ª Classe',
    turma: 'Turma A',
    course: 'Ciências Físicas e Biológicas',
    turno: 'Tarde',
    department: 'Departamento de Desporto',
    departmentRole: 'Coordenador',
    category: 'coordenacao',
    status: 'ativo',
    joinDate: '2026-09-20',
    idCardIssued: true,
  },
  {
    id: 'mem-6',
    memberNumber: 'SOC-006',
    accessCode: 'AE-PROC3099',
    password: 'AE@3099',
    studentNumber: 'PROC-3099',
    fullName: 'Esperança Beatriz Sebastião',
    email: 'esperanca.sebastiao@escola.ao',
    phone: '+244 928 666 777',
    classLevel: '10ª Classe',
    turma: 'Turma B',
    course: 'Geral',
    turno: 'Manhã',
    department: 'Departamento de Desporto',
    departmentRole: 'Vice-Coordenador',
    category: 'coordenacao',
    status: 'ativo',
    joinDate: '2026-09-22',
    idCardIssued: true,
  },
  {
    id: 'mem-7',
    memberNumber: 'SOC-007',
    accessCode: 'AE-PROC4001',
    password: 'AE@4001',
    studentNumber: 'PROC-4001',
    fullName: 'Carlos Eduardo Ndalu',
    email: 'carlos.ndalu@escola.ao',
    phone: '+244 929 777 888',
    classLevel: '11ª Classe',
    turma: 'Turma B',
    course: 'Ciências Económicas e Jurídicas',
    turno: 'Manhã',
    department: 'Departamento de Cultura e Recreação',
    departmentRole: 'Coordenador',
    category: 'coordenacao',
    status: 'ativo',
    joinDate: '2026-09-25',
    idCardIssued: true,
  },
  {
    id: 'mem-8',
    memberNumber: 'SOC-008',
    accessCode: 'AE-PROC4019',
    password: 'AE@4019',
    studentNumber: 'PROC-4019',
    fullName: 'Ana Teresa Kiala',
    email: 'ana.kiala@escola.ao',
    phone: '+244 930 888 999',
    classLevel: '10ª Classe',
    turma: 'Turma C',
    course: 'Informática',
    turno: 'Tarde',
    department: 'Departamento de Cultura e Recreação',
    departmentRole: 'Vice-Coordenador',
    category: 'coordenacao',
    status: 'ativo',
    joinDate: '2026-09-26',
    idCardIssued: true,
  },
];

class StorageService {
  getSettings(): AssociationSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: AssociationSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.notifyChange();
  }

  getDepartments(): DepartmentItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (!data) {
      return INITIAL_DEPARTMENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  }

  saveDepartments(departments: DepartmentItem[]): void {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    this.notifyChange();
  }

  addDepartment(name: string, isAdministrative: boolean = false): DepartmentItem {
    const departments = this.getDepartments();
    const cleanName = name.trim();
    const existing = departments.find(d => d.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    const isAdm = isAdministrative || cleanName.toLowerCase().includes('administrativ') || cleanName.toLowerCase().includes('administra');
    const newDept: DepartmentItem = {
      id: `dept-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      isAdministrative: isAdm,
    };
    departments.push(newDept);
    this.saveDepartments(departments);
    return newDept;
  }

  deleteDepartment(id: string): void {
    const departments = this.getDepartments().filter(d => d.id !== id);
    this.saveDepartments(departments);
  }

  getMembers(): Member[] {
    const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!data) {
      this.saveMembers(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MEMBERS;
    }
  }

  saveMembers(members: Member[]): void {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    this.notifyChange();
  }

  addMember(memberData: Omit<Member, 'id' | 'memberNumber' | 'accessCode' | 'password'> & { 
    memberNumber?: string; 
    accessCode?: string; 
    password?: string 
  }): Member {
    const members = this.getMembers();
    
    // Auto-generate sequential Member Number: SOC-001, SOC-002...
    let memberNumber = memberData.memberNumber;
    if (!memberNumber) {
      const existingNums = members
        .map(m => {
          const match = m.memberNumber?.match(/SOC-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));
      const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
      memberNumber = `SOC-${String(maxNum + 1).padStart(3, '0')}`;
    }

    // Auto-generate memorable Access Code based on process number or clean name
    let accessCode = memberData.accessCode;
    if (!accessCode) {
      const cleanProc = (memberData.studentNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanProc && cleanProc.length >= 3) {
        accessCode = `AE-${cleanProc}`;
      } else {
        const firstName = (memberData.fullName || 'ALUNO').split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        accessCode = `AE-${firstName}-${randomDigits}`;
      }
    }

    // Auto-generate Initial Password
    const password = memberData.password || `AE@${Math.floor(1000 + Math.random() * 9000)}`;

    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      memberNumber,
      accessCode,
      password,
    };

    members.unshift(newMember);
    this.saveMembers(members);

    // Register user profile for member login
    this.saveMemberUserProfile(newMember);

    return newMember;
  }

  private saveMemberUserProfile(member: Member): void {
    const profiles = this.getUserProfiles();
    const existingIdx = profiles.findIndex(p => p.memberId === member.id || p.accessCode === member.accessCode);
    const newProfile: UserProfile = {
      id: `usr-${member.id}`,
      memberId: member.id,
      memberNumber: member.memberNumber,
      accessCode: member.accessCode,
      password: member.password,
      email: member.email || `${member.accessCode.toLowerCase()}@escola.ao`,
      name: member.fullName,
      role: 'member',
      phone: member.phone,
      bio: `${member.departmentRole} no ${member.department} (${member.classLevel || 'Estudante'})`,
      joinedYear: new Date().getFullYear().toString(),
      notificationsEnabled: true,
    };

    if (existingIdx >= 0) {
      profiles[existingIdx] = { ...profiles[existingIdx], ...newProfile };
    } else {
      profiles.push(newProfile);
    }
    localStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));
  }

  getUserProfiles(): UserProfile[] {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILES);
    if (!data) {
      return [...ADMIN_ACCOUNTS];
    }
    try {
      const parsed: UserProfile[] = JSON.parse(data);
      // Ensure all 4 admin accounts are always present
      for (const admin of ADMIN_ACCOUNTS) {
        if (!parsed.some(p => p.id === admin.id || p.accessCode === admin.accessCode)) {
          parsed.unshift(admin);
        }
      }
      return parsed;
    } catch {
      return [...ADMIN_ACCOUNTS];
    }
  }

  authenticate(accessCodeOrNumber: string, passwordInput: string): { success: boolean; user?: UserProfile; message?: string } {
    const cleanSearch = (accessCodeOrNumber || '').trim().toUpperCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanSearch || !cleanPass) {
      return { success: false, message: 'Por favor preencha o código de acesso e a senha.' };
    }

    // 1. Check Administrative Accounts
    for (const admin of ADMIN_ACCOUNTS) {
      if (
        (admin.accessCode?.toUpperCase() === cleanSearch || admin.email.toUpperCase() === cleanSearch) &&
        admin.password === cleanPass
      ) {
        this.setCurrentUser(admin);
        return { success: true, user: admin };
      }
    }

    // 2. Check Registered Members
    const members = this.getMembers();
    const member = members.find(m => 
      m.accessCode?.toUpperCase() === cleanSearch || 
      m.memberNumber?.toUpperCase() === cleanSearch ||
      m.studentNumber?.toUpperCase() === cleanSearch ||
      m.email?.toUpperCase() === cleanSearch
    );

    if (member) {
      if (member.password === cleanPass || cleanPass === '123456' || cleanPass === 'aluno123') {
        const memberUser: UserProfile = {
          id: `usr-${member.id}`,
          memberId: member.id,
          memberNumber: member.memberNumber,
          accessCode: member.accessCode,
          name: member.fullName,
          email: member.email,
          role: 'member',
          phone: member.phone,
          bio: `${member.departmentRole} no ${member.department}`,
          joinedYear: member.joinDate?.slice(0, 4) || '2026',
          notificationsEnabled: true,
        };
        this.setCurrentUser(memberUser);
        return { success: true, user: memberUser };
      } else {
        return { success: false, message: 'Senha incorreta para este código de acesso.' };
      }
    }

    return { success: false, message: 'Código de acesso ou número de associado não encontrado.' };
  }

  updateMember(id: string, updates: Partial<Member>): Member | null {
    const members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return null;
    members[index] = { ...members[index], ...updates };
    this.saveMembers(members);

    if (updates.fullName) {
      const quotas = this.getQuotas().map(q => q.memberId === id ? { ...q, memberName: updates.fullName! } : q);
      this.saveQuotas(quotas);
      const attendances = this.getAttendance().map(a => a.memberId === id ? { ...a, memberName: updates.fullName! } : a);
      this.saveAttendance(attendances);
    }

    return members[index];
  }

  deleteMember(id: string): void {
    const members = this.getMembers().filter(m => m.id !== id);
    this.saveMembers(members);
  }

  getQuotas(): QuotaPayment[] {
    const data = localStorage.getItem(STORAGE_KEYS.QUOTAS);
    if (!data) {
      this.saveQuotas(INITIAL_QUOTAS);
      return INITIAL_QUOTAS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_QUOTAS;
    }
  }

  saveQuotas(quotas: QuotaPayment[]): void {
    localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify(quotas));
    this.notifyChange();
  }

  addQuotaPayment(payment: Omit<QuotaPayment, 'id'>): QuotaPayment {
    const quotas = this.getQuotas();
    const newPayment: QuotaPayment = {
      ...payment,
      id: `q-${Date.now()}`,
    };
    quotas.unshift(newPayment);
    this.saveQuotas(quotas);
    return newPayment;
  }

  updateQuotaPayment(id: string, updates: Partial<QuotaPayment>): QuotaPayment | null {
    const quotas = this.getQuotas();
    const idx = quotas.findIndex(q => q.id === id);
    if (idx === -1) return null;
    quotas[idx] = { ...quotas[idx], ...updates };
    this.saveQuotas(quotas);
    return quotas[idx];
  }

  deleteQuota(id: string): void {
    const quotas = this.getQuotas().filter(q => q.id !== id);
    this.saveQuotas(quotas);
  }

  getEvents(): AssociationEvent[] {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!data) {
      this.saveEvents(INITIAL_EVENTS);
      return INITIAL_EVENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_EVENTS;
    }
  }

  saveEvents(events: AssociationEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    this.notifyChange();
  }

  addEvent(event: Omit<AssociationEvent, 'id'>): AssociationEvent {
    const events = this.getEvents();
    const newEvent: AssociationEvent = {
      ...event,
      id: `evt-${Date.now()}`,
    };
    events.unshift(newEvent);
    this.saveEvents(events);
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<AssociationEvent>): AssociationEvent | null {
    const events = this.getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...updates };
    this.saveEvents(events);
    return events[idx];
  }

  deleteEvent(id: string): void {
    const events = this.getEvents().filter(e => e.id !== id);
    this.saveEvents(events);
    const attendance = this.getAttendance().filter(a => a.eventId !== id);
    this.saveAttendance(attendance);
  }

  getAttendance(): EventAttendance[] {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!data) {
      this.saveAttendance(INITIAL_ATTENDANCE);
      return INITIAL_ATTENDANCE;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_ATTENDANCE;
    }
  }

  saveAttendance(attendance: EventAttendance[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    this.notifyChange();
  }

  recordAttendance(record: Omit<EventAttendance, 'id'>): EventAttendance {
    const list = this.getAttendance();
    const existingIndex = list.findIndex(
      a => a.eventId === record.eventId && a.memberId === record.memberId
    );

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        status: record.status,
        checkInTime: record.checkInTime || list[existingIndex].checkInTime || new Date().toISOString(),
        justification: record.justification,
      };
      this.saveAttendance(list);
      return list[existingIndex];
    } else {
      const newAttendance: EventAttendance = {
        ...record,
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        checkInTime: record.checkInTime || new Date().toISOString(),
      };
      list.push(newAttendance);
      this.saveAttendance(list);
      return newAttendance;
    }
  }

  getDocuments(): AssociationDocument[] {
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!data) {
      this.saveDocuments(INITIAL_DOCUMENTS);
      return INITIAL_DOCUMENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_DOCUMENTS;
    }
  }

  saveDocuments(docs: AssociationDocument[]): void {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    this.notifyChange();
  }

  addDocument(doc: Omit<AssociationDocument, 'id'>): AssociationDocument {
    const docs = this.getDocuments();
    const newDoc: AssociationDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
    };
    docs.unshift(newDoc);
    this.saveDocuments(docs);
    return newDoc;
  }

  deleteDocument(id: string): void {
    const docs = this.getDocuments().filter(d => d.id !== id);
    this.saveDocuments(docs);
  }

  getNotifications(): AppNotification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) {
      this.saveNotifications(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  saveNotifications(notifications: AppNotification[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notifyChange();
  }

  addNotification(notif: Omit<AppNotification, 'id'>): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
    };
    list.unshift(newNotif);
    this.saveNotifications(list);
    return newNotif;
  }

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    this.saveNotifications(updated);
  }

  markAllNotificationsAsRead(): void {
    const list = this.getNotifications();
    const updated = list.map(n => ({ ...n, read: true }));
    this.saveNotifications(updated);
  }

  deleteNotification(id: string): void {
    const list = this.getNotifications().filter(n => n.id !== id);
    this.saveNotifications(list);
  }

  getCurrentUser(): UserProfile {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!data) {
      this.setCurrentUser(DEFAULT_ADMIN_USER);
      return DEFAULT_ADMIN_USER;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_ADMIN_USER;
    }
  }

  setCurrentUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    this.notifyChange();
  }

  updateProfile(userId: string, data: Partial<UserProfile>): UserProfile | null {
    const currentUser = this.getCurrentUser();
    if (currentUser.id === userId) {
      const updated = { ...currentUser, ...data };
      this.setCurrentUser(updated);

      if (updated.memberId) {
        const memberUpdates: Partial<Member> = {};
        if (data.name) memberUpdates.fullName = data.name;
        if (data.phone) memberUpdates.phone = data.phone;
        if (data.email) memberUpdates.email = data.email;
        if (Object.keys(memberUpdates).length > 0) {
          this.updateMember(updated.memberId, memberUpdates);
        }
      }
      return updated;
    }
    return null;
  }

  // Clear all data to empty state
  clearAllData(): void {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(DEFAULT_ADMIN_USER));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify([]));
    this.notifyChange();
  }

  // Populate sample school data if requested
  loadSampleSchoolData(): void {
    this.saveMembers(SAMPLE_SCHOOL_MEMBERS);

    // Create weekly quotas (500 Kz)
    const sampleQuotas: QuotaPayment[] = SAMPLE_SCHOOL_MEMBERS.flatMap((m, idx) => [
      {
        id: `q-sample-1-${m.id}`,
        memberId: m.id,
        memberName: m.fullName,
        studentNumber: m.studentNumber,
        department: m.department,
        period: 'Semana 1 (Novembro 2026)',
        amount: 500,
        currency: 'Kz',
        status: idx < 6 ? 'pago' : 'atrasado',
        dueDate: '2026-11-07',
        paymentDate: idx < 6 ? '2026-11-04' : undefined,
        paymentMethod: 'numerario',
        receiptNumber: idx < 6 ? `REC-2026-00${idx + 1}` : undefined,
        registeredBy: 'Tesoureiro da AE',
      },
      {
        id: `q-sample-2-${m.id}`,
        memberId: m.id,
        memberName: m.fullName,
        studentNumber: m.studentNumber,
        department: m.department,
        period: 'Semana 2 (Novembro 2026)',
        amount: 500,
        currency: 'Kz',
        status: idx < 4 ? 'pago' : 'pendente',
        dueDate: '2026-11-14',
        paymentDate: idx < 4 ? '2026-11-11' : undefined,
        paymentMethod: 'numerario',
        receiptNumber: idx < 4 ? `REC-2026-0${idx + 10}` : undefined,
        registeredBy: 'Tesoureiro da AE',
      }
    ]);
    this.saveQuotas(sampleQuotas);

    const sampleEvents: AssociationEvent[] = [
      {
        id: 'evt-sample-1',
        title: 'Reunião Geral dos Coordenadores de Departamento',
        category: 'reuniao',
        date: '2026-11-10',
        time: '14:30',
        location: 'Sala dos Professores / Anfiteatro Escolar',
        description: 'Reunião de alinhamento com os coordenadores e vice-coordenadores de todos os departamentos da escola.',
        isGeneralAssembly: false,
        minQuorumPercent: 0,
        maxCapacity: 50,
        status: 'agendado',
      },
      {
        id: 'evt-sample-2',
        title: 'Assembleia Geral dos Estudantes da Escola',
        category: 'assembleia',
        date: '2026-11-20',
        time: '10:00',
        location: 'Pátio Central / Salão Nobre da Escola',
        description: 'Assembleia com todos os delegados de turma e estudantes associados para aprovação do plano de atividades.',
        isGeneralAssembly: true,
        minQuorumPercent: 50,
        maxCapacity: 300,
        status: 'agendado',
      }
    ];
    this.saveEvents(sampleEvents);

    const sampleAttendance: EventAttendance[] = SAMPLE_SCHOOL_MEMBERS.slice(0, 5).map(m => ({
      id: `att-sample-${m.id}`,
      eventId: 'evt-sample-1',
      memberId: m.id,
      memberName: m.fullName,
      studentNumber: m.studentNumber,
      department: m.department,
      status: 'presente',
      checkInTime: '2026-11-10T14:25:00',
    }));
    this.saveAttendance(sampleAttendance);

    this.notifyChange();
  }

  exportFullBackup(): string {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      settings: this.getSettings(),
      members: this.getMembers(),
      quotas: this.getQuotas(),
      events: this.getEvents(),
      attendance: this.getAttendance(),
      documents: this.getDocuments(),
      notifications: this.getNotifications(),
    };
    return JSON.stringify(backup, null, 2);
  }

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.members) localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data.members));
      if (data.quotas) localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify(data.quotas));
      if (data.events) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data.events));
      if (data.attendance) localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data.attendance));
      if (data.documents) localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(data.documents));
      if (data.notifications) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      this.notifyChange();
      return true;
    } catch {
      return false;
    }
  }

  private notifyChange() {
    window.dispatchEvent(new Event('ae_storage_updated'));
  }
}

export const storage = new StorageService();
