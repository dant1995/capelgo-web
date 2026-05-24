import React from 'react';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="hidden md:block bg-white border-t-4 border-[#EE4D2D] pt-12 mt-10 text-gray-600 text-xs">
      <div className="max-w-[1200px] mx-auto w-full px-4">
        <div className="grid grid-cols-5 gap-8 mb-8">
          {/* Coluna 1 */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-xs tracking-wider uppercase">Atendimento ao Cliente</h3>
            <ul className="space-y-2.5">
              <li onClick={() => navigate('/institucional/central-de-ajuda')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Central de Ajuda</li>
              <li onClick={() => navigate('/institucional/como-comprar')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Como Comprar</li>
              <li onClick={() => navigate('/institucional/metodos-de-pagamento')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Métodos de Pagamento</li>
              <li onClick={() => navigate('/institucional/garantia')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Garantia CapelGo</li>
              <li onClick={() => navigate('/institucional/devolucao-e-reembolso')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Devolução e Reembolso</li>
              <li onClick={() => navigate('/institucional/fale-conosco')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Fale Conosco</li>
              <li onClick={() => navigate('/institucional/ouvidoria')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Ouvidoria</li>
            </ul>
          </div>

          {/* Coluna 2 */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-xs tracking-wider uppercase">Sobre a CapelGo</h3>
            <ul className="space-y-2.5">
              <li onClick={() => navigate('/institucional/sobre-nos')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Sobre Nós</li>
              <li onClick={() => navigate('/institucional/politicas')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Políticas CapelGo</li>
              <li onClick={() => navigate('/institucional/privacidade')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Política de Privacidade</li>
              <li onClick={() => navigate('/institucional/afiliados')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Programa de Afiliados</li>
              <li onClick={() => navigate('/register')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Seja um Entregador</li>
              <li onClick={() => navigate('/promocoes')} className="hover:text-[#EE4D2D] cursor-pointer transition-colors">Ofertas Relâmpago</li>
            </ul>
          </div>

          {/* Coluna 3 */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-xs tracking-wider uppercase">Pagamento</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white h-8 shadow-sm border border-gray-200 flex items-center justify-center rounded-sm">
                <span className="font-black text-[11px] text-blue-800 italic">VISA</span>
              </div>
              <div className="bg-white h-8 shadow-sm border border-gray-200 flex items-center justify-center rounded-sm">
                <div className="flex -space-x-1">
                   <div className="w-3.5 h-3.5 bg-red-500 rounded-full mix-blend-multiply"></div>
                   <div className="w-3.5 h-3.5 bg-yellow-500 rounded-full mix-blend-multiply"></div>
                </div>
              </div>
              <div className="bg-white h-8 shadow-sm border border-gray-200 flex items-center justify-center rounded-sm">
                <span className="font-black text-[10px] text-teal-500">pix</span>
              </div>
              <div className="bg-white h-8 shadow-sm border border-gray-200 flex items-center justify-center rounded-sm">
                <span className="font-bold text-[8px] text-gray-700">BOLETO</span>
              </div>
            </div>
          </div>

          {/* Coluna 4 */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-xs tracking-wider uppercase">Siga-nos</h3>
            <ul className="space-y-3">
              <li onClick={() => window.open('https://instagram.com/lojascapel', '_blank')} className="flex items-center gap-2 hover:text-[#EE4D2D] cursor-pointer transition-colors">
                <Instagram size={16} className="text-gray-700" /> Instagram
              </li>
              <li onClick={() => window.open('https://facebook.com/lojascapel', '_blank')} className="flex items-center gap-2 hover:text-[#EE4D2D] cursor-pointer transition-colors">
                <Facebook size={16} className="text-gray-700" /> Facebook
              </li>
              <li onClick={() => window.open('https://wa.me/5500000000000', '_blank')} className="flex items-center gap-2 hover:text-[#EE4D2D] cursor-pointer transition-colors">
                <MessageCircle size={16} className="text-gray-700" /> WhatsApp
              </li>
            </ul>
          </div>

          {/* Coluna 5 */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-xs tracking-wider uppercase">Baixar App CapelGo</h3>
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-white p-1 border border-gray-200 shadow-sm flex items-center justify-center rounded-sm">
                {/* QR Code Fake para simular a imagem real */}
                <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                   <span className="text-[8px] text-gray-400 font-bold text-center leading-tight">QR CODE</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <div onClick={() => window.open('https://apple.com/app-store/', '_blank')} className="bg-white border border-gray-200 px-3 h-9 flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm rounded-sm transition-colors">
                  <span className="font-bold text-[10px] text-gray-700">App Store</span>
                </div>
                <div onClick={() => window.open('https://play.google.com/store/', '_blank')} className="bg-white border border-gray-200 px-3 h-9 flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm rounded-sm transition-colors">
                  <span className="font-bold text-[10px] text-gray-700">Google Play</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 py-6 flex justify-between items-center text-[11px] text-gray-500">
          <p>© 2026 CapelGo. Todos os direitos reservados.</p>
          <p>País e região: Brasil</p>
        </div>
      </div>
      
      {/* Faixa Inferior de CNPJ e Endereço */}
      <div className="bg-[#F5F5F5] py-8 text-center text-[10px] text-gray-400 flex flex-col gap-2">
        <div className="flex items-center justify-center gap-4 mb-2">
           <span onClick={() => navigate('/institucional/privacidade')} className="hover:text-gray-600 cursor-pointer transition-colors">Políticas de Privacidade</span>
           <span>|</span>
           <span onClick={() => navigate('/institucional/politicas')} className="hover:text-gray-600 cursor-pointer transition-colors">Termos de Uso</span>
        </div>
        <p>CNPJ: 00.000.000/0001-00 - Endereço: Avenida Fictícia, 1234 - São Paulo, SP - CEP: 00000-000</p>
      </div>
    </footer>
  );
}
