const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// 1. Logo for Dark Mode (white + electric blue)
const logoLightOnDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="600" height="200">
  <defs>
    <style>
      .brand-science {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 78px;
        font-weight: 800;
        fill: #ffffff;
        letter-spacing: -1.5px;
      }
      .brand-bit {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 78px;
        font-weight: 800;
        fill: #0066ff;
        letter-spacing: -1px;
      }
      .brand-sub {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 24px;
        font-weight: 800;
        fill: #cbd5e1;
        letter-spacing: 12px;
      }
    </style>
  </defs>

  <!-- ScienceBit Main Text -->
  <g transform="translate(45, 95)">
    <text class="brand-science" x="0" y="0">Science<tspan class="brand-bit">Bit</tspan></text>
  </g>

  <!-- Subtitle: — COMPUTER — -->
  <g transform="translate(50, 150)">
    <!-- Left Blue Bar -->
    <line x1="0" y1="-8" x2="70" y2="-8" stroke="#0066ff" stroke-width="5" stroke-linecap="round"/>
    
    <!-- COMPUTER Text -->
    <text class="brand-sub" x="100" y="0">COMPUTER</text>
    
    <!-- Right Blue Bar -->
    <line x1="430" y1="-8" x2="500" y2="-8" stroke="#0066ff" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>`;

// 2. Logo Original (black + electric blue, for light backgrounds)
const logoOriginal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="600" height="200">
  <defs>
    <style>
      .brand-science-dark {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 78px;
        font-weight: 800;
        fill: #0a0f1d;
        letter-spacing: -1.5px;
      }
      .brand-bit-dark {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 78px;
        font-weight: 800;
        fill: #0066ff;
        letter-spacing: -1px;
      }
      .brand-sub-dark {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 24px;
        font-weight: 800;
        fill: #0a0f1d;
        letter-spacing: 12px;
      }
    </style>
  </defs>

  <!-- ScienceBit Main Text -->
  <g transform="translate(45, 95)">
    <text class="brand-science-dark" x="0" y="0">Science<tspan class="brand-bit-dark">Bit</tspan></text>
  </g>

  <!-- Subtitle: — COMPUTER — -->
  <g transform="translate(50, 150)">
    <!-- Left Blue Bar -->
    <line x1="0" y1="-8" x2="70" y2="-8" stroke="#0066ff" stroke-width="5" stroke-linecap="round"/>
    
    <!-- COMPUTER Text -->
    <text class="brand-sub-dark" x="100" y="0">COMPUTER</text>
    
    <!-- Right Blue Bar -->
    <line x1="430" y1="-8" x2="500" y2="-8" stroke="#0066ff" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>`;

// 3. Compact Logo Badge (for header/navbars, 260x60)
const logoCompact = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <defs>
    <style>
      .comp-science {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 34px;
        font-weight: 800;
        fill: #ffffff;
        letter-spacing: -0.5px;
      }
      .comp-bit {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 34px;
        font-weight: 800;
        fill: #38bdf8;
      }
      .comp-sub {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 800;
        fill: #94a3b8;
        letter-spacing: 5px;
      }
    </style>
  </defs>

  <g transform="translate(15, 38)">
    <text class="comp-science" x="0" y="0">Science<tspan class="comp-bit">Bit</tspan></text>
  </g>
  <g transform="translate(18, 62)">
    <line x1="0" y1="-4" x2="30" y2="-4" stroke="#0066ff" stroke-width="2.5" stroke-linecap="round"/>
    <text class="comp-sub" x="42" y="0">COMPUTER</text>
    <line x1="180" y1="-4" x2="210" y2="-4" stroke="#0066ff" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../public/sciencebit-logo.svg'), logoLightOnDark);
fs.writeFileSync(path.join(__dirname, '../public/sciencebit-logo-original.svg'), logoOriginal);
fs.writeFileSync(path.join(__dirname, '../public/sciencebit-compact.svg'), logoCompact);

// Render PNGs
const resvgDark = new Resvg(logoLightOnDark, { fitTo: { mode: 'width', value: 600 } });
fs.writeFileSync(path.join(__dirname, '../public/sciencebit-logo.png'), resvgDark.render().asPng());

const resvgOrig = new Resvg(logoOriginal, { fitTo: { mode: 'width', value: 600 } });
fs.writeFileSync(path.join(__dirname, '../public/sciencebit-logo-original.png'), resvgOrig.render().asPng());

const resvgComp = new Resvg(logoCompact, { fitTo: { mode: 'width', value: 320 } });
fs.writeFileSync(path.join(__dirname, '../public/sciencebit-compact.png'), resvgComp.render().asPng());

console.log('✅ Logos ScienceBit geradas com sucesso em /public!');
