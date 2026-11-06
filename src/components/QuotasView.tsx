import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  Plus, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  X, 
  Receipt,
  FileDown,
  Trash2
} from 'lucide-react';
import { QuotaPayment, Member, UserProfile, AssociationSettings, PaymentMethod } from '../types';
import { storage } from '../services/storage';
import { exportToCsv, formatCurrency, formatDatePt } from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';

interface QuotasViewProps {
  quotas: QuotaPayment[];
  members: Member[];
  currentUser: UserProfile;
  settings: AssociationSettings;
  preselectedMember?: Member | null;
  onClearPreselectedMember?: () => void;
  onViewReceipt: (quota: QuotaPayment) => void;
  onOpenPdfReport: () => void;
}

export const QuotasView: React.FC<QuotasViewProps> = ({
  quotas,
  members,
  currentUser,
  settings,
  preselectedMember,
  onClearPreselectedMember,
  onViewReceipt,
  onOpenPdfReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente' | 'atrasado'>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMember?.id || '');
  const [quotaToDelete, setQuotaToDelete] = useState<QuotaPayment | null>(null);

  React.useEffect(() => {
    if (preselectedMember) {
      setSelectedMemberId(preselectedMember.id);
      setShowAddPaymentModal(true);
      if (onClearPreselectedMember) onClearPreselectedMember();
    }
  }, [preselectedMember]);

  // Aggregate Metrics
  const totalCollected = useMemo(() => {
    return quotas
      .filter(q => q.status === 'pago')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [quotas]);

  const totalPendingAmount = useMemo(() => {
    return quotas
      .filter(q => q.status !== 'pago')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [quotas]);

  const paidCount = quotas.filter(q => q.status === 'pago').length;
  const complianceRate = quotas.length > 0 ? Math.round((paidCount / quotas.length) * 100) : 100;

  // Filtered payments
  const filteredQuotas = useMemo(() => {
    return quotas.filter(q => {
      const matchSearch =
        q.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.receiptNumber && q.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (periodFilter !== 'all' && q.period !== periodFilter) return false;

      return true;
    });
  }, [quotas, searchTerm, statusFilter, periodFilter]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Nº Recibo', 'Nº Processo', 'Nome do Aluno', 'Departamento', 'Semana', 'Valor', 'Estado', 'Data Pagamento', 'Método'];
    const rows = filteredQuotas.map(q => [
      q.receiptNumber || '—',
      q.studentNumber,
      q.memberName,
      q.department || '—',
      q.period,
      formatCurrency(q.amount, q.currency),
      q.status.toUpperCase(),
      q.paymentDate ? formatDatePt(q.paymentDate) : '—',
      q.paymentMethod || '—',
    ]);
    exportToCsv(`quotas_semanais_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Register payment submit
  const handleRegisterPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const memberId = fd.get('memberId') as string;
    const period = fd.get('period') as string;
    const amount = Number(fd.get('amount') || 500);
    const paymentMethod = fd.get('paymentMethod') as PaymentMethod;
    const notes = fd.get('notes') as string;

    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const receiptSeq = Math.floor(100 + Math.random() * 900);
    const receiptNumber = `REC-${new Date().getFullYear()}-${receiptSeq}`;

    storage.addQuotaPayment({
      memberId: member.id,
      memberName: member.fullName,
      studentNumber: member.studentNumber,
      department: member.department,
      period,
      amount,
      currency: 'Kz',
      status: 'pago',
      dueDate: new Date().toISOString().slice(0, 10),
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod,
      receiptNumber,
      registeredBy: currentUser.name,
      notes,
    });

    setShowAddPaymentModal(false);
  };

  const handleQuickPay = (quota: QuotaPayment) => {
    const receiptSeq = Math.floor(100 + Math.random() * 900);
    storage.updateQuotaPayment(quota.id, {
      status: 'pago',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'numerario',
      receiptNumber: `REC-${new Date().getFullYear()}-${receiptSeq}`,
      registeredBy: currentUser.name,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>Quotas Semanais (500 Kz) & Tesouraria Escolar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cobrança semanal de quotas a todos os membros e departamentos com emissão de recibos e relatórios
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenPdfReport}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            title="Exportar Relatório Financeiro em PDF"
          >
            <FileDown className="w-4 h-4 text-rose-400" />
            <span>Exportar Relatório PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>CSV (Excel)</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                if (members.length > 0) {
                  setSelectedMemberId(members[0].id);
                }
                setShowAddPaymentModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cobrar Quota Semanal (500 Kz)</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Arrecadado
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums mt-1 font-mono">
            {formatCurrency(totalCollected, 'Kz')}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{paidCount} quotas liquidadas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Quotas em Débito
          </div>
          <div className="text-2xl font-black text-rose-600 tabular-nums mt-1 font-mono">
            {formatCurrency(totalPendingAmount, 'Kz')}
          </div>
          <div className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{quotas.filter(q => q.status !== 'pago').length} pagamentos pendentes</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Taxa de Cumprimento
          </div>
          <div className="text-2xl font-black text-indigo-600 tabular-nums mt-1 font-mono">
            {complianceRate}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${complianceRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Quota Semanal Fixa
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums mt-1 font-mono">
            500 Kz
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Pago todas as semanas por membro
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por aluno, nº de processo ou recibo..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Estados</option>
            <option value="pago">Pagas ✓</option>
            <option value="atrasado">Em Atraso ⚠️</option>
            <option value="pendente">Pendentes</option>
          </select>
        </div>
      </div>

      {/* Quotas Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredQuotas.map((quota) => (
            <div key={quota.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{quota.memberName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Proc: {quota.studentNumber} · {quota.department || 'Geral'}
                  </div>
                </div>
                <div>
                  {quota.status === 'pago' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Pago
                    </span>
                  ) : quota.status === 'atrasado' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <AlertCircle className="w-3 h-3" /> Em Atraso
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Clock className="w-3 h-3" /> Pendente
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Semana Ref.</div>
                  <div className="font-semibold text-slate-800">{quota.period}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Valor</div>
                  <div className="font-mono font-bold text-emerald-700">
                    {formatCurrency(quota.amount, quota.currency)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="text-[11px] text-slate-500">
                  {quota.paymentDate ? `Pago em: ${formatDatePt(quota.paymentDate)}` : 'Ainda não liquidado'}
                </div>
                <div>
                  {quota.status === 'pago' ? (
                    <button
                      onClick={() => onViewReceipt(quota)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-indigo-200"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{quota.receiptNumber || 'Ver Recibo'}</span>
                    </button>
                  ) : (
                    currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleQuickPay(quota)}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        Liquidar (500 Kz)
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredQuotas.length === 0 && (
            <div className="py-10 text-center text-slate-400 p-4">
              <DollarSign className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum registo de quota semanal</p>
              <p className="text-xs text-slate-400 mt-1">
                {members.length === 0 
                  ? 'Registe primeiro os membros da escola para cobrar quotas semanais.'
                  : 'Clique em "Cobrar Quota Semanal (500 Kz)" para registar um pagamento.'}
              </p>
            </div>
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 bg-slate-50/70">
                <th className="py-3 px-4">Estudante</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Semana de Referência</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Data Pagamento</th>
                <th className="py-3 px-4 text-right">Recibo & Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotas.map((quota) => (
                <tr key={quota.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{quota.memberName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Proc: {quota.studentNumber}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {quota.department || 'Geral'}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {quota.period}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(quota.amount, quota.currency)}
                  </td>

                  <td className="py-3 px-4">
                    {quota.status === 'pago' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Pago
                      </span>
                    ) : quota.status === 'atrasado' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <AlertCircle className="w-3 h-3" /> Em Atraso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {quota.paymentDate ? formatDatePt(quota.paymentDate) : '—'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {quota.status === 'pago' ? (
                        <button
                          onClick={() => onViewReceipt(quota)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{quota.receiptNumber || 'Recibo'}</span>
                        </button>
                      ) : (
                        currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleQuickPay(quota)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                          >
                            Liquidar
                          </button>
                        )
                      )}

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => setQuotaToDelete(quota)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar registo de quota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredQuotas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Nenhum registo de quota semanal registado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {members.length === 0 
                        ? 'Registe primeiro os membros da escola para poder cobrar as quotas semanais de 500 Kz.'
                        : 'Clique em "+ Cobrar Quota Semanal (500 Kz)" para registar o primeiro pagamento.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Payment */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-slate-900">
                Cobrar Quota Semanal (500 Kz)
              </h3>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {members.length === 0 ? (
              <div className="p-6 text-center space-y-3 text-xs">
                <p className="text-slate-600">Não existem membros registados na associação escolar.</p>
                <p className="text-slate-400">Adicione primeiro membros na secção "Membros & Departamentos".</p>
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterPayment} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Selecionar Membro / Aluno *
                  </label>
                  <select
                    name="memberId"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} — Proc: {m.studentNumber} ({m.department} · {m.departmentRole})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Semana de Referência *
                    </label>
                    <input
                      name="period"
                      defaultValue={`Semana ${Math.ceil(new Date().getDate() / 7)} (${new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })})`}
                      required
                      placeholder="Ex: Semana 1 (Novembro 2026)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Valor da Quota Semanal (Kz) *
                    </label>
                    <input
                      name="amount"
                      type="number"
                      defaultValue={500}
                      required
                      readOnly
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-bold font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Forma de Pagamento *
                  </label>
                  <select
                    name="paymentMethod"
                    defaultValue="numerario"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium"
                  >
                    <option value="numerario">Numerário / Caixa da AE (500 Kz em mão)</option>
                    <option value="multicaixa">Multicaixa / TPA</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="unitel_money">Unitel Money / M-Pesa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Observações / Notas
                  </label>
                  <input
                    name="notes"
                    placeholder="Ex: Pago na sala da Associação de Estudantes..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Ao confirmar, o sistema gera o <strong>Recibo Oficial em Kwanzas (500 Kz)</strong> com número de série e carimbo.
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    Confirmar Pagamento (500 Kz)
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Quota Deletion */}
      <ConfirmDialog
        isOpen={Boolean(quotaToDelete)}
        title="Eliminar Registo de Quota"
        message={`Deseja eliminar o registo de quota de ${quotaToDelete?.memberName}?`}
        detail={quotaToDelete ? `Referência: ${quotaToDelete.period} · Valor: ${formatCurrency(quotaToDelete.amount, quotaToDelete.currency)} (${quotaToDelete.status.toUpperCase()}).` : undefined}
        confirmLabel="Eliminar Quota"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (quotaToDelete) {
            storage.deleteQuota(quotaToDelete.id);
            setQuotaToDelete(null);
          }
        }}
        onClose={() => setQuotaToDelete(null)}
      />
    </div>
  );
};
