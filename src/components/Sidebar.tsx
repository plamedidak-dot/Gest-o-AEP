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
  X,
  LogOut
} from 'lucide-react';
import { AssociationSettings, UserProfile } from '../types';
import { 
  isGlobalAdmin, 
  isDepartmentLeader, 
  isDepartmentSecretary, 
  canManageDepartment,
  getUserBadgeInfo 
} from '../utils/permissions';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  settings: AssociationSettings;
  currentUser: UserProfile;
  totalMembers: number;
  quotasUpToDatePercent: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
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
  onLogout,
}) => {
  const isAdmin = isGlobalAdmin(currentUser);
  const isLeader = isDepartmentLeader(currentUser);
  const isSec = isDepartmentSecretary(currentUser);
  const deptName = currentUser.department || 'Departamento';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    highlight?: boolean;
  }

  // Navigation segregated by administrative authority, department leadership, secretarial work, or student member
  const getNavItems = (): NavItem[] => {
    if (isAdmin) {
      return [
        { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendário & Eventos', icon: Calendar, badge: 'Interativo' },
        { id: 'members', label: 'Membros & Sócios', icon: Users },
        { id: 'quotas', label: 'Quotas & Tesouraria', icon: DollarSign },
        { id: 'attendance', label: 'Presenças & Quórum', icon: CheckSquare },
        { id: 'documents', label: 'Arquivo Documental', icon: FileText },
        { id: 'profile', label: 'Meu Perfil & Quotas', icon: UserCircle },
        { id: 'settings', label: 'Definições da Escola', icon: Settings },
      ];
    }

    if (isLeader) {
      return [
        { id: 'dashboard', label: `Painel do Departamento`, icon: LayoutDashboard },
        { id: 'members', label: `Membros do Departamento`, icon: Users, badge: 'Gestão' },
        { id: 'attendance', label: `Presenças & Chamadas`, icon: CheckSquare },
        { id: 'calendar', label: `Reuniões do Departamento`, icon: Calendar },
        { id: 'documents', label: `Documentos & Certidões`, icon: FileText },
        { id: 'profile', label: `O Meu Perfil`, icon: UserCircle },
      ];
    }

    if (isSec) {
      return [
        { id: 'dashboard', label: `Secretaria do Dept.`, icon: LayoutDashboard },
        { id: 'members', label: `Registo de Membros`, icon: Users, badge: 'Secretaria' },
        { id: 'documents', label: `Actas & Arquivo Oficial`, icon: FileText, badge: 'Actas' },
        { id: 'attendance', label: `Folhas de Presença`, icon: CheckSquare },
        { id: 'calendar', label: `Convocatórias & Reuniões`, icon: Calendar },
        { id: 'profile', label: `O Meu Perfil`, icon: UserCircle },
      ];
    }

    return [
      { id: 'profile', label: 'O Meu Perfil & Quotas', icon: UserCircle, highlight: true },
      { id: 'calendar', label: 'Calendário Escolar', icon: Calendar },
      { id: 'documents', label: 'Documentos Oficiais', icon: FileText },
    ];
  };

  const navItems = getNavItems();

  const logoSrc = settings.logoUrl || '/assets/aistudio/Screenshot_20261107-111452_1a58e2b0.jpg';
  const schoolLogoSrc = settings.schoolLogoUrl || '/assets/aistudio/PEQUENO_87357065.png';

  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <>
      {/* Brand Zone with official AEP-2 logo and Proglory school crest */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center -space-x-2 shrink-0">
            <img
              src={schoolLogoSrc}
              alt="Complexo Escolar Privado Proglory"
              className="w-9 h-9 rounded-xl object-contain p-0.5 ring-2 ring-amber-400/40 shrink-0 bg-white shadow-sm"
            />
            <img
              src={logoSrc}
              alt="Emblema AEP-2"
              className="w-9 h-9 rounded-xl object-contain ring-2 ring-indigo-400/50 shrink-0 bg-black shadow-sm"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-white tracking-wider truncate leading-tight uppercase flex items-center gap-1.5">
              <span>{settings.acronym}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Polo II
              </span>
            </h2>
            <p className="text-[11px] text-slate-300 truncate font-medium">
              Proglory da Graça 2
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

      <div className="px-3.5 py-2 border-b border-slate-800/60 bg-slate-900/60">
        <p className="text-[10px] font-semibold text-slate-300 leading-snug line-clamp-2">
          {settings.institution}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {isAdmin 
            ? 'Módulos de Gestão Administrativa' 
            : isLeader 
              ? `Coordenação · ${deptName}` 
              : isSec 
                ? `Secretaria · ${deptName}` 
                : 'Área do Membro / Aluno'}
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
      ) : (isLeader || isSec) ? (
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 text-sky-300 font-bold mb-1">
            <Shield className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">{deptName}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 my-1">
            <span>Membros do Dept.</span>
            <span className="font-semibold text-white tabular-nums">{totalMembers}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Cargo: <strong className="text-white">{currentUser.departmentRole || (isLeader ? 'Coordenador' : 'Secretária')}</strong>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            {isSec 
              ? 'Secretaria: Acesso exclusivo aos membros e actas do seu departamento.' 
              : 'Coordenação: Acesso exclusivo aos membros associados ao seu departamento.'}
          </p>
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
      <div className="p-3 mx-3 mb-3 border-t border-slate-800 space-y-2">
        <div 
          onClick={() => handleItemClick('profile')} 
          className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              isAdmin 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' 
                : (isLeader || isSec)
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
            }`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {getUserBadgeInfo(currentUser).title}
              </p>
            </div>
          </div>
          <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </div>

        {onLogout && (
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl border border-rose-900/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminar Sessão</span>
          </button>
        )}
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
