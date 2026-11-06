import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Users, 
  Calendar, 
  FileText, 
  ArrowRight, 
  CreditCard, 
  Clock, 
  Building2,
  DollarSign,
  FileDown,
  Sparkles
} from 'lucide-react';
import { Member, AssociationEvent, AssociationDocument, UserProfile } from '../types';
import { formatDatePt } from '../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  events: AssociationEvent[];
  documents: AssociationDocument[];
  currentUser: UserProfile;
  onSelectMember: (member: Member) => void;
  onSelectEvent: (event: AssociationEvent) => void;
  onSelectDocument: (doc: AssociationDocument) => void;
  onNavigateTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  members,
  events,
  documents,
  currentUser,
  onSelectMember,
  onSelectEvent,
  onSelectDocument,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search filter
  const matchedMembers = q ? members.filter(m => 
    m.fullName.toLowerCase().includes(q) ||
    m.studentNumber.toLowerCase().includes(q) ||
    (m.memberNumber && m.memberNumber.toLowerCase().includes(q)) ||
    (m.accessCode && m.accessCode.toLowerCase().includes(q)) ||
    (m.classLevel && m.classLevel.toLowerCase().includes(q)) ||
    (m.department && m.department.toLowerCase().includes(q)) ||
    (m.departmentRole && m.departmentRole.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const matchedEvents = q ? events.filter(e => 
    e.title.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.location.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const matchedDocuments = q ? documents.filter(d => 
    d.title.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    (d.officialNumber && d.officialNumber.toLowerCase().includes(q)) ||
    (d.fileName && d.fileName.toLowerCase().includes(q)) ||
    d.category.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const totalResults = matchedMembers.length + matchedEvents.length + matchedDocuments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por membro, código de acesso, evento ou documento..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-5 text-xs">
          {!q && (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-70" />
              <p className="font-semibold text-slate-700 text-sm">Busca Global Rápida</p>
              <p className="text-slate-400 max-w-md mx-auto text-xs">
                Digite o nome de um aluno, código de acesso (ex: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">AE-PROC1042</code>), número de associado (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">SOC-001</code>), evento escolar ou documento oficial.
              </p>
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="py-10 text-center text-slate-500">
              <p className="font-semibold text-slate-700">Nenhum resultado encontrado para &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Verifique a ortografia ou tente pesquisar por parte do nome, número de processo ou título.</p>
            </div>
          )}

          {/* Members Category */}
          {matchedMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" /> Membros Encontrados ({matchedMembers.length})
                </span>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onNavigateTab('members');
                      onClose();
                    }}
                    className="text-indigo-600 hover:underline capitalize font-semibold"
                  >
                    Ver todos na tabela
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {matchedMembers.map(member => (
                  <div
                    key={member.id}
                    onClick={() => {
                      onSelectMember(member);
                      onClose();
                    }}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {member.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 truncate group-hover:text-indigo-950">
                            {member.fullName}
                          </p>
                          <span className="text-[10px] font-mono font-bold bg-white text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                            {member.memberNumber || 'SÓCIO'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {member.accessCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {member.classLevel} ({member.turno}) · {member.department} ({member.departmentRole})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-200/70 text-slate-700">
                        Proc: {member.studentNumber}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Category */}
          {matchedEvents.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" /> Eventos & Assembleias ({matchedEvents.length})
                </span>
                <button
                  onClick={() => {
                    onNavigateTab('calendar');
                    onClose();
                  }}
                  className="text-indigo-600 hover:underline capitalize font-semibold"
                >
                  Abrir Calendário
                </button>
              </div>

              <div className="space-y-1.5">
                {matchedEvents.map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      onSelectEvent(evt);
                      onClose();
                    }}
                    className="p-3 bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-200 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {evt.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatDatePt(evt.date)} às {evt.time}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 truncate group-hover:text-amber-950">
                        {evt.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{evt.location}</p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Category */}
          {matchedDocuments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> Documentos Oficiais ({matchedDocuments.length})
                </span>
                <button
                  onClick={() => {
                    onNavigateTab('documents');
                    onClose();
                  }}
                  className="text-indigo-600 hover:underline capitalize font-semibold"
                >
                  Ver Arquivo
                </button>
              </div>

              <div className="space-y-1.5">
                {matchedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      onSelectDocument(doc);
                      onClose();
                    }}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {doc.officialNumber || doc.category.toUpperCase()}
                        </span>
                        {doc.pdfDataUrl && (
                          <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <FileDown className="w-3 h-3" /> PDF Anexado
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 truncate group-hover:text-emerald-950">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{doc.description}</p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Pressione <kbd className="font-bold text-slate-700 font-mono">ESC</kbd> para fechar</span>
          <span>Associação de Estudantes</span>
        </div>
      </div>
    </div>
  );
};
