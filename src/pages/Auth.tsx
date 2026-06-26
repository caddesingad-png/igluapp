import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PasswordStrength from "@/components/PasswordStrength";
import igluLogo from "@/assets/iglu-logo.svg";

const translateError = (msg: string): string => {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("user already registered")) return "Esta conta já existe. Faça login.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("pwned") || m.includes("compromised") || m.includes("leaked"))
    return "Esta senha já apareceu em vazamentos públicos. Escolha outra mais segura.";
  if (m.includes("rate limit") || m.includes("over_email_send_rate"))
    return "Muitas tentativas. Aguarde um momento.";
  if (m.includes("popup_closed") || m.includes("user_cancelled") || m.includes("cancelled"))
    return "Login cancelado.";
  if (m.includes("popup_blocked"))
    return "Seu navegador bloqueou o popup. Permita popups e tente novamente.";
  if (m.includes("redirect_uri") || m.includes("redirect uri"))
    return "Configuração de redirecionamento inválida. Tente novamente.";
  return msg || "Algo deu errado. Tente novamente.";
};

type Provider = "google" | "apple";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("signup") !== "1");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Sempre redireciona para o domínio público do app, nunca para a URL do preview/editor.
  const getAppOrigin = () => {
    const origin = window.location.origin;
    if (origin.includes("id-preview--") || origin.includes("lovableproject.com")) {
      return "https://igluapp.lovable.app";
    }
    return origin;
  };

  const getCallbackUrl = () => `${getAppOrigin()}/auth/callback`;

  // Auto-focus no e-mail quando a tela monta
  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Cooldown do reenvio
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // Reset do botão "reenviar" quando alterna login/signup
  useEffect(() => {
    setNeedsConfirmation(false);
  }, [isLogin]);

  const handleOAuth = async (provider: Provider) => {
    if (!isLogin && !acceptedTerms) {
      toast.error("Aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: getAppOrigin(),
      });
      if (result.error) {
        toast.error(translateError(result.error.message || `Falha ao entrar com ${provider}.`));
        setOauthLoading(null);
        return;
      }
    } catch (err: any) {
      toast.error(translateError(err?.message ?? `Falha ao entrar com ${provider}.`));
      setOauthLoading(null);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Informe seu e-mail.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: { emailRedirectTo: getCallbackUrl() },
      });
      if (error) throw error;
      toast.success("E-mail de confirmação reenviado. Confira sua caixa de entrada.");
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(translateError(err.message));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !acceptedTerms) {
      toast.error("Aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    setLoading(true);
    setNeedsConfirmation(false);
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          if ((error.message || "").toLowerCase().includes("email not confirmed")) {
            setNeedsConfirmation(true);
          }
          throw error;
        }
        toast.success("Bem-vinda de volta! 💄");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: getCallbackUrl() },
        });
        if (error) throw error;

        // Anti-enumeração: Supabase retorna 200 com identities=[] se o e-mail já existe
        const identitiesEmpty =
          data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;

        if (identitiesEmpty) {
          toast.info(
            "Este e-mail já tem uma conta. Faça login ou recupere sua senha."
          );
          setIsLogin(true);
          setPassword("");
          return;
        }

        toast.success("Confira seu e-mail para confirmar a conta ✨");
      }
    } catch (error: any) {
      toast.error(translateError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const anyLoading = loading || oauthLoading !== null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 bg-background safe-top safe-bottom safe-x">
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
          <p className="font-body font-light text-[14px] text-muted-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta gratuita"}
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={anyLoading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors font-body text-[14px] text-foreground disabled:opacity-60"
          >
            {oauthLoading === "google" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.257h2.908c1.702-1.567 2.684-3.874 2.684-6.614z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
              </svg>
            )}
            {oauthLoading === "google" ? "Aguarde..." : "Continuar com Google"}
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={anyLoading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors font-body text-[14px] disabled:opacity-60"
          >
            {oauthLoading === "apple" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
            )}
            {oauthLoading === "apple" ? "Aguarde..." : "Continuar com Apple"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            ou
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label-overline block" htmlFor="email">E-mail</label>
            <Input
              ref={emailRef}
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-overline block" htmlFor="password">Senha</label>
            <Input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={72}
            />
            {!isLogin && <PasswordStrength password={password} />}
          </div>

          {isLogin && (
            <div className="text-right -mt-2">
              <Link
                to="/forgot-password"
                className="font-body text-[12px] text-muted-foreground hover:text-foreground"
              >
                Esqueci minha senha
              </Link>
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(c) => setAcceptedTerms(c === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="terms"
                className="font-body text-[12px] text-muted-foreground leading-relaxed cursor-pointer"
              >
                Li e aceito os{" "}
                <Link to="/termos" className="text-foreground underline underline-offset-2" target="_blank">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link to="/privacidade" className="text-foreground underline underline-offset-2" target="_blank">
                  Política de Privacidade
                </Link>
                .
              </label>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={anyLoading || (!isLogin && !acceptedTerms)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Aguarde...
                </>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>
          </div>

          {/* Reenviar e-mail de confirmação */}
          {isLogin && needsConfirmation && (
            <div className="mt-3 p-3 rounded-md bg-muted/40 border border-border">
              <p className="font-body text-[12px] text-muted-foreground mb-2">
                Sua conta ainda não foi confirmada. Não recebeu o e-mail?
              </p>
              <Button
                type="button"
                variant="ghost"
                className="w-full h-9"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
              >
                {resending
                  ? "Enviando..."
                  : resendCooldown > 0
                  ? `Aguarde ${resendCooldown}s`
                  : "Reenviar e-mail de confirmação"}
              </Button>
            </div>
          )}
        </form>

        <p className="text-center mt-6">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-body text-[13px] text-muted-foreground hover:text-foreground"
          >
            {isLogin ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
