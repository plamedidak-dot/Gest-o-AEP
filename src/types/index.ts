export type UserRole = 'superadmin' | 'admin' | 'coordinator' | 'subcoordinator' | 'secretary' | 'member';
export type AdminRole = 'Presidente' | 'Vice-Presidente' | 'Secretária' | 'Secretário-Geral' | 'Tesoureiro' | 'Engenheiro do Sistema' | 'Desenvolvedor Geral' | string;
export type DepartmentRole = 'Coordenador' | 'Vice-Coordenador' | 'Subcoordenador' | 'Secretária' | 'Membro' | string;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isDeveloper?: boolean;
  adminRole?: AdminRole;
  department?: string; // Departamento associado (ex: "Departamento Pedagógico")
  departmentRole?: string; // Cargo departamental (ex: "Coordenador", "Subcoordenador", "Secretária")
  memberId?: string;
  memberNumber?: string; // Nº de Associado (ex: SOC-001)
  accessCode?: string; // Código de Acesso (ex: AE-PRESIDENTE ou AE-PROC1042)
  password?: string;
  avatarUrl?: string;
  bio?: string;
  emergencyContact?: string;
  phone?: string;
  joinedYear?: string;
  notificationsEnabled?: boolean;
}

export interface DepartmentItem {
  id: string;
  name: string;
  isAdministrative?: boolean;
}

export type DepartmentType = string;

export type MemberCategory = 
  | 'direcao' 
  | 'coordenacao' 
  | 'efetivo' 
  | 'colaborador' 
  | 'delegado_turma';

export type MemberStatus = 'ativo' | 'pendente' | 'suspenso';

export interface Member {
  id: string;
  memberNumber: string; // Nº de Associado (ex: SOC-001)
  accessCode: string; // Código de Acesso único (ex: AE-PROC1042)
  password?: string; // Senha de acesso gerada automaticamente
  biNumber?: string; // Nº do Bilhete de Identidade (ex: 007842195LA042)
  studentNumber: string; // Nº de Processo Escolar
  fullName: string;
  email: string;
  phone: string;
  classLevel: string; // 10ª Classe, 11ª Classe, 12ª Classe, etc.
  academicYear?: string; // Ano lectivo escolar
  turma: string; // Turma A, B, C
  course: string; // Ex: Ciências Físicas e Biológicas, Ciências Económicas, Geral
  turno: 'Manhã' | 'Tarde' | 'Noite';
  department: DepartmentType | string;
  departmentRole: string; // Presidente, Vice-Presidente, Coordenador, Vice-Coordenador, Membro
  category: MemberCategory;
  status: MemberStatus;
  joinDate: string;
  idCardIssued: boolean;
  notes?: string;
}

export interface SchoolStudentRegistryItem {
  biNumber: string; // Nº do Bilhete de Identidade (ex: 007842195LA042)
  fullName: string;
  studentNumber: string; // Nº de Processo Escolar
  classLevel: string; // 10ª Classe, 11ª Classe, 12ª Classe, etc.
  turma: string; // Turma A, B, C
  course: string; // Ciências Físicas e Biológicas, Ciências Económicas, etc.
  turno: 'Manhã' | 'Tarde' | 'Noite';
  email: string;
  phone: string;
  birthDate?: string;
  gender?: 'M' | 'F';
}

export type PaymentMethod = 'numerario' | 'multicaixa' | 'transferencia' | 'unitel_money' | 'outro';
export type QuotaStatus = 'pago' | 'pendente' | 'atrasado';

export interface QuotaPayment {
  id: string;
  memberId: string;
  memberName: string;
  studentNumber: string;
  department: string;
  period: string; // Ex: "Semana 1 (Novembro 2026)", "Semana 2", etc.
  amount: number; // 500 Kz
  currency: string; // Kz
  status: QuotaStatus;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  registeredBy?: string;
  notes?: string;
}

export type EventCategory = 
  | 'assembleia' 
  | 'pedagogico' 
  | 'academico'
  | 'cultural' 
  | 'desportivo' 
  | 'reuniao' 
  | 'palestra'
  | 'workshop';

export type EventStatus = 'agendado' | 'a_decorrer' | 'concluido' | 'cancelado';

export interface AssociationEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  description: string;
  isGeneralAssembly: boolean;
  minQuorumPercent: number; // e.g. 50%
  maxCapacity?: number;
  status: EventStatus;
}

export type AttendanceStatus = 'presente' | 'ausente' | 'justificado';

export interface EventAttendance {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  studentNumber: string;
  course?: string;
  classLevel?: string;
  department?: string;
  status: AttendanceStatus;
  checkInTime?: string;
  justification?: string;
}

export type DocumentCategory = 
  | 'estatuto' 
  | 'acta' 
  | 'relatorio_contas' 
  | 'convocatoria' 
  | 'regulamento' 
  | 'declaracao' 
  | 'oficio';

export interface AssociationDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  date: string;
  author: string;
  description: string;
  fileType: 'pdf' | 'doc' | 'sheet';
  fileSize: string;
  officialNumber?: string;
  contentBody?: string;
  pdfDataUrl?: string; // Ficheiro PDF real em base64
  fileName?: string; // Nome original do ficheiro PDF
}

export type NotificationType = 'event_reminder' | 'quorum_alert' | 'quota_due' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: NotificationType;
  eventId?: string;
  read: boolean;
}

export interface AssociationSettings {
  name: string;
  acronym: string;
  institution: string; // Escola Secundária / Complexo Escolar
  academicYear: string;
  currency: string; // Kz
  quotaAmount: number; // 500
  quotaCadence: 'semanal' | 'mensal' | 'anual';
  presidentName: string;
  vicePresidentName: string;
  secretaryName: string;
  treasurerName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl?: string; // URL ou base64 do logótipo da associação (AEP-2)
  schoolLogoUrl?: string; // URL ou base64 do logótipo do Complexo Escolar Privado Proglory
}

export type LogLevel = 'info' | 'warn' | 'error' | 'security';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  level: LogLevel;
  user?: string;
  category?: 'auth' | 'permissions' | 'database' | 'system' | 'documents';
  ipOrDevice?: string;
}
