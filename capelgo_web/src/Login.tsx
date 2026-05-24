import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Store, Phone, X, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from './context/ConfigContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { plataformaLogo } = useConfig();
  const [selectedPolicyPage, setSelectedPolicyPage] = useState<any>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const openPolicy = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('paginas')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .maybeSingle();

      if (data) {
        setSelectedPolicyPage(data);
      } else {
        const fallbacks: Record<string, any> = {
          privacidade: {
            titulo: 'Política de Privacidade',
            subtitulo: 'Saiba como protegemos seus dados no CapelGo',
            conteudo_html: `
              <div class="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p><strong>1. Coleta de Informações:</strong> Coletamos dados como seu nome, telefone, e-mail, geolocalização e histórico de pedidos para garantir que sua entrega chegue com rapidez e segurança.</p>
                <p><strong>2. Uso de Dados:</strong> Seus dados são utilizados exclusivamente para o processamento de compras, entrega de produtos por nossos parceiros logísticos e participação na roleta de prêmios.</p>
                <p><strong>3. Segurança:</strong> Utilizamos protocolos de segurança avançados e criptografia de ponta a ponta nas transações de pagamento via PIX.</p>
                <p><strong>4. Seus Direitos:</strong> Você pode, a qualquer momento, solicitar a exclusão de sua conta e de todos os seus dados pessoais armazenados em nossos servidores entrando em contato com o suporte.</p>
              </div>
            `,
            cor_tema: '#FF4D2D'
          },
          termos: {
            titulo: 'Termos de Uso',
            subtitulo: 'Regras de utilização da plataforma CapelGo',
            conteudo_html: `
              <div class="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p><strong>1. Adesão aos Termos:</strong> Ao criar uma conta e utilizar o CapelGo, você concorda integralmente com estes termos de intermediação de entrega expressa.</p>
                <p><strong>2. Serviços da Plataforma:</strong> O CapelGo conecta clientes, lojistas e entregadores independentes em uma rede inteligente de logística de bairro.</p>
                <p><strong>3. Pagamentos e Cancelamento:</strong> Os pagamentos são realizados via PIX. Cancelamentos de pedidos podem ser efetuados antes do início do preparo pela loja parceira.</p>
                <p><strong>4. Limitação de Responsabilidade:</strong> Nos esforçamos para garantir prazos de entrega precisos, contudo imprevistos climáticos ou de trânsito podem acarretar pequenas variações.</p>
              </div>
            `,
            cor_tema: '#6366F1'
          },
          devolucoes: {
            titulo: 'Políticas de Devolução',
            subtitulo: 'Regras de troca, cancelamento e reembolso',
            conteudo_html: `
              <div class="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p><strong>1. Direito de Arrependimento:</strong> Conforme o Código de Defesa do Consumidor, solicitações de devolução por arrependimento podem ser feitas em até 7 dias corridos após a entrega do produto.</p>
                <p><strong>2. Condição do Produto:</strong> O produto devolvido deve estar em sua embalagem original, sem sinais de uso ou consumo, acompanhado de eventuais lacres e brindes.</p>
                <p><strong>3. Processo de Reembolso:</strong> O reembolso de pagamentos aprovados via PIX será processado pela nossa equipe financeira em até 24 horas úteis diretamente para a chave do pagador original.</p>
                <p><strong>4. Suporte Rápido:</strong> Para iniciar um processo de troca ou devolução, basta acessar o detalhe do seu pedido na aba de histórico e clicar em "Ajuda" ou contatar o suporte direto.</p>
              </div>
            `,
            cor_tema: '#10B981'
          }
        };
        setSelectedPolicyPage(fallbacks[slug] || { titulo: 'Página Não Encontrada', conteudo_html: '<p>Esta página não foi configurada.</p>' });
      }
      setIsPolicyModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single();

      if (profileError) {
        navigate('/');
        return;
      }

      if (profile.role === 'admin') navigate('/admin');
      else if (profile.role === 'lojista') navigate('/merchant');
      else if (profile.role === 'entregador') navigate('/entregador');
      else navigate('/');

    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="p-4 flex items-center justify-between border-b">
        <button onClick={() => navigate(-1)} className="text-shopee-orange">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-medium text-gray-800">Fazer Login</h1>
        <div className="w-6"></div>
      </header>

      <main className="p-6">
        <div className="flex flex-col items-center mb-10">
           {plataformaLogo ? (
              <img src={plataformaLogo} alt="Logo" className="h-16 object-contain mb-3" />
           ) : (
              <>
                 <div className="w-16 h-16 bg-shopee-orange rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-shopee-orange/20 mb-3">
                    🛍️
                 </div>
                 <h2 className="text-xl font-bold text-shopee-orange">CapelGo</h2>
              </>
           )}
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-sm border border-red-100">{error}</div>}

          <div className="flex items-center border-b border-gray-200 py-3 gap-3">
            <Mail size={18} className="text-gray-400" />
            <input type="email" placeholder="E-mail" className="flex-1 outline-none text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="flex items-center border-b border-gray-200 py-3 gap-3">
            <Lock size={18} className="text-gray-400" />
            <input type={showPassword ? "text" : "password"} placeholder="Senha" className="flex-1 outline-none text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="button" onClick={() => setShowRecoveryModal(true)} className="text-xs text-shopee-orange font-bold text-right self-end mt-1 hover:underline">
            Esqueceu a senha?
          </button>

          <button type="submit" disabled={loading} className="w-full bg-shopee-orange text-white py-3 font-bold rounded-sm mt-4 shadow-md disabled:opacity-70">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="flex items-center gap-3 my-6">
             <div className="h-px flex-1 bg-gray-100"></div>
             <span className="text-gray-300 text-[10px] uppercase font-bold">ou entrar com</span>
             <div className="h-px flex-1 bg-gray-100"></div>
          </div>

          <button type="button" onClick={handleGoogleLogin} className="w-full border py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="google" />
            Google
          </button>

          <p className="text-center text-xs text-gray-400 mt-10">
             Novo no CapelGo? <Link to="/register" className="text-shopee-orange font-bold">Cadastrar</Link>
          </p>
        </form>

        {/* INFORMAÇÕES DA EMPRESA & POLÍTICAS (CNPJ, CONTATOS, ETC.) */}
        <footer className="text-center py-6 px-4 space-y-4 border-t border-gray-100 mt-12">
          {/* Links Rápidos de Políticas */}
          <div className="flex justify-center items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <button 
              type="button"
              onClick={() => openPolicy('privacidade')}
              className="hover:text-shopee-orange transition-colors"
            >
              Privacidade
            </button>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <button 
              type="button"
              onClick={() => openPolicy('termos')}
              className="hover:text-shopee-orange transition-colors"
            >
              Termos
            </button>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <button 
              type="button"
              onClick={() => openPolicy('devolucoes')}
              className="hover:text-shopee-orange transition-colors"
            >
              Devoluções
            </button>
          </div>

          {/* Dados Fiscais da Empresa */}
          <div className="bg-slate-50 rounded-xl p-3 border border-gray-100 shadow-xs space-y-1">
            <p className="text-[10px] font-black text-gray-700 tracking-tight flex items-center justify-center gap-1.5 uppercase">
              <Store size={10} className="text-shopee-orange" /> CapelGo - Lojas Capel Ltda
            </p>
            <p className="text-[9px] font-medium text-gray-400">
              CNPJ: 51.575.325/0001-33
            </p>
          </div>

          {/* Canais de Contato */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">
            <a href="mailto:contatos@lojascapel.com" className="flex items-center gap-1 hover:text-shopee-orange transition-colors">
              <Mail size={11} className="text-slate-400" /> contatos@lojascapel.com
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a href="tel:08007779000" className="flex items-center gap-1 hover:text-shopee-orange transition-colors">
              <Phone size={11} className="text-slate-400" /> 0800 777 9000
            </a>
          </div>

          {/* Direitos Reservados */}
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pt-2">
            © {new Date().getFullYear()} CapelGo. Todos os direitos reservados.
          </p>
        </footer>
      </main>

      {/* MODAL DE POLÍTICAS E CMS */}
      <AnimatePresence>
        {isPolicyModalOpen && selectedPolicyPage && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsPolicyModalOpen(false)} 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative bg-white w-full max-w-md h-[75vh] md:h-[550px] rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
                <div>
                  <h3 className="text-sm font-black tracking-tight" style={{ color: selectedPolicyPage.cor_tema }}>
                    {selectedPolicyPage.titulo}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                    {selectedPolicyPage.subtitulo || 'Políticas Oficiais'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsPolicyModalOpen(false)} 
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                <div 
                  className="text-xs text-slate-600 leading-relaxed font-bold space-y-3"
                  dangerouslySetInnerHTML={{ __html: selectedPolicyPage.conteudo_html }}
                />
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-white border-t flex justify-end">
                <button 
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-6 py-2 rounded-xl font-black text-[10px] text-white shadow-md active:scale-95 uppercase tracking-wider transition-transform"
                  style={{ backgroundColor: selectedPolicyPage.cor_tema || '#FF4D2D' }}
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL RECUPERAR SENHA */}
      <AnimatePresence>
        {showRecoveryModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => { setShowRecoveryModal(false); setRecoverySent(false); setRecoveryEmail(''); setRecoveryError(''); }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-10"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-shopee-orange/10 rounded-2xl flex items-center justify-center">
                    <KeyRound size={20} className="text-shopee-orange" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-slate-800">Recuperar Senha</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                      {recoverySent ? 'E-mail enviado' : 'Digite seu e-mail'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowRecoveryModal(false); setRecoverySent(false); setRecoveryEmail(''); setRecoveryError(''); }} 
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {!recoverySent ? (
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Enviaremos um link de recuperação para o e-mail cadastrado. Clique no link para criar uma nova senha.
                  </p>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-sm">
                    <p className="text-[9px] text-amber-700 font-medium">
                      <strong>Importante:</strong> O sistema precisa de um serviço de e-mail configurado no Supabase para enviar o link. Se o erro persistir, peça ao administrador para configurar o SMTP em <strong>Authentication &gt; Settings &gt; SMTP</strong> no painel do Supabase.
                    </p>
                  </div>
                  <div className="flex items-center border-b border-gray-200 py-3 gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <input 
                      type="email" 
                      placeholder="Seu e-mail cadastrado" 
                      className="flex-1 outline-none text-sm" 
                      value={recoveryEmail} 
                      onChange={e => { setRecoveryEmail(e.target.value); setRecoveryError(''); }} 
                      required 
                    />
                  </div>
                  {recoveryError && (
                    <div className="bg-red-50 text-red-500 text-xs p-3 rounded-sm border border-red-100">{recoveryError}</div>
                  )}
                  <button
                    onClick={async () => {
                      if (!recoveryEmail.trim()) return;
                      setRecoveryError('');
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(recoveryEmail.trim())) {
                        setRecoveryError('E-mail inválido. Digite um e-mail válido (ex: nome@dominio.com).');
                        return;
                      }
                      setSendingRecovery(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail.trim(), {
                          redirectTo: window.location.origin + '/login',
                        });
                        if (error) throw error;
                        setRecoverySent(true);
                      } catch (err: any) {
                        setRecoveryError(err.message === 'Email address is invalid'
                          ? 'Este e-mail não pode receber o link de recuperação. Pode ser um e-mail inexistente ou o serviço de e-mail do sistema não está configurado. Contate o suporte pelo 0800 777 9000.'
                          : err.message);
                      } finally {
                        setSendingRecovery(false);
                      }
                    }}
                    disabled={!recoveryEmail.trim() || sendingRecovery}
                    className="w-full bg-shopee-orange text-white py-3.5 font-bold rounded-sm shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {sendingRecovery ? 'Enviando...' : 'Enviar Link de Recuperação'}
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Mail size={28} className="text-green-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">E-mail enviado!</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Enviamos um link de recuperação para <strong className="text-slate-800">{recoveryEmail}</strong>. 
                    Verifique sua caixa de entrada e spam.
                  </p>
                  <button
                    onClick={() => { setShowRecoveryModal(false); setRecoverySent(false); setRecoveryEmail(''); }}
                    className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-sm text-xs hover:bg-slate-200 transition-all"
                  >
                    Ok, entendi
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
