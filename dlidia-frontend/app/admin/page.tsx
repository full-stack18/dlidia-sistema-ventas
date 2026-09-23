'use client';
import * as jwtDecodeModule from 'jwt-decode';
import { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import { API_URL } from '@/lib/api';

interface Plato {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
}

export default function PanelAdministradora() {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [autorizado, setAutorizado] = useState(true);
  const [editando, setEditando] = useState<Plato | null>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Pollería');

  useEffect(() => {
    const token = localStorage.getItem('dlidia_token');
    if (!token) {
      setAutorizado(false);
      return;
    }

    try {
      const decoded: any = (jwtDecodeModule as any).jwtDecode(token);
      if (decoded.rol !== 'Administradora') {
        setAutorizado(false);
        return;
      }
    } catch (error) {
      setAutorizado(false);
      return;
    }

    cargarPlatos();
  }, []);

  const cargarPlatos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/platos`);
      const data = await res.json();
      setPlatos(data);
    } catch (error) {
      console.error("Error al cargar platos:", error);
    }
  };

  const guardarPlato = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('dlidia_token');
    const url = editando ? `${API_URL}/api/platos/${editando.id}` : `${API_URL}/api/platos`;
    const method = editando ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre, descripcion, precio: Number(precio), categoria })
    });

    setNombre('');
    setDescripcion('');
    setPrecio('');
    setCategoria('Pollería');
    setEditando(null);
    cargarPlatos();
  };

  const eliminarPlato = async (id: number) => {
    if (!confirm('¿Seguro que deseas ocultar este plato del E-commerce?')) return;
    const token = localStorage.getItem('dlidia_token');

    await fetch(`${API_URL}/api/platos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    cargarPlatos();
  };

  const editarPlato = (plato: Plato) => {
    setEditando(plato);
    setNombre(plato.nombre);
    setDescripcion(plato.descripcion || '');
    setPrecio(plato.precio.toString());
    setCategoria(plato.categoria);
  };

  if (!autorizado) {
    return <div className="p-8 text-center text-red-600 font-bold">Acceso Denegado. Por favor, inicie sesión con una cuenta de Administrador.</div>;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <AdminNav />
      <h1 className="text-3xl font-bold text-red-600 mb-8 border-b-2 border-red-200 pb-2">
        Mantenimiento de Carta - Panel de Administración
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-lg h-fit border-t-4 border-red-600">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{editando ? 'Editar Plato Existente' : 'Registrar Nuevo Plato'}</h2>
          <form onSubmit={guardarPlato} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del plato</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full border p-2 rounded text-gray-900" placeholder="Ej. Caldo de Gallina" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border p-2 rounded text-gray-900" placeholder="Ingredientes o detalles..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Precio (S/)</label>
              <input type="number" step="0.10" value={precio} onChange={(e) => setPrecio(e.target.value)} required className="w-full border p-2 rounded text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border p-2 rounded text-gray-900">
                <option value="Pollería">Pollería</option>
                <option value="Chifa">Chifa</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Extras">Extras</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 shadow mt-2">
              {editando ? 'Actualizar Precio/Datos' : 'Guardar en Catálogo'}
            </button>
            {editando && (
              <button type="button" onClick={() => { setEditando(null); setNombre(''); setPrecio(''); setDescripcion(''); }} className="w-full bg-gray-400 text-white font-bold py-2 rounded-lg mt-2 hover:bg-gray-500">
                Cancelar Edición
              </button>
            )}
          </form>
        </div>

        <div className="flex-1">
          <div className="grid gap-4">
            {platos.map((plato) => (
              <div key={plato.id} className="bg-white p-5 rounded-xl shadow flex justify-between items-center border-l-4 border-yellow-500">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{plato.nombre}</h3>
                  <p className="text-sm text-gray-500 font-medium">{plato.categoria} {plato.descripcion && `- ${plato.descripcion}`}</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-bold text-green-600 text-xl">S/ {Number(plato.precio).toFixed(2)}</span>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => editarPlato(plato)} className="bg-blue-100 text-blue-700 border border-blue-300 px-4 py-1 rounded font-bold hover:bg-blue-200 transition">Editar</button>
                    <button onClick={() => eliminarPlato(plato.id)} className="bg-red-100 text-red-700 border border-red-300 px-4 py-1 rounded font-bold hover:bg-red-200 transition">Ocultar</button>
                  </div>
                </div>
              </div>
            ))}
            {platos.length === 0 && (
              <p className="text-gray-500 text-center py-10 italic">No hay platos registrados actualmente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}