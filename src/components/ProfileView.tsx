import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  HeartHandshake, 
  BookOpen, 
  ShieldCheck, 
  Calendar, 
  CreditCard, 
  Award, 
  CheckCircle2, 
  Save, 
  Printer, 
  FileText,
  Clock,
  Bell
} from 'lucide-react';
import { UserProfile, Member, QuotaPayment, EventAttendance, AssociationEvent, AssociationSettings } from '../types';
import { storage } from '../services/storage';
import { QRCodeSvg } from './QRCodeSvg';
import { formatCurrency, formatDatePt, formatDateTimePt, getMemberQuotaStatus } from '../utils/formatters';

interface ProfileViewProps {
  currentUser: UserProfile;
  members: Member[];
  quotas: QuotaPayment[];
  events: AssociationEvent[];
  attendance: EventAttendance[];
  settings: AssociationSettings;
  onUserUpdated: (user: UserProfile) => void;
  onOpenReceipt: (quota: QuotaPayment) => void;
  onEmitCertificate: (member: Member) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  members,
  quotas,
  events,
  attendance,
  settings,
  onUserUpdated,
  onOpenReceipt,
  onEmitCertificate,
}) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'historico_quotas' | 'historico_eventos' | 'cartao'>('dados');
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [emergencyContact, setEmergencyContact] = useState(currentUser.emergencyContact || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(currentUser.notificationsEnabled ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Linked member record (if any)
  const linkedMember = members.find(m => 
    (currentUser.memberId && m.id === currentUser.memberId) ||
    (currentUser.accessCode && m.accessCode?.toUpperCase() === currentUser.accessCode?.toUpperCase()) ||
    (currentUser.memberNumber && m.memberNumber?.toUpperCase() === currentUser.memberNumber?.toUpperCase()) ||
    (currentUser.email && m.email?.toLowerCase() === currentUser.email?.toLowerCase())
  );
  const quotaStatus = linkedMember ? getMemberQuotaStatus(linkedMember, quotas) : null;

  // Member's quotas
  const memberQuotas = linkedMember 
    ? quotas.filter(q => q.memberId === linkedMember.id)
    : [];

  const totalPaidAmount = memberQuotas
    .filter(q => q.status === 'pago')
    .reduce((sum, q) => sum + q.amount, 0);

  const paidWeeksCount = memberQuotas.filter(q => q.status === 'pago').length;
  const overdueQuotas = memberQuotas.filter(q => q.status === 'atrasado');
  const overdueAmount = overdueQuotas.reduce((sum, q) => sum + q.amount, 0);

  // Member's attendances
  const memberAttendances = linkedMember
    ? attendance.filter(a => a.memberId === linkedMember.id)
    : [];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = storage.updateProfile(currentUser.id, {
      name,
      email,
      phone,
      bio,
      emergencyContact,
      notificationsEnabled,
    });

    if (updated) {
      onUserUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md ${
            currentUser.role === 'admin' ? 'bg-slate-900' : 'bg-emerald-700'
          }`}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                currentUser.role === 'admin' 
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {currentUser.role === 'admin' ? `Direção · ${currentUser.adminRole || 'Admin'}` : 'Membro Estudante'}
              </span>
              {(linkedMember?.memberNumber || currentUser.memberNumber) && (
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {linkedMember?.memberNumber || currentUser.memberNumber}
                </span>
              )}
              {(linkedMember?.accessCode || currentUser.accessCode) && (
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Cód: {linkedMember?.accessCode || currentUser.accessCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.email} {currentUser.phone && `· ${currentUser.phone}`}
            </p>
            {linkedMember && (
              <p className="text-xs text-indigo-700 font-medium mt-1">
                {linkedMember.classLevel} ({linkedMember.turma}) · {linkedMember.department} ({linkedMember.departmentRole})
              </p>
            )}
          </div>
        </div>

        {/* Status badges & actions */}
        {linkedMember && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onEmitCertificate(linkedMember)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Emitir Certidão de Sócio Oficial"
            >
              <FileText className="w-4 h-4" />
              <span>Emitir Declaração</span>
            </button>
          </div>
        )}
      </div>

      {/* Prominent Member Quotas Dashboard (Requested: ver quanto de quota ele pagou) */}
      {linkedMember && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total de Quotas Pagas
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
              {formatCurrency(totalPaidAmount, 'Kz')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Valor total pago à tesouraria
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Semanas Pagas
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {paidWeeksCount} <span className="text-xs font-normal text-slate-500">semanas</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Quotas semanais liquidadas
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Quotas em Débito
            </span>
            <div className={`text-2xl font-black mt-1 font-mono ${
              overdueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {overdueAmount > 0 ? formatCurrency(overdueAmount, 'Kz') : '0 Kz'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {overdueAmount > 0 ? `${overdueQuotas.length} quota(s) pendente(s)` : 'Nenhum débito registado'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Valor por Semana
            </span>
            <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
              500 Kz
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Periodicidade semanal regular
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('dados')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'dados' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Dados Pessoais & Contactos
        </button>
        <button
          onClick={() => setActiveTab('cartao')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'cartao' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Carteira Digital de Sócio
        </button>
        <button
          onClick={() => setActiveTab('historico_quotas')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'historico_quotas' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Histórico de Quotas ({memberQuotas.length})
        </button>
        <button
          onClick={() => setActiveTab('historico_eventos')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'historico_eventos' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Histórico de Presenças ({memberAttendances.length})
        </button>
      </div>

      {/* Tab: Dados Pessoais */}
      {activeTab === 'dados' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Perfil atualizado com sucesso! Os seus dados foram guardados no sistema.</span>
            </div>
          )}

          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Gerir Dados Pessoais & Informações de Contacto
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mantenha o seu registo atualizado para receção de convocatórias e benefícios de sócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Institucional / Pessoal *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefone / Telemóvel</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 9xx xxx xxx"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contacto de Emergência</label>
              <div className="relative">
                <HeartHandshake className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Nome do familiar ou tutor e contacto..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Biografia / Interesses na Associação</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Fale um pouco sobre a sua participação em núcleos, comissões de curso ou atividades académicas..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Academic Info (Read-only verified) */}
          {linkedMember && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Dados Académicos Oficiais (Secretaria da AE)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Nº de Estudante</span>
                  <span className="font-bold text-slate-900 font-mono">{linkedMember.studentNumber}</span>
                </div>
                {linkedMember.biNumber && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Nº de B.I.</span>
                    <span className="font-bold text-indigo-700 font-mono">{linkedMember.biNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-[10px] block">Classe / Turno</span>
                  <span className="font-semibold text-slate-900">{linkedMember.classLevel} ({linkedMember.turno})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Departamento</span>
                  <span className="font-semibold text-slate-900">{linkedMember.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Cargo</span>
                  <span className="font-bold text-indigo-900">{linkedMember.departmentRole}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Notificações e Lembretes de Eventos</p>
                <p className="text-[11px] text-slate-500">Receber avisos sobre Assembleias Gerais, workshops e prazos de quotas.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Alterações</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Carteira Digital de Sócio */}
      {activeTab === 'cartao' && linkedMember && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cartão de Associado Digital
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Válido para entrada em eventos, descontos em livrarias e voto nas Assembleias Gerais.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Cartão</span>
            </button>
          </div>

          {/* Visual Digital Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-indigo-500/30">
            {/* Background watermark */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <img
                src={settings.logoUrl || '/src/assets/images/association_crest_1793825853762.jpg'}
                alt=""
                className="w-48 h-48 rounded-full"
              />
            </div>

            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <img
                  src={settings.logoUrl || '/src/assets/images/association_crest_1793825853762.jpg'}
                  alt="Brasão"
                  className="w-9 h-9 rounded-full object-cover bg-white ring-1 ring-white/20"
                />
                <div>
                  <h4 className="text-xs font-black tracking-wider text-white uppercase">
                    {settings.acronym}
                  </h4>
                  <p className="text-[9px] text-indigo-200">
                    Cartão Oficial de Associado
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {settings.academicYear}
              </span>
            </div>

            {/* Card Body */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Nome do Sócio</span>
                  <div className="text-sm font-bold text-white truncate">{linkedMember.fullName}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">Nº Estudante</span>
                    <span className="font-mono font-bold text-indigo-300">{linkedMember.studentNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">Categoria</span>
                    <span className="capitalize font-semibold text-slate-200">{linkedMember.category}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Curso</span>
                  <span className="text-xs text-slate-200 truncate block">{linkedMember.course}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                <QRCodeSvg
                  value={`AEISU:MEMBER:${linkedMember.id}:${linkedMember.studentNumber}`}
                  size={84}
                />
                <div className="text-[8px] text-slate-500 text-center font-mono mt-1 font-bold">
                  VERIFICADO
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span>{settings.institution}</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Válido 2026/2027
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Histórico de Quotas */}
      {activeTab === 'historico_quotas' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                O Teu Histórico de Quotas & Pagamentos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulte as mensalidades pagas e descarregue os recibos oficiais emitidos pela tesouraria.
              </p>
            </div>
            {quotaStatus && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                quotaStatus.isUpToDate ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {quotaStatus.isUpToDate ? 'Quotas Regularizadas ✓' : `${quotaStatus.overdueCount} Quota(s) em Débito`}
              </span>
            )}
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {memberQuotas.map((q) => (
              <div key={q.id} className="py-3 flex items-center justify-between text-xs gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{q.period}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {formatCurrency(q.amount, q.currency)} · {q.paymentDate ? formatDatePt(q.paymentDate) : 'Pendente'}
                  </div>
                </div>
                <div className="shrink-0">
                  {q.status === 'pago' ? (
                    <button
                      onClick={() => onOpenReceipt(q)}
                      className="px-2.5 py-1 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg border border-indigo-200 inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Recibo</span>
                    </button>
                  ) : (
                    <span className="text-amber-700 text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pendente
                    </span>
                  )}
                </div>
              </div>
            ))}
            {memberQuotas.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Não existem registos de quotas para o seu utilizador.
              </div>
            )}
          </div>

          {/* Desktop View: Full Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Período</th>
                  <th className="py-2.5 px-3">Valor</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Data de Pagamento</th>
                  <th className="py-2.5 px-3">Método</th>
                  <th className="py-2.5 px-3 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberQuotas.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{q.period}</td>
                    <td className="py-3 px-3 font-mono tabular-nums font-bold text-slate-800">
                      {formatCurrency(q.amount, q.currency)}
                    </td>
                    <td className="py-3 px-3">
                      {q.status === 'pago' ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          Pago
                        </span>
                      ) : q.status === 'atrasado' ? (
                        <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                          Em Atraso
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {q.paymentDate ? formatDatePt(q.paymentDate) : '—'}
                    </td>
                    <td className="py-3 px-3 uppercase text-[10px] font-semibold text-slate-500">
                      {q.paymentMethod || '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {q.status === 'pago' ? (
                        <button
                          onClick={() => onOpenReceipt(q)}
                          className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:bg-indigo-50 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Recibo</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {memberQuotas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Não existem registos de quotas para o seu utilizador.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Histórico de Presenças */}
      {activeTab === 'historico_eventos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              O Teu Histórico de Participação em Eventos & Reuniões
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Presenças confirmadas em Assembleias Gerais, workshops e eventos organizados pela Associação.
            </p>
          </div>

          <div className="space-y-3">
            {memberAttendances.map(att => {
              const evt = events.find(e => e.id === att.eventId);
              if (!evt) return null;

              return (
                <div
                  key={att.id}
                  className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDatePt(evt.date)} às {evt.time} · {evt.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {att.status === 'presente' && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                      </span>
                    )}
                    {att.status === 'justificado' && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                        Ausência Justificada
                      </span>
                    )}
                    {att.status === 'ausente' && (
                      <span className="text-xs text-slate-400">Ausente</span>
                    )}
                    {att.checkInTime && (
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                        {formatDateTimePt(att.checkInTime).split(' às ')[1]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {memberAttendances.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Ainda não participaste em eventos registados. Acede ao Calendário para confirmar a tua presença no próximo evento!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
