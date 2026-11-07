import React, { useState, useEffect } from 'react';
import { Patient, Tratamiento, Location, ClinicaConfig, LicenciaStatus } from './types';
import { api } from './services/api';
import { GeneralesModule } from './components/Pacientes/GeneralesModule';
import { AntecedentesModule } from './components/Antecedentes/AntecedentesModule';
import { PresupuestosModule } from './components/Presupuestos/PresupuestosModule';
import { PagosModule } from './components/Pagos/PagosModule';
import { InventarioModule } from './components/Productos/InventarioModule';
import { TratamientosModule } from './components/Tratamientos/TratamientosModule';
import { ConsultasModule } from './components/Consultas/ConsultasModule';
import { DashboardModule } from './components/Dashboard/DashboardModule';
import { RecetasModule } from './components/Recetas/RecetasModule';
import { ConfiguracionClinicaModal } from './components/Administracion/ConfiguracionClinicaModal';
import { SucursalesAdminModal } from './components/Administracion/SucursalesAdminModal';
import { LicenciaAdminModal } from './components/Licencia/LicenciaAdminModal';
import { ReadOnlyBanner } from './components/Licencia/ReadOnlyBanner';
import {
  Search, Plus, UserPlus, Users, User, Calendar, Clipboard,
  Wallet, Banknote, MessageSquare, ShoppingBag, Info, Award,
  Package, Stethoscope, LogOut, Check, Trash2, X, Menu,
  ChevronLeft, ChevronDown, Sparkles, Phone, ShieldCheck, Building2, LayoutDashboard, Globe,
  Settings, Pill, Store, Lock, Key, CreditCard, ShieldAlert, Mail
} from 'lucide-react';

export function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationFilter, setActiveLocationFilter] = useState<number | 'all'>('all');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [patientFilterType, setPatientFilterType] = useState<'all' | 'minors' | 'adults'>('all');
  const [licenciaStatus, setLicenciaStatus] = useState<LicenciaStatus>({
    hasLicense: true,
    valid: true,
    expired: false,
    isReadOnly: false,
    daysRemaining: 365,
    tipo: 'ANUAL',
    titular: 'KoneneKoh Smile Maker',
    codigo: 'KK-2026-PRO',
    auto_renovacion: 1
  });
  const [clinicaConfig, setClinicaConfig] = useState<ClinicaConfig>({
    nombre_comercial: 'KoneneKoh Smile Maker',
    eslogan: 'Odontopediatría & Ortodoncia Especializada',
    logotipo_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=250',
    direccion: 'Av. Candiles 512, Col. Candiles, Corregidora, Qro. C.P. 76903',
    telefono: '442 237 1299',
    whatsapp: '442 237 1299',
    email: 'contacto@konenekoh.com',
    responsable_sanitario: 'Dra. Rebeca Aguilar Ramos',
    cedula_profesional: 'Céd. Prof. 8472910 UNAM',
    color_primario: '#06b6d4',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active navigation section
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'generales' | 'consultas' | 'antecedentes' | 'presupuestos' | 'recetas' | 'pagos' | 'notas' | 'compras'
  >('dashboard');

  // Mobile navigation state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Modals
  const [showInventarioModal, setShowInventarioModal] = useState<boolean>(false);
  const [showTratamientosModal, setShowTratamientosModal] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState<boolean>(false);
  const [showParentsModal, setShowParentsModal] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showSucursalesModal, setShowSucursalesModal] = useState<boolean>(false);
  const [showLicenciaModal, setShowLicenciaModal] = useState<boolean>(false);

  // New patient form
  const [newNombre, setNewNombre] = useState<string>('');
  const [newExpediente, setNewExpediente] = useState<string>('');
  const [newFechaNac, setNewFechaNac] = useState<string>('');
  const [newTelefono, setNewTelefono] = useState<string>('');
  const [newTutor, setNewTutor] = useState<string>('');
  const [newLocationId, setNewLocationId] = useState<number>(1);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async (locFilter: number | 'all' = activeLocationFilter) => {
    try {
      setLoading(true);
      const [patientsData, tratData, locationsData, configData, licData] = await Promise.all([
        api.getPatients(undefined, locFilter !== 'all' ? locFilter : undefined),
        api.getTratamientos(),
        api.getLocations(),
        api.getClinicaConfig().catch(() => null),
        api.getLicenciaStatus().catch(() => null),
      ]);
      setPatients(patientsData);
      setTratamientos(tratData);
      setLocations(locationsData);
      if (configData) {
        setClinicaConfig(configData);
      }
      if (licData) {
        setLicenciaStatus(licData);
      }
      if (locationsData.length > 0 && !newLocationId) {
        setNewLocationId(locationsData[0].id);
      }
      if (patientsData.length > 0 && (!selectedPatientId || !patientsData.some(p => p.id === selectedPatientId))) {
        setSelectedPatientId(patientsData[0].id);
      }
    } catch (err) {
      console.error('Error al inicializar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = async (newLoc: number | 'all') => {
    setActiveLocationFilter(newLoc);
    try {
      setLoading(true);
      const filtered = await api.getPatients(searchQuery || undefined, newLoc !== 'all' ? newLoc : undefined);
      setPatients(filtered);
      if (filtered.length > 0 && (!selectedPatientId || !filtered.some(p => p.id === selectedPatientId))) {
        setSelectedPatientId(filtered[0].id);
      }
    } catch (err) {
      console.error('Error al filtrar pacientes por ubicación:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchQuery(term);
    try {
      const filtered = await api.getPatients(term, activeLocationFilter !== 'all' ? activeLocationFilter : undefined);
      setPatients(filtered);
      if (filtered.length > 0 && (!selectedPatientId || !filtered.some(p => p.id === selectedPatientId))) {
        setSelectedPatientId(filtered[0].id);
      }
    } catch (err) {
      console.error('Error buscando pacientes:', err);
    }
  };

  const isMinorPatient = (birthDateStr?: string): boolean => {
    if (!birthDateStr) return false;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a < 18;
  };

  const calculatePatientAge = (birthDateStr?: string): number => {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a > 0 ? a : 0;
  };

  const displayedPatients = patients.filter((p) => {
    if (patientFilterType === 'minors' && !isMinorPatient(p.fecha_nacimiento)) return false;
    if (patientFilterType === 'adults' && isMinorPatient(p.fecha_nacimiento)) return false;
    return true;
  });

  const handleCreatePatient = async () => {
    if (licenciaStatus.isReadOnly) {
      alert('Tu licencia ha expirado o el sistema se encuentra en Modo Consulta (Solo Lectura). Puedes revisar y exportar expedientes, pero para registrar nuevos pacientes se requiere renovar tu suscripción.');
      setShowLicenciaModal(true);
      return;
    }
    if (!newNombre) {
      alert('Ingresa el nombre del paciente');
      return;
    }
    try {
      const created = await api.createPatient({
        nombre: newNombre,
        expediente: newExpediente || `PD${Math.floor(180 + Math.random() * 50)}`,
        fecha_nacimiento: newFechaNac,
        telefono: newTelefono,
        celular: newTelefono,
        padre_tutor: newTutor,
        location_id: newLocationId,
        activo: 1,
      });
      setShowNewPatientModal(false);
      setNewNombre('');
      setNewExpediente('');
      setNewFechaNac('');
      setNewTelefono('');
      setNewTutor('');
      await loadInitialData();
      setSelectedPatientId(created.id);
      setMobileView('detail');
    } catch (err) {
      console.error('Error al crear paciente:', err);
    }
  };

  const handleDeletePatient = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Deseas eliminar este paciente y todos sus expedientes?')) return;
    try {
      await api.deletePatient(id);
      const updated = patients.filter(p => p.id !== id);
      setPatients(updated);
      if (selectedPatientId === id && updated.length > 0) {
        setSelectedPatientId(updated[0].id);
      }
    } catch (err) {
      console.error('Error al eliminar paciente:', err);
    }
  };

  const handleSaveClinicaConfig = async (newConfig: ClinicaConfig) => {
    const updated = await api.updateClinicaConfig(newConfig);
    setClinicaConfig(updated);
  };

  const handleLocationsUpdated = async () => {
    await loadInitialData(activeLocationFilter);
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="min-h-screen flex flex-col bg-[#eef7f9] text-slate-800">
      {/* 0. READ-ONLY ALERT BANNER (If License is Expired) */}
      <ReadOnlyBanner
        status={licenciaStatus}
        onOpenLicenseModal={() => setShowLicenciaModal(true)}
        onExportData={async () => {
          await api.exportFullData();
        }}
      />

      {/* 1. TOP HEADER (Responsive, Clean & Uncluttered) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-cyan-100 shadow-2xs px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-40">
        {/* Left: Mobile menu button & Brand (With guaranteed responsive truncation) */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-600 hover:text-cyan-800 rounded-xl hover:bg-cyan-50"
            title="Abrir menú"
          >
            <Menu size={22} />
          </button>

          <div
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
            onClick={() => setActiveSection('dashboard')}
            title="Ir al Dashboard Principal"
          >
            {clinicaConfig.logotipo_url ? (
              <img
                src={clinicaConfig.logotipo_url}
                alt={clinicaConfig.nombre_comercial}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-contain bg-white p-1 border border-cyan-200 shadow-2xs group-hover:scale-105 transition-transform shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#00b4d8] to-[#2ec4b6] flex items-center justify-center text-white shadow-2xs font-black text-lg sm:text-xl group-hover:scale-105 transition-transform shrink-0">
                🪐
              </div>
            )}
            <div className="hidden xs:block min-w-0 max-w-[120px] sm:max-w-[170px] md:max-w-[240px]">
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-[#0f4c5c] leading-tight truncate">
                {clinicaConfig.nombre_comercial}
              </h1>
              <p className="text-[10px] md:text-[11px] font-bold text-[#2ec4b6] tracking-wider uppercase truncate">
                {clinicaConfig.eslogan || 'Smile Maker'}
              </p>
            </div>
          </div>
        </div>

        {/* Center-Left: Location Selector Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 rounded-2xl px-2.5 py-1.5 shadow-2xs transition-colors shrink-0 max-w-[140px] md:max-w-[190px]">
          <Building2 size={15} className="text-purple-600 shrink-0" />
          <select
            value={activeLocationFilter}
            onChange={(e) => {
              const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
              handleLocationChange(val);
            }}
            className="bg-transparent text-xs font-bold text-slate-700 cursor-pointer focus:outline-none pr-1 truncate w-full"
            title="Seleccionar Sede o Red Completa"
          >
            <option value="all">🌐 Red Completa ({locations.length} Sedes)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                📍 {loc.nombre.replace('KoneneKoh ', '')}
              </option>
            ))}
          </select>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 min-w-[110px] max-w-xs sm:max-w-md mx-1 sm:mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-cyan-600" size={15} />
            <input
              type="text"
              placeholder="Buscar paciente por nombre o folio..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#f0f9fa] hover:bg-white focus:bg-white border border-cyan-200 rounded-full text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2ec4b6] transition-all shadow-2xs truncate"
            />
          </div>
        </div>

        {/* Right: Primary Action [+ Paciente] & User Profile Avatar Dropdown */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0 relative">
          {/* Read-Only mode alert badge (if expired) */}
          {licenciaStatus.isReadOnly && (
            <button
              type="button"
              onClick={() => setShowLicenciaModal(true)}
              className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs font-black flex items-center space-x-1 animate-pulse shrink-0"
              title="Modo Consulta Activo. Haz clic para renovar licencia."
            >
              <Lock size={12} className="text-rose-600 shrink-0" />
              <span className="hidden sm:inline">Modo Consulta</span>
            </button>
          )}

          {/* Primary Quick Action Button: [+ Paciente] */}
          <button
            type="button"
            onClick={() => {
              if (licenciaStatus.isReadOnly) {
                setShowLicenciaModal(true);
              } else {
                setShowNewPatientModal(true);
              }
            }}
            className={`px-3 sm:px-4 py-2 text-xs font-black rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 shrink-0 ${
              licenciaStatus.isReadOnly
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'bg-gradient-to-r from-[#0077b6] to-[#0096c7] hover:from-[#023e8a] hover:to-[#0077b6] text-white shadow-cyan-900/10'
            }`}
            title={licenciaStatus.isReadOnly ? 'Requiere licencia activa para crear pacientes' : 'Registrar nuevo paciente'}
          >
            {licenciaStatus.isReadOnly ? <Lock size={14} className="text-amber-600" /> : <UserPlus size={15} />}
            <span className="hidden xs:inline">+ Paciente</span>
            <span className="xs:hidden">+</span>
          </button>

          {/* User Profile Avatar with Floating Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left shrink-0"
              title="Perfil de Usuario y Configuración"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0f4c5c] to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-2xs shrink-0">
                DR
              </div>
              <div className="hidden xl:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">Dr. Aguilar</span>
                <span className="block text-[10px] text-teal-600 font-semibold">
                  {licenciaStatus.isReadOnly ? '🔒 Licencia Vencida' : '⚡ Licencia Activa'}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block shrink-0" />
            </button>

            {/* Floating Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 animate-in fade-in slide-in-from-top-2 text-xs">
                  {/* User info header */}
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="font-bold text-slate-800">Dr. Roberto Aguilar</p>
                    <p className="text-[11px] text-slate-500">raguilar@konenekoh.com</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">Suscripción:</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        licenciaStatus.isReadOnly ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {licenciaStatus.isReadOnly ? 'Solo Consulta' : `${licenciaStatus.tipo} (${licenciaStatus.daysRemaining} días)`}
                      </span>
                    </div>
                  </div>

                  {/* Settings & Admin Links */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfigModal(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 flex items-center space-x-2.5 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 transition-colors text-left"
                    >
                      <Settings size={15} className="text-cyan-600" />
                      <span>Personalizar Clínica & Marca</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowLicenciaModal(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 flex items-center space-x-2.5 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 transition-colors text-left"
                    >
                      <Award size={15} className="text-amber-500" />
                      <span>Licencia & Facturación</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSucursalesModal(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 flex items-center space-x-2.5 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 transition-colors text-left"
                    >
                      <Building2 size={15} className="text-purple-600" />
                      <span>Sucursales & Sedes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowInfoModal(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 flex items-center space-x-2.5 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 transition-colors text-left"
                    >
                      <Info size={15} className="text-cyan-600" />
                      <span>Acerca del Sistema (v{licenciaStatus.version_instalada || '2.5.0'})</span>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        alert('Sesión de usuario cerrada en KoneneKoh Dental Cloud');
                      }}
                      className="w-full px-4 py-2 flex items-center space-x-2.5 text-rose-600 hover:bg-rose-50 transition-colors text-left font-bold"
                    >
                      <LogOut size={15} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKSPACE (Responsive) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Column: Navigation Sidebar (Desktop & Collapsible Mobile) */}
        <aside className={`
          ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl block' : 'hidden md:flex'}
          w-full md:w-56 lg:w-60 bg-white border-r border-cyan-100 flex-col p-3 space-y-4 shrink-0
          md:h-[calc(100vh-61px)] overflow-y-auto pb-24 scrollbar-thin
        `}>
          {mobileMenuOpen && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 md:hidden">
              <span className="font-black text-sm text-[#0f4c5c]">Menú de Navegación</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                <X size={20} />
              </button>
            </div>
          )}

          {/* 1. OPERACIÓN CLÍNICA */}
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 px-2.5">
              Operación Clínica
            </h3>

            <button
              type="button"
              onClick={() => {
                setActiveSection('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold rounded-xl transition-all text-left ${
                activeSection === 'dashboard'
                  ? 'bg-gradient-to-r from-[#0f4c5c] to-teal-800 text-white shadow-xs ring-1 ring-teal-500'
                  : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-800'
              }`}
            >
              <LayoutDashboard size={15} className={activeSection === 'dashboard' ? 'text-cyan-300' : 'text-teal-700'} />
              <span>Dashboard General</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('consultas');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all text-left ${
                activeSection === 'consultas'
                  ? 'bg-[#2ec4b6] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Calendar size={15} className={activeSection === 'consultas' ? 'text-white' : 'text-teal-600'} />
                <span>Calendario & Citas</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-current">
                Hoy
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeSection === 'dashboard' || activeSection === 'consultas') {
                  setActiveSection('presupuestos');
                }
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all text-left ${
                activeSection !== 'dashboard' && activeSection !== 'consultas'
                  ? 'bg-gradient-to-r from-[#0077b6] to-[#0096c7] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users size={15} className={activeSection !== 'dashboard' && activeSection !== 'consultas' ? 'text-white' : 'text-cyan-700'} />
                <span>Pacientes & Expedientes</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeSection !== 'dashboard' && activeSection !== 'consultas'
                  ? 'bg-white/25 text-white'
                  : 'bg-cyan-100 text-cyan-800'
              }`}>
                {patients.length}
              </span>
            </button>
          </div>

          {/* 2. ALMACÉN & CATÁLOGOS */}
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 px-2.5">
              Almacén & Catálogos
            </h3>

            <button
              type="button"
              onClick={() => {
                setShowInventarioModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold rounded-xl text-cyan-900 bg-cyan-50/70 hover:bg-cyan-100 transition-all text-left border border-cyan-200/60"
            >
              <Package size={15} className="text-cyan-700" />
              <span>Inventarios Pro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTratamientosModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 transition-all text-left"
            >
              <Stethoscope size={15} className="text-cyan-600" />
              <span>Tratamientos & Precios</span>
            </button>
          </div>

          {/* 4. CONFIGURACIÓN & LICENCIAS (Al pie del Sidebar) */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 px-2.5">
              Administración
            </h3>

            <button
              type="button"
              onClick={() => {
                setShowSucursalesModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold rounded-xl text-purple-900 bg-purple-50/80 hover:bg-purple-100 transition-all text-left border border-purple-200/70"
            >
              <Building2 size={15} className="text-purple-700" />
              <span>Sucursales & Sedes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowConfigModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold rounded-xl text-teal-900 bg-teal-50/80 hover:bg-teal-100 transition-all text-left border border-teal-200/70"
            >
              <Settings size={15} className="text-teal-700" />
              <span>Personalizar Marca</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowLicenciaModal(true);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all text-left border shadow-2xs ${
                licenciaStatus.isReadOnly
                  ? 'text-rose-900 bg-rose-50/90 border-rose-300'
                  : 'text-amber-900 bg-amber-50/80 hover:bg-amber-100 border-amber-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Award size={15} className={licenciaStatus.isReadOnly ? 'text-rose-600 animate-pulse' : 'text-amber-600'} />
                <span>Licencia</span>
              </div>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                licenciaStatus.isReadOnly ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {licenciaStatus.isReadOnly ? 'Consulta' : 'Activa'}
              </span>
            </button>
          </div>
        </aside>

        {/* Middle Column: Patient List (Responsive: hide on mobile if viewing detail) */}
        {activeSection !== 'consultas' && activeSection !== 'dashboard' && (
          <div className={`
            ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}
            w-full md:w-64 lg:w-72 xl:w-80 bg-[#f8fafc] border-r border-slate-200 flex-col p-3 shrink-0
            md:h-[calc(100vh-61px)] overflow-hidden
          `}>
            {/* Top Patient List Header with Category Filter */}
            <div className="pb-3 mb-2 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                    Expedientes Clínicos
                  </span>
                  {activeLocationFilter !== 'all' && (
                    <span className="text-[10px] font-bold text-purple-700">
                      📍 {locations.find(l => l.id === activeLocationFilter)?.nombre.replace('KoneneKoh ', '')}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-black text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                  {displayedPatients.length} pacientes
                </span>
              </div>

              {/* Quick Category Filter Pills */}
              <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPatientFilterType('all')}
                  className={`py-1 rounded-lg transition-all ${
                    patientFilterType === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({patients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPatientFilterType('minors')}
                  className={`py-1 rounded-lg transition-all ${
                    patientFilterType === 'minors'
                      ? 'bg-white text-amber-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👶 Menores
                </button>
                <button
                  type="button"
                  onClick={() => setPatientFilterType('adults')}
                  className={`py-1 rounded-lg transition-all ${
                    patientFilterType === 'adults'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Adultos
                </button>
              </div>
            </div>

            {/* Patient Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-20 scrollbar-thin">
              {loading ? (
                <div className="text-center py-8 text-xs text-slate-400">Cargando pacientes...</div>
              ) : displayedPatients.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No se encontraron pacientes.</div>
              ) : (
                displayedPatients.map((p) => {
                  const isSelected = p.id === selectedPatientId;
                  const isMinor = isMinorPatient(p.fecha_nacimiento);
                  const patientAge = calculatePatientAge(p.fecha_nacimiento);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setMobileView('detail');
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-white border-[#00b4d8] ring-2 ring-[#00b4d8]/30 shadow-sm scale-[1.01]'
                          : 'bg-white/90 border-slate-200 hover:bg-white hover:border-cyan-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={p.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                            alt={p.nombre}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs"
                          />
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            p.activo === 1 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate group-hover:text-cyan-800">
                            {p.nombre}
                          </div>
                          <div className="flex items-center space-x-1.5 mt-1 flex-wrap gap-y-0.5">
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                              #{p.expediente}
                            </span>
                            {isMinor ? (
                              <span className="text-[9px] font-black bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded">
                                👶 {patientAge > 0 ? `${patientAge}a` : 'Menor'}
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {patientAge > 0 ? `${patientAge}a` : 'Adulto'}
                              </span>
                            )}
                            {p.location_codigo && (
                              <span 
                                className="text-[9px] font-black px-1.5 py-0.2 rounded"
                                style={{ 
                                  backgroundColor: `${p.location_color || '#8b5cf6'}18`, 
                                  color: p.location_color || '#7c3aed' 
                                }}
                              >
                                {p.location_codigo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeletePatient(p.id, e)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar paciente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Main Detail Workspace Panel (Responsive: full width on mobile) */}
        <main className={`
          flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto md:h-[calc(100vh-61px)] min-w-0 pb-24 scrollbar-thin
          ${mobileView === 'list' && activeSection !== 'consultas' && activeSection !== 'dashboard' ? 'hidden md:block' : 'block'}
        `}>
          {/* Mobile Back Button */}
          {mobileView === 'detail' && activeSection !== 'consultas' && activeSection !== 'dashboard' && (
            <div className="md:hidden pb-3 mb-3 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="text-xs font-bold text-cyan-700 flex items-center space-x-1 hover:underline"
              >
                <ChevronLeft size={16} />
                <span>Volver a la Lista de Pacientes</span>
              </button>
            </div>
          )}

          {/* Section Renderers */}
          {activeSection === 'dashboard' ? (
            <DashboardModule
              locations={locations}
              activeLocationId={activeLocationFilter}
              onSelectLocation={(locId: string | number) => {
                handleLocationChange(locId === 'all' ? 'all' : Number(locId));
              }}
              onNavigateToCalendar={() => {
                setActiveSection('consultas');
              }}
              onNavigateToInventario={() => {
                setShowInventarioModal(true);
              }}
              onNavigateToPatient={(patientId: number) => {
                setSelectedPatientId(patientId);
                setActiveSection('presupuestos');
              }}
            />
          ) : activeSection === 'consultas' ? (
            <ConsultasModule
              patients={patients}
              selectedPatient={selectedPatient}
              locations={locations}
              currentLocationId={activeLocationFilter}
              onSelectPatient={(id) => {
                setSelectedPatientId(id);
                setActiveSection('presupuestos');
              }}
            />
          ) : selectedPatient ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Header de Identificación del Paciente y Menú Interno de Pestañas */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                {/* 1. Tarjeta Resumen del Paciente (Inspirado en la Tarjeta Médica de Referencia) */}
                <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 bg-white border-b border-slate-100">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={selectedPatient.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                        alt={selectedPatient.nombre}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-[#00b4d8]/20 shadow-md"
                      />
                      <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                        selectedPatient.activo === 1 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                          {selectedPatient.nombre}
                        </h2>
                        {isMinorPatient(selectedPatient.fecha_nacimiento) ? (
                          <span className="text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-lg flex items-center space-x-1 shadow-2xs">
                            <span>👶 Menor ({calculatePatientAge(selectedPatient.fecha_nacimiento)} años)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                            Adulto ({calculatePatientAge(selectedPatient.fecha_nacimiento)} años)
                          </span>
                        )}
                        {selectedPatient.location_codigo && (
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                            style={{
                              backgroundColor: `${selectedPatient.location_color || '#0077b6'}15`,
                              color: selectedPatient.location_color || '#0077b6'
                            }}
                          >
                            📍 {selectedPatient.location_nombre || selectedPatient.location_codigo}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1.5 flex-wrap gap-y-1">
                        <span className="font-mono font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-lg text-xs">
                          Expediente: #{selectedPatient.expediente}
                        </span>
                        {selectedPatient.telefono && (
                          <span className="flex items-center space-x-1 text-slate-600 font-semibold">
                            <Phone size={12} className="text-slate-400" />
                            <span>{selectedPatient.telefono}</span>
                          </span>
                        )}
                        {isMinorPatient(selectedPatient.fecha_nacimiento) && selectedPatient.padre_tutor && (
                          <span className="text-xs text-amber-900 font-bold truncate max-w-xs sm:max-w-md bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                            👨‍👧 Tutor: {selectedPatient.padre_tutor}
                          </span>
                        )}
                      </div>

                      {/* 3 Botones Circulares de Acción Rápida (Idénticos al diseño del especialista) */}
                      <div className="flex items-center space-x-2 mt-3">
                        {/* Green Phone Circle */}
                        {selectedPatient.telefono ? (
                          <a
                            href={`tel:${selectedPatient.telefono.replace(/\D/g, '')}`}
                            className="w-8 h-8 rounded-full bg-[#10b981] hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110"
                            title={`Llamar a ${selectedPatient.nombre} (${selectedPatient.telefono})`}
                          >
                            <Phone size={14} />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => alert('No hay teléfono registrado para este paciente')}
                            className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shadow-2xs opacity-60 cursor-not-allowed"
                            title="Sin teléfono"
                          >
                            <Phone size={14} />
                          </button>
                        )}

                        {/* Sky Blue WhatsApp Circle */}
                        {selectedPatient.celular || selectedPatient.telefono ? (
                          <button
                            type="button"
                            onClick={() => {
                              const num = (selectedPatient.celular || selectedPatient.telefono || '').replace(/\D/g, '');
                              const msg = `Hola ${selectedPatient.nombre}, le saludamos de KoneneKoh Smile Maker.`;
                              window.open(`https://wa.me/52${num}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="w-8 h-8 rounded-full bg-[#00b4d8] hover:bg-[#0096c7] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110"
                            title="Enviar mensaje por WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </button>
                        ) : null}

                        {/* Email Circle */}
                        {selectedPatient.email && (
                          <a
                            href={`mailto:${selectedPatient.email}`}
                            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-800 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110"
                            title={`Enviar correo electrónico a ${selectedPatient.email}`}
                          >
                            <Mail size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick actions for Doctor */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection('consultas')}
                      className="px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center space-x-1.5"
                    >
                      <Calendar size={14} />
                      <span>Agendar Cita</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('recetas')}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center space-x-1.5"
                    >
                      <Pill size={14} />
                      <span>Nueva Receta</span>
                    </button>
                  </div>
                </div>

                {/* 2. Menús del Paciente (Subnavegación unificada, moderna y sin colores discordantes) */}
                <div className="border-t border-slate-100 bg-slate-50/80 p-1 sm:p-1.5 overflow-x-auto scrollbar-thin">
                  <div className="flex items-center gap-1.5 min-w-max">
                    <button
                      type="button"
                      onClick={() => setActiveSection('generales')}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                        activeSection === 'generales'
                          ? 'bg-[#00b4d8] text-white shadow-xs font-black'
                          : 'text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                      }`}
                    >
                      <User size={15} className={activeSection === 'generales' ? 'text-white' : 'text-cyan-700'} />
                      <span>Datos Generales</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('presupuestos')}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                        activeSection === 'presupuestos'
                          ? 'bg-[#00b4d8] text-white shadow-xs font-black'
                          : 'text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                      }`}
                    >
                      <Wallet size={15} className={activeSection === 'presupuestos' ? 'text-white' : 'text-teal-600'} />
                      <span>Odontograma & Presupuesto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('recetas')}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                        activeSection === 'recetas'
                          ? 'bg-[#00b4d8] text-white shadow-xs font-black'
                          : 'text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                      }`}
                    >
                      <Pill size={15} className={activeSection === 'recetas' ? 'text-white' : 'text-emerald-600'} />
                      <span>Recetas Médicas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('antecedentes')}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                        activeSection === 'antecedentes'
                          ? 'bg-[#00b4d8] text-white shadow-xs font-black'
                          : 'text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                      }`}
                    >
                      <Clipboard size={15} className={activeSection === 'antecedentes' ? 'text-white' : 'text-purple-600'} />
                      <span>Historial Médico</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('pagos')}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                        activeSection === 'pagos'
                          ? 'bg-[#00b4d8] text-white shadow-xs font-black'
                          : 'text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                      }`}
                    >
                      <Banknote size={15} className={activeSection === 'pagos' ? 'text-white' : 'text-teal-600'} />
                      <span>Estado de Cuenta & Pagos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('notas')}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                        activeSection === 'notas'
                          ? 'bg-[#00b4d8] text-white shadow-xs font-black'
                          : 'text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                      }`}
                    >
                      <MessageSquare size={15} className={activeSection === 'notas' ? 'text-white' : 'text-slate-600'} />
                      <span>Notas de Evolución</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-módulo Activo del Paciente */}
              <div>
                {activeSection === 'generales' && (
                  <GeneralesModule
                    patient={selectedPatient}
                    locations={locations}
                    onUpdatePatient={(upd) => {
                      setPatients(patients.map(p => p.id === upd.id ? upd : p));
                    }}
                  />
                )}

                {activeSection === 'antecedentes' && (
                  <AntecedentesModule patient={selectedPatient} />
                )}

                {activeSection === 'presupuestos' && (
                  <PresupuestosModule
                    patient={selectedPatient}
                    tratamientos={tratamientos}
                    clinicaConfig={clinicaConfig}
                    onRefreshAll={loadInitialData}
                  />
                )}

                {activeSection === 'recetas' && (
                  <RecetasModule
                    patient={selectedPatient}
                    clinicaConfig={clinicaConfig}
                    locations={locations}
                    onRefreshAll={loadInitialData}
                  />
                )}

                {activeSection === 'pagos' && (
                  <PagosModule patient={selectedPatient} />
                )}

                {activeSection === 'notas' && (
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                      <MessageSquare size={18} className="text-cyan-600" />
                      <span>Notas de Evolución Clínica</span>
                    </h3>
                    <textarea
                      rows={4}
                      placeholder="Escribe una nota clínica de seguimiento para esta sesión..."
                      className="w-full text-xs p-3.5 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => alert('Nota clínica guardada en el expediente.')}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        Guardar Nota
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400">
              Selecciona o crea un paciente para visualizar su expediente clínico.
            </div>
          )}
        </main>
      </div>

      {/* 3. FOOTER */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-2 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-base">🦉</span>
          <span className="font-bold text-slate-700">C+Tera</span>
          <span>• KoneneKoh Smile Maker Web 2.0 Pro</span>
        </div>
        <div className="flex items-center space-x-3 text-cyan-700 font-semibold text-[11px]">
          <span>Notación FDI (Adulto & Pediátrico)</span>
          <span>•</span>
          <span>Base de Datos SQLite Sincronizada</span>
        </div>
      </footer>

      {/* MODAL: INVENTARIO PROFESIONAL & KARDEX */}
      {showInventarioModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="max-w-6xl w-full">
            <InventarioModule
              locations={locations}
              currentLocationId={activeLocationFilter}
              onClose={() => setShowInventarioModal(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL: CATÁLOGO DE TRATAMIENTOS */}
      {showTratamientosModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="max-w-4xl w-full">
            <TratamientosModule
              tratamientos={tratamientos}
              onRefresh={loadInitialData}
              onClose={() => setShowTratamientosModal(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL: PADRES / TUTORES */}
      {showParentsModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2">
                <Users size={20} className="text-cyan-600" />
                <span>Datos del Padre o Tutor</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowParentsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Tutor</label>
                <input
                  type="text"
                  value={selectedPatient.padre_tutor || ''}
                  onChange={(e) => {
                    const upd = { ...selectedPatient, padre_tutor: e.target.value };
                    setPatients(patients.map(p => p.id === upd.id ? upd : p));
                  }}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Tutor</label>
                <input
                  type="text"
                  value={selectedPatient.celular || ''}
                  readOnly
                  className="w-full text-xs border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-slate-600"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={async () => {
                  await api.updatePatient(selectedPatient.id, selectedPatient);
                  setShowParentsModal(false);
                }}
                className="px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl"
              >
                Guardar Tutor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PACIENTE */}
      {showNewPatientModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-800 flex items-center space-x-2">
                <UserPlus size={20} className="text-cyan-600" />
                <span>Registrar Nuevo Paciente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPatientModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej. Santiago Morales Ramos"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expediente (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. PD186"
                    value={newExpediente}
                    onChange={(e) => setNewExpediente(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={newFechaNac}
                    onChange={(e) => setNewFechaNac(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Celular / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="4421234567"
                    value={newTelefono}
                    onChange={(e) => setNewTelefono(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Padre / Tutor</label>
                  <input
                    type="text"
                    placeholder="Nombre del padre o madre"
                    value={newTutor}
                    onChange={(e) => setNewTutor(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* Sucursal / Sede Asignada */}
              {locations.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                    <Building2 size={13} className="text-purple-600" />
                    <span>Clínica / Sucursal Asignada *</span>
                  </label>
                  <select
                    value={newLocationId}
                    onChange={(e) => setNewLocationId(Number(e.target.value))}
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
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewPatientModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreatePatient}
                className="px-5 py-2 text-xs font-bold bg-[#0077b6] text-white hover:bg-[#023e8a] rounded-xl shadow-sm"
              >
                Crear Paciente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INFORMACIÓN CLÍNICA */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center text-3xl mx-auto shadow-sm">
                🪐
              </div>
              <h3 className="font-extrabold text-lg text-[#0f4c5c]">KoneneKoh Smile Maker</h3>
              <p className="text-xs text-slate-500 font-medium">
                Sistema Integral de Gestión Clínica Odontológica & Odontopediatría
              </p>
            </div>
            <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-100 text-xs text-slate-700 space-y-2">
              <div><strong>Ubicación:</strong> Corregidora, Querétaro, México</div>
              <div><strong>Versión:</strong> 2.0 Web Pro (Migrado desde FileMaker)</div>
              <div><strong>Odontograma:</strong> Notación FDI (Adulto, Pediátrico y Mixto)</div>
              <div><strong>Módulos:</strong> Calendario de Citas, Presupuestos Dinámicos, Pagos, Inventario Kardex</div>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-6 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERSONALIZACIÓN DE CLÍNICA & LOGOTIPO */}
      <ConfiguracionClinicaModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        initialConfig={clinicaConfig}
        onSaveConfig={handleSaveClinicaConfig}
      />

      {/* MODAL: ADMINISTRACIÓN DE SUCURSALES & SEDES */}
      <SucursalesAdminModal
        isOpen={showSucursalesModal}
        onClose={() => setShowSucursalesModal(false)}
        onLocationsUpdated={handleLocationsUpdated}
      />

      {/* MODAL: ADMINISTRACIÓN DE LICENCIAS & PASARELA DE PAGOS */}
      <LicenciaAdminModal
        isOpen={showLicenciaModal}
        onClose={() => setShowLicenciaModal(false)}
        licenciaStatus={licenciaStatus}
        onLicenseUpdated={loadInitialData}
      />
    </div>
  );
}
