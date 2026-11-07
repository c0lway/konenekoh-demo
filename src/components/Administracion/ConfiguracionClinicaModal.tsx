import React, { useState, useEffect } from 'react';
import { ClinicaConfig } from '../../types';
import { 
  X, Building2, Image as ImageIcon, MapPin, Phone, Mail, Globe, 
  FileBadge, ShieldCheck, Check, Upload, Palette, AlertCircle, Eye, FileText
} from 'lucide-react';

interface ConfiguracionClinicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: ClinicaConfig;
  onSaveConfig: (updated: ClinicaConfig) => Promise<void>;
}

export const ConfiguracionClinicaModal: React.FC<ConfiguracionClinicaModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<ClinicaConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'general' | 'contacto' | 'legal' | 'pie_notas' | 'preview'>('general');
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setFormData(initialConfig);
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ClinicaConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen seleccionada supera los 2MB. Por favor elige una imagen más ligera.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleChange('logotipo_url', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveConfig(formData);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      alert('Hubo un error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Personalización de Clínica & Membretes</h2>
              <p className="text-xs text-cyan-100 font-medium">
                Logotipo, membrete oficial para recetas, presupuestos y datos institucionales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-3 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'general'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <ImageIcon size={15} />
            <span>Marca & Logotipo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacto')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'contacto'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <MapPin size={15} />
            <span>Dirección & Contacto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legal')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'legal'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <FileBadge size={15} />
            <span>Médico & Cédulas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pie_notas')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'pie_notas'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <FileText size={15} />
            <span>Pie de Impresión</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'preview'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Eye size={15} />
            <span>Vista Previa Membrete</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: MARCA & LOGO */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* Logo Box & Upload */}
                <div className="md:col-span-1 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-3">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Logotipo Actual</span>
                  
                  <div className="w-36 h-36 rounded-2xl bg-white border-2 border-dashed border-cyan-300 p-2 flex items-center justify-center overflow-hidden shadow-inner group relative">
                    {formData.logotipo_url ? (
                      <img
                        src={formData.logotipo_url}
                        alt="Logotipo de la clínica"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                        <ImageIcon size={36} className="mb-1" />
                        <span className="text-[10px]">Sin logotipo</span>
                      </div>
                    )}
                  </div>

                  <label className="cursor-pointer w-full inline-flex items-center justify-center space-x-2 py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-xs rounded-xl border border-cyan-200 transition-colors">
                    <Upload size={14} />
                    <span>Subir imagen local</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    PNG transparente o JPG recomendado. Máximo 2MB.
                  </p>
                </div>

                {/* Brand details */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                      Nombre Comercial de la Clínica *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre_comercial}
                      onChange={(e) => handleChange('nombre_comercial', e.target.value)}
                      placeholder="Ej. KoneneKoh Smile Maker"
                      className="w-full text-sm font-semibold px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                      Eslogan / Subtítulo Institucional
                    </label>
                    <input
                      type="text"
                      value={formData.eslogan || ''}
                      onChange={(e) => handleChange('eslogan', e.target.value)}
                      placeholder="Ej. Odontopediatría & Ortodoncia Especializada"
                      className="w-full text-sm px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                      URL directa del Logotipo (Opcional)
                    </label>
                    <input
                      type="url"
                      value={formData.logotipo_url || ''}
                      onChange={(e) => handleChange('logotipo_url', e.target.value)}
                      placeholder="https://tudominio.com/logo.png"
                      className="w-full text-xs font-mono px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Color Primario de Marca
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.color_primario || '#06b6d4'}
                          onChange={(e) => handleChange('color_primario', e.target.value)}
                          className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-600 uppercase">
                          {formData.color_primario || '#06b6d4'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Color Secundario
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.color_secundario || '#2ec4b6'}
                          onChange={(e) => handleChange('color_secundario', e.target.value)}
                          className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-600 uppercase">
                          {formData.color_secundario || '#2ec4b6'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECCION & CONTACTO */}
          {activeTab === 'contacto' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-cyan-50/60 p-3.5 rounded-2xl border border-cyan-100 flex items-start space-x-3 text-cyan-900 text-xs">
                <MapPin size={18} className="text-cyan-600 mt-0.5 flex-shrink-0" />
                <p>
                  Estos datos de ubicación y contacto se incluirán automáticamente en el membrete superior de todas las 
                  <strong> recetas médicas</strong> y <strong>presupuestos odontológicos impresos o exportados a PDF</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Dirección Completa de la Clínica / Matriz *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.direccion || ''}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Calle, número, colonia, código postal, municipio y estado"
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                    <Phone size={14} className="mr-1 text-slate-400" />
                    <span>Teléfono Fijo de Consultorio</span>
                  </label>
                  <input
                    type="text"
                    value={formData.telefono || ''}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="442 237 1299"
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                    <Phone size={14} className="mr-1 text-emerald-500" />
                    <span>WhatsApp de Citas & Urgencias</span>
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp || ''}
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                    placeholder="442 237 1299"
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                    <Mail size={14} className="mr-1 text-slate-400" />
                    <span>Correo Electrónico Institucional</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contacto@konenekoh.com"
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                    <Globe size={14} className="mr-1 text-slate-400" />
                    <span>Sitio Web Oficial</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sitio_web || ''}
                    onChange={(e) => handleChange('sitio_web', e.target.value)}
                    placeholder="www.konenekoh.com"
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEGAL & CEDULAS */}
          {activeTab === 'legal' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 flex items-start space-x-3 text-amber-900 text-xs">
                <ShieldCheck size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p>
                  Requisitos normativos para recetas y expedientes odontológicos en México (NOM-004-SSA3-2012 y COFEPRIS):
                  deben exhibir nombre completo del odontólogo tratante o responsable, cédula profesional legalmente expedida y datos de la institución educativa.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Médico Odontólogo / Responsable Sanitario *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.responsable_sanitario || ''}
                    onChange={(e) => handleChange('responsable_sanitario', e.target.value)}
                    placeholder="Ej. Dra. Rebeca Aguilar Ramos"
                    className="w-full text-sm font-semibold px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Cédula Profesional & Especialidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cedula_profesional || ''}
                    onChange={(e) => handleChange('cedula_profesional', e.target.value)}
                    placeholder="Ej. Céd. Prof. 8472910 UNAM / Esp. 129384"
                    className="w-full text-sm font-semibold px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registro Sanitario S.S.A. / COFEPRIS (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.registro_ssa || ''}
                    onChange={(e) => handleChange('registro_ssa', e.target.value)}
                    placeholder="Ej. Reg. S.S.A. 20-045-QRO"
                    className="w-full text-sm px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    R.F.C. Fiscal de la Clínica (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.rfc || ''}
                    onChange={(e) => handleChange('rfc', e.target.value)}
                    placeholder="Ej. KSM190520ABC"
                    className="w-full text-sm uppercase px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PIE DE PAGINA / NOTAS */}
          {activeTab === 'pie_notas' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Nota o Términos al Pie de los Presupuestos
                </label>
                <textarea
                  rows={3}
                  value={formData.nota_pie_presupuesto || ''}
                  onChange={(e) => handleChange('nota_pie_presupuesto', e.target.value)}
                  placeholder="Vigencia del presupuesto, políticas de anticipo, vigencia de materiales, etc."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Aparecerá en el bloque inferior de las cotizaciones impresas con las firmas de aceptación.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Nota / Advertencia al Pie de las Recetas Médicas
                </label>
                <textarea
                  rows={3}
                  value={formData.nota_pie_receta || ''}
                  onChange={(e) => handleChange('nota_pie_receta', e.target.value)}
                  placeholder="En caso de reacción adversa suspender y reportar inmediatamente, etc."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Aparecerá impreso al pie de la receta médica oficial al lado de la firma y cédula profesional.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: VISTA PREVIA MEMBRETE */}
          {activeTab === 'preview' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-slate-100 p-6 rounded-2xl flex justify-center">
                {/* Paper sheet preview */}
                <div className="bg-white w-full max-w-xl rounded-xl shadow-lg border border-slate-300 p-8 space-y-6 text-slate-800">
                  
                  {/* Letterhead Header */}
                  <div className="flex items-start justify-between border-b-2 pb-4" style={{ borderColor: formData.color_primario || '#06b6d4' }}>
                    <div className="flex items-center space-x-3">
                      {formData.logotipo_url ? (
                        <img
                          src={formData.logotipo_url}
                          alt="Logo"
                          className="h-14 w-14 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="h-14 w-14 bg-cyan-100 text-cyan-800 rounded-lg flex items-center justify-center font-black text-xl">
                          KK
                        </div>
                      )}
                      <div>
                        <h1 className="text-base font-black tracking-tight" style={{ color: formData.color_primario || '#06b6d4' }}>
                          {formData.nombre_comercial || 'Nombre de la Clínica'}
                        </h1>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {formData.eslogan || 'Odontopediatría & Ortodoncia'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formData.responsable_sanitario} • {formData.cedula_profesional}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                      <p className="font-semibold text-slate-700">{formData.telefono}</p>
                      <p>{formData.email}</p>
                      <p>{formData.sitio_web}</p>
                      {formData.registro_ssa && <p className="font-mono text-slate-400">{formData.registro_ssa}</p>}
                    </div>
                  </div>

                  {/* Body Simulation */}
                  <div className="py-4 space-y-3 opacity-60">
                    <div className="h-4 bg-slate-200 rounded w-2/5"></div>
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-4/5"></div>
                    <div className="h-16 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 italic">
                      [ Contenido del Presupuesto u Odontograma / Prescripción de Medicamentos Rx ]
                    </div>
                  </div>

                  {/* Letterhead Footer */}
                  <div className="border-t pt-3 text-[9px] text-slate-400 text-center space-y-1">
                    <p className="font-medium text-slate-500">{formData.direccion}</p>
                    <p className="italic">"{formData.nota_pie_presupuesto || formData.nota_pie_receta}"</p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              {savedSuccess && (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <Check size={14} className="mr-1.5" /> Cambios de personalización guardados exitosamente
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cerrar
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <Check size={16} />
                <span>{saving ? 'Guardando...' : 'Guardar y Aplicar Membrete'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};