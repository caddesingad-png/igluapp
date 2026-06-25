import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Layers, Clock, User, Sparkles } from "lucide-react";

const tabs = [
  { path: "/library", label: "Biblioteca", icon: BookOpen },
  { path: "/sets", label: "SETs", icon: Layers },
  { path: "/review", label: "Review", icon: Sparkles },
  { path: "/history", label: "Histórico", icon: Clock },
  { path: "/profile", label: "Perfil", icon: User },
];

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
      className="fixed left-0 right-0 bottom-0 z-50 safe-x"
      style={{
        background: "hsl(28 27% 95% / 0.85)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderTop: "1px solid hsl(9 38% 67% / 0.15)",
      }}
    >
      <div
        className="flex items-center justify-around px-2"
        style={{
          height: "72px",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              onPointerEnter={() => prefetchRoute(path)}
              onFocus={() => prefetchRoute(path)}
              className="flex flex-col items-center justify-center flex-1 gap-1 btn-press focus-visible:outline-none"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  height: "36px",
                  padding: isActive ? "0 14px" : "0 10px",
                  borderRadius: "9999px",
                  background: isActive
                    ? "linear-gradient(135deg, hsl(9 38% 67%), hsl(12 42% 72%))"
                    : "transparent",
                  boxShadow: isActive ? "0 4px 15px hsl(9 38% 67% / 0.35)" : "none",
                }}
              >
                <Icon
                  className="w-[18px] h-[18px]"
                  style={{
                    color: isActive ? "#FFFFFF" : "hsl(18 11% 57%)",
                    strokeWidth: isActive ? 2.2 : 1.8,
                  }}
                />
              </div>
              <span
                className="font-body transition-colors"
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: isActive ? "hsl(9 38% 55%)" : "hsl(18 11% 57%)",
                  letterSpacing: "0.01em",
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
