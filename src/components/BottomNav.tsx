import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Layers, Clock, User, Sparkles } from "lucide-react";

const tabs = [
  { path: "/library", label: "Biblioteca", icon: BookOpen },
  { path: "/sets", label: "SETs", icon: Layers },
  { path: "/review", label: "Review", icon: Sparkles },
  { path: "/history", label: "Histórico", icon: Clock },
  { path: "/profile", label: "Perfil", icon: User },
];

// Prefetch route modules on hover/focus
const prefetchedRoutes = new Set<string>();
const routeModules: Record<string, () => Promise<unknown>> = {
  "/library": () => import("@/pages/Library"),
  "/sets": () => import("@/pages/Sets"),
  "/review": () => import("@/pages/ProductReview"),
  "/history": () => import("@/pages/History"),
  "/profile": () => import("@/pages/Profile"),
};

const prefetchRoute = (path: string) => {
  if (prefetchedRoutes.has(path)) return;
  prefetchedRoutes.add(path);
  routeModules[path]?.();
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ boxShadow: "0 -4px 24px rgba(26, 23, 20, 0.08)", height: "64px" }}
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              onPointerEnter={() => prefetchRoute(path)}
              onFocus={() => prefetchRoute(path)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors gap-0.5 btn-press"
            >
              <Icon
                className="w-5 h-5"
                style={{
                  color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground)/0.5)",
                  strokeWidth: isActive ? 2 : 1.5,
                }}
              />
              <span
                className="font-body text-[9px] tracking-[0.02em]"
                style={{
                  color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground)/0.5)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
