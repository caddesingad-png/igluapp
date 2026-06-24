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

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.path === location.pathname));

  return (
    <nav
      className="fixed left-0 right-0 z-50 safe-x flex justify-center pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div
        className="glass shadow-glass-lg rounded-full pointer-events-auto relative px-2"
        style={{ height: "64px", width: "min(92vw, 28rem)" }}
      >
        {/* Indicador "poço" neumórfico que desliza */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `calc(${100 / tabs.length}% - 8px)`,
            left: `calc(${(activeIndex * 100) / tabs.length}% + 4px)`,
            background: "linear-gradient(135deg, hsl(var(--aura-peach) / 0.55), hsl(var(--aura-blush) / 0.45))",
            boxShadow: "var(--shadow-soft-inset)",
          }}
          aria-hidden
        />

        <div className="relative flex items-center justify-around h-full">
          {tabs.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                onPointerEnter={() => prefetchRoute(path)}
                onFocus={() => prefetchRoute(path)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 z-10 focus-visible:outline-none"
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="w-[18px] h-[18px] transition-colors"
                  style={{
                    color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.7)",
                    strokeWidth: isActive ? 2 : 1.6,
                  }}
                />
                <span
                  className="font-body text-[9px] tracking-[0.06em] transition-colors"
                  style={{
                    color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.7)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
