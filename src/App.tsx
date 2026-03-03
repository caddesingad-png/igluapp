import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import Sets from "./pages/Sets";
import History from "./pages/History";
import Profile from "./pages/Profile";
import AddProduct from "./pages/AddProduct";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import SetForm from "./pages/SetForm";
import SetDetail from "./pages/SetDetail";
import PublicSetView from "./pages/PublicSetView";
import UserProfile from "./pages/UserProfile";
import ProductReview from "./pages/ProductReview";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Para não-logadas: mostrar onboarding até que decidam criar conta/entrar
  const [preAuthOnboardingDone, setPreAuthOnboardingDone] = useState(false);

  useEffect(() => {
    if (!user) {
      setOnboardingChecked(false);
      setShowOnboarding(false);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_completed, display_name, created_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && !data.onboarding_completed) {
          // Só mostra onboarding se a conta foi criada há menos de 2 minutos
          // (usuário realmente novo), evitando mostrar para usuários já existentes
          const createdAt = data.created_at ? new Date(data.created_at).getTime() : 0;
          const isNewUser = Date.now() - createdAt < 2 * 60 * 1000;
          if (isNewUser) {
            setShowOnboarding(true);
          } else {
            // Marca como completo silenciosamente para usuários antigos
            supabase
              .from("profiles")
              .update({ onboarding_completed: true } as any)
              .eq("user_id", user.id);
          }
        }
        setOnboardingChecked(true);
      });
  }, [user]);

  if (loading || (user && !onboardingChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Não logada: mostrar onboarding primeiro, depois auth
  if (!user) {
    if (!preAuthOnboardingDone) {
      return (
        <Onboarding
          preAuth
          onComplete={() => setPreAuthOnboardingDone(true)}
        />
      );
    }
    return (
      <Routes>
        <Route path="/sets/:id/public" element={<PublicSetView />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // Logada mas onboarding pós-cadastro ainda pendente
  if (showOnboarding) {
    return (
      <Onboarding
        userId={user.id}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/library" replace />} />
        <Route path="/library" element={<Library />} />
        <Route path="/sets" element={<Sets />} />
        <Route path="/sets/new" element={<SetForm />} />
        <Route path="/sets/:id/public" element={<PublicSetView />} />
        <Route path="/sets/:id/edit" element={<SetForm />} />
        <Route path="/sets/:id" element={<SetDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/edit-product/:id" element={<AddProduct />} />
        <Route path="/review" element={<ProductReview />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
