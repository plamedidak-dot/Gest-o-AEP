import React, { useState } from 'react';
import { 
  Phone, 
  Lock, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  HelpCircle,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  Sparkles,
  School,
  KeyRound
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

  // First Access / Credential Lookup Modal State
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<ReturnType<typeof storage.lookupStudentCredentials> | null>(null);
  const [showGuide, setShowGuide] = useState(false);

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

  const handlePerformLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const res = storage.lookupStudentCredentials(lookupQuery);
    setLookupResult(res);
  };

  const handleUseCredentials = (phone: string, pass: string) => {
    setPhoneNumber(phone);
    setPassword(pass);
    setShowLookupModal(false);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden antialiased">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-rose-600/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Top School Header */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-2 shrink-0">
            <img
              src={settings.schoolLogoUrl || '/assets/aistudio/PEQUENO_87357065.png'}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/favicon.png';
              }}
              alt="Logótipo do Complexo Escolar Privado Proglory"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain p-1 ring-2 ring-amber-400/50 bg-white shrink-0 shadow-lg"
            />
            <img
              src={settings.logoUrl || '/assets/aistudio/Screenshot_20261107-111452_1a58e2b0.jpg'}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/favicon.png';
              }}
              alt="Emblema AEP-2"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain p-0.5 ring-2 ring-indigo-400/50 bg-black shrink-0 shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
              {settings.name} ({settings.acronym})
            </h1>
            <p className="text-[11px] text-amber-300/90 font-medium">
              {settings.institution} · Mandato {settings.academicYear}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-[11px] text-indigo-300 font-semibold backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Portal Oficial Seguro</span>
          </span>
        </div>
      </div>

      {/* Central Login Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all">
          {/* Card Header */}
          <div className="p-6 sm:p-7 bg-slate-50/70 border-b border-slate-100 text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm p-1.5 flex items-center justify-center">
                <img
                  src={settings.schoolLogoUrl || '/assets/aistudio/PEQUENO_87357065.png'}
                  alt="Complexo Escolar Privado Proglory"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-black border border-slate-800 shadow-sm p-1 flex items-center justify-center">
                <img
                  src={settings.logoUrl || '/assets/aistudio/Screenshot_20261107-111452_1a58e2b0.jpg'}
                  alt="AEP-2"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-900 border border-orange-200">
              AEP-2 · Proglory da Graça 2
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Autenticação de Membro
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Insira o seu <strong>Número de Telefone</strong> e a sua <strong>Senha de Acesso</strong> para entrar no sistema da Associação.
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
                Introduza o número de telefone com o qual foi registado na Associação.
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
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar com o Telefone</span>
                </>
              )}
            </button>

            {/* First Access / Consult Credentials Action */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowLookupModal(true);
                  setLookupQuery(phoneNumber || '');
                  setLookupResult(null);
                }}
                className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>Consultar Senha pelo Telefone</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 pt-1 font-medium transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'Ocultar telefones de acesso' : 'Ver telefones oficiais de acesso'}</span>
              </button>

              {/* Informative credentials guidance */}
              {showGuide && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-2 animate-in fade-in">
                  <p className="font-bold text-slate-800">Telefones e Senhas Oficiais:</p>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li><strong>Membros & Alunos Registados:</strong> Devem usar o seu <strong>número de telefone</strong> e a senha padrão <code>123456</code> (ou a senha atribuída na secretaria).</li>
                    <li><strong>Direção Administrativa:</strong>
                      <div className="mt-1 pl-2 font-mono text-[10px] space-y-0.5 text-indigo-950">
                        <div>Presidente: <code>923 000 001</code> (senha: <code>admin123</code>)</div>
                        <div>Vice-Presidente: <code>923 000 002</code> (senha: <code>vice123</code>)</div>
                        <div>Secretária: <code>923 000 003</code> (senha: <code>sec123</code>)</div>
                        <div>Tesoureiro: <code>923 000 004</code> (senha: <code>tesouro123</code>)</div>
                      </div>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Lookup Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Consultar Credenciais por Telefone
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verifique os dados da sua conta através do seu número de telemóvel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLookupModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <form onSubmit={handlePerformLookup} className="space-y-3">
                <label className="block font-bold text-slate-800">
                  Introduza o seu Número de Telefone:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    required
                    placeholder="Ex: 923 000 001 ou 9xx xxx xxx"
                    className="flex-1 font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    <span>Verificar</span>
                  </button>
                </div>
              </form>

              {lookupResult && (
                <div className="pt-2 animate-in fade-in">
                  {lookupResult.found ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 text-emerald-950">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs text-emerald-900">
                            Registo Encontrado!
                          </p>
                          <p className="text-[11px] text-emerald-800 font-medium">
                            {lookupResult.name} ({lookupResult.role} · {lookupResult.department})
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60 space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Telefone Registado:</span>
                          <span className="font-bold text-indigo-700">{lookupResult.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Senha para Acesso:</span>
                          <span className="font-bold text-emerald-700">{lookupResult.suggestedPassword}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUseCredentials(lookupResult.phone || lookupQuery, lookupResult.suggestedPassword || '123456')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Preencher e Entrar no Sistema</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-semibold">{lookupResult.message}</p>
                      </div>
                      <p className="text-[10px] text-rose-700">
                        Verifique se introduziu o número de telefone com o qual foi cadastrado. Se ainda não possui cadastro, a Direção da Associação pode adicionar o seu número.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 max-w-5xl w-full mx-auto text-center py-2 text-[11px] text-slate-500">
        <p>
          © {settings.academicYear} {settings.institution} · Sistema Integrado de Gestão da Associação de Estudantes
        </p>
      </div>
    </div>
  );
};

