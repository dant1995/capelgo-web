import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Store, Loader2, CheckCircle, XCircle, X, Sparkles, ShoppingBag, Tag, FileText, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { CATEGORIAS_SISTEMA } from '../lib/constants';

interface GeneratedProduct {
  nome: string;
  descricao: string;
  especificacoes: string;
  preco: string;
  categoria: string;
  subcategoria: string;
  estoque: string;
  imagem_url: string;
  galeria: string[];
  variacoes: string;
}

interface ProductTemplate {
  descricoes: string[];
  especs: string[];
  precos: number[];
  cats: string[];
  subs: string[];
  imgs: string[];
}

interface Props {
  supabase: any;
  lojas: any[];
  onComplete?: () => void;
}

const PRODUCT_TEMPLATES: Record<string, ProductTemplate> = {
  camiseta: {
    descricoes: [
      'Camiseta confeccionada em algodão premium de alta gramatura, proporcionando conforto e durabilidade. Costura reforçada e acabamento impecável. Ideal para uso diário com estilo.',
      'Camiseta básica de malha algodão 30.1, toque macio e caimento perfeito. Gola redonda reforçada com elástico interno que mantém o formato original mesmo após várias lavagens.',
      'Camiseta moderna em algodão orgânico certificado, sustentável e hipoalergênico. Modelagem regular fit que valoriza a silhueta sem apertar.'
    ],
    especs: [
      'Material: 100% Algodão Premium\nGramatura: 200g/m²\nGola: Redonda reforçada\nManga: Curta\nCostura: Reforçada dupla\nLavagem: Máquina até 40°C\nSecagem: Natural ou máquina baixa\nTamanhos: P, M, G, GG',
      'Material: Malha Algodão 30.1\nPeso: 180g\nGola: Redonda com elástico\nManga: Curta tradicional\nModelagem: Regular fit\nCor: Variada conforme estoque\nInstruções: Lavar em água fria\nTamanhos Disponíveis: PP ao XGG'
    ],
    precos: [49.90, 59.90, 69.90, 44.90, 54.90],
    cats: ['vestuario'],
    subs: ['Masculino', 'Feminino', 'Infantil'],
    imgs: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500'
    ]
  },
  bermuda: {
    descricoes: [
      'Bermuda jeans de alta qualidade com modelagem moderna. Tecido resistente com elastano para maior conforto e mobilidade. Bolsos funcionais e acabamento premium.',
      'Bermuda cargo em algodão com múltiplos bolsos, perfeita para o dia a dia. Cintura com elástico e cordão ajustável. Reforço nas costuras para maior durabilidade.',
      'Bermuda sarja slim fit com corte moderno. Ideal para looks casuais e semiformais. Tecido leve e fresco, perfeito para dias quentes.'
    ],
    especs: [
      'Material: Jeans Algodão + Elastano\nComposição: 98% Algodão, 2% Elastano\nFechamento: Zíper + Botão\nBolsos: 2 frontais + 2 traseiros\nCintura: Média\nComprimento: Curto (30cm)\nTamanhos: 36 ao 50\nLavagem: Máquina até 30°C',
      'Material: Algodão Sarja 100%\nPeso: 240g/m²\nBolsos: 6 (4 cargo + 2 frontais)\nCintura: Elástico + Cordão\nComprimento: 28cm\nTamanhos: P ao XGG\nCores disponíveis: variadas'
    ],
    precos: [79.90, 89.90, 99.90, 69.90],
    cats: ['vestuario'],
    subs: ['Masculino', 'Feminino'],
    imgs: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500',
      'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500'
    ]
  },
  tenis: {
    descricoes: [
      'Tênis esportivo com design moderno e ergonômico. Cabedal em mesh respirável com reforços em couro sintético. Solado em EVA com tecnologia de amortecimento que reduz o impacto nas articulações.',
      'Tênis casual em couro legítimo com palmilha ortopédica removível. Solado antiderrapante em borracha natural. Ideal para caminhadas e uso diário com conforto absoluto.',
      'Tênis running profissional com sistema de amortecimento Air. Cabedal knit ultraleve que se adapta ao pé. Solado de borracha de alta resistência com 5mm de drop.'
    ],
    especs: [
      'Cabedal: Mesh respirável + Couro Sintético\nSolado: EVA + Borracha\nAmortecimento: Air Cushion Technology\nPalmilha: Removível anatômica\nPeso: 280g (par 38)\\nGênero: Unissex\nTamanhos: 33 ao 46\nGarantia: 3 meses contra defeitos',
      'Material Externo: Couro Legítimo\nForro: Têxtil respirável\nSolado: Borracha Natural antiderrapante\nPalmilha: Ortopédica removível\nFechamento: Cadarço\nIndicação: Casual/Dia a Dia'
    ],
    precos: [149.90, 179.90, 199.90, 129.90, 159.90],
    cats: ['vestuario'],
    subs: ['Calçados'],
    imgs: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500'
    ]
  },
  fone: {
    descricoes: [
      'Fone de ouvido Bluetooth 5.3 com cancelamento de ruído ativo (ANC). Drivers de 40mm com som imersivo e graves potentes. Bateria com incríveis 40 horas de reprodução.',
      'Headphone sem fio com design dobrável e almofadas em couro memory foam. Microfone embutido com redução de ruído para chamadas nítidas. Conexão multiponto para 2 dispositivos.',
      'Fone intra-auricular esportivo com proteção IPX7 contra suor e água. Haste flexível com controle touch. Carregamento rápido - 10 min = 2h de uso.'
    ],
    especs: [
      'Conexão: Bluetooth 5.3\nAlcance: 15m\nDrivers: 40mm\nANC: Sim (Cancelamento Ativo)\nBateria: 40h reprodução\nCarregamento: USB-C (2h carga total)\nPeso: 220g\nMicrofone: Sim com ENC\nCompatibilidade: Android/iOS/PC',
      'Tipo: Over-ear fechado\nDriver: 40mm dinâmico\nResposta: 20Hz-20kHz\nBluetooth: 5.2\nCodecs: SBC, AAC, aptX\nBateria: 30h\nAlmofadas: Couro memory foam\nDobrável: Sim'
    ],
    precos: [89.90, 129.90, 199.90, 79.90, 149.90],
    cats: ['eletronicos'],
    subs: ['Áudio e Vídeo', 'Periféricos'],
    imgs: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
    ]
  },
  mochila: {
    descricoes: [
      'Mochila executiva em couro sintético premium com compartimento acolchoado para notebook de até 15.6". Design elegante e funcional com organização interna completa. Alças acolchoadas e costas ventiladas.',
      'Mochila escolar resistente com capacidade de 35L. Bolso frontal organizador com diversos compartimentos. Laterais em mesh para garrafa. Fecho YKK de alta durabilidade.',
      'Mochila tática impermeável em nylon balístico 1000D. Sistema MOLLE para fixação de acessórios. Ideal para viagens e aventuras ao ar livre.'
    ],
    especs: [
      'Material: Couro Sintético Premium\nCapacidade: 25L\nNotebook: Acolchoado até 15.6"\nCompartimentos: 1 principal + 2 médios + organizador\nAlças: Acolchoadas ajustáveis\nCostas: Ventiladas\nFechamento: Zíper duplo YKK\nPeso: 800g\nGarantia: 6 meses',
      'Material: Nylon Balístico 1000D\nCapacidade: 35L\nPeso: 1.2kg\nImpermeável: Sim\nAlças: Reforçadas acolchoadas\nBolso Notebook: Sim (até 17")\nSistema MOLLE: Sim'
    ],
    precos: [119.90, 149.90, 199.90, 99.90],
    cats: ['vestuario', 'dia-a-dia'],
    subs: ['Acessórios'],
    imgs: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'
    ]
  },
  relogio: {
    descricoes: [
      'Relógio digital esportivo com mais de 50 funções. Cronômetro, alarme, calendário, luz de fundo LED e resistência à água 50m. Pulseira de silicone confortável para uso prolongado.',
      'Relógio analógico clássico em aço inoxidável com movimento quartzo japonês. Mostrador com proteção em vidro mineral. Pulseira em couro legítimo com fecho bipartido.',
      'Smartwatch com monitor cardíaco, oxímetro e GPS integrado. Tela AMOLED de 1.43" com sempre ligado. Mais de 100 modos esportivos e bateria de 14 dias.'
    ],
    especs: [
      'Tipo: Digital Esportivo\nFunções: 50+ (cronômetro, alarme, calendário)\nResistência: 50m (5 ATM)\nPulseira: Silicone hipoalergênico\nLuz: LED azul\nBateria: 2 anos (CR2032)\nGarantia: 6 meses\nPulseira adicional: Sim (na caixa)',
      'Tipo: Analógico Quartzo\nMovimento: Japonês\nCaixa: Aço Inoxidável 40mm\nVidro: Mineral resistente a riscos\nPulseira: Couro Legítimo\nFecho: Bipartido aço\nResistência: 30m (3 ATM)\nPeso: 95g'
    ],
    precos: [59.90, 89.90, 149.90, 199.90, 249.90],
    cats: ['eletronicos'],
    subs: ['Periféricos', 'Gamer'],
    imgs: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500',
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500',
      'https://images.unsplash.com/photo-1533139502658-0198f920d5cc?w=500'
    ]
  },
  chocolate: {
    descricoes: [
      'Chocolate artesanal 70% cacau produzido com grãos selecionados. Processo de conchagem lenta por 48h garante textura aveludada e sabor intenso. Embalagem premium com selo de qualidade.',
      'Caixa de bombons finos sortidos com 12 unidades. Recheios variados como brigadeiro, cupuaçu, maracujá e castanha. Presente perfeito para qualquer ocasião.',
      'Chocolate ao leite com pedaços de castanha-do-pará. Produção artesanal em pequenos lotes. Ingredientes naturais sem conservantes ou corantes artificiais.'
    ],
    especs: [
      'Tipo: Chocolate Amargo\nTeor Cacau: 70%\nIngredientes: Massa de cacau, manteiga de cacau, açúcar\nContém: Traços de castanhas e leite\nPeso Líquido: 180g\nValidade: 12 meses\nArmazenamento: Local seco até 25°C\nCertificação: Selo Artesanal',
      'Unidades: 12 bombons\nPeso Líquido: 240g\nSabores: Brigadeiro, Cupuaçu, Maracujá, Castanha\nValidade: 6 meses\nNão contém glúten\nEmbalagem: Caixa presente premium'
    ],
    precos: [29.90, 39.90, 49.90, 59.90],
    cats: ['dia-a-dia'],
    subs: ['Mercado'],
    imgs: [
      'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=500',
      'https://images.unsplash.com/photo-1601370690183-1c7796ecec61?w=500',
      'https://images.unsplash.com/photo-1619597455322-4fbbd820250a?w=500'
    ]
  },
  mouse: {
    descricoes: [
      'Mouse gamer com sensor óptico de 16000 DPI ajustável. 6 botões programáveis com software de configuração. Iluminação RGB personalizável com 16.8 milhões de cores. Taxa de polling de 1000Hz.',
      'Mouse sem fio ergonômico com design vertical que reduz a tensão no pulso. Conexão Bluetooth 5.0 e receptor USB. Silencioso com cliques de baixo ruído. Bateria recarregável com 3 meses de autonomia.',
      'Mouse ultraleve para jogos competitivos com apenas 58g. Cabo paracord flexível que não prende. Skates em PTFE 100% para deslize suave. Sensor Flagship de 26000 DPI.'
    ],
    especs: [
      'Sensor: Óptico 16000 DPI\nBotões: 6 programáveis\nRGB: 16.8 milhões de cores\nPolling Rate: 1000Hz (1ms)\nConexão: USB-C (cabo)\nPeso: 85g\nSoftware: Sim (configuração)\nCompatibilidade: PC/Mac',
      'Tipo: Sem fio Bluetooth 5.0\nDPI: Ajustável até 3200\nDesign: Ergonômico Vertical\nBateria: Recarregável (3 meses)\nCliques: Silenciosos\nCompatível: Windows/Mac/Android'
    ],
    precos: [79.90, 129.90, 199.90, 59.90, 99.90],
    cats: ['eletronicos'],
    subs: ['Periféricos', 'Gamer'],
    imgs: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500',
      'https://images.unsplash.com/photo-1526406915895-315b0a8dbe4a?w=500'
    ]
  },
  caneca: {
    descricoes: [
      'Caneca personalizada em cerâmica de alta qualidade com estampa térmica que muda de cor com o calor. Capacidade 350ml. Aço inoxidável interno mantém a temperatura por até 2h.',
      'Caneca porcelana 300ml com design moderno e minimalista. Acabamento brilhante de alta durabilidade. Compatível com micro-ondas e lava-louças. Embalagem presenteável.',
      'Caneca térmica em aço inoxidável dupla parede com tampa hermética. Mantém bebidas quentes por até 6h ou frias por 12h. Capacidade 400ml. Design elegante para escritório.'
    ],
    especs: [
      'Material: Cerâmica de alta qualidade\nCapacidade: 350ml\nPersonalização: Estampa térmica (muda com calor)\nCompatível: Micro-ondas (exceto estampa)\nLava-louças: Sim\nPeso: 320g\nGarantia contra defeitos: 3 meses',
      'Material: Porcelana\nCapacidade: 300ml\nAcabamento: Brilhante\nCompatível: Micro-ondas e lava-louças\nCor: Variada\nEmbalagem: Caixa presente',
      'Material: Aço Inoxidável 304\nParede: Dupla com isolamento a vácuo\nCapacidade: 400ml\nTampa: Hermética antiderramamento\nTemperatura: Quente 6h / Fria 12h\nLivre de BPA'
    ],
    precos: [39.90, 49.90, 59.90, 34.90],
    cats: ['dia-a-dia'],
    subs: ['Acessórios'],
    imgs: [
      'https://images.unsplash.com/photo-1577937927133-66ef06fdf7d1?w=500',
      'https://images.unsplash.com/photo-1514228742587-6b0938b80d2c?w=500',
      'https://images.unsplash.com/photo-1513549327180-4429e808c2d1?w=500'
    ]
  },
  cadeira: {
    descricoes: [
      'Cadeira ergonômica com suporte lombar ajustável e apoio de braço 3D. Assento em mesh respirável que evita suor. Base giratória com 5 rodízios. Capacidade de peso até 150kg.',
      'Cadeira gamer com design esportivo e almofadas para lombar e cervical. Revestimento em couro sintético premium. Braços ajustáveis 4D e mecanismo rocking. Estrutura em aço com certificação.',
      'Cadeira de escritório executiva em couro legítimo com encosto alto. Ajuste de altura a gás. Braços acolchoados fixos. Design clássico e imponente para salas de reunião.'
    ],
    especs: [
      'Tipo: Ergonômica Executiva\nEncosto: Mesh respirável\nSuporte Lombar: Ajustável em altura\nBraços: 3D ajustáveis\nCapacidade: 150kg\nBase: Giratória 360° com 5 rodízios\nAjuste: Altura a gás\nPeso: 18kg\nGarantia: 1 ano',
      'Tipo: Gamer Esportiva\nRevestimento: Couro sintético\nAlmofadas: Lombar + Cervical\nBraços: 4D ajustáveis\nMecanismo: Rocking c/trava\nCapacidade: 130kg\nBase: Aço com rodízios Nylon\nCertificação: BIFMA'
    ],
    precos: [599.90, 799.90, 449.90, 349.90],
    cats: ['eletronicos'],
    subs: ['Gamer', 'Periféricos'],
    imgs: [
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500',
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500'
    ]
  },
  'kit ferramentas': {
    descricoes: [
      'Kit de ferramentas completo com 100 peças para uso doméstico e profissional. Maleta organizadora em alumínio. Inclui chaves, alicates, martelo, fita métrica e muito mais.',
      'Caixa de ferramentas portátil em plástico resistente com 3 bandejas organizadoras. 56 peças essenciais para pequenos reparos. Ideal para levar no carro ou usar em casa.'
    ],
    especs: [
      'Peças: 100\nMaleta: Alumínio com organização\nConteúdo: Chaves, alicates, martelo, fita, etc\nMaterial: Aço Cromo-Vanádio\nGarantia: Vitalícia contra defeitos\nPeso: 4.5kg',
      'Peças: 56\nCaixa: Plástico resistente com 3 bandejas\nIndicação: Residencial/Automotivo\nMaterial: Aço Temperado\nPeso: 2.8kg'
    ],
    precos: [149.90, 99.90, 199.90],
    cats: ['ferramentas'],
    subs: ['Construção'],
    imgs: [
      'https://images.unsplash.com/photo-1581147036324-c1c2b5a5e363?w=500',
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500'
    ]
  }
};

// Palavras-chave para identificar produtos no texto
const KEYWORD_MAP: Record<string, string[]> = {
  camiseta: ['camiseta', 'camisa', 'blusa', 't-shirt', 'regata', 'shirt', 'camise'],
  bermuda: ['bermuda', 'short', 'shorts', 'bermudas', 'calção'],
  tenis: ['tênis', 'tenis', 'sapato', 'calçado', 'sneaker', 'sneakers'],
  fone: ['fone', 'headphone', 'headset', 'auricular', 'earphone', 'fones'],
  mochila: ['mochila', 'backpack', 'mochilas', 'bolsa'],
  relogio: ['relógio', 'relogio', 'watch', 'smartwatch', 'pulseira'],
  chocolate: ['chocolate', 'bombom', 'doce', 'cacau'],
  mouse: ['mouse', 'mice', 'mouses'],
  caneca: ['caneca', 'xícara', 'xicara', 'copo térmico'],
  cadeira: ['cadeira', 'assento', 'poltrona', 'cadeira gamer'],
  'kit ferramentas': ['kit ferramenta', 'ferramentas', 'caixa ferramenta', 'kit']
};

// Detecta similaridade aproximada entre palavras (até 1 caractere de diferença)
function similar(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let diff = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) diff++;
  }
  return diff <= 1;
}

function detectProductType(texto: string): { tipo: string; quantidade: number } | null {
  const lower = texto.toLowerCase();

  for (const [tipo, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const regex = new RegExp(`(\\d+)\\s*(?:x\\s*)?${kw}`, 'i');
        const match = lower.match(regex);
        const qtd = match ? parseInt(match[1]) : 1;
        return { tipo, quantidade: Math.min(qtd, 20) };
      }
    }
  }
  return null;
}

function parsePrompt(texto: string): { tipo: string; quantidade: number }[] {
  const resultados: { tipo: string; quantidade: number }[] = [];
  const detectados = new Set<string>();
  const lower = texto.toLowerCase();
  const palavras = lower.split(/\s+/);

  // Extrai o primeiro número do texto
  const primeiroNumero = (lower.match(/(\d+)/) || [])[1];
  const qtdGlobal = primeiroNumero ? Math.min(parseInt(primeiroNumero), 20) : 5;

  for (const [tipo, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      // Match exato ou com s
      const regexExato = new RegExp(`(\\d+)?\\s*(?:x\\s*)?${kw}s?`, 'i');
      const matchExato = lower.match(regexExato);
      if (matchExato) {
        const qtd = matchExato[1] ? Math.min(parseInt(matchExato[1]), 20) : qtdGlobal;
        if (!detectados.has(tipo)) {
          detectados.add(tipo);
          resultados.push({ tipo, quantidade: qtd });
        }
        break;
      }

      // Match aproximado (tolerância de 1 caractere)
      for (const palavra of palavras) {
        const palavraLimpa = palavra.replace(/[^a-zà-ú0-9]/g, '');
        if (palavraLimpa.length < 3) continue;
        if (similar(palavraLimpa, kw) || similar(palavraLimpa, kw + 's')) {
          // Encontrou a palavra aproximada, procura número antes dela
          const idx = palavras.indexOf(palavra);
          let qtd = qtdGlobal;
          if (idx > 0) {
            const numAnterior = parseInt(palavras[idx - 1].replace(/\D/g, ''));
            if (!isNaN(numAnterior)) qtd = Math.min(numAnterior, 20);
          }
          if (!detectados.has(tipo)) {
            detectados.add(tipo);
            resultados.push({ tipo, quantidade: qtd });
          }
          break;
        }
      }
      if (detectados.has(tipo)) break;
    }
  }

  return resultados.length > 0 ? resultados : [{ tipo: 'camiseta', quantidade: qtdGlobal }];
}

function generateProductsFromPrompt(produtosDetectados: { tipo: string; quantidade: number }[]): GeneratedProduct[] {
  const result: GeneratedProduct[] = [];

  for (const det of produtosDetectados) {
    const template = PRODUCT_TEMPLATES[det.tipo];
    if (!template) continue;

    for (let i = 0; i < det.quantidade; i++) {
      const varKey = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const cor = det.tipo === 'camiseta' || det.tipo === 'bermuda' || det.tipo === 'tenis' || det.tipo === 'mochila'
        ? coresAleatorias[i % coresAleatorias.length]
        : '';
      const descricao = template.descricoes[Math.floor(Math.random() * template.descricoes.length)];
      const especsBase = template.especs[Math.floor(Math.random() * template.especs.length)];
      const preco = template.precos[i % template.precos.length];

      const letra = varKey[i] || String.fromCharCode(65 + (i % 8));
      let nome = templateNome(det.tipo, i, letra);
      nome = nome.replace('{cor}', cor || '');

      const corEspec = cor ? `\nCor disponível: ${cor}` : '';
      const sub = template.subs[i % template.subs.length];
      const cat = template.cats[i % template.cats.length];

      // Cada variante recebe uma imagem diferente do pool
      const imgIdx = i % template.imgs.length;
      const imgPrincipal = template.imgs[imgIdx];

      // Galeria: frente, lado, costas/detalhe (outras imagens do pool)
      const galeria = template.imgs
        .filter((_, idx) => idx !== imgIdx)
        .slice(0, 3);
      
      console.log(`[produto ${i}] imgIdx: ${imgIdx}, imgPrincipal: ${imgPrincipal}, galeria: ${galeria}`)

      const variacaoTexto = gerarVariacao(det.tipo, cor);

      result.push({
        nome,
        descricao: descricao.replace('{cor}', cor || ''),
        especificacoes: especsBase + corEspec,
        preco: preco.toFixed(2),
        categoria: cat,
        subcategoria: sub,
        estoque: String(Math.floor(Math.random() * 150 + 20)),
        imagem_url: imgPrincipal,
        galeria,
        variacoes: variacaoTexto
      });
    }
  }

  return result;
}

function gerarVariacao(tipo: string, cor: string): string {
  switch (tipo) {
    case 'camiseta':
    case 'bermuda':
      return `Tamanhos: P, M, G, GG${cor ? ` | Cores: ${cor}` : ''}`;
    case 'tenis':
      return `Tamanhos: 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46${cor ? ` | Cores: ${cor}` : ''}`;
    case 'mochila':
      return cor ? `Cores disponíveis: ${cor}` : '';
    case 'relogio':
    case 'fone':
    case 'mouse':
      return '';
    case 'chocolate':
      return 'Embalagens: 180g, 240g, 500g';
    case 'caneca':
      return 'Capacidades: 300ml, 350ml, 400ml';
    case 'cadeira':
      return 'Opções: Com ou sem braço ajustável';
    default:
      return '';
  }
}

const coresAleatorias = ['Branco', 'Preto', 'Azul Marinho', 'Cinza', 'Vermelho', 'Verde Militar', 'Bege', 'Rosa', 'Laranja', 'Azul Claro'];

function templateNome(tipo: string, idx: number, varKey: string): string {
  switch (tipo) {
    case 'camiseta': return `Camiseta Algodão Premium {cor} ${varKey}`;
    case 'bermuda': return `Bermuda {cor} Confort ${varKey}`;
    case 'tenis': return `Tênis Esportivo {cor} ${varKey}`;
    case 'fone': return `Fone Bluetooth ${varKey} - Série ${idx + 1}`;
    case 'mochila': return `Mochila {cor} ${varKey}`;
    case 'relogio': return `Relógio ${varKey} - Edição ${idx + 1}`;
    case 'chocolate': return `Chocolate ${['70% Cacau', 'Ao Leite', 'Branco Premium', 'Meio Amargo'][idx % 4]} ${varKey}`;
    case 'mouse': return `Mouse ${['Gamer RGB', 'Ergonômico', 'Sem Fio', 'UltraLeve'][idx % 4]} ${varKey}`;
    case 'caneca': return `Caneca ${['Personalizada', 'Térmica', 'Porcelana', 'Cerâmica'][idx % 4]} ${varKey}`;
    case 'cadeira': return `Cadeira ${['Ergonômica Pro', 'Gamer Elite', 'Executiva', 'Presidente'][idx % 4]} ${varKey}`;
    default: return `Produto ${tipo} ${varKey}`;
  }
}

export default function BulkProductCreator({ supabase, lojas, onComplete }: Props) {
  const [step, setStep] = useState<'prompt' | 'preview'>('prompt');
  const [lojaId, setLojaId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [produtos, setProdutos] = useState<GeneratedProduct[]>([]);
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  function handleGenerate() {
    if (!prompt.trim()) { alert('Descreva os produtos que deseja criar.'); return; }
    setGenerating(true);

    setTimeout(() => {
      const detectados = parsePrompt(prompt);
      alert(`DEBUG parsePrompt:\nTexto: "${prompt}"\nDetectado: ${JSON.stringify(detectados)}`);
      const gerados = generateProductsFromPrompt(detectados);
      setProdutos(gerados);
      setGenerating(false);
      setStep('preview');
    }, 600);
  }

  async function handleCreateAll() {
    if (!lojaId) { alert('Selecione uma loja primeiro.'); return; }

    setCreating(true);
    setResults(null);
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < produtos.length; i++) {
      const p = produtos[i];
      try {
        const descricaoFinal = p.especificacoes
          ? `${p.descricao}\n\n--- ESPECIFICAÇÕES TÉCNICAS ---\n${p.especificacoes}`
          : p.descricao;

        const payload: any = {
          nome: p.nome,
          preco: parseFloat(p.preco),
          descricao: descricaoFinal,
          categoria: p.categoria,
          subcategoria: p.subcategoria || null,
          estoque: parseInt(p.estoque) || 0,
          imagem_url: p.imagem_url,
          galeria: p.galeria || [],
          variacoes: p.variacoes || [],
          loja_id: lojaId
        };

        const { error } = await supabase.from('produtos').insert([payload]);
        if (error) throw error;
        success++;
      } catch (err: any) {
        errors.push(`Produto ${i + 1} (${p.nome}): ${err.message}`);
      }
    }

    setResults({ success, errors });
    setCreating(false);
    if (onComplete) onComplete();
  }

  const lojaSelecionada = lojas.find(l => l.id === lojaId);

  const exemplos = [
    '5 camisetas de algodão',
    '3 bermudas jeans azul e 2 tênis esportivo',
    '2 fones bluetooth, 1 mochila, 3 canecas',
    '4 chocolates artesanais e 2 relógios digitais',
    '1 cadeira ergonômica, 2 mouses gamer, 3 camisetas'
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Criação Inteligente</h2>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">
            Descreva e nós criamos tudo automaticamente
          </p>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
          Loja de Destino
        </label>
        <div className="relative max-w-md">
          <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={lojaId}
            onChange={e => setLojaId(e.target.value)}
            className="w-full bg-slate-50 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold text-slate-800 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-shopee-orange/30 appearance-none cursor-pointer"
          >
            <option value="">Selecione uma loja...</option>
            {lojas.map(l => (
              <option key={l.id} value={l.id}>
                {l.nome} {l.categoria ? `(${l.categoria})` : ''}
              </option>
            ))}
          </select>
        </div>
        {lojaSelecionada && (
          <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
            <CheckCircle size={12} /> {lojaSelecionada.nome}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-shopee-orange rounded-2xl flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">O que você quer criar?</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Descreva os produtos que precisa
                </p>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ex: 5 camisetas de algodão branca e 3 bermudas jeans"
              rows={4}
              className="w-full bg-slate-50 px-6 py-5 rounded-[24px] text-sm font-bold text-slate-800 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none placeholder:text-slate-300"
            />

            <div className="flex items-center gap-3 mt-4 mb-6 flex-wrap">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Exemplos:</span>
              {exemplos.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="text-[9px] font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl hover:bg-purple-100 transition-all"
                >
                  "{ex}"
                </button>
              ))}
            </div>

            <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-[24px] mb-6">
              <p className="text-[10px] text-amber-700 font-bold flex items-start gap-2">
                <FileText size={14} className="shrink-0 mt-0.5" />
                O sistema gera automaticamente: nome, descrição detalhada, especificações técnicas, medidas, categoria, subcategoria, preço, estoque e foto de capa.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-shopee-orange text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
            >
              {generating ? (
                <><Loader2 size={18} className="animate-spin" /> Gerando Produtos...</>
              ) : (
                <><Sparkles size={18} /> Gerar Produtos Automaticamente</>
              )}
            </button>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Bar */}
            <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-2xl">
                  <Package size={16} className="text-purple-600" />
                  <span className="text-xs font-black text-purple-700">{produtos.length} produtos</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl">
                  <ShoppingBag size={16} className="text-blue-600" />
                  <span className="text-xs font-black text-blue-700">
                    Total: R$ {produtos.reduce((s, p) => s + parseFloat(p.preco), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-2xl">
                  <Tag size={16} className="text-green-600" />
                  <span className="text-xs font-black text-green-700">
                    {new Set(produtos.map(p => p.categoria)).size} categorias
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep('prompt'); setResults(null); }}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCreateAll}
                  disabled={creating || !lojaId}
                  className="px-6 py-2.5 bg-shopee-orange text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-shopee-orange/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {creating ? (
                    <><Loader2 size={14} className="animate-spin" /> Criando todos...</>
                  ) : (
                    <><Package size={14} /> Criar {produtos.length} Produtos</>
                  )}
                </button>
              </div>
            </div>

            {/* Product Cards */}
            {produtos.map((prod, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row"
              >
                <div className="w-full md:w-44 shrink-0 bg-slate-100 overflow-hidden flex flex-col">
                  <div className="h-28 overflow-hidden">
                    <img src={prod.imagem_url} alt={prod.nome} className="w-full h-full object-cover" />
                  </div>
                  {prod.galeria.length > 0 && (
                    <div className="flex-1 flex gap-0.5 p-0.5 bg-slate-100">
                      {prod.galeria.slice(0, 3).map((url, gi) => (
                        <div key={gi} className="flex-1 bg-slate-200 overflow-hidden">
                          <img src={url} alt={`${prod.nome} ângulo ${gi + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{prod.nome}</h4>
                      <p className="text-[18px] font-black text-shopee-orange mt-1">R$ {parseFloat(prod.preco).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 bg-purple-50 rounded-lg text-[8px] font-black text-purple-600 uppercase">{prod.categoria}</span>
                      <span className="px-2.5 py-1 bg-blue-50 rounded-lg text-[8px] font-black text-blue-600 uppercase">{prod.subcategoria}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2">{prod.descricao}</p>
                  <div className="flex items-center gap-4 text-[9px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1"><Package size={11} /> Estoque: {prod.estoque}</span>
                    <span className="flex items-center gap-1"><FileText size={11} /> Especificações</span>
                    <span className="flex items-center gap-1"><ImageIcon size={11} /> {1 + prod.galeria.length} fotos</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Bottom Create Button */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">
                Pronto para criar {produtos.length} produtos em <span className="text-shopee-orange">{lojaSelecionada?.nome || 'loja selecionada'}</span>
              </p>
              <div className="flex gap-3">
                {results && (
                  <button
                    onClick={() => { setStep('prompt'); setResults(null); setProdutos([]); }}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all"
                  >
                    Nova Criação
                  </button>
                )}
                <button
                  onClick={handleCreateAll}
                  disabled={creating || !lojaId}
                  className="px-10 py-4 bg-shopee-orange text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-shopee-orange/20 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {creating ? (
                    <><Loader2 size={16} className="animate-spin" /> Criando...</>
                  ) : (
                    <><ArrowRight size={16} /> Criar {produtos.length} Produtos Agora</>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            {results && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-[32px] p-6 shadow-sm border ${
                  results.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {results.errors.length === 0 ? (
                    <CheckCircle size={24} className="text-green-600" />
                  ) : (
                    <XCircle size={24} className="text-red-500" />
                  )}
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      {results.success} de {produtos.length} produtos criados com sucesso!
                    </h4>
                    {results.errors.length > 0 && (
                      <p className="text-[10px] text-red-500 font-bold">{results.errors.length} erro(s)</p>
                    )}
                  </div>
                </div>
                {results.errors.length > 0 && (
                  <ul className="space-y-1 mt-3">
                    {results.errors.map((err, i) => (
                      <li key={i} className="text-[10px] text-red-600 font-medium flex items-start gap-2">
                        <X size={10} className="mt-0.5 shrink-0" /> {err}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
