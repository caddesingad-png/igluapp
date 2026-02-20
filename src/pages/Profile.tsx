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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-[1.5px] border-foreground border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Profile;
