import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Pencil, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name, bio")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || "");
        setBio((data as any).bio ?? "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveBio = async () => {
    await supabase.from("profiles").update({ bio: bioInput } as any).eq("user_id", userId);
    setBio(bioInput);
    setEditingBio(false);
    toast.success("Bio atualizada");
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await supabase.from("profiles").update({ display_name: trimmed } as any).eq("user_id", userId);
    setDisplayName(trimmed);
    setEditingName(false);
    toast.success("Nome atualizado");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-24 bg-background screen-enter">
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
        <div className="max-w-lg mx-auto px-6 h-full flex items-center">
          <h1 className="font-display text-[18px] font-normal text-foreground">Perfil</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 pt-8 space-y-6 animate-fade-in">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-6 h-6 border-[1.5px] border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Avatar + name + bio */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <span className="font-body font-medium text-[24px] text-muted-foreground">{initials}</span>
              </div>

              {/* Name */}
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={40}
                    className="h-9 text-[15px] bg-muted rounded-lg px-3 border border-border font-body text-foreground outline-none text-center"
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                  />
                  <button onClick={saveName} className="w-7 h-7 flex items-center justify-center text-foreground">
                    <Check className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button onClick={() => setEditingName(false)} className="w-7 h-7 flex items-center justify-center text-muted-foreground">
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  className="flex items-center gap-1.5"
                  onClick={() => { setNameInput(displayName); setEditingName(true); }}
                >
                  <span className="font-body font-medium text-[17px] text-foreground">{displayName || "Adicionar nome"}</span>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground/50" strokeWidth={1.5} />
                </button>
              )}

              {/* Bio */}
              {editingBio ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    maxLength={80}
                    placeholder="Bio curta..."
                    className="h-9 text-[13px] bg-muted rounded-lg px-3 border border-border font-body text-foreground outline-none text-center w-[220px]"
                    onKeyDown={(e) => e.key === "Enter" && saveBio()}
                  />
                  <button onClick={saveBio} className="w-7 h-7 flex items-center justify-center text-foreground">
                    <Check className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button onClick={() => setEditingBio(false)} className="w-7 h-7 flex items-center justify-center text-muted-foreground">
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  className="flex items-center gap-1.5"
                  onClick={() => { setBioInput(bio); setEditingBio(true); }}
                >
                  <span className="font-body font-light text-[13px] text-muted-foreground">
                    {bio || "Adicionar bio..."}
                  </span>
                  <Pencil className="w-3 h-3 text-muted-foreground/40" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Ver perfil público */}
            {userId && (
              <button
                onClick={() => navigate(`/user/${userId}`)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-border font-body text-[13px] text-muted-foreground transition-colors hover:bg-muted"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                Ver meu perfil público
              </button>
            )}

            {/* Account info */}
            <div className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
              <p className="label-overline mb-1">Conta</p>
              <p className="font-body font-light text-[13px] text-muted-foreground truncate">{email}</p>
            </div>

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              Sair
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
