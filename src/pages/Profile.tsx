import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// This page just redirects to the user's own public profile
const Profile = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate(`/user/${user.id}`, { replace: true });
      }
    };
    redirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <img
        src={new URL("@/assets/iglu-logo.svg", import.meta.url).href}
        alt="IGLU"
        className="h-8 opacity-60 animate-pulse"
        style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
      />
    </div>
  );
};

export default Profile;
