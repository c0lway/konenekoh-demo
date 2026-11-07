import React, { useState, useEffect } from 'react';
import { Producto } from '../../types';
import { api } from '../../services/api';
import { Plus, Trash2, Edit2, Search, X, Package } from 'lucide-react';

interface ProductosModuleProps {
  onClose?: () => void;
}

export const ProductosModule: React.FC<ProductosModuleProps> = ({ onClose }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form for new/edit product
  const [editingId, setEditingId] = useState<number | null>(null);
  const [codigo, setCodigo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [marca, setMarca] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(10);
  const [costo, setCosto] = useState<number>(100);
  const [utilidad, setUtilidad] = useState<number>(30);

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const data = await api.getProductos();
      setProductos(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const calculatedPrecio = costo * (1 + utilidad / 100);
  const calculatedIva = calculatedPrecio * 0.16;
  const calculatedPrecioConIva = calculatedPrecio + calculatedIva;
  const calculatedPrecioSinIva = calculatedPrecio;

  const handleOpenAdd = () => {
    setEditingId(null);
    setCodigo(`AD00${productos.length + 1}`);
    setNombre('');
    setMarca('');
    setCantidad(10);
    setCosto(100);
    setUtilidad(30);
    setShowAddModal(true);
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
      cantidad,
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
      } else {
        await api.createProducto(payload);
      }
      setShowAddModal(false);
      loadProductos();
    } catch (err) {
      console.error('Error al guardar producto:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.deleteProducto(id);
      loadProductos();
    } catch (err) {
      console.error('Error al eliminar producto:', err);
    }
  };

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header matching FileMaker Screenshot 5 */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            <Package size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Lista de Productos</h2>
            <p className="text-xs text-slate-500">Catálogo de insumos, pastas dentales, cepillos y servicios</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar producto o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-52"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus size={16} />
            <span>+ Producto</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Table matching Screenshot 5 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#48cae4] text-slate-900 font-bold text-[11px]">
            <tr>
              <th className="py-3 px-4 w-12">#</th>
              <th className="py-3 px-4">ID Código</th>
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Marca</th>
              <th className="py-3 px-4 text-center">Cantidad</th>
              <th className="py-3 px-4 text-right">Costo</th>
              <th className="py-3 px-4 text-center">Utilidad</th>
              <th className="py-3 px-4 text-right">Precio</th>
              <th className="py-3 px-4 text-right">IVA</th>
              <th className="py-3 px-4 text-right">Precio sin IVA</th>
              <th className="py-3 px-4 text-right font-black">Precio con IVA</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400">
                  Cargando productos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400">
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              filtered.map((p, idx) => (
                <tr key={p.id} className="hover:bg-cyan-50/50 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-800">{p.codigo}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.nombre}</td>
                  <td className="py-3 px-4 text-slate-600">{p.marca || '-'}</td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                      {p.cantidad}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">${p.costo.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-teal-700">
                    {p.utilidad ? `${p.utilidad}%` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">${p.precio.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">${p.iva.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">${p.precio_sin_iva.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                    ${p.precio_con_iva.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-1 text-teal-600 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-800">
              {editingId ? 'Editar Producto' : 'Nuevo Producto / Servicio'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Marca</label>
                <input
                  type="text"
                  placeholder="Ej. Curaprox, 3M"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto</label>
              <input
                type="text"
                placeholder="Ej. Pasta Enzical 75ml"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad Stock</label>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Costo Base ($)</label>
                <input
                  type="number"
                  step="10"
                  value={costo}
                  onChange={(e) => setCosto(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">% Utilidad</label>
                <input
                  type="number"
                  value={utilidad}
                  onChange={(e) => setUtilidad(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            {/* Price Preview Card */}
            <div className="bg-cyan-50 p-3.5 rounded-xl border border-cyan-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Precio Sugerido:</span>
                <span className="font-mono font-bold">${calculatedPrecio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">IVA (16%):</span>
                <span className="font-mono font-bold">${calculatedIva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-cyan-200 text-cyan-900 font-bold">
                <span>Precio Final con IVA:</span>
                <span className="font-mono text-sm">${calculatedPrecioConIva.toFixed(2)} MXN</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                className="px-4 py-2 text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-sm"
              >
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
