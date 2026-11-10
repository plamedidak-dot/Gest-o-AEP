import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  UserX, 
  Sliders, 
  Search, 
  Filter, 
  KeyRound, 
  Phone, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Activity, 
  Download, 
  Trash2, 
  RefreshCw, 
  PlusCircle, 
  Terminal, 
  Layers, 
  Briefcase, 
  Sparkles,
  ArrowUpDown,
  Building2,
  X
} from 'lucide-react';
import { 
  UserProfile, 
  UserRole, 
  AssociationSettings, 
  Member, 
  SystemLogEntry, 
  LogLevel,
  MemberStatus
} from '../types';
import { storage, ADMIN_ACCOUNTS } from '../services/storage';
import { isSuperAdmin, getUserBadgeInfo } from '../utils/permissions';
import { formatDatePt } from '../utils/formatters';

interface GeneralAdminDashboardProps {
  currentUser: UserProfile;
  settings: AssociationSettings;
  onReloadData?: () => void;
}

export const GeneralAdminDashboard: React.FC<GeneralAdminDashboardProps> = ({
  currentUser,
  settings,
  onReloadData,
}) => {
  // Access Control Guard: strictly check superadmin
  const hasAccess = isSuperAdmin(currentUser);

  // Tab within General Admin
  const [activeSubTab, setActiveSubTab] = useState<'permissions' | 'logs'>('permissions');

  // Permissions & Users State
  const [members, setMembers] = useState<Member[]>(() => storage.getMembers());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Edit Permissions Modal State
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    phone: string;
    studentNumber?: string;
    currentRole: UserRole;
    currentDept: string;
    currentDeptRole: string;
    currentStatus: MemberStatus;
    isSuperAdminAccount?: boolean;
    isAdminAccount?: boolean;
  } | null>(null);

  const [formRole, setFormRole] = useState<UserRole>('member');
  const [formDept, setFormDept] = useState<string>('');
  const [formDeptRole, setFormDeptRole] = useState<string>('');
  const [formStatus, setFormStatus] = useState<MemberStatus>('ativo');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formPasswordReset, setFormPasswordReset] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // System Logs State
  const [logs, setLogs] = useState<SystemLogEntry[]>(() => storage.getCentralSystemLogs());
  const [logFilterLevel, setLogFilterLevel] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Auto-refresh logs when storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      setMembers(storage.getMembers());
      setLogs(storage.getCentralSystemLogs());
    };
    window.addEventListener('ae_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('ae_storage_updated', handleStorageUpdate);
  }, []);

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-rose-200 shadow-sm max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center ring-4 ring-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900">Acesso Restrito: Nível SuperAdmin</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            O painel <strong>GeneralAdminDashboard</strong> destina-se exclusivamente ao Administrador Geral e Engenheiro de Software da plataforma.
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-mono">
          Utilizador atual: {currentUser.name} ({currentUser.role})
        </div>
      </div>
    );
  }

  // Pre-aggregated list of all accounts (Administrative + Members)
  const allAccounts = [
    ...ADMIN_ACCOUNTS.map(a => ({
      id: a.id,
      name: a.name,
      phone: a.phone || '',
      studentNumber: a.accessCode,
      role: a.role,
      department: a.department || 'Administração Central',
      departmentRole: a.adminRole || a.departmentRole || 'Diretor',
      status: 'ativo' as MemberStatus,
      isSuperAdminAccount: a.role === 'superadmin' || a.id === 'usr-dev-master',
      isAdminAccount: true,
      joinDate: '2026-01-01',
    })),
    ...members.map(m => {
      // resolve member user role
      let role: UserRole = 'member';
      const dRole = (m.departmentRole || '').toLowerCase();
      if (dRole.includes('coordenador') || dRole.includes('subcoordenador')) role = 'coordinator';
      else if (dRole.includes('secretár') || dRole.includes('secretar')) role = 'secretary';

      return {
        id: m.id,
        name: m.fullName,
        phone: m.phone || '',
        studentNumber: m.studentNumber,
        role,
        department: m.department || 'Geral',
        departmentRole: m.departmentRole || 'Membro',
        status: m.status || ('ativo' as MemberStatus),
        isSuperAdminAccount: false,
        isAdminAccount: false,
        joinDate: m.joinDate,
      };
    })
  ];

  // Unique departments for filter
  const departmentsList = Array.from(new Set(allAccounts.map(a => a.department).filter(Boolean)));

  // Filtered accounts
  const filteredAccounts = allAccounts.filter(acc => {
    const matchesSearch = 
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.phone.includes(searchTerm) ||
      (acc.studentNumber && acc.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      acc.departmentRole.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRoleFilter === 'all' || acc.role === selectedRoleFilter;
    const matchesDept = selectedDeptFilter === 'all' || acc.department === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'all' || acc.status === selectedStatusFilter;

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  // User Stats
  const superAdminCount = allAccounts.filter(a => a.role === 'superadmin').length;
  const adminCount = allAccounts.filter(a => a.role === 'admin').length;
  const coordinatorCount = allAccounts.filter(a => a.role === 'coordinator' || a.role === 'subcoordinator').length;
  const secretaryCount = allAccounts.filter(a => a.role === 'secretary').length;
  const memberCount = allAccounts.filter(a => a.role === 'member').length;
  const suspendedCount = allAccounts.filter(a => a.status === 'suspenso').length;

  // Open Edit Modal
  const handleOpenEditUser = (acc: typeof allAccounts[0]) => {
    setEditingUser({
      id: acc.id,
      name: acc.name,
      phone: acc.phone,
      studentNumber: acc.studentNumber,
      currentRole: acc.role,
      currentDept: acc.department,
      currentDeptRole: acc.departmentRole,
      currentStatus: acc.status,
      isSuperAdminAccount: acc.isSuperAdminAccount,
      isAdminAccount: acc.isAdminAccount,
    });
    setFormRole(acc.role);
    setFormDept(acc.department);
    setFormDeptRole(acc.departmentRole);
    setFormStatus(acc.status);
    setFormPhone(acc.phone);
    setFormPasswordReset('');
    setFeedbackSuccess(null);
  };

  // Save Permissions
  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const ok = storage.updateUserRoleAndPermissions(
      editingUser.id,
      formRole,
      formDept,
      formDeptRole,
      formStatus,
      formPhone,
      currentUser.name
    );

    // Optional direct password reset
    if (formPasswordReset.trim()) {
      if (editingUser.isAdminAccount) {
        storage.updateAccountPassword(editingUser.id, formPasswordReset);
      } else {
        storage.resetMemberPassword(editingUser.id, formPasswordReset);
      }
    }

    if (ok) {
      setFeedbackSuccess(`Permissões de ${editingUser.name} atualizadas com sucesso para "${formRole}"!`);
      setMembers(storage.getMembers());
      setLogs(storage.getCentralSystemLogs());
      onReloadData?.();

      setTimeout(() => {
        setEditingUser(null);
        setFeedbackSuccess(null);
      }, 1500);
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchesLevel = logFilterLevel === 'all' || log.level === logFilterLevel;
    const matchesSearch = 
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      (log.user && log.user.toLowerCase().includes(logSearchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const handleExportLogs = () => {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_auditoria_sistema_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Tem a certeza que deseja limpar todos os registos centrais de auditoria?')) {
      storage.clearCentralSystemLogs();
      setLogs([]);
    }
  };

  const handleInjectTestLog = () => {
    storage.logSystemEvent(
      'Teste de Monitoramento Central',
      `Evento de teste disparado manualmente pelo Engenheiro ${currentUser.name}.`,
      'info',
      currentUser.name,
      'system'
    );
    setLogs(storage.getCentralSystemLogs());
  };

  return (
    <div className="space-y-6 antialiased">
      
      {/* Top Banner: General Admin & Engineer Control Room */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-mono font-bold tracking-wider uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Painel Geral do Administrador · Exclusivo SuperAdmin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>GeneralAdminDashboard</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold">
                RBAC & AUDIT
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Centro de comando para <strong>gestão global de permissões e papéis</strong> de todos os utilizadores e <strong>monitoramento central de logs</strong> de auditoria do sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/80 shrink-0">
            <button
              onClick={() => setActiveSubTab('permissions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'permissions'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestão de Permissões</span>
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'logs'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Monitoramento de Logs</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                {logs.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: PERMISSION MANAGEMENT */}
      {activeSubTab === 'permissions' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Permission Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">SuperAdmins</span>
                <Terminal className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{superAdminCount}</p>
              <span className="text-[10px] text-purple-700 font-bold">Engenheiro / Root</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Admin Geral</span>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{adminCount}</p>
              <span className="text-[10px] text-indigo-700 font-bold">Direção AEP-2</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Coordenadores</span>
                <Briefcase className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{coordinatorCount}</p>
              <span className="text-[10px] text-sky-700 font-bold">Líderes de Dept.</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Secretárias</span>
                <Layers className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{secretaryCount}</p>
              <span className="text-[10px] text-teal-700 font-bold">Actas & Chamadas</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Membros & Sócios</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{memberCount}</p>
              <span className="text-[10px] text-emerald-700 font-bold">Base Associativa</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Suspensos</span>
                <UserX className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{suspendedCount}</p>
              <span className="text-[10px] text-rose-700 font-bold">Acesso Bloqueado</span>
            </div>
          </div>

          {/* Accounts & Permissions Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Table Search & Filters Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>Controlo de Níveis de Acesso e Permissões</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Gerencie diretamente as credenciais, o departamento e os privilégios de cada utilizador.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Input */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar nome, tel ou cargo..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">Todos os Papéis</option>
                  <option value="superadmin">SuperAdmin (Engenheiro)</option>
                  <option value="admin">Administrador Geral</option>
                  <option value="coordinator">Coordenador</option>
                  <option value="secretary">Secretária</option>
                  <option value="member">Sócio / Membro</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">Todos os Estados</option>
                  <option value="ativo">Ativo</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10 font-bold">
                  <tr>
                    <th className="py-3 px-4">Utilizador / Identidade</th>
                    <th className="py-3 px-3">Papel no Sistema</th>
                    <th className="py-3 px-3">Departamento & Cargo</th>
                    <th className="py-3 px-3">Telefone Oficial</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-4 text-right">Ação SuperAdmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAccounts.map((acc) => {
                    const isSuper = acc.role === 'superadmin';
                    const isAdmin = acc.role === 'admin';
                    const isCoord = acc.role === 'coordinator';
                    const isSec = acc.role === 'secretary';

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            {isSuper && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-mono font-bold">
                                ROOT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {acc.studentNumber || 'Sem código'}
                          </div>
                        </td>
                        
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSuper 
                              ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                              : isAdmin 
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              : isCoord 
                              ? 'bg-sky-100 text-sky-900 border border-sky-200'
                              : isSec 
                              ? 'bg-teal-100 text-teal-900 border border-teal-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {acc.role}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{acc.department}</div>
                          <div className="text-[10px] text-slate-500">{acc.departmentRole}</div>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {acc.phone || 'Sem telefone'}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            acc.status === 'ativo'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : acc.status === 'suspenso'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {acc.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditUser(acc)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Editar Permissões
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Nenhum utilizador encontrado para estes filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: SYSTEM LOGS MONITORING */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            
            {/* Log Bar Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Fluxo Central de Auditoria e Logs de Segurança</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Registo em tempo real de autenticações, alterações de papéis, sincronizações com a nuvem e operações críticas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleInjectTestLog}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Disparar log de teste para verificar monitoramento"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                  <span>Testar Log</span>
                </button>

                <button
                  onClick={handleExportLogs}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Exportar JSON</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Logs</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setLogFilterLevel('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    logFilterLevel === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({logs.length})
                </button>

                <button
                  onClick={() => setLogFilterLevel('security')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    logFilterLevel === 'security'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  Segurança & Permissões
                </button>

                <button
                  onClick={() => setLogFilterLevel('error')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    logFilterLevel === 'error'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Erros
                </button>

                <button
                  onClick={() => setLogFilterLevel('warn')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    logFilterLevel === 'warn'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Avisos
                </button>

                <button
                  onClick={() => setLogFilterLevel('info')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    logFilterLevel === 'info'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  Informativos
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Filtrar eventos por texto..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                />
              </div>
            </div>

            {/* Live Logs Stream Table / Cards */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono text-xs pr-1">
              {filteredLogs.map((log) => {
                const isSec = log.level === 'security';
                const isErr = log.level === 'error';
                const isWarn = log.level === 'warn';

                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSec
                        ? 'bg-purple-50/40 border-purple-200'
                        : isErr
                        ? 'bg-rose-50/50 border-rose-200'
                        : isWarn
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isSec
                            ? 'bg-purple-200 text-purple-900'
                            : isErr
                            ? 'bg-rose-200 text-rose-900'
                            : isWarn
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {log.level}
                        </span>
                        <span className="font-bold text-slate-900 font-sans text-xs">
                          {log.action}
                        </span>
                        {log.category && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{log.category}]
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {log.user && (
                          <span className="text-slate-600 font-sans font-semibold">
                            Operador: {log.user}
                          </span>
                        )}
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-sans leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-sans">
                  Nenhum evento de log corresponde aos critérios selecionados.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* EDIT USER PERMISSIONS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Modificar Permissões & Papel
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                    {editingUser.name} ({editingUser.phone})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePermissions} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              
              {feedbackSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{feedbackSuccess}</span>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nível de Permissão (Role) *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="superadmin">superadmin (Acesso Total + Consola de Engenharia)</option>
                  <option value="admin">admin (Direção Geral: Presidente, Vice, Tesoureiro, Secretária-Geral)</option>
                  <option value="coordinator">coordinator (Coordenador de Departamento)</option>
                  <option value="subcoordinator">subcoordinator (Subcoordenador / Vice)</option>
                  <option value="secretary">secretary (Secretária de Departamento)</option>
                  <option value="member">member (Sócio / Estudante Associado Comum)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Controla o menu de navegação e as barreiras de segurança do sistema.
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Departamento Associado *
                </label>
                <input
                  type="text"
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  required
                  placeholder="Ex: Departamento Pedagógico, Departamento de Desporto..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Department Role Title */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Cargo Institucional / Título Departamental *
                </label>
                <input
                  type="text"
                  value={formDeptRole}
                  onChange={(e) => setFormDeptRole(e.target.value)}
                  required
                  placeholder="Ex: Coordenador, Vice-Coordenador, Secretária, Membro Efetivo..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Estado de Acesso à Conta *
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as MemberStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="ativo">Ativo (Acesso Liberado)</option>
                  <option value="suspenso">Suspenso (Acesso Bloqueado pelo SuperAdmin)</option>
                  <option value="pendente">Pendente (Revisão da Secretaria)</option>
                </select>
              </div>

              {/* Telephone */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Número de Telefone de Autenticação:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ex: +244 923 000 000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Direct Password Reset (Optional) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                  <span>Redefinir Senha Deste Utilizador (Opcional):</span>
                </label>
                <input
                  type="text"
                  value={formPasswordReset}
                  onChange={(e) => setFormPasswordReset(e.target.value)}
                  placeholder="Deixe em branco para manter a senha atual"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[10px] text-slate-400">
                  Se preenchido, a senha será imediatamente atualizada no banco.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-bold shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  Gravar Permissões
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
