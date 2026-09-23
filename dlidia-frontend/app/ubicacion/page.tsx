'use client';
import Link from 'next/link';

export default function Ubicacion() {
  return (
    <div className="bg-[#f8f5f2] min-h-screen flex flex-col font-sans">
      {/* Top Navbar Oscuro */}
      <nav className="bg-[#1a1210] text-[#f8f5f2] p-4 flex justify-between items-center shadow-lg border-b-4 border-[#7A1010] shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.jpg" alt="Logo D' Lidia" className="h-14 w-14 rounded-full border-2 border-[#DCA11D] object-cover bg-white group-hover:scale-105 transition-transform" />
          <span className="font-extrabold text-2xl tracking-wide text-[#f8f5f2]">
            D' <span className="text-[#DCA11D]">LIDIA</span>
          </span>
        </Link>
        <div className="hidden md:flex gap-6 font-semibold text-sm">
          <Link href="/" className="hover:text-[#DCA11D] transition-colors">Inicio</Link>
          <Link href="/" className="hover:text-[#DCA11D] transition-colors">Menú</Link>
          <a href="#" className="hover:text-[#DCA11D] transition-colors">Promociones</a>
          <a href="/ubicacion" className="flex items-center gap-1 text-[#DCA11D]">
            📍 Cómo llegar
          </a>
        </div>
      </nav>

      {/* Cabecera Pequeña y Elegante */}
      <div className="bg-linear-to-r from-[#5a0c0c] to-[#7A1010] text-white py-12 px-4 text-center shadow-inner shrink-0">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 drop-shadow-md">
          Visítanos en <span className="text-[#DCA11D]">Quilmaná</span>
        </h1>
        <p className="text-gray-200 font-medium text-lg">
          El mejor ambiente para disfrutar en familia.
        </p>
      </div>

      {/* Contenedor Principal Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex-1">
          
          {/* Columna Izquierda: Tarjeta de Información */}
          <div className="p-8 lg:p-10 flex flex-col justify-center bg-white z-10 border-r border-gray-100">
            <h2 className="text-2xl font-extrabold text-[#1a1210] mb-6 flex items-center gap-2">
              <span className="text-[#7A1010]">📍</span> Nuestra Ubicación
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Dirección Exacta</h3>
                <p className="text-[#1a1210] font-semibold text-lg leading-snug">
                  Av. Principal 123, Frente a la Plaza<br/>
                  Quilmaná, Cañete
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Horario de Atención</h3>
                <ul className="text-[#1a1210] font-medium space-y-1">
                  <li className="flex justify-between border-b border-gray-50 pb-1">
                    <span>Lunes a Jueves:</span> 
                    <span className="font-bold text-[#7A1010]">12:00 PM - 10:00 PM</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-50 pb-1">
                    <span>Viernes a Domingo:</span> 
                    <span className="font-bold text-[#7A1010]">12:00 PM - 11:30 PM</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Contacto Directo</h3>
                <p className="text-[#1a1210] font-extrabold text-xl">📞 (01) 234-5678</p>
              </div>
            </div>

            <a 
              href="https://www.google.com/maps/place/Chifa+Polleria+D'Lidia/@-12.95308,-76.3846234,17z" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-10 w-full bg-[#DCA11D] text-[#1a1210] font-extrabold py-4 rounded-xl hover:bg-yellow-500 transition-colors shadow-md text-center flex justify-center items-center gap-2"
            >
              Abrir en Google Maps 🗺️
            </a>
          </div>

          {/* Columna Derecha: Mapa Integrado */}
          <div className="lg:col-span-2 min-h-[400px] lg:min-h-full relative bg-gray-200">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.582496228308!2d-76.3846234!3d-12.95308!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x910ff76b2db88c83%3A0xc7e64b98b7ef2f0c!2sChifa%20Polleria%20D&#39;Lidia!5e0!3m2!1ses!2spe!4v1700000000000!5m2!1ses!2spe" 
              className="absolute inset-0 w-full h-full" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#1a1210] text-[#f8f5f2] py-6 text-center font-bold text-sm shrink-0">
        <p>© 2026 D'Lidia Chifa - Pollería | Quilmaná, Cañete</p>
      </div>
    </div>
  );
}