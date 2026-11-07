import React, { useState, useEffect } from 'react';
import { Patient, Presupuesto, Consentimiento, Tratamiento, ClinicaConfig } from '../../types';
import { api } from '../../services/api';
import { PresupuestoDetail } from './PresupuestoDetail';
import { 
  Plus, FileText, Mail, Trash2, Edit3, Eye, 
  CheckSquare, Activity, Calendar, FileCheck 
} from 'lucide-react';

interface PresupuestosModuleProps {
  patient: Patient;
  tratamientos: Tratamiento[];
  clinicaConfig?: ClinicaConfig;
  onRefreshAll?: () => void;
}

export const PresupuestosModule: React.FC<PresupuestosModuleProps> = ({
  patient,
  tratamientos,
  clinicaConfig,
  onRefreshAll,
}) => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePresupuestoId, setActivePresupuestoId] = useState<number | null>(null);

  // New Consentimiento modal
  const [showNewConsent, setShowNewConsent] = useState<boolean>(false);
  const [consentCategoria, setConsentCategoria] = useState<string>('Pediatría');

  useEffect(() => {
    loadData();
  }, [patient.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [presList, consentList] = await Promise.all([
        api.getPresupuestos(patient.id),
        api.getConsentimientos(patient.id),
      ]);
      setPresupuestos(presList);
      setConsentimientos(consentList);
    } catch (err) {
      console.error('Error al cargar presupuestos y consentimientos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewPresupuesto = async () => {
    try {
      const folio = `ODO${Math.floor(100 + Math.random() * 900)}`;
      const fecha = new Date().toISOString().split('T')[0];
      const res = await api.createPresupuesto(patient.id, {
        folio,
        fecha,
        titulo: 'Nuevo Presupuesto y Odontograma',
        total: 0,
        tipo_denticion: 'mixto',
        items: [],
        odontograma_data: {},
      });
      await loadData();
      setActivePresupuestoId(res.id);
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      console.error('Error al crear presupuesto:', err);
    }
  };

  const handleDeletePresupuesto = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este presupuesto y su odontograma asociado?')) return;
    try {
      await api.deletePresupuesto(id);
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      console.error('Error al eliminar presupuesto:', err);
    }
  };

  const handleCreateConsentimiento = async () => {
    try {
      const folio = `CI${Math.floor(10 + Math.random() * 90)}`;
      const fecha = new Date().toISOString().split('T')[0];
      await api.createConsentimiento(patient.id, {
        folio,
        fecha,
        categoria: consentCategoria,
        firmado: 1,
      });
      setShowNewConsent(false);
      await loadData();
    } catch (err) {
      console.error('Error al crear consentimiento:', err);
    }
  };

  if (activePresupuestoId) {
    return (
      <PresupuestoDetail
        presupuestoId={activePresupuestoId}
        patient={patient}
        tratamientos={tratamientos}
        clinicaConfig={clinicaConfig}
        onBack={() => {
          setActivePresupuestoId(null);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }}
        onUpdate={() => {
          loadData();
          if (onRefreshAll) onRefreshAll();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header Buttons matching FileMaker Screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCreateNewPresupuesto}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-2 transition-all hover:shadow"
          >
            <Plus size={16} />
            <span>+ Odontograma</span>
          </button>

          <button
            type="button"
            onClick={() => alert('Módulo de Examen Bucal: Registra examen de tejidos blandos, mucosa, lengua y periodonto.')}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-2 transition-all"
          >
            <Plus size={16} />
            <span>+ Examen Bucal</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewConsent(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-2 transition-all"
          >
            <Plus size={16} />
            <span>+ Consentimiento</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          Expediente: <span className="text-cyan-700 font-black">{patient.expediente}</span>
        </div>
      </div>

      {/* Section 1: Odontogramas & Presupuestos Table (Matches FileMaker layout) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 px-4 py-3 border-b border-cyan-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-cyan-900 flex items-center space-x-2">
            <span>🦷</span>
            <span>Odontogramas & Presupuestos Registrados</span>
          </h3>
          <span className="text-xs font-bold bg-cyan-200/60 text-cyan-800 px-2 py-0.5 rounded-full">
            {presupuestos.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#48cae4]/20 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">ID / Folio</th>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Título</th>
                <th className="py-2.5 px-4 text-center">Tratamientos</th>
                <th className="py-2.5 px-4 text-right">Total Presupuestado</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
                <th className="py-2.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    Cargando odontogramas...
                  </td>
                </tr>
              ) : presupuestos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No hay odontogramas registrados para este paciente.
                    <br />
                    Haz clic en <strong className="text-cyan-700">+ Odontograma</strong> para crear el primero.
                  </td>
                </tr>
              ) : (
                presupuestos.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-cyan-50/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-black text-cyan-800">{p.folio}</td>
                    <td className="py-3 px-4 font-mono">{p.fecha}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.titulo || 'Presupuesto'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">
                        {p.total_items || 0} ítems
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono text-sm">
                      ${p.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.estado === 'Completado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.estado === 'Aprobado'
                            ? 'bg-cyan-100 text-cyan-800'
                            : p.estado === 'En proceso'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Open Odontogram Editor */}
                        <button
                          type="button"
                          onClick={() => setActivePresupuestoId(p.id)}
                          className="p-1.5 text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-all"
                          title="Abrir Odontograma y Presupuesto"
                        >
                          🦷
                        </button>

                        {/* Print / PDF icon */}
                        <button
                          type="button"
                          onClick={() => setActivePresupuestoId(p.id)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          title="Ver / Imprimir Presupuesto"
                        >
                          <FileText size={15} />
                        </button>

                        {/* WhatsApp / Email quote */}
                        <button
                          type="button"
                          onClick={() => {
                            const text = `Hola ${patient.nombre}, le compartimos su presupuesto ${p.folio} de KoneneKoh por un total de $${p.total.toFixed(2)} MXN.`;
                            window.open(`https://wa.me/52${patient.celular}?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Enviar por WhatsApp"
                        >
                          <Mail size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeletePresupuesto(p.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Examen Bucal */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#48cae4]/15 px-4 py-2.5 border-b border-cyan-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Examen Bucal</h3>
        </div>
        <div className="p-4 text-xs text-slate-400 text-center">
          No hay exámenes bucales adicionales registrados. (Pulsa "+ Examen Bucal" para registrar evaluación de mucosa y periodonto).
        </div>
      </div>

      {/* Section 3: Consentimientos Informados (Matches FileMaker CI058, CI059) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#48cae4]/15 px-4 py-2.5 border-b border-cyan-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Consentimientos Informados</h3>
          <span className="text-[11px] font-bold text-cyan-800">{consentimientos.length} documentos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2 px-4 w-12">#</th>
                <th className="py-2 px-4">Folio</th>
                <th className="py-2 px-4">Fecha</th>
                <th className="py-2 px-4">Categoría Especialidad</th>
                <th className="py-2 px-4 text-center">Estatus Firma</th>
                <th className="py-2 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {consentimientos.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-bold text-cyan-700">{c.folio}</td>
                  <td className="py-2.5 px-4 font-mono">{c.fecha}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{c.categoria}</td>
                  <td className="py-2.5 px-4 text-center">
                    {c.firmado ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckSquare size={12} className="mr-1" /> Firmado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Pendiente firma
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => alert(`Consentimiento ${c.folio} (${c.categoria}) para ${patient.nombre}. Listo para imprimir o firmar digitalmente.`)}
                      className="text-cyan-700 hover:text-cyan-900 p-1 rounded hover:bg-cyan-50"
                      title="Ver / Imprimir Consentimiento"
                    >
                      <FileCheck size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Consent Modal */}
      {showNewConsent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-800">Nuevo Consentimiento Informado</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidad / Categoría</label>
              <select
                value={consentCategoria}
                onChange={(e) => setConsentCategoria(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
              >
                <option value="Pediatría">Pediatría</option>
                <option value="Ortodoncia">Ortodoncia</option>
                <option value="Cirugía Bucal">Cirugía Bucal</option>
                <option value="Endodoncia">Endodoncia</option>
                <option value="Rehabilitación y Prótesis">Rehabilitación y Prótesis</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewConsent(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateConsentimiento}
                className="px-4 py-2 text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 rounded-lg"
              >
                Crear Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
