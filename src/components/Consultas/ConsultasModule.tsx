import React, { useState, useEffect } from 'react';
import { Consulta, Patient, Location } from '../../types';
import { api } from '../../services/api';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, 
  User, Plus, CheckCircle, AlertCircle, Phone, 
  MapPin, Stethoscope, Filter, Search, X, Check, MessageSquare, Building2
} from 'lucide-react';

interface ConsultasModuleProps {
  patients: Patient[];
  selectedPatient?: Patient | null;
  onSelectPatient?: (patientId: number) => void;
  locations?: Location[];
  currentLocationId?: number | 'all';
}

export const ConsultasModule: React.FC<ConsultasModuleProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  locations = [],
  currentLocationId = 'all',
}) => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');
  const [locationFilter, setLocationFilter] = useState<number | 'all'>(currentLocationId);

  // Calendar Date State (selected month & active day)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal: Nueva Cita
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [modalPatientId, setModalPatientId] = useState<number | ''>(selectedPatient ? selectedPatient.id : (patients[0]?.id || ''));
  const [modalLocationId, setModalLocationId] = useState<number>(selectedPatient?.location_id || 1);
  const [modalFecha, setModalFecha] = useState<string>(selectedDateStr);
  const [modalHoraInicio, setModalHoraInicio] = useState<string>('10:00');
  const [modalHoraFin, setModalHoraFin] = useState<string>('10:45');
  const [modalDuracion, setModalDuracion] = useState<number>(45);
  const [modalMotivo, setModalMotivo] = useState<string>('');
  const [modalDoctor, setModalDoctor] = useState<string>('Dra. Rebeca Aguilar');
  const [modalSillon, setModalSillon] = useState<string>('Sillón 1 (Pediatría)');
  const [modalNotas, setModalNotas] = useState<string>('');

  useEffect(() => {
    setLocationFilter(currentLocationId);
  }, [currentLocationId]);

  useEffect(() => {
    loadConsultas(locationFilter);
  }, [locationFilter]);

  useEffect(() => {
    if (selectedPatient) {
      setModalPatientId(selectedPatient.id);
      if (selectedPatient.location_id) {
        setModalLocationId(selectedPatient.location_id);
      }
    }
  }, [selectedPatient]);

  const loadConsultas = async (locId: number | 'all' = locationFilter) => {
    try {
      setLoading(true);
      const data = await api.getConsultas(locId !== 'all' ? locId : undefined);
      setConsultas(data);
    } catch (err) {
      console.error('Error al cargar consultas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  const handleStatusChange = async (id: number, nuevoEstado: Consulta['estado']) => {
    try {
      const target = consultas.find(c => c.id === id);
      if (!target) return;
      await api.updateConsulta(id, { ...target, estado: nuevoEstado });
      setConsultas(consultas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  const handleCreateConsulta = async () => {
    if (!modalPatientId || !modalMotivo) {
      alert('Por favor selecciona un paciente e ingresa el motivo de la cita.');
      return;
    }

    try {
      await api.createConsulta({
        patient_id: Number(modalPatientId),
        location_id: Number(modalLocationId),
        fecha: modalFecha,
        hora_inicio: modalHoraInicio,
        hora_fin: modalHoraFin,
        duracion_minutos: modalDuracion,
        motivo: modalMotivo,
        doctor: modalDoctor,
        sillon: modalSillon,
        estado: 'Programada',
        notas: modalNotas,
      });

      setShowNewModal(false);
      setModalMotivo('');
      setModalNotas('');
      await loadConsultas(locationFilter);
    } catch (err: any) {
      console.error('Error al agendar cita:', err);
      alert(err.message || 'Error al agendar la cita. Verifica el estado de tu licencia.');
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysArray.push({ dayNumber: d, dateStr: dStr });
  }

  // Filter appointments for active date
  const activeDayConsultas = consultas.filter(c => c.fecha === selectedDateStr);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Calendar Controls */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-500 text-white flex items-center justify-center shadow-sm font-black">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800">
              Agenda de Consultas & Citas
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Gestión visual de citas por fecha, hora, paciente y sillón dental
            </p>
          </div>
        </div>

        {/* View Mode Toggle & New Appointment Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Location Filter Pill */}
          {locations.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Building2 size={14} className="text-purple-600 ml-1.5" />
              <select
                value={locationFilter}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setLocationFilter(val);
                }}
                className="text-xs font-bold bg-transparent text-slate-700 pr-2 py-0.5 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas las Sedes ({locations.length})</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-cyan-800 shadow-sm'
                  : 'text-slate-600 hover:text-cyan-700'
              }`}
            >
              Vista Calendario
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-cyan-800 shadow-sm'
                  : 'text-slate-600 hover:text-cyan-700'
              }`}
            >
              Agenda Lista ({activeDayConsultas.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalFecha(selectedDateStr);
              setShowNewModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-1.5"
          >
            <Plus size={16} />
            <span>+ Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Main Calendar + Day Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid Section */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <h3 className="text-base md:text-lg font-black text-slate-800">
                {monthNames[month]} {year}
              </h3>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-[11px] font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 transition-colors"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider py-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysArray.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-24 md:h-28 bg-slate-50/40 rounded-xl"></div>;
              }

              const { dayNumber, dateStr } = cell;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateStr;
              const dayCitas = consultas.filter(c => c.fecha === dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-24 md:h-28 p-1.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-cyan-50/70 border-cyan-500 ring-2 ring-cyan-400/40 shadow-xs'
                      : isToday
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-amber-500 text-white'
                          : isSelected
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {dayCitas.length > 0 && (
                      <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100 px-1.5 rounded-full">
                        {dayCitas.length}
                      </span>
                    )}
                  </div>

                  {/* Micro list of appointments on this day */}
                  <div className="flex-1 overflow-hidden space-y-1 my-1">
                    {dayCitas.slice(0, 2).map(c => (
                      <div
                        key={c.id}
                        className={`text-[10px] font-semibold truncate px-1 py-0.5 rounded leading-tight ${
                          c.estado === 'En atención'
                            ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 animate-pulse'
                            : c.estado === 'En espera'
                            ? 'bg-amber-100 text-amber-800'
                            : c.estado === 'Completada'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-cyan-100 text-cyan-800'
                        }`}
                        title={`${c.hora_inicio} - ${c.paciente_nombre}: ${c.motivo}`}
                      >
                        <span className="font-mono font-bold mr-0.5">{c.hora_inicio}</span>
                        <span>{c.paciente_nombre?.split(' ')[0]}</span>
                      </div>
                    ))}
                    {dayCitas.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-bold text-center">
                        +{dayCitas.length - 2} más
                      </div>
                    )}
                  </div>

                  {/* Add appointment shortcut on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalFecha(dateStr);
                      setShowNewModal(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-cyan-600 hover:text-cyan-800 text-center transition-opacity"
                  >
                    + Cita
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Column */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                Citas del Día
              </span>
              <h3 className="text-base font-black text-slate-800 capitalize">
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalFecha(selectedDateStr);
                setShowNewModal(true);
              }}
              className="p-1.5 text-cyan-700 hover:bg-cyan-50 rounded-lg"
              title="Añadir cita en esta fecha"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Appointments List for the selected day */}
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {activeDayConsultas.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock size={32} className="mx-auto text-slate-300" />
                <p className="text-xs font-medium">No hay citas agendadas para esta fecha.</p>
                <button
                  type="button"
                  onClick={() => {
                    setModalFecha(selectedDateStr);
                    setShowNewModal(true);
                  }}
                  className="text-xs font-bold text-cyan-600 hover:underline inline-block pt-1"
                >
                  + Agendar una cita aquí
                </button>
              </div>
            ) : (
              activeDayConsultas.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50/80 hover:bg-cyan-50/40 p-3.5 rounded-2xl border border-slate-200 hover:border-cyan-300 transition-all space-y-2.5 shadow-xs"
                >
                  {/* Top Bar: Time and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-mono text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      <Clock size={13} className="text-cyan-600" />
                      <span>{c.hora_inicio} - {c.hora_fin}</span>
                    </div>

                    {/* Status Badge with quick switcher */}
                    <select
                      value={c.estado}
                      onChange={(e) => handleStatusChange(c.id, e.target.value as any)}
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                        c.estado === 'En atención'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/40'
                          : c.estado === 'En espera'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : c.estado === 'Completada'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : c.estado === 'Cancelada'
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                      }`}
                    >
                      <option value="Programada">Programada</option>
                      <option value="En espera">En sala de espera</option>
                      <option value="En atención">En atención (Sillón)</option>
                      <option value="Completada">Completada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>

                  {/* Patient Info */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={c.paciente_foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                      alt={c.paciente_nombre}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-200 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {c.paciente_nombre}
                      </div>
                      <div className="text-[11px] text-cyan-800 font-semibold font-mono flex items-center gap-1.5">
                        <span>Exp: {c.paciente_expediente}</span>
                        {c.location_nombre && (
                          <span 
                            className="text-[9px] font-black px-1.5 py-0.2 rounded-full inline-flex items-center space-x-1"
                            style={{ 
                              backgroundColor: `${c.location_color || '#8b5cf6'}20`, 
                              color: c.location_color || '#7c3aed' 
                            }}
                          >
                            <Building2 size={9} />
                            <span>{c.location_codigo || c.location_nombre.replace('KoneneKoh ', '')}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {c.paciente_celular && (
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `Hola ${c.paciente_nombre}, le recordamos su cita hoy en KoneneKoh a las ${c.hora_inicio} hrs.`;
                          window.open(`https://wa.me/52${c.paciente_celular}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <Phone size={15} />
                      </button>
                    )}
                  </div>

                  {/* Motivo de la Cita */}
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide text-cyan-900 mb-0.5">
                      Motivo de consulta:
                    </span>
                    <p className="font-medium text-slate-700 leading-snug">{c.motivo}</p>
                  </div>

                  {/* Doctor & Sillón */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <Stethoscope size={13} className="text-cyan-600" />
                      <span>{c.doctor}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-semibold text-slate-600">
                      <MapPin size={13} className="text-teal-600" />
                      <span>{c.sillon}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Agendar Nueva Cita */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <CalendarIcon size={18} />
                </div>
                <h3 className="font-black text-base text-slate-800">Agendar Cita Dental</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Paciente *
                </label>
                <select
                  value={modalPatientId}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    setModalPatientId(pid);
                    const selected = patients.find(p => p.id === pid);
                    if (selected && selected.location_id) {
                      setModalLocationId(selected.location_id);
                    }
                  }}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.expediente}) {p.location_codigo ? `[${p.location_codigo}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Selector */}
              {locations.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center space-x-1.5">
                    <Building2 size={13} className="text-purple-600" />
                    <span>Sucursal / Sede de la Cita *</span>
                  </label>
                  <select
                    value={modalLocationId}
                    onChange={(e) => setModalLocationId(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-purple-300 rounded-xl p-2.5 bg-purple-50/40 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        📍 {loc.nombre} ({loc.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={modalFecha}
                    onChange={(e) => setModalFecha(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={modalHoraInicio}
                    onChange={(e) => setModalHoraInicio(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={modalHoraFin}
                    onChange={(e) => setModalHoraFin(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              {/* Motivo con sugerencias rápidas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Motivo de Consulta / Procedimiento *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Valoración odontopediátrica y sellador de fosetas"
                  value={modalMotivo}
                  onChange={(e) => setModalMotivo(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
                {/* Quick suggestions pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Primera Consulta & Valoración',
                    'Limpieza & Profilaxis',
                    'Restauración con Resina',
                    'Control de Ortodoncia',
                    'Sellador de Fosetas',
                    'Urgencia por Dolor',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setModalMotivo(sug)}
                      className="text-[10px] font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-200 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctor & Sillón */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Doctor(a)
                  </label>
                  <select
                    value={modalDoctor}
                    onChange={(e) => setModalDoctor(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
                  >
                    <option value="Dra. Rebeca Aguilar">Dra. Rebeca Aguilar (Odontopediatría)</option>
                    <option value="Dr. Carlos Ramos">Dr. Carlos Ramos (Ortodoncia)</option>
                    <option value="Dr. Alejandro Gómez">Dr. Alejandro Gómez (Cirugía/Endo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Sillón Clínico
                  </label>
                  <select
                    value={modalSillon}
                    onChange={(e) => setModalSillon(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
                  >
                    <option value="Sillón 1 (Pediatría)">Sillón 1 (Pediatría)</option>
                    <option value="Sillón 2 (Ortodoncia)">Sillón 2 (Ortodoncia)</option>
                    <option value="Sillón 3 (General)">Sillón 3 (General)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Notas Adicionales
                </label>
                <input
                  type="text"
                  placeholder="Recomendaciones para el paciente, ayuno, etc."
                  value={modalNotas}
                  onChange={(e) => setModalNotas(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateConsulta}
                className="px-5 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm"
              >
                Confirmar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
