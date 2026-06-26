import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ErrorBoundary from "@/components/ErrorBoundary";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import InstallPrompt from "@/components/InstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading, isRecoveryFlow } = useAuth();
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
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-full glass-panel shadow-soft flex items-center justify-center animate-breathe">
          <img
            src={new URL("@/assets/iglu-logo.svg", import.meta.url).href}
            alt="IGLU"
            className="h-6 opacity-80"
            style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
          />
        </div>
      </div>
    );
  }

  // Rotas públicas de fluxo de senha / callback de auth
  const path = window.location.pathname;
  const isPasswordFlow = path === "/forgot-password" || path === "/reset-password";
  const isAuthCallback = path === "/auth/callback";
  const isLegalPage = path === "/termos" || path === "/privacidade";

  // Não logada: mostrar onboarding primeiro, depois auth
  if (!user) {
    if (!preAuthOnboardingDone && !isPasswordFlow && !isLegalPage && !isAuthCallback) {
      return (
        <Onboarding
          preAuth
          onComplete={() => setPreAuthOnboardingDone(true)}
        />
      );
    }
    return (
      <Routes>
        <Route path="/termos" element={<Terms />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/sets/:id/public" element={<PublicSetView />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // Logada via link de recovery — vai direto para definir nova senha
  if (isRecoveryFlow || isPasswordFlow) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<ResetPassword />} />
      </Routes>
    );
  }

  // Auth callback enquanto logada — deixa a página finalizar redirect
  if (isAuthCallback) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
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
      <OfflineIndicator />
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
        <Route path="/termos" element={<Terms />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
      <BottomNav />
      <InstallPrompt />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
