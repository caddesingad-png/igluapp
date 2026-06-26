import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import igluLogo from "@/assets/iglu-logo.svg";

type State =
  | { status: "loading" }
  | { status: "error"; title: string; message: string; cta: "login" | "forgot" };

const AuthCallback = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const errorCode = url.searchParams.get("error_code") || hash.get("error_code");
      const errorDescription =
        url.searchParams.get("error_description") || hash.get("error_description");
      const errorParam = url.searchParams.get("error") || hash.get("error");

      // Erros vindos do Supabase Auth
      if (errorParam || errorCode) {
        const code = (errorCode || errorParam || "").toLowerCase();
        const desc = (errorDescription || "").toLowerCase();
        let title = "Não foi possível confirmar";
        let message = "O link de confirmação é inválido ou já foi usado.";
        let cta: "login" | "forgot" = "login";

        if (code.includes("otp_expired") || desc.includes("expired")) {
          title = "Link expirado";
          message = "Este link de confirmação expirou. Solicite um novo para continuar.";
        } else if (code.includes("access_denied")) {
          title = "Acesso negado";
          message = "Você cancelou ou o provedor recusou o acesso.";
        }

        if (!cancelled) setState({ status: "error", title, message, cta });
        return;
      }

      const hasCode = url.searchParams.has("code");
      const hasHashToken = hash.get("access_token") || hash.get("type") === "recovery";

      try {
        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        } else if (!hasHashToken) {
          // Veio sem nada — pode ser que o detectSessionInUrl já tenha processado.
          // Tenta ler a sessão; se não tiver, mostra erro.
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            if (!cancelled)
              setState({
                status: "error",
                title: "Link inválido",
                message: "Não conseguimos validar este link. Tente entrar normalmente.",
                cta: "login",
              });
            return;
          }
        }

        // Aguarda a sessão estar realmente disponível (até 2s)
        const sessionReady = await new Promise<boolean>((resolve) => {
          let done = false;
          const sub = supabase.auth.onAuthStateChange((_event, session) => {
            if (!done && session) {
              done = true;
              resolve(true);
            }
          });
          supabase.auth.getSession().then(({ data }) => {
            if (!done && data.session) {
              done = true;
              resolve(true);
            }
          });
          setTimeout(() => {
            if (!done) {
              done = true;
              resolve(false);
            }
            sub.data.subscription.unsubscribe();
          }, 2000);
        });

        if (cancelled) return;

        if (sessionReady) {
          // Limpa a URL e vai pra biblioteca
          window.history.replaceState({}, "", "/library");
          navigate("/library", { replace: true });
        } else {
          setState({
            status: "error",
            title: "Tempo esgotado",
            message: "Demoramos demais para validar seu login. Tente novamente.",
            cta: "login",
          });
        }
      } catch (err: any) {
        const msg = (err?.message || "").toLowerCase();
        let title = "Não foi possível confirmar";
        let message = err?.message || "Tente novamente.";
        if (msg.includes("expired")) {
          title = "Link expirado";
          message = "Este link expirou. Solicite um novo.";
        } else if (msg.includes("already") || msg.includes("used")) {
          title = "Link já utilizado";
          message = "Este link já foi usado. Faça login normalmente.";
        }
        if (!cancelled)
          setState({ status: "error", title, message, cta: "login" });
      }
    };

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background safe-top safe-bottom safe-x">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <img
          src={igluLogo}
          alt="IGLU"
          className="h-10 mx-auto mb-8"
          style={{
            filter:
              "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)",
          }}
        />

        {state.status === "loading" && (
          <>
            <div className="w-14 h-14 rounded-full glass-panel shadow-soft mx-auto mb-6 flex items-center justify-center animate-breathe" />
            <p className="font-body text-[14px] text-muted-foreground">
              Confirmando seu acesso...
            </p>
          </>
        )}

        {state.status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-foreground/70" />
            </div>
            <h1 className="font-display text-[22px] text-foreground mb-2">
              {state.title}
            </h1>
            <p className="font-body font-light text-[14px] text-muted-foreground mb-8">
              {state.message}
            </p>
            <div className="flex flex-col gap-2.5">
              {state.cta === "forgot" ? (
                <Link to="/forgot-password">
                  <Button className="w-full">Solicitar novo link</Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button className="w-full">Voltar para o login</Button>
                </Link>
              )}
              <Link to="/forgot-password">
                <Button variant="ghost" className="w-full">
                  Esqueci minha senha
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
