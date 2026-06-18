import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";
import igluLogo from "@/assets/iglu-logo.svg";

const translateError = (msg: string): string => {
  const m = msg.toLowerCase();
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um momento.";
  if (m.includes("invalid")) return "E-mail inválido.";
  return msg;
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
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
            style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
          />
          <h1 className="font-display text-[22px] text-foreground mb-2">
            {sent ? "Confira seu e-mail" : "Redefinir senha"}
          </h1>
          <p className="font-body font-light text-[14px] text-muted-foreground">
            {sent
              ? "Enviamos um link de redefinição. Verifique sua caixa de entrada e spam."
              : "Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."}
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <MailCheck className="w-6 h-6 text-primary" />
            </div>
            <Link to="/auth" className="font-body text-[13px] text-foreground hover:underline inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="label-overline block">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
            <p className="text-center pt-2">
              <Link to="/auth" className="font-body text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
