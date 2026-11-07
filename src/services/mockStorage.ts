import {
  Patient, Antecedentes, Presupuesto, PresupuestoItem, 
  PagosSummary, Pago, Producto, MovimientoInventario, 
  Tratamiento, Consentimiento, OdontogramState, Consulta,
  Location, DashboardData, ClinicaConfig, RecetaMedica,
  LicenciaStatus, SoftwareUpdateInfo
} from '../types';

const STORAGE_KEYS = {
  CONFIG: 'konenekoh_demo_config',
  LOCATIONS: 'konenekoh_demo_locations',
  PATIENTS: 'konenekoh_demo_patients',
  CONSULTAS: 'konenekoh_demo_consultas',
  PRODUCTOS: 'konenekoh_demo_productos',
  TRATAMIENTOS: 'konenekoh_demo_tratamientos',
  LICENCIA: 'konenekoh_demo_licencia',
};

// INITIAL SEED DATA FOR DEMO MODE
const DEFAULT_CONFIG: ClinicaConfig = {
  nombre_comercial: 'KoneneKoh Smile Maker',
  eslogan: 'Odontopediatría & Ortodoncia Especializada',
  logotipo_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=250',
  direccion: 'Campos Elíseos 204, Piso 5, Consultorio 502, Polanco, CDMX',
  telefono: '55 5280 4321',
  whatsapp: '55 4912 3456',
  email: 'citas@konenekoh.com',
  sitio_web: 'https://konenekoh.com',
  rfc: 'KSM210815AB3',
  responsable_sanitario: 'Dra. Sofía Alarcón Valdés',
  cedula_profesional: 'CED-ODON-8849201',
  registro_ssa: 'COFEPRIS-24-09-CDMX-884',
  color_primario: '#00b4d8',
  color_secundario: '#2ec4b6',
  nota_pie_presupuesto: 'Presupuesto válido por 30 días naturales. Los tratamientos se pagan conforme avanzan las citas.',
  nota_pie_receta: 'Favor de no automedicarse. Cualquier duda o reacción adversa comunicarse de inmediato al teléfono de urgencias 24/7.'
};

const DEFAULT_LOCATIONS: Location[] = [
  { id: 1, nombre: 'KoneneKoh Matriz Polanco', codigo: 'POL', direccion: 'Campos Elíseos 204, Polanco, CDMX', telefono: '55 5280 4321', color: '#0077b6', activo: 1, total_pacientes: 3, citas_hoy: 2 },
  { id: 2, nombre: 'KoneneKoh Sede Satélite', codigo: 'SAT', direccion: 'Circuito Novelistas 48, Cd. Satélite', telefono: '55 5393 8812', color: '#2ec4b6', activo: 1, total_pacientes: 1, citas_hoy: 1 },
  { id: 3, nombre: 'KoneneKoh Sede Pedregal', codigo: 'PED', direccion: 'Periférico Sur 4120, Jardines del Pedregal', telefono: '55 5652 9000', color: '#7209b7', activo: 1, total_pacientes: 1, citas_hoy: 1 },
  { id: 4, nombre: 'KoneneKoh Sede Santa Fe', codigo: 'SFE', direccion: 'Vasco de Quiroga 3800, Santa Fe', telefono: '55 5081 2200', color: '#f77f00', activo: 1, total_pacientes: 0, citas_hoy: 0 },
];

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 1,
    expediente: 'EXP-001-POL',
    nombre: 'Mateo García Torres',
    fecha_nacimiento: '2018-05-14', // 8 years old - Pediatric minor
    lugar_nacimiento: 'Ciudad de México',
    calle: 'Horacio',
    num_exterior: '120',
    colonia: 'Polanco',
    municipio: 'Miguel Hidalgo',
    estado: 'CDMX',
    cp: '11550',
    telefono: '55 4123 9988',
    celular: '55 9876 5432',
    email: 'familia.garcia@gmail.com',
    rfc: 'GATM180514HDF',
    activo: 1,
    padre_tutor: 'Lic. Roberto García Méndez (Padre) y Dra. Mariana Torres Ruiz (Madre)',
    location_id: 1,
    location_nombre: 'KoneneKoh Matriz Polanco',
    location_codigo: 'POL',
    location_color: '#0077b6',
    created_at: '2026-01-15 10:00:00'
  },
  {
    id: 2,
    expediente: 'EXP-002-SAT',
    nombre: 'Sofía Hernández Cruz',
    fecha_nacimiento: '2012-11-20', // 14 years old - Pediatric minor
    lugar_nacimiento: 'Naucalpan',
    calle: 'Circuito Héroes',
    num_exterior: '35',
    colonia: 'Ciudad Satélite',
    municipio: 'Naucalpan de Juárez',
    estado: 'Estado de México',
    cp: '53100',
    telefono: '55 5562 1199',
    celular: '55 1122 3344',
    email: 'patricia.cruz@outlook.com',
    activo: 1,
    padre_tutor: 'Sra. Patricia Cruz Salazar (Madre)',
    location_id: 2,
    location_nombre: 'KoneneKoh Sede Satélite',
    location_codigo: 'SAT',
    location_color: '#2ec4b6',
    created_at: '2026-02-10 12:30:00'
  },
  {
    id: 3,
    expediente: 'EXP-003-POL',
    nombre: 'Carlos Méndez Ruiz',
    fecha_nacimiento: '1992-03-08', // Adult
    lugar_nacimiento: 'Guadalajara, Jal.',
    calle: 'Arquímedes',
    num_exterior: '45',
    colonia: 'Polanco',
    municipio: 'Miguel Hidalgo',
    estado: 'CDMX',
    cp: '11560',
    telefono: '55 5281 7700',
    celular: '55 3344 5566',
    email: 'carlos.mendez@empresa.com',
    activo: 1,
    padre_tutor: '',
    location_id: 1,
    location_nombre: 'KoneneKoh Matriz Polanco',
    location_codigo: 'POL',
    location_color: '#0077b6',
    created_at: '2026-03-05 09:15:00'
  },
  {
    id: 4,
    expediente: 'EXP-004-PED',
    nombre: 'Elena Ramos Villanueva',
    fecha_nacimiento: '1998-07-25', // Adult
    lugar_nacimiento: 'Puebla, Pue.',
    calle: 'Av. de las Fuentes',
    num_exterior: '180',
    colonia: 'Jardines del Pedregal',
    municipio: 'Álvaro Obregón',
    estado: 'CDMX',
    cp: '01900',
    telefono: '55 5652 3311',
    celular: '55 7788 9900',
    email: 'elena.ramos@estudio.mx',
    activo: 1,
    padre_tutor: '',
    location_id: 3,
    location_nombre: 'KoneneKoh Sede Pedregal',
    location_codigo: 'PED',
    location_color: '#7209b7',
    created_at: '2026-04-12 16:45:00'
  }
];

const DEFAULT_TRATAMIENTOS: Tratamiento[] = [
  { id: 1, codigo: 'TRAT-01', nombre: 'Resina Estética Fotocurable', categoria: 'Operatoria', precio: 850, color_sugerido: '#00b4d8' },
  { id: 2, codigo: 'TRAT-02', nombre: 'Limpieza y Profilaxis Ultrasónica', categoria: 'Prevención', precio: 600, color_sugerido: '#2ec4b6' },
  { id: 3, codigo: 'TRAT-03', nombre: 'Sellador de Fosetas y Fisuras', categoria: 'Prevención', precio: 450, color_sugerido: '#7209b7' },
  { id: 4, codigo: 'TRAT-04', nombre: 'Pulpotomía Pediátrica', categoria: 'Endodoncia', precio: 1200, color_sugerido: '#e63946' },
  { id: 5, codigo: 'TRAT-05', nombre: 'Corona de Acero Cromo Infantil', categoria: 'Rehabilitación', precio: 1800, color_sugerido: '#f77f00' },
  { id: 6, codigo: 'TRAT-06', nombre: 'Blanqueamiento Dental Láser LED', categoria: 'Estética', precio: 3500, color_sugerido: '#48cae4' },
  { id: 7, codigo: 'TRAT-07', nombre: 'Extracción Simple Temporal', categoria: 'Cirugía', precio: 750, color_sugerido: '#d90429' },
  { id: 8, codigo: 'TRAT-08', nombre: 'Ortodoncia Inicial Interceptiva', categoria: 'Ortodoncia', precio: 6500, color_sugerido: '#0f4c5c' },
];

const DEFAULT_PRODUCTOS: Producto[] = [
  {
    id: 1,
    codigo: 'RES-3M-A2',
    nombre: 'Resina Filtek Z250 Tono A2 (3M)',
    categoria: 'Operatoria',
    cantidad: 18,
    stock_minimo: 5,
    costo: 480,
    utilidad: 370,
    precio: 850,
    iva: 136,
    precio_sin_iva: 850,
    precio_con_iva: 986,
    location_id: 1,
    location_nombre: 'KoneneKoh Matriz Polanco'
  },
  {
    id: 2,
    codigo: 'ANES-MEPI',
    nombre: 'Mepivacaína 2% con Epinefrina (Zeyco)',
    categoria: 'Anestesia',
    cantidad: 3,
    stock_minimo: 8,
    costo: 620,
    utilidad: 480,
    precio: 1100,
    iva: 176,
    precio_sin_iva: 1100,
    precio_con_iva: 1276,
    location_id: 1,
    location_nombre: 'KoneneKoh Matriz Polanco',
    alerta_bajo_stock: true
  },
  {
    id: 3,
    codigo: 'SELL-HELI',
    nombre: 'Sellador Helioseal F Fluoruro (Ivoclar)',
    categoria: 'Prevención',
    cantidad: 12,
    stock_minimo: 4,
    costo: 340,
    utilidad: 110,
    precio: 450,
    iva: 72,
    precio_sin_iva: 450,
    precio_con_iva: 522,
    location_id: 2,
    location_nombre: 'KoneneKoh Sede Satélite'
  },
  {
    id: 4,
    codigo: 'GUAN-NITR-M',
    nombre: 'Guantes de Nitrilo Rosa Talla M',
    categoria: 'Bioseguridad',
    cantidad: 2,
    stock_minimo: 5,
    costo: 160,
    utilidad: 90,
    precio: 250,
    iva: 40,
    precio_sin_iva: 250,
    precio_con_iva: 290,
    location_id: 3,
    location_nombre: 'KoneneKoh Sede Pedregal',
    alerta_bajo_stock: true
  },
];

const todayStr = new Date().toISOString().split('T')[0];

const DEFAULT_CONSULTAS: Consulta[] = [
  {
    id: 1,
    patient_id: 1,
    paciente_nombre: 'Mateo García Torres',
    paciente_expediente: 'EXP-001-POL',
    fecha: todayStr,
    hora_inicio: '10:00',
    hora_fin: '10:45',
    duracion_minutos: 45,
    motivo: 'Revisión semestral y colocación de selladores en molares',
    tratamiento_realizado: 'Sellador en piezas 55 y 65',
    diagnostico: 'Caries incipiente controlada',
    notas: 'Paciente cooperador, premio sticker otorgado.',
    doctor: 'Dr. Roberto Aguilar',
    sillon: 'Sillón Pediatría 1',
    estado: 'Completada',
    location_id: 1
  },
  {
    id: 2,
    patient_id: 2,
    paciente_nombre: 'Sofía Hernández Cruz',
    paciente_expediente: 'EXP-002-SAT',
    fecha: todayStr,
    hora_inicio: '12:30',
    hora_fin: '13:15',
    duracion_minutos: 45,
    motivo: 'Ajuste de arco ortodoncia superior',
    tratamiento_realizado: 'Cambio de ligas elásticas color turquesa',
    diagnostico: 'Avance de alineación 80%',
    notas: 'Próxima cita en 4 semanas.',
    doctor: 'Dra. Sofía Alarcón',
    sillon: 'Sillón Ortodoncia 2',
    estado: 'En atención',
    location_id: 2
  },
  {
    id: 3,
    patient_id: 3,
    paciente_nombre: 'Carlos Méndez Ruiz',
    paciente_expediente: 'EXP-003-POL',
    fecha: todayStr,
    hora_inicio: '16:00',
    hora_fin: '17:00',
    duracion_minutos: 60,
    motivo: 'Obturación con resina estética pieza 16',
    tratamiento_realizado: 'Resina compuesto O-V',
    diagnostico: 'Sensibilidad a bebidas frías',
    notas: '',
    doctor: 'Dr. Roberto Aguilar',
    sillon: 'Sillón General 1',
    estado: 'Programada',
    location_id: 1
  }
];

const DEFAULT_LICENCIA: LicenciaStatus = {
  hasLicense: true,
  valid: true,
  expired: false,
  isReadOnly: false,
  daysRemaining: 365,
  tipo: 'ANUAL',
  titular: 'KoneneKoh Demo Interactivo',
  codigo: 'KK-2026-DEMO-OFFLINE',
  fecha_expiracion: '2027-11-06',
  auto_renovacion: 1,
  sucursales_max: 5,
  version_instalada: '2.5.0',
  actualizaciones_habilitadas: true
};

class LocalStorageMockDB {
  private getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
        return defaultVal;
      }
      return JSON.parse(data);
    } catch {
      return defaultVal;
    }
  }

  private setItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  // Config
  getConfig(): ClinicaConfig {
    return this.getItem(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
  }
  updateConfig(data: Partial<ClinicaConfig>): ClinicaConfig {
    const curr = this.getConfig();
    const updated = { ...curr, ...data };
    this.setItem(STORAGE_KEYS.CONFIG, updated);
    return updated;
  }

  // Locations
  getLocations(): Location[] {
    return this.getItem(STORAGE_KEYS.LOCATIONS, DEFAULT_LOCATIONS);
  }
  createLocation(loc: Partial<Location>): Location {
    const list = this.getLocations();
    const newLoc: Location = {
      id: Date.now(),
      nombre: loc.nombre || 'Nueva Sede',
      codigo: loc.codigo || 'SUC',
      direccion: loc.direccion || '',
      telefono: loc.telefono || '',
      color: loc.color || '#00b4d8',
      activo: 1,
      total_pacientes: 0,
      citas_hoy: 0
    };
    list.push(newLoc);
    this.setItem(STORAGE_KEYS.LOCATIONS, list);
    return newLoc;
  }
  updateLocation(id: number, data: Partial<Location>): void {
    const list = this.getLocations();
    const idx = list.findIndex(l => l.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      this.setItem(STORAGE_KEYS.LOCATIONS, list);
    }
  }
  deleteLocation(id: number): void {
    const list = this.getLocations().filter(l => l.id !== id);
    this.setItem(STORAGE_KEYS.LOCATIONS, list);
  }

  // Patients
  getPatients(search?: string, locationId?: string | number): Patient[] {
    let list = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, DEFAULT_PATIENTS);
    if (locationId && locationId !== 'all') {
      list = list.filter(p => p.location_id === Number(locationId));
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.expediente.toLowerCase().includes(q) ||
        (p.telefono && p.telefono.includes(q)) ||
        (p.celular && p.celular.includes(q))
      );
    }
    return list;
  }
  getPatient(id: number): Patient | undefined {
    return this.getPatients().find(p => p.id === id);
  }
  createPatient(data: Partial<Patient>): Patient {
    const list = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, DEFAULT_PATIENTS);
    const id = Date.now();
    const locId = data.location_id || 1;
    const loc = this.getLocations().find(l => l.id === locId);
    const newP: Patient = {
      id,
      expediente: `EXP-${String(id).slice(-4)}-${loc?.codigo || 'POL'}`,
      nombre: data.nombre || 'Nuevo Paciente',
      fecha_nacimiento: data.fecha_nacimiento || '2015-01-01',
      calle: data.calle || '',
      num_exterior: data.num_exterior || '',
      colonia: data.colonia || '',
      municipio: data.municipio || '',
      estado: data.estado || 'CDMX',
      cp: data.cp || '',
      telefono: data.telefono || '',
      celular: data.celular || '',
      email: data.email || '',
      rfc: data.rfc || '',
      activo: 1,
      padre_tutor: data.padre_tutor || '',
      location_id: locId,
      location_nombre: loc?.nombre,
      location_codigo: loc?.codigo,
      location_color: loc?.color,
      created_at: new Date().toISOString()
    };
    list.unshift(newP);
    this.setItem(STORAGE_KEYS.PATIENTS, list);
    return newP;
  }
  updatePatient(id: number, data: Partial<Patient>): Patient {
    const list = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, DEFAULT_PATIENTS);
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      this.setItem(STORAGE_KEYS.PATIENTS, list);
      return list[idx];
    }
    throw new Error('Paciente no encontrado');
  }
  deletePatient(id: number): void {
    const list = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, DEFAULT_PATIENTS).filter(p => p.id !== id);
    this.setItem(STORAGE_KEYS.PATIENTS, list);
  }

  // Dashboard Metrics
  getDashboard(locationId?: string | number): DashboardData {
    const patients = this.getPatients(undefined, locationId);
    const consultas = this.getItem<Consulta[]>(STORAGE_KEYS.CONSULTAS, DEFAULT_CONSULTAS);
    const productos = this.getItem<Producto[]>(STORAGE_KEYS.PRODUCTOS, DEFAULT_PRODUCTOS);
    const locations = this.getLocations();

    const citasHoy = consultas.filter(c => c.fecha === todayStr);
    const bajoStock = productos.filter(p => p.cantidad <= p.stock_minimo).length;

    return {
      isGlobal: !locationId || locationId === 'all',
      location_id: locationId || 'all',
      kpis: {
        total_pacientes: patients.length,
        pacientes_activos: patients.filter(p => p.activo).length,
        citas_hoy: citasHoy.length,
        en_atencion: citasHoy.filter(c => c.estado === 'En atención').length,
        en_espera: citasHoy.filter(c => c.estado === 'En espera' || c.estado === 'Programada').length,
        completadas: citasHoy.filter(c => c.estado === 'Completada').length,
        total_presupuestado: 38500,
        total_pagado: 26200,
        saldo_pendiente: 12300,
        valor_inventario: productos.reduce((acc, p) => acc + (p.cantidad * p.costo), 0),
        total_skus: productos.length,
        productos_bajo_stock: bajoStock
      },
      citas_hoy: citasHoy,
      sedes_breakdown: locations.map(l => ({
        id: l.id,
        nombre: l.nombre,
        codigo: l.codigo,
        color: l.color,
        direccion: l.direccion || '',
        telefono: l.telefono || '',
        pacientes_count: patients.filter(p => p.location_id === l.id).length,
        citas_hoy_count: citasHoy.filter(c => c.location_id === l.id).length,
        ingresos_presupuestados: 12000,
        ingresos_cobrados: 8500,
        valor_inventario: 15400,
        articulos_bajo_stock: 1
      }))
    };
  }

  // Tratamientos
  getTratamientos(): Tratamiento[] {
    return this.getItem(STORAGE_KEYS.TRATAMIENTOS, DEFAULT_TRATAMIENTOS);
  }

  // Consultas
  getConsultas(patientId?: number, locationId?: string | number): Consulta[] {
    let list = this.getItem<Consulta[]>(STORAGE_KEYS.CONSULTAS, DEFAULT_CONSULTAS);
    if (patientId) list = list.filter(c => c.patient_id === patientId);
    if (locationId && locationId !== 'all') list = list.filter(c => c.location_id === Number(locationId));
    return list;
  }
  createConsulta(data: Partial<Consulta>): Consulta {
    const list = this.getConsultas();
    const newC: Consulta = {
      id: Date.now(),
      patient_id: data.patient_id || 1,
      fecha: data.fecha || todayStr,
      hora_inicio: data.hora_inicio || '11:00',
      hora_fin: data.hora_fin || '11:45',
      duracion_minutos: data.duracion_minutos || 45,
      motivo: data.motivo || 'Consulta general',
      diagnostico: data.diagnostico || '',
      tratamiento_realizado: data.tratamiento_realizado || '',
      doctor: data.doctor || 'Dr. Roberto Aguilar',
      sillon: data.sillon || 'Sillón 1',
      estado: data.estado || 'Programada',
      location_id: data.location_id || 1,
      notas: data.notas || ''
    };
    list.unshift(newC);
    this.setItem(STORAGE_KEYS.CONSULTAS, list);
    return newC;
  }

  // Productos & Inventarios
  getProductos(locationId?: string | number): Producto[] {
    let list = this.getItem<Producto[]>(STORAGE_KEYS.PRODUCTOS, DEFAULT_PRODUCTOS);
    if (locationId && locationId !== 'all') {
      list = list.filter(p => p.location_id === Number(locationId));
    }
    return list;
  }

  // Licencia
  getLicencia(): LicenciaStatus {
    return this.getItem(STORAGE_KEYS.LICENCIA, DEFAULT_LICENCIA);
  }
  updateLicencia(data: Partial<LicenciaStatus>): LicenciaStatus {
    const curr = this.getLicencia();
    const updated = { ...curr, ...data };
    this.setItem(STORAGE_KEYS.LICENCIA, updated);
    return updated;
  }
}

export const mockStorage = new LocalStorageMockDB();
