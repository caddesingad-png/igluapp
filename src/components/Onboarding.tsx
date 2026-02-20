import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight, X, Sparkles, BookOpen, TrendingUp, Layers, Plus } from "lucide-react";
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
  accent: string;
}

const slides: SlideData[] = [
  {
    image: welcomeImg,
    icon: <Sparkles className="w-4 h-4" />,
    tag: "Welcome",
    title: "Your beauty world,\nall in one place",
    description:
      "Glambook helps you organise your makeup collection, track spending, and build stunning looks — effortlessly.",
    accent: "from-primary/20 to-accent/20",
  },
  {
    image: libraryImg,
    icon: <BookOpen className="w-4 h-4" />,
    tag: "Library",
    title: "Your makeup\ncatalog",
    description:
      "Scan barcodes or add products manually. Never forget what you own — and never buy a duplicate again.",
    accent: "from-rose-glow/20 to-primary/10",
  },
  {
    image: spendingImg,
    icon: <TrendingUp className="w-4 h-4" />,
    tag: "Spending",
    title: "Know where\nyour money goes",
    description:
      "Set a monthly beauty budget, track purchases, and get insights on your most-used (and most-expensive) products.",
    accent: "from-nude/40 to-secondary/60",
  },
  {
    image: setsImg,
    icon: <Layers className="w-4 h-4" />,
    tag: "SETs",
    title: "Curate your\nperfect look",
    description:
      "Group products into SETs for any occasion — daily glow, night out, work polish. Share your favourites with the world.",
    accent: "from-accent/25 to-primary/15",
  },
  {
    image: addImg,
    icon: <Plus className="w-4 h-4" />,
    tag: "Get started",
    title: "Add your first\nproduct",
    description:
      "Your collection is waiting to be built. Scan a barcode or fill in details manually — it takes less than a minute.",
    accent: "from-primary/15 to-rose-glow/20",
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
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
        >
          <X className="w-3.5 h-3.5" />
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div
        key={current}
        className="flex flex-col flex-1 animate-fade-in"
      >
        {/* Image area */}
        <div className={`relative flex-1 flex items-center justify-center bg-gradient-to-br ${slide.accent} px-8 pt-16 pb-4`}>
          <img
            src={slide.image}
            alt={slide.tag}
            className="w-full max-w-xs object-contain drop-shadow-xl"
            style={{ maxHeight: "55vh" }}
          />
        </div>

        {/* Text + actions */}
        <div className="flex flex-col px-6 pt-6 pb-10 gap-4 bg-background">
          {/* Tag pill */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest">
            {slide.icon}
            {slide.tag}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground leading-tight whitespace-pre-line">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {slide.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="transition-all duration-300"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 bg-primary"
                      : i < current
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* CTA button */}
          <Button
            onClick={handleNext}
            disabled={saving}
            className="w-full h-13 text-base font-semibold mt-2 flex items-center justify-center gap-2"
            style={{ height: "52px" }}
          >
            {saving ? (
              "Please wait..."
            ) : isLast ? (
              <>
                <Plus className="w-5 h-5" />
                Add my first product
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
