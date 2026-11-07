import React, { useState, useEffect } from 'react';
import { Consulta, Patient, Location } from '../../types';
import { api } from '../../services/api';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, 
  User, Plus, CheckCircle, AlertCircle, Phone, 
  MapPin, Stethoscope, Filter, Search, X, Check, MessageSquare, Building2,
  Star, Share2, MoreVertical, Award, Sparkles, ExternalLink, ShieldCheck, ArrowRight
} from 'lucide-react';

interface ConsultasModuleProps {
  patients: Patient[];
  selectedPatient?: Patient | null;
  onSelectPatient?: (patientId: number) => void;
  locations?: Location[];
  currentLocationId?: number | 'all';
}

export interface DoctorSpecialist {
  id: string;
  nombre: string;
  especialidad: string;
  ubicacion: string;
  locationId?: number;
  sillon: string;
  tarifa: string;
  rating: number;
  reviewsCount: number;
  disponibilidad: string;
  telefono: string;
  whatsapp: string;
  foto: string;
  bio: string;
  cedula: string;
  universidad: string;
}

export const DOCTORES_CATALOGO: DoctorSpecialist[] = [
  {
    id: 'dra-rebeca',
    nombre: 'Dra. Rebeca Aguilar',
    especialidad: 'Odontopediatría Integral & Ortodoncia Temprana',
    ubicacion: 'Sede Condesa · Sillón 1 (Pediatría)',
    locationId: 1,
    sillon: 'Sillón 1 (Pediatría)',
    tarifa: '$600 - $1,200',
    rating: 5.0,
    reviewsCount: 35,
    disponibilidad: 'Lunes a Sábado · 09:00 - 18:00',
    telefono: '55 5286 1020',
    whatsapp: '5215552861020',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    bio: 'Especialista en odontología infantil, técnicas mínimamente invasivas y manejo conductual pediátrico con enfoque lúdico y sin dolor.',
    cedula: 'CED. PROF. 8745192 · ESP. 491028',
    universidad: 'Universidad Nacional Autónoma de México (UNAM)',
  },
  {
    id: 'dr-carlos',
    nombre: 'Dr. Carlos Ramos',
    especialidad: 'Ortodoncia Avanzada & Alineadores Invisibles',
    ubicacion: 'Sede Insurgentes Sur · Sillón 2',
    locationId: 2,
    sillon: 'Sillón 2 (Ortodoncia)',
    tarifa: '$700 - $1,500',
    rating: 4.9,
    reviewsCount: 28,
    disponibilidad: 'Lunes a Viernes · 10:00 - 19:00',
    telefono: '55 5683 4050',
    whatsapp: '5215556834050',
    foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    bio: 'Especialista certificado en alineadores transparentes de última generación, brackets de autoligado pasivo y biomecánica digital.',
    cedula: 'CED. PROF. 9382014 · ESP. 582103',
    universidad: 'Universidad Tecnológica de México (UNITEC)',
  },
  {
    id: 'dr-alejandro',
    nombre: 'Dr. Alejandro Gómez',
    especialidad: 'Cirugía Maxilofacial & Endodoncia Microscópica',
    ubicacion: 'Sede Santa Fe · Sillón Quirúrgico',
    locationId: 3,
    sillon: 'Sillón Quirúrgico (Quirófano)',
    tarifa: '$900 - $2,500',
    rating: 5.0,
    reviewsCount: 22,
    disponibilidad: 'Martes a Sábado · 09:00 - 17:00',
    telefono: '55 5292 7800',
    whatsapp: '5215552927800',
    foto: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    bio: 'Cirujano maxilofacial con alta especialidad en implantes oseointegrados, rescate dental y microcirugía endodóntica.',
    cedula: 'CED. PROF. 7642190 · ESP. 631024',
    universidad: 'Universidad Autónoma Metropolitana (UAM)',
  },
  {
    id: 'dra-mariana',
    nombre: 'Dra. Mariana Morales',
    especialidad: 'Odontología Estética, Prótesis & Blanqueamiento',
    ubicacion: 'Sede Polanco · Sillón 1',
    locationId: 4,
    sillon: 'Sillón 1 (Estética)',
    tarifa: '$650 - $1,800',
    rating: 4.8,
    reviewsCount: 31,
    disponibilidad: 'Lunes a Viernes · 11:00 - 20:00',
    telefono: '55 5280 9100',
    whatsapp: '5215552809100',
    foto: 'https://images.unsplash.com/photo-1594824813589-399db27c73ff?auto=format&fit=crop&q=80&w=300',
    bio: 'Rehabilitación oral estética, carillas dentales estratificadas, resinas biomiméticas y aclaramiento dental guiado por colorimetría.',
    cedula: 'CED. PROF. 8193021 · ESP. 410294',
    universidad: 'Universidad Intercontinental (UIC)',
  },
];

const TIME_SLOTS_DEFAULT = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

// Helper: Convert "10:00 AM" to "10:00" (24h)
const formatTimeTo24h = (time12: string): string => {
  if (!time12) return '10:00';
  const parts = time12.trim().split(' ');
  if (parts.length < 2) return time12;
  const [time, ampm] = parts;
  let [h, m] = time.split(':').map(Number);
  if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Helper: Calculate starting Monday of week
const getStartOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const ConsultasModule: React.FC<ConsultasModuleProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  locations = [],
  currentLocationId = 'all',
}) => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Default to the modern weekly time-slot scheduler requested by the user
  const [viewMode, setViewMode] = useState<'horarios' | 'calendar' | 'agenda'>('horarios');
  const [locationFilter, setLocationFilter] = useState<number | 'all'>(currentLocationId);

  // Active Doctor for the modern slot view
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('dra-rebeca');
  const [doctorProfileModal, setDoctorProfileModal] = useState<DoctorSpecialist | null>(null);

  // Weekly Date Navigation State
  const [weekStartDate, setWeekStartDate] = useState<Date>(getStartOfWeek(new Date()));
  const [selectedWeeklySlot, setSelectedWeeklySlot] = useState<{
    dateStr: string;
    time12: string;
    dayLabel: string;
  }>({
    dateStr: new Date().toISOString().split('T')[0],
    time12: '10:00 AM',
    dayLabel: 'Hoy',
  });

  // Calendar Date State (selected month & active day for month view)
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

  const activeDoctor = DOCTORES_CATALOGO.find(d => d.id === selectedDoctorId) || DOCTORES_CATALOGO[0];

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

  // Weekly Navigation Handlers
  const handlePrevWeek = () => {
    const nextDate = new Date(weekStartDate);
    nextDate.setDate(nextDate.getDate() - 7);
    setWeekStartDate(nextDate);
  };

  const handleNextWeek = () => {
    const nextDate = new Date(weekStartDate);
    nextDate.setDate(nextDate.getDate() + 7);
    setWeekStartDate(nextDate);
  };

  const handleCurrentWeek = () => {
    setWeekStartDate(getStartOfWeek(new Date()));
  };

  // Monthly Navigation Handlers
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

  // Generate 7 days of the active week
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + index);
    const dateStr = date.toISOString().split('T')[0];
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    
    // Day abbreviations in Spanish
    const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
    const monthNamesShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    const dayLabel = dayNames[index];
    const dayNum = String(date.getDate()).padStart(2, '0');
    const monthLabel = monthNamesShort[date.getMonth()];
    const yearNum = date.getFullYear();

    return {
      date,
      dateStr,
      dayLabel,
      dayNum,
      monthLabel,
      yearNum,
      formattedHeader: `${dayLabel} ${dayNum} ${monthLabel}`,
      isToday,
    };
  });

  // Calculate Month Calendar
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
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

  const activeDayConsultas = consultas.filter(c => c.fecha === selectedDateStr);

  // Quick Open Modal from Selected Weekly Slot
  const openConfirmSlotModal = () => {
    setModalFecha(selectedWeeklySlot.dateStr);
    const time24 = formatTimeTo24h(selectedWeeklySlot.time12);
    setModalHoraInicio(time24);
    
    // Auto calculate +45 min end time
    const [h, m] = time24.split(':').map(Number);
    const endMinutesTotal = h * 60 + m + 45;
    const endH = Math.floor(endMinutesTotal / 60) % 24;
    const endM = endMinutesTotal % 60;
    setModalHoraFin(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    
    setModalDoctor(activeDoctor.nombre);
    setModalSillon(activeDoctor.sillon);
    if (activeDoctor.locationId) {
      setModalLocationId(activeDoctor.locationId);
    }
    setShowNewModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & VIEW MODE CONTROLS */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00b4d8] to-[#2ec4b6] text-white flex items-center justify-center shadow-sm font-black shrink-0">
            <CalendarIcon size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                Agenda de Especialistas & Citas
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 uppercase tracking-wide">
                Smart Scheduler
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              Visualización semanal por doctor, horarios de atención y confirmación en 1-clic
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Location Selector Filter */}
          {locations.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/90 text-xs">
              <Building2 size={14} className="text-purple-600 ml-1.5 shrink-0" />
              <select
                value={locationFilter}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setLocationFilter(val);
                }}
                className="text-xs font-bold bg-transparent text-slate-700 pr-2 py-0.5 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Todas las Sedes ({locations.length})</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    📍 {loc.nombre.replace('KoneneKoh ', '')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Pills (Modern Weekly as Highlight) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('horarios')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                viewMode === 'horarios'
                  ? 'bg-white text-cyan-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-cyan-700'
              }`}
            >
              <Sparkles size={13} className={viewMode === 'horarios' ? 'text-[#00b4d8]' : 'text-slate-400'} />
              <span>Horarios Semanales</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-cyan-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-cyan-700'
              }`}
            >
              Mes Completo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-cyan-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-cyan-700'
              }`}
            >
              Lista Diaria ({activeDayConsultas.length})
            </button>
          </div>

          {/* New Appointment Quick CTA */}
          <button
            type="button"
            onClick={() => {
              setModalFecha(selectedDateStr);
              setShowNewModal(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#0096c7] hover:to-[#023e8a] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 shrink-0"
          >
            <Plus size={15} />
            <span>+ Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODERN WEEKLY TIME-SLOT VIEW (EXACTLY MATCHING USER'S REFERENCE IMAGE) */}
      {/* ========================================================================= */}
      {viewMode === 'horarios' && (
        <div className="space-y-4">
          {/* A. TABLE / LIST OF DOCTORS (With professional uppercase headers) */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Table Header Bar */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100/90 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
              <div className="col-span-4">Doctor / Especialista</div>
              <div className="col-span-2">Ubicación / Sede</div>
              <div className="col-span-2">Disponibilidad</div>
              <div className="col-span-2">Tarifa Consulta</div>
              <div className="col-span-2 text-right pr-4">Valoración</div>
            </div>

            {/* Doctors Rows */}
            <div className="divide-y divide-slate-100">
              {DOCTORES_CATALOGO.map((doc) => {
                const isSelected = doc.id === selectedDoctorId;
                
                return (
                  <div key={doc.id} className="transition-all">
                    {/* Collapsed Doctor Row (when not active) */}
                    {!isSelected ? (
                      <div 
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className="p-4 sm:px-6 sm:py-3.5 flex flex-wrap md:grid md:grid-cols-12 gap-3 items-center hover:bg-cyan-50/40 cursor-pointer transition-colors"
                      >
                        {/* Doctor info */}
                        <div className="col-span-4 flex items-center space-x-3 min-w-0">
                          <img
                            src={doc.foto}
                            alt={doc.nombre}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate">
                              {doc.nombre}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate">
                              {doc.especialidad}
                            </p>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="col-span-2 text-xs font-semibold text-slate-600 truncate flex items-center space-x-1">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{doc.ubicacion.split('·')[0]}</span>
                        </div>

                        {/* Availability */}
                        <div className="col-span-2 text-xs text-slate-600 truncate flex items-center space-x-1">
                          <Clock size={12} className="text-cyan-600 shrink-0" />
                          <span className="truncate">{doc.disponibilidad.split('·')[0]}</span>
                        </div>

                        {/* Price */}
                        <div className="col-span-2 text-xs font-bold text-slate-700">
                          {doc.tarifa} MXN
                        </div>

                        {/* Rating & Action */}
                        <div className="col-span-2 flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto">
                          <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span>{doc.rating}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDoctorProfileModal(doc);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-cyan-700 border border-slate-200 rounded-lg hover:bg-white"
                          >
                            Ver Perfil
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDoctorId(doc.id)}
                            className="px-3 py-1 bg-cyan-50 hover:bg-[#00b4d8] text-cyan-700 hover:text-white border border-cyan-200 text-xs font-bold rounded-lg transition-colors"
                          >
                            Agendar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Expanded Doctor Card (Active, exactly like the image) */
                      <div className="p-4 sm:p-6 bg-gradient-to-b from-white via-cyan-50/20 to-white">
                        {/* Upper card info */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                          {/* Doctor Identity with Circular Actions */}
                          <div className="flex items-center space-x-4 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={doc.foto}
                                alt={doc.nombre}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-[#00b4d8]/20 shadow-md"
                              />
                              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-base sm:text-xl font-black text-slate-900 leading-tight">
                                {doc.nombre}
                              </h3>
                              <p className="text-xs sm:text-sm font-bold text-cyan-800 mt-0.5">
                                {doc.especialidad}
                              </p>

                              {/* Star rating & Location */}
                              <div className="flex items-center space-x-3 mt-1.5 flex-wrap gap-y-1">
                                <div className="flex items-center space-x-1 text-amber-500 font-black text-xs">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                                    ))}
                                  </div>
                                  <span className="text-slate-700 ml-1 font-bold">
                                    {doc.reviewsCount} opiniones
                                  </span>
                                </div>

                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <MapPin size={12} className="text-slate-400" />
                                  <span>{doc.ubicacion}</span>
                                </div>
                              </div>

                              {/* 3 Circular Action Buttons (Call, WhatsApp, Map) */}
                              <div className="flex items-center space-x-2 mt-3">
                                {/* Green Phone Circle */}
                                <a
                                  href={`tel:${doc.telefono.replace(/\s+/g, '')}`}
                                  className="w-8 h-8 rounded-full bg-[#10b981] hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110"
                                  title={`Llamar a ${doc.nombre} (${doc.telefono})`}
                                >
                                  <Phone size={14} />
                                </a>

                                {/* Sky Blue WhatsApp Circle */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const msg = `Hola ${doc.nombre}, te contacto desde KoneneKoh Dental Cloud para consultar horarios disponibles.`;
                                    window.open(`https://wa.me/${doc.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#00b4d8] hover:bg-[#0096c7] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110"
                                  title={`Enviar mensaje de WhatsApp a ${doc.nombre}`}
                                >
                                  <MessageSquare size={14} />
                                </button>

                                {/* Slate Location Pin Circle */}
                                <button
                                  type="button"
                                  onClick={() => alert(`Ubicación clínica: ${doc.ubicacion}\nHorario de atención: ${doc.disponibilidad}`)}
                                  className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-800 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110"
                                  title="Ver detalles de sillón y ubicación"
                                >
                                  <MapPin size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Right Buttons: View Profile & Book CTA */}
                          <div className="flex items-center space-x-2.5">
                            <button
                              type="button"
                              onClick={() => setDoctorProfileModal(doc)}
                              className="px-4 py-2 border border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-cyan-800 font-bold text-xs rounded-xl hover:bg-white transition-all shadow-2xs"
                            >
                              Ver Perfil
                            </button>

                            <button
                              type="button"
                              onClick={openConfirmSlotModal}
                              className="px-5 py-2.5 bg-[#00b4d8] hover:bg-[#0096c7] text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center space-x-1.5"
                            >
                              <CalendarIcon size={14} />
                              <span>Agendar Cita</span>
                            </button>
                          </div>
                        </div>

                        {/* ============================================================ */}
                        {/* B. WEEKLY TIME-SLOT MATRIX (Matching User Reference Image) */}
                        {/* ============================================================ */}
                        <div className="mt-5 space-y-4">
                          {/* Schedule Section Title & Date Picker Icon */}
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-black text-slate-800 capitalize">
                                {new Date(selectedWeeklySlot.dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </h4>
                              <p className="text-[11px] font-semibold text-slate-400 capitalize">
                                {new Date(selectedWeeklySlot.dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
                                  weekday: 'long',
                                })}
                              </p>
                            </div>

                            {/* Mini Date Picker & Week Jumper */}
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={handleCurrentWeek}
                                className="px-2.5 py-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 transition-colors"
                              >
                                Semana Actual
                              </button>

                              <label className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-200 flex items-center justify-center" title="Seleccionar fecha específica">
                                <CalendarIcon size={16} />
                                <input
                                  type="date"
                                  className="sr-only"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const picked = new Date(e.target.value + 'T00:00:00');
                                      setWeekStartDate(getStartOfWeek(picked));
                                      setSelectedWeeklySlot({
                                        dateStr: e.target.value,
                                        time12: selectedWeeklySlot.time12,
                                        dayLabel: 'Elegido',
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Horizontal 7-Day Navigation Strip */}
                          <div className="flex items-center gap-1.5">
                            {/* Prev Week Button */}
                            <button
                              type="button"
                              onClick={handlePrevWeek}
                              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shrink-0"
                              title="Semana anterior"
                            >
                              <ChevronLeft size={18} />
                            </button>

                            {/* 7 Columns Container (Responsive horizontal scroll on small devices) */}
                            <div className="flex-1 overflow-x-auto scrollbar-none">
                              <div className="grid grid-cols-7 gap-2 min-w-[580px]">
                                {weekDays.map((day) => {
                                  const isDayActive = day.dateStr === selectedWeeklySlot.dateStr;
                                  return (
                                    <div
                                      key={day.dateStr}
                                      onClick={() => {
                                        setSelectedWeeklySlot({
                                          ...selectedWeeklySlot,
                                          dateStr: day.dateStr,
                                          dayLabel: day.dayLabel,
                                        });
                                      }}
                                      className={`text-center py-2 px-1 rounded-xl cursor-pointer transition-all border ${
                                        isDayActive
                                          ? 'bg-cyan-50/80 border-[#00b4d8] ring-1 ring-[#00b4d8]'
                                          : day.isToday
                                          ? 'bg-amber-50/40 border-amber-300'
                                          : 'bg-white hover:bg-slate-50 border-slate-200'
                                      }`}
                                    >
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        {day.dayLabel}
                                      </div>
                                      <div className={`text-xs font-black mt-0.5 ${
                                        isDayActive ? 'text-[#0077b6]' : 'text-slate-800'
                                      }`}>
                                        {day.dayNum} {day.monthLabel}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Next Week Button */}
                            <button
                              type="button"
                              onClick={handleNextWeek}
                              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shrink-0"
                              title="Semana siguiente"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>

                          {/* Time Slots Grid (7 columns corresponding to the 7 days) */}
                          <div className="overflow-x-auto scrollbar-none pb-2">
                            <div className="grid grid-cols-7 gap-2 min-w-[580px] pl-8 pr-8">
                              {weekDays.map((day) => {
                                return (
                                  <div key={`slots-${day.dateStr}`} className="space-y-2">
                                    {TIME_SLOTS_DEFAULT.map((time12) => {
                                      const time24 = formatTimeTo24h(time12);
                                      const isSelectedSlot = 
                                        selectedWeeklySlot.dateStr === day.dateStr && 
                                        selectedWeeklySlot.time12 === time12;

                                      // Check if there is an existing appointment in this slot
                                      const existingCita = consultas.find(
                                        c => c.fecha === day.dateStr && c.hora_inicio === time24
                                      );

                                      if (existingCita) {
                                        return (
                                          <div
                                            key={time12}
                                            onClick={() => {
                                              setSelectedDateStr(day.dateStr);
                                              setViewMode('agenda');
                                            }}
                                            className="w-full py-2 px-1 rounded-xl text-center text-[10px] font-black bg-amber-100/80 hover:bg-amber-200 border border-amber-300 text-amber-900 cursor-pointer shadow-2xs transition-transform hover:scale-[1.02]"
                                            title={`Ocupado: ${existingCita.paciente_nombre} (${existingCita.motivo})`}
                                          >
                                            <div className="truncate">{time12}</div>
                                            <div className="text-[9px] font-semibold truncate opacity-80">
                                              {existingCita.paciente_nombre?.split(' ')[0]}
                                            </div>
                                          </div>
                                        );
                                      }

                                      return (
                                        <button
                                          key={time12}
                                          type="button"
                                          onClick={() => {
                                            setSelectedWeeklySlot({
                                              dateStr: day.dateStr,
                                              time12,
                                              dayLabel: day.dayLabel,
                                            });
                                          }}
                                          className={`w-full py-2.5 px-1 rounded-xl text-center text-xs transition-all ${
                                            isSelectedSlot
                                              ? 'bg-[#00b4d8] text-white font-black shadow-md ring-2 ring-[#00b4d8]/40 scale-105'
                                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold hover:shadow-2xs'
                                          }`}
                                        >
                                          {time12}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Bottom Action CTA Bar (With Mint Green Proceed Button) */}
                          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-2xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#00b4d8]">
                                <Clock size={20} />
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                  Cita Seleccionada
                                </span>
                                <p className="text-xs sm:text-sm font-black text-slate-800">
                                  {new Date(selectedWeeklySlot.dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                  })} a las <span className="text-[#0077b6] underline">{selectedWeeklySlot.time12}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 font-semibold">
                                  Con {doc.nombre} · {doc.ubicacion}
                                </p>
                              </div>
                            </div>

                            {/* Mint Green Proceed CTA Button */}
                            <button
                              type="button"
                              onClick={openConfirmSlotModal}
                              className="px-6 sm:px-8 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center space-x-2 shrink-0"
                            >
                              <span>Confirmar y Agendar Cita</span>
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRADITIONAL MONTH CALENDAR VIEW (Retained for complete versatility)   */}
      {/* ========================================================================= */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar Grid Section */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xs border border-slate-200 p-5 space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <h3 className="text-base md:text-lg font-black text-slate-800 capitalize">
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
          <div className="lg:col-span-4 bg-white rounded-3xl shadow-xs border border-slate-200 p-5 space-y-4">
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
                    className="bg-slate-50/80 hover:bg-cyan-50/40 p-3.5 rounded-2xl border border-slate-200 hover:border-cyan-300 transition-all space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-mono text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <Clock size={13} className="text-cyan-600" />
                        <span>{c.hora_inicio} - {c.hora_fin}</span>
                      </div>

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
                            const msg = `Hola ${c.paciente_nombre}, le recordamos su cita hoy en KoneneKoh Dental a las ${c.hora_inicio} hrs.`;
                            window.open(`https://wa.me/52${c.paciente_celular}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"
                          title="Enviar recordatorio por WhatsApp"
                        >
                          <Phone size={15} />
                        </button>
                      )}
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide text-cyan-900 mb-0.5">
                        Motivo de consulta:
                      </span>
                      <p className="font-medium text-slate-700 leading-snug">{c.motivo}</p>
                    </div>

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
      )}

      {/* ========================================================================= */}
      {/* 4. DAILY AGENDA LIST VIEW                                                 */}
      {/* ========================================================================= */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700">
                Lista de Citas
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Todas las Citas ({consultas.length} en total)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalFecha(new Date().toISOString().split('T')[0]);
                setShowNewModal(true);
              }}
              className="px-4 py-2 bg-[#00b4d8] hover:bg-[#0096c7] text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
            >
              <Plus size={15} />
              <span>+ Nueva Cita</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Fecha & Hora</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Especialista</th>
                  <th className="py-3 px-4">Sede / Sillón</th>
                  <th className="py-3 px-4">Procedimiento</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consultas.map((c) => (
                  <tr key={c.id} className="hover:bg-cyan-50/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                      <div>{c.fecha}</div>
                      <div className="text-[11px] text-cyan-700">{c.hora_inicio} - {c.hora_fin}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={c.paciente_foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                          alt={c.paciente_nombre}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-cyan-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 truncate">{c.paciente_nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Exp: {c.paciente_expediente}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {c.doctor}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{c.location_nombre || 'Sede Central'}</div>
                      <div className="text-[10px] text-slate-400">{c.sillon}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {c.motivo}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={c.estado}
                        onChange={(e) => handleStatusChange(c.id, e.target.value as any)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                          c.estado === 'En atención'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : c.estado === 'En espera'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : c.estado === 'Completada'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                        }`}
                      >
                        <option value="Programada">Programada</option>
                        <option value="En espera">En espera</option>
                        <option value="En atención">En atención</option>
                        <option value="Completada">Completada</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.paciente_celular && (
                        <button
                          type="button"
                          onClick={() => {
                            const msg = `Hola ${c.paciente_nombre}, le confirmamos su cita en KoneneKoh Dental el ${c.fecha} a las ${c.hora_inicio}.`;
                            window.open(`https://wa.me/52${c.paciente_celular}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: PERFIL COMPLETO DEL ESPECIALISTA                                */}
      {/* ========================================================================= */}
      {doctorProfileModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck size={20} className="text-cyan-600" />
                <h3 className="font-black text-base text-slate-800">Perfil Profesional Médico</h3>
              </div>
              <button
                type="button"
                onClick={() => setDoctorProfileModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <img
                src={doctorProfileModal.foto}
                alt={doctorProfileModal.nombre}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-[#00b4d8]/20 shadow-md shrink-0"
              />
              <div>
                <h4 className="text-lg font-black text-slate-900">{doctorProfileModal.nombre}</h4>
                <p className="text-xs font-bold text-[#0077b6]">{doctorProfileModal.especialidad}</p>
                <div className="flex items-center space-x-1 text-amber-500 font-bold text-xs mt-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{doctorProfileModal.rating} ({doctorProfileModal.reviewsCount} reseñas)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Cédula Profesional:</span>
                <span className="font-mono font-bold text-slate-800">{doctorProfileModal.cedula}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Universidad / Alma Mater:</span>
                <span className="font-semibold text-slate-800">{doctorProfileModal.universidad}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Horario Habitual:</span>
                <span className="font-semibold text-slate-800">{doctorProfileModal.disponibilidad}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Rango de Tarifa:</span>
                <span className="font-bold text-emerald-700">{doctorProfileModal.tarifa} MXN</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800 block mb-1">Semblanza Clínica:</span>
              <p>{doctorProfileModal.bio}</p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDoctorProfileModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDoctorId(doctorProfileModal.id);
                  setDoctorProfileModal(null);
                  openConfirmSlotModal();
                }}
                className="px-5 py-2 text-xs font-bold bg-[#00b4d8] hover:bg-[#0096c7] text-white rounded-xl shadow-xs"
              >
                Agendar con este Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: AGENDAR / CONFIRMAR NUEVA CITA                                  */}
      {/* ========================================================================= */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <CalendarIcon size={18} />
                </div>
                <h3 className="font-black text-base text-slate-800">Confirmar Cita Dental</h3>
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
                    {DOCTORES_CATALOGO.map(d => (
                      <option key={d.id} value={d.nombre}>
                        {d.nombre} ({d.especialidad.split('&')[0].trim()})
                      </option>
                    ))}
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
                    <option value="Sillón Quirúrgico (Quirófano)">Sillón Quirúrgico (Quirófano)</option>
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
                className="px-6 py-2.5 text-xs font-black bg-[#10b981] hover:bg-[#059669] text-white rounded-xl shadow-md transition-all active:scale-95"
              >
                Confirmar y Agendar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
