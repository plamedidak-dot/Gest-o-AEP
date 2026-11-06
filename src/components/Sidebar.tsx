import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  CheckSquare, 
  FileText, 
  UserCircle, 
  Settings,
  CreditCard,
  Shield,
  Award,
  X
} from 'lucide-react';
import { AssociationSettings, UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  settings: AssociationSettings;
  currentUser: UserProfile;
  totalMembers: number;
  quotasUpToDatePercent: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  settings,
  currentUser,
  totalMembers,
  quotasUpToDatePercent,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const isAdmin = currentUser.role === 'admin';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    highlight?: boolean;
  }

  // Strict role segregation: Regular members ONLY see their personal portal & public events/docs
  const navItems: NavItem[] = isAdmin ? [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendário & Eventos', icon: Calendar, badge: 'Interativo' },
    { id: 'members', label: 'Membros & Sócios', icon: Users },
    { id: 'quotas', label: 'Quotas & Tesouraria', icon: DollarSign },
    { id: 'attendance', label: 'Presenças & Quórum', icon: CheckSquare },
    { id: 'documents', label: 'Arquivo Documental', icon: FileText },
    { id: 'profile', label: 'Meu Perfil & Quotas', icon: UserCircle },
    { id: 'settings', label: 'Definições da Escola', icon: Settings },
  ] : [
    { id: 'profile', label: 'O Meu Perfil & Quotas', icon: UserCircle, highlight: true },
    { id: 'calendar', label: 'Calendário Escolar', icon: Calendar },
    { id: 'documents', label: 'Documentos Oficiais', icon: FileText },
  ];

  const logoSrc = settings.logoUrl || '/src/assets/images/association_crest_1793825853762.jpg';

  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <>
      {/* Brand Zone with uploaded custom logo or default crest */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoSrc}
            alt="Logótipo da Associação"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-400/40 shrink-0 bg-white"
          />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
              {settings.acronym}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {settings.academicYear}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-900/50">
        <p className="text-[11px] text-slate-400 truncate leading-relaxed">
          {settings.name}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {isAdmin ? 'Módulos de Gestão Administrativa' : 'Área do Membro / Aluno'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Status Box */}
      {isAdmin ? (
        <div className="p-3.5 mx-3 mb-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Sócios Registados</span>
            <span className="font-semibold text-white tabular-nums">{totalMembers}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Quotas em Dia</span>
            <span className="font-semibold text-emerald-400 tabular-nums">{quotasUpToDatePercent}%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${quotasUpToDatePercent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="p-3 mx-3 mb-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-bold mb-1">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Portal do Associado</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Consulte as suas quotas semanais (500 Kz) e sua carteira digital.
          </p>
        </div>
      )}

      {/* Footer Profile Mini-card */}
      <div 
        onClick={() => handleItemClick('profile')} 
        className="p-3 mx-3 mb-3 border-t border-slate-800 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
            isAdmin ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
          }`}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {isAdmin ? (currentUser.adminRole || 'Direção (Admin)') : `Sócio: ${currentUser.accessCode || 'Aluno'}`}
            </p>
          </div>
        </div>
        <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 min-h-screen border-r border-slate-800 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" 
            onClick={onCloseMobile} 
          />
          {/* Drawer container */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl border-r border-slate-800 z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
