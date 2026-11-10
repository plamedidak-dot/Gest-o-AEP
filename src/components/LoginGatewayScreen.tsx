import React, { useState } from 'react';
import { 
  Phone, 
  Lock, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Terminal,
  Cpu,
  KeyRound,
  X
} from 'lucide-react';
import { UserProfile, AssociationSettings } from '../types';
import { storage } from '../services/storage';

interface LoginGatewayScreenProps {
  settings: AssociationSettings;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginGatewayScreen: React.FC<LoginGatewayScreenProps> = ({
  settings,
  onLoginSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Technical Developer Access Modal
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [devError, setDevError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = storage.authenticate(phoneNumber, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message || 'Número de telefone ou senha incorretos. Verifique o seu número de telefone registado.');
      }
    }, 250);
  };

  const handleDevDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setDevError(null);
    const pass = devPassword.trim();
    if (pass === 'adminroot2026' || pass === 'devmaster2026' || pass === 'dev123' || pass === 'admin123') {
      const result = storage.authenticate('+244 900 000 000', pass);
      if (result.success && result.user) {
        setShowDevModal(false);
        onLoginSuccess(result.user);
        return;
      }
    }
    setDevError('Chave mestra do Engenheiro/Desenvolvedor inválida.');
  };

  const handleFillDevCredentials = () => {
    setPhoneNumber('+244 900 000 000');
    setPassword('adminroot2026');
    setShowDevModal(false);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-start items-center py-6 sm:py-10 px-4 sm:px-6 relative overflow-y-auto antialiased">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-rose-600/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Main Column Container */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto flex flex-col items-center">
        
        {/* Top Header with Logos & Institutional Title */}
        <div className="w-full mb-5 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-amber-400/40 shadow-lg p-1.5 flex items-center justify-center ring-2 ring-amber-400/30">
              <img
                src={settings.schoolLogoUrl || '/assets/aistudio/PEQUENO_87357065.png'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/favicon.png';
                }}
                alt="Complexo Escolar Privado Proglory"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-indigo-400/40 shadow-lg p-1.5 flex items-center justify-center ring-2 ring-indigo-400/30">
              <img
                src={settings.logoUrl || '/assets/aistudio/Screenshot_20261107-111452_1a58e2b0.jpg'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/favicon.png';
                }}
                alt="AEP-2"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 mb-1.5">
            <span>{settings.acronym} · {settings.institution}</span>
          </div>

          <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase px-2">
            {settings.name}
          </h1>
          <p className="text-xs text-amber-300/80 font-medium mt-0.5">
            Mandato {settings.academicYear} · Polo II
          </p>
        </div>

        {/* Central Login Card */}
        <div className="w-full bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all">
          
          {/* Card Header */}
          <div className="p-6 bg-slate-50 border-b border-slate-100 text-center space-y-1.5">
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Autenticação de Membro
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Insira o seu <strong>Número de Telefone</strong> e a sua <strong>Senha de Acesso</strong> para entrar no sistema.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-7 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Número de Telefone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  autoFocus
                  placeholder="Ex: 923 000 001 ou 9xx xxx xxx"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono text-xs font-bold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Introduza o número de telefone associado à sua conta.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-700">
                  Senha de Acesso *
                </label>
                <span className="text-[10px] text-slate-400">
                  (Primeiro acesso: 123456)
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
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 transition-colors cursor-pointer"
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
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 mt-1 cursor-pointer"
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
        </div>

        {/* Technical Engineering & Developer Access Button */}
        <div className="mt-5 w-full flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDevError(null);
              setDevPassword('');
              setShowDevModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer backdrop-blur-xs"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Acesso Técnico do Engenheiro do Sistema</span>
          </button>

          <p className="text-[11px] text-slate-500 text-center mt-1">
            © {settings.academicYear} {settings.institution}
          </p>
        </div>

      </div>

      {/* Engineer / Technical Supervisor Access Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-sm w-full border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-xs">
                  <Terminal className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Gabinete Técnico do Desenvolvedor
                  </h3>
                  <p className="text-[10px] text-purple-300/80">
                    Administrador Geral & Supervisão Técnica
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDevDirectLogin} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-xl text-[11px] text-purple-200 space-y-1">
                <p className="font-bold text-purple-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Acesso Restrito ao Engenheiro da Plataforma
                </p>
                <p className="text-[10px] text-slate-400">
                  Responsável pela manutenção da base de dados Firebase (<code>gestaep-1f3ed</code>), segurança e supervisão geral.
                </p>
              </div>

              {devError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{devError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Chave Mestra / Senha do Engenheiro:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    autoFocus
                    placeholder="Introduza a chave de engenheiro"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Entrar na Consola de Engenharia</span>
                </button>

                <button
                  type="button"
                  onClick={handleFillDevCredentials}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium text-[11px] transition-colors cursor-pointer"
                >
                  Preencher dados no formulário principal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
