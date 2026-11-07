import React, { useState, useEffect } from 'react';
import { Location } from '../../types';
import { api } from '../../services/api';
import { 
  X, Building2, Plus, Edit2, Trash2, MapPin, Phone, Users, 
  Calendar, Check, AlertCircle, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';

interface SucursalesAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationsUpdated: () => void;
}

export const SucursalesAdminModal: React.FC<SucursalesAdminModalProps> = ({
  isOpen,
  onClose,
  onLocationsUpdated,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Form fields
  const [nombre, setNombre] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [color, setColor] = useState<string>('#06b6d4');
  const [activo, setActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const COLOR_PRESETS = [
    '#06b6d4', // Cyan
    '#2ec4b6', // Mint
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#0f4c5c', // Deep Navy
  ];

  useEffect(() => {
    if (isOpen) {
      loadLocations();
    }
  }, [isOpen]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await api.getLocations(true); // include inactive
      setLocations(data);
    } catch (err) {
      console.error('Error al cargar sucursales:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingLoc(null);
    setShowCreateForm(false);
    setNombre('');
    setCodigo('');
    setDireccion('');
    setTelefono('');
    setColor('#06b6d4');
    setActivo(true);
  };

  const handleStartCreate = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const handleStartEdit = (loc: Location) => {
    setEditingLoc(loc);
    setShowCreateForm(false);
    setNombre(loc.nombre);
    setCodigo(loc.codigo);
    setDireccion(loc.direccion || '');
    setTelefono(loc.telefono || '');
    setColor(loc.color || '#06b6d4');
    setActivo(loc.activo === 1);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !codigo) {
      alert('Ingresa el nombre y código de la sucursal');
      return;
    }

    try {
      setSaving(true);
      if (editingLoc) {
        // Update
        await api.updateLocation(editingLoc.id, {
          nombre,
          codigo: codigo.toUpperCase().trim(),
          direccion,
          telefono,
          color,
          activo: activo ? 1 : 0,
        });
        setFeedbackMsg({ type: 'success', text: `Sucursal "${nombre}" actualizada correctamente.` });
      } else {
        // Create
        await api.createLocation({
          nombre,
          codigo: codigo.toUpperCase().trim(),
          direccion,
          telefono,
          color,
        });
        setFeedbackMsg({ type: 'success', text: `Sucursal "${nombre}" creada e inventario inicializado.` });
      }
      resetForm();
      await loadLocations();
      onLocationsUpdated();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Error guardando sucursal:', err);
      setFeedbackMsg({ type: 'error', text: 'Error al guardar la sucursal. Verifica que el código no esté duplicado.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (loc: Location) => {
    const confirmText = loc.total_pacientes && loc.total_pacientes > 0
      ? `La sucursal "${loc.nombre}" tiene ${loc.total_pacientes} paciente(s) asociados. Al dar de baja, se desactivará para proteger el historial médico. ¿Deseas continuar?`
      : `¿Estás seguro de eliminar la sucursal "${loc.nombre}"?`;

    if (!confirm(confirmText)) return;

    try {
      const res = await api.deleteLocation(loc.id);
      if (res.softDeleted) {
        setFeedbackMsg({ type: 'info', text: res.message || 'Sucursal desactivada correctamente.' });
      } else {
        setFeedbackMsg({ type: 'success', text: `Sucursal "${loc.nombre}" eliminada definitivamente.` });
      }
      await loadLocations();
      onLocationsUpdated();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Error al dar de baja sucursal:', err);
      alert('No se pudo completar la operación.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800 via-slate-900 to-cyan-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Building2 size={24} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Administración de Sucursales & Sedes</h2>
              <p className="text-xs text-slate-300 font-medium">
                Crea nuevas clínicas, gestiona direcciones, códigos y estado operativo
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

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' :
            feedbackMsg.type === 'info' ? 'bg-cyan-50 text-cyan-800 border-b border-cyan-200' :
            'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            <span className="flex items-center">
              <Check size={15} className="mr-2 flex-shrink-0" />
              {feedbackMsg.text}
            </span>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Actions & Subheader */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Sedes Registradas ({locations.length})
              </h3>
              <p className="text-xs text-slate-500">
                Cada sucursal cuenta con su propio inventario segmentado, agenda y pacientes asignados
              </p>
            </div>

            {!showCreateForm && !editingLoc && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus size={16} />
                <span>Nueva Sucursal</span>
              </button>
            )}
          </div>

          {/* Form for Creating or Editing */}
          {(showCreateForm || editingLoc) && (
            <div className="bg-gradient-to-br from-cyan-50/50 to-slate-50 p-5 rounded-2xl border-2 border-cyan-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-cyan-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <h4 className="text-sm font-black text-slate-800">
                    {editingLoc ? `Editar Sucursal: ${editingLoc.nombre}` : 'Crear Nueva Sucursal Clínica'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleSaveLocation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre de la Sucursal *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. KoneneKoh Juriquilla"
                      className="w-full text-sm font-semibold px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Código Único (3-6 letras) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      placeholder="JURI"
                      className="w-full text-sm font-mono font-bold uppercase px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dirección Física
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Plaza Central Local 4, Av. Principal..."
                      className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="442 123 4567"
                      className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Color and Active status */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-cyan-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Color Identificador
                    </label>
                    <div className="flex items-center space-x-2">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 ml-2"
                        title="Seleccionar color personalizado"
                      />
                    </div>
                  </div>

                  {editingLoc && (
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activo}
                          onChange={(e) => setActivo(e.target.checked)}
                          className="mr-2 rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span>Sucursal Activa y Operativa</span>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black shadow transition-all"
                    >
                      {saving ? 'Guardando...' : editingLoc ? 'Actualizar Sucursal' : 'Guardar y Habilitar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Location Cards List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <p className="text-xs">Cargando sucursales...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => {
                const isInactive = loc.activo === 0;
                return (
                  <div
                    key={loc.id}
                    className={`p-5 rounded-2xl border transition-all relative group flex flex-col justify-between ${
                      isInactive
                        ? 'bg-slate-50/80 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-cyan-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Badge / Code / Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-sm"
                            style={{ backgroundColor: loc.color || '#06b6d4' }}
                          />
                          <span
                            className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md text-white shadow-sm"
                            style={{ backgroundColor: loc.color || '#06b6d4' }}
                          >
                            {loc.codigo}
                          </span>
                          {isInactive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                              Inactiva
                            </span>
                          )}
                        </div>

                        {/* Card action buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(loc)}
                            className="p-1.5 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Editar datos de sucursal"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLocation(loc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={isInactive ? "Eliminar registro" : "Dar de baja o desactivar"}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Name & details */}
                      <h4 className="text-sm font-black text-slate-800 leading-snug">
                        {loc.nombre}
                      </h4>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-start space-x-2">
                          <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{loc.direccion || 'Sin dirección especificada'}</span>
                        </div>
                        {loc.telefono && (
                          <div className="flex items-center space-x-2">
                            <Phone size={13} className="text-slate-400 flex-shrink-0" />
                            <span>{loc.telefono}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <Users size={13} className="text-cyan-600" />
                        <span className="font-bold text-slate-800">{loc.total_pacientes || 0}</span>
                        <span>pacientes</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-emerald-600" />
                        <span className="font-bold text-slate-800">{loc.citas_hoy || 0}</span>
                        <span>citas hoy</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            Aceptar & Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};