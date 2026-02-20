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
  userId: string;
  onComplete: () => void;
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
    tag: "Welcome",
    title: "Your beauty world,\nall in one place",
    description:
      "IGLU helps you organise your makeup collection, track spending, and build stunning looks — effortlessly.",
    bgColor: "hsl(30 25% 93%)",
  },
  {
    image: libraryImg,
    icon: <BookOpen className="w-3.5 h-3.5" />,
    tag: "Library",
    title: "Your makeup\ncatalog",
    description:
      "Scan barcodes or add products manually. Never forget what you own — and never buy a duplicate again.",
    bgColor: "hsl(30 30% 90%)",
  },
  {
    image: spendingImg,
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    tag: "Spending",
    title: "Know where\nyour money goes",
    description:
      "Set a monthly beauty budget, track purchases, and get insights on your most-used (and most-expensive) products.",
    bgColor: "hsl(30 25% 92%)",
  },
  {
    image: setsImg,
    icon: <Layers className="w-3.5 h-3.5" />,
    tag: "SETs",
    title: "Curate your\nperfect look",
    description:
      "Group products into SETs for any occasion — daily glow, night out, work polish. Share your favourites with the world.",
    bgColor: "hsl(38 30% 90%)",
  },
  {
    image: addImg,
    icon: <Plus className="w-3.5 h-3.5" />,
    tag: "Get started",
    title: "Add your first\nproduct",
    description:
      "Your collection is waiting to be built. Scan a barcode or fill in details manually — it takes less than a minute.",
    bgColor: "hsl(30 25% 93%)",
  },
];

const Onboarding = ({ userId, onComplete }: OnboardingProps) => {
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const isLast = current === slides.length - 1;

  const markComplete = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId);
    setSaving(false);
    onComplete();
  };

  const handleSkip = async () => {
    await markComplete();
  };

  const handleNext = async () => {
    if (isLast) {
      await markComplete();
      navigate("/add-product");
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const slide = slides[current];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Skip */}
      <div className="absolute top-5 right-5 z-10">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 font-body text-[13px] text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Skip
        </button>
      </div>

      {/* Slide */}
      <div key={current} className="flex flex-col flex-1 animate-fade-in">
        {/* Image area */}
        <div
          className="relative flex-1 flex items-center justify-center px-8 pt-16 pb-4"
          style={{ backgroundColor: slide.bgColor }}
        >
          {/* IGLU logo watermark on slide 0 */}
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
              "Please wait..."
            ) : isLast ? (
              <>
                <Plus className="w-4 h-4" />
                Add my first product
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
