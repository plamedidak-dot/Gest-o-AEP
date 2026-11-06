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
  QrCode,
  Sparkles,
  School
} from 'lucide-react';
import { Member, AssociationSettings } from '../types';
import { QRCodeSvg } from './QRCodeSvg';

interface MemberCredentialsModalProps {
  member: Member;
  settings: AssociationSettings;
  isNewRegistration?: boolean;
  onClose: () => void;
}

export const MemberCredentialsModal: React.FC<MemberCredentialsModalProps> = ({
  member,
  settings,
  isNewRegistration = false,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const credentialsText = `----------------------------------------
CREDENCIAS DE ACESSO - ASSOCIAÇÃO DE ESTUDANTES
${settings.name} (${settings.institution})
Mandato: ${settings.academicYear}
----------------------------------------
Nome: ${member.fullName}
Nº de Processo: ${member.studentNumber}
Classe/Turno: ${member.classLevel} (${member.turno})
Departamento: ${member.department} (${member.departmentRole})

DADOS PARA INÍCIO DE SESSÃO:
• Nº de Associado: ${member.memberNumber}
• Código de Acesso: ${member.accessCode}
• Senha de Acesso: ${member.password || 'Definida na secretaria'}
----------------------------------------
Acesse o portal da AE para consultar suas quotas e carteira digital.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(credentialsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header (Hidden when printing) */}
        <div className="no-print p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isNewRegistration ? 'Credenciais Geradas com Sucesso!' : 'Credenciais de Acesso do Sócio'}
              </h3>
              <p className="text-xs text-slate-500">
                {isNewRegistration ? 'O sistema gerou automaticamente os códigos de acesso.' : 'Dados de autenticação do estudante associado.'}
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

        {/* Printable Credentials Slip */}
        <div className="p-6 space-y-5" id="printable-credentials">
          {/* School Badge & Identification */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src={settings.logoUrl || '/src/assets/images/association_crest_1793825853762.jpg'}
                alt="Brasão"
                className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200 bg-white"
              />
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  {settings.acronym} · {settings.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {settings.institution}
                </p>
                <p className="text-[10px] text-slate-400">
                  Ficha de Acesso Individual · Ano Lectivo {settings.academicYear}
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
                <span className="text-[10px] uppercase tracking-wider text-indigo-300 block">
                  Número de Associado
                </span>
                <span className="text-base font-black font-mono text-white tracking-wider">
                  {member.memberNumber}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-indigo-300 block">
                  Código de Acesso
                </span>
                <span className="text-base font-black font-mono text-amber-300 tracking-wider">
                  {member.accessCode}
                </span>
              </div>
            </div>

            <div className="bg-white/15 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-indigo-300 block">
                  Senha Provisória
                </span>
                <span className="text-sm font-black font-mono text-emerald-300 tracking-wider">
                  {member.password || 'Consulte a Direção'}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 text-right">
                Pode alterar a senha no perfil
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Acesso estrito aos dados e quotas pessoais</span>
              </div>
              <div className="bg-white p-1 rounded-lg shrink-0">
                <QRCodeSvg
                  value={`AE_LOGIN:${member.accessCode}:${member.memberNumber}`}
                  size={48}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Entregue esta ficha ao aluno. Com o <strong>Código de Acesso</strong> e <strong>Senha</strong>, o aluno poderá aceder ao portal da escola para visualizar as quotas pagas (500 Kz/semana) e sua carteira digital.
          </p>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="no-print p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copiar Dados</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
