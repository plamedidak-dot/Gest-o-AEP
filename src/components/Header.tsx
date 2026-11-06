import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  UserCheck, 
  FileText, 
  LogOut, 
  Check, 
  Trash2,
  ShieldAlert,
  ArrowRight,
  Search,
  KeyRound,
  ShieldCheck,
  User,
  CreditCard,
  Menu
} from 'lucide-react';
import { AppNotification, UserProfile } from '../types';
import { storage } from '../services/storage';
import { formatDateTimePt } from '../utils/formatters';

interface HeaderProps {
  currentTab: string;
  currentUser: UserProfile;
  notifications: AppNotification[];
  onNavigateTab: (tab: string) => void;
  onOpenNewEventModal?: () => void;
  onOpenNewMemberModal?: () => void;
  onOpenNewQuotaModal?: () => void;
  onOpenGlobalSearch: () => void;
  onOpenLoginModal: () => void;
  onToggleMobileMenu?: () => void;
  onUserChanged: (user: UserProfile) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  notifications,
  onNavigateTab,
  onOpenNewEventModal,
  onOpenNewMemberModal,
  onOpenNewQuotaModal,
  onOpenGlobalSearch,
  onOpenLoginModal,
  onToggleMobileMenu,
  onUserChanged,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabTitles: Record<string, string> = {
    dashboard: 'Painel Geral',
    calendar: 'Calendário & Eventos',
    members: 'Gestão de Membros',
    quotas: 'Quotas & Tesouraria',
    attendance: 'Presenças & Quórum',
    documents: 'Arquivo Documental',
    profile: 'Meu Perfil & Quotas',
    settings: 'Definições da Associação',
  };

  const handleMarkAllRead = () => {
    storage.markAllNotificationsAsRead();
  };

  const handleDismissNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    storage.deleteNotification(id);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    storage.markNotificationAsRead(notif.id);
    if (notif.type === 'event_reminder' || notif.type === 'quorum_alert') {
      onNavigateTab('calendar');
    } else if (notif.type === 'quota_due') {
      onNavigateTab('quotas');
    } else if (notif.type === 'system') {
      onNavigateTab('documents');
    }
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 md:gap-6 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-slate-200">
      {/* Zone 1: Hamburger Button + Breadcrumb and Title */}
      <div className="flex items-center gap-2 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0 focus:outline-none"
            aria-label="Abrir menu de navegação"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden lg:inline">
          Portal AE
        </span>
        <span className="text-slate-300 hidden lg:inline">/</span>
        <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate">
          {tabTitles[currentTab] || 'Associação de Estudantes'}
        </h1>
        {currentUser.role === 'admin' ? (
          <span className="hidden sm:inline-block ml-1 sm:ml-2 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5 whitespace-nowrap">
            {currentUser.adminRole || 'Administração'}
          </span>
        ) : (
          <span className="hidden sm:inline-block ml-1 sm:ml-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 whitespace-nowrap">
            Membro ({currentUser.memberNumber || 'Aluno'})
          </span>
        )}
      </div>

      {/* Zone 2: Global Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm hidden md:block">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-500 rounded-xl text-xs font-medium transition-all border border-slate-200 group"
          title="Pesquisa Global por Membros, Códigos, Eventos ou Documentos (Ctrl+K)"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            <span className="truncate">Pesquisar membros, eventos...</span>
          </div>
          <kbd className="text-[10px] font-mono font-semibold bg-white text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs shrink-0">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Navigation contextual indicators & notifications */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Pesquisa Global"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            title="Notificações e Avisos de Eventos"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">Notificações da AE</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-medium bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Marcar lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Não existem notificações de momento.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors relative flex items-start gap-3 ${
                        !notif.read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                        {notif.type === 'event_reminder' && <Calendar className="w-4 h-4 text-indigo-600" />}
                        {notif.type === 'quorum_alert' && <ShieldAlert className="w-4 h-4 text-amber-600" />}
                        {notif.type === 'quota_due' && <DollarSign className="w-4 h-4 text-emerald-600" />}
                        {notif.type === 'system' && <FileText className="w-4 h-4 text-slate-600" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-semibold ${!notif.read ? 'text-indigo-950 font-bold' : 'text-slate-900'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatDateTimePt(notif.date).split(' às ')[1] || formatDateTimePt(notif.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDismissNotif(e, notif.id)}
                        className="opacity-40 hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"
                        title="Eliminar notificação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Switcher / Profile Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors focus:outline-none"
            title="Sessão & Códigos de Acesso"
          >
            <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${
              currentUser.role === 'admin' ? 'bg-slate-900' : 'bg-emerald-700'
            }`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 capitalize">
                {currentUser.role === 'admin' ? (currentUser.adminRole || 'Administração') : 'Membro Escolar'}
              </div>
            </div>
          </button>

          {/* User Menu Modal / Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    currentUser.role === 'admin' 
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {currentUser.role === 'admin' ? `Admin · ${currentUser.adminRole || 'Direção'}` : 'Membro Estudante'}
                  </span>
                  {currentUser.accessCode && (
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      Cód: {currentUser.accessCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Login Button with Access Code */}
              <div className="py-2.5 border-b border-slate-100">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenLoginModal();
                  }}
                  className="w-full px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>Entrar com Código / Trocar Conta</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 flex flex-col gap-1">
                <button
                  onClick={() => {
                    onNavigateTab('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>O Meu Perfil & Quotas</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Terminar Sessão (Sair)</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Zone 4: Primary Action depending on tab (Admin only) */}
        {currentUser.role === 'admin' && (
          <div className="hidden sm:block">
            {currentTab === 'calendar' && onOpenNewEventModal && (
              <button
                onClick={onOpenNewEventModal}
                className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm"
              >
                + Novo Evento
              </button>
            )}
            {currentTab === 'members' && onOpenNewMemberModal && (
              <button
                onClick={onOpenNewMemberModal}
                className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm"
              >
                + Novo Membro
              </button>
            )}
            {currentTab === 'quotas' && onOpenNewQuotaModal && (
              <button
                onClick={onOpenNewQuotaModal}
                className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm"
              >
                + Cobrar Quota
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
