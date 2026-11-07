import React, { useState, useEffect } from 'react';
import { Patient, PagosSummary, Pago } from '../../types';
import { api } from '../../services/api';
import { 
  Plus, CreditCard, Banknote, DollarSign, Calendar, Trash2, 
  ArrowDownCircle, CheckCircle2, AlertCircle, FileText, Wallet
} from 'lucide-react';

interface PagosModuleProps {
  patient: Patient;
}

export const PagosModule: React.FC<PagosModuleProps> = ({ patient }) => {
  const [summary, setSummary] = useState<PagosSummary>({ total: 0, total_pagado: 0, saldo: 0, pagos: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form
  const [monto, setMonto] = useState<number | ''>('');
  const [tipoPago, setTipoPago] = useState<string>('Efectivo');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState<string>('');

  useEffect(() => {
    loadPagos();
  }, [patient.id]);

  const loadPagos = async () => {
    try {
      setLoading(true);
      const data = await api.getPagosSummary(patient.id);
      setSummary(data);
    } catch (err) {
      console.error('Error al cargar pagos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPago = async () => {
    if (!monto || Number(monto) <= 0) {
      alert('Ingresa un monto válido');
      return;
    }
    try {
      await api.addPago(patient.id, {
        fecha,
        monto: Number(monto),
        tipo_pago: tipoPago,
        notas,
      });
      setShowAddModal(false);
      setMonto('');
      setNotas('');
      loadPagos();
    } catch (err) {
      console.error('Error al registrar pago:', err);
    }
  };

  const handleDeletePago = async (id: number) => {
    if (!confirm('¿Deseas eliminar este registro de pago?')) return;
    try {
      await api.deletePago(id);
      loadPagos();
    } catch (err) {
      console.error('Error al eliminar pago:', err);
    }
  };

  const isLiquidated = summary.saldo <= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. FINANCIAL SUMMARY KPI CARDS (Clean, Modern Aesthetics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Presupuestado */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Total Presupuestado
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Wallet size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ${summary.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Suma de tratamientos aprobados
            </div>
          </div>
        </div>

        {/* Total Pagado (Abonos) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
              Total Pagado
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              ${summary.total_pagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-800/80 font-semibold mt-0.5">
              {summary.pagos.length} abonos recibidos
            </div>
          </div>
        </div>

        {/* Saldo Pendiente */}
        <div className={`rounded-3xl p-5 border shadow-xs flex flex-col justify-between space-y-2 ${
          isLiquidated
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-amber-50/70 border-amber-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-wider ${
              isLiquidated ? 'text-emerald-800' : 'text-amber-900'
            }`}>
              Saldo Pendiente
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              isLiquidated ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-900'
            }`}>
              {isLiquidated ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono tracking-tight ${
              isLiquidated ? 'text-emerald-900' : 'text-amber-950'
            }`}>
              ${summary.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold mt-0.5">
              {isLiquidated ? (
                <span className="text-emerald-700">✓ Cuenta al corriente (Sin adeudo)</span>
              ) : (
                <span className="text-amber-800">Pendiente de liquidación</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: Añadir Pago */}
        <div className="sm:col-span-3 lg:col-span-1 flex items-center">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full h-full min-h-[96px] bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs sm:text-sm rounded-3xl shadow-xs hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center space-y-1.5 p-4"
          >
            <Banknote size={24} />
            <span>+ Registrar Abono</span>
          </button>
        </div>
      </div>

      {/* 2. LEDGER TABLE (Modern Financial Table) */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide text-slate-800">
              Historial de Pagos & Recibos de Abono
            </h3>
            <p className="text-xs text-slate-400">
              Registro contable de anticipos, liquidaciones y formas de pago
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {summary.pagos.length} movimientos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5 w-12">#</th>
                <th className="py-3 px-5">Folio Recibo</th>
                <th className="py-3 px-5">Fecha</th>
                <th className="py-3 px-5 text-right">Monto</th>
                <th className="py-3 px-5">Método de Pago</th>
                <th className="py-3 px-5">Concepto / Notas</th>
                <th className="py-3 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Cargando historial financiero...
                  </td>
                </tr>
              ) : summary.pagos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                    <Banknote size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">No hay abonos registrados para este paciente aún.</p>
                  </td>
                </tr>
              ) : (
                summary.pagos.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-cyan-50/20 transition-colors">
                    <td className="py-3.5 px-5 text-slate-400 font-bold font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-5 font-mono font-black text-cyan-800">
                      {p.folio_pago}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">{p.fecha}</td>
                    <td className="py-3.5 px-5 text-right font-mono font-black text-slate-900 text-sm">
                      ${p.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {p.tipo_pago}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate">
                      {p.notas || 'Abono a tratamiento'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeletePago(p.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Eliminar registro de pago"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ADD PAYMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Banknote size={18} />
              </div>
              <h3 className="font-black text-base text-slate-900">Registrar Pago / Abono</h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Monto a Recibir ($ MXN) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-black text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    step="50"
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || '')}
                    className="w-full pl-8 pr-3 py-2.5 text-base font-black font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00b4d8] bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={tipoPago}
                    onChange={(e) => setTipoPago(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Transferencia SPEI">Transferencia SPEI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Fecha del Pago
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Notas o Concepto de Abono
                </label>
                <input
                  type="text"
                  placeholder="Ej. Anticipo resinas cuadrante superior"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddPago}
                className="px-5 py-2.5 text-xs font-black bg-[#10b981] hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-all active:scale-95"
              >
                Registrar Abono
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
