import { 
  Patient, Antecedentes, Presupuesto, PresupuestoItem, 
  PagosSummary, Pago, Producto, MovimientoInventario, 
  Tratamiento, Consentimiento, OdontogramState, Consulta,
  Location, DashboardData, ClinicaConfig, RecetaMedica,
  LicenciaStatus, SoftwareUpdateInfo
} from '../types';

import { mockStorage } from './mockStorage';

const isDemoHost = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.hostname.includes('vercel.app') ||
  window.location.hostname.includes('netlify.app') ||
  window.location.search.includes('demo=true') ||
  window.localStorage.getItem('FORCE_DEMO_MODE') === 'true'
);

const BASE_URL = '/api';

export const api = {
  // Ubicaciones / Sedes
  async getLocations(includeInactive?: boolean): Promise<Location[]> {
    if (isDemoHost) return mockStorage.getLocations();
    try {
      const url = includeInactive ? `${BASE_URL}/locations?all=true` : `${BASE_URL}/locations`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar ubicaciones');
      return await res.json();
    } catch {
      return mockStorage.getLocations();
    }
  },

  async createLocation(data: Partial<Location>): Promise<Location> {
    if (isDemoHost) return mockStorage.createLocation(data);
    try {
      const res = await fetch(`${BASE_URL}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al crear ubicación');
      return await res.json();
    } catch {
      return mockStorage.createLocation(data);
    }
  },

  async updateLocation(id: number, data: Partial<Location>): Promise<void> {
    if (isDemoHost) {
      mockStorage.updateLocation(id, data);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al actualizar sucursal');
    } catch {
      mockStorage.updateLocation(id, data);
    }
  },

  async deleteLocation(id: number): Promise<{ success: boolean; softDeleted?: boolean; hardDeleted?: boolean; message?: string }> {
    if (isDemoHost) {
      mockStorage.deleteLocation(id);
      return { success: true };
    }
    try {
      const res = await fetch(`${BASE_URL}/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar sucursal');
      return await res.json();
    } catch {
      mockStorage.deleteLocation(id);
      return { success: true };
    }
  },

  // Configuración de la Clínica & Marca
  async getClinicaConfig(): Promise<ClinicaConfig> {
    if (isDemoHost) return mockStorage.getConfig();
    try {
      const res = await fetch(`${BASE_URL}/config/clinica`);
      if (!res.ok) throw new Error('Error al obtener configuración de la clínica');
      return await res.json();
    } catch {
      return mockStorage.getConfig();
    }
  },

  async updateClinicaConfig(data: Partial<ClinicaConfig>): Promise<ClinicaConfig> {
    if (isDemoHost) return mockStorage.updateConfig(data);
    try {
      const res = await fetch(`${BASE_URL}/config/clinica`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al guardar configuración de la clínica');
      return await res.json();
    } catch {
      return mockStorage.updateConfig(data);
    }
  },

  // Dashboard (General & Por Ubicación)
  async getDashboard(locationId?: string | number): Promise<DashboardData> {
    if (isDemoHost) return mockStorage.getDashboard(locationId);
    try {
      const url = locationId && locationId !== 'all'
        ? `${BASE_URL}/dashboard?location_id=${locationId}`
        : `${BASE_URL}/dashboard`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar métricas del dashboard');
      return await res.json();
    } catch {
      return mockStorage.getDashboard(locationId);
    }
  },

  // Pacientes
  async getPatients(search?: string, locationId?: string | number): Promise<Patient[]> {
    if (isDemoHost) return mockStorage.getPatients(search, locationId);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (locationId && locationId !== 'all') params.append('location_id', String(locationId));

      const url = `${BASE_URL}/patients${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar pacientes');
      return await res.json();
    } catch {
      return mockStorage.getPatients(search, locationId);
    }
  },

  async getPatient(id: number): Promise<Patient> {
    if (isDemoHost) {
      const p = mockStorage.getPatient(id);
      if (p) return p;
    }
    try {
      const res = await fetch(`${BASE_URL}/patients/${id}`);
      if (!res.ok) throw new Error('Paciente no encontrado');
      return await res.json();
    } catch {
      const p = mockStorage.getPatient(id);
      if (p) return p;
      throw new Error('Paciente no encontrado');
    }
  },

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    if (isDemoHost) return mockStorage.createPatient(patient);
    try {
      const res = await fetch(`${BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || 'Error al crear paciente');
      return data;
    } catch (err: any) {
      if (err.message && err.message.includes('licencia')) throw err;
      return mockStorage.createPatient(patient);
    }
  },

  async updatePatient(id: number, patient: Partial<Patient>): Promise<Patient> {
    if (isDemoHost) return mockStorage.updatePatient(id, patient);
    try {
      const res = await fetch(`${BASE_URL}/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });
      if (!res.ok) throw new Error('Error al actualizar paciente');
      return await res.json();
    } catch {
      return mockStorage.updatePatient(id, patient);
    }
  },

  async deletePatient(id: number): Promise<void> {
    if (isDemoHost) {
      mockStorage.deletePatient(id);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/patients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar paciente');
    } catch {
      mockStorage.deletePatient(id);
    }
  },

  // Antecedentes
  async getAntecedentes(patientId: number): Promise<Antecedentes> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/antecedentes`);
    if (!res.ok) throw new Error('Error al obtener antecedentes');
    return res.json();
  },

  async updateAntecedentes(patientId: number, data: Partial<Antecedentes>): Promise<void> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/antecedentes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al guardar antecedentes');
  },

  // Presupuestos & Odontograma
  async getPresupuestos(patientId: number): Promise<Presupuesto[]> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/presupuestos`);
    if (!res.ok) throw new Error('Error al cargar presupuestos');
    return res.json();
  },

  async getPresupuesto(id: number): Promise<Presupuesto> {
    const res = await fetch(`${BASE_URL}/presupuestos/${id}`);
    if (!res.ok) throw new Error('Error al cargar presupuesto');
    return res.json();
  },

  async createPresupuesto(patientId: number, data: {
    folio?: string;
    fecha?: string;
    titulo?: string;
    observaciones?: string;
    total: number;
    descuento?: number;
    estado?: string;
    tipo_denticion: 'adulto' | 'pediatrico' | 'mixto';
    items: PresupuestoItem[];
    odontograma_data: OdontogramState;
  }): Promise<{ id: number; folio: string; success: boolean }> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/presupuestos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear presupuesto');
    return res.json();
  },

  async updatePresupuesto(id: number, data: {
    titulo?: string;
    observaciones?: string;
    total: number;
    descuento?: number;
    estado?: string;
    tipo_denticion: 'adulto' | 'pediatrico' | 'mixto';
    items: PresupuestoItem[];
    odontograma_data: OdontogramState;
  }): Promise<void> {
    const res = await fetch(`${BASE_URL}/presupuestos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar presupuesto');
  },

  async deletePresupuesto(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/presupuestos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar presupuesto');
  },

  async updateItemStatus(itemId: number, estado: 'Pendiente' | 'En proceso' | 'Realizado'): Promise<void> {
    const res = await fetch(`${BASE_URL}/presupuesto-items/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) throw new Error('Error al actualizar estado del tratamiento');
  },

  // Pagos
  async getPagosSummary(patientId: number): Promise<PagosSummary> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/pagos`);
    if (!res.ok) throw new Error('Error al obtener estado de cuenta');
    return res.json();
  },

  async addPago(patientId: number, data: {
    presupuesto_id?: number | null;
    folio_pago?: string;
    fecha: string;
    monto: number;
    tipo_pago: string;
    notas?: string;
  }): Promise<void> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al registrar pago');
  },

  async deletePago(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/pagos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar pago');
  },

  // Catálogos & Inventario Profesional (Multi-Ubicación & General)
  async getProductos(locationId?: string | number): Promise<Producto[]> {
    const url = locationId && locationId !== 'all'
      ? `${BASE_URL}/catalogos/productos?location_id=${locationId}`
      : `${BASE_URL}/catalogos/productos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar productos');
    return res.json();
  },

  async createProducto(producto: Partial<Producto>): Promise<Producto> {
    const res = await fetch(`${BASE_URL}/catalogos/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto),
    });
    if (!res.ok) throw new Error('Error al guardar producto');
    return res.json();
  },

  async updateProducto(id: number, producto: Partial<Producto>): Promise<void> {
    const res = await fetch(`${BASE_URL}/catalogos/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto),
    });
    if (!res.ok) throw new Error('Error al actualizar producto');
  },

  async deleteProducto(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/catalogos/productos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar producto');
  },

  async ajustarStock(productoId: number, data: {
    cantidad_ajuste: number;
    tipo: 'Entrada' | 'Salida' | 'Ajuste';
    motivo: string;
    usuario?: string;
    location_id?: number;
  }): Promise<{ success: boolean; nuevaCantidad: number; location_id?: number }> {
    const res = await fetch(`${BASE_URL}/catalogos/productos/${productoId}/ajustar-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al ajustar stock');
    return res.json();
  },

  async traspasarStock(productoId: number, data: {
    origen_location_id: number;
    destino_location_id: number;
    cantidad: number;
    motivo?: string;
    usuario?: string;
  }): Promise<{
    success: boolean;
    producto_id: number;
    origen_location_id: number;
    destino_location_id: number;
    cantidad_transferida: number;
    nuevo_stock_origen: number;
  }> {
    const res = await fetch(`${BASE_URL}/catalogos/productos/${productoId}/traspaso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al procesar el traspaso entre sucursales');
    }
    return res.json();
  },

  async getMovimientosInventario(locationId?: string | number): Promise<MovimientoInventario[]> {
    const url = locationId && locationId !== 'all'
      ? `${BASE_URL}/catalogos/productos/movimientos?location_id=${locationId}`
      : `${BASE_URL}/catalogos/productos/movimientos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar movimientos de inventario');
    return res.json();
  },

  async getTratamientos(): Promise<Tratamiento[]> {
    if (isDemoHost) return mockStorage.getTratamientos();
    try {
      const res = await fetch(`${BASE_URL}/catalogos/tratamientos`);
      if (!res.ok) throw new Error('Error al cargar tratamientos');
      return await res.json();
    } catch {
      return mockStorage.getTratamientos();
    }
  },

  async createTratamiento(trat: Partial<Tratamiento>): Promise<Tratamiento> {
    const res = await fetch(`${BASE_URL}/catalogos/tratamientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trat),
    });
    if (!res.ok) throw new Error('Error al crear tratamiento');
    return res.json();
  },

  // Consentimientos
  async getConsentimientos(patientId: number): Promise<Consentimiento[]> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/consentimientos`);
    if (!res.ok) throw new Error('Error al cargar consentimientos');
    return res.json();
  },

  async createConsentimiento(patientId: number, data: Partial<Consentimiento>): Promise<void> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/consentimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear consentimiento');
  },

  // Consultas & Citas
  async getConsultas(filters?: { fecha?: string; start?: string; end?: string; location_id?: string | number } | string | number): Promise<Consulta[]> {
    const params = new URLSearchParams();
    
    if (typeof filters === 'number' || typeof filters === 'string') {
      if (filters !== 'all') {
        params.append('location_id', String(filters));
      }
    } else if (filters) {
      if (filters.fecha) params.append('fecha', filters.fecha);
      if (filters.start && filters.end) {
        params.append('start', filters.start);
        params.append('end', filters.end);
      }
      if (filters.location_id && filters.location_id !== 'all') {
        params.append('location_id', String(filters.location_id));
      }
    }

    const url = `${BASE_URL}/consultas${params.toString() ? `?${params.toString()}` : ''}`;
    if (isDemoHost) return mockStorage.getConsultas();
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar consultas');
      return await res.json();
    } catch {
      return mockStorage.getConsultas();
    }
  },

  async getPatientConsultas(patientId: number): Promise<Consulta[]> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/consultas`);
    if (!res.ok) throw new Error('Error al cargar consultas del paciente');
    return res.json();
  },

  async createConsulta(consulta: Partial<Consulta>): Promise<Consulta> {
    const res = await fetch(`${BASE_URL}/consultas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consulta),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Error al agendar cita');
    return data;
  },

  async updateConsulta(id: number, consulta: Partial<Consulta>): Promise<void> {
    const res = await fetch(`${BASE_URL}/consultas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consulta),
    });
    if (!res.ok) throw new Error('Error al actualizar cita');
  },

  async deleteConsulta(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/consultas/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar cita');
  },

  // Recetas Médicas / Odontológicas
  async getRecetas(locationId?: string | number): Promise<RecetaMedica[]> {
    const url = locationId && locationId !== 'all' 
      ? `${BASE_URL}/recetas?location_id=${locationId}`
      : `${BASE_URL}/recetas`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar recetas');
    return res.json();
  },

  async getPatientRecetas(patientId: number): Promise<RecetaMedica[]> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/recetas`);
    if (!res.ok) throw new Error('Error al cargar recetas del paciente');
    return res.json();
  },

  async getReceta(id: number): Promise<RecetaMedica> {
    const res = await fetch(`${BASE_URL}/recetas/${id}`);
    if (!res.ok) throw new Error('Error al cargar receta médica');
    return res.json();
  },

  async createReceta(patientId: number, data: Partial<RecetaMedica>): Promise<RecetaMedica> {
    const res = await fetch(`${BASE_URL}/patients/${patientId}/recetas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al generar receta médica');
    return res.json();
  },

  async deleteReceta(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/recetas/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar receta médica');
  },

  // --- LICENCIAS & PASARELA DE PAGO ---
  async getLicenciaStatus(): Promise<LicenciaStatus> {
    if (isDemoHost) return mockStorage.getLicencia();
    try {
      const res = await fetch(`${BASE_URL}/licencia/status`);
      if (!res.ok) throw new Error('Error al verificar estado de la licencia');
      return await res.json();
    } catch {
      return mockStorage.getLicencia();
    }
  },

  async activateLicencia(token: string): Promise<{ success: boolean; message: string; licencia: LicenciaStatus }> {
    const res = await fetch(`${BASE_URL}/licencia/activar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al activar clave de licencia');
    return data;
  },

  async activateDemoLicencia(titular?: string, email?: string): Promise<{ success: boolean; message: string; licencia: LicenciaStatus }> {
    const res = await fetch(`${BASE_URL}/licencia/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titular, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al activar demo');
    return data;
  },

  async checkoutLicencia(payload: {
    plan: 'MENSUAL' | 'ANUAL' | 'PRUEBA_REAL';
    titular: string;
    email: string;
    pasarela?: string;
    autoRenovar?: boolean;
  }): Promise<{ success: boolean; message: string; transactionId: string; licencia: LicenciaStatus; monto: number }> {
    if (isDemoHost) {
      const monto = payload.plan === 'ANUAL' ? 4990 : (payload.plan === 'PRUEBA_REAL' ? 10 : 499);
      const updated = mockStorage.updateLicencia({
        valid: true,
        expired: false,
        isReadOnly: false,
        daysRemaining: payload.plan === 'ANUAL' ? 365 : (payload.plan === 'PRUEBA_REAL' ? 7 : 30),
        fecha_expiracion: '2027-11-06'
      });
      return {
        success: true,
        message: `¡Pago exitoso de $${monto} MXN en Modo Demo! Licencia activada hasta el 2027-11-06.`,
        transactionId: `demo_tx_${Date.now()}`,
        monto,
        licencia: updated
      };
    }
    const res = await fetch(`${BASE_URL}/licencia/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al procesar pago');
    return data;
  },

  async simulateLicenseState(modo: 'activa' | 'vencida' | 'sin_licencia'): Promise<{ success: boolean; status: LicenciaStatus }> {
    const res = await fetch(`${BASE_URL}/licencia/simular-estado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cambiar simulación');
    return data;
  },

  async generateLicenseKey(payload: {
    titular: string;
    email: string;
    tipo: string;
    dias: number;
    sucursales_max: number;
  }): Promise<{ success: boolean; token: string; titular: string; tipo: string; fecha_expiracion: string; dias_duracion: number }> {
    const res = await fetch(`${BASE_URL}/licencia/generar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al generar licencia');
    return data;
  },

  async checkUpdates(): Promise<SoftwareUpdateInfo> {
    const res = await fetch(`${BASE_URL}/licencia/updates/check`);
    if (!res.ok) throw new Error('Error al verificar actualizaciones');
    return res.json();
  },

  async exportFullData(): Promise<void> {
    const res = await fetch(`${BASE_URL}/licencia/export`);
    if (!res.ok) throw new Error('Error al generar respaldo clínico');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `konenekoh_respaldo_clinico_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
