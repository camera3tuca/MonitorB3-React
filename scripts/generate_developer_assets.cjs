const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// 1. Ícone do desenvolvedor: 512x512, 24 bits não transparente, < 1 MB
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="bullGreen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="bearRed" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
  </defs>

  <!-- Fundo sólido não transparente -->
  <rect width="512" height="512" fill="url(#iconBg)"/>
  <rect width="496" height="496" x="8" y="8" rx="72" fill="none" stroke="#1e293b" stroke-width="4"/>

  <!-- Linhas de grade -->
  <line x1="60" y1="150" x2="452" y2="150" stroke="#1f293d" stroke-width="2" stroke-dasharray="6,6"/>
  <line x1="60" y1="250" x2="452" y2="250" stroke="#1f293d" stroke-width="2" stroke-dasharray="6,6"/>
  <line x1="60" y1="350" x2="452" y2="350" stroke="#1f293d" stroke-width="2" stroke-dasharray="6,6"/>

  <!-- Candlesticks -->
  <line x1="120" y1="180" x2="120" y2="320" stroke="#f43f5e" stroke-width="5"/>
  <rect x="104" y="205" width="32" height="80" rx="4" fill="url(#bearRed)"/>

  <line x1="190" y1="230" x2="190" y2="380" stroke="#f43f5e" stroke-width="5"/>
  <rect x="174" y="255" width="32" height="95" rx="4" fill="url(#bearRed)"/>

  <line x1="260" y1="270" x2="260" y2="410" stroke="#38bdf8" stroke-width="5"/>
  <rect x="244" y="285" width="32" height="45" rx="4" fill="#38bdf8"/>

  <line x1="330" y1="190" x2="330" y2="350" stroke="#10b981" stroke-width="5"/>
  <rect x="314" y="215" width="32" height="100" rx="4" fill="url(#bullGreen)"/>

  <line x1="400" y1="110" x2="400" y2="270" stroke="#10b981" stroke-width="5"/>
  <rect x="384" y="135" width="32" height="105" rx="4" fill="url(#bullGreen)"/>

  <!-- Curva e seta de alta -->
  <path d="M 100 250 Q 240 430 405 130" fill="none" stroke="url(#glow)" stroke-width="12" stroke-linecap="round"/>
  <polygon points="425,110 390,128 408,158" fill="#10b981"/>

  <!-- Badge ScienceBit -->
  <rect x="60" y="60" width="180" height="40" rx="8" fill="#2563eb"/>
  <text x="150" y="86" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="1.5">SCIENCEBIT</text>
</svg>`;

const resvgIcon = new Resvg(iconSvg, { fitTo: { mode: 'width', value: 512 } });
const pngIcon = resvgIcon.render().asPng();
fs.writeFileSync(path.join(__dirname, '../public/developer-icon.png'), pngIcon);

// 2. Imagem de cabeçalho: 4096 x 2304, 24 bits não transparente, < 1 MB
const headerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4096 2304" width="4096" height="2304">
  <defs>
    <linearGradient id="hBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080c14"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="hGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="40%" stop-color="#6366f1"/>
      <stop offset="70%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="bullGreen2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="bearRed2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
  </defs>

  <!-- Fundo sólido não transparente -->
  <rect width="4096" height="2304" fill="url(#hBg)"/>

  <!-- Grade de fundo -->
  <g opacity="0.12" stroke="#38bdf8" stroke-width="3">
    <line x1="0" y1="400" x2="4096" y2="400" stroke-dasharray="20,20"/>
    <line x1="0" y1="800" x2="4096" y2="800" stroke-dasharray="20,20"/>
    <line x1="0" y1="1200" x2="4096" y2="1200" stroke-dasharray="20,20"/>
    <line x1="0" y1="1600" x2="4096" y2="1600" stroke-dasharray="20,20"/>
    <line x1="0" y1="2000" x2="4096" y2="2000" stroke-dasharray="20,20"/>
    <line x1="800" y1="0" x2="800" y2="2304" stroke-dasharray="20,20"/>
    <line x1="1600" y1="0" x2="1600" y2="2304" stroke-dasharray="20,20"/>
    <line x1="2400" y1="0" x2="2400" y2="2304" stroke-dasharray="20,20"/>
    <line x1="3200" y1="0" x2="3200" y2="2304" stroke-dasharray="20,20"/>
  </g>

  <!-- Ondas e Curva de tendência -->
  <path d="M 0 1700 C 600 1900, 1200 1300, 1800 1500 C 2400 1700, 3000 900, 4096 600" fill="none" stroke="url(#hGlow)" stroke-width="18" stroke-linecap="round" opacity="0.75"/>
  <path d="M 0 1850 C 700 2050, 1300 1500, 1900 1680 C 2500 1850, 3100 1100, 4096 750" fill="none" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" opacity="0.35" stroke-dasharray="20,20"/>

  <!-- Cartão de destaque central -->
  <rect x="350" y="340" width="3396" height="1624" rx="64" fill="url(#cardBg)" stroke="#334155" stroke-width="8"/>

  <!-- Badge ScienceBit -->
  <rect x="520" y="500" width="540" height="120" rx="60" fill="#2563eb"/>
  <text x="790" y="578" fill="#ffffff" font-family="sans-serif" font-size="46" font-weight="bold" text-anchor="middle" letter-spacing="4">SCIENCEBIT</text>

  <!-- Título do Desenvolvedor -->
  <text x="520" y="820" fill="#ffffff" font-family="sans-serif" font-size="130" font-weight="900" letter-spacing="2">SCIENCEBIT LABS</text>
  
  <!-- Subtítulo -->
  <text x="520" y="970" fill="#38bdf8" font-family="sans-serif" font-size="62" font-weight="600">Modelagem Quantitativa &amp; Inteligência para a Bolsa de Valores</text>
  
  <!-- Descrição -->
  <text x="520" y="1120" fill="#cbd5e1" font-family="sans-serif" font-size="46" font-weight="normal">Aplicativos de alta performance para investidores e traders de Swing Trade.</text>
  <text x="520" y="1200" fill="#94a3b8" font-family="sans-serif" font-size="46" font-weight="normal">Rastreamento em tempo real da B3, IFR2, médias móveis e scanners quantitativos.</text>

  <!-- Tags de rodapé -->
  <g transform="translate(520, 1420)">
    <rect width="520" height="110" rx="28" fill="#0f172a" stroke="#38bdf8" stroke-width="5"/>
    <text x="260" y="70" fill="#38bdf8" font-family="sans-serif" font-size="38" font-weight="bold" text-anchor="middle">📊 MONITOR B3</text>

    <rect x="570" width="520" height="110" rx="28" fill="#0f172a" stroke="#10b981" stroke-width="5"/>
    <text x="830" y="70" fill="#10b981" font-family="sans-serif" font-size="38" font-weight="bold" text-anchor="middle">📈 SWING TRADE</text>

    <rect x="1140" width="620" height="110" rx="28" fill="#0f172a" stroke="#818cf8" stroke-width="5"/>
    <text x="1450" y="70" fill="#a5b4fc" font-family="sans-serif" font-size="38" font-weight="bold" text-anchor="middle">🌐 SCIENCEBIT.COM.BR</text>
  </g>

  <!-- Ilustração de Candlesticks à direita -->
  <g transform="translate(2520, 560)">
    <!-- Candle 1 -->
    <line x1="150" y1="100" x2="150" y2="700" stroke="#f43f5e" stroke-width="12"/>
    <rect x="105" y="200" width="90" height="340" rx="10" fill="url(#bearRed2)"/>

    <!-- Candle 2 -->
    <line x1="370" y1="240" x2="370" y2="920" stroke="#f43f5e" stroke-width="12"/>
    <rect x="325" y="380" width="90" height="380" rx="10" fill="url(#bearRed2)"/>

    <!-- Candle 3 (Hammer) -->
    <line x1="590" y1="360" x2="590" y2="980" stroke="#38bdf8" stroke-width="12"/>
    <rect x="545" y="420" width="90" height="160" rx="10" fill="#38bdf8"/>

    <!-- Candle 4 (Bullish) -->
    <line x1="810" y1="180" x2="810" y2="820" stroke="#10b981" stroke-width="12"/>
    <rect x="765" y="240" width="90" height="420" rx="10" fill="url(#bullGreen2)"/>

    <!-- Candle 5 (Surge) -->
    <line x1="1030" y1="30" x2="1030" y2="650" stroke="#10b981" stroke-width="12"/>
    <rect x="985" y="80" width="90" height="460" rx="10" fill="url(#bullGreen2)"/>

    <!-- Curva de Reversão -->
    <path d="M 100 380 Q 520 1020 1020 100" fill="none" stroke="url(#hGlow)" stroke-width="26" stroke-linecap="round"/>
    <polygon points="1070,60 990,95 1035,165" fill="#10b981"/>
  </g>
</svg>`;

const resvgHeader = new Resvg(headerSvg, { fitTo: { mode: 'width', value: 4096 } });
const pngHeader = resvgHeader.render().asPng();
fs.writeFileSync(path.join(__dirname, '../public/developer-header.png'), pngHeader);

console.log('✅ Developer Icon gerado com sucesso! Tamanho:', pngIcon.length, 'bytes');
console.log('✅ Developer Header gerado com sucesso! Tamanho:', pngHeader.length, 'bytes');
