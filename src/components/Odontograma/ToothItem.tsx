import React from 'react';
import { ToothCondition, ToothSurfaceKey } from '../../types';

interface ToothItemProps {
  toothNumber: number;
  condition?: ToothCondition;
  isUpper: boolean;
  isRightQuadrant: boolean;
  selected?: boolean;
  onClick: (toothNumber: number, surface?: ToothSurfaceKey) => void;
  readOnly?: boolean;
}

export const ToothItem: React.FC<ToothItemProps> = ({
  toothNumber,
  condition = {},
  isUpper,
  isRightQuadrant,
  selected = false,
  onClick,
  readOnly = false,
}) => {
  const surfaces = condition.surfaces || {};
  const wholeState = condition.state;

  // Surface keys mapping based on anatomical position
  // Upper teeth: Top is Vestibular (V), Bottom is Palatino (L)
  // Lower teeth: Top is Lingual (L), Bottom is Vestibular (V)
  const topKey: ToothSurfaceKey = isUpper ? 'v' : 'l';
  const bottomKey: ToothSurfaceKey = isUpper ? 'l' : 'v';

  // Mesial is towards the center midline between 11/21 and 41/31
  // For Right quadrants (1, 4, 5, 8), Midline is to the right side of the screen
  // For Left quadrants (2, 3, 6, 7), Midline is to the left side of the screen
  const leftKey: ToothSurfaceKey = isRightQuadrant ? 'd' : 'm';
  const rightKey: ToothSurfaceKey = isRightQuadrant ? 'm' : 'd';
  const centerKey: ToothSurfaceKey = 'o';

  const getColor = (surfaceKey: ToothSurfaceKey): string => {
    const s = surfaces[surfaceKey];
    if (!s) return '#ffffff';
    switch (s.condition) {
      case 'caries':
        return '#ef4444'; // Red
      case 'obturado':
        return '#3b82f6'; // Blue
      case 'sellador':
        return '#06b6d4'; // Cyan
      case 'fractura':
        return '#f97316'; // Orange
      default:
        return '#ffffff';
    }
  };

  const isAusente = wholeState === 'ausente';
  const isCorona = wholeState === 'corona';
  const isEndodoncia = wholeState === 'endodoncia';
  const isImplante = wholeState === 'implante';

  return (
    <div
      className={`inline-flex flex-col items-center p-1.5 rounded-lg transition-all ${
        selected ? 'bg-cyan-100 ring-2 ring-cyan-500 scale-105' : 'hover:bg-slate-100'
      }`}
    >
      {/* Top Label (for upper teeth, number goes on top) */}
      {isUpper && (
        <span
          onClick={() => onClick(toothNumber)}
          className={`text-xs font-bold mb-1 cursor-pointer px-1 rounded ${
            selected ? 'bg-cyan-600 text-white' : 'text-slate-700 hover:text-cyan-600'
          }`}
        >
          {toothNumber}
        </span>
      )}

      {/* SVG Tooth representation */}
      <div className="relative cursor-pointer select-none">
        <svg
          width="44"
          height="44"
          viewBox="0 0 100 100"
          className={`drop-shadow-sm transition-transform ${isCorona ? 'ring-2 ring-purple-500 rounded-sm' : ''}`}
        >
          {/* Surface Top (Vestibular / Lingual) */}
          <polygon
            points="0,0 100,0 75,25 25,25"
            fill={getColor(topKey)}
            stroke="#64748b"
            strokeWidth="2.5"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) onClick(toothNumber, topKey);
            }}
          />

          {/* Surface Bottom (Palatino / Vestibular) */}
          <polygon
            points="0,100 100,100 75,75 25,75"
            fill={getColor(bottomKey)}
            stroke="#64748b"
            strokeWidth="2.5"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) onClick(toothNumber, bottomKey);
            }}
          />

          {/* Surface Left (Mesial / Distal) */}
          <polygon
            points="0,0 25,25 25,75 0,100"
            fill={getColor(leftKey)}
            stroke="#64748b"
            strokeWidth="2.5"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) onClick(toothNumber, leftKey);
            }}
          />

          {/* Surface Right (Distal / Mesial) */}
          <polygon
            points="100,0 75,25 75,75 100,100"
            fill={getColor(rightKey)}
            stroke="#64748b"
            strokeWidth="2.5"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) onClick(toothNumber, rightKey);
            }}
          />

          {/* Surface Center (Oclusal / Incisal) */}
          <polygon
            points="25,25 75,25 75,75 25,75"
            fill={getColor(centerKey)}
            stroke="#64748b"
            strokeWidth="2.5"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) onClick(toothNumber, centerKey);
            }}
          />

          {/* Whole tooth overlay: Ausente / Extraído (Cross) */}
          {isAusente && (
            <g stroke="#ef4444" strokeWidth="5" strokeLinecap="round">
              <line x1="8" y1="8" x2="92" y2="92" />
              <line x1="92" y1="8" x2="8" y2="92" />
            </g>
          )}

          {/* Whole tooth overlay: Endodoncia (Vertical Line with apex circle) */}
          {isEndodoncia && (
            <g stroke="#ec4899" strokeWidth="5">
              <line x1="50" y1="10" x2="50" y2="90" />
              <circle cx="50" cy={isUpper ? 15 : 85} r="6" fill="#ec4899" />
            </g>
          )}

          {/* Whole tooth overlay: Corona (Crown circle indicator) */}
          {isCorona && (
            <circle cx="50" cy="50" r="42" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="6,4" />
          )}

          {/* Whole tooth overlay: Implante */}
          {isImplante && (
            <g stroke="#0284c7" strokeWidth="3" fill="none">
              <circle cx="50" cy="50" r="16" />
              <line x1="50" y1="30" x2="50" y2="70" />
              <line x1="42" y1="42" x2="58" y2="42" />
              <line x1="42" y1="58" x2="58" y2="58" />
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Label (for lower teeth, number goes on bottom) */}
      {!isUpper && (
        <span
          onClick={() => onClick(toothNumber)}
          className={`text-xs font-bold mt-1 cursor-pointer px-1 rounded ${
            selected ? 'bg-cyan-600 text-white' : 'text-slate-700 hover:text-cyan-600'
          }`}
        >
          {toothNumber}
        </span>
      )}
    </div>
  );
};
