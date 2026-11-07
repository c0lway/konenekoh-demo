import React, { useState, useEffect } from 'react';
import { Patient, RecetaMedica, MedicamentoItem, ClinicaConfig, Location } from '../../types';
import { api } from '../../services/api';
import { RecetaPrintModal } from './RecetaPrintModal';
import { 
  Plus, Pill, Printer, Trash2, Calendar, User, FileText, 
  AlertTriangle, ShieldCheck, Check, Sparkles, Stethoscope, Clock
} from 'lucide-react';

interface RecetasModuleProps {
  patient: Patient;
  clinicaConfig: ClinicaConfig;
  locations: Location[];
  onRefreshAll?: () => void;
}

export const RecetasModule: React.FC<RecetasModuleProps> = ({
  patient,
  clinicaConfig,
  locations,
  onRefreshAll,
}) => {
  const [recetas, setRecetas] = useState<RecetaMedica[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRecetaForPrint, setSelectedRecetaForPrint] = useState<RecetaMedica | null>(null);

  // New prescription modal
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [folio, setFolio] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [doctor, setDoctor] = useState<string>(clinicaConfig.responsable_sanitario || 'Dra. Rebeca Aguilar Ramos');
  const [cedula, setCedula] = useState<string>(clinicaConfig.cedula_profesional || 'Céd. Prof. 8472910 UNAM');
  const [diagnostico, setDiagnostico] = useState<string>('');
  const [peso, setPeso] = useState<string>('');
  const [talla, setTalla] = useState<string>('');
  const [temperatura, setTemperatura] = useState<string>('36.6 °C');
  const [alergias, setAlergias] = useState<string>('Negadas');
  const [locationId, setLocationId] = useState<number>(patient.location_id || 1);
  const [indicacionesGenerales, setIndicacionesGenerales] = useState<string>('');
  const [medicamentos, setMedicamentos] = useState<MedicamentoItem[]>([]);

  // Manual medication item fields
  const [medNombre, setMedNombre] = useState<string>('');
  const [medDosis, setMedDosis] = useState<string>('');
  const [medDuracion, setMedDuracion] = useState<string>('');
  const [medIndicacion, setMedIndicacion] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Dental Rx Presets
  const DENTAL_PRESETS = [
    {
      nombre: 'Amoxicilina suspensión 250mg/5ml',
      dosis: '5 ml cada 8 horas',
      duracion: '7 días',
      indicacion: 'Tomar después de alimentos. Completar esquema de 7 días.'
    },
    {
      nombre: 'Amoxicilina + Ácido Clavulánico 250/62.5mg',
      dosis: '5 ml cada 8 horas',
      duracion: '7 días',
      indicacion: 'Tomar al inicio de las comidas.'
    },
    {
      nombre: 'Ibuprofeno jarabe 100mg/5ml',
      dosis: '5 ml cada 8 horas',
      duracion: '3 días',
      indicacion: 'En caso de dolor dental o inflamación.'
    },
    {
      nombre: 'Paracetamol jarabe 120mg/5ml',
      dosis: '5 ml cada 6 a 8 horas',
      duracion: '3 días',
      indicacion: 'Para control de dolor o fiebre.'
    },
    {
      nombre: 'Ibuprofeno tabletas 400mg',
      dosis: '1 tableta cada 8 horas',
      duracion: '3 a 5 días',
      indicacion: 'Tomar con abundante agua después de alimentos.'
    },
    {
      nombre: 'Ketorolaco sublingual 10mg',
      dosis: '1 tableta sublingual cada 8 horas',
      duracion: '2 a 3 días',
      indicacion: 'Disolver debajo de la lengua en dolor agudo moderado a severo.'
    },
    {
      nombre: 'Clorhexidina al 0.12% colutorio',
      dosis: '15 ml de enjuague durante 1 minuto',
      duracion: '7 días',
      indicacion: 'Enjuagar cada 12 horas después del cepillado. No ingerir.'
    },
    {
      nombre: 'Clindamicina 300mg cápsulas',
      dosis: '1 cápsula cada 8 horas',
      duracion: '7 días',
      indicacion: 'Para infección dental en alérgicos a penicilinas.'
    }
  ];

  useEffect(() => {
    loadRecetas();
  }, [patient.id]);

  const loadRecetas = async () => {
    try {
      setLoading(true);
      const data = await api.getPatientRecetas(patient.id);
      setRecetas(data);
    } catch (err) {
      console.error('Error al cargar recetas:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNewRecetaModal = () => {
    const randomFolio = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setFolio(randomFolio);
    setFecha(new Date().toISOString().split('T')[0]);
    setDoctor(clinicaConfig.responsable_sanitario || 'Dra. Rebeca Aguilar Ramos');
    setCedula(clinicaConfig.cedula_profesional || 'Céd. Prof. 8472910 UNAM');
    setDiagnostico('');
    setPeso('');
    setTalla('');
    setTemperatura('36.6 °C');
    setAlergias('Negadas');
    setLocationId(patient.location_id || 1);
    setIndicacionesGenerales('Mantener higiene bucal adecuada con cepillado suave en la zona tratada. Dieta blanda las primeras 24 horas y evitar alimentos calientes o irritantes.');
    setMedicamentos([]);
    setMedNombre('');
    setMedDosis('');
    setMedDuracion('');
    setMedIndicacion('');
    setShowNewModal(true);
  };

  const handleAddPreset = (preset: typeof DENTAL_PRESETS[0]) => {
    setMedicamentos((prev) => [...prev, { ...preset }]);
  };

  const handleAddManualMed = () => {
    if (!medNombre || !medDosis) {
      alert('Ingresa al menos el nombre del medicamento y la dosis');
      return;
    }
    setMedicamentos((prev) => [
      ...prev,
      {
        nombre: medNombre,
        dosis: medDosis,
        duracion: medDuracion,
        indicacion: medIndicacion,
      }
    ]);
    setMedNombre('');
    setMedDosis('');
    setMedDuracion('');
    setMedIndicacion('');
  };

  const handleRemoveMed = (index: number) => {
    setMedicamentos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (medicamentos.length === 0) {
      alert('Agrega al menos un medicamento a la receta médica');
      return;
    }

    try {
      setSaving(true);
      const created = await api.createReceta(patient.id, {
        folio,
        fecha,
        doctor,
        cedula,
        diagnostico,
        peso,
        talla,
        temperatura,
        alergias,
        medicamentos,
        indicaciones_generales: indicacionesGenerales,
        location_id: locationId,
      });

      setShowNewModal(false);
      await loadRecetas();
      if (onRefreshAll) onRefreshAll();
      // Immediately open print preview for the newly generated prescription
      setSelectedRecetaForPrint(created);
    } catch (err) {
      console.error('Error al guardar receta:', err);
      alert('Error al guardar la receta médica.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReceta = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta receta médica?')) return;
    try {
      await api.deleteReceta(id);
      await loadRecetas();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      console.error('Error al eliminar receta:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Pill size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Recetas Médicas & Odontológicas</h3>
            <p className="text-xs text-slate-500">
              Expedición de recetas impresas con membrete oficial, cédula profesional y advertencias
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openNewRecetaModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>Nueva Receta Odontológica</span>
        </button>
      </div>

      {/* Recetas List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <Pill className="animate-spin mx-auto mb-2 text-emerald-500" size={24} />
          <p className="text-xs">Cargando recetas del paciente...</p>
        </div>
      ) : recetas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 space-y-3">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Pill size={28} />
          </div>
          <h4 className="text-sm font-bold text-slate-700">Sin recetas expedidas para este paciente</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Haz clic en "Nueva Receta Odontológica" para prescribir antibióticos, analgésicos o colutorios con formato oficial impreso.
          </p>
          <button
            type="button"
            onClick={openNewRecetaModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>Crear Primera Receta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recetas.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header card info */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md">
                      {r.folio}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center">
                      <Calendar size={13} className="mr-1 text-slate-400" />
                      {r.fecha}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setSelectedRecetaForPrint(r)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center space-x-1 text-xs font-bold"
                      title="Imprimir / Ver Membrete Oficial"
                    >
                      <Printer size={16} />
                      <span className="hidden sm:inline">Imprimir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReceta(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar receta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Doctor and diagnostic */}
                <div className="mt-3 space-y-2">
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Médico Prescriptor</span>
                    <span className="font-bold text-slate-800">{r.doctor}</span>
                    <span className="text-slate-500 font-mono text-[11px] ml-1.5">({r.cedula})</span>
                  </div>

                  {r.diagnostico && (
                    <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-600 mr-1">Diagnóstico:</span>
                      <span className="text-slate-800">{r.diagnostico}</span>
                    </div>
                  )}

                  {/* Medications list badge preview */}
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Fármacos Prescritos ({r.medicamentos?.length || 0}):
                    </span>
                    <div className="space-y-1">
                      {r.medicamentos?.map((m, mIdx) => (
                        <div key={mIdx} className="text-xs bg-emerald-50/70 text-emerald-950 p-2 rounded-lg border border-emerald-100 flex items-start justify-between">
                          <div>
                            <p className="font-bold">{m.nombre}</p>
                            <p className="text-[11px] text-emerald-800">{m.dosis} {m.duracion ? `• ${m.duracion}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom sucursal and print shortcut */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{r.sucursal_nombre || 'Sucursal Principal'}</span>
                <button
                  type="button"
                  onClick={() => setSelectedRecetaForPrint(r)}
                  className="font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center space-x-1"
                >
                  <span>Ver Formato Formal</span>
                  <span>→</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* NEW RECETA MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Pill size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Nueva Receta Médica Dental</h3>
                  <p className="text-xs text-emerald-100">
                    Paciente: {patient.nombre} ({patient.expediente})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateReceta} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Row 1: Folio, Fecha, Sucursal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Folio
                  </label>
                  <input
                    type="text"
                    required
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Fecha de Expedición
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Sucursal Emisora
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(Number(e.target.value))}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Doctor y Cédula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Médico / Odontólogo
                  </label>
                  <input
                    type="text"
                    required
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Cédula Profesional
                  </label>
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Row 3: Diagnostico, Vitals, Alergias */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Diagnóstico Odontológico
                  </label>
                  <input
                    type="text"
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    placeholder="Ej. Absceso periapical, pulpitis pieza 16..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Peso (kg) / Talla
                  </label>
                  <div className="flex space-x-1">
                    <input
                      type="text"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      placeholder="21 kg"
                      className="w-1/2 text-xs px-2 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                    <input
                      type="text"
                      value={talla}
                      onChange={(e) => setTalla(e.target.value)}
                      placeholder="115 cm"
                      className="w-1/2 text-xs px-2 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Alergias Conocidas
                  </label>
                  <input
                    type="text"
                    value={alergias}
                    onChange={(e) => setAlergias(e.target.value)}
                    placeholder="Negadas"
                    className="w-full text-xs font-bold text-rose-700 px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Quick Presets Section */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center">
                  <Sparkles size={14} className="text-amber-500 mr-1" />
                  Medicamentos Frecuentes en Odontología (1 Clic para agregar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DENTAL_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPreset(p)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition-colors"
                      title={`${p.dosis} (${p.duracion})`}
                    >
                      + {p.nombre.split(' ')[0]} {p.nombre.split(' ')[1] || ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prescribed Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Medicamentos Agregados a la Receta ({medicamentos.length})
                  </span>
                </div>

                {medicamentos.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-400">
                    Selecciona un medicamento de los botones de arriba o ingresa uno personalizado abajo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {medicamentos.map((m, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-start justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-mono font-black text-emerald-800 mr-2">{idx + 1}.</span>
                          <span className="font-bold text-slate-900">{m.nombre}</span>
                          <p className="text-slate-600 pl-5">
                            <strong>Dosis:</strong> {m.dosis} {m.duracion ? `• durante ${m.duracion}` : ''}
                          </p>
                          {m.indicacion && (
                            <p className="text-slate-500 italic pl-5 text-[11px]">Nota: {m.indicacion}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMed(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Med Form */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Agregar Fármaco Personalizado:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={medNombre}
                    onChange={(e) => setMedNombre(e.target.value)}
                    placeholder="Nombre y presentación (Ej. Ibuprofeno 400mg)"
                    className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    value={medDosis}
                    onChange={(e) => setMedDosis(e.target.value)}
                    placeholder="Dosis (Ej. 1 tableta cada 8 horas)"
                    className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                  <div className="flex space-x-1">
                    <input
                      type="text"
                      value={medDuracion}
                      onChange={(e) => setMedDuracion(e.target.value)}
                      placeholder="Duración (Ej. 5 días)"
                      className="w-2/3 text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualMed}
                      className="w-1/3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg"
                    >
                      + Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* General Indications */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Indicaciones Generales y Cuidados Post-Operatorios
                </label>
                <textarea
                  rows={2}
                  value={indicacionesGenerales}
                  onChange={(e) => setIndicacionesGenerales(e.target.value)}
                  placeholder="Instrucciones higiénicas, reposo, dieta blanda..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  {saving ? 'Guardando...' : 'Guardar y Ver Membrete de Impresión'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Formal Receta Printable Letterhead Modal */}
      {selectedRecetaForPrint && (
        <RecetaPrintModal
          isOpen={Boolean(selectedRecetaForPrint)}
          onClose={() => setSelectedRecetaForPrint(null)}
          receta={selectedRecetaForPrint}
          patient={patient}
          clinicaConfig={clinicaConfig}
        />
      )}

    </div>
  );
};