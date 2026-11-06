import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  KeyRound, 
  ShieldCheck, 
  User, 
  School, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { UserProfile, Member, AssociationSettings } from '../types';
import { storage, ADMIN_ACCOUNTS } from '../services/storage';

interface LoginModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  settings: AssociationSettings;
  members: Member[];
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentUser,
  settings,
  members,
  onClose,
  onLoginSuccess,
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'quick'>('login');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = storage.authenticate(accessCode, password);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMsg(result.message || 'Código de acesso ou senha incorretos.');
    }
  };

  const handleQuickLogin = (user: UserProfile) => {
    storage.setCurrentUser(user);
    onLoginSuccess(user);
    onClose();
  };

  const handleMemberQuickLogin = (member: Member) => {
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
    storage.setCurrentUser(memberUser);
    onLoginSuccess(memberUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Acesso ao Portal da Associação
              </h3>
              <p className="text-xs text-slate-500">
                {settings.institution}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/70 p-1 text-xs">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-center rounded-lg font-semibold transition-all ${
              activeTab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Entrar com Credenciais
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 text-center rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'quick' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Contas de Demonstração</span>
          </button>
        </div>

        {/* Tab 1: Direct Form Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Código de Acesso ou Nº de Associado *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  placeholder="Ex: AE-PRESIDENTE, AE-TESOURARIA ou AE-PROC1042"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs uppercase"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Membros da administração usam seus códigos de cargo; alunos usam o código gerado no cadastro.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Senha de Acesso *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Introduza a sua senha..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Senhas de Acesso da Administração:</p>
              <p className="font-mono text-[10px]">
                Presidente: <span className="font-bold">admin123</span> · Vice: <span className="font-bold">vice123</span><br />
                Secretária: <span className="font-bold">sec123</span> · Tesoureiro: <span className="font-bold">tesouro123</span>
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sessão</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Quick Demo Switcher */}
        {activeTab === 'quick' && (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Membros da Direção & Administração
              </h4>
              <div className="space-y-1.5">
                {ADMIN_ACCOUNTS.map(admin => {
                  const isCurrent = currentUser.id === admin.id;
                  return (
                    <button
                      key={admin.id}
                      onClick={() => handleQuickLogin(admin)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isCurrent 
                          ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-950' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>{admin.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {admin.accessCode}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Cargo: {admin.adminRole} · Acesso Completo
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Registered Members Section */}
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Membros & Alunos Registados ({members.length})
              </h4>
              {members.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  Ainda não existem membros registados. Registe um aluno no separador &ldquo;Membros&rdquo; para ver as suas credenciais!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {members.map(member => {
                    const isCurrent = currentUser.memberId === member.id;
                    return (
                      <button
                        key={member.id}
                        onClick={() => handleMemberQuickLogin(member)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isCurrent 
                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold flex items-center gap-2 truncate">
                            <span className="truncate">{member.fullName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                              {member.memberNumber}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Cód: {member.accessCode} · {member.classLevel} ({member.turno})
                          </div>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
