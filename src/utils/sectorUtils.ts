export interface SectorStyle {
  label: string;
  badgeClass: string;
  dotColor: string;
  pillHoverClass: string;
  bgSolid: string;
  iconName?: string;
}

export const KNOWN_TICKER_SECTORS: Record<string, string> = {
  // Petróleo, Gás e Biocombustíveis
  PETR4: 'Petróleo & Gás',
  PETR3: 'Petróleo & Gás',
  PRIO3: 'Petróleo & Gás',
  RECV3: 'Petróleo & Gás',
  RRRP3: 'Petróleo & Gás',
  BRAV3: 'Petróleo & Gás',
  ENAT3: 'Petróleo & Gás',
  UGPA3: 'Petróleo & Gás',
  CSAN3: 'Petróleo & Gás',
  VBBR3: 'Petróleo & Gás',
  OPCT3: 'Petróleo & Gás',

  // Mineração, Siderurgia e Papel/Celulose
  VALE3: 'Mineração & Materiais',
  AURA33: 'Mineração & Materiais',
  BHPG34: 'Mineração & Materiais',
  RIOT34: 'Mineração & Materiais',
  GGBR4: 'Mineração & Materiais',
  GGBR3: 'Mineração & Materiais',
  CSNA3: 'Mineração & Materiais',
  USIM5: 'Mineração & Materiais',
  GOAU4: 'Mineração & Materiais',
  CBAV3: 'Mineração & Materiais',
  SUZB3: 'Mineração & Materiais',
  KLBN11: 'Mineração & Materiais',
  KLBN4: 'Mineração & Materiais',
  FESA4: 'Mineração & Materiais',
  RANI3: 'Mineração & Materiais',
  DXCO3: 'Mineração & Materiais',

  // Financeiro e Bancos
  ITUB4: 'Financeiro & Bancos',
  ITUB3: 'Financeiro & Bancos',
  BBDC4: 'Financeiro & Bancos',
  BBDC3: 'Financeiro & Bancos',
  BBAS3: 'Financeiro & Bancos',
  SANB11: 'Financeiro & Bancos',
  BPAC11: 'Financeiro & Bancos',
  B3SA3: 'Financeiro & Bancos',
  BBSE3: 'Financeiro & Bancos',
  CXSE3: 'Financeiro & Bancos',
  PSSA3: 'Financeiro & Bancos',
  CIEL3: 'Financeiro & Bancos',
  BRSR6: 'Financeiro & Bancos',
  ITSA4: 'Financeiro & Bancos',
  ABCB4: 'Financeiro & Bancos',

  // Tecnologia e Inovação
  TOTS3: 'Tecnologia',
  LWSA3: 'Tecnologia',
  POSI3: 'Tecnologia',
  INTB3: 'Tecnologia',
  MLAS3: 'Tecnologia',
  BMOB3: 'Tecnologia',
  CASH3: 'Tecnologia',
  AAPL34: 'Tecnologia',
  NVDC34: 'Tecnologia',
  MSFT34: 'Tecnologia',
  GOGL34: 'Tecnologia',
  AMZO34: 'Tecnologia',
  M1TA34: 'Tecnologia',
  TSLA34: 'Tecnologia',
  NFLX34: 'Tecnologia',
  AVGO34: 'Tecnologia',
  ORCL34: 'Tecnologia',
  AMD34: 'Tecnologia',
  INTC34: 'Tecnologia',
  QCOM34: 'Tecnologia',
  CRMV34: 'Tecnologia',
  ADBE34: 'Tecnologia',
  CSCO34: 'Tecnologia',
  PYPL34: 'Tecnologia',

  // Consumo, Varejo e Alimentos
  MGLU3: 'Consumo & Varejo',
  BHIA3: 'Consumo & Varejo',
  VIIA3: 'Consumo & Varejo',
  LREN3: 'Consumo & Varejo',
  ARZZ3: 'Consumo & Varejo',
  SOMA3: 'Consumo & Varejo',
  ALPA4: 'Consumo & Varejo',
  GUAR3: 'Consumo & Varejo',
  CRFB3: 'Consumo & Varejo',
  ASAI3: 'Consumo & Varejo',
  ABEV3: 'Consumo & Varejo',
  JBSS3: 'Consumo & Varejo',
  BRFS3: 'Consumo & Varejo',
  MRFG3: 'Consumo & Varejo',
  BEEF3: 'Consumo & Varejo',
  MDIA3: 'Consumo & Varejo',
  SMTO3: 'Consumo & Varejo',
  SLCE3: 'Consumo & Varejo',
  CAML3: 'Consumo & Varejo',
  AGRO3: 'Consumo & Varejo',
  AMER3: 'Consumo & Varejo',
  CEAB3: 'Consumo & Varejo',
  SBFG3: 'Consumo & Varejo',
  PETZ3: 'Consumo & Varejo',
  WMTB34: 'Consumo & Varejo',
  COCA34: 'Consumo & Varejo',
  PEPB34: 'Consumo & Varejo',
  MCDO34: 'Consumo & Varejo',
  PGCO34: 'Consumo & Varejo',
  NKEG34: 'Consumo & Varejo',

  // Energia Elétrica e Saneamento
  ELET3: 'Energia & Saneamento',
  ELET6: 'Energia & Saneamento',
  CPFE3: 'Energia & Saneamento',
  EGIE3: 'Energia & Saneamento',
  CMIG4: 'Energia & Saneamento',
  EQTL3: 'Energia & Saneamento',
  TAEE11: 'Energia & Saneamento',
  TRPL4: 'Energia & Saneamento',
  ENGI11: 'Energia & Saneamento',
  NEOE3: 'Energia & Saneamento',
  SBSP3: 'Energia & Saneamento',
  SAPR11: 'Energia & Saneamento',
  SAPR4: 'Energia & Saneamento',
  CSMG3: 'Energia & Saneamento',
  ALUP11: 'Energia & Saneamento',
  CPLE6: 'Energia & Saneamento',
  ENBR3: 'Energia & Saneamento',
  AESB3: 'Energia & Saneamento',

  // Saúde e Diagnósticos
  RDOR3: 'Saúde',
  HAPV3: 'Saúde',
  FLRY3: 'Saúde',
  RADL3: 'Saúde',
  ONCO3: 'Saúde',
  QUAL3: 'Saúde',
  VIVA3: 'Saúde',
  PNVL3: 'Saúde',
  MATD3: 'Saúde',
  PFIZ34: 'Saúde',
  JNJB34: 'Saúde',
  LLYB34: 'Saúde',
  ABTT34: 'Saúde',

  // Construção Civil e Imobiliário
  CYRE3: 'Construção & Imobiliário',
  EZTC3: 'Construção & Imobiliário',
  MRVE3: 'Construção & Imobiliário',
  DIRR3: 'Construção & Imobiliário',
  TEND3: 'Construção & Imobiliário',
  CURY3: 'Construção & Imobiliário',
  PLPL3: 'Construção & Imobiliário',
  MULT3: 'Construção & Imobiliário',
  IGTI11: 'Construção & Imobiliário',
  ALOS3: 'Construção & Imobiliário',
  EVEN3: 'Construção & Imobiliário',
  JHSF3: 'Construção & Imobiliário',
  TRIS3: 'Construção & Imobiliário',
  LOGG3: 'Construção & Imobiliário',

  // Transporte, Logística e Bens de Capital
  RENT3: 'Transporte & Indústria',
  MOVI3: 'Transporte & Indústria',
  VAMO3: 'Transporte & Indústria',
  CCRO3: 'Transporte & Indústria',
  ECOR3: 'Transporte & Indústria',
  RAIL3: 'Transporte & Indústria',
  AZUL4: 'Transporte & Indústria',
  GOLL4: 'Transporte & Indústria',
  EMBR3: 'Transporte & Indústria',
  STBP3: 'Transporte & Indústria',
  HBSA3: 'Transporte & Indústria',
  WEGE3: 'Transporte & Indústria',
  G2EV34: 'Transporte & Indústria',
  GEOO34: 'Transporte & Indústria',
  BOEI34: 'Transporte & Indústria',
  CATP34: 'Transporte & Indústria',
  DEEC34: 'Transporte & Indústria',
  TUPY3: 'Transporte & Indústria',
  SHUL4: 'Transporte & Indústria',
  POMO4: 'Transporte & Indústria',
  TGMA3: 'Transporte & Indústria',
  KEPL3: 'Transporte & Indústria',
  RAPT4: 'Transporte & Indústria',

  // Telecomunicações e Mídia
  VIVT3: 'Telecom & Mídia',
  TIMS3: 'Telecom & Mídia',
  FIWE3: 'Telecom & Mídia',
  DISN34: 'Telecom & Mídia',
  WBDC34: 'Telecom & Mídia',

  // Educação
  COGN3: 'Educação',
  YDUQ3: 'Educação',
  ANIM3: 'Educação',
  SEER3: 'Educação',

  // ETFs e Cripto
  BOVA11: 'ETFs & Índices',
  BOVV11: 'ETFs & Índices',
  SMAL11: 'ETFs & Índices',
  IVVB11: 'ETFs & Índices',
  SPXI11: 'ETFs & Índices',
  HASH11: 'ETFs & Índices',
  GOLD11: 'ETFs & Índices',
  BRAX11: 'ETFs & Índices',
  PIBB11: 'ETFs & Índices',
  NASD11: 'ETFs & Índices',
  WRLD11: 'ETFs & Índices',
  ACWI11: 'ETFs & Índices',
  XINA11: 'ETFs & Índices',
  DNAI11: 'ETFs & Índices',
  BBSD11: 'ETFs & Índices',
  DIVO11: 'ETFs & Índices',

  // FIIs
  HGLG11: 'Fundos Imobiliários',
  KNRI11: 'Fundos Imobiliários',
  XPLG11: 'Fundos Imobiliários',
  MXRF11: 'Fundos Imobiliários',
  HGRU11: 'Fundos Imobiliários',
  XPML11: 'Fundos Imobiliários',
  BTLG11: 'Fundos Imobiliários',
  VISC11: 'Fundos Imobiliários',
};

export const SECTOR_STYLES: Record<string, SectorStyle> = {
  'Financeiro & Bancos': {
    label: 'Financeiro & Bancos',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dotColor: 'bg-emerald-400',
    pillHoverClass: 'hover:bg-emerald-500/30 hover:border-emerald-500/60',
    bgSolid: 'bg-emerald-600',
  },
  'Petróleo & Gás': {
    label: 'Petróleo & Gás',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dotColor: 'bg-amber-400',
    pillHoverClass: 'hover:bg-amber-500/30 hover:border-amber-500/60',
    bgSolid: 'bg-amber-600',
  },
  'Mineração & Materiais': {
    label: 'Mineração & Materiais',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    dotColor: 'bg-orange-400',
    pillHoverClass: 'hover:bg-orange-500/30 hover:border-orange-500/60',
    bgSolid: 'bg-orange-600',
  },
  'Tecnologia': {
    label: 'Tecnologia',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    dotColor: 'bg-indigo-400',
    pillHoverClass: 'hover:bg-indigo-500/30 hover:border-indigo-500/60',
    bgSolid: 'bg-indigo-600',
  },
  'Consumo & Varejo': {
    label: 'Consumo & Varejo',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    dotColor: 'bg-rose-400',
    pillHoverClass: 'hover:bg-rose-500/30 hover:border-rose-500/60',
    bgSolid: 'bg-rose-600',
  },
  'Energia & Saneamento': {
    label: 'Energia & Saneamento',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    dotColor: 'bg-yellow-400',
    pillHoverClass: 'hover:bg-yellow-500/30 hover:border-yellow-500/60',
    bgSolid: 'bg-yellow-600',
  },
  'Saúde': {
    label: 'Saúde',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    dotColor: 'bg-teal-400',
    pillHoverClass: 'hover:bg-teal-500/30 hover:border-teal-500/60',
    bgSolid: 'bg-teal-600',
  },
  'Construção & Imobiliário': {
    label: 'Construção & Imobiliário',
    badgeClass: 'bg-stone-500/25 text-stone-300 border-stone-500/40',
    dotColor: 'bg-stone-400',
    pillHoverClass: 'hover:bg-stone-500/35 hover:border-stone-500/60',
    bgSolid: 'bg-stone-600',
  },
  'Transporte & Indústria': {
    label: 'Transporte & Indústria',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    dotColor: 'bg-sky-400',
    pillHoverClass: 'hover:bg-sky-500/30 hover:border-sky-500/60',
    bgSolid: 'bg-sky-600',
  },
  'Telecom & Mídia': {
    label: 'Telecom & Mídia',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    dotColor: 'bg-purple-400',
    pillHoverClass: 'hover:bg-purple-500/30 hover:border-purple-500/60',
    bgSolid: 'bg-purple-600',
  },
  'Educação': {
    label: 'Educação',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    dotColor: 'bg-pink-400',
    pillHoverClass: 'hover:bg-pink-500/30 hover:border-pink-500/60',
    bgSolid: 'bg-pink-600',
  },
  'ETFs & Índices': {
    label: 'ETFs & Índices',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    dotColor: 'bg-blue-400',
    pillHoverClass: 'hover:bg-blue-500/30 hover:border-blue-500/60',
    bgSolid: 'bg-blue-600',
  },
  'Fundos Imobiliários': {
    label: 'Fundos Imobiliários',
    badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    dotColor: 'bg-lime-400',
    pillHoverClass: 'hover:bg-lime-500/30 hover:border-lime-500/60',
    bgSolid: 'bg-lime-600',
  },
  'Outros': {
    label: 'Outros',
    badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600/50',
    dotColor: 'bg-slate-400',
    pillHoverClass: 'hover:bg-slate-700 hover:border-slate-500',
    bgSolid: 'bg-slate-600',
  },
};

export function resolveSector(
  ticker: string,
  rawSector?: string,
  classe?: string,
  rawIndustry?: string,
  description?: string
): string {
  const cleanTicker = (ticker || '').toUpperCase().trim();
  if (KNOWN_TICKER_SECTORS[cleanTicker]) {
    return KNOWN_TICKER_SECTORS[cleanTicker];
  }

  const s = String(rawSector || '').toLowerCase();
  const ind = String(rawIndustry || '').toLowerCase();
  const desc = String(description || '').toLowerCase();

  // 1. Tickers ending in 39 or description/industry with ETF/Trusts
  if (
    classe === 'ETF' ||
    cleanTicker.endsWith('39') ||
    desc.includes('etf') ||
    desc.includes('trust') ||
    ind.includes('investment trusts') ||
    ind.includes('mutual funds')
  ) {
    return 'ETFs & Índices';
  }

  if (
    classe === 'FII' ||
    (cleanTicker.endsWith('11') && (desc.includes('fii') || desc.includes('fundo imob') || ind.includes('real estate investment trust')))
  ) {
    return 'Fundos Imobiliários';
  }

  // 2. Health & Pharmaceuticals (MUST BE BEFORE TECH to prevent Health Technology being hijacked)
  if (
    s.includes('health') ||
    ind.includes('pharma') ||
    ind.includes('biotech') ||
    ind.includes('medical') ||
    ind.includes('hospital') ||
    ind.includes('drug')
  ) {
    return 'Saúde';
  }

  // 3. Oil, Gas & Energy Minerals (Check Energy Minerals BEFORE general minerals, ignore non-energy)
  if (
    s === 'energy minerals' ||
    (s.includes('energy') && !s.includes('non-energy')) ||
    s.includes('oil') ||
    s.includes('petro') ||
    s.includes('gas') ||
    ind.includes('integrated oil') ||
    ind.includes('oil & gas') ||
    ind.includes('oilfield') ||
    ind.includes('refining')
  ) {
    return 'Petróleo & Gás';
  }

  // 4. Mining, Metals & Materials (Non-energy minerals, metals, steel, chemicals, paper & pulp)
  if (
    s.includes('non-energy') ||
    s.includes('basic material') ||
    (s.includes('mineral') && !s.includes('energy minerals')) ||
    ind.includes('steel') ||
    ind.includes('metal') ||
    ind.includes('mining') ||
    ind.includes('gold') ||
    ind.includes('copper') ||
    ind.includes('iron') ||
    ind.includes('chemical') ||
    ind.includes('forest product') ||
    ind.includes('aluminum') ||
    ind.includes('pulp')
  ) {
    return 'Mineração & Materiais';
  }

  // 5. Utilities (Electric, Water, Sanitation, Gas utilities)
  if (
    s.includes('utilit') ||
    ind.includes('electric utilities') ||
    ind.includes('water utilities') ||
    ind.includes('gas distributors') ||
    ind.includes('alternative power')
  ) {
    return 'Energia & Saneamento';
  }

  // 6. Real Estate & Construction
  if (
    s.includes('real estate') ||
    ind.includes('real estate') ||
    ind.includes('homebuilding') ||
    ind.includes('building products') ||
    ind.includes('reit') ||
    ind.includes('construction materials')
  ) {
    return 'Construção & Imobiliário';
  }

  // 7. Finance & Banks
  if (
    s.includes('finance') ||
    ind.includes('bank') ||
    ind.includes('insurance') ||
    ind.includes('financial') ||
    ind.includes('securities') ||
    ind.includes('broker')
  ) {
    return 'Financeiro & Bancos';
  }

  // 8. Consumer & Retail
  if (
    s.includes('retail') ||
    s.includes('consumer') ||
    ind.includes('food') ||
    ind.includes('beverage') ||
    ind.includes('apparel') ||
    ind.includes('footwear') ||
    ind.includes('hotel') ||
    ind.includes('restaurant') ||
    ind.includes('personal care') ||
    ind.includes('supermarket') ||
    ind.includes('household') ||
    ind.includes('e-commerce')
  ) {
    return 'Consumo & Varejo';
  }

  // 9. Transportation, Industrial & Capital Goods
  if (
    s.includes('transport') ||
    s.includes('producer manufacturing') ||
    s.includes('industrial') ||
    ind.includes('aerospace') ||
    ind.includes('defense') ||
    ind.includes('airline') ||
    ind.includes('air freight') ||
    ind.includes('trucking') ||
    ind.includes('marine shipping') ||
    ind.includes('electrical products') ||
    ind.includes('auto parts') ||
    ind.includes('industrial machinery') ||
    ind.includes('railroad')
  ) {
    return 'Transporte & Indústria';
  }

  // 10. Technology
  if (
    s.includes('tech') ||
    ind.includes('software') ||
    ind.includes('semiconductor') ||
    ind.includes('data processing') ||
    ind.includes('internet software') ||
    ind.includes('cloud')
  ) {
    return 'Tecnologia';
  }

  // 11. Telecom & Media
  if (
    s.includes('communication') ||
    s.includes('telecom') ||
    ind.includes('telecommunications') ||
    ind.includes('wireless') ||
    ind.includes('cable') ||
    ind.includes('broadcasting') ||
    ind.includes('media')
  ) {
    return 'Telecom & Mídia';
  }

  // 12. Education
  if (s.includes('education') || ind.includes('educational') || ind.includes('school')) {
    return 'Educação';
  }

  return 'Outros';
}

export function getSectorStyle(sector: string): SectorStyle {
  return SECTOR_STYLES[sector] || SECTOR_STYLES['Outros'];
}
