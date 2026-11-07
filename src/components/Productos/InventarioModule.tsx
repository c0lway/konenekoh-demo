import React, { useState, useEffect } from 'react';
import { Producto, MovimientoInventario, Location, StockPorSede } from '../../types';
import { api } from '../../services/api';
import { 
  Package, Plus, Search, AlertTriangle, CheckCircle, 
  ArrowDownRight, ArrowUpRight, History, Filter, 
  DollarSign, TrendingUp, Layers, Trash2, Edit3, X, RefreshCw, 
  BarChart2, Building2, ArrowLeftRight, Check, MapPin, Send
} from 'lucide-react';

interface InventarioModuleProps {
  locations?: Location[];
  currentLocationId?: number | 'all';
  onClose?: () => void;
}

export const InventarioModule: React.FC<InventarioModuleProps> = ({
  locations = [],
  currentLocationId = 'all',
  onClose,
}) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'catalogo' | 'movimientos'>('catalogo');
  const [selectedLocationId, setSelectedLocationId] = useState<number | 'all'>(currentLocationId);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  // Modal: Add / Edit Product
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [codigo, setCodigo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [marca, setMarca] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Material Restaurador');
  const [proveedor, setProveedor] = useState<string>('');
  const [ubicacion, setUbicacion] = useState<string>('Vitrina 1, Almacén Central');
  const [modalLocationId, setModalLocationId] = useState<number>(1);
  const [cantidad, setCantidad] = useState<number>(10);
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [costo, setCosto] = useState<number>(100);
  const [utilidad, setUtilidad] = useState<number>(30);

  // Modal: Ajustar Stock / Entrada o Salida rápida
  const [showStockModal, setShowStockModal] = useState<boolean>(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Producto | null>(null);
  const [stockLocationId, setStockLocationId] = useState<number>(1);
  const [ajusteTipo, setAjusteTipo] = useState<'Entrada' | 'Salida'>('Entrada');
  const [ajusteCantidad, setAjusteCantidad] = useState<number>(5);
  const [ajusteMotivo, setAjusteMotivo] = useState<string>('Compra / Factura Proveedor');

  // Modal: Traspaso de insumos entre sucursales
  const [showTraspasoModal, setShowTraspasoModal] = useState<boolean>(false);
  const [selectedProductForTraspaso, setSelectedProductForTraspaso] = useState<Producto | null>(null);
  const [traspasoOrigenId, setTraspasoOrigenId] = useState<number>(1);
  const [traspasoDestinoId, setTraspasoDestinoId] = useState<number>(2);
  const [traspasoCantidad, setTraspasoCantidad] = useState<number>(2);
  const [traspasoMotivo, setTraspasoMotivo] = useState<string>('Reabastecimiento de insumos');
  const [traspasoError, setTraspasoError] = useState<string | null>(null);
  const [traspasoLoading, setTraspasoLoading] = useState<boolean>(false);

  useEffect(() => {
    setSelectedLocationId(currentLocationId);
  }, [currentLocationId]);

  useEffect(() => {
    loadData(selectedLocationId);
  }, [selectedLocationId]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async (locId: number | 'all' = selectedLocationId) => {
    try {
      setLoading(true);
      const locParam = locId !== 'all' ? locId : undefined;
      const [prods, movs] = await Promise.all([
        api.getProductos(locParam),
        api.getMovimientosInventario(locParam),
      ]);
      setProductos(prods);
      setMovimientos(movs);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for Edit / New Product Form
  const calculatedPrecio = costo * (1 + utilidad / 100);
  const calculatedIva = calculatedPrecio * 0.16;
  const calculatedPrecioConIva = calculatedPrecio + calculatedIva;
  const calculatedPrecioSinIva = calculatedPrecio;

  // Executive KPI metrics based on current view (general or location)
  const isGlobal = selectedLocationId === 'all';
  const activeLocation = locations.find(l => l.id === Number(selectedLocationId));

  const totalItems = productos.length;
  const totalStockUnits = productos.reduce((sum, p) => sum + (p.cantidad || 0), 0);
  const valorTotalInventario = productos.reduce((sum, p) => sum + ((p.cantidad || 0) * (p.costo || 0)), 0);
  const valorVentaEstimado = productos.reduce((sum, p) => sum + ((p.cantidad || 0) * (p.precio_con_iva || 0)), 0);
  
  const productosBajoStock = isGlobal
    ? productos.filter(p => p.alerta_bajo_stock && p.categoria !== 'Servicio')
    : productos.filter(p => p.cantidad <= (p.stock_minimo || 5) && p.categoria !== 'Servicio');

  // Categories list
  const categorias = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria || 'Higiene Dental')))];

  const handleOpenAdd = () => {
    setEditingId(null);
    setCodigo(`MAT00${productos.length + 1}`);
    setNombre('');
    setMarca('');
    setCategoria('Material Restaurador');
    setProveedor('Dental Querétaro');
    setUbicacion(isGlobal ? 'Vitrina 1, Almacén Central' : `Vitrina Sede ${activeLocation?.codigo || ''}`);
    setModalLocationId(isGlobal ? (locations[0]?.id || 1) : Number(selectedLocationId));
    setCantidad(10);
    setStockMinimo(5);
    setCosto(150);
    setUtilidad(35);
    setShowProductModal(true);
  };

  const handleOpenEdit = (p: Producto) => {
    setEditingId(p.id);
    setCodigo(p.codigo);
    setNombre(p.nombre);
    setMarca(p.marca || '');
    setCategoria(p.categoria || 'Material Restaurador');
    setProveedor(p.proveedor || '');
    setUbicacion(p.ubicacion || '');
    setModalLocationId(p.location_id || (isGlobal ? 1 : Number(selectedLocationId)));
    setCantidad(p.cantidad);
    setStockMinimo(p.stock_minimo || 5);
    setCosto(p.costo);
    setUtilidad(p.utilidad);
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!nombre) {
      alert('Ingresa el nombre del producto');
      return;
    }

    const payload = {
      codigo,
      nombre,
      marca,
      categoria,
      proveedor,
      ubicacion,
      location_id: modalLocationId,
      cantidad,
      stock_minimo: stockMinimo,
      costo,
      utilidad,
      precio: parseFloat(calculatedPrecio.toFixed(2)),
      iva: parseFloat(calculatedIva.toFixed(2)),
      precio_sin_iva: parseFloat(calculatedPrecioSinIva.toFixed(2)),
      precio_con_iva: parseFloat(calculatedPrecioConIva.toFixed(2)),
    };

    try {
      if (editingId) {
        await api.updateProducto(editingId, payload);
        showToast(`Insumo "${nombre}" actualizado con éxito.`);
      } else {
        await api.createProducto(payload);
        showToast(`Insumo "${nombre}" agregado al inventario.`);
      }
      setShowProductModal(false);
      await loadData(selectedLocationId);
    } catch (err) {
      console.error('Error guardando producto:', err);
    }
  };

  const handleOpenStockModal = (p: Producto) => {
    setSelectedProductForStock(p);
    setAjusteCantidad(5);
    setAjusteTipo('Entrada');
    setStockLocationId(isGlobal ? (locations[0]?.id || 1) : Number(selectedLocationId));
    setAjusteMotivo('Compra / Factura Proveedor');
    setShowStockModal(true);
  };

  const handleAjustarStock = async () => {
    if (!selectedProductForStock || ajusteCantidad <= 0) return;
    try {
      await api.ajustarStock(selectedProductForStock.id, {
        cantidad_ajuste: ajusteCantidad,
        tipo: ajusteTipo,
        motivo: ajusteMotivo,
        usuario: 'raguilar',
        location_id: stockLocationId,
      });
      setShowStockModal(false);
      setSelectedProductForStock(null);
      showToast(`Stock ajustado exitosamente para "${selectedProductForStock.nombre}".`);
      await loadData(selectedLocationId);
    } catch (err) {
      console.error('Error ajustando stock:', err);
    }
  };

  const handleOpenTraspasoModal = (p: Producto) => {
    setSelectedProductForTraspaso(p);
    setTraspasoError(null);
    setTraspasoCantidad(2);
    setTraspasoMotivo('Reabastecimiento de sede');

    // Default origin: location with most stock, or current location
    if (!isGlobal) {
      setTraspasoOrigenId(Number(selectedLocationId));
      const other = locations.find(l => l.id !== Number(selectedLocationId));
      setTraspasoDestinoId(other ? other.id : 2);
    } else {
      setTraspasoOrigenId(1);
      setTraspasoDestinoId(2);
    }
    setShowTraspasoModal(true);
  };

  const handleExecuteTraspaso = async () => {
    if (!selectedProductForTraspaso) return;
    if (traspasoOrigenId === traspasoDestinoId) {
      setTraspasoError('La sucursal de origen y destino deben ser distintas.');
      return;
    }
    if (traspasoCantidad <= 0) {
      setTraspasoError('La cantidad a traspasar debe ser mayor a cero.');
      return;
    }

    try {
      setTraspasoLoading(true);
      setTraspasoError(null);
      await api.traspasarStock(selectedProductForTraspaso.id, {
        origen_location_id: traspasoOrigenId,
        destino_location_id: traspasoDestinoId,
        cantidad: traspasoCantidad,
        motivo: traspasoMotivo,
        usuario: 'raguilar',
      });

      const origenNom = locations.find(l => l.id === traspasoOrigenId)?.codigo || 'Origen';
      const destinoNom = locations.find(l => l.id === traspasoDestinoId)?.codigo || 'Destino';
      showToast(`Traspaso de ${traspasoCantidad} uds (${origenNom} ➔ ${destinoNom}) registrado en Kardex.`);
      setShowTraspasoModal(false);
      setSelectedProductForTraspaso(null);
      await loadData(selectedLocationId);
    } catch (err: any) {
      setTraspasoError(err.message || 'Error al procesar traspaso.');
    } finally {
      setTraspasoLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto y sus existencias del catálogo?')) return;
    try {
      await api.deleteProducto(id);
      showToast('Insumo eliminado del catálogo.');
      await loadData(selectedLocationId);
    } catch (err) {
      console.error('Error eliminando producto:', err);
    }
  };

  // Filtered list
  const filtered = productos.filter((p) => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.proveedor && p.proveedor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategoria === 'Todas' || p.categoria === selectedCategoria;
    const matchesStock = !filterLowStockOnly || (
      isGlobal
        ? Boolean(p.alerta_bajo_stock)
        : (p.cantidad <= (p.stock_minimo || 5) && p.categoria !== 'Servicio')
    );

    return matchesSearch && matchesCat && matchesStock;
  });

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 shadow-md flex items-center justify-between transition-all">
          <div className="flex items-center space-x-2">
            <Check size={16} />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-80 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & KPI BANNER */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-slate-900 via-cyan-950 to-teal-950 text-white shrink-0">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-cyan-800/40 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center font-black shadow-inner">
              <Package size={26} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl md:text-2xl font-black tracking-tight">
                  Inventarios & Kardex Multi-Sede
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isGlobal 
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/30'
                    : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
                }`}>
                  {isGlobal ? '🌐 Red Consolidada' : `📍 Sede: ${activeLocation?.nombre}`}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {isGlobal
                  ? 'Visión global de insumos clínicos, materiales dentales y traspasos entre sucursales'
                  : `${activeLocation?.direccion} • Tel: ${activeLocation?.telefono}`}
              </p>
            </div>
          </div>

          {/* Action buttons and Location Selector in header */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Location Switcher Pills */}
            <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setSelectedLocationId('all')}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center space-x-1 ${
                  isGlobal
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>🌐 Toda la Red</span>
              </button>
              {locations.map((loc) => {
                const isSelected = selectedLocationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full inline-block" 
                      style={{ backgroundColor: loc.color || '#06b6d4' }} 
                    />
                    <span>{loc.codigo || loc.nombre.replace('KoneneKoh ', '')}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus size={16} />
              <span>+ Nuevo Insumo</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="Cerrar modal"
              >
                <X size={22} />
              </button>
            )}
          </div>
        </div>

        {/* 4 Professional KPI Cards with Location Context */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide flex items-center justify-between">
              <span>{isGlobal ? 'Catálogo Total' : `Catálogo en ${activeLocation?.codigo}`}</span>
              <Layers size={15} />
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-white">
              {totalItems} <span className="text-xs font-semibold text-slate-300">SKUs</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {totalStockUnits} unidades físicas {isGlobal ? 'en la red' : 'en esta sede'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide flex items-center justify-between">
              <span>{isGlobal ? 'Valor Total Red' : `Valor en ${activeLocation?.codigo}`}</span>
              <DollarSign size={15} />
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-emerald-400">
              ${valorTotalInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">Costo de adquisición de existencias</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide flex items-center justify-between">
              <span>Valor Venta Estimado</span>
              <TrendingUp size={15} />
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-cyan-300">
              ${valorVentaEstimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">Precio con IVA proyectado al público</div>
          </div>

          <div className={`backdrop-blur-md rounded-2xl p-3.5 border transition-all ${
            productosBajoStock.length > 0
              ? 'bg-rose-500/20 border-rose-400/40 ring-1 ring-rose-400/50'
              : 'bg-white/10 border-white/10'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wide flex items-center justify-between text-rose-300">
              <span>Alerta de Reorden</span>
              <AlertTriangle size={15} />
            </div>
            <div className="text-2xl font-black mt-1 font-mono text-rose-400">
              {productosBajoStock.length}
            </div>
            <div className="text-[10px] text-rose-200 mt-0.5 truncate">
              {productosBajoStock.length > 0 
                ? (isGlobal ? '⚠️ Hay insumos bajo mínimo en sedes' : '⚠️ Artículos en punto de reorden')
                : 'Stock en niveles óptimos'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS & SEARCH / FILTER BAR */}
      <div className="p-3.5 md:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Tab Toggle */}
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'catalogo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catálogo de Insumos ({productos.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('movimientos')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'movimientos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kardex & Traspasos ({movimientos.length})
            </button>
          </div>

          {activeTab === 'catalogo' && (
            <button
              type="button"
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center space-x-1.5 transition-all ${
                filterLowStockOnly
                  ? 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-400/40'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle size={13} className={filterLowStockOnly ? 'text-rose-600' : 'text-slate-400'} />
              <span>Bajo Stock ({productosBajoStock.length})</span>
            </button>
          )}
        </div>

        {/* Search & Category Selector */}
        {activeTab === 'catalogo' && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="text-xs font-semibold border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  Categoría: {cat}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Buscar insumo, código, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 w-52 md:w-60 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN DATA TABLE AREA */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'catalogo' ? (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#48cae4]/20 text-slate-800 font-black text-[11px] sticky top-0 z-10 backdrop-blur-md border-b border-cyan-200">
              <tr>
                <th className="py-3 px-3.5 w-10">#</th>
                <th className="py-3 px-3.5">Código & Insumo</th>
                <th className="py-3 px-3.5">Categoría</th>
                {isGlobal ? (
                  <>
                    <th className="py-3 px-3.5 text-center">Stock Total Red</th>
                    <th className="py-3 px-3.5 text-center">Desglose por Sucursal</th>
                    <th className="py-3 px-3.5 text-center">Estatus Red</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-3.5">Gaveta / Ubicación en Sede</th>
                    <th className="py-3 px-3.5 text-center">Stock en Sede</th>
                    <th className="py-3 px-3.5 text-center">Estatus Local</th>
                  </>
                )}
                <th className="py-3 px-3.5 text-right">Costo Base</th>
                <th className="py-3 px-3.5 text-right font-black">Precio Venta (IVA)</th>
                <th className="py-3 px-3.5 text-right font-black">Valor en Stock</th>
                <th className="py-3 px-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Cargando insumos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No se encontraron insumos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const valorStock = (p.cantidad || 0) * (p.costo || 0);

                  return (
                    <tr key={p.id} className="hover:bg-cyan-50/40 transition-colors">
                      <td className="py-3 px-3.5 text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-bold text-cyan-800 text-[11px]">{p.codigo}</div>
                        <div className="font-black text-slate-900 text-xs">{p.nombre}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">{p.marca || 'Genérico'}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.categoria || 'General'}
                        </span>
                      </td>

                      {/* Global View Columns */}
                      {isGlobal ? (
                        <>
                          <td className="py-3 px-3.5 text-center">
                            <div className="font-mono font-black text-sm text-slate-900">
                              {p.cantidad} <span className="text-[10px] text-slate-400 font-normal">uds</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {/* Distribution across locations */}
                            <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
                              {p.stocks_por_sede && p.stocks_por_sede.length > 0 ? (
                                p.stocks_por_sede.map((s) => {
                                  const isLocLow = s.cantidad <= s.stock_minimo;
                                  return (
                                    <span
                                      key={s.location_id}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center space-x-1 border shadow-2xs ${
                                        isLocLow
                                          ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200'
                                          : 'bg-white text-slate-700 border-slate-200'
                                      }`}
                                      title={`${s.location_nombre}: ${s.cantidad} unidades (Mín: ${s.stock_minimo}) - ${s.pasillo_gaveta || 'Almacén'}`}
                                    >
                                      <span 
                                        className="w-1.5 h-1.5 rounded-full inline-block" 
                                        style={{ backgroundColor: s.location_color || '#8b5cf6' }} 
                                      />
                                      <span>{s.location_codigo}:</span>
                                      <span className="font-mono">{s.cantidad}</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-[10px] text-slate-400">Sin desglose</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {p.alerta_bajo_stock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                ⚠️ Bajo en sede
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                🟢 Óptimo Red
                              </span>
                            )}
                          </td>
                        </>
                      ) : (
                        /* Specific Location View Columns */
                        <>
                          <td className="py-3 px-3.5">
                            <div className="text-[11px] font-semibold text-slate-800 flex items-center space-x-1">
                              <MapPin size={12} className="text-teal-600 shrink-0" />
                              <span>{p.ubicacion || 'Vitrina Principal'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Proveedor: {p.proveedor || 'Dental Bajío'}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <div className="font-mono font-black text-sm text-slate-900">
                              {p.cantidad} <span className="text-[10px] text-slate-400 font-normal">uds</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Mínimo: {p.stock_minimo || 5}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {p.cantidad <= 2 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                🔴 Crítico
                              </span>
                            ) : p.cantidad <= (p.stock_minimo || 5) ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                🟡 Bajo Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                🟢 Óptimo
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-700">
                        ${p.costo.toFixed(2)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900 text-sm">
                        ${p.precio_con_iva.toFixed(2)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                        ${valorStock.toFixed(2)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Traspaso de insumo entre sedes */}
                          <button
                            type="button"
                            onClick={() => handleOpenTraspasoModal(p)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-[10px] font-bold border border-purple-200 transition-colors flex items-center space-x-1"
                            title="Traspasar insumo entre sucursales"
                          >
                            <ArrowLeftRight size={12} />
                            <span>Traspaso</span>
                          </button>

                          {/* Quick Stock Adjustment */}
                          <button
                            type="button"
                            onClick={() => handleOpenStockModal(p)}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[10px] font-bold border border-teal-200 transition-colors flex items-center space-x-1"
                            title="Entrada / Ajuste de Stock"
                          >
                            <RefreshCw size={11} />
                            <span>Stock</span>
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 rounded-lg"
                            title="Editar Insumo"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                            title="Eliminar insumo"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* KARDEX / HISTORIAL DE MOVIMIENTOS & TRASPASOS */
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Auditoría de Entradas, Salidas y Traspasos entre Sucursales
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {isGlobal ? 'Mostrando toda la red' : `Filtrado por sede: ${activeLocation?.nombre}`}
              </span>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">Fecha & Hora</th>
                  <th className="py-2.5 px-3.5">Tipo Operación</th>
                  <th className="py-2.5 px-3.5">Sucursal / Ruta</th>
                  <th className="py-2.5 px-3.5">Código & Insumo</th>
                  <th className="py-2.5 px-3.5 text-center">Cantidad</th>
                  <th className="py-2.5 px-3.5">Motivo / Concepto</th>
                  <th className="py-2.5 px-3.5">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No hay registros de movimientos en el Kardex para esta selección.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3.5 font-mono text-slate-500">{m.fecha}</td>
                      <td className="py-2.5 px-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.tipo === 'Entrada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.tipo === 'Salida'
                            ? 'bg-rose-100 text-rose-800'
                            : m.tipo === 'Traspaso'
                            ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-300'
                            : 'bg-cyan-100 text-cyan-800'
                        }`}>
                          {m.tipo === 'Entrada' && <ArrowDownRight size={12} className="mr-1" />}
                          {m.tipo === 'Salida' && <ArrowUpRight size={12} className="mr-1" />}
                          {m.tipo === 'Traspaso' && <ArrowLeftRight size={12} className="mr-1" />}
                          {m.tipo}
                        </span>
                      </td>

                      {/* Location Origin & Route */}
                      <td className="py-2.5 px-3.5">
                        {m.tipo === 'Traspaso' && m.destino_location_codigo ? (
                          <div className="flex items-center space-x-1.5 font-bold text-[11px]">
                            <span 
                              className="px-1.5 py-0.5 rounded text-[10px] font-black"
                              style={{ backgroundColor: `${m.location_color || '#06b6d4'}20`, color: m.location_color || '#0891b2' }}
                            >
                              {m.location_codigo}
                            </span>
                            <span className="text-purple-600 font-bold">➔</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800">
                              {m.destino_location_codigo}
                            </span>
                          </div>
                        ) : (
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center space-x-1"
                            style={{ backgroundColor: `${m.location_color || '#06b6d4'}20`, color: m.location_color || '#0891b2' }}
                          >
                            <Building2 size={10} />
                            <span>{m.location_nombre?.replace('KoneneKoh ', '') || 'Matriz'}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className="font-mono font-bold text-cyan-800 mr-2">{m.producto_codigo}</span>
                        <span className="font-semibold text-slate-800">{m.producto_nombre}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-mono font-bold text-sm">
                        {m.tipo === 'Salida' ? `-${m.cantidad}` : m.tipo === 'Traspaso' ? `⇄ ${m.cantidad}` : `+${m.cantidad}`}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600">{m.motivo}</td>
                      <td className="py-2.5 px-3.5 text-slate-500 font-semibold">{m.usuario}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: TRASPASO DE INSUMOS ENTRE SUCURSALES */}
      {showTraspasoModal && selectedProductForTraspaso && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800">Traspaso de Insumos entre Sucursales</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">{selectedProductForTraspaso.nombre} ({selectedProductForTraspaso.codigo})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTraspasoModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {traspasoError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-xl flex items-center space-x-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>{traspasoError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Origin and Destination Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Sede Origen */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1 flex items-center space-x-1">
                    <Building2 size={13} className="text-cyan-600" />
                    <span>Sucursal Origen *</span>
                  </label>
                  <select
                    value={traspasoOrigenId}
                    onChange={(e) => setTraspasoOrigenId(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2 bg-white"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre} ({l.codigo})
                      </option>
                    ))}
                  </select>
                  {/* Stock available at origin */}
                  <div className="mt-2 text-[11px] font-bold text-cyan-800 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span>Stock Disponible:</span>
                    <span className="font-mono text-sm">
                      {selectedProductForTraspaso.stocks_por_sede?.find(s => s.location_id === traspasoOrigenId)?.cantidad || 0} uds
                    </span>
                  </div>
                </div>

                {/* Sede Destino */}
                <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200">
                  <label className="block text-xs font-black text-purple-900 uppercase tracking-wide mb-1 flex items-center space-x-1">
                    <Building2 size={13} className="text-purple-600" />
                    <span>Sucursal Destino *</span>
                  </label>
                  <select
                    value={traspasoDestinoId}
                    onChange={(e) => setTraspasoDestinoId(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-purple-300 rounded-xl p-2 bg-white"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id} disabled={l.id === traspasoOrigenId}>
                        {l.nombre} ({l.codigo})
                      </option>
                    ))}
                  </select>
                  {/* Stock currently at destination */}
                  <div className="mt-2 text-[11px] font-bold text-purple-900 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-purple-200">
                    <span>Stock Actual:</span>
                    <span className="font-mono text-sm">
                      {selectedProductForTraspaso.stocks_por_sede?.find(s => s.location_id === traspasoDestinoId)?.cantidad || 0} uds
                    </span>
                  </div>
                </div>
              </div>

              {/* Cantidad y Motivo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Cantidad a Enviar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={traspasoCantidad}
                    onChange={(e) => setTraspasoCantidad(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-base font-black font-mono border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Motivo / Observaciones del Traspaso
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Abastecimiento de urgencia para cirugía"
                    value={traspasoMotivo}
                    onChange={(e) => setTraspasoMotivo(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTraspasoModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteTraspaso}
                disabled={traspasoLoading}
                className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm flex items-center space-x-1.5"
              >
                <ArrowLeftRight size={14} />
                <span>{traspasoLoading ? 'Procesando...' : 'Confirmar Traspaso'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE RÁPIDO DE STOCK (ENTRADA / SALIDA POR SUCURSAL) */}
      {showStockModal && selectedProductForStock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800">Ajuste de Stock</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">{selectedProductForStock.nombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Sucursal donde se aplica el ajuste */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide flex items-center space-x-1">
                  <Building2 size={13} className="text-teal-600" />
                  <span>Sucursal a Modificar *</span>
                </label>
                <select
                  value={stockLocationId}
                  onChange={(e) => setStockLocationId(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-white"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      📍 {l.nombre} ({l.codigo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock actual en esa sede */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600">Stock Actual en esta Sede:</span>
                <span className="text-lg font-black font-mono text-cyan-800">
                  {selectedProductForStock.stocks_por_sede?.find(s => s.location_id === stockLocationId)?.cantidad || selectedProductForStock.cantidad} uds
                </span>
              </div>

              {/* Tipo de Movimiento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAjusteTipo('Entrada')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                      ajusteTipo === 'Entrada'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight size={15} />
                    <span>+ Entrada (Compra)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAjusteTipo('Salida')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                      ajusteTipo === 'Salida'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight size={15} />
                    <span>- Salida (Consumo)</span>
                  </button>
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Cantidad a {ajusteTipo === 'Entrada' ? 'Ingresar' : 'Retirar'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={ajusteCantidad}
                  onChange={(e) => setAjusteCantidad(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-base font-black font-mono border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Motivo / Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Factura F-492 Dental Querétaro o Consumo Sillón 1"
                  value={ajusteMotivo}
                  onChange={(e) => setAjusteMotivo(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAjustarStock}
                className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm"
              >
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR PRODUCTO */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-800">
                {editingId ? 'Editar Insumo de Catálogo' : 'Nuevo Insumo Clínico'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código de Referencia *</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="Material Restaurador">Material Restaurador</option>
                    <option value="Higiene Dental">Higiene Dental</option>
                    <option value="Preventivo">Preventivo</option>
                    <option value="Insumos de Protección">Insumos de Protección</option>
                    <option value="Anestesia & Fármacos">Anestesia & Fármacos</option>
                    <option value="Ortodoncia">Ortodoncia</option>
                    <option value="Servicio">Servicio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo del Producto *</label>
                <input
                  type="text"
                  placeholder="Ej. Resina Filtek Z350 XT A2"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold"
                />
              </div>

              {/* Sede Inicial y Ubicación de Almacén */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Building2 size={13} className="text-purple-600" />
                    <span>Sucursal Inicial Asignada *</span>
                  </label>
                  <select
                    value={modalLocationId}
                    onChange={(e) => setModalLocationId(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-purple-300 rounded-xl p-2.5 bg-purple-50/40 text-purple-950"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        📍 {loc.nombre} ({loc.codigo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pasillo / Vitrina / Gaveta</label>
                  <input
                    type="text"
                    placeholder="Vitrina 1, Gaveta B"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="3M, Curaprox, etc."
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor Habitual</label>
                  <input
                    type="text"
                    placeholder="Dental Querétaro"
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Costo Base ($)</label>
                  <input
                    type="number"
                    step="10"
                    value={costo}
                    onChange={(e) => setCosto(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">% Utilidad</label>
                  <input
                    type="number"
                    value={utilidad}
                    onChange={(e) => setUtilidad(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-cyan-50/70 p-3.5 rounded-2xl border border-cyan-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Precio Sugerido (sin IVA):</span>
                  <span className="font-mono font-bold">${calculatedPrecio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">IVA (16%):</span>
                  <span className="font-mono font-bold">${calculatedIva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-cyan-200 text-cyan-950 font-black">
                  <span>Precio de Venta Final con IVA:</span>
                  <span className="font-mono text-sm">${calculatedPrecioConIva.toFixed(2)} MXN</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                className="px-5 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm"
              >
                Guardar Insumo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
