import React from 'react';
import { LicenciaStatus } from '../../types';
import { AlertTriangle, Lock, Download, RefreshCw, Sparkles, ShieldAlert } from 'lucide-react';

interface ReadOnlyBannerProps {
  status: LicenciaStatus;
  onOpenLicenseModal: () => void;
  onExportData: () => void;
}

export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({
  status,
  onOpenLicenseModal,
  onExportData,
}) => {
  if (!status.isReadOnly) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-300 relative z-30">
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="p-1.5 bg-white/20 rounded-xl flex-shrink-0 backdrop-blur-xs">
          <ShieldAlert size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-black uppercase tracking-wider text-[11px] bg-black/20 px-2 py-0.5 rounded-md mr-2 inline-block">
            Modo Consulta (Solo Lectura)
          </span>
          <span className="font-semibold text-white/95">
            {status.hasLicense && status.fecha_expiracion
              ? `Tu licencia venció el ${status.fecha_expiracion}. Puedes revisar el historial clínico de tus pacientes y exportar tus datos.`
              : 'El sistema no cuenta con una licencia activa. Puedes consultar información y respaldar datos.'}
          </span>
          <span className="hidden sm:inline text-white/80 ml-1">
            Para registrar nuevos pacientes o agendar nuevas citas, renueva tu suscripción.
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          type="button"
          onClick={onExportData}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition-colors border border-white/30"
          title="Descarga completa de todos los expedientes clínicos y pacientes"
        >
          <Download size={14} />
          <span>Exportar Datos</span>
        </button>

        <button
          type="button"
          onClick={onOpenLicenseModal}
          className="px-3.5 py-1.5 bg-white text-rose-700 hover:bg-rose-50 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
        >
          <Sparkles size={14} className="text-amber-500" />
          <span>Renovar Licencia</span>
        </button>
      </div>
    </div>
  );
};
