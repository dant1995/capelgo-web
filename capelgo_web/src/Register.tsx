import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, MapPin, Search, Smartphone, Store, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Estados do Endereço
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  
  const [role, setRole] = useState<'cliente' | 'lojista' | 'entregador'>('cliente');
  const [nomeLoja, setNomeLoja] = useState('');
  const [categoria, setCategoria] = useState('eletronicos');
  const [veiculoModelo, setVeiculoModelo] = useState('');
  const [veiculoPlaca, setVeiculoPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Busca CEP automática
  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setRua(data.logradouro);
        setBairro(data.bairro);
        setCidade(`${data.localidade} - ${data.uf}`);
      }
    } catch (err) { console.error("Erro ao buscar CEP"); }
  };

  const handleRegister = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError('');
 
     const enderecoCompleto = `${rua}, ${numero} - ${bairro}, ${cidade} (CEP: ${cep})`;
 
     try {
       const { data, error: signUpError } = await supabase.auth.signUp({
         email,
         password,
         options: {
           data: {
             full_name: nome,
             phone: telefone,
             role: role
           }
         }
       });
 
       if (signUpError) {
         setError("Erro no cadastro: " + signUpError.message);
         setLoading(false);
         return;
       }
 
       if (data.user) {
         let retryCount = 0;
         let profileCreated = false;
         while (retryCount < 3 && !profileCreated) {
           await new Promise(r => setTimeout(r, 3000)); 
           const { error: profErr } = await supabase.from('profiles').upsert({
             id: data.user.id,
             nome: nome,
             telefone: telefone,
             email: email,
             endereco: enderecoCompleto,
             role: role,
             veiculo_modelo: role === 'entregador' ? veiculoModelo : null,
             veiculo_placa: role === 'entregador' ? veiculoPlaca : null,
             status_aprovacao: role === 'entregador' ? 'pendente_documentos' : 'aprovado'
           });
           if (!profErr) {
             profileCreated = true;
             if (role === 'lojista') {
               const { data: loja, error: lojaErr } = await supabase
                 .from('lojas')
                 .insert({ 
                   nome: nomeLoja || `Loja de ${nome}`,
                   telefone: telefone,
                   endereco: enderecoCompleto,
                   categoria: categoria
                 })
                 .select()
                 .maybeSingle();

               if (lojaErr) {
                 console.error("ERRO AO CRIAR LOJA:", lojaErr);
                 alert("Erro ao criar a loja: " + lojaErr.message);
               } else if (loja) {
                 await supabase.from('profiles').update({ loja_id: loja.id }).eq('id', data.user.id);
               }
             }
           } else {
             retryCount++;
           }
         }
       } else {
         setError("O usuário foi criado, mas aguarda confirmação de e-mail.");
         setLoading(false);
         return;
       }
       
       alert('Cadastro realizado com sucesso!');
       navigate('/login');
     } catch (err: any) {
       setError(err.message || 'Erro ao realizar cadastro.');
     } finally {
       setLoading(false);
     }
   };
 
  return (
    <div className="min-h-screen bg-white pb-10">
      <header className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="text-shopee-orange">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-medium text-gray-800">Criar Conta</h1>
        <div className="w-6"></div>
      </header>

      <main className="p-6">
        <div className="flex bg-gray-100 p-1 rounded-sm mb-8">
           <button 
             onClick={() => setRole('cliente')}
             className={`flex-1 py-2 text-xs font-bold rounded-sm transition-all ${role === 'cliente' ? 'bg-white text-shopee-orange shadow-sm' : 'text-gray-400'}`}
           >
             Sou Cliente
           </button>
           <button 
             onClick={() => setRole('lojista')}
             className={`flex-1 py-2 text-xs font-bold rounded-sm transition-all ${role === 'lojista' ? 'bg-white text-shopee-orange shadow-sm' : 'text-gray-400'}`}
           >
             Sou Lojista
           </button>
           <button 
             onClick={() => setRole('entregador')}
             className={`flex-1 py-2 text-xs font-bold rounded-sm transition-all ${role === 'entregador' ? 'bg-white text-shopee-orange shadow-sm' : 'text-gray-400'}`}
           >
             Sou Entregador
           </button>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-red-500 text-xs p-3 rounded-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Dados Pessoais</h3>
            
            <div className="flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
              <User size={18} className="text-gray-400" />
              <input type="text" placeholder="Nome Completo" className="flex-1 bg-transparent outline-none text-sm" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div className="flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
              <Mail size={18} className="text-gray-400" />
              <input type="email" placeholder="E-mail" className="flex-1 bg-transparent outline-none text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
              <Smartphone size={18} className="text-gray-400" />
              <input 
                type="tel" 
                placeholder="Telefone (ex: 11999999999)" 
                className="flex-1 bg-transparent outline-none text-sm" 
                value={telefone} 
                onChange={(e) => setTelefone(e.target.value)} 
                required 
              />
            </div>

            {role === 'entregador' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center border-b border-blue-200 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
                  <Smartphone size={18} className="text-blue-500" />
                  <input 
                    type="text" 
                    placeholder="Modelo do Veículo (ex: Honda CG 160)" 
                    className="flex-1 bg-transparent outline-none text-sm font-bold placeholder:font-normal" 
                    value={veiculoModelo} 
                    onChange={(e) => setVeiculoModelo(e.target.value)} 
                    required 
                  />
                </div>
                <div className="flex items-center border-b border-blue-200 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
                  <Tag size={18} className="text-blue-500" />
                  <input 
                    type="text" 
                    placeholder="Placa do Veículo" 
                    className="flex-1 bg-transparent outline-none text-sm font-bold placeholder:font-normal" 
                    value={veiculoPlaca} 
                    onChange={(e) => setVeiculoPlaca(e.target.value)} 
                    required 
                  />
                </div>
              </motion.div>
            )}

            {role === 'lojista' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-orange-50/30 p-3 rounded-lg border border-orange-100">
                <div className="flex items-center border-b border-orange-200 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
                  <Store size={18} className="text-shopee-orange" />
                  <input 
                    type="text" 
                    placeholder="Nome Fantasia da sua Loja" 
                    className="flex-1 bg-transparent outline-none text-sm font-bold placeholder:font-normal" 
                    value={nomeLoja} 
                    onChange={(e) => setNomeLoja(e.target.value)} 
                    required 
                  />
                </div>

                <div className="flex items-center py-1 gap-3">
                  <Tag size={16} className="text-orange-400" />
                  <span className="text-xs font-bold text-orange-400 uppercase">Categoria:</span>
                  <select 
                    className="flex-1 bg-white border border-orange-200 rounded-sm p-2 text-sm outline-none focus:border-shopee-orange"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    required
                  >
                    <option value="eletronicos">Eletrônicos</option>
                    <option value="farmacia">Farmácia</option>
                    <option value="mercado">Mercado</option>
                    <option value="padaria">Padaria</option>
                    <option value="vestuario">Vestuário</option>
                    <option value="ferramentas">Ferramentas</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Endereço de Entrega</h3>
            
            <div className="flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="CEP (Só números)" 
                className="flex-1 bg-transparent outline-none text-sm" 
                value={cep} 
                onChange={(e) => setCep(e.target.value)} 
                onBlur={handleCepBlur}
                maxLength={8}
                required 
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-[3] flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
                <MapPin size={18} className="text-gray-400" />
                <input type="text" placeholder="Rua / Logradouro" className="flex-1 bg-transparent outline-none text-sm" value={rua} onChange={(e) => setRua(e.target.value)} required />
              </div>
              <div className="flex-1 flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
                <input type="text" placeholder="Nº" className="flex-1 bg-transparent outline-none text-sm" value={numero} onChange={(e) => setNumero(e.target.value)} required />
              </div>
            </div>

            <div className="flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
              <MapPin size={18} className="text-gray-400" />
              <input type="text" placeholder="Bairro" className="flex-1 bg-transparent outline-none text-sm" value={bairro} onChange={(e) => setBairro(e.target.value)} required />
            </div>

            <div className="flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
              <MapPin size={18} className="text-gray-400" />
              <input type="text" placeholder="Cidade - UF" className="flex-1 bg-transparent outline-none text-sm bg-gray-50/50" value={cidade} onChange={(e) => setCidade(e.target.value)} required readOnly />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Segurança</h3>
            <div className="flex items-center border-b border-gray-100 py-2 gap-3 focus-within:border-shopee-orange transition-colors">
              <Lock size={18} className="text-gray-400" />
              <input type={showPassword ? "text" : "password"} placeholder="Crie uma senha" className="flex-1 bg-transparent outline-none text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-shopee-orange text-white py-4 font-bold rounded-sm mt-8 shadow-lg shadow-shopee-orange/20 active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-6">
             Já tem uma conta? <Link to="/login" className="text-shopee-orange font-bold">Fazer Login</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
