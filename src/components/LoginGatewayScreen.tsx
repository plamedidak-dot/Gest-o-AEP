import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  School,
  Building2,
  CheckCircle2,
  HelpCircle,
  Users
} from 'lucide-react';
import { UserProfile, AssociationSettings, Member } from '../types';
import { storage, ADMIN_ACCOUNTS } from '../services/storage';

interface LoginGatewayScreenProps {
  settings: AssociationSettings;
  members: Member[];
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginGatewayScreen: React.FC<LoginGatewayScreenProps> = ({
  settings,
  members,
  onLoginSuccess,
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Check if member is in administrative area
  const isAdmMember = (m: Member) => {
    const dept = (m.department || '').toLowerCase();
    const role = (m.departmentRole || '').toLowerCase();
    return dept.includes('administra') || 
           role.includes('presidente') || 
           role.includes('secretár') || 
           role.includes('secretar') || 
           role.includes('tesour') || 
           m.category === 'direcao';
  };

  const registeredAdmins = members.filter(isAdmMember);
  const registeredStudents = members.filter(m => !isAdmMember(m));

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = storage.authenticate(accessCode, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message || 'Código de acesso ou senha incorretos. Verifique e tente novamente.');
      }
    }, 200);
  };

  const handleQuickFill = (code: string, pass: string) => {
    setAccessCode(code);
    setPassword(pass);
    setErrorMsg(null);
  };

  const handleDirectDemoLogin = (code: string, pass: string) => {
    setAccessCode(code);
    setPassword(pass);
    setErrorMsg(null);
    const result = storage.authenticate(code, pass);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden antialiased">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-rose-600/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Top School Header */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <img
            src={settings.logoUrl || '/src/assets/images/association_crest_1793825853762.jpg'}
            alt="Brasão Oficial da Escola"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-indigo-400/30 bg-white/10 shrink-0 shadow-lg"
          />
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
              {settings.name} ({settings.acronym})
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {settings.institution} · Mandato {settings.academicYear}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-[11px] text-indigo-300 font-semibold backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Acesso Restrito & Seguro</span>
          </span>
        </div>
      </div>

      {/* Central Login Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all">
          {/* Card Header */}
          <div className="p-6 sm:p-8 bg-slate-50/70 border-b border-slate-100 text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-indigo-600/30 shadow-lg mb-3">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Autenticação Obrigatória
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Insira o seu <strong>Código de Acesso</strong> e <strong>Senha</strong> para entrar no portal da Associação de Estudantes.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Código de Acesso ou Nº de Associado *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  autoFocus
                  placeholder="Ex: AE-PRESIDENTE ou AE-PROC1042"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono text-xs uppercase font-bold text-slate-900 transition-all placeholder:text-slate-400 placeholder:normal-case"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Atribuído na ficha de credenciais (ou código de administração).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-700">
                  Senha de Acesso *
                </label>
                <span className="text-[10px] text-slate-400">
                  Sensível a maiúsculas
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Introduza a sua senha"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-medium text-slate-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 transition-colors"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Collapsible Quick Demo Credentials Drawer */}
          <div className="border-t border-slate-100 bg-slate-50/80 p-4 sm:p-5 text-xs">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-indigo-700 hover:text-indigo-900 font-bold transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Ver Contas e Códigos de Acesso</span>
              </div>
              <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                {showDemoAccounts ? 'Ocultar ▲' : 'Consultar ▼'}
              </span>
            </button>

            {showDemoAccounts && (
              <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-200/80 animate-in fade-in">
                {/* 1. Administrative Board Accounts */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Direção & Painel Administrativo</span>
                  </h4>
                  <div className="space-y-1.5">
                    {/* If real administrative members are registered */}
                    {registeredAdmins.length > 0 ? (
                      registeredAdmins.map((adm) => (
                        <div
                          key={adm.id}
                          className="p-2.5 bg-white rounded-xl border border-indigo-200 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {adm.fullName} ({adm.departmentRole})
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Cód: <strong className="text-indigo-700">{adm.accessCode}</strong> · Senha: <strong>{adm.password || '123456'}</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDirectDemoLogin(adm.accessCode, adm.password || '123456')}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold shrink-0 border border-indigo-200"
                          >
                            Entrar
                          </button>
                        </div>
                      ))
                    ) : (
                      ADMIN_ACCOUNTS.map((adm) => (
                        <div
                          key={adm.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {adm.name} ({adm.adminRole})
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Cód: <strong className="text-indigo-700">{adm.accessCode}</strong> · Senha: <strong>{adm.password}</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDirectDemoLogin(adm.accessCode!, adm.password!)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold shrink-0 border border-indigo-200"
                          >
                            Entrar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Registered Ordinary Members */}
                {registeredStudents.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Alunos / Sócios Registados ({registeredStudents.length})</span>
                    </h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {registeredStudents.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-[11px]"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 truncate block">{m.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Cód: {m.accessCode} · Senha: {m.password || 'aluno123'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDirectDemoLogin(m.accessCode, m.password || 'aluno123')}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold shrink-0"
                          >
                            Entrar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-5xl w-full mx-auto text-center py-2 text-[11px] text-slate-500">
        <p>
          © {settings.academicYear} {settings.institution} · Sistema Integrado de Gestão da Associação de Estudantes
        </p>
      </div>
    </div>
  );
};
