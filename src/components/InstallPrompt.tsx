import { useState, useEffect, useCallback } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isIOSDevice) {
      setIsIOS(true);
      if (isSafari) setShowPrompt(true);
      return;
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Listen for successful install
  useEffect(() => {
    const handler = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  }, []);

  if (!showPrompt || dismissed) return null;

  if (showIOSGuide) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[60] animate-in slide-in-from-bottom-4 duration-300">
        <div
          className="rounded-2xl p-4 shadow-lg border border-border"
          style={{ backgroundColor: "hsl(var(--card))" }}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="font-heading text-sm font-semibold text-foreground">
              Como instalar no iPhone
            </span>
            <button onClick={handleDismiss} className="p-1 -mr-1 -mt-1">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-2.5 text-xs text-muted-foreground font-body">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-semibold text-accent-foreground">1</span>
              </div>
              <span>
                Toque no ícone <Share className="w-3.5 h-3.5 inline text-accent-foreground -mt-0.5" /> de compartilhar
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-semibold text-accent-foreground">2</span>
              </div>
              <span>Selecione "Adicionar à Tela de Início"</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-semibold text-accent-foreground">3</span>
              </div>
              <span>Toque em "Adicionar" para confirmar</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] animate-in slide-in-from-bottom-4 duration-300">
      <div
        className="rounded-2xl p-3.5 shadow-lg border border-border flex items-center gap-3"
        style={{ backgroundColor: "hsl(var(--card))" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent)/0.7))" }}
        >
          <Download className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-sm font-semibold text-foreground leading-tight">
            Instalar Iglu
          </p>
          <p className="text-[11px] text-muted-foreground font-body mt-0.5">
            Acesse direto da sua tela inicial
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold font-body shrink-0"
          style={{
            backgroundColor: "hsl(var(--foreground))",
            color: "hsl(var(--background))",
          }}
        >
          Instalar
        </button>
        <button onClick={handleDismiss} className="p-1 shrink-0">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
