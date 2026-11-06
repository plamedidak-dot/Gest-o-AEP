import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Bell, 
  Edit, 
  Trash2, 
  X,
  FileCheck2,
  CalendarCheck
} from 'lucide-react';
import { 
  AssociationEvent, 
  EventAttendance, 
  Member, 
  UserProfile, 
  EventCategory 
} from '../types';
import { storage } from '../services/storage';
import { formatDatePt } from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';

interface EventsCalendarViewProps {
  events: AssociationEvent[];
  attendance: EventAttendance[];
  members: Member[];
  currentUser: UserProfile;
  onOpenAttendanceDesk: (event: AssociationEvent) => void;
}

export const EventsCalendarView: React.FC<EventsCalendarViewProps> = ({
  events,
  attendance,
  members,
  currentUser,
  onOpenAttendanceDesk,
}) => {
  // Calendar month state (defaults to current date, November 2026 for demo context)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 10, 4));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<AssociationEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AssociationEvent | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string>('2026-11-04');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<AssociationEvent | null>(null);

  // Trigger feedback toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date(2026, 10, 4));

  // Category labels and styles
  const categoryConfig: Record<EventCategory, { label: string; bg: string; text: string; dot: string }> = {
    assembleia: { label: 'Assembleia Geral', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500' },
    pedagogico: { label: 'Pedagógico', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
    academico: { label: 'Académico', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
    cultural: { label: 'Cultural & Recreação', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
    desportivo: { label: 'Desporto', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    reuniao: { label: 'Reunião de Coordenação', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
    palestra: { label: 'Palestra Escolar', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800', dot: 'bg-teal-500' },
    workshop: { label: 'Workshop / Formação', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      return true;
    });
  }, [events, categoryFilter]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Adjust for Monday start (0=Sun, 1=Mon, ..., 6=Sat)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === '2026-11-04'; // anchored demo date
      days.push({ dateStr, dayNum: d, isCurrentMonth: true, isToday });
    }

    // Next month padding to fill complete grid of 35 or 42
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [year, month]);

  const monthNamesPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Helper to get RSVP status for current member for a given event
  const getMyAttendance = (eventId: string) => {
    if (!currentUser.memberId) return null;
    return attendance.find(a => a.eventId === eventId && a.memberId === currentUser.memberId);
  };

  // RSVP toggle handler
  const handleToggleRsvp = (eventId: string, newStatus: 'presente' | 'ausente') => {
    if (!currentUser.memberId) {
      showToast('O seu utilizador não está associado a um registo de estudante.');
      return;
    }

    const currentMember = members.find(m => m.id === currentUser.memberId);
    if (!currentMember) return;

    storage.recordAttendance({
      eventId,
      memberId: currentMember.id,
      memberName: currentMember.fullName,
      studentNumber: currentMember.studentNumber,
      course: currentMember.course,
      classLevel: currentMember.classLevel,
      department: currentMember.department,
      status: newStatus,
      checkInTime: new Date().toISOString(),
    });

    showToast(
      newStatus === 'presente' 
        ? 'Presença confirmada com sucesso! Obrigado pela participação.'
        : 'Confirmação cancelada.'
    );
  };

  // Broadcast notification to all members about this event
  const handleBroadcastReminder = (event: AssociationEvent) => {
    storage.addNotification({
      title: `Lembrete: ${event.title}`,
      message: `O evento está marcado para ${formatDatePt(event.date)} às ${event.time} no local: ${event.location}. Não te esqueças de confirmar a tua presença!`,
      date: new Date().toISOString(),
      type: 'event_reminder',
      eventId: event.id,
      read: false,
    });
    showToast('Notificação e lembrete enviados a todos os associados!');
  };

  // Handle Event Creation/Edit
  const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const category = formData.get('category') as EventCategory;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;
    const isGeneralAssembly = formData.get('isGeneralAssembly') === 'on';
    const minQuorumPercent = Number(formData.get('minQuorumPercent') || (isGeneralAssembly ? 50 : 0));
    const maxCapacity = Number(formData.get('maxCapacity') || 100);

    if (editingEvent) {
      storage.updateEvent(editingEvent.id, {
        title,
        category,
        date,
        time,
        location,
        description,
        isGeneralAssembly,
        minQuorumPercent,
        maxCapacity,
      });
      showToast('Evento atualizado com sucesso!');
    } else {
      const newEvt = storage.addEvent({
        title,
        category,
        date,
        time,
        location,
        description,
        isGeneralAssembly,
        minQuorumPercent,
        maxCapacity,
        status: 'agendado',
      });

      // Dispatch initial notification
      storage.addNotification({
        title: `Novo Evento: ${title}`,
        message: `Novo evento agendado para ${formatDatePt(date)} às ${time} em ${location}.`,
        date: new Date().toISOString(),
        type: isGeneralAssembly ? 'quorum_alert' : 'event_reminder',
        eventId: newEvt.id,
        read: false,
      });

      showToast('Novo evento criado e divulgado aos sócios!');
    }

    setShowCreateModal(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (event: AssociationEvent) => {
    setEventToDelete(event);
  };

  const confirmDeleteEventAction = () => {
    if (!eventToDelete) return;
    storage.deleteEvent(eventToDelete.id);
    if (selectedEvent?.id === eventToDelete.id) {
      setSelectedEvent(null);
    }
    setEventToDelete(null);
    showToast('Evento eliminado com sucesso.');
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Calendário Académico & Eventos
            </h2>
            <p className="text-xs text-slate-500">
              Planeamento de assembleias, atividades culturais, torneios e confirmação de presenças
            </p>
          </div>
        </div>

        {/* View Switcher and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented view controls */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lista ({filteredEvents.length})
            </button>
          </div>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setPrefilledDate('2026-11-04');
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Evento</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            categoryFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos os Eventos ({events.length})
        </button>
        {(Object.keys(categoryConfig) as EventCategory[]).map(cat => {
          const cfg = categoryConfig[cat];
          const count = events.filter(e => e.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span>{cfg.label}</span>
              <span className="text-[10px] opacity-75 tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Month Navigation Bar */}
      {viewMode === 'month' && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              {monthNamesPt[month]} {year}
            </h3>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              {filteredEvents.filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} eventos neste mês
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              Hoje
            </button>
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              aria-label="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              aria-label="Mês Seguinte"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View: Month Grid */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-[10px] sm:text-xs font-semibold text-slate-600 py-2 sm:py-2.5">
            <div><span className="sm:hidden">Seg</span><span className="hidden sm:inline">Segunda</span></div>
            <div><span className="sm:hidden">Ter</span><span className="hidden sm:inline">Terça</span></div>
            <div><span className="sm:hidden">Qua</span><span className="hidden sm:inline">Quarta</span></div>
            <div><span className="sm:hidden">Qui</span><span className="hidden sm:inline">Quinta</span></div>
            <div><span className="sm:hidden">Sex</span><span className="hidden sm:inline">Sexta</span></div>
            <div className="text-indigo-600"><span className="sm:hidden">Sáb</span><span className="hidden sm:inline">Sábado</span></div>
            <div className="text-indigo-600"><span className="sm:hidden">Dom</span><span className="hidden sm:inline">Domingo</span></div>
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[420px] sm:min-h-[560px]">
            {calendarDays.map((day, idx) => {
              const dayEvents = filteredEvents.filter(e => e.date === day.dateStr);

              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  onClick={() => {
                    if (currentUser.role === 'admin') {
                      setPrefilledDate(day.dateStr);
                      setEditingEvent(null);
                      setShowCreateModal(true);
                    }
                  }}
                  className={`p-1 sm:p-2 flex flex-col justify-between transition-colors min-h-[75px] sm:min-h-[110px] group ${
                    !day.isCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'bg-white'
                  } ${day.isToday ? 'bg-indigo-50/30 ring-1 ring-inset ring-indigo-400' : ''} ${
                    currentUser.role === 'admin' ? 'cursor-pointer hover:bg-slate-50/80' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                        day.isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {currentUser.role === 'admin' && day.isCurrentMonth && (
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 font-medium hidden sm:inline">
                        +
                      </span>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="mt-1.5 space-y-1 flex-1">
                    {dayEvents.map(evt => {
                      const cfg = categoryConfig[evt.category];
                      const confirmedCount = attendance.filter(
                        a => a.eventId === evt.id && a.status === 'presente'
                      ).length;
                      const myAtt = getMyAttendance(evt.id);

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className={`px-1.5 py-1 rounded text-[11px] font-medium border truncate cursor-pointer transition-transform hover:scale-[1.02] ${cfg.bg} ${cfg.text}`}
                          title={`${evt.time} - ${evt.title}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{evt.time} {evt.title}</span>
                            {myAtt?.status === 'presente' && (
                              <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                            )}
                          </div>
                          {evt.isGeneralAssembly && (
                            <div className="text-[9px] opacity-80 mt-0.5 tabular-nums">
                              AG · {confirmedCount} confirmados
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum evento encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Experimente alterar a categoria selecionada.</p>
            </div>
          ) : (
            filteredEvents
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(evt => {
                const cfg = categoryConfig[evt.category];
                const confirmedCount = attendance.filter(
                  a => a.eventId === evt.id && a.status === 'presente'
                ).length;
                const myAtt = getMyAttendance(evt.id);

                return (
                  <div
                    key={evt.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {new Date(evt.date).toLocaleDateString('pt-PT', { month: 'short' })}
                        </span>
                        <span className="text-lg font-extrabold tabular-nums leading-none mt-0.5">
                          {new Date(evt.date).getDate()}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          {evt.isGeneralAssembly && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              Quórum Obrigatório ({evt.minQuorumPercent}%)
                            </span>
                          )}
                          {myAtt?.status === 'presente' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Minha presença confirmada
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 mt-1 truncate">
                          {evt.title}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {evt.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {evt.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-800 tabular-nums">{confirmedCount}</strong> confirmados
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Member RSVP button */}
                      {myAtt?.status === 'presente' ? (
                        <button
                          onClick={() => handleToggleRsvp(evt.id, 'ausente')}
                          className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Cancelar Presença
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleRsvp(evt.id, 'presente')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Presença</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Detalhes
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => onOpenAttendanceDesk(evt)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          title="Fazer chamada e verificar quórum"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Chamada</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Event Details & RSVP Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${categoryConfig[selectedEvent.category].bg} ${categoryConfig[selectedEvent.category].text}`}>
                  {categoryConfig[selectedEvent.category].label}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CalendarIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>Data:</strong> {formatDatePt(selectedEvent.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>Hora:</strong> {selectedEvent.time}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>Local:</strong> {selectedEvent.location}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Descrição & Ordem de Trabalhos
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Quorum Progress (for AGs) */}
              {selectedEvent.isGeneralAssembly && (
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-rose-950">
                      Verificação de Quórum Estatutário (Assembleia Geral)
                    </span>
                    <span className="font-bold text-rose-800 tabular-nums">
                      {attendance.filter(a => a.eventId === selectedEvent.id && a.status === 'presente').length} / {Math.ceil(members.length * (selectedEvent.minQuorumPercent / 100))} necessários ({selectedEvent.minQuorumPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (attendance.filter(a => a.eventId === selectedEvent.id && a.status === 'presente').length /
                            Math.max(1, Math.ceil(members.length * (selectedEvent.minQuorumPercent / 100)))) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-rose-700 mt-2">
                    {attendance.filter(a => a.eventId === selectedEvent.id && a.status === 'presente').length >=
                    Math.ceil(members.length * (selectedEvent.minQuorumPercent / 100))
                      ? '✓ Quórum atingido! A Assembleia Geral poderá deliberar validamente em 1ª convocatória.'
                      : 'Aguardando quórum em 1ª convocatória. Conforme os estatutos, reúne 30 minutos depois em 2ª convocatória.'}
                  </p>
                </div>
              )}

              {/* RSVP Action Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    A tua presença neste evento
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    {getMyAttendance(selectedEvent.id)?.status === 'presente'
                      ? 'Confirmaste a tua presença neste evento.'
                      : 'Informa a associação se irás comparecer para cálculo de lugares e quórum.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getMyAttendance(selectedEvent.id)?.status === 'presente' ? (
                    <button
                      onClick={() => handleToggleRsvp(selectedEvent.id, 'ausente')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Declinar Presença
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleRsvp(selectedEvent.id, 'presente')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Presença</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Confirmed Members List Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Membros Confirmados ({attendance.filter(a => a.eventId === selectedEvent.id && a.status === 'presente').length})
                  </h4>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {attendance
                    .filter(a => a.eventId === selectedEvent.id && a.status === 'presente')
                    .map(att => (
                      <div key={att.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <p className="font-semibold text-slate-900">{att.memberName}</p>
                          <p className="text-[10px] text-slate-500">{att.department || att.course || 'Geral'} · Proc: {att.studentNumber}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Confirmado
                        </span>
                      </div>
                    ))}
                  {attendance.filter(a => a.eventId === selectedEvent.id && a.status === 'presente').length === 0 && (
                    <p className="p-4 text-center text-xs text-slate-400">
                      Nenhuma confirmação registada ainda. Sê o primeiro a confirmar!
                    </p>
                  )}
                </div>
              </div>

              {/* Notification Broadcast Action */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => handleBroadcastReminder(selectedEvent)}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Disparar Lembrete / Notificação</span>
                </button>

                {currentUser.role === 'admin' && (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        onOpenAttendanceDesk(selectedEvent);
                        setSelectedEvent(null);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Folha de Presenças</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingEvent(selectedEvent);
                        setSelectedEvent(null);
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      title="Eliminar Evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingEvent ? 'Editar Evento da Associação' : 'Agendar Novo Evento Académico'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingEvent(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Título do Evento *
                </label>
                <input
                  name="title"
                  defaultValue={editingEvent?.title || ''}
                  required
                  placeholder="Ex: Assembleia Geral Extraordinária / Noite de Fados"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    defaultValue={editingEvent?.category || 'academico'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                  >
                    <option value="assembleia">Assembleia Geral</option>
                    <option value="academico">Académico</option>
                    <option value="cultural">Cultural & Lazer</option>
                    <option value="desportivo">Desporto</option>
                    <option value="reuniao">Reunião de Direção</option>
                    <option value="workshop">Workshop / Formação</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lotação Máxima
                  </label>
                  <input
                    name="maxCapacity"
                    type="number"
                    defaultValue={editingEvent?.maxCapacity || 100}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Data do Evento *
                  </label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={editingEvent?.date || prefilledDate}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hora de Início *
                  </label>
                  <input
                    name="time"
                    type="time"
                    defaultValue={editingEvent?.time || '18:30'}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Localização / Sala *
                </label>
                <input
                  name="location"
                  defaultValue={editingEvent?.location || ''}
                  required
                  placeholder="Ex: Auditório Central, Anfiteatro 3, Sala 2.04"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descrição e Ordem de Trabalhos
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingEvent?.description || ''}
                  placeholder="Descreva o programa do evento ou a convocatória..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isGeneralAssembly"
                    defaultChecked={editingEvent?.isGeneralAssembly || false}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">
                    É Assembleia Geral (Exige verificação de Quórum Estatutário)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors shadow-sm"
                >
                  {editingEvent ? 'Guardar Alterações' : 'Criar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Dialog for Event Deletion */}
      <ConfirmDialog
        isOpen={Boolean(eventToDelete)}
        title="Eliminar Evento da Associação"
        message={`Tem a certeza de que deseja eliminar o evento "${eventToDelete?.title}"?`}
        detail={eventToDelete ? `Data: ${formatDatePt(eventToDelete.date)} às ${eventToDelete.time} · Local: ${eventToDelete.location}. As presenças e notificações associadas serão canceladas.` : undefined}
        confirmLabel="Eliminar Evento"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteEventAction}
        onClose={() => setEventToDelete(null)}
      />
    </div>
  );
};
