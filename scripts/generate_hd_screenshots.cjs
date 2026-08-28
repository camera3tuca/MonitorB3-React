const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// Helper to render high quality SVG to PNG
function generateScreenshot(svgContent, filename) {
  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: 1080 },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'sans-serif'
    }
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(path.join(__dirname, '../public/' + filename), png);
  console.log(`✅ Gerado ${filename} (${png.length} bytes)`);
}

// ----------------------------------------------------
// 1. SCREENSHOT 1: SCANNER EM TEMPO REAL (B3 Oportunidades)
// ----------------------------------------------------
const screenshot1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811"/>
      <stop offset="40%" stop-color="#0a101d"/>
      <stop offset="100%" stop-color="#04060b"/>
    </linearGradient>
    <linearGradient id="phoneFrame" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="1080" height="1920" fill="url(#bg1)"/>
  
  <!-- Subtle Ambient Glow Orbs -->
  <circle cx="200" cy="180" r="280" fill="#1d4ed8" opacity="0.15" filter="blur(80px)"/>
  <circle cx="880" cy="1200" r="320" fill="#059669" opacity="0.1" filter="blur(90px)"/>

  <!-- Top Marketing Banner Text -->
  <g transform="translate(70, 70)">
    <!-- Category Pill -->
    <rect width="260" height="48" rx="24" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
    <text x="130" y="31" fill="#60a5fa" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="2">SCANNER QUANT B3</text>

    <!-- Main Title -->
    <text x="0" y="115" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="900" letter-spacing="-1">Rastreamento de Sobrevenda</text>
    
    <!-- Subtitle -->
    <text x="0" y="165" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500">Encontre reversões lucrativas de Swing Trade em tempo real</text>
  </g>

  <!-- Realistic Smartphone Mockup Outer Container -->
  <g transform="translate(60, 260)">
    <!-- Phone Body -->
    <rect width="960" height="1610" rx="48" fill="#090d16" stroke="#334155" stroke-width="6"/>
    <rect width="948" height="1598" x="6" y="6" rx="44" fill="#020617"/>

    <!-- Android Status Bar -->
    <g transform="translate(30, 20)">
      <text x="15" y="24" fill="#94a3b8" font-family="sans-serif" font-size="18" font-weight="600">10:45</text>
      <!-- Battery & Wifi Icons -->
      <g transform="translate(830, 8)">
        <path d="M 0 16 A 16 16 0 0 1 24 16 L 12 24 Z" fill="#94a3b8"/>
        <rect x="35" y="4" width="24" height="14" rx="3" fill="none" stroke="#94a3b8" stroke-width="2"/>
        <rect x="38" y="7" width="14" height="8" fill="#94a3b8"/>
        <rect x="60" y="8" width="2" height="6" fill="#94a3b8"/>
      </g>
    </g>

    <!-- App Header Inside Phone -->
    <g transform="translate(24, 60)">
      <rect width="900" height="80" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <!-- App Logo Icon -->
      <rect x="18" y="15" width="50" height="50" rx="14" fill="#2563eb"/>
      <text x="43" y="47" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle">B3</text>
      
      <text x="82" y="38" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">Monitor B3: Swing Trade</text>
      <text x="82" y="58" fill="#64748b" font-family="sans-serif" font-size="15">ScienceBit Quantitative Lab</text>

      <!-- Live Status Pill -->
      <g transform="translate(680, 20)">
        <rect width="195" height="40" rx="20" fill="#022c22" stroke="#059669" stroke-width="1.5"/>
        <circle cx="22" cy="20" r="6" fill="#10b981"/>
        <text x="110" y="26" fill="#34d399" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">PREGÃO ABERTO</text>
      </g>
    </g>

    <!-- Filter Buttons Row -->
    <g transform="translate(24, 155)">
      <!-- Class Badges -->
      <rect width="125" height="46" rx="12" fill="#2563eb"/>
      <text x="62" y="29" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">✓ Ações</text>

      <rect x="135" width="115" height="46" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="192" y="29" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">✓ BDRs</text>

      <rect x="260" width="115" height="46" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="317" y="29" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">✓ ETFs</text>

      <!-- Indicator Filters -->
      <rect x="390" width="160" height="46" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="470" y="29" fill="#38bdf8" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">IFR2 &lt; 25</text>

      <rect x="560" width="170" height="46" rx="12" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
      <text x="645" y="29" fill="#34d399" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">Acima MMA200</text>

      <!-- Refresh button -->
      <rect x="740" width="160" height="46" rx="12" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="820" y="29" fill="#cbd5e1" font-family="sans-serif" font-size="15" font-weight="600" text-anchor="middle">🔄 Scan (42)</text>
    </g>

    <!-- Top Ranked Opportunity Hero Card: PETR4 -->
    <g transform="translate(24, 220)">
      <rect width="900" height="260" rx="24" fill="#0d1527" stroke="#3b82f6" stroke-width="2.5"/>
      
      <!-- Top line in card -->
      <g transform="translate(25, 25)">
        <rect width="110" height="42" rx="10" fill="#2563eb"/>
        <text x="55" y="27" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="900" text-anchor="middle">PETR4</text>

        <text x="125" y="28" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">Petróleo Brasileiro S.A.</text>
        <rect x="420" width="110" height="30" rx="8" fill="#1e293b"/>
        <text x="475" y="20" fill="#94a3b8" font-family="sans-serif" font-size="13" text-anchor="middle" font-weight="600">PETRÓLEO</text>

        <!-- Score Badge -->
        <rect x="680" width="170" height="45" rx="12" fill="#022c22" stroke="#059669" stroke-width="2"/>
        <text x="765" y="28" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="900" text-anchor="middle">SCORE 96/100</text>
      </g>

      <!-- Price & Variation -->
      <g transform="translate(25, 85)">
        <text x="0" y="45" fill="#ffffff" font-family="sans-serif" font-size="44" font-weight="900">R$ 38,42</text>
        <rect x="220" y="12" width="110" height="38" rx="10" fill="#064e3b"/>
        <text x="275" y="37" fill="#34d399" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">+2,35%</text>

        <text x="350" y="38" fill="#64748b" font-family="sans-serif" font-size="16">Vol: R$ 1,42 Bi (Forte)</text>
      </g>

      <!-- Indicator Grid in Card -->
      <g transform="translate(25, 155)">
        <!-- Pill 1: IFR2 -->
        <rect width="205" height="75" rx="14" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
        <text x="20" y="30" fill="#94a3b8" font-family="sans-serif" font-size="13">IFR (2 Períodos)</text>
        <text x="20" y="60" fill="#fb7185" font-family="sans-serif" font-size="24" font-weight="900">11.85</text>
        <text x="110" y="60" fill="#f43f5e" font-family="sans-serif" font-size="13" font-weight="bold">SOBREV.</text>

        <!-- Pill 2: Distância MMA21 -->
        <rect x="220" width="205" height="75" rx="14" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="240" y="30" fill="#94a3b8" font-family="sans-serif" font-size="13">Alvo MMA21</text>
        <text x="240" y="60" fill="#38bdf8" font-family="sans-serif" font-size="24" font-weight="900">R$ 39,90</text>
        <text x="375" y="60" fill="#10b981" font-family="sans-serif" font-size="14" font-weight="bold">+3,8%</text>

        <!-- Pill 3: Setup -->
        <rect x="440" width="205" height="75" rx="14" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
        <text x="460" y="30" fill="#94a3b8" font-family="sans-serif" font-size="13">Setup Técnico</text>
        <text x="460" y="60" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="bold">Larry Williams 9.1</text>

        <!-- Pill 4: Probabilidade -->
        <rect x="660" width="200" height="75" rx="14" fill="#022c22" stroke="#059669" stroke-width="1.5"/>
        <text x="680" y="30" fill="#86efac" font-family="sans-serif" font-size="13">Probab. Repique</text>
        <text x="680" y="60" fill="#4ade80" font-family="sans-serif" font-size="24" font-weight="900">89.4%</text>
      </g>
    </g>

    <!-- Card 2: VALE3 -->
    <g transform="translate(24, 500)">
      <rect width="900" height="190" rx="20" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>
      <g transform="translate(25, 20)">
        <rect width="105" height="38" rx="8" fill="#334155"/>
        <text x="52" y="25" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">VALE3</text>
        <text x="120" y="26" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">Vale S.A. ON</text>
        <rect x="300" width="140" height="28" rx="6" fill="#1e293b"/>
        <text x="370" y="19" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle" font-weight="600">MINERAÇÃO</text>

        <rect x="710" width="145" height="36" rx="10" fill="#022c22" stroke="#059669" stroke-width="1"/>
        <text x="782" y="24" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="middle">SCORE 91</text>
      </g>

      <g transform="translate(25, 75)">
        <text x="0" y="35" fill="#ffffff" font-family="sans-serif" font-size="34" font-weight="bold">R$ 59,80</text>
        <text x="170" y="32" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="bold">+1,80%</text>
      </g>

      <g transform="translate(25, 125)">
        <rect width="195" height="45" rx="8" fill="#1e293b"/>
        <text x="15" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">IFR2: <tspan fill="#f43f5e" font-weight="bold">16.4</tspan></text>

        <rect x="210" width="220" height="45" rx="8" fill="#1e293b"/>
        <text x="225" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">Alvo MMA21: <tspan fill="#38bdf8" font-weight="bold">R$ 62,50</tspan></text>

        <rect x="445" width="230" height="45" rx="8" fill="#1e293b"/>
        <text x="460" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">Fechou Fora Bollinger</text>

        <rect x="690" width="165" height="45" rx="8" fill="#022c22"/>
        <text x="705" y="28" fill="#34d399" font-family="sans-serif" font-size="13" font-weight="bold">Acerto: 84.1%</text>
      </g>
    </g>

    <!-- Card 3: WEGE3 -->
    <g transform="translate(24, 710)">
      <rect width="900" height="190" rx="20" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>
      <g transform="translate(25, 20)">
        <rect width="105" height="38" rx="8" fill="#334155"/>
        <text x="52" y="25" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">WEGE3</text>
        <text x="120" y="26" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">WEG S.A. ON</text>
        <rect x="300" width="160" height="28" rx="6" fill="#1e293b"/>
        <text x="380" y="19" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle" font-weight="600">BENS INDUSTRIAIS</text>

        <rect x="710" width="145" height="36" rx="10" fill="#022c22" stroke="#059669" stroke-width="1"/>
        <text x="782" y="24" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="middle">SCORE 88</text>
      </g>

      <g transform="translate(25, 75)">
        <text x="0" y="35" fill="#ffffff" font-family="sans-serif" font-size="34" font-weight="bold">R$ 52,10</text>
        <text x="170" y="32" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="bold">+0,95%</text>
      </g>

      <g transform="translate(25, 125)">
        <rect width="195" height="45" rx="8" fill="#1e293b"/>
        <text x="15" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">IFR2: <tspan fill="#f43f5e" font-weight="bold">19.2</tspan></text>

        <rect x="210" width="220" height="45" rx="8" fill="#1e293b"/>
        <text x="225" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">Alvo MMA21: <tspan fill="#38bdf8" font-weight="bold">R$ 54,80</tspan></text>

        <rect x="445" width="230" height="45" rx="8" fill="#1e293b"/>
        <text x="460" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">Tendência Primária Alta</text>

        <rect x="690" width="165" height="45" rx="8" fill="#022c22"/>
        <text x="705" y="28" fill="#34d399" font-family="sans-serif" font-size="13" font-weight="bold">Acerto: 81.6%</text>
      </g>
    </g>

    <!-- Card 4: BBAS3 -->
    <g transform="translate(24, 920)">
      <rect width="900" height="190" rx="20" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>
      <g transform="translate(25, 20)">
        <rect width="105" height="38" rx="8" fill="#334155"/>
        <text x="52" y="25" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">BBAS3</text>
        <text x="120" y="26" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">Banco do Brasil ON</text>
        <rect x="320" width="130" height="28" rx="6" fill="#1e293b"/>
        <text x="385" y="19" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle" font-weight="600">FINANCEIRO</text>

        <rect x="710" width="145" height="36" rx="10" fill="#022c22" stroke="#059669" stroke-width="1"/>
        <text x="782" y="24" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="middle">SCORE 85</text>
      </g>

      <g transform="translate(25, 75)">
        <text x="0" y="35" fill="#ffffff" font-family="sans-serif" font-size="34" font-weight="bold">R$ 27,30</text>
        <text x="170" y="32" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="bold">+1,10%</text>
      </g>

      <g transform="translate(25, 125)">
        <rect width="195" height="45" rx="8" fill="#1e293b"/>
        <text x="15" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">IFR2: <tspan fill="#f43f5e" font-weight="bold">18.7</tspan></text>

        <rect x="210" width="220" height="45" rx="8" fill="#1e293b"/>
        <text x="225" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">Alvo MMA21: <tspan fill="#38bdf8" font-weight="bold">R$ 28,60</tspan></text>

        <rect x="445" width="230" height="45" rx="8" fill="#1e293b"/>
        <text x="460" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">Suporte Fibonacci 61.8%</text>

        <rect x="690" width="165" height="45" rx="8" fill="#022c22"/>
        <text x="705" y="28" fill="#34d399" font-family="sans-serif" font-size="13" font-weight="bold">Acerto: 79.5%</text>
      </g>
    </g>

    <!-- Card 5: BOVA11 -->
    <g transform="translate(24, 1130)">
      <rect width="900" height="190" rx="20" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>
      <g transform="translate(25, 20)">
        <rect width="115" height="38" rx="8" fill="#334155"/>
        <text x="57" y="25" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">BOVA11</text>
        <text x="130" y="26" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">iShares Ibovespa ETF</text>
        <rect x="350" width="100" height="28" rx="6" fill="#1e293b"/>
        <text x="400" y="19" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle" font-weight="600">ETF ÍNDICE</text>

        <rect x="710" width="145" height="36" rx="10" fill="#022c22" stroke="#059669" stroke-width="1"/>
        <text x="782" y="24" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="middle">SCORE 82</text>
      </g>

      <g transform="translate(25, 75)">
        <text x="0" y="35" fill="#ffffff" font-family="sans-serif" font-size="34" font-weight="bold">R$ 126,50</text>
        <text x="180" y="32" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="bold">+0,75%</text>
      </g>

      <g transform="translate(25, 125)">
        <rect width="195" height="45" rx="8" fill="#1e293b"/>
        <text x="15" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">IFR2: <tspan fill="#f43f5e" font-weight="bold">21.0</tspan></text>

        <rect x="210" width="220" height="45" rx="8" fill="#1e293b"/>
        <text x="225" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">Alvo MMA21: <tspan fill="#38bdf8" font-weight="bold">R$ 130,20</tspan></text>

        <rect x="445" width="230" height="45" rx="8" fill="#1e293b"/>
        <text x="460" y="28" fill="#94a3b8" font-family="sans-serif" font-size="13">MMA200 Ascendente</text>

        <rect x="690" width="165" height="45" rx="8" fill="#022c22"/>
        <text x="705" y="28" fill="#34d399" font-family="sans-serif" font-size="13" font-weight="bold">Acerto: 76.8%</text>
      </g>
    </g>

    <!-- Bottom Navigation Bar inside Phone -->
    <g transform="translate(0, 1500)">
      <rect width="960" height="100" rx="30" fill="#0b1120" stroke="#1e293b" stroke-width="2"/>
      <g transform="translate(100, 25)">
        <circle cx="20" cy="20" r="16" fill="#2563eb"/>
        <text x="20" y="55" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Scanner</text>
      </g>
      <g transform="translate(340, 25)">
        <rect x="5" y="5" width="30" height="30" rx="6" fill="#1e293b"/>
        <text x="20" y="55" fill="#64748b" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle">Gráficos</text>
      </g>
      <g transform="translate(580, 25)">
        <rect x="5" y="5" width="30" height="30" rx="6" fill="#1e293b"/>
        <text x="20" y="55" fill="#64748b" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle">IA &amp; Modelos</text>
      </g>
      <g transform="translate(800, 25)">
        <rect x="5" y="5" width="30" height="30" rx="6" fill="#1e293b"/>
        <text x="20" y="55" fill="#64748b" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle">Backtests</text>
      </g>
    </g>
  </g>
</svg>`;

generateScreenshot(screenshot1, 'screenshot-1-scanner.png');

// ----------------------------------------------------
// 2. SCREENSHOT 2: GRÁFICO TÉCNICO INTERATIVO (Candles & Indicadores)
// ----------------------------------------------------
const screenshot2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811"/>
      <stop offset="40%" stop-color="#091322"/>
      <stop offset="100%" stop-color="#04060b"/>
    </linearGradient>
    <linearGradient id="bGreen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="bRed" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <linearGradient id="chartGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#bg2)"/>
  
  <circle cx="200" cy="180" r="280" fill="#38bdf8" opacity="0.12" filter="blur(80px)"/>
  <circle cx="880" cy="1100" r="320" fill="#2563eb" opacity="0.15" filter="blur(90px)"/>

  <!-- Top Marketing Banner Text -->
  <g transform="translate(70, 70)">
    <rect width="280" height="48" rx="24" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="140" y="31" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="2">GRÁFICO PROFISSIONAL</text>

    <text x="0" y="115" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="900" letter-spacing="-1">Candlesticks &amp; Indicadores</text>
    <text x="0" y="165" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500">MMA9, MMA21, MMA200, Bollinger e Níveis de Fibonacci</text>
  </g>

  <!-- Smartphone Mockup -->
  <g transform="translate(60, 260)">
    <rect width="960" height="1610" rx="48" fill="#090d16" stroke="#334155" stroke-width="6"/>
    <rect width="948" height="1598" x="6" y="6" rx="44" fill="#020617"/>

    <!-- Android Status Bar -->
    <g transform="translate(30, 20)">
      <text x="15" y="24" fill="#94a3b8" font-family="sans-serif" font-size="18" font-weight="600">10:45</text>
      <g transform="translate(830, 8)">
        <path d="M 0 16 A 16 16 0 0 1 24 16 L 12 24 Z" fill="#94a3b8"/>
        <rect x="35" y="4" width="24" height="14" rx="3" fill="none" stroke="#94a3b8" stroke-width="2"/>
        <rect x="38" y="7" width="14" height="8" fill="#94a3b8"/>
        <rect x="60" y="8" width="2" height="6" fill="#94a3b8"/>
      </g>
    </g>

    <!-- Header inside phone -->
    <g transform="translate(24, 60)">
      <rect width="900" height="100" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      
      <rect x="20" y="20" width="120" height="60" rx="14" fill="#2563eb"/>
      <text x="80" y="57" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="900" text-anchor="middle">PETR4</text>

      <text x="160" y="45" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="bold">R$ 38,42</text>
      <text x="310" y="45" fill="#34d399" font-family="sans-serif" font-size="22" font-weight="bold">+2,35%</text>
      <text x="160" y="75" fill="#94a3b8" font-family="sans-serif" font-size="16">Petrobras PN • IFR2: <tspan fill="#f43f5e" font-weight="bold">11.85 (Sobrevendido)</tspan></text>

      <!-- Timeframe Buttons -->
      <g transform="translate(620, 25)">
        <rect width="60" height="48" rx="10" fill="#1e293b"/>
        <text x="30" y="30" fill="#94a3b8" font-family="sans-serif" font-size="16" text-anchor="middle">60m</text>

        <rect x="70" width="60" height="48" rx="10" fill="#2563eb"/>
        <text x="100" y="30" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">1D</text>

        <rect x="140" width="60" height="48" rx="10" fill="#1e293b"/>
        <text x="170" y="30" fill="#94a3b8" font-family="sans-serif" font-size="16" text-anchor="middle">1S</text>
      </g>
    </g>

    <!-- Main Candlestick Chart Area -->
    <g transform="translate(24, 180)">
      <rect width="900" height="740" rx="24" fill="#080d1a" stroke="#1e293b" stroke-width="2"/>

      <!-- Indicator Legend on top of chart -->
      <g transform="translate(25, 25)">
        <circle cx="10" cy="10" r="5" fill="#38bdf8"/>
        <text x="25" y="15" fill="#94a3b8" font-family="sans-serif" font-size="14">MMA9: <tspan fill="#38bdf8">38,10</tspan></text>

        <circle cx="140" cy="10" r="5" fill="#eab308"/>
        <text x="155" y="15" fill="#94a3b8" font-family="sans-serif" font-size="14">MMA21: <tspan fill="#eab308">39,90</tspan></text>

        <circle cx="280" cy="10" r="5" fill="#a855f7"/>
        <text x="295" y="15" fill="#94a3b8" font-family="sans-serif" font-size="14">MMA200: <tspan fill="#a855f7">35,40</tspan></text>

        <circle cx="430" cy="10" r="5" fill="#06b6d4"/>
        <text x="445" y="15" fill="#94a3b8" font-family="sans-serif" font-size="14">Bollinger (20,2)</text>
      </g>

      <!-- Chart Grid Lines -->
      <g stroke="#1e293b" stroke-width="1.5" stroke-dasharray="4,4">
        <line x1="40" y1="80" x2="860" y2="80"/>
        <line x1="40" y1="180" x2="860" y2="180"/>
        <line x1="40" y1="280" x2="860" y2="280"/>
        <line x1="40" y1="380" x2="860" y2="380"/>
        <line x1="40" y1="480" x2="860" y2="480"/>
        <line x1="40" y1="580" x2="860" y2="580"/>
        
        <line x1="200" y1="60" x2="200" y2="600"/>
        <line x1="400" y1="60" x2="400" y2="600"/>
        <line x1="600" y1="60" x2="600" y2="600"/>
        <line x1="800" y1="60" x2="800" y2="600"/>
      </g>

      <!-- Bollinger Bands Fill & Lines -->
      <!-- Upper band -->
      <path d="M 60 140 Q 250 110 450 160 T 850 210" fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>
      <!-- Lower band -->
      <path d="M 60 490 Q 250 440 450 510 T 850 530" fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>
      <!-- Shading between bands -->
      <path d="M 60 140 Q 250 110 450 160 T 850 210 L 850 530 Q 650 510 450 510 T 60 490 Z" fill="#06b6d4" opacity="0.04"/>

      <!-- MMA200 Curve (Long-term Bullish Trend) -->
      <path d="M 60 560 Q 300 520 550 480 T 850 430" fill="none" stroke="#a855f7" stroke-width="3"/>

      <!-- MMA21 Curve -->
      <path d="M 60 320 Q 250 280 450 330 T 850 380" fill="none" stroke="#eab308" stroke-width="3"/>

      <!-- MMA9 Curve -->
      <path d="M 60 290 Q 250 240 450 340 T 850 440" fill="none" stroke="#38bdf8" stroke-width="2.5"/>

      <!-- Real Candlesticks Drawing -->
      <!-- 1 -->
      <line x1="90" y1="210" x2="90" y2="350" stroke="#10b981" stroke-width="3"/>
      <rect x="74" y="240" width="32" height="80" rx="3" fill="url(#bGreen)"/>

      <!-- 2 -->
      <line x1="150" y1="190" x2="150" y2="330" stroke="#10b981" stroke-width="3"/>
      <rect x="134" y="210" width="32" height="90" rx="3" fill="url(#bGreen)"/>

      <!-- 3 Top Bearish -->
      <line x1="210" y1="160" x2="210" y2="310" stroke="#f43f5e" stroke-width="3"/>
      <rect x="194" y="190" width="32" height="85" rx="3" fill="url(#bRed)"/>

      <!-- 4 Bearish -->
      <line x1="270" y1="220" x2="270" y2="380" stroke="#f43f5e" stroke-width="3"/>
      <rect x="254" y="250" width="32" height="95" rx="3" fill="url(#bRed)"/>

      <!-- 5 Rebound Bullish -->
      <line x1="330" y1="240" x2="330" y2="370" stroke="#10b981" stroke-width="3"/>
      <rect x="314" y="260" width="32" height="80" rx="3" fill="url(#bGreen)"/>

      <!-- 6 Bearish Pullback -->
      <line x1="390" y1="270" x2="390" y2="440" stroke="#f43f5e" stroke-width="3"/>
      <rect x="374" y="300" width="32" height="110" rx="3" fill="url(#bRed)"/>

      <!-- 7 Bearish Drop to Bollinger Lower Band -->
      <line x1="450" y1="360" x2="450" y2="520" stroke="#f43f5e" stroke-width="3"/>
      <rect x="434" y="390" width="32" height="100" rx="3" fill="url(#bRed)"/>

      <!-- 8 Deep Oversold Candle (Touching Lower Band) -->
      <line x1="510" y1="410" x2="510" y2="540" stroke="#f43f5e" stroke-width="3"/>
      <rect x="494" y="440" width="32" height="75" rx="3" fill="url(#bRed)"/>

      <!-- 9 Hammer / Reversal Pin Bar (BUY SIGNAL GENERATION) -->
      <line x1="570" y1="430" x2="570" y2="560" stroke="#38bdf8" stroke-width="4"/>
      <rect x="554" y="440" width="32" height="35" rx="3" fill="#38bdf8"/>

      <!-- 10 Strong Green Candle Rebound -->
      <line x1="630" y1="380" x2="630" y2="500" stroke="#10b981" stroke-width="3"/>
      <rect x="614" y="400" width="32" height="80" rx="3" fill="url(#bGreen)"/>

      <!-- 11 Strong Green Candle Current -->
      <line x1="690" y1="320" x2="690" y2="460" stroke="#10b981" stroke-width="3"/>
      <rect x="674" y="340" width="32" height="90" rx="3" fill="url(#bGreen)"/>

      <!-- 12 Future Projected Trajectory (Dashed) -->
      <line x1="750" y1="260" x2="750" y2="400" stroke="#34d399" stroke-width="3" stroke-dasharray="4,4"/>
      <rect x="734" y="280" width="32" height="90" rx="3" fill="none" stroke="#34d399" stroke-width="2"/>

      <!-- Buy Signal Annotation Box on Candle 9 -->
      <g transform="translate(480, 580)">
        <polygon points="90,0 80,15 100,15" fill="#10b981"/>
        <rect width="180" height="42" rx="10" fill="#022c22" stroke="#10b981" stroke-width="2"/>
        <text x="90" y="27" fill="#6ee7b7" font-family="sans-serif" font-size="14" font-weight="900" text-anchor="middle">🎯 ENTRADA SWING</text>
      </g>

      <!-- Target Projected Line (MMA21) -->
      <line x1="570" y1="330" x2="850" y2="330" stroke="#10b981" stroke-width="2" stroke-dasharray="6,4"/>
      <rect x="720" y="305" width="130" height="28" rx="6" fill="#064e3b"/>
      <text x="785" y="324" fill="#34d399" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">ALVO: R$ 39,90</text>

      <!-- Bottom Volume Histogram Sub-chart -->
      <g transform="translate(40, 610)">
        <rect width="820" height="100" rx="12" fill="#0b1120"/>
        <text x="15" y="20" fill="#64748b" font-family="sans-serif" font-size="12">Volume Financeiro (R$ 1,42 Bi)</text>
        
        <!-- Volume Bars -->
        <rect x="40" y="45" width="22" height="45" fill="#059669"/>
        <rect x="100" y="35" width="22" height="55" fill="#059669"/>
        <rect x="160" y="50" width="22" height="40" fill="#e11d48"/>
        <rect x="220" y="30" width="22" height="60" fill="#e11d48"/>
        <rect x="280" y="55" width="22" height="35" fill="#059669"/>
        <rect x="340" y="25" width="22" height="65" fill="#e11d48"/>
        <rect x="400" y="20" width="22" height="70" fill="#e11d48"/>
        <rect x="460" y="15" width="22" height="75" fill="#e11d48"/>
        <rect x="520" y="10" width="22" height="80" fill="#38bdf8"/>
        <rect x="580" y="12" width="22" height="78" fill="#059669"/>
        <rect x="640" y="8" width="22" height="82" fill="#059669"/>
      </g>
    </g>

    <!-- Technical Analysis Deep Dive Cards -->
    <g transform="translate(24, 940)">
      <!-- Tab Selection Bar -->
      <rect width="900" height="60" rx="16" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
      <rect x="5" y="5" width="170" height="50" rx="12" fill="#2563eb"/>
      <text x="90" y="36" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Fibonacci &amp; Alvos</text>

      <text x="265" y="36" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">Triple Screen</text>
      <text x="445" y="36" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">Minervini 8-Check</text>
      <text x="635" y="36" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">Fluxo Institucional</text>
      <text x="815" y="36" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle">Backtest 5 Anos</text>

      <!-- Fibonacci Levels Card -->
      <g transform="translate(0, 80)">
        <rect width="900" height="280" rx="20" fill="#0d1527" stroke="#3b82f6" stroke-width="2"/>
        
        <g transform="translate(25, 25)">
          <text x="0" y="20" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">Projeções de Fibonacci (Pivot de Alta)</text>
          
          <!-- Levels -->
          <g transform="translate(0, 50)">
            <rect width="850" height="40" rx="8" fill="#1e293b"/>
            <text x="20" y="25" fill="#38bdf8" font-family="sans-serif" font-size="15" font-weight="bold">Alvo 3 (161.8% Fibo):</text>
            <text x="300" y="25" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">R$ 42,15</text>
            <text x="750" y="25" fill="#34d399" font-family="sans-serif" font-size="15" font-weight="bold">+9,71%</text>

            <rect y="50" width="850" height="40" rx="8" fill="#022c22" stroke="#059669" stroke-width="1.5"/>
            <text x="20" y="75" fill="#6ee7b7" font-family="sans-serif" font-size="15" font-weight="bold">Alvo Principal (100% Retorno à Média):</text>
            <text x="380" y="75" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">R$ 39,90</text>
            <text x="750" y="75" fill="#34d399" font-family="sans-serif" font-size="15" font-weight="bold">+3,85%</text>

            <rect y="100" width="850" height="40" rx="8" fill="#1e293b"/>
            <text x="20" y="125" fill="#94a3b8" font-family="sans-serif" font-size="15" font-weight="bold">Suporte Fibo (61.8% Retração):</text>
            <text x="300" y="125" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">R$ 37,80</text>
            <text x="750" y="125" fill="#94a3b8" font-family="sans-serif" font-size="15">-1,61%</text>

            <rect y="150" width="850" height="40" rx="8" fill="#450a0a" stroke="#dc2626" stroke-width="1"/>
            <text x="20" y="175" fill="#fca5a5" font-family="sans-serif" font-size="15" font-weight="bold">Stop Loss Recomendado (Abaixo Mínima):</text>
            <text x="380" y="175" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">R$ 37,10</text>
            <text x="750" y="175" fill="#f87171" font-family="sans-serif" font-size="15" font-weight="bold">-3,43%</text>
          </g>
        </g>
      </g>

      <!-- Model Stats Pill -->
      <g transform="translate(0, 380)">
        <rect width="900" height="150" rx="20" fill="#022c22" stroke="#059669" stroke-width="2"/>
        <g transform="translate(25, 30)">
          <text x="0" y="25" fill="#34d399" font-family="sans-serif" font-size="22" font-weight="900">Relação Risco / Retorno: 1 : 2.82</text>
          <text x="0" y="65" fill="#cbd5e1" font-family="sans-serif" font-size="16">Taxa de assertividade histórica no setup IFR2 para PETR4: <tspan fill="#4ade80" font-weight="bold">88.2% de trades vencedores</tspan></text>
          <text x="0" y="95" fill="#94a3b8" font-family="sans-serif" font-size="15">Tempo médio na operação de Swing: 4.2 pregões úteis.</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;

generateScreenshot(screenshot2, 'screenshot-2-indicadores.png');

// ----------------------------------------------------
// 3. SCREENSHOT 3: INTELIGÊNCIA ARTIFICIAL & MACHINE LEARNING
// ----------------------------------------------------
const screenshot3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811"/>
      <stop offset="40%" stop-color="#0a1224"/>
      <stop offset="100%" stop-color="#04060b"/>
    </linearGradient>
    <linearGradient id="aiGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#bg3)"/>
  
  <circle cx="200" cy="180" r="280" fill="#6366f1" opacity="0.15" filter="blur(80px)"/>
  <circle cx="880" cy="1100" r="320" fill="#ec4899" opacity="0.12" filter="blur(90px)"/>

  <!-- Top Banner -->
  <g transform="translate(70, 70)">
    <rect width="270" height="48" rx="24" fill="#1e293b" stroke="#818cf8" stroke-width="2"/>
    <text x="135" y="31" fill="#a5b4fc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="2">IA &amp; MODELOS QUANT</text>

    <text x="0" y="115" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="900" letter-spacing="-1">Machine Learning &amp; Agente RL</text>
    <text x="0" y="165" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500">Predição probabilística e aprendizado por reforço para a B3</text>
  </g>

  <!-- Smartphone Mockup -->
  <g transform="translate(60, 260)">
    <rect width="960" height="1610" rx="48" fill="#090d16" stroke="#334155" stroke-width="6"/>
    <rect width="948" height="1598" x="6" y="6" rx="44" fill="#020617"/>

    <!-- Android Status Bar -->
    <g transform="translate(30, 20)">
      <text x="15" y="24" fill="#94a3b8" font-family="sans-serif" font-size="18" font-weight="600">10:45</text>
      <g transform="translate(830, 8)">
        <path d="M 0 16 A 16 16 0 0 1 24 16 L 12 24 Z" fill="#94a3b8"/>
        <rect x="35" y="4" width="24" height="14" rx="3" fill="none" stroke="#94a3b8" stroke-width="2"/>
        <rect x="38" y="7" width="14" height="8" fill="#94a3b8"/>
        <rect x="60" y="8" width="2" height="6" fill="#94a3b8"/>
      </g>
    </g>

    <!-- Header inside phone -->
    <g transform="translate(24, 60)">
      <rect width="900" height="90" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <rect x="20" y="18" width="110" height="54" rx="12" fill="#4f46e5"/>
      <text x="75" y="52" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="900" text-anchor="middle">PETR4</text>

      <text x="150" y="42" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">Modelagem de Inteligência Artificial</text>
      <text x="150" y="68" fill="#38bdf8" font-family="sans-serif" font-size="16">Ensemble Random Forest + Q-Learning Trader Agent</text>
    </g>

    <!-- Machine Learning Main Card -->
    <g transform="translate(24, 170)">
      <rect width="900" height="420" rx="24" fill="#0d1527" stroke="#6366f1" stroke-width="2.5"/>
      
      <g transform="translate(30, 30)">
        <rect width="210" height="40" rx="10" fill="#312e81"/>
        <text x="105" y="26" fill="#a5b4fc" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">🤖 MODELO ML ENSEMBLE</text>

        <text x="0" y="95" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="900">Sinal: COMPRA FORTE (ALTA)</text>
        <text x="0" y="130" fill="#94a3b8" font-family="sans-serif" font-size="18">Probabilidade de ganho em 5 pregões:</text>
        
        <!-- Big Progress Bar -->
        <g transform="translate(0, 150)">
          <rect width="840" height="36" rx="18" fill="#1e293b"/>
          <rect width="730" height="36" rx="18" fill="url(#aiGlow)"/>
          <text x="420" y="25" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="900" text-anchor="middle">87.4% DE CONFIANÇA ESTATÍSTICA</text>
        </g>

        <!-- Feature Importances Grid -->
        <g transform="translate(0, 210)">
          <text x="0" y="25" fill="#cbd5e1" font-family="sans-serif" font-size="18" font-weight="bold">Variáveis com Maior Peso no Sinal:</text>
          
          <rect y="40" width="265" height="100" rx="14" fill="#1e293b"/>
          <text x="20" y="70" fill="#94a3b8" font-family="sans-serif" font-size="14">IFR2 Sobrevenda</text>
          <text x="20" y="105" fill="#38bdf8" font-family="sans-serif" font-size="22" font-weight="bold">Peso 38.2%</text>

          <rect x="285" y="40" width="265" height="100" rx="14" fill="#1e293b"/>
          <text x="305" y="70" fill="#94a3b8" font-family="sans-serif" font-size="14">Distância MMA21</text>
          <text x="305" y="105" fill="#10b981" font-family="sans-serif" font-size="22" font-weight="bold">Peso 29.5%</text>

          <rect x="570" y="40" width="270" height="100" rx="14" fill="#1e293b"/>
          <text x="590" y="70" fill="#94a3b8" font-family="sans-serif" font-size="14">Volume &gt; Média</text>
          <text x="590" y="105" fill="#f43f5e" font-family="sans-serif" font-size="22" font-weight="bold">Peso 18.7%</text>
        </g>
      </g>
    </g>

    <!-- Reinforcement Learning Agent Card -->
    <g transform="translate(24, 610)">
      <rect width="900" height="380" rx="24" fill="#022c22" stroke="#059669" stroke-width="2.5"/>
      
      <g transform="translate(30, 30)">
        <rect width="250" height="40" rx="10" fill="#064e3b"/>
        <text x="125" y="26" fill="#6ee7b7" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">🧠 AGENTE RL (Q-LEARNING)</text>

        <text x="0" y="95" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="900">Decisão Ótima do Agente: EXECUTAR COMPRA</text>
        <text x="0" y="130" fill="#cbd5e1" font-family="sans-serif" font-size="18">Recompensa Esperada (Sharpe Ratio Projetado): <tspan fill="#34d399" font-weight="bold">+2.45</tspan></text>

        <!-- Decision Metrics Grid -->
        <g transform="translate(0, 160)">
          <rect width="405" height="140" rx="16" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
          <text x="25" y="40" fill="#94a3b8" font-family="sans-serif" font-size="16">Preço de Entrada Sugerido</text>
          <text x="25" y="80" fill="#38bdf8" font-family="sans-serif" font-size="32" font-weight="900">R$ 38,42</text>
          <text x="25" y="115" fill="#10b981" font-family="sans-serif" font-size="15">A mercado / Fechamento</text>

          <rect x="435" width="405" height="140" rx="16" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
          <text x="460" y="40" fill="#94a3b8" font-family="sans-serif" font-size="16">Alvo de Saída Ótimo</text>
          <text x="460" y="80" fill="#34d399" font-family="sans-serif" font-size="32" font-weight="900">R$ 39,90</text>
          <text x="460" y="115" fill="#34d399" font-family="sans-serif" font-size="15">Retorno esperado: +3.85%</text>
        </g>
      </g>
    </g>

    <!-- Flow & Institutional Volume Panel -->
    <g transform="translate(24, 1010)">
      <rect width="900" height="280" rx="24" fill="#0b1120" stroke="#1e293b" stroke-width="2"/>
      
      <g transform="translate(30, 30)">
        <text x="0" y="25" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">📊 Análise de Fluxo Institucional (Big Players)</text>
        
        <g transform="translate(0, 55)">
          <rect width="840" height="60" rx="12" fill="#1e293b"/>
          <text x="25" y="38" fill="#cbd5e1" font-family="sans-serif" font-size="16">Saldo de Agressão Compradora:</text>
          <text x="680" y="38" fill="#34d399" font-family="sans-serif" font-size="20" font-weight="900">+ R$ 428 Milhões</text>

          <rect y="75" width="840" height="60" rx="12" fill="#1e293b"/>
          <text x="25" y="113" fill="#cbd5e1" font-family="sans-serif" font-size="16">Investidores Estrangeiros (Gringos):</text>
          <text x="680" y="113" fill="#38bdf8" font-family="sans-serif" font-size="20" font-weight="900">Compradores Líquidos</text>
        </g>
      </g>
    </g>

    <!-- Sentiment NLP News Card -->
    <g transform="translate(24, 1310)">
      <rect width="900" height="180" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
      <g transform="translate(30, 25)">
        <text x="0" y="25" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">📰 Sentimento das Notícias (IA NLP)</text>
        <text x="0" y="65" fill="#34d399" font-family="sans-serif" font-size="24" font-weight="bold">Sentimento Positivo (+0.74)</text>
        <text x="0" y="105" fill="#94a3b8" font-family="sans-serif" font-size="15">Petrobras bate recorde de refino e mantém política de dividendos atrativa.</text>
      </g>
    </g>
  </g>
</svg>`;

generateScreenshot(screenshot3, 'screenshot-3-ia-modelos.png');

// ----------------------------------------------------
// 4. SCREENSHOT 4: TRIPLE SCREEN & MINERVINI CHECKLIST
// ----------------------------------------------------
const screenshot4 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811"/>
      <stop offset="40%" stop-color="#0c1322"/>
      <stop offset="100%" stop-color="#04060b"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#bg4)"/>
  
  <circle cx="200" cy="180" r="280" fill="#059669" opacity="0.15" filter="blur(80px)"/>
  <circle cx="880" cy="1100" r="320" fill="#3b82f6" opacity="0.12" filter="blur(90px)"/>

  <!-- Top Banner -->
  <g transform="translate(70, 70)">
    <rect width="280" height="48" rx="24" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
    <text x="140" y="31" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="2">MÉTODOS CONSAGRADOS</text>

    <text x="0" y="115" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="900" letter-spacing="-1">Triple Screen &amp; Minervini</text>
    <text x="0" y="165" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500">Validação multi-timeframe de Alexander Elder e Mark Minervini</text>
  </g>

  <!-- Smartphone Mockup -->
  <g transform="translate(60, 260)">
    <rect width="960" height="1610" rx="48" fill="#090d16" stroke="#334155" stroke-width="6"/>
    <rect width="948" height="1598" x="6" y="6" rx="44" fill="#020617"/>

    <!-- Android Status Bar -->
    <g transform="translate(30, 20)">
      <text x="15" y="24" fill="#94a3b8" font-family="sans-serif" font-size="18" font-weight="600">10:45</text>
      <g transform="translate(830, 8)">
        <path d="M 0 16 A 16 16 0 0 1 24 16 L 12 24 Z" fill="#94a3b8"/>
        <rect x="35" y="4" width="24" height="14" rx="3" fill="none" stroke="#94a3b8" stroke-width="2"/>
        <rect x="38" y="7" width="14" height="8" fill="#94a3b8"/>
        <rect x="60" y="8" width="2" height="6" fill="#94a3b8"/>
      </g>
    </g>

    <!-- Header inside phone -->
    <g transform="translate(24, 60)">
      <rect width="900" height="90" rx="20" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <rect x="20" y="18" width="110" height="54" rx="12" fill="#2563eb"/>
      <text x="75" y="52" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="900" text-anchor="middle">VALE3</text>

      <text x="150" y="42" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">Auditoria de Tendência &amp; Filtros</text>
      <text x="150" y="68" fill="#34d399" font-family="sans-serif" font-size="16">Alexander Elder Triple Screen + 8 Regras Minervini</text>
    </g>

    <!-- Triple Screen Panel -->
    <g transform="translate(24, 170)">
      <rect width="900" height="420" rx="24" fill="#0d1527" stroke="#3b82f6" stroke-width="2.5"/>
      
      <g transform="translate(30, 30)">
        <text x="0" y="25" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="900">🛡️ TRIPLE SCREEN DE ALEXANDER ELDER</text>
        <text x="0" y="60" fill="#94a3b8" font-family="sans-serif" font-size="17">Avaliação independente em 3 telas temporais:</text>

        <!-- Screen 1: Maré (Semanal) -->
        <g transform="translate(0, 80)">
          <rect width="840" height="75" rx="14" fill="#022c22" stroke="#059669" stroke-width="2"/>
          <text x="25" y="32" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="bold">TELA 1: A Maré (Semanal - MACD / EMA13)</text>
          <text x="25" y="58" fill="#cbd5e1" font-family="sans-serif" font-size="15">Tendência de alta confirmada no gráfico semanal.</text>
          <text x="730" y="46" fill="#34d399" font-family="sans-serif" font-size="20" font-weight="900">✓ APROVADO</text>
        </g>

        <!-- Screen 2: Onda (Diário) -->
        <g transform="translate(0, 170)">
          <rect width="840" height="75" rx="14" fill="#022c22" stroke="#059669" stroke-width="2"/>
          <text x="25" y="32" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="bold">TELA 2: A Onda (Diário - IFR2 &lt; 20 Sobrevenda)</text>
          <text x="25" y="58" fill="#cbd5e1" font-family="sans-serif" font-size="15">Correção contra a maré identificada (Ponto de entrada).</text>
          <text x="730" y="46" fill="#34d399" font-family="sans-serif" font-size="20" font-weight="900">✓ APROVADO</text>
        </g>

        <!-- Screen 3: Ponto de Entrada (Intraday) -->
        <g transform="translate(0, 260)">
          <rect width="840" height="75" rx="14" fill="#022c22" stroke="#059669" stroke-width="2"/>
          <text x="25" y="32" fill="#34d399" font-family="sans-serif" font-size="18" font-weight="bold">TELA 3: O Gatilho (Rompimento de Mínima/Máxima)</text>
          <text x="25" y="58" fill="#cbd5e1" font-family="sans-serif" font-size="15">Superação da máxima do candle anterior ativada.</text>
          <text x="730" y="46" fill="#34d399" font-family="sans-serif" font-size="20" font-weight="900">✓ APROVADO</text>
        </g>
      </g>
    </g>

    <!-- Minervini 8-Point Trend Template -->
    <g transform="translate(24, 610)">
      <rect width="900" height="540" rx="24" fill="#0b1120" stroke="#10b981" stroke-width="2.5"/>
      
      <g transform="translate(30, 30)">
        <text x="0" y="25" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="900">⭐ MARK MINERVINI TREND TEMPLATE (8/8)</text>
        <text x="0" y="60" fill="#94a3b8" font-family="sans-serif" font-size="17">Critérios rigorosos de super-ações em tendência:</text>

        <!-- Checklist Grid -->
        <g transform="translate(0, 80)">
          <!-- Item 1 -->
          <rect width="840" height="42" rx="8" fill="#1e293b"/>
          <text x="20" y="28" fill="#cbd5e1" font-family="sans-serif" font-size="15">1. Preço acima da MMA150 e MMA200</text>
          <text x="750" y="28" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">✓ Passou</text>

          <!-- Item 2 -->
          <rect y="50" width="840" height="42" rx="8" fill="#1e293b"/>
          <text x="20" y="78" fill="#cbd5e1" font-family="sans-serif" font-size="15">2. MMA150 acima da MMA200</text>
          <text x="750" y="78" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">✓ Passou</text>

          <!-- Item 3 -->
          <rect y="100" width="840" height="42" rx="8" fill="#1e293b"/>
          <text x="20" y="128" fill="#cbd5e1" font-family="sans-serif" font-size="15">3. MMA200 com inclinação positiva há &gt; 1 mês</text>
          <text x="750" y="128" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">✓ Passou</text>

          <!-- Item 4 -->
          <rect y="150" width="840" height="42" rx="8" fill="#1e293b"/>
          <text x="20" y="178" fill="#cbd5e1" font-family="sans-serif" font-size="15">4. MMA50 acima de MMA150 e MMA200</text>
          <text x="750" y="178" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">✓ Passou</text>

          <!-- Item 5 -->
          <rect y="200" width="840" height="42" rx="8" fill="#1e293b"/>
          <text x="20" y="228" fill="#cbd5e1" font-family="sans-serif" font-size="15">5. Preço atual acima da MMA50</text>
          <text x="750" y="228" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">✓ Passou</text>

          <!-- Item 6 -->
          <rect y="250" width="840" height="42" rx="8" fill="#1e293b"/>
          <text x="20" y="278" fill="#cbd5e1" font-family="sans-serif" font-size="15">6. Preço pelo menos 30% acima da mínima de 52 semanas</text>
          <text x="750" y="278" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">✓ Passou</text>

          <!-- Item 7 -->
          <rect y="300" width="840" height="42" rx="8" fill="#1e293b"/>
          <text x="20" y="328" fill="#cbd5e1" font-family="sans-serif" font-size="15">7. Preço a menos de 25% da máxima de 52 semanas</text>
          <text x="750" y="328" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">✓ Passou</text>

          <!-- Item 8 -->
          <rect y="350" width="840" height="42" rx="8" fill="#1e293b"/>
          <text x="20" y="378" fill="#cbd5e1" font-family="sans-serif" font-size="15">8. Classificação de Força Relativa (RS) &gt; 70</text>
          <text x="750" y="378" fill="#34d399" font-family="sans-serif" font-size="16" font-weight="bold">✓ Passou</text>
        </g>
      </g>
    </g>

    <!-- Backtest Performance Summary Pill -->
    <g transform="translate(24, 1170)">
      <rect width="900" height="310" rx="24" fill="#022c22" stroke="#059669" stroke-width="2"/>
      <g transform="translate(30, 30)">
        <text x="0" y="25" fill="#34d399" font-family="sans-serif" font-size="24" font-weight="900">📈 SIMULAÇÃO DE BACKTEST (5 ANOS)</text>
        
        <g transform="translate(0, 50)">
          <rect width="260" height="90" rx="14" fill="#0f172a"/>
          <text x="20" y="35" fill="#94a3b8" font-family="sans-serif" font-size="14">Lucro Total Acumulado</text>
          <text x="20" y="70" fill="#34d399" font-family="sans-serif" font-size="26" font-weight="900">+142.8%</text>

          <rect x="285" width="260" height="90" rx="14" fill="#0f172a"/>
          <text x="305" y="35" fill="#94a3b8" font-family="sans-serif" font-size="14">Taxa de Acerto</text>
          <text x="305" y="70" fill="#38bdf8" font-family="sans-serif" font-size="26" font-weight="900">86.2%</text>

          <rect x="570" width="270" height="90" rx="14" fill="#0f172a"/>
          <text x="590" y="35" fill="#94a3b8" font-family="sans-serif" font-size="14">Profit Factor</text>
          <text x="590" y="70" fill="#a855f7" font-family="sans-serif" font-size="26" font-weight="900">3.45</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;

generateScreenshot(screenshot4, 'screenshot-4-triple-screen.png');
console.log('🎉 Todas as 4 novas screenshots em alta definição foram geradas com perfeição!');
