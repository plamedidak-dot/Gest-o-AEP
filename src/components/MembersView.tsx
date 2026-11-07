import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  CreditCard, 
  Edit, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  Download,
  School,
  Building2,
  FileDown,
  KeyRound,
  ShieldCheck,
  PlusCircle,
  AlertTriangle,
  FolderPlus
} from 'lucide-react';
import { Member, QuotaPayment, UserProfile, AssociationSettings, DepartmentType, DepartmentItem } from '../types';
import { storage } from '../services/storage';
import { exportToCsv, formatDatePt, getMemberQuotaStatus } from '../utils/formatters';
import { QRCodeSvg } from './QRCodeSvg';
import { MemberCredentialsModal } from './MemberCredentialsModal';
import { ConfirmDialog } from './ConfirmDialog';
import { 
  isGlobalAdmin, 
  isDepartmentLeader, 
  isDepartmentSecretary, 
  canManageDepartment, 
  canManageMembers, 
  isMemberInUserScope 
} from '../utils/permissions';

interface MembersViewProps {
  members: Member[];
  quotas: QuotaPayment[];
  currentUser: UserProfile;
  settings: AssociationSettings;
  onEmitCertificate: (member: Member) => void;
  onOpenNewQuotaModalWithMember: (member: Member) => void;
  onOpenPdfReport: () => void;
  onLoadSampleData?: () => void;
  onSwitchUser?: (user: UserProfile) => void;
  onNavigateTab?: (tab: string) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  quotas,
  currentUser,
  settings,
  onEmitCertificate,
  onOpenNewQuotaModalWithMember,
  onOpenPdfReport,
  onLoadSampleData,
  onSwitchUser,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>(() => {
    if (!isGlobalAdmin(currentUser) && currentUser.department) {
      return currentUser.department;
    }
    return 'all';
  });
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [credentialsMember, setCredentialsMember] = useState<{ member: Member; isNew?: boolean } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Departments State (dynamically created by user, starts clean/blank)
  const [customDepartments, setCustomDepartments] = useState<DepartmentItem[]>(() => storage.getDepartments());
  const [showDeptManagerModal, setShowDeptManagerModal] = useState(false);
  const [inlineDeptName, setInlineDeptName] = useState('');
  const [inlineDeptIsAdmin, setInlineDeptIsAdmin] = useState(false);
  const [showInlineNewDept, setShowInlineNewDept] = useState(false);
  const [newDeptManagerName, setNewDeptManagerName] = useState('');
  const [newDeptManagerIsAdmin, setNewDeptManagerIsAdmin] = useState(false);
  const [deptManagerError, setDeptManagerError] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<DepartmentItem | null>(null);

  // Form Department & Role state
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Collect all unique department names (from custom list + any existing member records)
  const allDepartmentNames = useMemo(() => {
    const list: string[] = customDepartments.map(d => d.name);
    members.forEach(m => {
      if (m.department && !list.includes(m.department)) {
        list.push(m.department);
      }
    });
    return list;
  }, [customDepartments, members]);

  // Check if department is Administrative (Presidente / Vice-Presidente only allowed here)
  const isAdministrativeDept = (deptName: string): boolean => {
    if (!deptName) return false;
    const found = customDepartments.find(d => d.name.toLowerCase() === deptName.trim().toLowerCase());
    if (found?.isAdministrative) return true;
    const lower = deptName.toLowerCase();
    return lower.includes('administrativ') || lower.includes('administra') || lower.includes('direção') || lower.includes('direcao');
  };

  // Roles available for a department:
  // - Administrative area: Presidente, Vice-Presidente, Secretário-Geral, Tesoureiro
  // - Other departments: Coordenador, Subcoordenador, Secretária, Membro
  const getAllowedRoles = (deptName: string): string[] => {
    if (isAdministrativeDept(deptName)) {
      return ['Presidente', 'Vice-Presidente', 'Secretário-Geral', 'Tesoureiro'];
    }
    return ['Coordenador', 'Subcoordenador', 'Secretária', 'Membro'];
  };

  // Badge styling for roles
  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'Presidente':
        return 'bg-rose-100 text-rose-800 border border-rose-300 font-bold';
      case 'Vice-Presidente':
        return 'bg-pink-100 text-pink-800 border border-pink-300 font-bold';
      case 'Secretário-Geral':
        return 'bg-purple-100 text-purple-800 border border-purple-300 font-bold';
      case 'Tesoureiro':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold';
      case 'Coordenador':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold';
      case 'Subcoordenador':
      case 'Vice-Coordenador':
        return 'bg-sky-100 text-sky-800 border border-sky-300 font-bold';
      case 'Secretária':
      case 'Secretaria':
        return 'bg-teal-100 text-teal-800 border border-teal-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
    }
  };

  // Find member already occupying a role in a given department (Rule: Não pode ter dois cargos iguais em um departamento)
  const getRoleOccupant = (deptName: string, roleName: string, excludeMemberId?: string): Member | undefined => {
    if (!deptName || !roleName) return undefined;
    if (roleName.trim().toLowerCase() === 'membro') return undefined; // 'Membro' can be assigned to multiple students
    return members.find(m => 
      m.department.trim().toLowerCase() === deptName.trim().toLowerCase() &&
      m.departmentRole.trim().toLowerCase() === roleName.trim().toLowerCase() &&
      (!excludeMemberId || m.id !== excludeMemberId)
    );
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch =
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.memberNumber && m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.accessCode && m.accessCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.classLevel && m.classLevel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.department && m.department.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      if (departmentFilter !== 'all' && m.department !== departmentFilter) return false;
      if (classFilter !== 'all' && m.classLevel !== classFilter) return false;

      return true;
    });
  }, [members, searchTerm, departmentFilter, classFilter]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Nº Sócio', 'Código de Acesso', 'Nº Processo', 'Nome Completo', 'Classe', 'Turma', 'Turno', 'Departamento', 'Cargo Escolar', 'Email', 'Telefone', 'Estado'];
    const rows = filteredMembers.map(m => [
      m.memberNumber || '—',
      m.accessCode || '—',
      m.studentNumber,
      m.fullName,
      m.classLevel || '—',
      m.turma || '—',
      m.turno || '—',
      m.department || 'Geral',
      m.departmentRole || m.category,
      m.email,
      m.phone,
      m.status.toUpperCase(),
    ]);
    exportToCsv(`membros_escola_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Create department on the fly
  const handleCreateDepartment = (name: string, isAdmin: boolean) => {
    if (!name.trim()) return;
    const created = storage.addDepartment(name, isAdmin);
    const updated = storage.getDepartments();
    setCustomDepartments(updated);
    setSelectedDept(created.name);
    setInlineDeptName('');
    setInlineDeptIsAdmin(false);
    setShowInlineNewDept(false);

    // Auto-select first available role
    const roles = getAllowedRoles(created.name);
    const firstFree = roles.find(r => !getRoleOccupant(created.name, r));
    setSelectedRole(firstFree || roles[0]);
  };

  // Create department from Department Manager Modal
  const handleCreateDepartmentFromManager = (e: React.FormEvent) => {
    e.preventDefault();
    setDeptManagerError(null);
    const clean = newDeptManagerName.trim();
    if (!clean) {
      setDeptManagerError('Por favor, introduza o nome do departamento.');
      return;
    }
    const exists = customDepartments.some(d => d.name.toLowerCase() === clean.toLowerCase());
    if (exists) {
      setDeptManagerError(`O departamento "${clean}" já existe na lista.`);
      return;
    }
    storage.addDepartment(clean, newDeptManagerIsAdmin);
    setCustomDepartments(storage.getDepartments());
    setNewDeptManagerName('');
    setNewDeptManagerIsAdmin(false);
  };

  // Delete department with in-app confirmation
  const handleDeleteDepartment = (dept: DepartmentItem) => {
    setDeptToDelete(dept);
  };

  const confirmDeleteDeptAction = () => {
    if (!deptToDelete) return;
    storage.deleteDepartment(deptToDelete.id);
    const updated = storage.getDepartments();
    setCustomDepartments(updated);
    if (selectedDept === deptToDelete.name) {
      setSelectedDept(updated[0]?.name || '');
    }
    setDeptToDelete(null);
  };

  // Add / Edit Member with strict uniqueness validation
  const handleSaveMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const fd = new FormData(e.currentTarget);
    const fullName = (fd.get('fullName') as string || '').trim();
    const studentNumber = (fd.get('studentNumber') as string || '').trim();
    const email = fd.get('email') as string;
    const phone = fd.get('phone') as string;
    const classLevel = fd.get('classLevel') as string;
    const turma = fd.get('turma') as string;
    const course = fd.get('course') as string;
    const turno = fd.get('turno') as 'Manhã' | 'Tarde' | 'Noite';
    const department = (fd.get('department') as string || selectedDept || '').trim();
    const departmentRole = (fd.get('departmentRole') as string || selectedRole || '').trim();
    const notes = fd.get('notes') as string;

    if (!department) {
      setFormError('Por favor, selecione ou crie um departamento para o membro.');
      return;
    }

    if (!departmentRole) {
      setFormError('Por favor, selecione um cargo para o membro.');
      return;
    }

    // Rule: Presidente e Vice-Presidente apenas para a área administrativa
    const isAdmin = isAdministrativeDept(department);
    if (!isAdmin && (departmentRole === 'Presidente' || departmentRole === 'Vice-Presidente')) {
      setFormError(`Os cargos de Presidente e Vice-Presidente pertencem exclusivamente à Área Administrativa! Nos outros departamentos os cargos permitidos são somente Coordenador, Subcoordenador e Secretária.`);
      return;
    }

    // Rule: Não pode ter dois cargos iguais em um departamento
    const existingOccupant = getRoleOccupant(department, departmentRole, editingMember?.id);
    if (existingOccupant) {
      setFormError(`Não é permitido ter dois cargos iguais no mesmo departamento! O cargo de "${departmentRole}" no "${department}" já está ocupado por ${existingOccupant.fullName} (Nº ${existingOccupant.studentNumber}).`);
      return;
    }

    const category = isAdmin ? 'direcao' : 'coordenacao';

    // Ensure department is saved in custom departments
    storage.addDepartment(department, isAdmin);
    setCustomDepartments(storage.getDepartments());

    if (editingMember) {
      storage.updateMember(editingMember.id, {
        fullName,
        studentNumber,
        email,
        phone,
        classLevel,
        turma,
        course,
        turno,
        department,
        departmentRole,
        category,
        notes,
      });
      setShowAddModal(false);
      setEditingMember(null);
    } else {
      const created = storage.addMember({
        fullName,
        studentNumber,
        email,
        phone,
        classLevel,
        turma,
        course,
        turno,
        department,
        departmentRole,
        category,
        status: 'ativo',
        joinDate: new Date().toISOString().slice(0, 10),
        idCardIssued: true,
        notes,
      });

      // If registered member is administrative, auto-sync leadership settings
      if (isAdmin) {
        storage.syncLeadershipSettings(created);
      }

      setShowAddModal(false);
      setEditingMember(null);
      // Automatically present the newly generated credentials modal!
      setCredentialsMember({ member: created, isNew: true });
    }
  };

  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member);
  };

  const confirmDeleteMemberAction = () => {
    if (!memberToDelete) return;
    storage.deleteMember(memberToDelete.id);
    setMemberToDelete(null);
  };

  const openAddModal = (member?: Member) => {
    setFormError(null);
    setShowInlineNewDept(false);
    setInlineDeptName('');
    if (member) {
      setEditingMember(member);
      setSelectedDept(member.department || (allDepartmentNames[0] || ''));
      setSelectedRole(member.departmentRole || '');
    } else {
      setEditingMember(null);
      const defaultDept = (!isGlobalAdmin(currentUser) && currentUser.department)
        ? currentUser.department
        : (allDepartmentNames[0] || '');
      setSelectedDept(defaultDept);
      if (defaultDept) {
        const roles = getAllowedRoles(defaultDept);
        const firstFree = roles.find(r => !getRoleOccupant(defaultDept, r));
        setSelectedRole(firstFree || roles[0]);
      } else {
        setSelectedRole('');
      }
    }
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            <span>
              {isDepartmentSecretary(currentUser)
                ? `Secretaria · ${currentUser.department || 'Departamento'}`
                : isDepartmentLeader(currentUser)
                ? `Gestão · ${currentUser.department || 'Departamento'}`
                : 'Membros & Departamentos da Escola'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDepartmentSecretary(currentUser)
              ? `Registo e emissão de fichas de membros, actas e cartões de sócio do ${currentUser.department || 'Departamento'}`
              : isDepartmentLeader(currentUser)
              ? `Liderança, membros e acompanhamento dos trabalhos do ${currentUser.department || 'Departamento'}`
              : 'Quadro executivo da Associação: Presidente e Vice-Presidente (Administrativo) e Coordenadores por departamento'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF Report Export Button */}
          <button
            onClick={onOpenPdfReport}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            title="Gerar e Descarregar Relatório Estruturado em PDF"
          >
            <FileDown className="w-4 h-4 text-rose-400" />
            <span>Exportar Relatório PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>CSV (Excel)</span>
          </button>

          {isGlobalAdmin(currentUser) && (
            <button
              onClick={() => setShowDeptManagerModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200"
              title="Criar e gerir departamentos da associação escolar"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Departamentos ({allDepartmentNames.length})</span>
            </button>
          )}

          {canManageMembers(currentUser) && (
            <button
              onClick={() => openAddModal()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isDepartmentSecretary(currentUser)
                  ? 'Registar Membro'
                  : 'Adicionar Membro'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, nº de processo, departamento ou classe..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto text-xs">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">
              {allDepartmentNames.length === 0 ? 'Sem Departamentos' : `Todos os Departamentos (${allDepartmentNames.length})`}
            </option>
            {allDepartmentNames.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todas as Classes</option>
            <option value="12ª Classe">12ª Classe</option>
            <option value="11ª Classe">11ª Classe</option>
            <option value="10ª Classe">10ª Classe</option>
            <option value="9ª Classe">9ª Classe</option>
            <option value="8ª Classe">8ª Classe</option>
            <option value="7ª Classe">7ª Classe</option>
          </select>
        </div>
      </div>

      {/* Members Container: Responsive Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 bg-slate-50/70">
                <th className="py-3 px-4">Estudante</th>
                <th className="py-3 px-4">Nº Sócio / Acesso</th>
                <th className="py-3 px-4">Nº Processo</th>
                <th className="py-3 px-4">Classe & Turno</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Cargo Escolar</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {member.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{member.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 inline-block">
                      {member.memberNumber || 'SOC-001'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                      {member.accessCode}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 tabular-nums">
                    {member.studentNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-semibold">{member.classLevel || '—'} {member.turma ? `(${member.turma})` : ''}</div>
                    <div className="text-[10px] text-slate-500">{member.turno || 'Geral'}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-700">
                      {member.department || 'Geral'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`text-[11px] px-2 py-0.5 rounded ${getRoleBadgeClass(member.departmentRole || member.category)}`}>
                      {member.departmentRole || member.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setCredentialsMember({ member, isNew: false })}
                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Ver Códigos de Acesso e Senha do Sócio"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSelectedMemberForCard(member)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver Cartão Digital do Aluno"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEmitCertificate(member)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Emitir Declaração de Membro"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {isGlobalAdmin(currentUser) && (
                        <button
                          onClick={() => onOpenNewQuotaModalWithMember(member)}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                          title="Cobrar quota semanal (500 Kz)"
                        >
                          + Quota
                        </button>
                      )}

                      {canManageMembers(currentUser) && (isGlobalAdmin(currentUser) || isMemberInUserScope(currentUser, member)) && (
                        <>
                          <button
                            onClick={() => openAddModal(member)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar Dados do Membro"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remover Membro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Visible only on mobile screens) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredMembers.map((member) => (
            <div key={member.id} className="p-4 space-y-3 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {member.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{member.fullName}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                        {member.memberNumber || 'SOC-001'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {member.accessCode}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${getRoleBadgeClass(member.departmentRole || member.category)}`}>
                  {member.departmentRole || member.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Nº Processo</span>
                  <span className="font-bold font-mono text-slate-800">{member.studentNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Classe / Turno</span>
                  <span className="font-semibold text-slate-800">{member.classLevel} ({member.turno})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block font-medium">Departamento</span>
                  <span className="font-medium text-slate-700 truncate block">{member.department}</span>
                </div>
              </div>

              {/* Action Buttons for Mobile */}
              <div className="flex items-center justify-between pt-1 gap-1 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCredentialsMember({ member, isNew: false })}
                    className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg font-semibold flex items-center gap-1"
                    title="Credenciais"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Acesso</span>
                  </button>

                  <button
                    onClick={() => setSelectedMemberForCard(member)}
                    className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1"
                    title="Cartão"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Cartão</span>
                  </button>

                  <button
                    onClick={() => onEmitCertificate(member)}
                    className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1"
                    title="Declaração"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {isGlobalAdmin(currentUser) && (
                    <button
                      onClick={() => onOpenNewQuotaModalWithMember(member)}
                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-lg"
                    >
                      + Quota
                    </button>
                  )}
                  {canManageMembers(currentUser) && (isGlobalAdmin(currentUser) || isMemberInUserScope(currentUser, member)) && (
                    <>
                      <button
                        onClick={() => openAddModal(member)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="py-12 text-center p-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Ainda não existem membros registados</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              O sistema está limpo. Comece por registar o Presidente, Vice-Presidente ou Coordenadores de departamento.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => openAddModal()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                + Registar Primeiro Membro
              </button>
              {onLoadSampleData && (
                <button
                  onClick={onLoadSampleData}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Carregar Exemplo de Escola
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Digital Member Card Modal */}
      {selectedMemberForCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Cartão de Associado Escolar · {settings.acronym}
              </h3>
              <button
                onClick={() => setSelectedMemberForCard(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-indigo-400/30">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={settings.logoUrl || '/src/assets/images/association_crest_1793825853762.jpg'}
                      alt="Brasão"
                      className="w-10 h-10 rounded-full object-cover bg-white ring-1 ring-white/20"
                    />
                    <div>
                      <h4 className="text-xs font-black tracking-wider text-white uppercase">
                        {settings.acronym}
                      </h4>
                      <p className="text-[9px] text-indigo-200">
                        {settings.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {settings.academicYear}
                  </span>
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Nome do Aluno</span>
                      <div className="text-sm font-bold text-white truncate">{selectedMemberForCard.fullName}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 block">Nº Processo</span>
                        <span className="font-mono font-bold text-indigo-300">{selectedMemberForCard.studentNumber}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 block">Classe / Turno</span>
                        <span className="font-semibold text-slate-200">
                          {selectedMemberForCard.classLevel} ({selectedMemberForCard.turno})
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block">Departamento & Cargo</span>
                      <span className="text-xs font-bold text-amber-300 truncate block">
                        {selectedMemberForCard.departmentRole} · {selectedMemberForCard.department}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                    <QRCodeSvg
                      value={`AE_ESCOLA:${selectedMemberForCard.studentNumber}:${selectedMemberForCard.departmentRole}`}
                      size={86}
                    />
                    <div className="text-[8px] text-slate-500 text-center font-mono mt-1 font-bold">
                      OFICIAL
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{settings.institution}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Válido {settings.academicYear}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Cartão</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Editar Dados do Membro Escolar' : 'Registar Membro na Associação Escolar'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMember(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Completo do Aluno *</label>
                  <input
                    name="fullName"
                    defaultValue={editingMember?.fullName || ''}
                    required
                    placeholder="Ex: Manuel António Domingos"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº de Processo Escolar *</label>
                  <input
                    name="studentNumber"
                    defaultValue={editingMember?.studentNumber || ''}
                    required
                    placeholder="Ex: PROC-1042"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Department & Role selection according to exact user rules */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                {/* Department Selection */}
                <div>
                  {!isGlobalAdmin(currentUser) && currentUser.department ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-indigo-950">
                          Departamento Atribuído *
                        </label>
                        <span className="text-[10px] text-teal-800 bg-teal-100 font-bold px-2 py-0.5 rounded">
                          {isDepartmentSecretary(currentUser) ? 'Secretaria do Dept.' : 'Coordenação'}
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 flex items-center justify-between shadow-xs">
                        <span>{currentUser.department}</span>
                        <span className="text-[10px] font-normal text-slate-500">Exclusivo do seu departamento</span>
                      </div>
                      <input type="hidden" name="department" value={currentUser.department} />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-indigo-950">
                          Departamento da Associação Escolar *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowInlineNewDept(!showInlineNewDept)}
                          className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{showInlineNewDept ? 'Cancelar Novo' : '+ Criar Departamento'}</span>
                        </button>
                      </div>

                      {allDepartmentNames.length === 0 || showInlineNewDept ? (
                        <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2 mb-2">
                          <p className="text-[11px] font-bold text-slate-800">
                            {allDepartmentNames.length === 0 
                              ? 'Ainda não existem departamentos criados. Digite o nome do departamento que deseja criar:' 
                              : 'Novo Departamento a criar:'}
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Ex: Departamento Administrativo ou Departamento Pedagógico"
                              value={inlineDeptName}
                              onChange={(e) => setInlineDeptName(e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-indigo-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (inlineDeptName.trim()) {
                                  handleCreateDepartment(inlineDeptName.trim(), inlineDeptIsAdmin);
                                }
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shrink-0"
                            >
                              Criar
                            </button>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 pt-1">
                            <input
                              type="checkbox"
                              checked={inlineDeptIsAdmin}
                              onChange={(e) => setInlineDeptIsAdmin(e.target.checked)}
                              className="rounded text-indigo-600"
                            />
                            <span>É a Área Administrativa da Associação? (Habilita os cargos exclusivos de Presidente e Vice-Presidente)</span>
                          </label>
                        </div>
                      ) : (
                        <select
                          name="department"
                          value={selectedDept}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            setSelectedDept(newDept);
                            setFormError(null);
                            const roles = getAllowedRoles(newDept);
                            const firstFree = roles.find(r => !getRoleOccupant(newDept, r, editingMember?.id));
                            setSelectedRole(firstFree || roles[0]);
                          }}
                          className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                        >
                          {allDepartmentNames.map(dep => (
                            <option key={dep} value={dep}>{dep}</option>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </div>

                {/* Role in Department */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-indigo-950">
                      Cargo no Departamento *
                    </label>
                    <span className="text-[10px] text-indigo-700 font-semibold">
                      (Apenas 1 membro por cargo)
                    </span>
                  </div>

                  {selectedDept ? (
                    (() => {
                      const allowedRoles = getAllowedRoles(selectedDept);
                      const isAdm = isAdministrativeDept(selectedDept);

                      return (
                        <div className="space-y-2">
                          <select
                            name="departmentRole"
                            value={selectedRole}
                            onChange={(e) => {
                              setSelectedRole(e.target.value);
                              setFormError(null);
                            }}
                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-indigo-900"
                          >
                            {allowedRoles.map(role => {
                              const occupant = getRoleOccupant(selectedDept, role, editingMember?.id);
                              const isOccupied = Boolean(occupant);
                              return (
                                <option key={role} value={role} disabled={isOccupied}>
                                  {role} {isOccupied ? `— 🚫 (Ocupado por ${occupant?.fullName})` : '— ✓ (Disponível)'}
                                </option>
                              );
                            })}
                          </select>

                          {/* Role rules guidance banner */}
                          {isAdm ? (
                            <div className="p-2.5 rounded-lg bg-indigo-100/70 text-indigo-950 text-[11px] font-medium leading-relaxed">
                              🏛️ <strong>Área Administrativa:</strong> Cargos disponíveis: <strong>Presidente</strong>, <strong>Vice-Presidente</strong>, <strong>Secretário-Geral</strong> e <strong>Tesoureiro</strong>. Conforme os estatutos, cada cargo só pode ser ocupado por um único titular.
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium leading-relaxed">
                              📋 <strong>{selectedDept}:</strong> Cargos disponíveis exclusivamente: <strong>Coordenador</strong>, <strong>Subcoordenador</strong> e <strong>Secretária</strong>. Os cargos de Presidente e Vice-Presidente pertencem somente à área administrativa.
                            </div>
                          )}

                          {/* Warning if all roles in this department are already occupied */}
                          {allowedRoles.every(r => getRoleOccupant(selectedDept, r, editingMember?.id)) && (
                            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Todos os cargos do departamento "{selectedDept}" já foram preenchidos. Não é permitido dois cargos iguais no mesmo departamento. Crie um novo departamento ou edite o titular atual.</span>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      Crie ou selecione primeiro um departamento para ver os cargos disponíveis.
                    </p>
                  )}
                </div>
              </div>

              {/* School Class, Turma, Turno - 1 coluna em mobile, 3 colunas em ecrãs maiores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Classe *</label>
                  <select
                    name="classLevel"
                    defaultValue={editingMember?.classLevel || '10ª Classe'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="12ª Classe">12ª Classe</option>
                    <option value="11ª Classe">11ª Classe</option>
                    <option value="10ª Classe">10ª Classe</option>
                    <option value="9ª Classe">9ª Classe</option>
                    <option value="8ª Classe">8ª Classe</option>
                    <option value="7ª Classe">7ª Classe</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turma</label>
                  <input
                    name="turma"
                    defaultValue={editingMember?.turma || 'Turma A'}
                    placeholder="Ex: Turma A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turno *</label>
                  <select
                    name="turno"
                    defaultValue={editingMember?.turno || 'Manhã'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Curso / Área de Estudo</label>
                  <input
                    name="course"
                    defaultValue={editingMember?.course || 'Ciências Físicas e Biológicas'}
                    placeholder="Ex: CFB, CEJ, Informática..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    name="phone"
                    defaultValue={editingMember?.phone || ''}
                    placeholder="+244 9xx xxx xxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingMember?.email || ''}
                  placeholder="estudante@escola.ao"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingMember ? 'Atualizar Membro' : 'Registar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Credentials Modal */}
      {credentialsMember && (
        <MemberCredentialsModal
          member={credentialsMember.member}
          settings={settings}
          isNewRegistration={credentialsMember.isNew}
          onEnterAdminPanel={(m) => {
            const adminUser: UserProfile = {
              id: `usr-${m.id}`,
              memberId: m.id,
              memberNumber: m.memberNumber,
              accessCode: m.accessCode,
              name: m.fullName,
              email: m.email,
              role: 'admin',
              adminRole: m.departmentRole as any,
              phone: m.phone,
              bio: `${m.departmentRole} da Associação de Estudantes`,
              joinedYear: m.joinDate?.slice(0, 4) || '2026',
              notificationsEnabled: true,
            };
            storage.setCurrentUser(adminUser);
            if (onSwitchUser) onSwitchUser(adminUser);
            if (onNavigateTab) onNavigateTab('dashboard');
          }}
          onClose={() => setCredentialsMember(null)}
        />
      )}

      {/* Department Manager Modal */}
      {showDeptManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Departamentos da Associação Escolar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crie os seus departamentos e controle os cargos e titulares exclusivos
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeptManagerModal(false);
                  setDeptManagerError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Statuts & Rules Reminder */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Regras Estatutárias de Cargos</span>
                </div>
                <ul className="text-slate-600 text-[11px] space-y-1 list-disc list-inside">
                  <li><strong>Área Administrativa:</strong> Exclusiva para os cargos de <strong>Presidente</strong>, <strong>Vice-Presidente</strong>, <strong>Secretário-Geral</strong> e <strong>Tesoureiro</strong>.</li>
                  <li><strong>Outros Departamentos:</strong> Exclusivos para os cargos de <strong>Coordenador</strong>, <strong>Subcoordenador</strong> e <strong>Secretária</strong>.</li>
                  <li><strong>Unicidade:</strong> Não pode haver dois titulares para o mesmo cargo no mesmo departamento.</li>
                </ul>
              </div>

              {/* Add New Department Form */}
              <form onSubmit={handleCreateDepartmentFromManager} className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-200/80 space-y-3">
                <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>Criar Novo Departamento</span>
                </h4>

                {deptManagerError && (
                  <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{deptManagerError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Nome do Departamento *</label>
                    <input
                      value={newDeptManagerName}
                      onChange={(e) => setNewDeptManagerName(e.target.value)}
                      placeholder="Ex: Departamento de Cultura e Recreação"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newDeptManagerIsAdmin}
                    onChange={(e) => setNewDeptManagerIsAdmin(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-[11px] font-medium text-slate-700">
                    Definir como <strong>Área Administrativa</strong> (Permite Presidente, Vice-Presidente, Secretário-Geral e Tesoureiro)
                  </span>
                </label>
              </form>

              {/* Department List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Departamentos Existentes ({customDepartments.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    O espaço inicia em branco para criação livre
                  </span>
                </div>

                {customDepartments.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-3">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">Ainda não criou nenhum departamento</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      O espaço dos departamentos está limpo conforme solicitado. Pode adicionar os seus próprios nomes acima ou utilizar uma das sugestões rápidas:
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          storage.addDepartment('Departamento Administrativo', true);
                          setCustomDepartments(storage.getDepartments());
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                      >
                        + Departamento Administrativo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          storage.addDepartment('Departamento de Desporto', false);
                          setCustomDepartments(storage.getDepartments());
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                      >
                        + Dept. de Desporto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          storage.addDepartment('Departamento de Cultura e Artes', false);
                          setCustomDepartments(storage.getDepartments());
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                      >
                        + Dept. de Cultura e Artes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          storage.addDepartment('Departamento de Apoio Social', false);
                          setCustomDepartments(storage.getDepartments());
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                      >
                        + Dept. de Apoio Social
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customDepartments.map((dept) => {
                      const isAdm = isAdministrativeDept(dept.name);
                      const allowedRoles = getAllowedRoles(dept.name);
                      const assignedMembers = members.filter(
                        m => m.department.trim().toLowerCase() === dept.name.trim().toLowerCase()
                      );

                      return (
                        <div key={dept.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isAdm 
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              }`}>
                                {isAdm ? '🏛️ Administrativo' : '📋 Dept. Escolar'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                ({assignedMembers.length} membro{assignedMembers.length === 1 ? '' : 's'})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteDepartment(dept)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Remover departamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Role breakdown and occupants */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                            {allowedRoles.map((role) => {
                              const occupant = getRoleOccupant(dept.name, role);
                              return (
                                <div
                                  key={role}
                                  className={`p-2 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                                    occupant
                                      ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                                      : 'bg-slate-50 border-dashed border-slate-200 text-slate-500'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <span className="font-bold block truncate">{role}</span>
                                    {occupant ? (
                                      <span className="text-[10px] text-emerald-800 truncate block">
                                        ✓ {occupant.fullName} ({occupant.studentNumber})
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">
                                        ⭕ Cargo Vago
                                      </span>
                                    )}
                                  </div>

                                  {!occupant && currentUser.role === 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowDeptManagerModal(false);
                                        openAddModal();
                                        setSelectedDept(dept.name);
                                        setSelectedRole(role);
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 rounded text-[10px] font-bold shrink-0 shadow-2xs"
                                    >
                                      + Atribuir
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowDeptManagerModal(false);
                  setDeptManagerError(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Dialog for Member Deletion */}
      <ConfirmDialog
        isOpen={Boolean(memberToDelete)}
        title="Eliminar Membro da Escola"
        message={`Tem a certeza de que deseja eliminar o membro "${memberToDelete?.fullName}"?`}
        detail={memberToDelete ? `Nº Processo: ${memberToDelete.studentNumber} · Cargo: ${memberToDelete.departmentRole} (${memberToDelete.department}). O histórico e acessos deste membro serão removidos.` : undefined}
        confirmLabel="Eliminar Membro"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteMemberAction}
        onClose={() => setMemberToDelete(null)}
      />

      {/* In-App Confirmation Dialog for Department Deletion */}
      <ConfirmDialog
        isOpen={Boolean(deptToDelete)}
        title="Eliminar Departamento"
        message={`Tem a certeza de que deseja remover o departamento "${deptToDelete?.name}"?`}
        detail={deptToDelete ? (() => {
          const count = members.filter(m => m.department.trim().toLowerCase() === deptToDelete.name.trim().toLowerCase()).length;
          return count > 0 
            ? `Atenção: Este departamento tem ${count} membro(s) associado(s). Se confirmar, estes membros ficarão sem departamento atribuído.`
            : 'Este departamento não possui membros associados e será removido de forma segura.';
        })() : undefined}
        confirmLabel="Eliminar Departamento"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteDeptAction}
        onClose={() => setDeptToDelete(null)}
      />
    </div>
  );
};
