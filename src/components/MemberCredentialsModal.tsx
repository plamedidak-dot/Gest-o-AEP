import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Printer, 
  KeyRound, 
  ShieldCheck, 
  User, 
  CreditCard, 
  Sparkles,
  School,
  Award
} from 'lucide-react';
import { Member, AssociationSettings } from '../types';
import { QRCodeSvg } from './QRCodeSvg';

interface MemberCredentialsModalProps {
  member: Member;
  settings: AssociationSettings;
  isNewRegistration?: boolean;
  onEnterAdminPanel?: (member: Member) => void;
  onClose: () => void;
}

export const MemberCredentialsModal: React.FC<MemberCredentialsModalProps> = ({
  member,
  settings,
  isNewRegistration = false,
  onEnterAdminPanel,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const isAdm = (member.department || '').toLowerCase().includes('administra') || 
                (member.departmentRole || '').toLowerCase().includes('presidente') ||
                (member.departmentRole || '').toLowerCase().includes('secretár') ||
                (member.departmentRole || '').toLowerCase().includes('tesour') ||
                member.category === 'direcao';

  const credentialsText = `----------------------------------------
CREDENCIAS DE ACESSO - ASSOCIAÇÃO DE ESTUDANTES
${settings.name} (${settings.institution})
Mandato: ${settings.academicYear}
----------------------------------------
Nome: ${member.fullName}
Nº de Processo: ${member.studentNumber}
Classe/Turno: ${member.classLevel} (${member.turno})
Departamento & Cargo: ${member.department} (${member.departmentRole})

DADOS PARA INÍCIO DE SESSÃO:
• Telefone de Acesso: ${member.phone}
• Senha de Acesso: ${member.password || '123456'}
• Nº de Associado: ${member.memberNumber} (Código: ${member.accessCode})
----------------------------------------
Acesse o portal da Associação com o seu Telefone e Senha para consultar suas quotas e carteira digital.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(credentialsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        
        {/* Sticky Header with touch-friendly Fechar, Imprimir and Copiar buttons */}
        <div className="no-print p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
              <KeyRound className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                {isNewRegistration ? 'Credenciais Geradas com Sucesso' : 'Ficha de Credenciais de Acesso'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                Formato A4 Oficial (210 × 297 mm)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Copiar dados para partilhar"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copiar Dados</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir A4</span>
              <span className="sm:hidden">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Fechar visualização"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container with standard A4 Sheet styling */}
        <div className="overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-100/70 flex-1">
          <div 
            className="a4-document max-w-[210mm] min-h-[297mm] mx-auto bg-white p-6 sm:p-10 md:p-12 text-slate-900 space-y-5 shadow-md rounded-xl border border-slate-200 relative print:p-0 print:border-none print:shadow-none print:rounded-none" 
            id="printable-credentials"
          >
            {/* Administrative Integration Banner */}
            {isAdm && (
              <div className="no-print p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-950">
                      Colocado no Painel Administrativo!
                    </h4>
                    <p className="text-[11px] text-indigo-700">
                      Este membro tem privilégios totais de Administrador ({member.departmentRole}).
                    </p>
                  </div>
                </div>
                {onEnterAdminPanel && (
                  <button
                    type="button"
                    onClick={() => {
                      onEnterAdminPanel(member);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-xs transition-colors cursor-pointer"
                  >
                    Entrar no Painel →
                  </button>
                )}
              </div>
            )}

            {/* School Badge & Identification */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2 shrink-0">
                  <img
                    src={settings.schoolLogoUrl || '/assets/aistudio/PEQUENO_87357065.png'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/favicon.png';
                    }}
                    alt="Complexo Proglory"
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl object-contain p-0.5 ring-2 ring-amber-400 bg-white shadow-xs"
                  />
                  <img
                    src={settings.logoUrl || '/assets/aistudio/Screenshot_20261107-111452_1a58e2b0.jpg'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/favicon.png';
                    }}
                    alt="AEP-2"
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl object-contain ring-2 ring-slate-900 bg-black shadow-xs"
                  />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wider">
                    {settings.acronym} · {settings.name}
                  </h4>
                  <p className="text-[11px] text-slate-700 font-bold">
                    {settings.institution}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Ficha de Acesso Individual · Mandato {settings.academicYear}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  Ativo
                </span>
              </div>
            </div>

            {/* Member Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nome do Aluno:</span>
                <span className="font-bold text-slate-900">{member.fullName}</span>
              </div>
              {member.biNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nº de B.I. (Identidade):</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{member.biNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nº de Processo Escolar:</span>
                <span className="font-mono font-bold text-slate-800">{member.studentNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Classe / Turno:</span>
                <span className="font-semibold text-slate-800">{member.classLevel} ({member.turno})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Departamento & Cargo:</span>
                <span className="font-bold text-indigo-900">{member.departmentRole} · {member.department}</span>
              </div>
            </div>

            {/* The Big Auto-Generated Access Credentials Box */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    Dados de Início de Sessão
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Portal do Estudante
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 block font-bold">
                    Telefone de Acesso (Login)
                  </span>
                  <span className="text-base font-black font-mono text-white tracking-wider">
                    {member.phone || '9xx xxx xxx'}
                  </span>
                </div>

                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-amber-300 block font-bold">
                    Senha de Acesso
                  </span>
                  <span className="text-base font-black font-mono text-amber-300 tracking-wider">
                    {member.password || '123456'}
                  </span>
                </div>
              </div>

              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span>Nº Sócio: {member.memberNumber}</span>
                <span>Cód: {member.accessCode}</span>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${isAdm ? 'text-amber-400' : 'text-emerald-400'} shrink-0`} />
                  <span>
                    {isAdm ? 'Acesso Total ao Painel Administrativo' : 'Acesso estrito aos dados e quotas pessoais'}
                  </span>
                </div>
                <div className="bg-white p-1 rounded-lg shrink-0">
                  <QRCodeSvg
                    value={`AE_LOGIN:${member.phone}:${member.accessCode}`}
                    size={48}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Entregue esta ficha ao aluno. Com o <strong>Número de Telefone</strong> e <strong>Senha</strong>, o aluno poderá aceder diretamente ao portal da escola para visualizar as quotas pagas (500 Kz/semana) e sua carteira digital.
            </p>
          </div>
        </div>

        {/* Sticky Mobile Bottom Floating Actions bar */}
        <div className="no-print sm:hidden p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0 shadow-lg pb-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Fechar Ficha</span>
          </button>
          
          <button
            onClick={handleCopy}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            title="Copiar dados"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir A4</span>
          </button>
        </div>

      </div>
    </div>
  );
};
