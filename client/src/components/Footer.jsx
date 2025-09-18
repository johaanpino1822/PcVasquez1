import { FaFacebook, FaInstagram, FaWhatsapp, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaGem } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#083D38] to-[#062925] text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Grid de columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Columna 1 - Contacto */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-[#83F4E9] flex items-center">
              <div className="w-2 h-6 bg-[#F2A9FD] rounded-full mr-3"></div>
              CONTÁCTANOS
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-gradient-to-br from-[#F2A9FD] to-[#662D8F] p-2 rounded-lg mr-3">
                  <FaMapMarkerAlt className="text-white text-sm" />
                </div>
                <span> Calle 49#65a-34. Sector Suramericana, Medellín, Colombia </span>
              </li>
              
              <li className="flex items-start">
                <div className="bg-gradient-to-br from-[#F2A9FD] to-[#662D8F] p-2 rounded-lg mr-3">
                  <FaWhatsapp className="text-white text-sm" />
                </div>
                <span>313 7287519</span>
              </li>
              <li className="flex items-start">
                <div className="bg-gradient-to-br from-[#F2A9FD] to-[#662D8F] p-2 rounded-lg mr-3">
                  <FaEnvelope className="text-white text-sm" />
                </div>
                <span>contacto@pcvasquez.com</span>
              </li>
            </ul>
          </div>

          {/* Columna 2 - Horarios */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-[#83F4E9] flex items-center">
              <div className="w-2 h-6 bg-[#F2A9FD] rounded-full mr-3"></div>
              HORARIOS
            </h3>
            <ul className="space-y-4">
              <li className="flex justify-between bg-gradient-to-r from-[#0C4B45]/30 to-transparent p-3 rounded-lg">
                <span>Lunes a Viernes:</span>
                <span className="font-medium text-[#83F4E9]">8:00 AM - 6:00 PM</span>
              </li>
              <li className="flex justify-between bg-gradient-to-r from-[#0C4B45]/30 to-transparent p-3 rounded-lg">
                <span>Sábados:</span>
                <span className="font-medium text-[#83F4E9]">9:00 AM - 2:00 PM</span>
              </li>
              <li className="flex justify-between bg-gradient-to-r from-[#0C4B45]/30 to-transparent p-3 rounded-lg">
                <span>Domingos:</span>
                <span className="font-medium text-[#83F4E9]">Cerrado</span>
              </li>
            </ul>
          </div>

          {/* Columna 3 - Enlaces rápidos */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-[#83F4E9] flex items-center">
              <div className="w-2 h-6 bg-[#F2A9FD] rounded-full mr-3"></div>
              ENLACES RÁPIDOS
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="flex items-center hover:text-[#F2A9FD] transition group">
                  <div className="w-2 h-2 bg-[#83F4E9] rounded-full mr-3 group-hover:bg-[#F2A9FD] transition"></div>
                  <span>Inicio</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center hover:text-[#F2A9FD] transition group">
                  <div className="w-2 h-2 bg-[#83F4E9] rounded-full mr-3 group-hover:bg-[#F2A9FD] transition"></div>
                  <span>Catálogo</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center hover:text-[#F2A9FD] transition group">
                  <div className="w-2 h-2 bg-[#83F4E9] rounded-full mr-3 group-hover:bg-[#F2A9FD] transition"></div>
                  <span>Promociones</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center hover:text-[#F2A9FD] transition group">
                  <div className="w-2 h-2 bg-[#83F4E9] rounded-full mr-3 group-hover:bg-[#F2A9FD] transition"></div>
                  <span>Servicio Técnico</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center hover:text-[#F2A9FD] transition group">
                  <div className="w-2 h-2 bg-[#83F4E9] rounded-full mr-3 group-hover:bg-[#F2A9FD] transition"></div>
                  <span>Políticas de Garantía</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4 - Redes sociales y newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-[#83F4E9] flex items-center">
              <div className="w-2 h-6 bg-[#F2A9FD] rounded-full mr-3"></div>
              CONÉCTATE CON NOSOTROS
            </h3>
            
            {/* Redes sociales */}
            <div className="flex space-x-4 mb-6">
              <a href="https://www.facebook.com/wwwpcvasquezsascom/?locale=es_LA  " className="bg-gradient-to-br from-[#F2A9FD] to-[#662D8F] w-12 h-12 rounded-full flex items-center justify-center transition transform hover:scale-110 shadow-lg">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="bg-gradient-to-br from-[#F2A9FD] to-[#662D8F] w-12 h-12 rounded-full flex items-center justify-center transition transform hover:scale-110 shadow-lg">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="bg-gradient-to-br from-[#F2A9FD] to-[#662D8F] w-12 h-12 rounded-full flex items-center justify-center transition transform hover:scale-110 shadow-lg">
                <FaWhatsapp size={18} />
              </a>
            </div>
            
            {/* Newsletter */}
            <div className="bg-gradient-to-b from-[#0C4B45]/30 to-[#083D38]/30 p-5 rounded-xl border border-[#83F4E9]/20">
              <h4 className="font-medium mb-3 text-[#83F4E9]">SUSCRÍBETE AL NEWSLETTER</h4>
              <p className="text-sm text-gray-300 mb-4">Recibe las últimas promociones y novedades tecnológicas</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Tu correo electrónico" 
                  className="px-4 py-3 rounded-l-lg focus:outline-none text-gray-900 w-full focus:ring-2 ring-[#F2A9FD]"
                />
                <button className="bg-gradient-to-r from-[#F2A9FD] to-[#e895fc] hover:from-[#e895fc] hover:to-[#F2A9FD] px-4 py-3 rounded-r-lg transition font-medium text-[#662D8F]">
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider con estilo */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#83F4E9]/30"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-r from-[#0C4B45] to-[#083D38] px-4 text-[#83F4E9]">
              <FaGem className="inline-block mr-2 text-[#F2A9FD]" />
              17 años innovando en tecnología
            </span>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex items-center">
            <div className="bg-[#662D8F] p-2 rounded-lg mr-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M4 6H20V8H4zM6 10H18V12H6zM8 14H16V16H8z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#F2A9FD] to-[#83F4E9]">
                PC<span className="text-[#F2A9FD]">Vasquez</span>
              </span>
              <span className="text-xs text-[#83F4E9] uppercase tracking-widest">Innovación Tecnológica</span>
            </div>
          </div>
          
          <div className="text-sm text-[#83F4E9]/80 text-center mb-4 md:mb-0">
            <p>&copy; {new Date().getFullYear()} PC Vásquez SAS. Todos los derechos reservados.</p>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-sm text-[#83F4E9] hover:text-[#F2A9FD] transition">Términos y condiciones</a>
            <span className="text-[#83F4E9]/50">|</span>
            <a href="#" className="text-sm text-[#83F4E9] hover:text-[#F2A9FD] transition">Política de privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;