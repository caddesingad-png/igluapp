import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {

    // Verifica se a conta está agendada para exclusão. Se sim, desloga.
    const checkScheduledDeletion = async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("deletion_scheduled_at")
        .eq("user_id", uid)
        .maybeSingle();
      const scheduled = (data as any)?.deletion_scheduled_at as string | null | undefined;
      if (scheduled) {
        const when = new Date(scheduled);
        const days = Math.max(0, Math.ceil((when.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        await supabase.auth.signOut();
        toast.error(
          days > 0
            ? `Esta conta está agendada para exclusão em ${days} dia${days === 1 ? "" : "s"}. Acesso bloqueado.`
            : "Esta conta está sendo excluída.",
        );
        return true;
      }
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecoveryFlow(true);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_IN" && session?.user) {
          // Defer para não bloquear o callback do supabase
          setTimeout(() => { checkScheduledDeletion(session.user.id); }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setTimeout(() => { checkScheduledDeletion(session.user.id); }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading, isRecoveryFlow };
};
