import React, { useState, useEffect } from 'react';
import { Patient, Location } from '../../types';
import { api } from '../../services/api';
import { 
  Edit2, Save, X, Phone, Mail, MapPin, Calendar, 
  User, FileText, Check, Users, ShieldCheck, Building2,
  Sparkles, AlertCircle, HeartHandshake, Home
} from 'lucide-react';

interface GeneralesModuleProps {
  patient: Patient;
  locations?: Location[];
  onUpdatePatient: (updated: Patient) => void;
}

export const GeneralesModule: React.FC<GeneralesModuleProps> = ({ 
  patient, 
  locations = [], 
  onUpdatePatient 
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Patient>({ ...patient });
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Modal: Información de Padres / Tutor (Solo para menores de edad)
  const [showParentsModal, setShowParentsModal] = useState<boolean>(false);
  const [tutorNombre, setTutorNombre] = useState<string>(patient.padre_tutor || '');
  const [tutorParentesco, setTutorParentesco] = useState<string>('Madre');
  const [tutorTelefono, setTutorTelefono] = useState<string>(patient.celular || '');

  useEffect(() => {
    setFormData({ ...patient });
    setTutorNombre(patient.padre_tutor || '');
    setTutorTelefono(patient.celular || '');
  }, [patient]);

  // Automatic Age calculation from Birth Date
  const calculateAge = (birthDateStr?: string): number => {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : 0;
  };

  const age = calculateAge(formData.fecha_nacimiento);
  const isMinor = age < 18;

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await api.updatePatient(patient.id, formData);
      onUpdatePatient(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error al actualizar paciente:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTutor = async () => {
    try {
      setSaving(true);
      const updatedData = {
        ...formData,
        padre_tutor: tutorNombre,
      };
      const updated = await api.updatePatient(patient.id, updatedData);
      setFormData(updated);
      onUpdatePatient(updated);
      setShowParentsModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error al guardar datos del tutor:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP SUMMARY & ACTION CONTROLS */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-1.5 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center space-x-1.5 shadow-2xs">
            <span className="text-[10px] font-black text-cyan-700 uppercase tracking-wider">Expediente:</span>
            <span className="text-xs font-mono font-black text-slate-900">{formData.expediente}</span>
          </div>

          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center space-x-1.5 text-xs font-bold text-slate-700">
            <span>RFC:</span>
            <span className="font-mono text-slate-900">{formData.rfc || 'Sin RFC'}</span>
          </div>

          {/* Sede Badge */}
          <div className="px-3 py-1.5 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl flex items-center space-x-1.5 text-xs font-bold shadow-2xs">
            <Building2 size={13} className="text-purple-600" />
            <span>{formData.location_nombre || 'Sede Matriz'}</span>
          </div>

          {/* Pediatric Badge */}
          {isMinor ? (
            <div className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl flex items-center space-x-1 text-xs font-black shadow-2xs">
              <span>👶 Menor de Edad ({age} años)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold">
              <span>Adulto ({age} años)</span>
            </div>
          )}

          {/* Tutor Shortcut Button for Minors */}
          {isMinor && (
            <button
              type="button"
              onClick={() => setShowParentsModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Users size={14} />
              <span>Padres ({formData.padre_tutor ? formData.padre_tutor.split(' ')[0] : 'Asignar'})</span>
            </button>
          )}
        </div>

        {/* Action Buttons: Status Radio & Edit/Save */}
        <div className="flex items-center space-x-3">
          {/* Status Radio */}
          <div className="flex items-center space-x-3 text-xs font-bold bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              disabled={!isEditing}
              onClick={() => setFormData({ ...formData, activo: 1 })}
              className={`px-3 py-1 rounded-lg transition-all ${
                formData.activo === 1
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Activo
            </button>
            <button
              type="button"
              disabled={!isEditing}
              onClick={() => setFormData({ ...formData, activo: 0 })}
              className={`px-3 py-1 rounded-lg transition-all ${
                formData.activo === 0
                  ? 'bg-rose-600 text-white shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Inactivo
            </button>
          </div>

          {/* Edit / Save Button */}
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...patient });
                  setIsEditing(false);
                }}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#10b981] hover:bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
              >
                <Save size={15} />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#00b4d8] hover:bg-[#0096c7] text-white text-xs font-black rounded-xl flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
            >
              <Edit2 size={14} />
              <span>Editar Datos</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl border border-emerald-200 flex items-center shadow-xs animate-in fade-in">
          <Check size={18} className="mr-2 text-emerald-600" />
          <span>Datos generales del paciente actualizados con éxito.</span>
        </div>
      )}

      {/* 2. SECTION 1: PERSONAL & DEMOGRAPHIC INFORMATION */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
            <User size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Información Personal & Demográfica
            </h3>
            <p className="text-[11px] text-slate-500">
              Filiación básica del paciente, fecha de nacimiento y edad biológica
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Nombre Completo */}
          <div className="md:col-span-6 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Nombre Completo del Paciente *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-black text-slate-900">
                {formData.nombre}
              </div>
            )}
          </div>

          {/* Fecha Nacimiento */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Fecha de Nacimiento *
            </label>
            {isEditing ? (
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono">
                {formData.fecha_nacimiento || 'No registrada'}
              </div>
            )}
          </div>

          {/* Edad Calculada */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Edad Biológica
            </label>
            <div className="p-2.5 bg-cyan-50/60 border border-cyan-200 rounded-xl text-xs font-black text-cyan-900 flex items-center justify-between">
              <span>{age} años cumplidos</span>
              {isMinor && <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Pediátrico</span>}
            </div>
          </div>

          {/* Lugar de Nacimiento */}
          <div className="md:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Lugar de Nacimiento
            </label>
            {isEditing ? (
              <input
                type="text"
                placeholder="Ej. Querétaro, Qro."
                value={formData.lugar_nacimiento}
                onChange={(e) => setFormData({ ...formData, lugar_nacimiento: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                {formData.lugar_nacimiento || 'Sin especificar'}
              </div>
            )}
          </div>

          {/* RFC / Identificación */}
          <div className="md:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              RFC o CURP
            </label>
            {isEditing ? (
              <input
                type="text"
                placeholder="RFC del paciente o tutor"
                value={formData.rfc || ''}
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800">
                {formData.rfc || 'Sin RFC registrado'}
              </div>
            )}
          </div>

          {/* Tutor asignado */}
          <div className="md:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Padre o Tutor Legal</span>
              {isMinor && (
                <button
                  type="button"
                  onClick={() => setShowParentsModal(true)}
                  className="text-cyan-700 hover:underline text-[10px] font-bold"
                >
                  Gestionar
                </button>
              )}
            </label>
            {isEditing ? (
              <input
                type="text"
                placeholder="Nombre del tutor legal"
                value={formData.padre_tutor}
                onChange={(e) => setFormData({ ...formData, padre_tutor: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>{formData.padre_tutor || (isMinor ? '⚠️ Sin tutor asignado' : 'No aplica')}</span>
                {isMinor && formData.padre_tutor && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.2 rounded-md font-black">
                    Tutor
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. SECTION 2: ADDRESS & DOMICILE */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Home size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Domicilio & Ubicación del Paciente
            </h3>
            <p className="text-[11px] text-slate-500">
              Dirección para entrega de recibos, presupuestos y notificaciones de citas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Calle */}
          <div className="md:col-span-6 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Calle
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.calle}
                onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                {formData.calle || 'Sin calle'}
              </div>
            )}
          </div>

          {/* Num Exterior */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Núm. Exterior
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.num_exterior}
                onChange={(e) => setFormData({ ...formData, num_exterior: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                {formData.num_exterior || '-'}
              </div>
            )}
          </div>

          {/* Num Interior */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Núm. Interior
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.num_interior}
                onChange={(e) => setFormData({ ...formData, num_interior: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                {formData.num_interior || '-'}
              </div>
            )}
          </div>

          {/* Colonia */}
          <div className="md:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Colonia
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.colonia}
                onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                {formData.colonia || '-'}
              </div>
            )}
          </div>

          {/* Municipio */}
          <div className="md:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Municipio / Alcaldía
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.municipio}
                onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                {formData.municipio || '-'}
              </div>
            )}
          </div>

          {/* Estado & CP */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Estado
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                {formData.estado || '-'}
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Código Postal
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.cp}
                onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
                className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
              />
            ) : (
              <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800">
                {formData.cp || '-'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. SECTION 3: CONTACT & CLINICAL LOCATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information Card */}
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Phone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Medios de Contacto
              </h3>
              <p className="text-[11px] text-slate-500">
                Teléfonos de recordatorio y notificaciones de WhatsApp
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Celular con WhatsApp */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Celular / WhatsApp *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="Ej. 442 123 4567"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                />
              ) : (
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-900 flex items-center justify-between">
                  <span>{formData.celular || 'Sin celular registrado'}</span>
                  {formData.celular && (
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `Hola ${formData.nombre}, le saludamos de KoneneKoh Dental.`;
                        window.open(`https://wa.me/52${(formData.celular || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                    >
                      Enviar WhatsApp
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Teléfono Fijo */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Teléfono Fijo / Casa
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                />
              ) : (
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                  {formData.telefono || 'Sin teléfono fijo'}
                </div>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Correo Electrónico
              </label>
              {isEditing ? (
                <input
                  type="email"
                  placeholder="paciente@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                />
              ) : (
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                  {formData.email || 'Sin correo registrado'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Sede & Assignment Card */}
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Building2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Adscripción a Sucursal Dental
              </h3>
              <p className="text-[11px] text-slate-500">
                Clínica asignada para expediente, insumos y citas
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Sucursal Principal *
              </label>
              {isEditing ? (
                <select
                  value={formData.location_id || 1}
                  onChange={(e) => {
                    const locId = parseInt(e.target.value);
                    const selLoc = locations.find(l => l.id === locId);
                    setFormData({
                      ...formData,
                      location_id: locId,
                      location_nombre: selLoc ? selLoc.nombre : formData.location_nombre,
                      location_codigo: selLoc ? selLoc.codigo : formData.location_codigo,
                      location_color: selLoc ? selLoc.color : formData.location_color
                    });
                  }}
                  className="w-full text-xs font-bold p-2.5 border border-purple-300 rounded-xl bg-purple-50/30 text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      📍 {loc.nombre} ({loc.codigo})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full ring-2 ring-purple-300 shrink-0"
                    style={{ backgroundColor: formData.location_color || '#8b5cf6' }}
                  />
                  <div>
                    <div className="text-xs font-black text-purple-950">
                      {formData.location_nombre || 'KoneneKoh Sede Central'}
                    </div>
                    <div className="text-[10px] text-purple-700 font-semibold">
                      Código: {formData.location_codigo || 'MATRIZ'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Fecha de Alta:</span>
                <span className="font-mono text-slate-800">{formData.created_at?.split('T')[0] || 'Registro Inicial'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Estatus de Expediente:</span>
                <span className={`font-black ${formData.activo === 1 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formData.activo === 1 ? 'Vigente & Activo' : 'Expediente Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MODAL: GESTIÓN DE PADRES Y TUTORES */}
      {showParentsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Users size={16} />
                </div>
                <h3 className="font-black text-base text-slate-800">Datos de Padres / Tutor Legal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowParentsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nombre Completo del Padre, Madre o Tutor *
                </label>
                <input
                  type="text"
                  placeholder="Ej. María Elena Sánchez"
                  value={tutorNombre}
                  onChange={(e) => setTutorNombre(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Parentesco
                </label>
                <select
                  value={tutorParentesco}
                  onChange={(e) => setTutorParentesco(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Tutor Legal">Tutor Legal</option>
                  <option value="Abuelo/a">Abuelo / Abuela</option>
                  <option value="Familiar">Familiar Responsable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Teléfono de Contacto Inmediato
                </label>
                <input
                  type="text"
                  placeholder="Ej. 442 987 6543"
                  value={tutorTelefono}
                  onChange={(e) => setTutorTelefono(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowParentsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTutor}
                disabled={saving}
                className="px-5 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-xs"
              >
                Guardar Tutor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
