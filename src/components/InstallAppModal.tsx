import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Star,
  Copy,
  Check,
  Smartphone,
  QrCode,
  Share2,
  RefreshCw,
  Info,
  CheckCircle2
} from 'lucide-react';
import { clearAppCacheAndReload } from '../utils/api';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable?: boolean;
  isIOS?: boolean;
  isInAppBrowser?: boolean;
  onTriggerInstall?: () => void;
  defaultPackageId?: string;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  defaultPackageId = 'com.sciencebit.monitorb3',
}) => {
  const [packageId, setPackageId] = useState<string>(() => {
    return localStorage.getItem('playstore_package_id') || defaultPackageId;
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const playStoreWebUrl = `https://play.google.com/store/apps/details?id=${packageId.trim()}`;
  const playStoreMarketUrl = `market://details?id=${packageId.trim()}`;

  const handleOpenPlayStore = () => {
    // If on Android, attempt direct market protocol first
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = playStoreMarketUrl;
      // Fallback to web link if market intent doesn't resolve in 1.5s
      setTimeout(() => {
        window.open(playStoreWebUrl, '_blank');
      }, 1500);
    } else {
      window.open(playStoreWebUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playStoreWebUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSavePackageId = (val: string) => {
    setPackageId(val);
    localStorage.setItem('playstore_package_id', val);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(playStoreWebUrl)}&margin=4`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header with Google Play Branding */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center p-1.5 shadow-inner">
              {/* Google Play 4-Color Triangle Logo */}
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                <path d="M3.6 1.48L13.9 12 3.6 22.52c-.37-.36-.6-.88-.6-1.52V3c0-.64.23-1.16.6-1.52z" fill="#00C1A6"/>
                <path d="M17.43 8.47L4.62 1.15C4.24.94 3.88.94 3.6 1.48l10.3 10.52 3.53-3.53z" fill="#0086F0"/>
                <path d="M17.43 15.53l-3.53-3.53L3.6 22.52c.28.54.64.54 1.02.33l12.81-7.32z" fill="#FF3333"/>
                <path d="M21.57 10.12l-4.14-2.37-3.53 3.53 3.53 3.53 4.14-2.37c1.17-.67 1.17-1.78 0-2.45z" fill="#FFBA00"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Google Play</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-semibold">
                  <ShieldCheck className="w-2.5 h-2.5" /> Oficial
                </span>
              </div>
              <h2 className="text-base font-bold text-white">Instalar no Google Play</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
          {/* App Play Store Card */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex items-start gap-3.5">
              <img
                src="/icon-192.png"
                alt="Ícone do Monitor Bolsa"
                className="w-14 h-14 rounded-2xl shadow-md border border-slate-700/60 object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base leading-tight truncate">
                  Monitor Bolsa de Valores
                </h3>
                <p className="text-xs text-blue-400 font-medium mt-0.5">
                  Sciencebit · Finanças & Investimentos
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1 font-semibold text-amber-300">
                    4.9 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Classificação Livre</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold">Gratuito</span>
                </div>
              </div>
            </div>

            {/* Google Play Protect Verification */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Verificado e protegido pelo <strong>Google Play Protect</strong></span>
            </div>
          </div>

          {/* Primary Action Button: Install on Google Play */}
          <div className="space-y-2.5">
            <button
              onClick={handleOpenPlayStore}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2.5 transition shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M3.6 1.48L13.9 12 3.6 22.52c-.37-.36-.6-.88-.6-1.52V3c0-.64.23-1.16.6-1.52z" fill="#00C1A6"/>
                <path d="M17.43 8.47L4.62 1.15C4.24.94 3.88.94 3.6 1.48l10.3 10.52 3.53-3.53z" fill="#0086F0"/>
                <path d="M17.43 15.53l-3.53-3.53L3.6 22.52c.28.54.64.54 1.02.33l12.81-7.32z" fill="#FF3333"/>
                <path d="M21.57 10.12l-4.14-2.37-3.53 3.53 3.53 3.53 4.14-2.37c1.17-.67 1.17-1.78 0-2.45z" fill="#FFBA00"/>
              </svg>
              <span>Instalar no Google Play Store</span>
              <ExternalLink className="w-4 h-4 opacity-70 ml-1" />
            </button>

            {/* Rate on Google Play Button */}
            <button
              onClick={handleOpenPlayStore}
              className="w-full py-2.5 px-4 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              title="Deixe sua avaliação e comentário no Google Play"
            >
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <span>Avaliar Aplicativo no Play Store</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-0.5" />
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Instalação oficial e avaliações diretamente pela loja Google Play do Android.
            </p>
          </div>

          {/* Quick Action Tools: Copy Link & Show QR Code */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-400" />
              <span>{showQrCode ? 'Ocultar QR' : 'Escanear QR'}</span>
            </button>
          </div>

          {/* QR Code Section for PC / Tablet Users */}
          {showQrCode && (
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 text-center space-y-2 animate-fade-in">
              <p className="text-xs text-slate-300 font-medium">
                Aponte a câmera do seu celular Android para instalar:
              </p>
              <div className="inline-block p-2 bg-white rounded-xl shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Google Play"
                  className="w-36 h-36 mx-auto"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono break-all">
                {playStoreWebUrl}
              </p>
            </div>
          )}

          {/* Security & Benefits list */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-start gap-2.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Atualizações automáticas:</strong> Novas análises técnicas e ativos da B3 chegam sem precisar reinstalar.</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Notificações no celular:</strong> Alertas em tempo real sobre quedas bruscas e oportunidades de repique.</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Instalação limpa e rápida:</strong> Sem arquivos soltos ou erros de empacotamento.</span>
            </div>
          </div>

          {/* WhatsApp Direct Support Card */}
          <a
            href="https://wa.me/5562999755774?text=Ol%C3%A1!%20Vim%20pelo%20aplicativo%20Monitor%20Bolsa%20de%20Valores%20e%20gostaria%20de%20tirar%20uma%20d%C3%BAvida."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-xl transition cursor-pointer text-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.44C8.95 7.44 8.68 7.5 8.46 7.74C8.23 7.99 7.6 8.58 7.6 9.78C7.6 10.98 8.48 12.14 8.6 12.3C8.72 12.46 10.33 14.94 12.8 16C13.39 16.26 13.84 16.41 14.2 16.52C14.79 16.71 15.33 16.68 15.75 16.62C16.22 16.55 17.2 16.03 17.41 15.45C17.61 14.86 17.61 14.36 17.55 14.25C17.49 14.15 17.34 14.09 17.11 13.98C16.89 13.86 15.79 13.32 15.59 13.25C15.38 13.17 15.23 13.14 15.08 13.36C14.93 13.59 14.5 14.09 14.37 14.24C14.24 14.39 14.11 14.41 13.89 14.3C13.66 14.18 12.93 13.94 12.07 13.17C11.4 12.57 10.95 11.83 10.82 11.61C10.69 11.39 10.81 11.27 10.92 11.16C11.02 11.06 11.15 10.89 11.26 10.76C11.37 10.64 11.41 10.55 11.48 10.4C11.56 10.26 11.52 10.13 11.46 10.02C11.41 9.9 10.95 8.78 10.76 8.32C10.58 7.87 10.39 7.93 10.25 7.92H9.81C9.66 7.92 9.43 7.98 9.24 8.18"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-emerald-300">Dúvidas ou Suporte? Fale no WhatsApp</p>
                <p className="text-[11px] text-slate-400">+55 (62) 99975-5774 · Atendimento</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition" />
          </a>

          {/* Config / Custom Package ID toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1 transition"
            >
              <Info className="w-3 h-3" />
              <span>ID do Pacote Play Store: <code className="text-slate-400">{packageId}</code></span>
            </button>

            {showConfig && (
              <div className="mt-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-[11px] text-slate-400 font-medium">
                  Identificador do Aplicativo (Package Name)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={packageId}
                    onChange={(e) => handleSavePackageId(e.target.value)}
                    placeholder="com.sciencebit.monitorb3"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSavePackageId(defaultPackageId)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Padrão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <button
            onClick={clearAppCacheAndReload}
            className="text-slate-500 hover:text-amber-400 flex items-center gap-1 text-[11px] transition"
            title="Limpar dados temporários do navegador"
          >
            <RefreshCw className="w-3 h-3" />
            Limpar cache local
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
