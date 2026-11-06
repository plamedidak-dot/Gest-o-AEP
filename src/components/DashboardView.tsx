import React from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  MapPin, 
  ShieldCheck,
  Plus,
  Building2,
  KeyRound
} from 'lucide-react';
import { 
  Member, 
  QuotaPayment, 
  AssociationEvent, 
  EventAttendance, 
  AssociationSettings, 
  UserProfile 
} from '../types';
import { formatCurrency, formatDatePt } from '../utils/formatters';

interface DashboardViewProps {
  members: Member[];
  quotas: QuotaPayment[];
  events: AssociationEvent[];
  attendance: EventAttendance[];
  settings: AssociationSettings;
  currentUser: UserProfile;
  onNavigateTab: (tab: string) => void;
  onOpenEventDesk: (event: AssociationEvent) => void;
  onOpenNewEventModal: () => void;
  onOpenNewMemberModal: () => void;
  onOpenNewQuotaModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  quotas,
  events,
  attendance,
  settings,
  currentUser,
  onNavigateTab,
  onOpenEventDesk,
  onOpenNewEventModal,
  onOpenNewMemberModal,
  onOpenNewQuotaModal,
}) => {
  // Calculations
  const activeMembers = members.filter(m => m.status === 'ativo');
  const paidQuotas = quotas.filter(q => q.status === 'pago');
  const totalCollected = paidQuotas.reduce((acc, curr) => acc + curr.amount, 0);
  const overdueQuotas = quotas.filter(q => q.status === 'atrasado');

  const upcomingEvents = [...events]
    .filter(e => e.status === 'agendado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Course distribution
  const courseCounts: Record<string, number> = {};
  members.forEach(m => {
    courseCounts[m.course] = (courseCounts[m.course] || 0) + 1;
  });
  const topCourses = Object.entries(courseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Administrative Board Officers (Presidente, Vice-Presidente, Secretário-Geral, Tesoureiro)
  const isAdmDept = (dept?: string) => (dept || '').toLowerCase().includes('administra');
  const presidente = members.find(m => (isAdmDept(m.department) || m.category === 'direcao') && m.departmentRole?.toLowerCase().includes('presidente') && !m.departmentRole?.toLowerCase().includes('vice'));
  const vicePresidente = members.find(m => (isAdmDept(m.department) || m.category === 'direcao') && m.departmentRole?.toLowerCase().includes('vice-presidente'));
  const secretaria = members.find(m => (isAdmDept(m.department) || m.category === 'direcao') && (m.departmentRole?.toLowerCase().includes('secretár') || m.departmentRole?.toLowerCase().includes('secretar')));
  const tesoureiro = members.find(m => (isAdmDept(m.department) || m.category === 'direcao') && m.departmentRole?.toLowerCase().includes('tesour'));

  const adminOfficersList = [
    {
      roleTitle: 'Presidente da Direção',
      roleKey: 'Presidente',
      member: presidente,
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    {
      roleTitle: 'Vice-Presidente',
      roleKey: 'Vice-Presidente',
      member: vicePresidente,
      badgeColor: 'bg-pink-50 text-pink-800 border-pink-200',
    },
    {
      roleTitle: 'Secretário-Geral',
      roleKey: 'Secretária',
      member: secretaria,
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    {
      roleTitle: 'Tesoureiro da AE',
      roleKey: 'Tesoureiro',
      member: tesoureiro,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white min-h-[180px] sm:min-h-[220px] flex flex-col justify-end p-6 sm:p-8 shadow-sm">
        <img
          src="/src/assets/images/campus_university_hero_1793825854481.jpg"
          alt="Campus Universitário"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-[11px] font-semibold text-indigo-200 border border-white/10 mb-2">
              <span>{settings.institution}</span>
              <span>·</span>
              <span>Mandato {settings.academicYear}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {settings.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Olá, <strong>{currentUser.name}</strong> ({currentUser.role === 'admin' ? 'Direção Executiva' : 'Sócio Efetivo'}). Bem-vindo ao sistema de gestão académica e associativa.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('calendar')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Ver Calendário</span>
            </button>
            <button
              onClick={() => onNavigateTab('profile')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-md"
            >
              O Meu Perfil
            </button>
          </div>
        </div>
      </div>

      {/* KPI Numerical Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Members */}
        <div 
          onClick={() => onNavigateTab('members')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Associados</span>
            <Users className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums font-mono mt-2">
            {members.length}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            {activeMembers.length} inscrições ativas
          </div>
        </div>

        {/* Quotas */}
        <div 
          onClick={() => onNavigateTab('quotas')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Quotas Arrecadadas</span>
            <DollarSign className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums font-mono mt-2">
            {formatCurrency(totalCollected, settings.currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {Math.round((paidQuotas.length / Math.max(1, quotas.length)) * 100)}% de taxa de liquidação
          </div>
        </div>

        {/* Events */}
        <div 
          onClick={() => onNavigateTab('calendar')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Eventos Agendados</span>
            <Calendar className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums font-mono mt-2">
            {upcomingEvents.length}
          </div>
          <div className="text-xs text-purple-700 font-semibold mt-1">
            Próxima AG em 15 de Nov
          </div>
        </div>

        {/* Quorum and Documents */}
        <div 
          onClick={() => onNavigateTab('documents')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Arquivo Documental</span>
            <FileText className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums font-mono mt-2">
            5 Documentos
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Estatutos & Actas oficiais
          </div>
        </div>
      </div>

      {/* PAINEL ADMINISTRATIVO: Órgão de Gestão & Corpo Directivo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Painel Administrativo · Corpo Directivo da AE
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Acesso Total de Gestão
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Os membros da área administrativa são integrados automaticamente com permissões totais de administração e acesso aos relatórios da escola.
            </p>
          </div>

          <button
            onClick={() => onOpenNewMemberModal()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registar Membro Administrativo</span>
          </button>
        </div>

        {/* 4 Administrative Officers Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {adminOfficersList.map(officer => {
            const isFilled = Boolean(officer.member);
            const isCurrent = isFilled && (currentUser.memberId === officer.member?.id || currentUser.accessCode === officer.member?.accessCode);

            return (
              <div
                key={officer.roleKey}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isFilled 
                    ? isCurrent
                      ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${officer.badgeColor}`}>
                      {officer.roleTitle}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                        Sua Sessão
                      </span>
                    )}
                  </div>

                  {isFilled ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {officer.member!.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">
                            {officer.member!.fullName}
                          </h4>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 block">
                            {officer.member!.accessCode}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 text-[11px] text-slate-600 space-y-0.5">
                        <p>Proc: <span className="font-mono font-bold text-slate-800">{officer.member!.studentNumber}</span></p>
                        <p>{officer.member!.classLevel} ({officer.member!.turno})</p>
                        <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ativo no Painel Administrativo</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto text-xs font-bold">
                        ?
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Cargo Vago</p>
                        <p className="text-[10px] text-slate-400">Nenhum {officer.roleTitle.toLowerCase()} registado</p>
                      </div>
                      <button
                        onClick={() => onOpenNewMemberModal()}
                        className="w-full py-1.5 px-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 rounded-lg text-[10px] font-bold shadow-2xs transition-colors"
                      >
                        + Preencher Cargo
                      </button>
                    </div>
                  )}
                </div>

                {isFilled && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px]">Área Administrativa</span>
                    <button
                      onClick={() => onNavigateTab('members')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      Ver Membro →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Upcoming Events & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Events Highlight */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Próximos Eventos Académicos
              </h2>
              <p className="text-xs text-slate-500">
                Atividades programadas e convocatórias com confirmação de presenças
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Abrir Calendário Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map((evt) => {
              const confirmedCount = attendance.filter(
                a => a.eventId === evt.id && a.status === 'presente'
              ).length;

              return (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        {new Date(evt.date).toLocaleDateString('pt-PT', { month: 'short' })}
                      </span>
                      <span className="text-base font-extrabold tabular-nums leading-none">
                        {new Date(evt.date).getDate()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {evt.isGeneralAssembly && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                            Assembleia Geral
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {evt.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {evt.time}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {evt.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-xs font-semibold text-slate-600 tabular-nums">
                      <strong>{confirmedCount}</strong> confirmados
                    </span>
                    <button
                      onClick={() => onNavigateTab('calendar')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Ver no Calendário
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quota Alerts & Course Distribution */}
        <div className="space-y-6">
          {/* Overdue Quotas Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Quotas em Atraso</span>
              </h3>
              <button
                onClick={() => onNavigateTab('quotas')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Gerir
              </button>
            </div>

            <div className="space-y-2">
              {overdueQuotas.slice(0, 3).map((q) => (
                <div
                  key={q.id}
                  className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-rose-950 truncate">{q.memberName}</p>
                    <p className="text-[10px] text-rose-600">{q.period} · Nº {q.studentNumber}</p>
                  </div>
                  <span className="font-mono font-bold text-rose-900 tabular-nums">
                    {formatCurrency(q.amount, q.currency)}
                  </span>
                </div>
              ))}
              {overdueQuotas.length === 0 && (
                <p className="p-3 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg">
                  Todos os associados estão com as quotas em dia!
                </p>
              )}
            </div>
          </div>

          {/* Top Courses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Representatividade por Curso
            </h3>
            <div className="space-y-2.5 text-xs">
              {topCourses.map(([course, count]) => {
                const percent = Math.round((count / members.length) * 100);
                return (
                  <div key={course} className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-medium truncate max-w-[180px]">{course}</span>
                      <span className="font-mono tabular-nums text-slate-500 font-bold">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
