export interface Location {
  id: number;
  nombre: string;
  codigo: string;
  direccion?: string;
  telefono?: string;
  color: string;
  activo: number;
  total_pacientes?: number;
  citas_hoy?: number;
}

export interface DashboardData {
  isGlobal: boolean;
  location_id: string | number;
  kpis: {
    total_pacientes: number;
    pacientes_activos: number;
    citas_hoy: number;
    en_atencion: number;
    en_espera: number;
    completadas: number;
    total_presupuestado: number;
    total_pagado: number;
    saldo_pendiente: number;
    valor_inventario?: number;
    total_skus?: number;
    productos_bajo_stock?: number;
  };
  citas_hoy: Consulta[];
  sedes_breakdown: {
    id: number;
    nombre: string;
    codigo: string;
    color: string;
    direccion: string;
    telefono: string;
    pacientes_count: number;
    citas_hoy_count: number;
    ingresos_presupuestados: number;
    ingresos_cobrados: number;
    valor_inventario?: number;
    articulos_bajo_stock?: number;
  }[];
}

export interface Patient {
  id: number;
  expediente: string;
  nombre: string;
  foto?: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  calle?: string;
  num_exterior?: string;
  num_interior?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  cp?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  rfc?: string;
  activo: number;
  padre_tutor?: string;
  location_id?: number;
  location_nombre?: string;
  location_codigo?: string;
  location_color?: string;
  created_at?: string;
}

export interface Antecedentes {
  patient_id: number;
  generales?: string;
  andrologicos?: string;
  perinatales?: string;
  signos_vitales?: string;
  patologicos?: string;
  heredo_familiares?: string;
  no_patologicos?: string;
  gineco_obstetricos?: string;
}

export type ToothSurfaceKey = 'v' | 'l' | 'm' | 'd' | 'o';

export interface SurfaceData {
  condition?: 'sano' | 'caries' | 'obturado' | 'sellador' | 'fractura';
  treatment?: string;
  price?: number;
  color?: string;
}

export interface ToothCondition {
  state?: 'sano' | 'ausente' | 'endodoncia' | 'corona' | 'implante' | 'protesis';
  surfaces?: Partial<Record<ToothSurfaceKey, SurfaceData>>;
  generalNotes?: string;
}

export type OdontogramState = Record<number, ToothCondition>;

export interface PresupuestoItem {
  id?: number;
  presupuesto_id?: number;
  diente?: number | null;
  superficie?: string;
  tratamiento_id?: number | null;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  descuento: number;
  total: number;
  estado: 'Pendiente' | 'En proceso' | 'Realizado';
  color?: string;
}

export interface Presupuesto {
  id: number;
  patient_id: number;
  folio: string;
  fecha: string;
  titulo?: string;
  observaciones?: string;
  total: number;
  descuento: number;
  estado: 'Presupuestado' | 'Aprobado' | 'En proceso' | 'Completado';
  tipo_denticion: 'adulto' | 'pediatrico' | 'mixto';
  total_items?: number;
  items?: PresupuestoItem[];
  odontograma?: {
    tipo_denticion: 'adulto' | 'pediatrico' | 'mixto';
    dientes: OdontogramState;
  };
}

export interface Pago {
  id: number;
  patient_id: number;
  presupuesto_id?: number | null;
  folio_pago: string;
  fecha: string;
  monto: number;
  tipo_pago: string;
  notas?: string;
  created_at?: string;
}

export interface PagosSummary {
  total: number;
  total_pagado: number;
  saldo: number;
  pagos: Pago[];
}

export interface StockPorSede {
  location_id: number;
  location_nombre: string;
  location_codigo: string;
  location_color: string;
  cantidad: number;
  stock_minimo: number;
  pasillo_gaveta?: string;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  marca?: string;
  cantidad: number;
  stock_minimo: number;
  categoria: string;
  proveedor?: string;
  ubicacion?: string;
  location_id?: number;
  location_nombre?: string;
  location_codigo?: string;
  location_color?: string;
  stocks_por_sede?: StockPorSede[];
  alerta_bajo_stock?: boolean;
  sedes_bajo_stock?: string[];
  lote?: string;
  caducidad?: string;
  costo: number;
  utilidad: number;
  precio: number;
  iva: number;
  precio_sin_iva: number;
  precio_con_iva: number;
}

export interface MovimientoInventario {
  id: number;
  producto_id: number;
  producto_nombre?: string;
  producto_codigo?: string;
  tipo: 'Entrada' | 'Salida' | 'Ajuste' | 'Traspaso';
  cantidad: number;
  motivo: string;
  usuario: string;
  location_id?: number;
  location_nombre?: string;
  location_codigo?: string;
  location_color?: string;
  destino_location_id?: number;
  destino_location_nombre?: string;
  destino_location_codigo?: string;
  fecha: string;
}

export interface Tratamiento {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  color_sugerido: string;
}

export interface Consentimiento {
  id: number;
  patient_id: number;
  folio: string;
  fecha: string;
  categoria: string;
  detalles?: string;
  firmado: number;
}

export interface Consulta {
  id: number;
  patient_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  motivo: string;
  diagnostico?: string;
  tratamiento_realizado?: string;
  doctor: string;
  sillon: string;
  estado: 'Programada' | 'En espera' | 'En atención' | 'Completada' | 'Cancelada';
  location_id?: number;
  location_nombre?: string;
  location_codigo?: string;
  location_color?: string;
  notas?: string;
  created_at?: string;
  paciente_nombre?: string;
  paciente_expediente?: string;
  paciente_foto?: string;
  paciente_celular?: string;
  paciente_telefono?: string;
}

export interface ClinicaConfig {
  id?: number;
  nombre_comercial: string;
  eslogan?: string;
  logotipo_url?: string;
  direccion?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  sitio_web?: string;
  rfc?: string;
  responsable_sanitario?: string;
  cedula_profesional?: string;
  registro_ssa?: string;
  nota_pie_presupuesto?: string;
  nota_pie_receta?: string;
  color_primario?: string;
  color_secundario?: string;
  updated_at?: string;
}

export interface MedicamentoItem {
  nombre: string;
  dosis: string;
  duracion: string;
  indicacion?: string;
}

export interface RecetaMedica {
  id: number;
  patient_id: number;
  folio: string;
  fecha: string;
  doctor: string;
  cedula: string;
  diagnostico?: string;
  peso?: string;
  talla?: string;
  temperatura?: string;
  alergias?: string;
  medicamentos: MedicamentoItem[];
  indicaciones_generales?: string;
  location_id?: number;
  created_at?: string;
  paciente_nombre?: string;
  paciente_expediente?: string;
  fecha_nacimiento?: string;
  paciente_telefono?: string;
  sucursal_nombre?: string;
  sucursal_direccion?: string;
  sucursal_telefono?: string;
  sucursal_color?: string;
}

export interface LicenciaStatus {
  hasLicense: boolean;
  valid: boolean;
  expired: boolean;
  isReadOnly: boolean;
  daysRemaining: number;
  tipo: 'DEMO' | 'MENSUAL' | 'ANUAL' | 'VITALICIA' | string;
  titular: string;
  email?: string;
  fecha_emision?: string;
  fecha_expiracion?: string;
  codigo: string;
  sucursales_max?: number;
  auto_renovacion?: number;
  pasarela?: string;
  subscription_id?: string;
  actualizaciones_habilitadas?: boolean;
  version_instalada?: string;
  ultima_verificacion?: string;
  reason?: string;
}

export interface SoftwareUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseDate: string;
  eligible: boolean;
  licenseStatus: {
    valid: boolean;
    expired: boolean;
    daysRemaining: number;
    tipo: string;
  };
  changelog: string[];
  downloadUrl?: string | null;
  message: string;
}
