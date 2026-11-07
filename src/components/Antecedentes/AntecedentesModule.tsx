import React, { useState, useEffect } from 'react';
import { Patient, Antecedentes } from '../../types';
import { api } from '../../services/api';
import { Save, Check, ClipboardList, HeartPulse, Activity, UserCheck } from 'lucide-react';

interface AntecedentesModuleProps {
  patient: Patient;
}

type TabKey = 
  | 'generales' 
  | 'andrologicos' 
  | 'perinatales' 
  | 'signos_vitales' 
  | 'patologicos' 
  | 'heredo_familiares' 
  | 'no_patologicos' 
  | 'gineco_obstetricos';

export const AntecedentesModule: React.FC<AntecedentesModuleProps> = ({ patient }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('generales');
  const [data, setData] = useState<Antecedentes>({ patient_id: patient.id });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const tabs: { key: TabKey; label: string; desc: string }[] = [
    { key: 'generales', label: 'Generales', desc: 'Alergias a medicamentos, anestésicos, látex, hospitalizaciones previas' },
    { key: 'andrologicos', label: 'Andrológicos', desc: 'Antecedentes específicos masculinos' },
    { key: 'perinatales', label: 'Perinatales', desc: 'Desarrollo embrionario, semanas de gestación, tipo de parto, complicaciones perinatales' },
    { key: 'signos_vitales', label: 'Signos Vitales', desc: 'Presión arterial (TA), Frecuencia cardíaca (FC), Temp, Peso, Talla' },
    { key: 'patologicos', label: 'Patológicos', desc: 'Enfermedades crónicas, cardiopatías, diabetes, asma, cirugías, transfusiones' },
    { key: 'heredo_familiares', label: 'Heredo-Familiares', desc: 'Antecedentes familiares de diabetes, hipertensión, cáncer, coagulopatías' },
    { key: 'no_patologicos', label: 'No Patológicos', desc: 'Higiene bucal, frecuencia de cepillado, hábitos (chupón, deglución atípica), dieta cariogénica' },
    { key: 'gineco_obstetricos', label: 'Gíneco - Obstétricos', desc: 'Embarazo actual, lactancia, menarca' },
  ];

  useEffect(() => {
    loadAntecedentes();
  }, [patient.id]);

  const loadAntecedentes = async () => {
    try {
      setLoading(true);
      const ant = await api.getAntecedentes(patient.id);
      setData(ant);
    } catch (err) {
      console.error('Error al cargar antecedentes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateAntecedentes(patient.id, data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error al guardar antecedentes:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentTabInfo = tabs.find((t) => t.key === activeTab)!;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <ClipboardList className="text-cyan-600" size={20} />
            <span>Historia Clínica & Antecedentes Médicos</span>
          </h3>
          <p className="text-xs text-slate-500">Expediente {patient.expediente} — {patient.nombre}</p>
        </div>

        <div className="flex items-center space-x-2">
          {savedSuccess && (
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <Check size={14} className="mr-1" /> Guardado
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm"
          >
            <Save size={15} />
            <span>{saving ? 'Guardando...' : 'Guardar Antecedentes'}</span>
          </button>
        </div>
      </div>

      {/* 8 Buttons matching FileMaker Screenshot 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-4 rounded-xl text-xs font-bold text-center transition-all ${
              activeTab === tab.key
                ? 'bg-[#2ec4b6] text-white shadow-md scale-[1.02]'
                : 'bg-[#e0f7fa]/70 hover:bg-[#b2ebf2] text-cyan-900 border border-cyan-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content Area */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            {currentTabInfo.label}
          </h4>
          <span className="text-[11px] text-slate-500 italic">
            {currentTabInfo.desc}
          </span>
        </div>

        <textarea
          rows={6}
          value={(data as any)[activeTab] || ''}
          onChange={(e) => setData({ ...data, [activeTab]: e.target.value })}
          placeholder={`Escribe aquí los antecedentes sobre ${currentTabInfo.label.toLowerCase()}...`}
          className="w-full text-sm p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
        />
      </div>
    </div>
  );
};
