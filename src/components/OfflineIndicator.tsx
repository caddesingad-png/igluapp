import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      setShow(true);
    };
    const goOnline = () => {
      setIsOffline(false);
      // Keep showing briefly with "back online" message
      setTimeout(() => setShow(false), 2000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Initial state
    if (!navigator.onLine) {
      setShow(true);
    }

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-center font-body text-[12px] font-medium transition-colors duration-300"
      style={{
        backgroundColor: isOffline
          ? "hsl(var(--destructive))"
          : "hsl(var(--status-green))",
        color: "hsl(0 0% 100%)",
      }}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          Sem conexão — usando dados salvos
        </>
      ) : (
        "Conexão restaurada ✓"
      )}
    </div>
  );
};

export default OfflineIndicator;
