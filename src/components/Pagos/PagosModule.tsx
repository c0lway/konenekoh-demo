import React, { useState, useEffect } from 'react';
import { Patient, PagosSummary, Pago } from '../../types';
import { api } from '../../services/api';
import { Plus, CreditCard, Banknote, DollarSign, Calendar, Trash2, ArrowDownCircle } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Top 3 Summary Cards matching FileMaker Screenshot 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
        {/* Total Presupuestado (Light Green box in FileMaker) */}
        <div className="bg-[#bbf7d0]/80 border border-[#86efac] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[#166534] uppercase tracking-wide">
            Total :
          </div>
          <div className="text-2xl font-black text-[#14532d] mt-1 font-mono">
            ${summary.total.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#166534]/80 mt-0.5">Suma de presupuestos aprobados</div>
        </div>

        {/* Total Pagado (Light Orange/Peach box in FileMaker) */}
        <div className="bg-[#fed7aa]/80 border border-[#fdba74] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[#9a3412] uppercase tracking-wide">
            Total Pagado:
          </div>
          <div className="text-2xl font-black text-[#7c2d12] mt-1 font-mono">
            ${summary.total_pagado.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#9a3412]/80 mt-0.5">Abonos recibidos</div>
        </div>

        {/* Saldo Pendiente (Pink box in FileMaker) */}
        <div className="bg-[#fbcfe8]/80 border border-[#f9a8d4] rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[#9d174d] uppercase tracking-wide">
            Saldo :
          </div>
          <div className="text-2xl font-black text-[#831843] mt-1 font-mono">
            ${summary.saldo.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#9d174d]/80 mt-0.5">Por liquidar</div>
        </div>

        {/* Añadir Pago Button matching FileMaker teal icon button */}
        <div className="flex items-center justify-start md:justify-center">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center space-x-2 transition-all hover:shadow-md"
          >
            <Banknote size={22} />
            <span className="text-sm">Añadir Pago</span>
          </button>
        </div>
      </div>

      {/* Ledger Table matching Screenshot 4 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#48cae4]/20 px-4 py-3 border-b border-cyan-100 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
            Historial de Pagos & Abonos
          </h3>
          <span className="text-xs font-semibold text-cyan-800">
            {summary.pagos.length} transacciones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#2ec4b6] text-white font-bold text-[11px]">
              <tr>
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">ID Pago</th>
                <th className="py-2.5 px-4">Fecha de Pago</th>
                <th className="py-2.5 px-4 text-right">Monto</th>
                <th className="py-2.5 px-4">Tipo Pago</th>
                <th className="py-2.5 px-4">Notas / Concepto</th>
                <th className="py-2.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Cargando historial de pagos...
                  </td>
                </tr>
              ) : summary.pagos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No hay pagos registrados para este paciente aún.
                  </td>
                </tr>
              ) : (
                summary.pagos.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-700">{p.folio_pago}</td>
                    <td className="py-3 px-4 font-mono">{p.fecha}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ${p.monto.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {p.tipo_pago}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.notas || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePago(p.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                        title="Eliminar pago"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Banknote className="text-teal-600" size={24} />
              <h3 className="font-bold text-base text-slate-800">Registrar Nuevo Pago</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monto ($ MXN)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="50"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || '')}
                  className="w-full pl-7 pr-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Pago</label>
                <select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Transferencia">Transferencia SPEI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notas / Concepto</label>
              <input
                type="text"
                placeholder="Ej. Anticipo resinas cuadrante 5"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddPago}
                className="px-4 py-2 text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-sm"
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
