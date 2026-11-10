import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Key, 
  KeyRound, 
  Search, 
  Download, 
  Upload, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Layers, 
  Users, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Trash2,
  ExternalLink,
  Lock,
  Phone,
  Clock,
  Sparkles
} from 'lucide-react';
import { UserProfile, AssociationSettings, Member } from '../types';
import { storage, ADMIN_ACCOUNTS } from '../services/storage';
import { db, isFirebaseAvailable } from '../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

interface DeveloperConsoleViewProps {
  currentUser: UserProfile;
  settings: AssociationSettings;
  onReloadData?: () => void;
}

export const DeveloperConsoleView: React.FC<DeveloperConsoleViewProps> = ({
  currentUser,
  settings,
  onReloadData,
}) => {
  // Database status & ping
  const [isPinging, setIsPinging] = useState(false);
  const [dbPingResult, setDbPingResult] = useState<{ status: 'online' | 'offline'; latencyMs?: number; message?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Members & Credentials Management
  const [members, setMembers] = useState<Member[]>(() => storage.getMembers());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForReset, setSelectedUserForReset] = useState<{ id: string; name: string; phone: string; type: 'member' | 'admin' } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Phone Edit state
  const [selectedUserForPhone, setSelectedUserForPhone] = useState<{ id: string; name: string; currentPhone: string } | null>(null);
  const [newPhoneInput, setNewPhoneInput] = useState('');

  // Logs
  const [logs, setLogs] = useState(() => storage.getTechnicalLogs());
  const [metrics, setMetrics] = useState(() => storage.getSystemMetrics());

  // Test DB Ping immediately on load
  const runPingTest = async () => {
    setIsPinging(true);
    setDbPingResult(null);
    const start = performance.now();

    try {
      if (!isFirebaseAvailable()) {
        throw new Error('SDK do Firebase não inicializado.');
      }
      // Attempt a real doc write & read to Firestore in gestaep-1f3ed
      const pingDocRef = doc(db, 'system_health', 'live_ping');
      await setDoc(pingDocRef, {
        timestamp: new Date().toISOString(),
        author: currentUser.name,
        role: 'superadmin',
        version: '2.4.0'
      });
      const snap = await getDoc(pingDocRef);
      const end = performance.now();
      const latency = Math.round(end - start);

      if (snap.exists()) {
        setDbPingResult({
          status: 'online',
          latencyMs: latency,
          message: `Conexão ativa com gestaep-1f3ed (default). Resposta em ${latency}ms.`
        });
        storage.logTechnicalAction('Teste de Latência Firestore', `Sucesso: ${latency}ms`, 'ok');
      } else {
        throw new Error('Documento não retornado pelo Firestore.');
      }
    } catch (err: any) {
      setDbPingResult({
        status: 'offline',
        message: err?.message || 'Falha na conexão com a nuvem.'
      });
      storage.logTechnicalAction('Teste de Latência Firestore', `Falha: ${err?.message || 'Erro'}`, 'error');
    } finally {
      setIsPinging(false);
      setLogs(storage.getTechnicalLogs());
    }
  };

  useEffect(() => {
    runPingTest();
  }, []);

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await storage.syncAllToCloud();
      if (res.success) {
        setSyncFeedback({
          success: true,
          message: `Sincronização concluída com sucesso! ${res.count} registos atualizados em gestaep-1f3ed.`
        });
      } else {
        setSyncFeedback({
          success: false,
          message: `Erro na sincronização: ${res.error || 'Erro desconhecido'}`
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        success: false,
        message: `Falha técnica: ${err?.message || 'Erro desconhecido'}`
      });
    } finally {
      setIsSyncing(false);
      setLogs(storage.getTechnicalLogs());
      setMetrics(storage.getSystemMetrics());
      onReloadData?.();
    }
  };

  const handleExportBackup = () => {
    const json = storage.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sistema_aep2_proglory_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    storage.logTechnicalAction('Exportação de Backup', 'Cópia integral do sistema descarregada.', 'ok');
    setLogs(storage.getTechnicalLogs());
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = storage.importBackup(content);
        if (ok) {
          storage.logTechnicalAction('Restauração de Backup', `Backup ${file.name} restaurado com sucesso.`, 'ok');
          setLogs(storage.getTechnicalLogs());
          setMembers(storage.getMembers());
          setMetrics(storage.getSystemMetrics());
          onReloadData?.();
          alert('Backup restaurado com sucesso!');
        } else {
          alert('Ficheiro de backup inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExecutePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPasswordInput.trim()) return;

    if (selectedUserForReset.type === 'member') {
      const ok = storage.resetMemberPassword(selectedUserForReset.id, newPasswordInput);
      if (ok) {
        setResetSuccessMsg(`Senha de ${selectedUserForReset.name} alterada com sucesso para "${newPasswordInput}".`);
        setMembers(storage.getMembers());
      }
    } else {
      const ok = storage.updateAccountPassword(selectedUserForReset.id, newPasswordInput);
      if (ok) {
        setResetSuccessMsg(`Senha administrativa de ${selectedUserForReset.name} alterada para "${newPasswordInput}".`);
      }
    }

    setLogs(storage.getTechnicalLogs());
    setTimeout(() => {
      setSelectedUserForReset(null);
      setNewPasswordInput('');
      setResetSuccessMsg(null);
    }, 2000);
  };

  const handleExecutePhoneUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPhone || !newPhoneInput.trim()) return;

    const ok = storage.updateMemberPhone(selectedUserForPhone.id, newPhoneInput);
    if (ok) {
      setMembers(storage.getMembers());
      setSelectedUserForPhone(null);
      setNewPhoneInput('');
      setLogs(storage.getTechnicalLogs());
    }
  };

  // Filter accounts for credentials management
  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone?.includes(searchTerm) ||
    m.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 antialiased">
      
      {/* Top Engineer Welcome & System Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-mono font-bold tracking-wider uppercase">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Gabinete do Administrador Geral / Engenheiro Técnico</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Consola de Engenharia e Supervisão</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-600 text-white font-mono font-bold">
                ROOT v2.4.0
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Área exclusiva para criação, supervisão técnica, gestão de base de dados e segurança operacional da <strong>{settings.name}</strong> ({settings.institution}).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={runPingTest}
              disabled={isPinging}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 active:bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Activity className={`w-4 h-4 text-purple-400 ${isPinging ? 'animate-pulse' : ''}`} />
              <span>{isPinging ? 'A testar Firestore...' : 'Testar Conexão Firebase'}</span>
            </button>

            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'A Sincronizar Nuvem...' : 'Forçar Sincronização Nuvem'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Cloud Status Bar */}
        <div className="mt-6 pt-5 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Firebase Project:</span>
            <span className="font-bold text-amber-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">
              gestaep-1f3ed
            </span>
            <span className="text-slate-400">Base de Dados:</span>
            <span className="font-bold text-indigo-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">
              (default)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Estado:</span>
            {dbPingResult ? (
              dbPingResult.status === 'online' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>ONLINE ({dbPingResult.latencyMs}ms)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>OFFLINE</span>
                </span>
              )
            ) : (
              <span className="text-slate-400">A verificar...</span>
            )}
          </div>
        </div>
      </div>

      {syncFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-in fade-in ${
          syncFeedback.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {syncFeedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{syncFeedback.message}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Sócios Registados</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{metrics.memberCount}</p>
          <span className="text-[10px] text-slate-400">Coleção 'members'</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Quotas</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{metrics.quotaCount}</p>
          <span className="text-[10px] text-slate-400">Coleção 'quotas'</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Eventos</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{metrics.eventCount}</p>
          <span className="text-[10px] text-slate-400">Coleção 'events'</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Presenças</span>
            <CheckSquare className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{metrics.attendanceCount}</p>
          <span className="text-[10px] text-slate-400">Coleção 'attendance'</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Documentos</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{metrics.documentCount}</p>
          <span className="text-[10px] text-slate-400">Coleção 'documents'</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Departamentos</span>
            <Layers className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{metrics.departmentCount}</p>
          <span className="text-[10px] text-slate-400">Coleção 'departments'</span>
        </div>
      </div>

      {/* Main Section: Technical Tools & Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Member Credentials & Password Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Gestão Direta de Credenciais e Senhas</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Como Administrador Geral/Engenheiro, você pode redefinir senhas e telefones de qualquer membro ou diretor.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por nome, tel ou cargo..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                />
              </div>
            </div>

            {/* Administrative Staff First */}
            <div className="p-4 border-b border-slate-100 bg-purple-50/30">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900 mb-2">
                Direção Administrativa & Engenharia
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ADMIN_ACCOUNTS.map(admin => (
                  <div key={admin.id} className="p-3 bg-white rounded-xl border border-purple-200/80 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{admin.name}</p>
                      <p className="text-[11px] text-purple-700 font-medium">{admin.adminRole}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Tel: {admin.phone}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUserForReset({
                          id: admin.id,
                          name: admin.name,
                          phone: admin.phone || '',
                          type: 'admin'
                        });
                        setNewPasswordInput(admin.password || 'admin123');
                      }}
                      className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                    >
                      Alterar Senha
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Registered Members Table */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Membro / Aluno</th>
                    <th className="py-2.5 px-3 font-bold">Departamento / Cargo</th>
                    <th className="py-2.5 px-3 font-bold">Telefone</th>
                    <th className="py-2.5 px-3 font-bold">Senha Atual</th>
                    <th className="py-2.5 px-4 font-bold text-right">Ação do Engenheiro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{m.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.memberNumber} · {m.studentNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{m.department}</div>
                        <div className="text-[10px] text-slate-500">{m.departmentRole}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700 font-bold">
                        {m.phone}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {m.password || '123456'}
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedUserForPhone({
                              id: m.id,
                              name: m.fullName,
                              currentPhone: m.phone || ''
                            });
                            setNewPhoneInput(m.phone || '');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                          title="Alterar número de telefone"
                        >
                          Telefone
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserForReset({
                              id: m.id,
                              name: m.fullName,
                              phone: m.phone || '',
                              type: 'member'
                            });
                            setNewPasswordInput(m.password || '123456');
                          }}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
                          title="Redefinir senha diretamente"
                        >
                          Redefinir Senha
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Nenhum membro encontrado com os critérios de pesquisa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): System Operations & Logs */}
        <div className="space-y-6">
          
          {/* Cloud & Backup Operations Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              <span>Operações Técnicas de Banco de Dados</span>
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Descarregar Backup Completo (JSON)</span>
              </button>

              <label className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-dashed border-slate-300">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Restaurar Backup a partir de JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('Deseja limpar os registos de auditoria técnica?')) {
                    storage.clearTechnicalLogs();
                    setLogs([]);
                  }
                }}
                className="w-full py-2 px-3 text-rose-700 hover:bg-rose-50 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Registos de Auditoria</span>
              </button>
            </div>
          </div>

          {/* Infrastructure Specs */}
          <div className="bg-slate-900 text-slate-200 rounded-3xl border border-slate-800 p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-sans font-bold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                Infraestrutura do Sistema
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">PROD</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Versão:</span>
                <span className="text-white font-bold">AEP-2 v2.4.0 Engine</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Firebase Firestore:</span>
                <span className="text-indigo-300 font-bold">gestaep-1f3ed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Regras de Segurança:</span>
                <span className="text-emerald-400 font-bold">Ativas & Compiladas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hospedagem:</span>
                <span className="text-white">Netlify SPA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Local Cache:</span>
                <span className="text-amber-300">{Math.round(metrics.totalStorageBytes / 1024)} KB</span>
              </div>
            </div>
          </div>

          {/* Real-time Audit Logs */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>Registo de Ações do Sistema</span>
              </h3>
              <span className="text-[10px] text-slate-400">{logs.length} eventos</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-[10px]">
              {logs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-600 truncate">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Password Reset Modal */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    Redefinir Senha
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {selectedUserForReset.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForReset(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePasswordReset} className="p-5 space-y-4 text-xs">
              {resetSuccessMsg ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetSuccessMsg}</span>
                </div>
              ) : (
                <>
                  <p className="text-slate-600">
                    Insira a nova senha para o utilizador <strong>{selectedUserForReset.name}</strong> (Telefone: {selectedUserForReset.phone}):
                  </p>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nova Senha:
                    </label>
                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      required
                      autoFocus
                      placeholder="Ex: 123456 ou nova_senha"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForReset(null)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer shadow-md shadow-purple-600/20"
                    >
                      Confirmar e Atualizar
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Phone Update Modal */}
      {selectedUserForPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    Atualizar Telefone
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {selectedUserForPhone.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPhone(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePhoneUpdate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Novo Número de Telefone:
                </label>
                <input
                  type="tel"
                  value={newPhoneInput}
                  onChange={(e) => setNewPhoneInput(e.target.value)}
                  required
                  autoFocus
                  placeholder="Ex: +244 923 000 000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPhone(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar Telefone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
