import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import PasswordStrength from "@/components/PasswordStrength";
import igluLogo from "@/assets/iglu-logo.svg";

const translateError = (msg: string): string => {
  const m = (msg || "").toLowerCase();
  if (m.includes("pwned") || m.includes("compromised") || m.includes("leaked"))
    return "Esta senha já apareceu em vazamentos públicos. Escolha outra mais segura.";
  if (m.includes("password should be at least"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("same password"))
    return "A nova senha deve ser diferente da anterior.";
  if (m.includes("session") || m.includes("expired") || m.includes("invalid"))
    return "Link expirado ou inválido. Solicite um novo.";
  return msg || "Não foi possível salvar. Tente novamente.";
};

type ReadyState = "checking" | "ready" | "invalid";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ReadyState>("checking");

  useEffect(() => {
    let resolved = false;
    const markReady = () => {
      if (!resolved) {
        resolved = true;
        setState("ready");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        markReady();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady();
    });

    // Se em 2.5s nada chegou, o link é inválido/expirado
    const t = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setState("invalid");
      }
    }, 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada! Você já está logada. ✨");
      navigate("/library", { replace: true });
    } catch (err: any) {
      toast.error(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background safe-top safe-bottom safe-x">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <img
            src={igluLogo}
            alt="IGLU"
            className="h-10 mx-auto mb-6"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)",
            }}
          />

          {state === "invalid" ? (
            <>
              <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-foreground/70" />
              </div>
              <h1 className="font-display text-[22px] text-foreground mb-2">Link inválido</h1>
              <p className="font-body font-light text-[14px] text-muted-foreground">
                Este link de redefinição expirou ou já foi usado.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[22px] text-foreground mb-2">Criar nova senha</h1>
              <p className="font-body font-light text-[14px] text-muted-foreground">
                Escolha uma senha forte que você não use em outros sites.
              </p>
            </>
          )}
        </div>

        {state === "invalid" ? (
          <div className="flex flex-col gap-2.5">
            <Link to="/forgot-password">
              <Button className="w-full">Solicitar novo link</Button>
            </Link>
            <Link to="/auth">
              <Button variant="ghost" className="w-full">Voltar para o login</Button>
            </Link>
          </div>
        ) : state === "checking" ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="label-overline block">Nova senha</label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={72}
              />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-1.5">
              <label className="label-overline block">Confirmar senha</label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                maxLength={72}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
