import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Printer, 
  ShieldCheck, 
  ShieldAlert, 
  Download,
  UserCheck
} from 'lucide-react';
import { AssociationEvent, EventAttendance, Member, AssociationSettings } from '../types';
import { storage } from '../services/storage';
import { exportToCsv, formatDatePt, formatDateTimePt } from '../utils/formatters';

interface AttendanceManagerModalProps {
  event: AssociationEvent;
  members: Member[];
  attendance: EventAttendance[];
  settings: AssociationSettings;
  onClose: () => void;
  onOpenPdfReport?: () => void;
}

export const AttendanceManagerModal: React.FC<AttendanceManagerModalProps> = ({
  event,
  members,
  attendance,
  settings,
  onClose,
  onOpenPdfReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quickCheckInInput, setQuickCheckInInput] = useState('');
  const [quickMessage, setQuickMessage] = useState<string | null>(null);

  // Filter members for attendance sheet
  const eventAttendance = useMemo(() => {
    return attendance.filter(a => a.eventId === event.id);
  }, [attendance, event.id]);

  const presentCount = eventAttendance.filter(a => a.status === 'presente').length;
  const justifiedCount = eventAttendance.filter(a => a.status === 'justificado').length;

  // Quorum calculation
  const totalActiveMembers = members.filter(m => m.status === 'ativo').length;
  const quorumRequiredCount = event.isGeneralAssembly
    ? Math.ceil(totalActiveMembers * (event.minQuorumPercent / 100))
    : 0;
  const isQuorumReached = event.isGeneralAssembly
    ? presentCount >= quorumRequiredCount
    : true;

  // Handle single-click check-in/status change
  const handleSetStatus = (member: Member, status: 'presente' | 'ausente' | 'justificado') => {
    storage.recordAttendance({
      eventId: event.id,
      memberId: member.id,
      memberName: member.fullName,
      studentNumber: member.studentNumber,
      course: member.course,
      status,
      checkInTime: status === 'presente' ? new Date().toISOString() : undefined,
    });
  };

  // Quick check-in by student number or name
  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickCheckInInput.trim().toLowerCase();
    if (!query) return;

    const matched = members.find(
      m => m.studentNumber.toLowerCase() === query || m.fullName.toLowerCase().includes(query)
    );

    if (matched) {
      storage.recordAttendance({
        eventId: event.id,
        memberId: matched.id,
        memberName: matched.fullName,
        studentNumber: matched.studentNumber,
        course: matched.course,
        status: 'presente',
        checkInTime: new Date().toISOString(),
      });
      setQuickMessage(`Presença registada: ${matched.fullName} (Nº ${matched.studentNumber})`);
      setQuickCheckInInput('');
      setTimeout(() => setQuickMessage(null), 3000);
    } else {
      setQuickMessage('Membro não encontrado com esse número ou nome.');
      setTimeout(() => setQuickMessage(null), 3000);
    }
  };

  // Export presence sheet
  const handleExportCsv = () => {
    const headers = ['Nº Estudante', 'Nome Completo', 'Curso', 'Estado da Presença', 'Hora de Entrada'];
    const rows = members.map(m => {
      const att = eventAttendance.find(a => a.memberId === m.id);
      return [
        m.studentNumber,
        m.fullName,
        m.course,
        att ? att.status.toUpperCase() : 'AUSENTE',
        att?.checkInTime ? formatDateTimePt(att.checkInTime) : '—',
      ];
    });
    exportToCsv(`presencas_${event.id}_${event.date}`, headers, rows);
  };

  const filteredMembers = members.filter(m =>
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.studentNumber.includes(searchTerm) ||
    m.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                Mesa de Presenças & Quórum
              </span>
              <span className="text-xs text-slate-500">· {formatDatePt(event.date)} às {event.time}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {event.title}
            </h3>
            <p className="text-xs text-slate-500">
              {event.location}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPdfReport ? onOpenPdfReport() : window.print()}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-xs"
              title="Gerar Relatório Oficial de Presenças em PDF"
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Descarregar lista em CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quorum and Metrics Strip */}
        <div className="p-4 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Presentes</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums mt-0.5">
              {presentCount} <span className="text-xs font-normal text-slate-400">/ {members.length}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {justifiedCount} justificações registadas
            </div>
          </div>

          {event.isGeneralAssembly ? (
            <div className={`p-3 rounded-xl border col-span-2 ${
              isQuorumReached 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  {isQuorumReached ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  )}
                  {isQuorumReached ? 'Quórum Estatutário Atingido ✓' : 'Aguardando Quórum para 1ª Convocatória'}
                </span>
                <span className="tabular-nums">
                  {presentCount} de {quorumRequiredCount} necessários ({event.minQuorumPercent}%)
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isQuorumReached ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (presentCount / Math.max(1, quorumRequiredCount)) * 100)}%`,
                  }}
                />
              </div>

              <p className="text-[11px] mt-2 opacity-90">
                {isQuorumReached 
                  ? 'A Mesa da Assembleia Geral declara aberta a sessão com poderes deliberativos.' 
                  : 'Faltam presenças para maioria absoluta. Se necessário, aguardar 30 minutos para 2ª convocatória com qualquer número.'}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase">Tipo de Evento</div>
                <p className="text-xs font-medium text-slate-800 mt-1">
                  Evento aberto com registo contínuo de presenças para certificado ou contagem de participantes.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-indigo-600 tabular-nums">
                  {Math.round((presentCount / Math.max(1, members.length)) * 100)}%
                </span>
                <p className="text-[10px] text-slate-400">taxa de comparência</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Check-in Bar */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleQuickCheckIn} className="flex-1 flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={quickCheckInInput}
                onChange={(e) => setQuickCheckInInput(e.target.value)}
                placeholder="Check-in rápido: digite Nº de Estudante (ex: 20230142) ou Nome..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
            >
              Check-in Imediato
            </button>
          </form>

          {/* Search filter for table */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar tabela..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        {/* Quick Message Feedback */}
        {quickMessage && (
          <div className="px-4 py-2 text-xs font-medium bg-indigo-50 text-indigo-900 border-b border-indigo-100 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{quickMessage}</span>
          </div>
        )}

        {/* Members Attendance List Table */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Estudante</th>
                <th className="py-2.5 px-3">Curso & Matrícula</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Hora Check-in</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const att = eventAttendance.find(a => a.memberId === member.id);
                const status = att?.status || 'ausente';

                return (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{member.fullName}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{member.category}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="text-slate-700">{member.course}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Nº {member.studentNumber}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      {status === 'presente' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Presente
                        </span>
                      )}
                      {status === 'justificado' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Justificado
                        </span>
                      )}
                      {status === 'ausente' && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Ausente
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono tabular-nums">
                      {att?.checkInTime ? formatDateTimePt(att.checkInTime).split(' às ')[1] || att.checkInTime : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSetStatus(member, 'presente')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            status === 'presente'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => handleSetStatus(member, 'justificado')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            status === 'justificado'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          Justificar
                        </button>
                        <button
                          onClick={() => handleSetStatus(member, 'ausente')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            status === 'ausente'
                              ? 'bg-rose-100 text-rose-700'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Ausente
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <span>
            {settings.acronym} · {settings.name}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
