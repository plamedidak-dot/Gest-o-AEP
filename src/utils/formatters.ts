import { Member, QuotaPayment } from '../types';

export function formatCurrency(amount: number, currency = 'Kz'): string {
  return `${amount.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDatePt(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimePt(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function getMemberQuotaStatus(member: Member, quotas: QuotaPayment[]): {
  isUpToDate: boolean;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  lastPayment?: QuotaPayment;
} {
  const memberQuotas = quotas.filter(q => q.memberId === member.id);
  const paid = memberQuotas.filter(q => q.status === 'pago');
  const overdue = memberQuotas.filter(q => q.status === 'atrasado');
  const pending = memberQuotas.filter(q => q.status === 'pendente');

  // Sorted by payment date or due date
  const sortedPaid = [...paid].sort((a, b) => {
    const da = a.paymentDate || a.dueDate;
    const db = b.paymentDate || b.dueDate;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  return {
    isUpToDate: overdue.length === 0,
    paidCount: paid.length,
    pendingCount: pending.length,
    overdueCount: overdue.length,
    lastPayment: sortedPaid[0],
  };
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const processCell = (cell: string | number) => {
    let str = cell === null || cell === undefined ? '' : String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = '\uFEFF' + [
    headers.map(processCell).join(';'),
    ...rows.map(row => row.map(processCell).join(';')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
