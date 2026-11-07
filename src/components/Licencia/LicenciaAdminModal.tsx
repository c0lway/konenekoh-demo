import React, { useState, useEffect } from 'react';
import { LicenciaStatus, SoftwareUpdateInfo } from '../../types';
import { api } from '../../services/api';
import {
  X, Award, CreditCard, Key, Download, Check, AlertTriangle,
  RefreshCw, ShieldCheck, Sparkles, Calendar, Building2,
  Clock, ArrowRight, Zap, Copy, ExternalLink, HelpCircle, FileText
} from 'lucide-react';

interface LicenciaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenciaStatus: LicenciaStatus;
  onLicenseUpdated: () => void;
}

export const LicenciaAdminModal: React.FC<LicenciaAdminModalProps> = ({
  isOpen,
  onClose,
  licenciaStatus,
  onLicenseUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'estado' | 'planes' | 'voucher' | 'exportar' | 'generador' | 'simulador'>('estado');
  
  // Checkout state
  const [selectedPlan, setSelectedPlan] = useState<'MENSUAL' | 'ANUAL' | 'PRUEBA_REAL'>('ANUAL');
  const [paymentGateway, setPaymentGateway] = useState<'Stripe' | 'Mercado Pago'>('Stripe');
  const [customerEmail, setCustomerEmail] = useState<string>(licenciaStatus.email || 'doctor@konenekoh.com');
  const [customerTitular, setCustomerTitular] = useState<string>(licenciaStatus.titular || 'KoneneKoh Smile Maker');
  const [cardNumber, setCardNumber] = useState<string>('•••• •••• •••• 4242');
  const [cardExp, setCardExp] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('•••');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Voucher activation state
  const [voucherToken, setVoucherToken] = useState<string>('');
  const [activatingVoucher, setActivatingVoucher] = useState<boolean>(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);

  // Generator state (For Software Owner / Seller)
  const [genTitular, setGenTitular] = useState<string>('Clínica Dental Ejemplo');
  const [genEmail, setGenEmail] = useState<string>('contacto@ejemplo.com');
  const [genTipo, setGenTipo] = useState<'MENSUAL' | 'ANUAL' | 'DEMO' | 'VITALICIA'>('ANUAL');
  const [genDias, setGenDias] = useState<number>(365);
  const [genSucursales, setGenSucursales] = useState<number>(5);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Updates state
  const [updatesInfo, setUpdatesInfo] = useState<SoftwareUpdateInfo | null>(null);
  const [loadingUpdates, setLoadingUpdates] = useState<boolean>(false);

  // Export state
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadUpdatesInfo();
    }
  }, [isOpen]);

  const loadUpdatesInfo = async () => {
    try {
      setLoadingUpdates(true);
      const data = await api.checkUpdates();
      setUpdatesInfo(data);
    } catch (err) {
      console.error('Error cargando actualizaciones:', err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  if (!isOpen) return null;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcessingPayment(true);
      setPaymentSuccess(null);

      const res = await api.checkoutLicencia({
        plan: selectedPlan,
        titular: customerTitular,
        email: customerEmail,
        pasarela: paymentGateway,
        autoRenovar: true,
      });

      setPaymentSuccess(res.message);
      onLicenseUpdated();
      await loadUpdatesInfo();
      setTimeout(() => {
        setActiveTab('estado');
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Error al procesar el pago.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleActivateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherToken) return;
    try {
      setActivatingVoucher(true);
      setVoucherError(null);
      setVoucherSuccess(null);

      const res = await api.activateLicencia(voucherToken);
      setVoucherSuccess(res.message);
      setVoucherToken('');
      onLicenseUpdated();
      await loadUpdatesInfo();
      setTimeout(() => {
        setActiveTab('estado');
      }, 2000);
    } catch (err: any) {
      setVoucherError(err.message || 'Clave de licencia inválida.');
    } finally {
      setActivatingVoucher(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.generateLicenseKey({
        titular: genTitular,
        email: genEmail,
        tipo: genTipo,
        dias: genDias,
        sucursales_max: genSucursales,
      });
      setGeneratedKey(res.token);
      setCopiedKey(false);
    } catch (err: any) {
      alert(err.message || 'Error al generar clave.');
    }
  };

  const handleCopyGeneratedKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleSimulateMode = async (modo: 'activa' | 'vencida' | 'sin_licencia') => {
    try {
      await api.simulateLicenseState(modo);
      onLicenseUpdated();
      await loadUpdatesInfo();
    } catch (err) {
      console.error('Error al simular estado:', err);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      await api.exportFullData();
    } catch (err) {
      alert('Error al descargar respaldo de datos.');
    } finally {
      setExporting(false);
    }
  };

  const isExpired = licenciaStatus.expired || licenciaStatus.isReadOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        
        {/* Top Gradient Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-cyan-700 via-teal-700 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Award size={24} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">Gestión de Licencias & Suscripción</h2>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isExpired ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-900'
                }`}>
                  {isExpired ? 'Modo Consulta' : 'Licencia Activa'}
                </span>
              </div>
              <p className="text-xs text-cyan-100 font-medium">
                Pasarela de pago para renovación, actualizaciones oficiales y control de copias de seguridad
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-3 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('estado')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'estado'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Mi Suscripción</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('planes')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'planes'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <CreditCard size={15} />
            <span>Renovar & Pasarela de Pagos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voucher')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'voucher'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Key size={15} />
            <span>Activar con Clave</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exportar')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'exportar'
                ? 'bg-white text-cyan-700 border-cyan-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Download size={15} />
            <span>Exportar Datos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generador')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'generador'
                ? 'bg-white text-purple-700 border-purple-600 shadow-sm'
                : 'text-purple-600 hover:text-purple-800 border-transparent'
            }`}
            title="Herramienta para el vendedor del software"
          >
            <Zap size={15} />
            <span>Generador (Ventas)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulador')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'simulador'
                ? 'bg-white text-slate-700 border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 border-transparent'
            }`}
            title="Simulador para probar el modo vencido y activo"
          >
            <HelpCircle size={15} />
            <span>Probar Modo Vencido</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: ESTADO DE LA LICENCIA */}
          {activeTab === 'estado' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Status Banner */}
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isExpired 
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl ${isExpired ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'}`}>
                    {isExpired ? <AlertTriangle size={24} /> : <Check size={24} />}
                  </div>
                  <div>
                    <h3 className="text-base font-black">
                      {isExpired ? 'Modo Consulta (Solo Lectura) Activo' : `Licencia ${licenciaStatus.tipo} Activa`}
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90 max-w-xl">
                      {isExpired
                        ? 'Tu periodo de licencia ha expirado. Tu historial médico, odontogramas y pacientes están 100% seguros y disponibles para consulta y exportación. Para dar de alta nuevos pacientes o citas, reactiva tu licencia.'
                        : `Tu suscripción cuenta con acceso completo a creación de citas, pacientes, recetas odontológicas y soporte técnico hasta el ${licenciaStatus.fecha_expiracion}.`}
                    </p>
                  </div>
                </div>

                <div className="text-right flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0 border-current/20">
                  <span className="text-[10px] uppercase font-black opacity-75">Tiempo Restante</span>
                  <span className="text-2xl font-black font-mono">
                    {isExpired ? '0 Días' : `${licenciaStatus.daysRemaining} Días`}
                  </span>
                </div>
              </div>

              {/* License Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Titular Registrado</span>
                  <span className="font-black text-slate-800">{licenciaStatus.titular}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Código de Licencia</span>
                  <span className="font-mono font-bold text-slate-700">{licenciaStatus.codigo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Fecha de Vencimiento</span>
                  <span className="font-bold text-slate-800">{licenciaStatus.fecha_expiracion || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Renovación Automática</span>
                  <span className="font-bold text-slate-700">
                    {licenciaStatus.auto_renovacion ? '✅ Activa (Stripe / Mercado Pago)' : '⏸ Manual'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Sucursales Permitidas</span>
                  <span className="font-bold text-slate-700">{licenciaStatus.sucursales_max || 5} Sedes</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Versión del Sistema</span>
                  <span className="font-mono font-bold text-cyan-800">v{licenciaStatus.version_instalada || '2.5.0'} Pro</span>
                </div>
              </div>

              {/* Software Updates Card */}
              <div className="bg-gradient-to-br from-cyan-50 to-slate-50 p-5 rounded-2xl border border-cyan-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="text-amber-500" size={18} />
                    <h4 className="text-sm font-black text-slate-800">Actualizaciones de Software & Soporte</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    licenciaStatus.actualizaciones_habilitadas
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {licenciaStatus.actualizaciones_habilitadas ? 'Soporte Activo' : 'Soporte Pausado'}
                  </span>
                </div>

                {updatesInfo && (
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-600">
                      Versión instalada: <strong>v{updatesInfo.currentVersion}</strong> • Última versión disponible: <strong>v{updatesInfo.latestVersion}</strong>
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                        Novedades de la versión {updatesInfo.latestVersion}:
                      </span>
                      {updatesInfo.changelog.map((c, i) => (
                        <div key={i} className="flex items-center space-x-1.5 text-slate-700">
                          <Check size={12} className="text-emerald-500 flex-shrink-0" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-500 italic">
                        {updatesInfo.message}
                      </span>
                      {licenciaStatus.actualizaciones_habilitadas ? (
                        <button
                          type="button"
                          onClick={() => alert('¡Tu sistema cuenta con la última actualización instalada y sincronizada!')}
                          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                        >
                          <RefreshCw size={12} />
                          <span>Instalar Actualización</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveTab('planes')}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                        >
                          <Sparkles size={12} />
                          <span>Renovar para Actualizar</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action shortcuts */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('exportar')}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5"
                >
                  <Download size={14} />
                  <span>Descargar Copia de Seguridad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('planes')}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                >
                  <CreditCard size={14} />
                  <span>{isExpired ? 'Reactivar Licencia Ahora' : 'Extender o Cambiar Plan'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PLANES & PASARELA DE PAGOS (RENOVACIÓN) */}
          {activeTab === 'planes' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Selecciona tu Plan de Renovación
                </h3>
                <p className="text-xs text-slate-500">
                  Renovación automática o manual procesada de forma segura mediante Stripe o Mercado Pago
                </p>
              </div>

              {/* Plans Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Plan Mensual */}
                <div
                  onClick={() => setSelectedPlan('MENSUAL')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedPlan === 'MENSUAL'
                      ? 'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black uppercase text-slate-600 tracking-wider">Plan Mensual</span>
                      {selectedPlan === 'MENSUAL' && (
                        <span className="w-5 h-5 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline space-x-1 mb-2">
                      <span className="text-2xl font-black text-slate-900">$499</span>
                      <span className="text-[11px] font-semibold text-slate-500">MXN / mes</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Flexibilidad mes a mes. Cancela o reactiva cuando quieras.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-cyan-600 flex-shrink-0" />
                        <span>Pacientes y citas ilimitadas</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-cyan-600 flex-shrink-0" />
                        <span>Presupuestos con Odontograma FDI</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-cyan-600 flex-shrink-0" />
                        <span>Recetas odontológicas membretadas</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Plan Anual (Best value) */}
                <div
                  onClick={() => setSelectedPlan('ANUAL')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedPlan === 'ANUAL'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="absolute -top-3 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full shadow-sm tracking-wider">
                    ⭐ Más Popular
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">Plan Anual</span>
                      {selectedPlan === 'ANUAL' && (
                        <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline space-x-1 mb-2">
                      <span className="text-2xl font-black text-slate-900">$4,990</span>
                      <span className="text-[11px] font-semibold text-slate-500">MXN / año</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Ahorra 17% con facturación anual. Incluye soporte y actualizaciones.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-emerald-600 flex-shrink-0" />
                        <span>Todo lo del plan mensual</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-emerald-600 flex-shrink-0" />
                        <span><strong>Actualizaciones automáticas</strong></span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-emerald-600 flex-shrink-0" />
                        <span>Soporte prioritario multi-sucursal</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Modo Prueba Real $10 MXN */}
                <div
                  onClick={() => setSelectedPlan('PRUEBA_REAL')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedPlan === 'PRUEBA_REAL'
                      ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="absolute -top-3 right-3 bg-purple-600 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-sm tracking-wider">
                    🧪 Prueba Real
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black uppercase text-purple-800 tracking-wider">Prueba $10 MXN</span>
                      {selectedPlan === 'PRUEBA_REAL' && (
                        <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline space-x-1 mb-2">
                      <span className="text-2xl font-black text-slate-900">$10</span>
                      <span className="text-[11px] font-semibold text-slate-500">MXN (Mínimo Stripe)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Ideal para probar con tu tarjeta bancaria real y verificar el depósito en tu cuenta bancaria.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-purple-600 flex-shrink-0" />
                        <span>Licencia activa por 7 días</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-purple-600 flex-shrink-0" />
                        <span>Mínimo permitido en México</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check size={13} className="text-purple-600 flex-shrink-0" />
                        <span>Comprueba el flujo de tu banco</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Payment Form */}
              <form onSubmit={handleProcessPayment} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <CreditCard size={18} className="text-cyan-700" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Método de Pago & Pasarela
                    </span>
                  </div>

                  {/* Gateway selector buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPaymentGateway('Stripe')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        paymentGateway === 'Stripe'
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      Stripe
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentGateway('Mercado Pago')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        paymentGateway === 'Mercado Pago'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      Mercado Pago
                    </button>
                  </div>
                </div>

                {paymentSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                    <Check size={16} className="text-emerald-700" />
                    <span>{paymentSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Titular / Clínica</label>
                    <input
                      type="text"
                      required
                      value={customerTitular}
                      onChange={(e) => setCustomerTitular(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico para Factura / Recibo</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de Tarjeta</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiración (MM/AA)</label>
                    <input
                      type="text"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVC / CVV</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    Total a cobrar: <strong className="text-slate-900 text-sm">
                      {selectedPlan === 'ANUAL' ? '$4,990 MXN' : (selectedPlan === 'PRUEBA_REAL' ? '$10 MXN' : '$499 MXN')}
                    </strong>
                    <span className="text-[10px] ml-1">
                      ({selectedPlan === 'ANUAL' ? '12 meses' : (selectedPlan === 'PRUEBA_REAL' ? 'Prueba real de 7 días' : '1 mes')})
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                  >
                    <Zap size={15} />
                    <span>{processingPayment ? 'Procesando pago...' : `Pagar con ${paymentGateway} y Activar`}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ACTIVAR CON CLAVE / VOUCHER */}
          {activeTab === 'voucher' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Activar con Clave de Licencia o Voucher
                </h3>
                <p className="text-xs text-slate-500">
                  Si adquiriste tu licencia mediante transferencia bancaria, distribuidor o factura directa, pega tu clave firmada aquí.
                </p>
              </div>

              {voucherSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <Check size={16} className="text-emerald-700" />
                  <span>{voucherSuccess}</span>
                </div>
              )}

              {voucherError && (
                <div className="p-3 bg-rose-100 text-rose-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-rose-700" />
                  <span>{voucherError}</span>
                </div>
              )}

              <form onSubmit={handleActivateVoucher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clave Criptográfica de Licencia (Token que inicia con KK...)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={voucherToken}
                    onChange={(e) => setVoucherToken(e.target.value)}
                    placeholder="KK.eyJ0aXR1bGFyIjoiS29uZW5lS29oIFNtaWxlIE1ha2VyIiwidGlwbyI6IkFOVUFMIiwiZmVjaGFfZXhwaXJhY2lvbiI6IjIwMjctMTEtMDUifQ==.89f2a..."
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Las claves de licencia de KoneneKoh cuentan con firma matemática HMAC-SHA256 y funcionan incluso sin conexión a internet.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={activatingVoucher}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                  >
                    <Key size={14} />
                    <span>{activatingVoucher ? 'Validando Clave...' : 'Validar & Activar Licencia'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: EXPORTAR DATOS CLÍNICOS (BACKUP) */}
          {activeTab === 'exportar' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-cyan-50/70 p-4 rounded-2xl border border-cyan-200 flex items-start space-x-3 text-cyan-950 text-xs">
                <ShieldCheck size={20} className="text-cyan-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-cyan-900 mb-0.5">Propiedad y Portabilidad de los Datos Clínicos</h4>
                  <p className="leading-relaxed">
                    En KoneneKoh los expedientes de tus pacientes son 100% de tu clínica. Conforme a la legislación médica (NOM-004-SSA3-2012), 
                    <strong> este módulo de exportación permanece siempre habilitado sin importar el estado de tu licencia</strong> (incluso si está vencida o en Modo Consulta).
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-200 text-cyan-600">
                  <Download size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">Descarga Integral del Expediente Clínico</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Genera un archivo JSON completo que incluye pacientes, antecedentes médicos, consultas, odontogramas, presupuestos, pagos y recetas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={exporting}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl shadow-md inline-flex items-center space-x-2 hover:scale-105 transition-all"
                >
                  <Download size={16} />
                  <span>{exporting ? 'Generando archivo de respaldo...' : 'Descargar Copia de Seguridad Completa (JSON)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: GENERADOR DE LICENCIAS (SOLO VENDEDOR / PROPIETARIO) */}
          {activeTab === 'generador' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 flex items-start space-x-3 text-purple-950 text-xs">
                <Zap size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-purple-900">Panel de Emisión de Licencias para el Vendedor</h4>
                  <p>
                    Usa esta herramienta para generar claves criptográficas firmadas y entregárselas a los dentistas o clínicas que te compren la aplicación.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGenerateKey} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Clínica Compradora *</label>
                    <input
                      type="text"
                      required
                      value={genTitular}
                      onChange={(e) => setGenTitular(e.target.value)}
                      placeholder="Ej. Clínica Dental Dentalia"
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo del Odontólogo Titular</label>
                    <input
                      type="email"
                      required
                      value={genEmail}
                      onChange={(e) => setGenEmail(e.target.value)}
                      placeholder="doctor@clinica.com"
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Licencia</label>
                    <select
                      value={genTipo}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setGenTipo(val);
                        setGenDias(val === 'MENSUAL' ? 30 : val === 'DEMO' ? 14 : val === 'VITALICIA' ? 3650 : 365);
                      }}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="ANUAL">ANUAL (Recomendado)</option>
                      <option value="MENSUAL">MENSUAL</option>
                      <option value="DEMO">DEMO (14 Días)</option>
                      <option value="VITALICIA">VITALICIA (Sin vencimiento)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Días de Duración</label>
                    <input
                      type="number"
                      value={genDias}
                      onChange={(e) => setGenDias(Number(e.target.value))}
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Límite de Sucursales</label>
                    <input
                      type="number"
                      value={genSucursales}
                      onChange={(e) => setGenSucursales(Number(e.target.value))}
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                  >
                    <Key size={14} />
                    <span>Generar Clave Firmada</span>
                  </button>
                </div>
              </form>

              {generatedKey && (
                <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 uppercase">Clave Generada para {genTitular}:</span>
                    <button
                      type="button"
                      onClick={handleCopyGeneratedKey}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                    >
                      <Copy size={13} />
                      <span>{copiedKey ? '¡Copiado!' : 'Copiar Clave'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    readOnly
                    value={generatedKey}
                    className="w-full text-[11px] font-mono p-2 bg-white border border-purple-200 rounded-xl select-all"
                  />
                  <p className="text-[11px] text-purple-800 italic">
                    Entrégale este token al cliente para que lo ingrese en la pestaña "Activar con Clave".
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SIMULADOR DE PRUEBAS */}
          {activeTab === 'simulador' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start space-x-3 text-amber-950 text-xs">
                <HelpCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-900">Simulador de Estados para Pruebas Inmediatas</h4>
                  <p>
                    Puedes alternar entre los estados para comprobar cómo reacciona la interfaz y el backend:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle size={16} />
                    <span>Probar Modo Vencido (Solo Lectura)</span>
                  </div>
                  <p className="text-xs text-rose-700">
                    Establece la fecha de expiración en el pasado. Se bloqueará la creación de nuevos pacientes y citas, y se mostrará la barra de alerta.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSimulateMode('vencida')}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-sm"
                  >
                    Activar Simulación: Licencia Vencida
                  </button>
                </div>

                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <Check size={16} />
                    <span>Probar Modo Activo (Acceso Completo)</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Establece una licencia anual vigente por 365 días con auto-renovación habilitada y acceso completo a todas las funciones.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSimulateMode('activa')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm"
                  >
                    Activar Simulación: Licencia Activa
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            Cerrar Panel
          </button>
        </div>

      </div>
    </div>
  );
};
