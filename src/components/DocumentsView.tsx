import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  Printer, 
  ShieldCheck, 
  X,
  FileCheck2,
  Calendar,
  Award
} from 'lucide-react';
import { AssociationDocument, DocumentCategory, Member, AssociationSettings, UserProfile } from '../types';
import { storage } from '../services/storage';
import { formatDatePt } from '../utils/formatters';
import { QRCodeSvg } from './QRCodeSvg';
import { ConfirmDialog } from './ConfirmDialog';
import { 
  canManageDocuments, 
  isDepartmentSecretary, 
  isDepartmentLeader, 
  isGlobalAdmin 
} from '../utils/permissions';

interface DocumentsViewProps {
  documents: AssociationDocument[];
  members: Member[];
  settings: AssociationSettings;
  currentUser: UserProfile;
  preselectedCertificateMember?: Member | null;
  onClearCertificateMember?: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  members,
  settings,
  currentUser,
  preselectedCertificateMember,
  onClearCertificateMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<AssociationDocument | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [certificateMember, setCertificateMember] = useState<Member | null>(preselectedCertificateMember || null);
  const [uploadedPdf, setUploadedPdf] = useState<{ dataUrl: string; name: string; size: string } | null>(null);
  const [docToDelete, setDocToDelete] = useState<AssociationDocument | null>(null);

  React.useEffect(() => {
    if (preselectedCertificateMember) {
      setCertificateMember(preselectedCertificateMember);
      if (onClearCertificateMember) onClearCertificateMember();
    }
  }, [preselectedCertificateMember]);

  const categoryLabels: Record<DocumentCategory, { label: string; badge: string }> = {
    estatuto: { label: 'Estatuto & Legislação', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
    acta: { label: 'Actas de Reuniões & AG', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    convocatoria: { label: 'Convocatórias Oficiais', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
    relatorio_contas: { label: 'Relatórios & Finanças', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    regulamento: { label: 'Regulamentos Internos', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
    declaracao: { label: 'Declarações & Certidões', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
    oficio: { label: 'Ofícios & Comunicações', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.officialNumber && d.officialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.fileName && d.fileName.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      return true;
    });
  }, [documents, searchTerm, categoryFilter]);

  const handleSaveDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const category = fd.get('category') as DocumentCategory;
    const date = fd.get('date') as string;
    const author = fd.get('author') as string;
    const officialNumber = fd.get('officialNumber') as string;
    const description = fd.get('description') as string;
    const contentBody = fd.get('contentBody') as string;

    storage.addDocument({
      title,
      category,
      date,
      author,
      description,
      fileType: 'pdf',
      fileSize: uploadedPdf ? uploadedPdf.size : '350 KB',
      officialNumber,
      contentBody,
      pdfDataUrl: uploadedPdf ? uploadedPdf.dataUrl : undefined,
      fileName: uploadedPdf ? uploadedPdf.name : undefined,
    });

    setUploadedPdf(null);
    setShowAddDocModal(false);
  };

  const handleDeleteDocument = (doc: AssociationDocument) => {
    setDocToDelete(doc);
  };

  const confirmDeleteDocAction = () => {
    if (!docToDelete) return;
    storage.deleteDocument(docToDelete.id);
    if (selectedDocForPreview?.id === docToDelete.id) {
      setSelectedDocForPreview(null);
    }
    setDocToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>
              {isDepartmentSecretary(currentUser)
                ? `Actas & Arquivo da Secretaria · ${currentUser.department || 'Departamento'}`
                : isDepartmentLeader(currentUser)
                ? `Documentos & Actas · ${currentUser.department || 'Departamento'}`
                : 'Arquivo Documental & Declarações Oficiais'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDepartmentSecretary(currentUser)
              ? `Lavratura de actas de reuniões, elaboração de convocatórias, ofícios e certidões do ${currentUser.department || 'Departamento'}`
              : 'Estatutos, actas de assembleias, convocatórias, relatórios e gerador de certidões académicas'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCertificateMember(members[0] || null)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Emitir Certidão de Sócio</span>
          </button>

          {canManageDocuments(currentUser) && (
            <button
              onClick={() => setShowAddDocModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isDepartmentSecretary(currentUser)
                  ? 'Lavrar Acta / Novo Documento'
                  : 'Arquivar Novo Documento'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Category Tabs (Abas) & Search Bar */}
      <div className="space-y-3">
        {/* Category Tabs (Abas de Documentos) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs scroll-smooth -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shadow-2xs flex items-center gap-2 shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Todos os Documentos</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              categoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {documents.length}
            </span>
          </button>

          {(Object.keys(categoryLabels) as DocumentCategory[]).map((cat) => {
            const count = documents.filter(d => d.category === cat).length;
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shadow-2xs flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{categoryLabels[cat].label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar estatutos, actas, convocatórias pelo título, autor ou número de registo..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => {
          const cfg = categoryLabels[doc.category] || { label: doc.category, badge: 'bg-slate-100 text-slate-700' };

          return (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  {doc.officialNumber && (
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {doc.officialNumber}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDatePt(doc.date)}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[10px] text-slate-400">{doc.fileSize}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ler Documento</span>
                  </button>

                  {canManageDocuments(currentUser) && (
                    <button
                      onClick={() => handleDeleteDocument(doc)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Reader Modal */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {selectedDocForPreview.officialNumber || 'DOCUMENTO OFICIAL'}
                  </span>
                  {selectedDocForPreview.pdfDataUrl && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      PDF Digital Anexado
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedDocForPreview.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Autor: {selectedDocForPreview.author} · {formatDatePt(selectedDocForPreview.date)} {selectedDocForPreview.fileName ? `· ${selectedDocForPreview.fileName}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {selectedDocForPreview.pdfDataUrl && (
                  <a
                    href={selectedDocForPreview.pdfDataUrl}
                    download={selectedDocForPreview.fileName || `${selectedDocForPreview.title}.pdf`}
                    className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Descarregar ficheiro PDF oficial"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Imprimir"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700 font-sans">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-medium">
                {selectedDocForPreview.description}
              </div>

              {/* If real PDF uploaded, show interactive iframe viewer */}
              {selectedDocForPreview.pdfDataUrl ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
                    <iframe
                      src={selectedDocForPreview.pdfDataUrl}
                      className="w-full h-[480px] rounded-xl"
                      title={selectedDocForPreview.title}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <span className="text-[11px] text-indigo-900 font-medium">
                      Ficheiro oficial: {selectedDocForPreview.fileName || 'documento.pdf'} ({selectedDocForPreview.fileSize})
                    </span>
                    <a
                      href={selectedDocForPreview.pdfDataUrl}
                      download={selectedDocForPreview.fileName || `${selectedDocForPreview.title}.pdf`}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar PDF</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-white border border-slate-200 rounded-xl whitespace-pre-line font-mono text-[11px] leading-relaxed text-slate-800">
                  {selectedDocForPreview.contentBody || 'O corpo deste documento está arquivado nos registos oficiais da Associação de Estudantes.'}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
              <span>{settings.name}</span>
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Generator Modal */}
      {/* Official Certificate Generator Modal */}
      {certificateMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
            {/* Sticky Header with prominent, touch-friendly Fechar and Imprimir buttons */}
            <div className="no-print p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                    Declaração Oficial de Associado
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    Formato A4 Oficial (210 × 297 mm)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimir A4</span>
                  <span className="sm:hidden">Imprimir</span>
                </button>
                <button
                  onClick={() => setCertificateMember(null)}
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
                className="a4-document max-w-[210mm] min-h-[297mm] mx-auto bg-white p-6 sm:p-10 md:p-12 text-slate-900 space-y-6 shadow-md rounded-xl border border-slate-200 relative print:p-0 print:border-none print:shadow-none print:rounded-none" 
                id="printable-certificate"
              >
                {/* Certificate Header */}
                <div className="text-center space-y-2 border-b-2 border-slate-800 pb-5">
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={settings.schoolLogoUrl || '/assets/aistudio/PEQUENO_87357065.png'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/favicon.png';
                      }}
                      alt="Complexo Proglory"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain p-0.5 ring-2 ring-amber-400 bg-white"
                    />
                    <img
                      src={settings.logoUrl || '/assets/aistudio/Screenshot_20261107-111452_1a58e2b0.jpg'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/favicon.png';
                      }}
                      alt="AEP-2"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain ring-2 ring-slate-900 bg-black"
                    />
                  </div>
                  <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-slate-900">
                    {settings.name} ({settings.acronym})
                  </h2>
                  <p className="text-xs text-slate-700 font-bold">
                    {settings.institution}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Edifício dos Estudantes · Mandato {settings.academicYear}
                  </p>
                </div>

                {/* Certificate Title */}
                <div className="text-center py-1 sm:py-2">
                  <h3 className="text-base sm:text-lg font-serif font-bold uppercase tracking-widest text-slate-900">
                    DECLARAÇÃO OFICIAL
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    REG-CERT-{new Date().getFullYear()}-{certificateMember.studentNumber}
                  </p>
                </div>

                {/* Formal Text */}
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed text-justify space-y-3 sm:space-y-4 font-serif">
                  <p>
                    Para os devidos efeitos e a pedido do interessado, a Direção da <strong>{settings.name}</strong> declara que:
                  </p>
                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans space-y-1">
                    <p><strong>Nome:</strong> {certificateMember.fullName}</p>
                    <p><strong>Nº de Processo:</strong> {certificateMember.studentNumber}</p>
                    <p><strong>Classe & Curso:</strong> {certificateMember.classLevel} ({certificateMember.course})</p>
                    <p><strong>Departamento & Cargo:</strong> {certificateMember.department} · {certificateMember.departmentRole}</p>
                  </div>
                  <p>
                    Encontra-se regularmente inscrito no livro de registo de membros desta Associação de Estudantes desde <strong>{formatDatePt(certificateMember.joinDate)}</strong>, estando no pleno gozo dos seus direitos estatutários e com as <strong>quotas associativas integralmente regularizadas</strong> à data presente.
                  </p>
                  <p>
                    A presente declaração é válida para todos os efeitos legais e académicos, nomeadamente para efeitos de comprovação de estatuto de estudante dirigente, bolsas ou benefícios académicos.
                  </p>
                </div>

                {/* Date & Signatures */}
                <div className="pt-6 grid grid-cols-2 gap-4 sm:gap-8 items-end">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <QRCodeSvg
                      value={`AEISU:CERTIFICADO:${certificateMember.studentNumber}:${new Date().getFullYear()}`}
                      size={64}
                    />
                    <div className="text-[9px] sm:text-[10px] text-slate-500">
                      <p className="font-bold text-slate-900">Selo de Autenticidade</p>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 font-mono">Conferido Digitalmente</p>
                    </div>
                  </div>

                  <div className="text-center border-t border-slate-400 pt-3">
                    <p className="font-serif italic text-xs text-slate-800 truncate">
                      {settings.presidentName}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                      Presidente da Direção da AE
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Mobile Bottom Floating Actions bar */}
            <div className="no-print sm:hidden p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0 shadow-lg pb-4">
              <button
                onClick={() => setCertificateMember(null)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Fechar Ficha</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir A4</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Arquivar Novo Documento Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Carregamento de PDF oficial ou redação de actas e convocatórias
                </p>
              </div>
              <button
                onClick={() => setShowAddDocModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título do Documento da Associação *</label>
                <input
                  name="title"
                  required
                  placeholder="Ex: Estatuto da Associação de Estudantes 2026/2027"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              {/* Real PDF File Uploader Box */}
              <div className="p-3.5 sm:p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="block font-bold text-indigo-950">
                    Ficheiro PDF da Associação
                  </label>
                  <span className="text-[10px] text-indigo-700 font-medium">
                    (Documento Oficial em PDF)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Carregue o ficheiro original em formato <span className="font-bold text-indigo-900">.pdf</span> para leitura integrada e download pelos associados.
                </p>

                {uploadedPdf ? (
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-bold text-slate-900 truncate">{uploadedPdf.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({uploadedPdf.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedPdf(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="w-full py-3 px-4 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl bg-white hover:bg-indigo-50/40 text-center cursor-pointer transition-colors block">
                    <Download className="w-5 h-5 text-indigo-600 mx-auto mb-1 rotate-180" />
                    <span className="font-semibold text-indigo-900 block">Clique para selecionar ficheiro .PDF</span>
                    <span className="text-[10px] text-slate-400">PDF até 10 MB</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const sizeKb = Math.round(file.size / 1024);
                        const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          setUploadedPdf({
                            dataUrl,
                            name: file.name,
                            size: sizeStr,
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Responsivo: 1 coluna em ecrãs móveis, 2 colunas em tablets/desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    name="category"
                    defaultValue="acta"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="estatuto">Estatuto & Legislação</option>
                    <option value="acta">Acta</option>
                    <option value="convocatoria">Convocatória</option>
                    <option value="relatorio_contas">Relatório de Contas</option>
                    <option value="regulamento">Regulamento</option>
                    <option value="declaracao">Declaração</option>
                    <option value="oficio">Ofício</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número Oficial / Registo</label>
                  <input
                    name="officialNumber"
                    placeholder="Ex: ACTA-09/2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data *</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Autor / Órgão Emissor *</label>
                  <input
                    name="author"
                    defaultValue={
                      isDepartmentSecretary(currentUser)
                        ? `Secretaria · ${currentUser.department || 'Departamento'}`
                        : isDepartmentLeader(currentUser)
                        ? `Coordenação · ${currentUser.department || 'Departamento'}`
                        : 'Secretaria-Geral da AE'
                    }
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumário / Descrição *</label>
                <textarea
                  name="description"
                  rows={2}
                  required
                  placeholder="Resumo do assunto deliberado ou convocado..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Texto Integral do Documento (Opcional)</label>
                <textarea
                  name="contentBody"
                  rows={3}
                  placeholder="Redija o teor completo da acta, deliberação ou convocatória..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  Arquivar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Dialog for Document Deletion */}
      <ConfirmDialog
        isOpen={Boolean(docToDelete)}
        title="Eliminar Documento do Arquivo"
        message={`Tem a certeza de que deseja eliminar o documento "${docToDelete?.title}"?`}
        detail={docToDelete ? `Categoria: ${docToDelete.category.toUpperCase()} · Ficheiro: ${docToDelete.fileName || 'Registo Interno'}. Esta ação não pode ser desfeita.` : undefined}
        confirmLabel="Eliminar Documento"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteDocAction}
        onClose={() => setDocToDelete(null)}
      />
    </div>
  );
};
