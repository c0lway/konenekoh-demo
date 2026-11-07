import React from 'react';
import { Presupuesto, PresupuestoItem, Patient, ClinicaConfig } from '../../types';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PresupuestoPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  presupuesto: Presupuesto;
  items: PresupuestoItem[];
  patient: Patient;
  clinicaConfig: ClinicaConfig;
}

export const PresupuestoPrintModal: React.FC<PresupuestoPrintModalProps> = ({
  isOpen,
  onClose,
  presupuesto,
  items,
  patient,
  clinicaConfig,
}) => {
  if (!isOpen) return null;

  const calculateSubtotal = () => {
    return items.reduce((sum, it) => sum + (it.precio_unitario * (it.cantidad || 1)), 0);
  };

  const calculateDescuentoTotal = () => {
    return items.reduce((sum, it) => sum + (it.descuento || 0), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, it) => sum + it.total, 0);
  };

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
      
      {/* Modal Wrapper (hidden on print except content) */}
      <div className="bg-white w-full max-w-4xl max-h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Action Header bar (Hidden when printing) */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <Printer size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold">Vista Formal de Impresión del Presupuesto</h3>
              <p className="text-xs text-slate-400">Membrete institucional de la clínica</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all"
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

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 print:p-6 print:overflow-visible text-slate-800 space-y-6 printable-document">
          
          {/* 1. CLINIC LETTERHEAD HEADER */}
          <div className="flex items-start justify-between border-b-2 pb-5" style={{ borderColor: clinicaConfig.color_primario || '#06b6d4' }}>
            <div className="flex items-start space-x-4">
              {clinicaConfig.logotipo_url ? (
                <img
                  src={clinicaConfig.logotipo_url}
                  alt={clinicaConfig.nombre_comercial}
                  className="h-20 w-20 object-contain rounded-xl p-1 border border-slate-200"
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-sm"
                  style={{ backgroundColor: clinicaConfig.color_primario || '#06b6d4' }}
                >
                  KK
                </div>
              )}
              <div className="space-y-0.5">
                <h1 className="text-xl font-black tracking-tight" style={{ color: clinicaConfig.color_primario || '#06b6d4' }}>
                  {clinicaConfig.nombre_comercial}
                </h1>
                <p className="text-xs font-bold text-slate-600">
                  {clinicaConfig.eslogan || 'Odontopediatría & Ortodoncia Especializada'}
                </p>
                <div className="text-[11px] text-slate-500 pt-1 space-y-0.5">
                  <p className="font-semibold text-slate-700">
                    {clinicaConfig.responsable_sanitario}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {clinicaConfig.cedula_profesional}
                    {clinicaConfig.registro_ssa ? ` • ${clinicaConfig.registro_ssa}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500 space-y-1 max-w-xs">
              <p className="font-medium text-slate-700 leading-tight">
                {clinicaConfig.direccion}
              </p>
              <p>
                <strong className="text-slate-700">Tel:</strong> {clinicaConfig.telefono}
                {clinicaConfig.whatsapp ? ` • WhatsApp: ${clinicaConfig.whatsapp}` : ''}
              </p>
              {clinicaConfig.email && <p>{clinicaConfig.email}</p>}
              {clinicaConfig.rfc && <p className="font-mono text-[10px]">RFC: {clinicaConfig.rfc}</p>}
            </div>
          </div>

          {/* 2. DOCUMENT TITLE & FOLIO BANNER */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Documento Clínico
              </span>
              <h2 className="text-base font-black text-slate-800">
                PRESUPUESTO ODONTOLÓGICO & PLAN DE TRATAMIENTO
              </h2>
              <p className="text-xs text-slate-500">
                Folio: <strong className="font-mono text-cyan-700">{presupuesto.folio}</strong> • Emisión: <strong>{presupuesto.fecha}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-3 text-right">
              <span className="px-3 py-1 bg-cyan-100 text-cyan-900 font-black text-xs rounded-full border border-cyan-200">
                Estado: {presupuesto.estado}
              </span>
            </div>
          </div>

          {/* 3. PATIENT INFORMATION CARD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Paciente</span>
              <span className="font-black text-slate-800">{patient.nombre}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Expediente</span>
              <span className="font-mono font-bold text-slate-700">{patient.expediente}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Edad / Nacimiento</span>
              <span className="text-slate-700">
                {calculateAge(patient.fecha_nacimiento) || 'No registrada'} {patient.fecha_nacimiento ? `(${patient.fecha_nacimiento})` : ''}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Teléfono / Tutor</span>
              <span className="text-slate-700">
                {patient.padre_tutor ? `${patient.padre_tutor} • ` : ''}{patient.telefono || patient.celular || 'Sin teléfono'}
              </span>
            </div>
          </div>

          {/* 4. TREATMENT ITEMS TABLE */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Desglose de Tratamientos y Procedimientos Planificados
            </h3>

            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">Pieza</th>
                  <th className="py-2.5 px-3 w-20 text-center">Superficie</th>
                  <th className="py-2.5 px-3">Procedimiento / Tratamiento</th>
                  <th className="py-2.5 px-3 text-right w-24">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-center w-16">Cant.</th>
                  <th className="py-2.5 px-3 text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No se han agregado conceptos o tratamientos al presupuesto.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-800">
                        {it.diente ? `#${it.diente}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {it.superficie || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {it.descripcion}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        ${it.precio_unitario.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {it.cantidad || 1}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${it.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 5. TOTALS AND OBSERVATIONS */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="flex-1 space-y-2 text-xs">
              {presupuesto.observaciones && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                    Observaciones e Indicaciones Clínicas:
                  </span>
                  <p className="text-slate-700 whitespace-pre-line">{presupuesto.observaciones}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">${calculateSubtotal().toFixed(2)}</span>
              </div>
              {calculateDescuentoTotal() > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Descuento aplicado:</span>
                  <span className="font-mono">-${calculateDescuentoTotal().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL A PAGAR:</span>
                <span className="text-cyan-700 font-mono text-base">${calculateTotal().toFixed(2)} MXN</span>
              </div>
            </div>
          </div>

          {/* 6. LEGAL NOTICE & SIGNATURE BLOCK */}
          <div className="pt-4 border-t border-slate-200 space-y-8">
            <p className="text-[10px] text-slate-500 text-center italic max-w-2xl mx-auto leading-relaxed">
              {clinicaConfig.nota_pie_presupuesto || 
                'Este presupuesto tiene una vigencia de 30 días a partir de su emisión. Los costos y procedimientos pueden actualizarse según la evolución clínica del paciente.'
              }
            </p>

            <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 w-4/5 mx-auto pt-2">
                  <p className="font-black text-slate-800">{clinicaConfig.responsable_sanitario}</p>
                  <p className="text-[10px] text-slate-500">{clinicaConfig.cedula_profesional}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Odontólogo Tratante</p>
                </div>
              </div>

              <div>
                <div className="border-t border-slate-400 w-4/5 mx-auto pt-2">
                  <p className="font-black text-slate-800">{patient.padre_tutor || patient.nombre}</p>
                  <p className="text-[10px] text-slate-500">Firma de Conformidad y Aceptación</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                    {patient.padre_tutor ? 'Padre / Tutor Legal' : 'Paciente'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};