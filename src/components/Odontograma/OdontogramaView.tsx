import React, { useState } from 'react';
import { OdontogramState, ToothCondition, ToothSurfaceKey, Tratamiento, PresupuestoItem } from '../../types';
import { ToothItem } from './ToothItem';
import { Stethoscope, PlusCircle, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

interface OdontogramaViewProps {
  odontogramData: OdontogramState;
  onChangeOdontogram: (newData: OdontogramState) => void;
  onAddPresupuestoItem?: (item: PresupuestoItem) => void;
  tratamientos: Tratamiento[];
  tipoDenticion: 'adulto' | 'pediatrico' | 'mixto';
  onChangeDenticion: (tipo: 'adulto' | 'pediatrico' | 'mixto') => void;
  readOnly?: boolean;
}

export const OdontogramaView: React.FC<OdontogramaViewProps> = ({
  odontogramData,
  onChangeOdontogram,
  onAddPresupuestoItem,
  tratamientos,
  tipoDenticion,
  onChangeDenticion,
  readOnly = false,
}) => {
  // Active selected tooth and surface for modal/popover
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<ToothSurfaceKey | null>(null);

  // Form state for selected tooth/surface treatment
  const [condition, setCondition] = useState<'caries' | 'obturado' | 'sellador' | 'fractura' | 'sano'>('caries');
  const [wholeState, setWholeState] = useState<'sano' | 'ausente' | 'endodoncia' | 'corona' | 'implante' | 'protesis'>('sano');
  const [selectedTratamientoId, setSelectedTratamientoId] = useState<number | ''>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(0);

  // FDI quadrants
  const adultUpperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const adultUpperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const adultLowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const adultLowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const pedUpperRight = [55, 54, 53, 52, 51];
  const pedUpperLeft = [61, 62, 63, 64, 65];
  const pedLowerRight = [85, 84, 83, 82, 81];
  const pedLowerLeft = [71, 72, 73, 74, 75];

  const handleToothClick = (tooth: number, surface?: ToothSurfaceKey) => {
    setSelectedTooth(tooth);
    setSelectedSurface(surface || null);

    const toothData = odontogramData[tooth] || {};
    if (surface && toothData.surfaces && toothData.surfaces[surface]) {
      setCondition(toothData.surfaces[surface]?.condition || 'caries');
    } else {
      setCondition('caries');
    }

    setWholeState(toothData.state || 'sano');

    // Auto-suggest treatment based on context
    if (surface) {
      const surfaceName = surface === 'o' ? 'Oclusal' : surface === 'm' ? 'Mesial' : surface === 'd' ? 'Distal' : surface === 'v' ? 'Vestibular' : 'Lingual/Palatina';
      const defaultTrat = tratamientos.find(t => t.nombre.toLowerCase().includes('resina 1')) || tratamientos[0];
      if (defaultTrat) {
        setSelectedTratamientoId(defaultTrat.id);
        setCustomDescription(`${defaultTrat.nombre} (${surfaceName.toUpperCase()}) - Diente ${tooth}`);
        setCustomPrice(defaultTrat.precio);
      }
    } else {
      const defaultTrat = tratamientos[0];
      if (defaultTrat) {
        setSelectedTratamientoId(defaultTrat.id);
        setCustomDescription(`Tratamiento Diente ${tooth}`);
        setCustomPrice(defaultTrat.precio);
      }
    }
  };

  const handleTratamientoSelect = (tratId: number) => {
    setSelectedTratamientoId(tratId);
    const trat = tratamientos.find(t => t.id === tratId);
    if (trat && selectedTooth) {
      const surfaceName = selectedSurface ? ` cara ${selectedSurface.toUpperCase()}` : '';
      setCustomDescription(`${trat.nombre}${surfaceName} - Diente ${selectedTooth}`);
      setCustomPrice(trat.precio);
    }
  };

  const handleSaveAndAddToBudget = () => {
    if (!selectedTooth) return;

    const currentTooth = { ...(odontogramData[selectedTooth] || {}) };
    const currentSurfaces = { ...(currentTooth.surfaces || {}) };

    if (selectedSurface) {
      if (condition === 'sano') {
        delete currentSurfaces[selectedSurface];
      } else {
        currentSurfaces[selectedSurface] = {
          condition,
          treatment: customDescription,
          price: customPrice,
        };
      }
      currentTooth.surfaces = currentSurfaces;
    }

    if (wholeState !== 'sano') {
      currentTooth.state = wholeState;
    } else if (!selectedSurface) {
      currentTooth.state = undefined;
    }

    const updatedOdontogram: OdontogramState = {
      ...odontogramData,
      [selectedTooth]: currentTooth,
    };

    onChangeOdontogram(updatedOdontogram);

    // If a treatment and price are set, add to the budget items list!
    if (onAddPresupuestoItem && customPrice > 0) {
      const newItem: PresupuestoItem = {
        diente: selectedTooth,
        superficie: selectedSurface ? selectedSurface.toUpperCase() : 'Pieza Completa',
        tratamiento_id: typeof selectedTratamientoId === 'number' ? selectedTratamientoId : null,
        descripcion: customDescription || `Tratamiento Diente ${selectedTooth}`,
        precio_unitario: customPrice,
        cantidad: 1,
        descuento: 0,
        total: customPrice,
        estado: 'Pendiente',
        color: condition === 'caries' ? '#ef4444' : '#3b82f6',
      };
      onAddPresupuestoItem(newItem);
    }

    setSelectedTooth(null);
    setSelectedSurface(null);
  };

  const showAdult = tipoDenticion === 'adulto' || tipoDenticion === 'mixto';
  const showPediatric = tipoDenticion === 'pediatrico' || tipoDenticion === 'mixto';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      {/* Top Header & Dentition Selector */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            🦷
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Odontograma Interactivo (FDI)</h3>
            <p className="text-xs text-slate-500">Selecciona un diente o superficie para diagnosticar y presupuestar</p>
          </div>
        </div>

        {/* Dentition Toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            type="button"
            onClick={() => onChangeDenticion('adulto')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              tipoDenticion === 'adulto' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:text-cyan-700'
            }`}
          >
            Adulto (Permanente)
          </button>
          <button
            type="button"
            onClick={() => onChangeDenticion('pediatrico')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              tipoDenticion === 'pediatrico' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:text-cyan-700'
            }`}
          >
            Pediátrico (Temporal)
          </button>
          <button
            type="button"
            onClick={() => onChangeDenticion('mixto')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              tipoDenticion === 'mixto' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:text-cyan-700'
            }`}
          >
            Mixto
          </button>
        </div>
      </div>

      {/* Odontogram Graphical Canvas */}
      <div className="overflow-x-auto py-2">
        <div className="min-w-[650px] flex flex-col items-center select-none">
          {/* Label: Arcada Superior */}
          <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
            Arcada Superior (Maxilar)
          </div>

          {/* Adult Upper Arch */}
          {showAdult && (
            <div className="flex items-center space-x-1 border-b border-dashed border-slate-200 pb-2 mb-2">
              {/* Quadrant 1 (Right) */}
              <div className="flex items-center space-x-0.5">
                {adultUpperRight.map((tooth) => (
                  <ToothItem
                    key={tooth}
                    toothNumber={tooth}
                    condition={odontogramData[tooth]}
                    isUpper={true}
                    isRightQuadrant={true}
                    selected={selectedTooth === tooth}
                    onClick={handleToothClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>

              {/* Midline divider */}
              <div className="h-12 w-0.5 bg-cyan-300 mx-1"></div>

              {/* Quadrant 2 (Left) */}
              <div className="flex items-center space-x-0.5">
                {adultUpperLeft.map((tooth) => (
                  <ToothItem
                    key={tooth}
                    toothNumber={tooth}
                    condition={odontogramData[tooth]}
                    isUpper={true}
                    isRightQuadrant={false}
                    selected={selectedTooth === tooth}
                    onClick={handleToothClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pediatric Upper Arch */}
          {showPediatric && (
            <div className="flex items-center space-x-1 pb-2 mb-2 bg-amber-50/50 p-1.5 rounded-lg border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 uppercase -rotate-90 px-1">Temporal</span>
              {/* Quadrant 5 */}
              <div className="flex items-center space-x-0.5">
                {pedUpperRight.map((tooth) => (
                  <ToothItem
                    key={tooth}
                    toothNumber={tooth}
                    condition={odontogramData[tooth]}
                    isUpper={true}
                    isRightQuadrant={true}
                    selected={selectedTooth === tooth}
                    onClick={handleToothClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>

              {/* Midline divider */}
              <div className="h-10 w-0.5 bg-amber-300 mx-1"></div>

              {/* Quadrant 6 */}
              <div className="flex items-center space-x-0.5">
                {pedUpperLeft.map((tooth) => (
                  <ToothItem
                    key={tooth}
                    toothNumber={tooth}
                    condition={odontogramData[tooth]}
                    isUpper={true}
                    isRightQuadrant={false}
                    selected={selectedTooth === tooth}
                    onClick={handleToothClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Central Line / Occlusal Plane */}
          <div className="w-full flex items-center justify-between px-6 py-1 my-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Derecha (Paciente)</span>
            <div className="flex-1 border-t-2 border-cyan-400 border-dashed mx-4"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Izquierda (Paciente)</span>
          </div>

          {/* Pediatric Lower Arch */}
          {showPediatric && (
            <div className="flex items-center space-x-1 pt-2 mt-2 bg-amber-50/50 p-1.5 rounded-lg border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 uppercase -rotate-90 px-1">Temporal</span>
              {/* Quadrant 8 */}
              <div className="flex items-center space-x-0.5">
                {pedLowerRight.map((tooth) => (
                  <ToothItem
                    key={tooth}
                    toothNumber={tooth}
                    condition={odontogramData[tooth]}
                    isUpper={false}
                    isRightQuadrant={true}
                    selected={selectedTooth === tooth}
                    onClick={handleToothClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>

              {/* Midline divider */}
              <div className="h-10 w-0.5 bg-amber-300 mx-1"></div>

              {/* Quadrant 7 */}
              <div className="flex items-center space-x-0.5">
                {pedLowerLeft.map((tooth) => (
                  <ToothItem
                    key={tooth}
                    toothNumber={tooth}
                    condition={odontogramData[tooth]}
                    isUpper={false}
                    isRightQuadrant={false}
                    selected={selectedTooth === tooth}
                    onClick={handleToothClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Adult Lower Arch */}
          {showAdult && (
            <div className="flex items-center space-x-1 border-t border-dashed border-slate-200 pt-2 mt-2">
              {/* Quadrant 4 */}
              <div className="flex items-center space-x-0.5">
                {adultLowerRight.map((tooth) => (
                  <ToothItem
                    key={tooth}
                    toothNumber={tooth}
                    condition={odontogramData[tooth]}
                    isUpper={false}
                    isRightQuadrant={true}
                    selected={selectedTooth === tooth}
                    onClick={handleToothClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>

              {/* Midline divider */}
              <div className="h-12 w-0.5 bg-cyan-300 mx-1"></div>

              {/* Quadrant 3 */}
              <div className="flex items-center space-x-0.5">
                {adultLowerLeft.map((tooth) => (
                  <ToothItem
                    key={tooth}
                    toothNumber={tooth}
                    condition={odontogramData[tooth]}
                    isUpper={false}
                    isRightQuadrant={false}
                    selected={selectedTooth === tooth}
                    onClick={handleToothClick}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Label: Arcada Inferior */}
          <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mt-2">
            Arcada Inferior (Mandíbula)
          </div>
        </div>
      </div>

      {/* Visual Color Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-red-500 inline-block shadow-sm"></span>
          <span>Caries / A tratar</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-blue-500 inline-block shadow-sm"></span>
          <span>Obturación existente</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-cyan-500 inline-block shadow-sm"></span>
          <span>Sellador</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-purple-500 inline-block shadow-sm"></span>
          <span>Corona</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-pink-500 inline-block shadow-sm"></span>
          <span>Endodoncia</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-slate-600 inline-block shadow-sm"></span>
          <span>Ausente / Extraído</span>
        </div>
      </div>

      {/* Modal / Dialog for Selected Tooth & Treatment Assignment */}
      {selectedTooth && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-black bg-white/20 px-3 py-1 rounded-lg">
                  {selectedTooth}
                </span>
                <div>
                  <h4 className="font-bold text-lg">Diente {selectedTooth}</h4>
                  <p className="text-xs text-cyan-100">
                    {selectedSurface ? `Superficie seleccionada: ${selectedSurface.toUpperCase()}` : 'Diente completo'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTooth(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Diagnosis / Condition Selector */}
              {selectedSurface && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Condición de la Superficie ({selectedSurface.toUpperCase()})
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'caries', label: 'Caries (Rojo)', color: 'bg-red-50 text-red-700 border-red-300' },
                      { id: 'obturado', label: 'Obturado (Azul)', color: 'bg-blue-50 text-blue-700 border-blue-300' },
                      { id: 'sellador', label: 'Sellador (Cyan)', color: 'bg-cyan-50 text-cyan-700 border-cyan-300' },
                      { id: 'fractura', label: 'Fractura (Naranja)', color: 'bg-orange-50 text-orange-700 border-orange-300' },
                      { id: 'sano', label: 'Sano / Limpiar', color: 'bg-slate-50 text-slate-700 border-slate-200' },
                    ].map((cond) => (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => setCondition(cond.id as any)}
                        className={`text-xs font-semibold py-2 px-3 rounded-lg border text-center transition-all ${
                          condition === cond.id ? `${cond.color} ring-2 ring-cyan-500 font-bold shadow-sm` : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Whole Tooth Condition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Estado General de la Pieza
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sano', label: 'Presente' },
                    { id: 'ausente', label: 'Ausente / Extraer' },
                    { id: 'endodoncia', label: 'Endodoncia' },
                    { id: 'corona', label: 'Corona' },
                    { id: 'implante', label: 'Implante' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setWholeState(st.id as any)}
                      className={`text-xs font-semibold py-2 px-3 rounded-lg border text-center transition-all ${
                        wholeState === st.id ? 'bg-cyan-50 border-cyan-500 text-cyan-800 ring-2 ring-cyan-400 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Treatment and Budget Connection (The requested feature!) */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center space-x-2 text-cyan-700 mb-2">
                  <Sparkles size={16} />
                  <label className="text-xs font-bold uppercase tracking-wide">
                    Añadir al Presupuesto de Tratamiento
                  </label>
                </div>

                <div className="space-y-3 bg-cyan-50/50 p-3.5 rounded-xl border border-cyan-100">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Seleccionar del Catálogo de Tratamientos
                    </label>
                    <select
                      value={selectedTratamientoId}
                      onChange={(e) => handleTratamientoSelect(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">-- Seleccionar tratamiento sugerido --</option>
                      {tratamientos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} - ${t.precio.toFixed(2)} ({t.categoria})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Descripción en el Presupuesto
                    </label>
                    <input
                      type="text"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Ej. Resina 1 superficie Oclusal Diente 54"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Costo Presupuestado ($ MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">$</span>
                        <input
                          type="number"
                          step="10"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-bold pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTooth(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAndAddToBudget}
                className="px-4 py-2 text-xs font-bold bg-cyan-600 text-white rounded-lg shadow-sm hover:bg-cyan-700 flex items-center space-x-1.5"
              >
                <Check size={16} />
                <span>Guardar y Añadir a Presupuesto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
