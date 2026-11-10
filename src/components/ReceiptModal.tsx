import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { QuotaPayment, AssociationSettings } from '../types';
import { formatCurrency, formatDatePt } from '../utils/formatters';
import { QRCodeSvg } from './QRCodeSvg';

interface ReceiptModalProps {
  quota: QuotaPayment;
  settings: AssociationSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  quota,
  settings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Top bar (hidden in print) */}
        <div className="no-print p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              Recibo Oficial de Quota de Associado
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-900 bg-white flex-1" id="printable-receipt">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2 shrink-0">
                <img
                  src={settings.schoolLogoUrl || '/assets/aistudio/PEQUENO_87357065.png'}
                  alt="Complexo Proglory"
                  className="w-13 h-13 rounded-xl object-contain p-0.5 ring-2 ring-amber-300 bg-white"
                />
                <img
                  src={settings.logoUrl || '/assets/aistudio/Screenshot_20261107-111452_1a58e2b0.jpg'}
                  alt="AEP-2"
                  className="w-13 h-13 rounded-xl object-contain ring-2 ring-slate-800 bg-black"
                />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-wide uppercase text-slate-900">
                  {settings.name}
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  {settings.institution}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {settings.address} · Mandato {settings.academicYear}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded">
                {quota.receiptNumber || 'REC-OFICIAL'}
              </span>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">
                Emitido em: {formatDatePt(quota.paymentDate || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Receipt Title */}
          <div className="text-center py-1">
            <h2 className="text-base font-extrabold tracking-wider uppercase text-slate-800">
              Recibo de Quota Semanal de Associado
            </h2>
            <p className="text-xs text-slate-500">
              Ano Lectivo: {settings.academicYear} · Associação de Estudantes
            </p>
          </div>

          {/* Body Box */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3 text-xs leading-relaxed">
            <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
              <span className="text-slate-500">Recebemos do Aluno:</span>
              <strong className="text-slate-900 text-sm">{quota.memberName}</strong>
            </div>

            <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
              <span className="text-slate-500">Nº de Processo Escolar:</span>
              <strong className="font-mono text-slate-900">{quota.studentNumber}</strong>
            </div>

            <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
              <span className="text-slate-500">Departamento:</span>
              <span className="font-semibold text-slate-800">{quota.department || 'Geral'}</span>
            </div>

            <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
              <span className="text-slate-500">Referente à:</span>
              <span className="font-semibold text-slate-800">
                Quota Semanal — {quota.period}
              </span>
            </div>

            <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
              <span className="text-slate-500">Forma de Pagamento:</span>
              <span className="uppercase font-semibold text-slate-700">
                {quota.paymentMethod || 'Numerário / Caixa da AE'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-slate-700">Importância Paga:</span>
              <span className="text-lg font-black text-slate-900 font-mono tabular-nums bg-white px-3 py-1 rounded border border-slate-300">
                {formatCurrency(quota.amount, quota.currency)}
              </span>
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div className="grid grid-cols-2 gap-6 pt-4 items-end">
            <div className="flex items-center gap-3">
              <QRCodeSvg
                value={`AE_ESCOLA:RECIBO:${quota.receiptNumber}:${quota.studentNumber}:${quota.amount}KZ`}
                size={74}
              />
              <div className="text-[10px] text-slate-500">
                <p className="font-bold text-slate-800">Autenticação Digital</p>
                <p className="font-mono text-[9px] text-slate-400 mt-0.5">REG: {quota.id}</p>
                <p className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Quota Liquidada (500 Kz)
                </p>
              </div>
            </div>

            <div className="text-center border-t border-slate-300 pt-2">
              <p className="font-serif italic text-xs text-slate-700">
                {settings.treasurerName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Tesouraria da Associação de Estudantes
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Bottom Floating Actions */}
        <div className="no-print sm:hidden p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0 shadow-lg pb-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Fechar Recibo</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir A4</span>
          </button>
        </div>
      </div>
    </div>
  );
};
