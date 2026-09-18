const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// 1. Core App Icon SVG (with rounded corners for web/PWA) featuring ScienceBit signature
const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#131e34"/>
    </linearGradient>
    <linearGradient id="chartGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="35%" stop-color="#38bdf8"/>
      <stop offset="70%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="bullGreen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="bearRed" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>

  <!-- Container -->
  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  <rect width="504" height="504" x="4" y="4" rx="100" fill="none" stroke="#334155" stroke-width="4"/>

  <!-- Subtle Financial Grid -->
  <line x1="50" y1="160" x2="462" y2="160" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,6"/>
  <line x1="50" y1="255" x2="462" y2="255" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,6"/>
  <line x1="50" y1="350" x2="462" y2="350" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,6"/>

  <!-- Candlestick 1: Red decline -->
  <line x1="110" y1="175" x2="110" y2="315" stroke="#f43f5e" stroke-width="5"/>
  <rect x="94" y="205" width="32" height="85" rx="5" fill="url(#bearRed)"/>

  <!-- Candlestick 2: Deep oversold dip -->
  <line x1="180" y1="230" x2="180" y2="395" stroke="#f43f5e" stroke-width="5"/>
  <rect x="164" y="260" width="32" height="100" rx="5" fill="url(#bearRed)"/>

  <!-- Candlestick 3: Reversal Hammer / Pinbar -->
  <line x1="250" y1="280" x2="250" y2="430" stroke="#38bdf8" stroke-width="5"/>
  <rect x="234" y="290" width="32" height="42" rx="5" fill="#38bdf8"/>

  <!-- Candlestick 4: Bullish Breakout -->
  <line x1="320" y1="190" x2="320" y2="350" stroke="#10b981" stroke-width="5"/>
  <rect x="304" y="215" width="32" height="105" rx="5" fill="url(#bullGreen)"/>

  <!-- Candlestick 5: Momentum Surge -->
  <line x1="390" y1="110" x2="390" y2="270" stroke="#10b981" stroke-width="5"/>
  <rect x="374" y="135" width="32" height="110" rx="5" fill="url(#bullGreen)"/>

  <!-- Rebound Trajectory Glow Line -->
  <path d="M 95 255 Q 225 445 400 130" fill="none" stroke="url(#chartGlow)" stroke-width="14" stroke-linecap="round"/>
  <polygon points="420,105 382,128 402,158" fill="#34d399"/>

  <!-- ScienceBit Brand Badge at Top Left -->
  <g transform="translate(52, 50)">
    <rect width="215" height="52" rx="14" fill="url(#pillGrad)" stroke="#3b82f6" stroke-width="2"/>
    <text x="22" y="32" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#ffffff" letter-spacing="-0.5px">Science<tspan fill="#0066ff">Bit</tspan></text>
    <line x1="140" y1="26" x2="160" y2="26" stroke="#0066ff" stroke-width="2"/>
    <text x="165" y="30" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="800" fill="#94a3b8" letter-spacing="1px">PRO</text>
    <line x1="188" y1="26" x2="198" y2="26" stroke="#0066ff" stroke-width="2"/>
  </g>

  <!-- Market Tag at Top Right -->
  <g transform="translate(350, 50)">
    <rect width="112" height="52" rx="14" fill="#0066ff" opacity="0.95"/>
    <text x="56" y="33" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">BOLSA</text>
  </g>
</svg>`;

// 2. Play Store 512x512 Solid Square Icon with ScienceBit
const playStoreIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="psBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#0b1222"/>
    </linearGradient>
    <linearGradient id="chartGlow2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="35%" stop-color="#38bdf8"/>
      <stop offset="70%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="bullGreen2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="bearRed2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <linearGradient id="pillGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>

  <!-- Solid Square Background (Google Play requirement) -->
  <rect width="512" height="512" fill="url(#psBg)"/>

  <!-- Subtle Financial Grid -->
  <line x1="40" y1="160" x2="472" y2="160" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,6"/>
  <line x1="40" y1="255" x2="472" y2="255" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,6"/>
  <line x1="40" y1="350" x2="472" y2="350" stroke="#1e293b" stroke-width="2" stroke-dasharray="6,6"/>

  <!-- Candlestick 1: Red decline -->
  <line x1="105" y1="170" x2="105" y2="315" stroke="#f43f5e" stroke-width="5"/>
  <rect x="89" y="200" width="32" height="85" rx="5" fill="url(#bearRed2)"/>

  <!-- Candlestick 2: Deep oversold dip -->
  <line x1="175" y1="225" x2="175" y2="395" stroke="#f43f5e" stroke-width="5"/>
  <rect x="159" y="255" width="32" height="100" rx="5" fill="url(#bearRed2)"/>

  <!-- Candlestick 3: Reversal Hammer / Pinbar -->
  <line x1="245" y1="275" x2="245" y2="430" stroke="#38bdf8" stroke-width="5"/>
  <rect x="229" y="285" width="32" height="44" rx="5" fill="#38bdf8"/>

  <!-- Candlestick 4: Bullish Breakout -->
  <line x1="315" y1="185" x2="315" y2="350" stroke="#10b981" stroke-width="5"/>
  <rect x="299" y="210" width="32" height="105" rx="5" fill="url(#bullGreen2)"/>

  <!-- Candlestick 5: Momentum Surge -->
  <line x1="385" y1="105" x2="385" y2="270" stroke="#10b981" stroke-width="5"/>
  <rect x="369" y="130" width="32" height="110" rx="5" fill="url(#bullGreen2)"/>

  <!-- Rebound Trajectory Glow Line -->
  <path d="M 90 250 Q 220 445 395 125" fill="none" stroke="url(#chartGlow2)" stroke-width="15" stroke-linecap="round"/>
  <polygon points="420,100 378,125 398,155" fill="#34d399"/>

  <!-- ScienceBit Brand Badge at Top Left -->
  <g transform="translate(42, 42)">
    <rect width="225" height="54" rx="14" fill="url(#pillGrad2)" stroke="#3b82f6" stroke-width="2"/>
    <text x="22" y="34" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="800" fill="#ffffff" letter-spacing="-0.5px">Science<tspan fill="#0066ff">Bit</tspan></text>
    <line x1="145" y1="28" x2="168" y2="28" stroke="#0066ff" stroke-width="2"/>
    <text x="173" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="800" fill="#94a3b8" letter-spacing="1px">PRO</text>
    <line x1="198" y1="28" x2="208" y2="28" stroke="#0066ff" stroke-width="2"/>
  </g>

  <!-- Market Tag at Top Right -->
  <g transform="translate(355, 42)">
    <rect width="115" height="54" rx="14" fill="#0066ff" opacity="0.95"/>
    <text x="57" y="35" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">BOLSA</text>
  </g>
</svg>`;

// 3. Play Store Feature Graphic Banner (1024 x 500 px) with official ScienceBit Computer logo
const featureGraphicSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
  <defs>
    <linearGradient id="featBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#0a1224"/>
    </linearGradient>
    <linearGradient id="featGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="40%" stop-color="#38bdf8"/>
      <stop offset="80%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="bullG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="bearR" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
  </defs>

  <!-- Solid Non-Transparent Background -->
  <rect width="1024" height="500" fill="url(#featBg)"/>

  <!-- Ambient Light Circles -->
  <circle cx="200" cy="100" r="220" fill="#1d4ed8" opacity="0.18"/>
  <circle cx="850" cy="400" r="250" fill="#059669" opacity="0.15"/>

  <!-- Grid Lines -->
  <line x1="40" y1="130" x2="984" y2="130" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="8,8"/>
  <line x1="40" y1="260" x2="984" y2="260" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="8,8"/>
  <line x1="40" y1="390" x2="984" y2="390" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="8,8"/>

  <!-- Left Side: Branding & Value Proposition -->
  <g transform="translate(60, 65)">
    <!-- ScienceBit Official Logo Header -->
    <g transform="translate(0, 0)">
      <rect width="250" height="54" rx="12" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="20" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="800" fill="#ffffff">Science<tspan fill="#0066ff">Bit</tspan></text>
      <line x1="140" y1="26" x2="165" y2="26" stroke="#0066ff" stroke-width="2"/>
      <text x="170" y="30" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="800" fill="#cbd5e1" letter-spacing="1px">COMPUTER</text>
      <line x1="230" y1="26" x2="240" y2="26" stroke="#0066ff" stroke-width="2"/>
    </g>

    <!-- App Title -->
    <text x="0" y="115" fill="#ffffff" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="-0.5">Monitor Bolsa de Valores</text>

    <!-- Subtitle -->
    <text x="0" y="155" fill="#38bdf8" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="600">Scanner de Sobrevenda &amp; Indicadores Quantitativos</text>

    <!-- Feature Bullet Points -->
    <g transform="translate(0, 195)">
      <rect width="18" height="18" rx="9" fill="#10b981"/>
      <text x="30" y="15" fill="#e2e8f0" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="500">Triple Screen Elder + Minervini Trend Template</text>

      <rect y="40" width="18" height="18" rx="9" fill="#38bdf8"/>
      <text x="30" y="55" fill="#e2e8f0" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="500">IFR 2 &amp; 14, Bandas de Bollinger e Médias Móveis</text>

      <rect y="80" width="18" height="18" rx="9" fill="#a855f7"/>
      <text x="30" y="95" fill="#e2e8f0" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="500">Modelos Preditivos de IA &amp; Sentimento de Notícias</text>
    </g>
  </g>

  <!-- Right Side: Graphic Candlestick Formation & Trend Wave -->
  <g transform="translate(680, 100)">
    <!-- Card Frame -->
    <rect width="280" height="300" rx="24" fill="#0d1527" stroke="#1e293b" stroke-width="2"/>

    <!-- Candlestick 1 -->
    <line x1="45" y1="80" x2="45" y2="190" stroke="#f43f5e" stroke-width="3"/>
    <rect x="35" y="100" width="20" height="60" rx="3" fill="url(#bearR)"/>

    <!-- Candlestick 2 -->
    <line x1="95" y1="120" x2="95" y2="240" stroke="#f43f5e" stroke-width="3"/>
    <rect x="85" y="140" width="20" height="70" rx="3" fill="url(#bearR)"/>

    <!-- Candlestick 3 (Hammer Pinbar) -->
    <line x1="145" y1="160" x2="145" y2="270" stroke="#38bdf8" stroke-width="3"/>
    <rect x="135" y="170" width="20" height="30" rx="3" fill="#38bdf8"/>

    <!-- Candlestick 4 (Breakout) -->
    <line x1="195" y1="90" x2="195" y2="210" stroke="#10b981" stroke-width="3"/>
    <rect x="185" y="110" width="20" height="70" rx="3" fill="url(#bullG)"/>

    <!-- Candlestick 5 (Rally) -->
    <line x1="245" y1="40" x2="245" y2="150" stroke="#10b981" stroke-width="3"/>
    <rect x="235" y="60" width="20" height="70" rx="3" fill="url(#bullG)"/>

    <!-- Glowing Reversal Trajectory -->
    <path d="M 35 140 Q 125 270 245 60" fill="none" stroke="url(#featGlow)" stroke-width="8" stroke-linecap="round"/>
    <polygon points="255,45 230,62 245,82" fill="#34d399"/>
  </g>
</svg>`;

async function run() {
  console.log('Gerando assets com a logomarca ScienceBit Computer...');

  fs.writeFileSync(path.join(__dirname, '../public/icon.svg'), appIconSvg);
  console.log('✅ Atualizado public/icon.svg');

  const resvgPsIcon = new Resvg(playStoreIconSvg, { fitTo: { mode: 'width', value: 512 } });
  const pngPsIcon = resvgPsIcon.render().asPng();
  fs.writeFileSync(path.join(__dirname, '../public/playstore-icon-512.png'), pngPsIcon);
  fs.writeFileSync(path.join(__dirname, '../public/developer-icon.png'), pngPsIcon);
  fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), pngPsIcon);
  console.log('✅ Gerado public/playstore-icon-512.png, icon-512.png e developer-icon.png');

  const resvg192 = new Resvg(playStoreIconSvg, { fitTo: { mode: 'width', value: 192 } });
  const png192 = resvg192.render().asPng();
  fs.writeFileSync(path.join(__dirname, '../public/icon-192.png'), png192);
  console.log('✅ Gerado public/icon-192.png');

  const resvgBanner = new Resvg(featureGraphicSvg, { fitTo: { mode: 'width', value: 1024 } });
  const pngBanner = resvgBanner.render().asPng();
  fs.writeFileSync(path.join(__dirname, '../public/playstore-feature-graphic-1024x500.png'), pngBanner);
  console.log('✅ Gerado public/playstore-feature-graphic-1024x500.png');

  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const m of mipmaps) {
    const targetDir = path.join(__dirname, '../android/app/src/main/res', m.dir);
    if (fs.existsSync(targetDir)) {
      const res = new Resvg(playStoreIconSvg, { fitTo: { mode: 'width', value: m.size } });
      const imgBuffer = res.render().asPng();
      fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), imgBuffer);
      fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), imgBuffer);
      fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), imgBuffer);
      console.log(`✅ Atualizado ${m.dir}`);
    }
  }

  console.log('🎉 Todos os ícones com a logomarca ScienceBit foram concluídos!');
}

run().catch(console.error);
