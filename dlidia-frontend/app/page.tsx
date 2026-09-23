'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

interface Plato {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url?: string;
}

interface ItemCarrito extends Plato {
  cantidad: number;
}

export default function PortalCliente() {
  const router = useRouter();
  const [menu, setMenu] = useState<Plato[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  const [tipoEntrega, setTipoEntrega] = useState('Delivery');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');

  useEffect(() => {
    const cargarCarta = async () => {
      try {
        const res = await fetch(`${API_URL}/api/platos`);
        const data = await res.json();
        setMenu(data);
      } catch (error) {
        console.error("Error al cargar la carta:", error);
      }
    };
    cargarCarta();
  }, []);

  const agregarAlCarrito = (plato: Plato) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === plato.id);
      if (existe) {
        return prev.map((item) => item.id === plato.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...plato, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (id: number) => {
    setCarrito((prev) => prev.filter(item => item.id !== id));
  };

  const total = carrito.reduce((sum, item) => sum + (Number(item.precio) * item.cantidad), 0);

  const enviarPedido = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío');
    if (!nombreCliente.trim()) return alert('Por favor, ingresa tu nombre.');
    if (tipoEntrega === 'Delivery' && (!telefonoCliente.trim() || !direccionEntrega.trim())) {
      return alert('Para delivery, requerimos tu teléfono y dirección exacta.');
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: null,
          origen: 'Portal Web',
          tipoEntrega,
          total,
          nombreCliente,
          telefonoCliente,
          direccionEntrega: tipoEntrega === 'Delivery' ? direccionEntrega : null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCarrito([]);
        setNombreCliente('');
        setTelefonoCliente('');
        setDireccionEntrega('');
        router.push(`/seguimiento/${data.pedido.id}`);
      } else {
        alert('Hubo un error al procesar tu pedido.');
      }
    } catch (error) {
      alert('Error de conexión.');
    } finally {
      setEnviando(false);
    }
  };

  const categoriasUnicas = ['Todos', ...Array.from(new Set(menu.map(p => p.categoria)))];
  const menuFiltrado = categoriaActiva === 'Todos' ? menu : menu.filter(p => p.categoria === categoriaActiva);

  return (
    <div className="bg-[#f8f5f2] min-h-screen pb-12">
      <nav className="bg-[#1a1210] text-[#f8f5f2] p-4 flex justify-between items-center shadow-lg border-b-4 border-[#7A1010]">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo D' Lidia" className="h-14 w-14 rounded-full border-2 border-[#DCA11D] object-cover bg-white" />
          <span className="font-extrabold text-2xl tracking-wide text-[#f8f5f2]">
            D' <span className="text-[#DCA11D]">LIDIA</span>
          </span>
        </div>
        <div className="hidden md:flex gap-6 font-semibold text-sm">
           <a href="/" className="hover:text-[#DCA11D] transition-colors">Inicio</a>
           <a href="#" className="hover:text-[#DCA11D] transition-colors">Menú</a>
           <a href="#" className="hover:text-[#DCA11D] transition-colors">Promociones</a>
           <a href="/ubicacion" className="flex items-center gap-1 text-[#DCA11D] hover:text-white transition-colors">
              📍 Cómo llegar
          </a>
        </div>
      </nav>

      <div className="bg-linear-to-r from-[#5a0c0c] to-[#7A1010] text-white pt-10 pb-16 px-8 text-center sm:text-left sm:px-16 flex flex-col sm:flex-row items-center justify-between shadow-inner">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight drop-shadow-md">
            El mejor sabor <br/> de <span className="text-[#DCA11D]">Quilmaná</span> - Cañete
          </h1>
          <p className="text-lg text-gray-200 mb-6 font-medium">
            Chifa, Pollos a la brasa y más, directo a tu mesa.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
        <div className="flex gap-4 overflow-x-auto py-2 hide-scroll-bar">
          {categoriasUnicas.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`shrink-0 px-6 py-3 rounded-xl font-bold shadow-md transition-all flex flex-col items-center gap-2 min-w-24
                ${categoriaActiva === cat ? 'bg-[#7A1010] text-white scale-105 border-b-4 border-[#DCA11D]' : 'bg-white text-gray-800 hover:bg-gray-50 border-b-4 border-transparent'}`}
            >
              <span className="text-2xl">{cat === 'Todos' ? '🍽️' : cat === 'Chifa' ? '🍚' : cat === 'Pollería' ? '🍗' : '🥤'}</span>
              <span className="text-sm tracking-wide">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#1a1210] mb-6 flex items-center gap-2">
            <span className="text-[#DCA11D]">🔖</span> Nuestro Catálogo
          </h2>

          {menuFiltrado.length === 0 ? (
            <div className="flex justify-center py-12 text-gray-500 font-bold">Cargando platos...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {menuFiltrado.map((plato) => (
                <div key={plato.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col">
                  <div className="h-48 w-full bg-gray-200 relative border-b-4 border-[#DCA11D]">
                    <img
                      src={plato.imagen_url || '/platos/default.jpg'}
                      alt={plato.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-extrabold text-xl text-[#1a1210] leading-tight mb-1">{plato.nombre}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3 h-10">{plato.descripcion || 'Delicioso plato preparado al instante.'}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <p className="font-extrabold text-[#7A1010] text-xl">S/ {Number(plato.precio).toFixed(2)}</p>
                      <button
                        onClick={() => agregarAlCarrito(plato)}
                        className="bg-[#DCA11D] text-[#1a1210] font-extrabold px-4 py-2 rounded-lg hover:bg-yellow-500 transition flex items-center gap-2 shadow"
                      >
                        + Añadir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-xl border-t-8 border-[#7A1010] sticky top-6">
            <h2 className="text-xl font-bold text-[#1a1210] mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
              <span>🛒</span> Tu Pedido
            </h2>

            <div className="min-h-40 max-h-72 overflow-y-auto mb-4 pr-2">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                  <span className="text-4xl mb-2">🍽️</span>
                  <p className="text-sm font-medium">Aún no has seleccionado platos.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {carrito.map((item) => (
                    <li key={item.id} className="flex justify-between items-center bg-[#f8f5f2] p-3 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-bold text-[#1a1210] text-sm">{item.cantidad}x {item.nombre}</p>
                        <p className="text-xs text-[#7A1010] font-extrabold mt-1">S/ {(Number(item.precio) * item.cantidad).toFixed(2)}</p>
                      </div>
                      <button onClick={() => quitarDelCarrito(item.id)} className="text-gray-400 hover:text-red-600 font-bold text-2xl px-2">&times;</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#1a1210] mb-1 uppercase tracking-wide">Tipo de Entrega</label>
                <select
                  value={tipoEntrega}
                  onChange={(e) => setTipoEntrega(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg text-[#1a1210] font-bold bg-white p-2.5 focus:border-[#7A1010] focus:outline-none"
                >
                  <option value="Mesa">Consumo en salón (Mesa)</option>
                  <option value="Para Llevar">Recojo en tienda</option>
                  <option value="Delivery">Delivery a domicilio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1210] mb-1 uppercase tracking-wide">Tu Nombre</label>
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full border-2 border-gray-300 rounded-lg text-[#1a1210] font-bold bg-white p-2.5 placeholder-gray-400 focus:border-[#7A1010] focus:outline-none"
                />
              </div>

              {tipoEntrega === 'Delivery' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-[#1a1210] mb-1 uppercase tracking-wide">Celular</label>
                    <input
                      type="text"
                      value={telefonoCliente}
                      onChange={(e) => setTelefonoCliente(e.target.value)}
                      placeholder="987654321"
                      className="w-full border-2 border-gray-300 rounded-lg text-[#1a1210] font-bold bg-white p-2.5 placeholder-gray-400 focus:border-[#7A1010] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-[#1a1210] mb-1 uppercase tracking-wide">Dirección</label>
                    <input
                      type="text"
                      value={direccionEntrega}
                      onChange={(e) => setDireccionEntrega(e.target.value)}
                      placeholder="Calle, Mz, Lote"
                      className="w-full border-2 border-gray-300 rounded-lg text-[#1a1210] font-bold bg-white p-2.5 placeholder-gray-400 focus:border-[#7A1010] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-gray-300 pt-4">
              <div className="flex justify-between items-end mb-4">
                <span className="font-bold text-gray-600 text-sm uppercase">Total a Pagar</span>
                <span className="font-extrabold text-3xl text-[#7A1010]">S/ {total.toFixed(2)}</span>
              </div>

              <button
                onClick={enviarPedido}
                disabled={carrito.length === 0 || enviando}
                className={`w-full py-4 rounded-xl font-extrabold text-white text-lg transition-all shadow-md
                  ${carrito.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1a1210] hover:bg-[#33221e] active:scale-95'}`}
              >
                {enviando ? 'Procesando...' : 'Finalizar Compra'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 pb-8 border-t border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-700 font-bold text-sm gap-4">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">🥬 Ingredientes Frescos</span>
          <span className="flex items-center gap-2">🔥 Sabor Inigualable</span>
          <span className="flex items-center gap-2">⏱️ Delivery Rápido</span>
        </div>
        <p>© 2026 D'Lidia Chifa - Pollería | Quilmaná, Cañete</p>
      </div>
    </div>
  );
}