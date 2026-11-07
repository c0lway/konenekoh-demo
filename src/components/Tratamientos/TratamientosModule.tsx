import React, { useState } from 'react';
import { Tratamiento } from '../../types';
import { api } from '../../services/api';
import { Plus, X, Stethoscope } from 'lucide-react';

interface TratamientosModuleProps {
  tratamientos: Tratamiento[];
  onRefresh: () => void;
  onClose?: () => void;
}

export const TratamientosModule: React.FC<TratamientosModuleProps> = ({
  tratamientos,
  onRefresh,
  onClose,
}) => {
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [codigo, setCodigo] = useState<string>(`TRAT-0${tratamientos.length + 1}`);
  const [nombre, setNombre] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Operatoria');
  const [precio, setPrecio] = useState<number>(850);
  const [color, setColor] = useState<string>('#ef4444');

  const handleSave = async () => {
    if (!nombre || precio <= 0) return;
    try {
      await api.createTratamiento({
        codigo,
        nombre,
        categoria,
        precio,
        color_sugerido: color,
      });
      setShowAdd(!showAdd);
      onRefresh();
    } catch (err) {
      console.error('Error al guardar tratamiento:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Stethoscope size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Catálogo de Tratamientos</h2>
            <p className="text-xs text-slate-500">Procedimientos dentales y precios sugeridos para el odontograma</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5"
          >
            <Plus size={16} />
            <span>+ Tratamiento</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#48cae4] text-slate-900 font-bold text-[11px]">
            <tr>
              <th className="py-3 px-4 w-12">#</th>
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Nombre del Procedimiento</th>
              <th className="py-3 px-4">Especialidad / Categoría</th>
              <th className="py-3 px-4 text-right">Precio Base ($ MXN)</th>
              <th className="py-3 px-4 text-center">Color Odontograma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {tratamientos.map((t, idx) => (
              <tr key={t.id} className="hover:bg-cyan-50/50 transition-colors">
                <td className="py-3 px-4 text-slate-400 font-semibold">{idx + 1}</td>
                <td className="py-3 px-4 font-mono font-bold text-cyan-800">{t.codigo}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{t.nombre}</td>
                <td className="py-3 px-4 text-slate-600">{t.categoria}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                  ${t.precio.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                    style={{ backgroundColor: t.color_sugerido || '#ef4444' }}
                  ></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-800">Nuevo Tratamiento Dental</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                placeholder="Ej. Resina 1 Superficie"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                >
                  <option value="Operatoria">Operatoria</option>
                  <option value="Odontopediatría">Odontopediatría</option>
                  <option value="Endodoncia">Endodoncia</option>
                  <option value="Prótesis">Prótesis</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Preventiva">Preventiva</option>
                  <option value="Ortodoncia">Ortodoncia</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Precio Sugerido ($)</label>
                <input
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 rounded-lg"
              >
                Guardar Tratamiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
