import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Layers, Clock, User } from "lucide-react";

const tabs = [
  { path: "/library", label: "Library", icon: BookOpen },
  { path: "/sets", label: "SETs", icon: Layers },
  { path: "/history", label: "History", icon: Clock },
  { path: "/profile", label: "Profile", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ boxShadow: "0 -4px 24px rgba(26, 23, 20, 0.08)", height: "64px" }}
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {tabs.map(({ path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
            >
              <Icon
                className="w-5 h-5"
                style={{
                  color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground)/0.5)",
                  strokeWidth: isActive ? 2 : 1.5,
                }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
