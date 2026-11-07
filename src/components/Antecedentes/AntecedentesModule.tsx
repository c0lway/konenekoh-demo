import React, { useState, useEffect } from 'react';
import { Patient, Antecedentes } from '../../types';
import { api } from '../../services/api';
import { 
  Save, Check, ClipboardList, HeartPulse, Activity, UserCheck,
  AlertTriangle, Baby, Sparkles, ShieldAlert, Heart, FileText, CheckCircle2
} from 'lucide-react';

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

interface TabItem {
  key: TabKey;
  label: string;
  icon: any;
  desc: string;
  snippets: string[];
}

export const AntecedentesModule: React.FC<AntecedentesModuleProps> = ({ patient }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('generales');
  const [data, setData] = useState<Antecedentes>({ patient_id: patient.id });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const tabs: TabItem[] = [
    { 
      key: 'generales', 
      label: 'Alergias & Generales', 
      icon: AlertTriangle,
      desc: 'Alergias a medicamentos (penicilinas, AINEs), anestésicos locales, látex, hospitalizaciones previas',
      snippets: [
        'Alergias a medicamentos e insumos: NEGADAS.',
        'Refiere alergia a Penicilinas y derivados.',
        'Refiere sensibilidad / alergia al Látex.',
        'Sin antecedentes de hospitalizaciones previas ni transfusiones.',
      ]
    },
    { 
      key: 'signos_vitales', 
      label: 'Signos Vitales', 
      icon: HeartPulse,
      desc: 'Presión arterial (TA), Frecuencia cardíaca (FC), Temperatura, Peso, Talla',
      snippets: [
        'TA: 110/70 mmHg · FC: 78 lpm · Temp: 36.5 °C · Peso: Normal para la edad.',
        'Signos vitales estables dentro de parámetros normales sin contraindicación.',
      ]
    },
    { 
      key: 'patologicos', 
      label: 'Patológicos', 
      icon: Activity,
      desc: 'Enfermedades crónicas, cardiopatías, diabetes, asma, epilepsia, cirugías previas',
      snippets: [
        'Enfermedades crónico-degenerativas: NEGADAS.',
        'Diagnóstico de Asma bronquial en control (porta broncodilatador).',
        'Antecedente de Cardiopatía congénita / Profilaxis antibiótica requerida.',
      ]
    },
    { 
      key: 'heredo_familiares', 
      label: 'Heredo-Familiares', 
      icon: Heart,
      desc: 'Antecedentes familiares de diabetes, hipertensión arterial, cáncer, coagulopatías',
      snippets: [
        'Antecedentes familiares directos: Diabetes mellitus tipo 2 (Rama materna).',
        'Sin antecedentes heredo-familiares de relevancia o sangrado prolongado.',
      ]
    },
    { 
      key: 'perinatales', 
      label: 'Perinatales & Niñez', 
      icon: Baby,
      desc: 'Desarrollo gestacional, semanas de gestación, tipo de parto, lactancia y dentición temprana',
      snippets: [
        'Nacido a término (39 SDG) por parto eutócico sin complicaciones perinatales.',
        'Lactancia materna exclusiva durante 6 meses. Sin secuelas neonatales.',
        'Erupción dental dentro de cronología normal sin retardo.',
      ]
    },
    { 
      key: 'no_patologicos', 
      label: 'Hábitos & Higiene', 
      icon: Sparkles,
      desc: 'Higiene bucal, frecuencia de cepillado, hilo dental, hábitos orales (succión digital, chupón)',
      snippets: [
        'Higiene bucal regular, cepillado 2 veces al día sin uso de hilo dental.',
        'Hábito de respiración bucal y deglución atípica observados.',
        'Hábito de succión digital / uso prolongado de biberón nocturno.',
      ]
    },
    { 
      key: 'gineco_obstetricos', 
      label: 'Gíneco-Obstétricos', 
      icon: ShieldAlert,
      desc: 'Embarazo actual, lactancia, precauciones con anestésicos y radiografías',
      snippets: [
        'Paciente no gestante ni en periodo de lactancia.',
        'Actualmente en segundo trimestre de gestación (precaución radiográfica).',
      ]
    },
    { 
      key: 'andrologicos', 
      label: 'Andrológicos', 
      icon: UserCheck,
      desc: 'Antecedentes específicos masculinos y control preventivo',
      snippets: [
        'Sin antecedentes andrológicos de relevancia clínica odontológica.',
      ]
    },
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

  const handleApplySnippet = (snippet: string) => {
    const currentText = (data as any)[activeTab] || '';
    const newText = currentText ? `${currentText}\n• ${snippet}` : `• ${snippet}`;
    setData({ ...data, [activeTab]: newText });
  };

  const currentTabInfo = tabs.find((t) => t.key === activeTab)!;
  const ActiveIcon = currentTabInfo.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Quick Save Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold shadow-2xs shrink-0">
            <ClipboardList size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                Historia Clínica & Antecedentes Médicos
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800">
                Anamnesis
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              Expediente #{patient.expediente} • {patient.nombre}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {savedSuccess && (
            <span className="flex items-center text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs animate-in fade-in">
              <Check size={14} className="mr-1.5 text-emerald-600" /> Guardado Correctamente
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#10b981] hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Save size={15} />
            <span>{saving ? 'Guardando...' : 'Guardar Antecedentes'}</span>
          </button>
        </div>
      </div>

      {/* 2. CATEGORY TABS (Organized Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = activeTab === tab.key;
          const hasContent = Boolean((data as any)[tab.key]);

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`p-3.5 rounded-2xl text-left transition-all border flex items-center space-x-3 group relative ${
                isSelected
                  ? 'bg-white border-[#00b4d8] ring-2 ring-[#00b4d8]/30 shadow-sm scale-[1.01]'
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-cyan-300'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#00b4d8] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-cyan-50 group-hover:text-cyan-700'
              }`}>
                <TabIcon size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <div className={`text-xs font-black truncate ${
                  isSelected ? 'text-slate-900' : 'text-slate-700'
                }`}>
                  {tab.label}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold truncate">
                  {hasContent ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} /> Registrado
                    </span>
                  ) : (
                    'Sin datos'
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE TAB EDITOR CARD */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <ActiveIcon size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {currentTabInfo.label}
              </h4>
              <p className="text-[11px] text-slate-500">
                {currentTabInfo.desc}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            Expediente Activo
          </span>
        </div>

        {/* Quick Snippet Pills */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Plantillas Clínicas Rápidas (1-Clic para insertar):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {currentTabInfo.snippets.map((snip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySnippet(snip)}
                className="text-[11px] font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 px-3 py-1 rounded-xl transition-all shadow-2xs text-left"
              >
                + {snip}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Detalle Clínico y Observaciones del Médico:
          </label>
          <textarea
            rows={7}
            value={(data as any)[activeTab] || ''}
            onChange={(e) => setData({ ...data, [activeTab]: e.target.value })}
            placeholder={`Escribe aquí los antecedentes sobre ${currentTabInfo.label.toLowerCase()} o utiliza los botones de plantilla rápida...`}
            className="w-full text-xs font-semibold p-4 bg-slate-50/60 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8] text-slate-900 leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#00b4d8] hover:bg-[#0096c7] text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 flex items-center space-x-1.5"
          >
            <Save size={15} />
            <span>Guardar {currentTabInfo.label}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
