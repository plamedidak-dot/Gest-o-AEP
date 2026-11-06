import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  School,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';
import { 
  Member, 
  QuotaPayment, 
  AssociationEvent, 
  EventAttendance, 
  AssociationSettings 
} from '../types';
import { formatCurrency, formatDatePt, formatDateTimePt } from '../utils/formatters';
import { QRCodeSvg } from './QRCodeSvg';

export type ReportType = 'members' | 'quotas' | 'attendance';

interface PdfReportModalProps {
  type: ReportType;
  settings: AssociationSettings;
  members: Member[];
  quotas?: QuotaPayment[];
  event?: AssociationEvent | null;
  attendance?: EventAttendance[];
  onClose: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  type,
  settings,
  members,
  quotas = [],
  event,
  attendance = [],
  onClose,
}) => {
  const currentDateFormatted = formatDatePt(new Date().toISOString());

  const handlePrint = () => {
    window.print();
  };

  // Quotas metrics
  const totalPaid = quotas.filter(q => q.status === 'pago').reduce((acc, q) => acc + q.amount, 0);
  const totalOverdue = quotas.filter(q => q.status !== 'pago').reduce((acc, q) => acc + q.amount, 0);

  // Attendance metrics
  const presentCount = attendance.filter(a => a.status === 'presente').length;
  const attendanceRate = members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Controls Bar (Not Printed) */}
        <div className="no-print p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Visualização do Relatório Estruturado para Exportação (PDF)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pronto para impressão direta ou "Guardar como PDF" com cabeçalho oficial e carimbos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar como PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div 
          className="p-8 sm:p-12 overflow-y-auto bg-white text-slate-900 space-y-6 print:p-0 print:m-0"
          id="structured-pdf-document"
        >
          {/* Official School & Association Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={settings.logoUrl || '/src/assets/images/association_crest_1793825853762.jpg'}
                  alt="Brasão"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200"
                />
                <div>
                  <h1 className="text-base font-black uppercase tracking-wider text-slate-900 leading-tight">
                    {settings.institution}
                  </h1>
                  <h2 className="text-sm font-bold text-indigo-950 mt-0.5">
                    {settings.name} ({settings.acronym})
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {settings.address} · {settings.contactEmail} · {settings.contactPhone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                  ANO LECTIVO: {settings.academicYear}
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Data de Emissão: {currentDateFormatted}
                </p>
              </div>
            </div>
          </div>

          {/* REPORT 1: MEMBERS REPORT */}
          {type === 'members' && (
            <div className="space-y-5">
              <div className="text-center py-2 border-b border-slate-100">
                <h2 className="text-base font-extrabold uppercase tracking-widest text-slate-900">
                  Relatório Oficial do Quadro de Membros & Departamentos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registo dos órgãos executivos, coordenação de departamentos e delegados escolares
                </p>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Associados</span>
                  <span className="text-lg font-black font-mono text-slate-900">{members.length}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Membros Ativos</span>
                  <span className="text-lg font-black font-mono text-emerald-700">
                    {members.filter(m => m.status === 'ativo').length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Departamentos Ativos</span>
                  <span className="text-lg font-black font-mono text-indigo-700">6 Departamentos</span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-300">
                      <th className="py-2.5 px-3">Nº Proc.</th>
                      <th className="py-2.5 px-3">Nome do Estudante</th>
                      <th className="py-2.5 px-3">Classe & Turma</th>
                      <th className="py-2.5 px-3">Turno</th>
                      <th className="py-2.5 px-3">Departamento</th>
                      <th className="py-2.5 px-3">Cargo Escolar</th>
                      <th className="py-2.5 px-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.studentNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{m.fullName}</td>
                        <td className="py-2 px-3">{m.classLevel || '—'} {m.turma ? `(${m.turma})` : ''}</td>
                        <td className="py-2 px-3">{m.turno || '—'}</td>
                        <td className="py-2 px-3 font-medium text-slate-700">{m.department || 'Geral'}</td>
                        <td className="py-2 px-3 font-bold text-indigo-900">{m.departmentRole || m.category}</td>
                        <td className="py-2 px-3 text-right capitalize">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Nenhum membro registado no sistema da associação escolar até ao momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 2: QUOTAS REPORT */}
          {type === 'quotas' && (
            <div className="space-y-5">
              <div className="text-center py-2 border-b border-slate-100">
                <h2 className="text-base font-extrabold uppercase tracking-widest text-slate-900">
                  Relatório Financeiro de Quotas Semanais (500 Kz)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Balanço semanal de receitas da Associação de Estudantes
                </p>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Arrecadado</span>
                  <span className="text-lg font-black font-mono text-emerald-700">
                    {formatCurrency(totalPaid, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Quotas Pendentes</span>
                  <span className="text-lg font-black font-mono text-rose-600">
                    {formatCurrency(totalOverdue, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Quota Fixa</span>
                  <span className="text-lg font-black font-mono text-indigo-700">
                    500 Kz / Semana
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-300">
                      <th className="py-2.5 px-3">Nº Recibo</th>
                      <th className="py-2.5 px-3">Estudante</th>
                      <th className="py-2.5 px-3">Departamento</th>
                      <th className="py-2.5 px-3">Semana / Período</th>
                      <th className="py-2.5 px-3">Valor</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quotas.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{q.receiptNumber || '—'}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{q.memberName}</td>
                        <td className="py-2 px-3 text-slate-600">{q.department || '—'}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{q.period}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          {formatCurrency(q.amount, q.currency)}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {q.paymentDate ? formatDatePt(q.paymentDate) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {q.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {quotas.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Nenhum registo de quota semanal emitido até ao momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 3: ATTENDANCE REPORT */}
          {type === 'attendance' && (
            <div className="space-y-5">
              <div className="text-center py-2 border-b border-slate-100">
                <h2 className="text-base font-extrabold uppercase tracking-widest text-slate-900">
                  Folha Oficial de Presenças & Controlo de Quórum
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registo presencial de reuniões, assembleias e sessões de coordenação departamental
                </p>
              </div>

              {event && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p><strong>Evento / Reunião:</strong> {event.title}</p>
                  <p><strong>Data & Hora:</strong> {formatDatePt(event.date)} às {event.time} · <strong>Local:</strong> {event.location}</p>
                  <p><strong>Total de Presentes:</strong> {presentCount} de {members.length} membros ({attendanceRate}%)</p>
                  {event.isGeneralAssembly && (
                    <p className="text-indigo-900 font-bold">
                      Exigência Estatutária: Quórum de {event.minQuorumPercent}% ({Math.ceil(members.length * (event.minQuorumPercent / 100))} presentes necessários).
                    </p>
                  )}
                </div>
              )}

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-300">
                      <th className="py-2.5 px-3">Nº Proc.</th>
                      <th className="py-2.5 px-3">Nome do Estudante</th>
                      <th className="py-2.5 px-3">Departamento / Turma</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Hora Check-in</th>
                      <th className="py-2.5 px-3 text-right">Rubrica / Assinatura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {members.map((m) => {
                      const att = attendance.find(a => a.memberId === m.id);
                      const status = att?.status || 'ausente';

                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.studentNumber}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{m.fullName}</td>
                          <td className="py-2 px-3 text-slate-600">{m.department || m.classLevel}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              status === 'presente' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : status === 'justificado' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                            {att?.checkInTime ? formatDateTimePt(att.checkInTime).split(' às ')[1] : '—'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="border-b border-slate-300 w-28 ml-auto h-4"></div>
                          </td>
                        </tr>
                      );
                    })}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Nenhum membro registado para a lista de chamada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Official Signatures and Stamp */}
          <div className="pt-8 grid grid-cols-3 gap-6 items-end border-t border-slate-200">
            <div className="flex items-center gap-2.5">
              <QRCodeSvg
                value={`AE_ESCOLA:RELATORIO:${type}:${currentDateFormatted}`}
                size={70}
              />
              <div className="text-[9px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-900">Selo Digital</p>
                <p>Documento Oficial</p>
                <p className="font-mono mt-0.5">{settings.acronym} - {settings.academicYear}</p>
              </div>
            </div>

            <div className="text-center border-t border-slate-400 pt-2">
              <p className="font-serif italic text-xs text-slate-800">
                {type === 'quotas' ? settings.treasurerName : settings.vicePresidentName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                {type === 'quotas' ? 'Tesouraria da AE' : 'Vice-Presidente'}
              </p>
            </div>

            <div className="text-center border-t border-slate-400 pt-2">
              <p className="font-serif italic text-xs text-slate-800">
                {settings.presidentName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Presidente da Direção
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
