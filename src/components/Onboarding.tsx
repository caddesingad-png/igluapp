import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight, X, BookOpen, TrendingUp, Layers, Plus } from "lucide-react";
import igluLogo from "@/assets/iglu-logo.svg";
import welcomeImg from "@/assets/onboarding-welcome.png";
import libraryImg from "@/assets/onboarding-library.png";
import spendingImg from "@/assets/onboarding-spending.png";
import setsImg from "@/assets/onboarding-sets.png";
import addImg from "@/assets/onboarding-add.png";

interface OnboardingProps {
  /** Quando fornecido, indica usuária já logada — marca onboarding completo ao sair */
  userId?: string;
  onComplete: () => void;
  /** Quando true, a última tela mostra CTA de cadastro em vez de ir direto ao app */
  preAuth?: boolean;
}

interface SlideData {
  image: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  bgColor: string;
}

const slides: SlideData[] = [
  {
    image: welcomeImg,
    icon: null,
    tag: "Bem-vinda",
    title: "Sua coleção de maquiagem,\norganizada",
    description:
      "O IGLU te ajuda a organizar sua coleção, acompanhar gastos e montar looks incríveis — tudo em um só lugar.",
    bgColor: "hsl(30 25% 93%)",
  },
  {
    image: libraryImg,
    icon: <BookOpen className="w-3.5 h-3.5" />,
    tag: "Biblioteca",
    title: "Seu catálogo\nde maquiagens",
    description:
      "Escaneie códigos de barras ou adicione produtos manualmente. Nunca esqueça o que você tem — e nunca compre duplicado.",
    bgColor: "hsl(30 30% 90%)",
  },
  {
    image: spendingImg,
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    tag: "Finanças",
    title: "Saiba onde\nseu dinheiro vai",
    description:
      "Defina um orçamento mensal de beleza, acompanhe compras e veja insights sobre seus produtos mais usados e mais caros.",
    bgColor: "hsl(30 25% 92%)",
  },
  {
    image: setsImg,
    icon: <Layers className="w-3.5 h-3.5" />,
    tag: "SETs",
    title: "Monte o seu\nlook perfeito",
    description:
      "Agrupe produtos em SETs para cada ocasião — brilho do dia, balada, trabalho. Compartilhe seus favoritos com o mundo.",
    bgColor: "hsl(38 30% 90%)",
  },
  {
    image: addImg,
    icon: <Plus className="w-3.5 h-3.5" />,
    tag: "Começar",
    title: "Adicione seu\nprimeiro produto",
    description:
      "Sua coleção está esperando para ser construída. Escaneie um código de barras ou preencha os dados — leva menos de um minuto.",
    bgColor: "hsl(30 25% 93%)",
  },
];

const Onboarding = ({ userId, onComplete, preAuth = false }: OnboardingProps) => {
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const isLast = current === slides.length - 1;

  const markComplete = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId);
    setSaving(false);
  };

  const handleSkip = async () => {
    if (preAuth) {
      // Vai direto para o auth sem marcar
      onComplete();
      navigate("/auth");
    } else {
      await markComplete();
      onComplete();
    }
  };

  const handleNext = async () => {
    if (isLast) {
      if (preAuth) {
        // Última tela: vai para cadastro
        onComplete();
        navigate("/auth?signup=1");
      } else {
        await markComplete();
        onComplete();
        navigate("/add-product");
      }
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const slide = slides[current];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Skip / Já tenho conta */}
      <div className="absolute top-5 right-5 z-10">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 font-body text-[13px] text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          {preAuth ? "Já tenho conta" : <><X className="w-3.5 h-3.5" /> Pular</>}
        </button>
      </div>

      {/* Slide */}
      <div key={current} className="flex flex-col flex-1 animate-fade-in">
        {/* Image area */}
        <div
          className="relative flex-1 flex items-center justify-center px-8 pt-16 pb-4"
          style={{ backgroundColor: slide.bgColor }}
        >
          {current === 0 && (
            <img
              src={igluLogo}
              alt="IGLU"
              className="absolute top-6 left-6 h-6 opacity-70"
              style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
            />
          )}
          <img
            src={slide.image}
            alt={slide.tag}
            className="w-full max-w-xs object-contain drop-shadow-xl"
            style={{ maxHeight: "52vh" }}
          />
        </div>

        {/* Text + actions */}
        <div className="flex flex-col px-6 pt-7 pb-10 gap-4 bg-background">
          {/* Tag */}
          <div className="flex items-center gap-1.5 text-primary uppercase tracking-[0.12em]" style={{ fontSize: "10px", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
            {slide.icon}
            {slide.tag}
          </div>

          {/* Title */}
          <h2 className="font-display text-[26px] font-normal text-foreground leading-tight whitespace-pre-line">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="font-body font-light text-[14px] text-muted-foreground leading-relaxed">
            {slide.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}>
                <div
                  className="h-[3px] rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? "24px" : "6px",
                    backgroundColor: i === current
                      ? "hsl(var(--foreground))"
                      : i < current
                      ? "hsl(var(--foreground)/0.3)"
                      : "hsl(var(--border))",
                  }}
                />
              </button>
            ))}
          </div>

          {/* CTA */}
          <Button onClick={handleNext} disabled={saving} className="w-full gap-2">
            {saving ? (
              "Aguarde..."
            ) : isLast && preAuth ? (
              <>
                Criar minha conta
                <ChevronRight className="w-4 h-4" />
              </>
            ) : isLast ? (
              <>
                <Plus className="w-4 h-4" />
                Adicionar meu primeiro produto
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Login link only in pre-auth mode */}
          {preAuth && (
            <p className="text-center font-body text-[13px] text-muted-foreground">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => { onComplete(); navigate("/auth"); }}
                className="text-foreground font-medium hover:underline"
              >
                Entrar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
