import { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Check, X } from "lucide-react";

interface AvatarCropModalProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

function centerAspectCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, 1, width, height),
    width,
    height
  );
}

const AvatarCropModal = ({ imageSrc, onConfirm, onCancel }: AvatarCropModalProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [processing, setProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(centerAspectCrop(naturalWidth, naturalHeight));
  }, []);

  const handleConfirm = async () => {
    if (!imgRef.current || !crop) return;
    setProcessing(true);

    const img = imgRef.current;

    // crop.unit === "%" → converter para pixels naturais da imagem
    const naturalX = (crop.x / 100) * img.naturalWidth;
    const naturalY = (crop.y / 100) * img.naturalHeight;
    const naturalW = (crop.width / 100) * img.naturalWidth;
    const naturalH = (crop.height / 100) * img.naturalHeight;

    const size = Math.min(naturalW, naturalH);
    const outputSize = Math.min(size, 600);

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setProcessing(false); return; }

    // Fundo branco (para imagens com transparência)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Clip circular
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Desenha a região recortada
    ctx.drawImage(
      img,
      naturalX, naturalY, size, size,   // source
      0, 0, outputSize, outputSize       // destination
    );

    canvas.toBlob(
      (blob) => {
        setProcessing(false);
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.88
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
    >
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white">
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
        <span className="text-white font-body text-[14px] font-medium">Ajustar foto</span>
        <button
          onClick={handleConfirm}
          disabled={processing || !crop}
          className="w-9 h-9 flex items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        >
          {processing ? (
            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Crop area */}
      <div className="flex-1 flex items-center justify-center w-full px-4 overflow-hidden">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          aspect={1}
          circularCrop
          minWidth={40}
          keepSelection
          className="max-h-[75vh]"
        >
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={onImageLoad}
            alt="Crop"
            style={{ maxHeight: "75vh", maxWidth: "100%", display: "block" }}
          />
        </ReactCrop>
      </div>

      <p className="text-white/50 font-body text-[12px] pb-6 pt-3">
        Arraste para reposicionar · Redimensione o círculo
      </p>
    </div>
  );
};

export default AvatarCropModal;
