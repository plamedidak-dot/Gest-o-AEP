import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { EventsCalendarView } from './components/EventsCalendarView';
import { MembersView } from './components/MembersView';
import { QuotasView } from './components/QuotasView';
import { DocumentsView } from './components/DocumentsView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { AttendanceManagerModal } from './components/AttendanceManagerModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PdfReportModal, ReportType } from './components/PdfReportModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { LoginModal } from './components/LoginModal';
import { LoginGatewayScreen } from './components/LoginGatewayScreen';
import { ConfirmDialog } from './components/ConfirmDialog';
import { storage } from './services/storage';
import { 
  Member, 
  QuotaPayment, 
  AssociationEvent, 
  EventAttendance, 
  AssociationDocument, 
  AssociationSettings, 
  UserProfile, 
  AppNotification 
} from './types';
import { getMemberQuotaStatus } from './utils/formatters';
import { isGlobalAdmin, canManageDepartment, getAccessibleMembers } from './utils/permissions';
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign, 
  UserCircle, 
  FileText 
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('members'); // Open in members so user can immediately add or view
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => storage.getCurrentUser());
  const [settings, setSettings] = useState<AssociationSettings>(() => storage.getSettings());
  const [members, setMembers] = useState<Member[]>(() => storage.getMembers());
  const [quotas, setQuotas] = useState<QuotaPayment[]>(() => storage.getQuotas());
  const [events, setEvents] = useState<AssociationEvent[]>(() => storage.getEvents());
  const [attendance, setAttendance] = useState<EventAttendance[]>(() => storage.getAttendance());
  const [documents, setDocuments] = useState<AssociationDocument[]>(() => storage.getDocuments());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => storage.getNotifications());

  // Modal states
  const [attendanceDeskEvent, setAttendanceDeskEvent] = useState<AssociationEvent | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<QuotaPayment | null>(null);
  const [preselectedQuotaMember, setPreselectedQuotaMember] = useState<Member | null>(null);
  const [preselectedCertMember, setPreselectedCertMember] = useState<Member | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showConfirmSampleData, setShowConfirmSampleData] = useState(false);

  // PDF Report Modal State
  const [pdfReportState, setPdfReportState] = useState<{
    isOpen: boolean;
    type: ReportType;
    event?: AssociationEvent | null;
  } | null>(null);

  // Sync state when storage changes
  const reloadData = useCallback(() => {
    setCurrentUser(storage.getCurrentUser());
    setSettings(storage.getSettings());
    setMembers(storage.getMembers());
    setQuotas(storage.getQuotas());
    setEvents(storage.getEvents());
    setAttendance(storage.getAttendance());
    setDocuments(storage.getDocuments());
    setNotifications(storage.getNotifications());
  }, []);

  useEffect(() => {
    window.addEventListener('ae_storage_updated', reloadData);
    return () => window.removeEventListener('ae_storage_updated', reloadData);
  }, [reloadData]);

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Role-based navigation protection
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'member') {
      const nonMemberTabs = ['dashboard', 'members', 'quotas', 'attendance', 'settings'];
      if (nonMemberTabs.includes(currentTab)) {
        setCurrentTab('profile');
      }
    } else if (currentUser.role === 'coordinator' || currentUser.role === 'subcoordinator' || currentUser.role === 'secretary') {
      // Department leaders and secretaries can access dashboard, members, attendance, documents, calendar
      // Only general school settings and global quota treasury are reserved for Global Administration
      if (currentTab === 'settings' || currentTab === 'quotas') {
        setCurrentTab('dashboard');
      }
    }
  }, [currentUser, currentTab]);

  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
  };

  // If user is not authenticated yet, demand credentials
  if (!currentUser) {
    return (
      <LoginGatewayScreen
        settings={settings}
        onLoginSuccess={(user) => {
          storage.setCurrentUser(user);
          setCurrentUser(user);
          if (user.role === 'admin' || user.role === 'coordinator' || user.role === 'subcoordinator' || user.role === 'secretary') {
            setCurrentTab('dashboard');
          } else {
            setCurrentTab('profile');
          }
        }}
      />
    );
  }

  // Members strictly accessible to the user (department heads only have access to their department)
  const accessibleMembers = useMemo(() => {
    return getAccessibleMembers(currentUser, members);
  }, [currentUser, members]);

  // Overall calculations for sidebar (scoped to user's administrative responsibility)
  const totalMembersCount = isGlobalAdmin(currentUser) ? members.length : accessibleMembers.length;
  const membersWithQuotasInGoodStanding = accessibleMembers.filter(m => getMemberQuotaStatus(m, quotas).isUpToDate).length;
  const quotasUpToDatePercent = totalMembersCount > 0 
    ? Math.round((membersWithQuotasInGoodStanding / totalMembersCount) * 100)
    : 100;

  // Inter-tab navigations
  const handleOpenAttendanceDesk = (event: AssociationEvent) => {
    setAttendanceDeskEvent(event);
  };

  const handleOpenReceipt = (quota: QuotaPayment) => {
    setViewingReceipt(quota);
  };

  const handleEmitCertificate = (member: Member) => {
    setPreselectedCertMember(member);
    setCurrentTab('documents');
  };

  const handleChargeQuotaForMember = (member: Member) => {
    setPreselectedQuotaMember(member);
    setCurrentTab('quotas');
  };

  const handleLoadSampleData = () => {
    setShowConfirmSampleData(true);
  };

  const confirmLoadSampleDataAction = () => {
    storage.loadSampleSchoolData();
    setShowConfirmSampleData(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        settings={settings}
        currentUser={currentUser}
        totalMembers={totalMembersCount}
        quotasUpToDatePercent={quotasUpToDatePercent}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          currentTab={currentTab}
          currentUser={currentUser}
          notifications={notifications}
          onNavigateTab={setCurrentTab}
          onOpenNewEventModal={() => setCurrentTab('calendar')}
          onOpenNewMemberModal={() => setCurrentTab('members')}
          onOpenNewQuotaModal={() => setCurrentTab('quotas')}
          onOpenGlobalSearch={() => setIsSearchOpen(true)}
          onOpenLoginModal={() => setIsLoginOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          onUserChanged={setCurrentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              members={members}
              quotas={quotas}
              events={events}
              attendance={attendance}
              settings={settings}
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
              onOpenEventDesk={handleOpenAttendanceDesk}
              onOpenNewEventModal={() => setCurrentTab('calendar')}
              onOpenNewMemberModal={() => setCurrentTab('members')}
              onOpenNewQuotaModal={() => setCurrentTab('quotas')}
            />
          )}

          {currentTab === 'calendar' && (
            <EventsCalendarView
              events={events}
              attendance={attendance}
              members={members}
              currentUser={currentUser}
              onOpenAttendanceDesk={handleOpenAttendanceDesk}
            />
          )}

          {currentTab === 'members' && (
            <MembersView
              members={accessibleMembers}
              quotas={quotas}
              currentUser={currentUser}
              settings={settings}
              onEmitCertificate={handleEmitCertificate}
              onOpenNewQuotaModalWithMember={handleChargeQuotaForMember}
              onOpenPdfReport={() => setPdfReportState({ isOpen: true, type: 'members' })}
              onLoadSampleData={handleLoadSampleData}
              onSwitchUser={setCurrentUser}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'quotas' && (
            <QuotasView
              quotas={quotas}
              members={members}
              currentUser={currentUser}
              settings={settings}
              preselectedMember={preselectedQuotaMember}
              onClearPreselectedMember={() => setPreselectedQuotaMember(null)}
              onViewReceipt={handleOpenReceipt}
              onOpenPdfReport={() => setPdfReportState({ isOpen: true, type: 'quotas' })}
            />
          )}

          {currentTab === 'attendance' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Registo de Presenças & Controlo de Quórum
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selecione uma reunião ou assembleia para abrir a mesa de presenças ou exportar relatório em PDF
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const firstEvent = events[0] || null;
                      setPdfReportState({ isOpen: true, type: 'attendance', event: firstEvent });
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Exportar Relatório Geral de Presenças (PDF)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(evt => {
                  const evtAtt = attendance.filter(a => a.eventId === evt.id);
                  const presentCount = evtAtt.filter(a => a.status === 'presente').length;
                  const quorumNeeded = evt.isGeneralAssembly
                    ? Math.ceil(members.length * (evt.minQuorumPercent / 100))
                    : 0;

                  return (
                    <div
                      key={evt.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            evt.isGeneralAssembly ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}>
                            {evt.category}
                          </span>
                          <span className="text-xs text-slate-500">{evt.date} às {evt.time}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{evt.location}</p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 tabular-nums">{presentCount}</span> presentes
                          {evt.isGeneralAssembly && (
                            <span className="text-[11px] text-slate-500 block">
                              (Quórum: {quorumNeeded} necessários)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPdfReportState({ isOpen: true, type: 'attendance', event: evt })}
                            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleOpenAttendanceDesk(evt)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors"
                          >
                            Mesa de Chamada
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">Nenhum evento ou reunião agendada</p>
                    <p className="text-xs text-slate-400 mt-1">Crie um evento no Calendário para iniciar a lista de presenças.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === 'documents' && (
            <DocumentsView
              documents={documents}
              members={accessibleMembers}
              settings={settings}
              currentUser={currentUser}
              preselectedCertificateMember={preselectedCertMember}
              onClearCertificateMember={() => setPreselectedCertMember(null)}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              members={members}
              quotas={quotas}
              events={events}
              attendance={attendance}
              settings={settings}
              onUserUpdated={setCurrentUser}
              onOpenReceipt={handleOpenReceipt}
              onEmitCertificate={handleEmitCertificate}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              currentUser={currentUser}
              onSettingsUpdated={setSettings}
              onLoadSampleData={handleLoadSampleData}
            />
          )}
        </main>
      </div>

      {/* Attendance Manager Modal */}
      {attendanceDeskEvent && (
        <AttendanceManagerModal
          event={attendanceDeskEvent}
          members={accessibleMembers}
          attendance={attendance}
          settings={settings}
          onClose={() => setAttendanceDeskEvent(null)}
          onOpenPdfReport={() => setPdfReportState({ isOpen: true, type: 'attendance', event: attendanceDeskEvent })}
        />
      )}

      {/* Printable Receipt Modal */}
      {viewingReceipt && (
        <ReceiptModal
          quota={viewingReceipt}
          settings={settings}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {/* Structured PDF Report Modal */}
      {pdfReportState?.isOpen && (
        <PdfReportModal
          type={pdfReportState.type}
          settings={settings}
          members={accessibleMembers}
          quotas={quotas}
          event={pdfReportState.event}
          attendance={attendance.filter(a => !pdfReportState.event || a.eventId === pdfReportState.event.id)}
          onClose={() => setPdfReportState(null)}
        />
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        members={accessibleMembers}
        events={events}
        documents={documents}
        currentUser={currentUser}
        onSelectMember={(member) => {
          if (currentUser.role === 'admin') {
            setCurrentTab('members');
          } else {
            setCurrentTab('profile');
          }
        }}
        onSelectEvent={(evt) => {
          setCurrentTab('calendar');
        }}
        onSelectDocument={(doc) => {
          setCurrentTab('documents');
        }}
        onNavigateTab={setCurrentTab}
      />

      {/* Login & Switch Account Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        currentUser={currentUser}
        settings={settings}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'member') {
            setCurrentTab('profile');
          }
        }}
      />

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {isGlobalAdmin(currentUser) ? (
          <>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Painel</span>
            </button>
            <button
              onClick={() => setCurrentTab('members')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'members' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Membros</span>
            </button>
            <button
              onClick={() => setCurrentTab('calendar')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'calendar' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              <span>Eventos</span>
            </button>
            <button
              onClick={() => setCurrentTab('quotas')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'quotas' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span>Quotas</span>
            </button>
            <button
              onClick={() => setCurrentTab('profile')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span>Perfil</span>
            </button>
          </>
        ) : canManageDepartment(currentUser) ? (
          <>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Painel</span>
            </button>
            <button
              onClick={() => setCurrentTab('members')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'members' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Membros</span>
            </button>
            <button
              onClick={() => setCurrentTab('documents')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'documents' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Actas/Docs</span>
            </button>
            <button
              onClick={() => setCurrentTab('attendance')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'attendance' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              <span>Presenças</span>
            </button>
            <button
              onClick={() => setCurrentTab('profile')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span>Perfil</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentTab('profile')}
              className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span>Meu Perfil</span>
            </button>
            <button
              onClick={() => setCurrentTab('calendar')}
              className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'calendar' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              <span>Calendário</span>
            </button>
            <button
              onClick={() => setCurrentTab('documents')}
              className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg text-[10px] font-semibold transition-colors ${
                currentTab === 'documents' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Documentos</span>
            </button>
          </>
        )}
      </div>

      {/* Confirmation Dialog for Sample Data */}
      <ConfirmDialog
        isOpen={showConfirmSampleData}
        title="Carregar Dados de Demonstração"
        message="Deseja carregar a estrutura de teste da escola com membros organizados por departamentos e quotas semanais de 500 Kz?"
        detail="Os dados de teste ajudarão a pré-visualizar o sistema em funcionamento completo."
        confirmLabel="Carregar Dados"
        cancelLabel="Cancelar"
        isDestructive={false}
        onConfirm={confirmLoadSampleDataAction}
        onClose={() => setShowConfirmSampleData(false)}
      />
    </div>
  );
}
