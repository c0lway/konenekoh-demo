import React, { useState, useEffect } from 'react';
import { Presupuesto, PresupuestoItem, OdontogramState, Tratamiento, Patient, ClinicaConfig } from '../../types';
import { OdontogramaView } from '../Odontograma/OdontogramaView';
import { api } from '../../services/api';
import { PresupuestoPrintModal } from './PresupuestoPrintModal';
import { 
  ArrowLeft, Save, Printer, Plus, Trash2, CheckCircle, Clock, 
  AlertCircle, DollarSign, FileText, Check, ShieldCheck 
} from 'lucide-react';

interface PresupuestoDetailProps {
  presupuestoId: number;
  patient: Patient;
  tratamientos: Tratamiento[];
  clinicaConfig?: ClinicaConfig;
  onBack: () => void;
  onUpdate: () => void;
}

export const PresupuestoDetail: React.FC<PresupuestoDetailProps> = ({
  presupuestoId,
  patient,
  tratamientos,
  clinicaConfig,
  onBack,
  onUpdate,
}) => {
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [config, setConfig] = useState<ClinicaConfig>(clinicaConfig || {
    nombre_comercial: 'KoneneKoh Smile Maker',
    eslogan: 'Odontopediatría & Ortodoncia Especializada',
    direccion: 'Av. Candiles 512, Col. Candiles, Corregidora, Qro.',
    telefono: '442 237 1299',
    responsable_sanitario: 'Dra. Rebeca Aguilar Ramos',
    cedula_profesional: 'Céd. Prof. 8472910 UNAM',
  });

  // Form fields
  const [titulo, setTitulo] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [estado, setEstado] = useState<'Presupuestado' | 'Aprobado' | 'En proceso' | 'Completado'>('Presupuestado');
  const [tipoDenticion, setTipoDenticion] = useState<'adulto' | 'pediatrico' | 'mixto'>('mixto');
  const [items, setItems] = useState<PresupuestoItem[]>([]);
  const [odontogramaData, setOdontogramaData] = useState<OdontogramState>({});

  // Manual item addition form
  const [showAddManual, setShowAddManual] = useState<boolean>(false);
  const [manualDesc, setManualDesc] = useState<string>('');
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [manualTooth, setManualTooth] = useState<string>('');

  useEffect(() => {
    loadPresupuesto();
    if (!clinicaConfig) {
      api.getClinicaConfig().then(c => setConfig(c)).catch(() => {});
    }
  }, [presupuestoId, clinicaConfig]);

  const loadPresupuesto = async () => {
    try {
      setLoading(true);
      const data = await api.getPresupuesto(presupuestoId);
      setPresupuesto(data);
      setTitulo(data.titulo || 'Presupuesto Odontológico');
      setObservaciones(data.observaciones || '');
      setEstado(data.estado);
      setTipoDenticion(data.tipo_denticion || 'mixto');
      setItems(data.items || []);
      setOdontogramaData(data.odontograma?.dientes || {});
    } catch (err) {
      console.error('Error al cargar presupuesto:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemFromOdontogram = (newItem: PresupuestoItem) => {
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleItemStatus = async (item: PresupuestoItem, index: number) => {
    const nextStatus: Record<string, 'Pendiente' | 'En proceso' | 'Realizado'> = {
      Pendiente: 'En proceso',
      'En proceso': 'Realizado',
      Realizado: 'Pendiente',
    };
    const updatedStatus = nextStatus[item.estado] || 'Pendiente';

    const updatedItems = [...items];
    updatedItems[index] = { ...item, estado: updatedStatus };
    setItems(updatedItems);

    if (item.id) {
      try {
        await api.updateItemStatus(item.id, updatedStatus);
      } catch (err) {
        console.error('Error al actualizar estado:', err);
      }
    }
  };

  const handleAddManualItem = () => {
    if (!manualDesc || manualPrice <= 0) return;
    const newItem: PresupuestoItem = {
      diente: manualTooth ? parseInt(manualTooth, 10) : null,
      superficie: manualTooth ? 'General' : '',
      descripcion: manualDesc,
      precio_unitario: manualPrice,
      cantidad: 1,
      descuento: 0,
      total: manualPrice,
      estado: 'Pendiente',
    };
    setItems((prev) => [...prev, newItem]);
    setManualDesc('');
    setManualPrice(0);
    setManualTooth('');
    setShowAddManual(false);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.precio_unitario * (item.cantidad || 1)), 0);
  };

  const calculateDescuentoTotal = () => {
    return items.reduce((sum, item) => sum + (item.descuento || 0), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const total = calculateTotal();
      await api.updatePresupuesto(presupuestoId, {
        titulo,
        observaciones,
        total,
        descuento: calculateDescuentoTotal(),
        estado,
        tipo_denticion: tipoDenticion,
        items,
        odontograma_data: odontogramaData,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onUpdate();
    } catch (err) {
      console.error('Error al guardar presupuesto:', err);
      alert('Error al guardar presupuesto');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin mr-3">⌛</div> Cargando presupuesto...
      </div>
    );
  }

  if (!presupuesto) return null;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-cyan-100 text-cyan-800 text-xs font-black px-2.5 py-1 rounded-md">
                {presupuesto.folio}
              </span>
              <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
            </div>
            <p className="text-xs text-slate-500">
              Paciente: <span className="font-semibold text-slate-700">{patient.nombre}</span> ({patient.expediente}) • Fecha: {presupuesto.fecha}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <Check size={14} className="mr-1" /> Guardado exitosamente
            </span>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5"
          >
            <Printer size={16} />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Save size={16} />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Odontogram */}
      <OdontogramaView
        odontogramData={odontogramaData}
        onChangeOdontogram={setOdontogramaData}
        onAddPresupuestoItem={handleAddItemFromOdontogram}
        tratamientos={tratamientos}
        tipoDenticion={tipoDenticion}
        onChangeDenticion={setTipoDenticion}
      />

      {/* Items & Budget Details Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <FileText size={18} className="text-cyan-600" />
              <span>Detalle del Presupuesto & Plan de Tratamiento</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tratamientos generados desde el odontograma y procedimientos generales
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600">Estado:</span>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Presupuestado">Presupuestado</option>
                <option value="Aprobado">Aprobado</option>
                <option value="En proceso">En proceso</option>
                <option value="Completado">Completado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAddManual(!showAddManual)}
              className="px-3 py-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg flex items-center space-x-1 border border-cyan-200"
            >
              <Plus size={14} />
              <span>Añadir Concepto General</span>
            </button>
          </div>
        </div>

        {/* Manual item addition banner */}
        {showAddManual && (
          <div className="bg-cyan-50/60 p-4 rounded-xl border border-cyan-200 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción</label>
              <input
                type="text"
                placeholder="Ej. Profilaxis y limpieza profunda"
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>
            <div className="w-28">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Diente (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. 16"
                value={manualTooth}
                onChange={(e) => setManualTooth(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>
            <div className="w-32">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Precio ($ MXN)</label>
              <input
                type="number"
                placeholder="0.00"
                value={manualPrice || ''}
                onChange={(e) => setManualPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>
            <div className="pt-5">
              <button
                type="button"
                onClick={handleAddManualItem}
                className="px-4 py-2 text-xs font-bold bg-cyan-600 text-white rounded-lg shadow-sm hover:bg-cyan-700"
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Pieza / Diente</th>
                <th className="py-2.5 px-3">Superficie</th>
                <th className="py-2.5 px-3">Descripción Tratamiento</th>
                <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                <th className="py-2.5 px-3 text-right">Cant.</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Seguimiento / Estatus</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No hay tratamientos añadidos en este presupuesto.
                    <br />
                    Haz clic en cualquier diente del odontograma superior para seleccionarlo y agregarlo.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="py-3 px-3">
                      {it.diente ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-cyan-100 text-cyan-800">
                          Diente {it.diente}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">General</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {it.superficie ? (
                        <span className="font-mono font-bold text-slate-700">{it.superficie}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{it.descripcion}</td>
                    <td className="py-3 px-3 text-right font-mono">${it.precio_unitario.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono">{it.cantidad || 1}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ${it.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleItemStatus(it, idx)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                          it.estado === 'Realizado'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : it.estado === 'En proceso'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Haz clic para alternar estatus (Pendiente -> En proceso -> Realizado)"
                      >
                        {it.estado === 'Realizado' && <CheckCircle size={12} className="mr-1 text-emerald-600" />}
                        {it.estado === 'En proceso' && <Clock size={12} className="mr-1 text-blue-600" />}
                        {it.estado === 'Pendiente' && <AlertCircle size={12} className="mr-1 text-amber-600" />}
                        <span>{it.estado}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                        title="Eliminar concepto"
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

        {/* Financial Summary Calculation Cards */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-4 border-t border-slate-100 gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas / Observaciones Clínicas</label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Instrucciones al paciente, plan de citas, garantías..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="w-full md:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Descuento:</span>
              <span className="font-mono font-semibold text-emerald-600">-${calculateDescuentoTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>TOTAL:</span>
              <span className="text-cyan-700 font-mono">${calculateTotal().toFixed(2)} MXN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Impresión Formal con Membrete y Logotipo */}
      {presupuesto && (
        <PresupuestoPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          presupuesto={presupuesto}
          items={items}
          patient={patient}
          clinicaConfig={config}
        />
      )}
    </div>
  );
};
