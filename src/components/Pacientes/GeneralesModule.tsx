import React, { useState, useEffect } from 'react';
import { Patient, Location } from '../../types';
import { api } from '../../services/api';
import { 
  Edit2, Save, X, Phone, Mail, MapPin, Calendar, 
  User, FileText, Check, Users, HeartHandshake, ShieldAlert, Building2
} from 'lucide-react';

interface GeneralesModuleProps {
  patient: Patient;
  locations?: Location[];
  onUpdatePatient: (updated: Patient) => void;
}

export const GeneralesModule: React.FC<GeneralesModuleProps> = ({ patient, locations = [], onUpdatePatient }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Patient>({ ...patient });
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Modal: Información de Padres / Tutor (Solo para menores de edad)
  const [showParentsModal, setShowParentsModal] = useState<boolean>(false);
  const [tutorNombre, setTutorNombre] = useState<string>(patient.padre_tutor || '');
  const [tutorParentesco, setTutorParentesco] = useState<string>('Madre');
  const [tutorTelefono, setTutorTelefono] = useState<string>(patient.celular || '');
  const [tutorNotas, setTutorNotas] = useState<string>('');

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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 space-y-6 animate-in fade-in">
      {/* Top Bar matching FileMaker Screenshot 1 + Conditional Padres Button for Minors */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="bg-[#48cae4] text-slate-900 font-black text-sm px-4 py-1.5 rounded-full shadow-xs">
            Expediente: {formData.expediente}
          </span>

          <span className="bg-[#2ec4b6]/15 text-[#0f766e] font-bold text-xs px-3 py-1.5 rounded-xl border border-[#2ec4b6]/30">
            RFC: {formData.rfc || 'Sin RFC'}
          </span>

          {/* Location Badge */}
          <span className="bg-purple-50 text-purple-800 font-bold text-xs px-3 py-1.5 rounded-xl border border-purple-200 flex items-center space-x-1 shadow-2xs">
            <Building2 size={13} className="text-purple-600" />
            <span>{formData.location_nombre || 'Matriz'}</span>
          </span>

          {/* Age & Pediatric Badge */}
          {isMinor ? (
            <span className="bg-amber-100/80 text-amber-900 border border-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-2xs">
              <span>👶 Menor de edad ({age} años)</span>
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl">
              Adulto ({age} años)
            </span>
          )}

          {/* BOTÓN DE PADRES: Se muestra EXCLUSIVAMENTE cuando el paciente es MENOR DE EDAD */}
          {isMinor && (
            <button
              type="button"
              onClick={() => setShowParentsModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 hover:shadow hover:scale-[1.02]"
              title="Ver o editar datos del Padre, Madre o Tutor Legal"
            >
              <Users size={15} />
              <span>Padres ({formData.padre_tutor ? formData.padre_tutor.split(' ')[0] : 'Asignar'})</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Active / Inactive Radio buttons */}
          <div className="flex items-center space-x-3 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="activo"
                checked={formData.activo === 1}
                disabled={!isEditing}
                onChange={() => setFormData({ ...formData, activo: 1 })}
                className="text-cyan-600 focus:ring-cyan-500"
              />
              <span className={formData.activo === 1 ? 'text-emerald-700' : ''}>Activo</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="activo"
                checked={formData.activo === 0}
                disabled={!isEditing}
                onChange={() => setFormData({ ...formData, activo: 0 })}
                className="text-cyan-600 focus:ring-cyan-500"
              />
              <span className={formData.activo === 0 ? 'text-rose-700' : ''}>Inactivo</span>
            </label>
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
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                <X size={18} />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#2ec4b6] hover:bg-[#20a396] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
              >
                <Save size={16} />
                <span>{saving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#48cae4] hover:bg-[#00b4d8] text-slate-900 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Edit2 size={15} />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-3 rounded-xl border border-emerald-200 flex items-center animate-in fade-in">
          <Check size={16} className="mr-2" /> Datos generales del paciente actualizados con éxito.
        </div>
      )}

      {/* Minor Patient Notice Banner with Parents button */}
      {isMinor && (
        <div className="bg-gradient-to-r from-amber-50/90 to-amber-100/60 p-4 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  Tutor Legal Asignado
                </span>
                <span className="text-[10px] font-bold bg-amber-200/70 text-amber-800 px-2 py-0.2 rounded-full">
                  Odontopediatría
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {formData.padre_tutor ? (
                  <span>{formData.padre_tutor} • Tel: {formData.celular || 'Sin teléfono'}</span>
                ) : (
                  <span className="text-amber-700 italic">No se ha asignado un padre o tutor legal a este menor.</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowParentsModal(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
          >
            <Users size={14} />
            <span>Gestionar Padres / Tutor</span>
          </button>
        </div>
      )}

      {/* Form Fields arranged exactly like FileMaker Screenshot 1 */}
      <div className="space-y-6">
        {/* Row 1: Nombre, Fecha Nacimiento, Edad, Lugar de Nacimiento */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Nombre Completo
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full text-sm font-semibold p-2.5 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-base font-bold text-slate-900 border-b border-slate-300 pb-1.5 pt-1">
                {formData.nombre}
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Fecha Nacimiento
            </label>
            {isEditing ? (
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.fecha_nacimiento || 'No registrada'}
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Edad
            </label>
            <div className="text-sm font-black text-cyan-800 border-b border-slate-300 pb-1.5 pt-1">
              {age}
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Lugar Nacimiento
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lugar_nacimiento}
                onChange={(e) => setFormData({ ...formData, lugar_nacimiento: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.lugar_nacimiento || '-'}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Calle, Núm Exterior, Núm Interior */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Calle
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.calle}
                onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.calle || '-'}
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Núm Exterior
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.num_exterior}
                onChange={(e) => setFormData({ ...formData, num_exterior: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.num_exterior || '-'}
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Núm Interior
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.num_interior}
                onChange={(e) => setFormData({ ...formData, num_interior: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.num_interior || '-'}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Colonia, Municipio, Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Colonia
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.colonia}
                onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.colonia || '-'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Municipio
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.municipio}
                onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.municipio || '-'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Estado
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.estado || '-'}
              </div>
            )}
          </div>
        </div>

        {/* Row 4: C.P., Teléfono, Celular */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              C.P.
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.cp}
                onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.cp || '-'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Teléfono Fijo
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.telefono || '-'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Celular / WhatsApp
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-bold text-cyan-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.celular || '-'}
              </div>
            )}
          </div>
        </div>

        {/* Row 5: Correo Electrónico & Tutor Legal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Correo Electrónico
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-medium text-slate-800 border-b border-slate-300 pb-1.5 pt-1">
                {formData.email || '-'}
              </div>
            )}
          </div>

          {/* Padre / Tutor (visible o editable) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center justify-between">
              <span>{isMinor ? 'Padre / Madre / Tutor Legal *' : 'Contacto de Emergencia / Familiar'}</span>
              {isMinor && !isEditing && (
                <button
                  type="button"
                  onClick={() => setShowParentsModal(true)}
                  className="text-cyan-600 hover:underline text-[11px] font-bold"
                >
                  Editar Tutor
                </button>
              )}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.padre_tutor}
                onChange={(e) => setFormData({ ...formData, padre_tutor: e.target.value })}
                className="w-full text-sm p-2 border-b-2 border-cyan-500 bg-cyan-50/20 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1.5 pt-1 flex items-center justify-between">
                <span>{formData.padre_tutor || (isMinor ? '⚠️ Sin tutor asignado' : 'No asignado')}</span>
                {isMinor && formData.padre_tutor && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Tutor Oficial
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 6: Sucursal / Ubicación Asignada */}
        <div className="bg-gradient-to-r from-purple-50/60 to-indigo-50/40 p-4 rounded-2xl border border-purple-200/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-black text-purple-900 uppercase tracking-wide mb-1 flex items-center space-x-1.5">
                <Building2 size={15} className="text-purple-600" />
                <span>Clínica / Sucursal Asignada al Paciente</span>
              </label>
              <p className="text-[11px] text-purple-700/80 mb-2">
                Define la sede para citas, expediente físico, almacén de insumos y reportes del paciente.
              </p>
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
                  className="w-full text-xs font-bold p-2.5 border-2 border-purple-300 rounded-xl bg-white text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                >
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        📍 {loc.nombre} ({loc.codigo}) - {loc.direccion}
                      </option>
                    ))
                  ) : (
                    <option value={1}>KoneneKoh Corregidora (Matriz)</option>
                  )}
                </select>
              ) : (
                <div className="flex items-center space-x-3 bg-white px-3.5 py-2.5 rounded-xl border border-purple-200 shadow-2xs">
                  <div 
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-purple-200" 
                    style={{ backgroundColor: formData.location_color || '#06b6d4' }}
                  />
                  <div>
                    <div className="text-xs font-extrabold text-slate-800 flex items-center space-x-2">
                      <span>{formData.location_nombre || 'KoneneKoh Corregidora (Matriz)'}</span>
                      {formData.location_codigo && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-black px-1.5 py-0.5 rounded">
                          {formData.location_codigo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-purple-100">
              <span className="font-bold text-slate-700 block mb-1">Información de la Sede:</span>
              <p className="text-[11px] text-slate-500">
                {locations.find(l => l.id === formData.location_id)?.direccion || 'Av. Constituyentes #120, Corregidora, Qro.'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Tel: {locations.find(l => l.id === formData.location_id)?.telefono || '442-123-4567'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: GESTIÓN DE PADRES / TUTOR (Solo para Menores de Edad) */}
      {showParentsModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800">Datos de los Padres / Tutor</h3>
                  <p className="text-[11px] text-slate-500">Paciente menor: {formData.nombre} ({age} años)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowParentsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nombre Completo del Padre, Madre o Tutor *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sra. Mariana López"
                  value={tutorNombre}
                  onChange={(e) => setTutorNombre(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Parentesco
                  </label>
                  <select
                    value={tutorParentesco}
                    onChange={(e) => setTutorParentesco(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="Madre">Madre</option>
                    <option value="Padre">Padre</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                    <option value="Abuelo/a">Abuelo / Abuela</option>
                    <option value="Tío/a">Tío / Tía</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Teléfono Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={tutorTelefono}
                    onChange={(e) => setTutorTelefono(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Observaciones de Custodia / Autorización
                </label>
                <textarea
                  rows={2}
                  placeholder="Autorizado para firmar presupuestos y consentimientos informados..."
                  value={tutorNotas}
                  onChange={(e) => setTutorNotas(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-sm"
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
