import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { X, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onDetected, onClose }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const detectedRef = useRef(false);

  const handleDetected = useCallback(
    (barcode: string) => {
      if (detectedRef.current) return;
      detectedRef.current = true;
      controlsRef.current?.stop();
      onDetected(barcode);
    },
    [onDetected]
  );

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    const start = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
        );
        const deviceId = backCam?.deviceId || devices[0]?.deviceId;

        if (!videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              handleDetected(result.getText());
            }
            if (err && !(err instanceof NotFoundException)) {
              // Ignore per-frame no-barcode errors
            }
          }
        );

        controlsRef.current = controls;
        setReady(true);
      } catch (e: any) {
        setError(e?.message || "Não foi possível acessar a câmera");
      }
    };

    start();

    return () => {
      controlsRef.current?.stop();
    };
  }, [handleDetected]);

  const handleClose = () => {
    controlsRef.current?.stop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Close */}
      <button
        onClick={handleClose}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <p className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-sm font-medium z-10 whitespace-nowrap">
        Aponte para o código de barras
      </p>

      {/* Video */}
      <div className="relative w-full max-w-sm aspect-[3/4] overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Scanning overlay */}
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-36 relative">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br-lg" />
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-primary/80 animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading */}
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm">Iniciando câmera…</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 px-6 text-center">
          <p className="text-white/80 text-sm mb-4">{error}</p>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      )}

      <p className="absolute bottom-10 text-white/60 text-xs">
        Toque em X para preencher manualmente
      </p>
    </div>
  );
};

export default BarcodeScanner;
