import React from 'react';
import { RecetaMedica, Patient, ClinicaConfig } from '../../types';
import { X, Printer, ShieldCheck, Pill, AlertTriangle } from 'lucide-react';

interface RecetaPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  receta: RecetaMedica;
  patient: Patient;
  clinicaConfig: ClinicaConfig;
}

export const RecetaPrintModal: React.FC<RecetaPrintModalProps> = ({
  isOpen,
  onClose,
  receta,
  patient,
  clinicaConfig,
}) => {
  if (!isOpen) return null;

  const calculateAge = (dateStr?: string) => {
    if (!dateStr) return '';
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} años`;
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in print:p-0 print:bg-white print:static print:z-0">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-3xl max-h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Print Bar (Hidden during print) */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Pill size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold">Receta Médica / Odontológica Oficial</h3>
              <p className="text-xs text-slate-400">Formato con membrete institucional y cédula profesional</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all"
            >
              <Printer size={15} />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Letterhead Document */}
        <div className="flex-1 overflow-y-auto p-8 print:p-6 print:overflow-visible text-slate-800 space-y-5 printable-receta">
          
          {/* 1. CLINIC LETTERHEAD */}
          <div className="flex items-start justify-between border-b-2 pb-4" style={{ borderColor: clinicaConfig.color_primario || '#06b6d4' }}>
            <div className="flex items-start space-x-4">
              {clinicaConfig.logotipo_url ? (
                <img
                  src={clinicaConfig.logotipo_url}
                  alt={clinicaConfig.nombre_comercial}
                  className="h-16 w-16 object-contain rounded-xl p-1 border border-slate-200"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm"
                  style={{ backgroundColor: clinicaConfig.color_primario || '#06b6d4' }}
                >
                  KK
                </div>
              )}
              <div className="space-y-0.5">
                <h1 className="text-lg font-black tracking-tight" style={{ color: clinicaConfig.color_primario || '#06b6d4' }}>
                  {clinicaConfig.nombre_comercial}
                </h1>
                <p className="text-xs font-bold text-slate-600">
                  {clinicaConfig.eslogan || 'Odontopediatría & Ortodoncia Especializada'}
                </p>
                <div className="text-[11px] text-slate-600 pt-0.5">
                  <p className="font-bold text-slate-800">
                    {receta.doctor || clinicaConfig.responsable_sanitario}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {receta.cedula || clinicaConfig.cedula_profesional}
                    {clinicaConfig.registro_ssa ? ` • ${clinicaConfig.registro_ssa}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-500 space-y-0.5 max-w-xs">
              <p className="font-medium text-slate-700 leading-tight">
                {receta.sucursal_direccion || clinicaConfig.direccion}
              </p>
              <p>
                <strong>Tel:</strong> {receta.sucursal_telefono || clinicaConfig.telefono}
                {clinicaConfig.whatsapp ? ` • WhatsApp: ${clinicaConfig.whatsapp}` : ''}
              </p>
              {clinicaConfig.email && <p>{clinicaConfig.email}</p>}
            </div>
          </div>

          {/* 2. FOLIO & DATE BAR */}
          <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Folio Receta:</span>
              <span className="font-mono font-bold text-slate-800">{receta.folio}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 mr-1.5">Fecha:</span>
              <span className="font-semibold text-slate-800">{receta.fecha}</span>
            </div>
          </div>

          {/* 3. PATIENT VITALS & DATA */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <span className="block text-[9px] font-black uppercase text-slate-400">Paciente</span>
              <span className="font-black text-slate-800">{patient.nombre}</span>
            </div>
            <div>
              <span className="block text-[9px] font-black uppercase text-slate-400">Expediente / Edad</span>
              <span className="font-semibold text-slate-700">
                {patient.expediente} • {calculateAge(patient.fecha_nacimiento) || 'Edad n/d'}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-black uppercase text-slate-400">Somatometría</span>
              <span className="text-slate-700 font-medium">
                {receta.peso ? `Peso: ${receta.peso}` : ''} {receta.talla ? `• Talla: ${receta.talla}` : ''} {receta.temperatura ? `• Temp: ${receta.temperatura}` : ''}
                {!receta.peso && !receta.talla && !receta.temperatura ? 'No registrada' : ''}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-black uppercase text-slate-400">Alergias</span>
              <span className={`font-bold ${receta.alergias && receta.alergias.toLowerCase() !== 'negadas' ? 'text-rose-600' : 'text-slate-700'}`}>
                {receta.alergias || 'Negadas'}
              </span>
            </div>
          </div>

          {/* DIAGNOSIS IF PRESENT */}
          {receta.diagnostico && (
            <div className="text-xs px-3 py-2 bg-cyan-50/60 border border-cyan-100 rounded-xl">
              <span className="font-bold text-cyan-900 mr-1.5">Diagnóstico:</span>
              <span className="text-cyan-800">{receta.diagnostico}</span>
            </div>
          )}

          {/* 4. PRESCRIPTION BODY (Rx) */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center space-x-2 text-slate-800">
              <span className="text-2xl font-serif font-black italic text-cyan-700">Rx.</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prescripción Farmacológica</span>
            </div>

            <div className="space-y-3 pl-2">
              {receta.medicamentos && receta.medicamentos.length > 0 ? (
                receta.medicamentos.map((med, idx) => (
                  <div key={idx} className="border-l-2 border-cyan-500 pl-3 py-1 space-y-0.5">
                    <div className="flex items-baseline space-x-2">
                      <span className="font-mono text-xs font-black text-cyan-700">{idx + 1}.</span>
                      <h4 className="text-sm font-bold text-slate-900">{med.nombre}</h4>
                    </div>
                    <div className="text-xs text-slate-700 pl-4 space-y-0.5">
                      <p>
                        <strong className="text-slate-800">Dosis / Frecuencia:</strong> {med.dosis}
                        {med.duracion ? ` • durante ${med.duracion}` : ''}
                      </p>
                      {med.indicacion && (
                        <p className="text-slate-500 italic text-[11px]">
                          Indicación: {med.indicacion}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No se agregaron medicamentos a la receta.</p>
              )}
            </div>
          </div>

          {/* 5. GENERAL INSTRUCTIONS */}
          {receta.indicaciones_generales && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
              <span className="block text-[10px] font-black uppercase text-slate-500">
                Indicaciones Generales y Cuidados Post-Operatorios:
              </span>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                {receta.indicaciones_generales}
              </p>
            </div>
          )}

          {/* 6. SIGNATURE & LEGAL NOTICE */}
          <div className="pt-8 space-y-6">
            <div className="text-center">
              <div className="border-t border-slate-400 w-60 mx-auto pt-2">
                <p className="font-bold text-xs text-slate-800">
                  {receta.doctor || clinicaConfig.responsable_sanitario}
                </p>
                <p className="font-mono text-[10px] text-slate-500">
                  {receta.cedula || clinicaConfig.cedula_profesional}
                </p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                  Firma y Sello del Odontólogo
                </p>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 text-center italic max-w-xl mx-auto leading-tight pt-2 border-t border-slate-100">
              {clinicaConfig.nota_pie_receta || 
                'En caso de reacción alérgica o efecto adverso, suspenda el medicamento y comuníquese inmediatamente al consultorio.'
              }
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};