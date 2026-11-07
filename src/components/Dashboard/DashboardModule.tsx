import React, { useState, useEffect } from 'react';
import { DashboardData, Location, Consulta } from '../../types';
import { api } from '../../services/api';
import { 
  BarChart3, Building2, MapPin, Users, Calendar, 
  DollarSign, TrendingUp, Clock, AlertCircle, 
  CheckCircle, ArrowRight, Phone, RefreshCw, Sparkles, Activity,
  Package, AlertTriangle
} from 'lucide-react';

interface DashboardModuleProps {
  locations: Location[];
  activeLocationId: string | number;
  onSelectLocation: (locId: string | number) => void;
  onNavigateToPatient?: (patientId: number) => void;
  onNavigateToCalendar?: () => void;
  onNavigateToInventario?: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  locations,
  activeLocationId,
  onSelectLocation,
  onNavigateToPatient,
  onNavigateToCalendar,
  onNavigateToInventario,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboard();
  }, [activeLocationId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashData = await api.getDashboard(activeLocationId);
      setData(dashData);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const isGlobal = activeLocationId === 'all';
  const activeLocation = locations.find(l => l.id === Number(activeLocationId));

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 space-x-3">
        <RefreshCw size={24} className="animate-spin text-cyan-600" />
        <span className="text-sm font-semibold">Cargando métricas del dashboard...</span>
      </div>
    );
  }

  const { kpis, citas_hoy, sedes_breakdown } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header with Location Navigation Switcher */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-sm font-black">
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-800">
                {isGlobal ? 'Dashboard General (Red KoneneKoh)' : `Dashboard: ${activeLocation?.nombre}`}
              </h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isGlobal 
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {isGlobal ? 'Consolidado Global' : `Sede ${activeLocation?.codigo}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isGlobal
                ? 'Monitoreo consolidado de pacientes, citas e ingresos en todas las sucursales'
                : `${activeLocation?.direccion} • Tel: ${activeLocation?.telefono}`}
            </p>
          </div>
        </div>

        {/* Location Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => onSelectLocation('all')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 ${
              isGlobal
                ? 'bg-white text-cyan-900 shadow-xs'
                : 'text-slate-600 hover:text-cyan-800'
            }`}
          >
            <span>🌐 Red Global</span>
          </button>

          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelectLocation(loc.id)}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 ${
                !isGlobal && activeLocationId === loc.id
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-cyan-400'
                  : 'text-slate-600 hover:text-cyan-800'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: loc.color }}
              ></span>
              <span>{loc.codigo}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pacientes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Pacientes Asignados</span>
            <Users size={18} className="text-cyan-600" />
          </div>
          <div className="text-3xl font-black text-slate-800 mt-2 font-mono">
            {kpis.total_pacientes}
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 mt-2">
            <CheckCircle size={14} />
            <span>{kpis.pacientes_activos} activos en expediente</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
        </div>

        {/* Citas de Hoy */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Citas Agendadas Hoy</span>
            <Calendar size={18} className="text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-800 mt-2 font-mono">
            {kpis.citas_hoy}
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold mt-2">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {kpis.en_atencion} en sillón
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {kpis.en_espera} en sala
            </span>
          </div>
        </div>

        {/* Total Presupuestado */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Presupuestado</span>
            <DollarSign size={18} className="text-cyan-600" />
          </div>
          <div className="text-3xl font-black text-slate-800 mt-2 font-mono">
            ${kpis.total_presupuestado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-bold text-slate-400 mt-2">
            Monto acumulado por tratamientos
          </div>
        </div>

        {/* Cobranza & Saldo */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Cobranza Recaudada</span>
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2 font-mono">
            ${kpis.total_pagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-bold text-rose-600 mt-2 flex items-center space-x-1">
            <span>Saldo por cobrar: ${kpis.saldo_pendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* 2b. Inventario Sede / Red Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white rounded-3xl p-5 border border-slate-700/60 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center font-bold">
            <Package size={22} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-black text-sm text-white">
                {isGlobal ? 'Inventario de Insumos & Materiales (Toda la Red)' : `Inventario Sede: ${activeLocation?.nombre}`}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/30">
                {kpis.total_skus || 13} SKUs
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Valor de existencias almacenadas: <span className="font-mono font-bold text-emerald-400">${(kpis.valor_inventario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              {(kpis.productos_bajo_stock || 0) > 0 && (
                <span className="ml-2 font-bold text-rose-400">
                  • ⚠️ {kpis.productos_bajo_stock} insumos en nivel bajo / reorden
                </span>
              )}
            </p>
          </div>
        </div>

        {onNavigateToInventario && (
          <button
            type="button"
            onClick={onNavigateToInventario}
            className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
          >
            <span>Gestionar Inventario {isGlobal ? 'Global' : activeLocation?.codigo}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* 3. MULTI-SEDE BREAKDOWN (Visible on Global Dashboard or comparison) */}
      {isGlobal && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
                <Building2 size={19} className="text-cyan-700" />
                <span>Rendimiento y Comparativa por Ubicación</span>
              </h3>
              <p className="text-xs text-slate-500">Distribución de pacientes, citas e ingresos en cada sede clínica</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sedes_breakdown.map((sede) => {
              const porcentajePacientes = kpis.total_pacientes > 0
                ? Math.round((sede.pacientes_count / kpis.total_pacientes) * 100)
                : 0;

              return (
                <div
                  key={sede.id}
                  className="bg-slate-50/70 hover:bg-cyan-50/30 p-4 rounded-2xl border border-slate-200 hover:border-cyan-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono text-cyan-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        {sede.codigo}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {sede.citas_hoy_count} citas hoy
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 leading-tight">
                      {sede.nombre}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      📍 {sede.direccion}
                    </p>
                  </div>

                  {/* Metrics bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-600">Pacientes:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {sede.pacientes_count} ({porcentajePacientes}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${porcentajePacientes}%`, backgroundColor: sede.color }}
                      ></div>
                    </div>

                    <div className="flex justify-between font-semibold text-[11px]">
                      <span className="text-slate-500">Cobranza:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ${sede.ingresos_cobrados.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between font-semibold text-[11px] pt-0.5 border-t border-slate-100">
                      <span className="text-slate-500">Inventario en Sede:</span>
                      <span className="font-mono font-bold text-slate-800">
                        ${(sede.valor_inventario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        {(sede.articulos_bajo_stock || 0) > 0 && (
                          <span className="ml-1 text-[10px] text-rose-600 font-black">
                            ({sede.articulos_bajo_stock} bajo stock)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectLocation(sede.id)}
                    className="w-full py-2 bg-white hover:bg-cyan-600 hover:text-white text-cyan-800 text-xs font-bold rounded-xl border border-cyan-200 transition-all flex items-center justify-center space-x-1 shadow-2xs"
                  >
                    <span>Ver Dashboard de esta Sede</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TODAY'S AGENDA ON THIS LOCATION OR NETWORK */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
              <Clock size={19} className="text-cyan-700" />
              <span>Citas del Día en Sillones Clínicos</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isGlobal ? 'Flujo de pacientes hoy en toda la red' : `Flujo de pacientes en ${activeLocation?.nombre}`}
            </p>
          </div>

          {onNavigateToCalendar && (
            <button
              type="button"
              onClick={onNavigateToCalendar}
              className="px-3.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-xs rounded-xl border border-cyan-200 transition-colors flex items-center space-x-1"
            >
              <span>Abrir Calendario Completo</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {citas_hoy.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <Calendar size={32} className="mx-auto text-slate-300" />
            <p className="text-xs font-medium">No hay citas registradas para hoy en esta selección.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {citas_hoy.map((cita) => (
              <div
                key={cita.id}
                className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-cyan-300 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-mono text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    <Clock size={12} className="text-cyan-600" />
                    <span>{cita.hora_inicio} - {cita.hora_fin}</span>
                  </div>

                  {cita.location_codigo && (
                    <span
                      className="text-[10px] font-black text-white px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: cita.location_color || '#06b6d4' }}
                    >
                      {cita.location_codigo}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <img
                    src={cita.paciente_foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                    alt={cita.paciente_nombre}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-200 shadow-2xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div 
                      onClick={() => onNavigateToPatient && onNavigateToPatient(cita.patient_id)}
                      className="text-xs font-black text-slate-900 truncate hover:text-cyan-700 cursor-pointer"
                    >
                      {cita.paciente_nombre}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold font-mono">
                      {cita.paciente_expediente}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wide text-cyan-900">
                    Motivo:
                  </span>
                  <p className="text-xs font-semibold text-slate-700 truncate">{cita.motivo}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="font-bold text-slate-700">{cita.sillon}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    cita.estado === 'En atención'
                      ? 'bg-emerald-100 text-emerald-800'
                      : cita.estado === 'En espera'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-cyan-100 text-cyan-800'
                  }`}>
                    {cita.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
