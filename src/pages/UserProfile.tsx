import { useEffect, useRef, useState } from "react";
import ShimmerImage from "@/components/ShimmerImage";
import { compressImage } from "@/lib/compressImage";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Heart, Layers, UserCheck, UserPlus, Users,
  Settings, Pencil, Check, X, LogOut, Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AvatarCropModal from "@/components/AvatarCropModal";

interface ProfileData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface PublicSet {
  id: string;
  name: string;
  occasion: string | null;
  photo_url: string | null;
  likes_count: number;
}

interface ProductPhoto {
  id: string;
  photo_url: string | null;
  name: string;
}

interface FollowList {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  user_id: string;
}

// Orbital positions for product photos around the avatar
// Returns {x, y} as percentage offsets from center
const getOrbitalPositions = (count: number, radius: number) => {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
};

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sets, setSets] = useState<PublicSet[]>([]);
  const [productPhotos, setProductPhotos] = useState<ProductPhoto[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Own-profile edit states
  const [showSettings, setShowSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Follow modals
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<FollowList[]>([]);
  const [followingList, setFollowingList] = useState<FollowList[]>([]);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [profileRes, setsRes, followersRes, followingRes, productsRes] = await Promise.all([
        // Usa profiles_public (view sem monthly_budget) para dados de outros usuários
        (supabase.from("profiles_public" as any) as any).select("user_id, display_name, avatar_url, bio").eq("user_id", userId).single(),
        (supabase.from("sets" as any) as any)
          .select("id, name, occasion, photo_url, likes_count")
          .eq("user_id", userId)
          .eq("is_public", true)
          .order("likes_count", { ascending: false }),
        (supabase.from("user_follows" as any) as any)
          .select("id", { count: "exact" })
          .eq("following_id", userId),
        (supabase.from("user_follows" as any) as any)
          .select("id", { count: "exact" })
          .eq("follower_id", userId),
        supabase.from("products")
          .select("id, name, photo_url")
          .eq("user_id", userId)
          .not("photo_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      if (profileRes.error || !profileRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileRes.data);
      setSets(setsRes.data ?? []);
      setFollowersCount(followersRes.count ?? 0);
      setFollowingCount(followingRes.count ?? 0);
      setProductPhotos((productsRes.data ?? []) as ProductPhoto[]);

      // Get total products count (including those without photos)
      const { count: totalProducts } = await supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("user_id", userId);
      setProductsCount(totalProducts ?? 0);

      if (user && !isOwnProfile) {
        const { data: followData } = await (supabase.from("user_follows" as any) as any)
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };
    load();
  }, [userId, user, isOwnProfile]);

  const toggleFollow = async () => {
    if (!user || !userId || isOwnProfile) return;
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowersCount((c) => c + (wasFollowing ? -1 : 1));
    if (wasFollowing) {
      await (supabase.from("user_follows" as any) as any).delete().eq("follower_id", user.id).eq("following_id", userId);
    } else {
      await (supabase.from("user_follows" as any) as any).insert({ follower_id: user.id, following_id: userId });
    }
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !userId) return;
    await supabase.from("profiles").update({ display_name: trimmed } as any).eq("user_id", userId);
    setProfile((p) => p ? { ...p, display_name: trimmed } : p);
    setEditingName(false);
    toast.success("Nome atualizado");
  };

  const saveBio = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ bio: bioInput } as any).eq("user_id", userId);
    setProfile((p) => p ? { ...p, bio: bioInput } : p);
    setEditingBio(false);
    toast.success("Bio atualizada");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    // Abre o modal de crop antes de fazer upload
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!userId) return;
    setCropImageSrc(null);
    setUploadingAvatar(true);
    try {
      // Converte Blob → File com metadados corretos para o storage
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const path = `avatars/${userId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("product-photos")
        .upload(path, file, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        throw uploadError;
      }
      const { data: urlData } = supabase.storage.from("product-photos").getPublicUrl(path);
      // Cache busting para forçar reload da imagem no browser
      const avatarUrlDisplay = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl } as any).eq("user_id", userId);
      setProfile((p) => p ? { ...p, avatar_url: avatarUrlDisplay } : p);
      toast.success("Foto atualizada!");
    } catch (err) {
      console.error("handleCropConfirm error:", err);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadFollowers = async () => {
    if (!userId) return;
    const { data } = await (supabase.from("user_follows" as any) as any).select("follower_id").eq("following_id", userId);
    if (!data?.length) { setFollowersList([]); return; }
    const ids = data.map((r: any) => r.follower_id);
    const { data: profiles } = await (supabase.from("profiles_public" as any) as any).select("user_id, display_name, avatar_url").in("user_id", ids);
    setFollowersList((profiles ?? []).map((p: any) => ({ ...p, id: p.user_id })));
  };

  const loadFollowing = async () => {
    if (!userId) return;
    const { data } = await (supabase.from("user_follows" as any) as any).select("following_id").eq("follower_id", userId);
    if (!data?.length) { setFollowingList([]); return; }
    const ids = data.map((r: any) => r.following_id);
    const { data: profiles } = await (supabase.from("profiles_public" as any) as any).select("user_id, display_name, avatar_url").in("user_id", ids);
    setFollowingList((profiles ?? []).map((p: any) => ({ ...p, id: p.user_id })));
  };

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-[1.5px] border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <Users className="w-12 h-12 text-muted-foreground/30 mb-4" strokeWidth={1.5} />
        <h1 className="font-display text-[22px] font-normal text-foreground mb-2">Perfil não encontrado</h1>
        <p className="font-body font-light text-[14px] text-muted-foreground">Este perfil não existe ou foi removido.</p>
      </div>
    );
  }

  // Prepare orbital photos — up to 8 shown
  const orbitPhotos = productPhotos.slice(0, 8);
  const orbitPositions = getOrbitalPositions(orbitPhotos.length, 125);

  return (
    <>
      <div className="min-h-screen pb-24 bg-background">
        <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
          <div className="flex items-center justify-between max-w-lg mx-auto px-4 h-full">
            {!isOwnProfile ? (
              <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-foreground">
                <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={1.5} />
              </button>
            ) : (
              <div className="w-8" />
            )}

            <span className="font-display text-[16px] font-normal text-foreground">
              {isOwnProfile ? "Meu Perfil" : (profile?.display_name || "Perfil")}
            </span>

            {isOwnProfile ? (
              <button
                onClick={() => setShowSettings(true)}
                className="w-8 h-8 flex items-center justify-center text-foreground"
              >
                <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>
        </header>

        <div className="max-w-lg mx-auto px-6">
          {/* ── Orbital hero ─────────────────────────────────── */}
          <div className="flex flex-col items-center pt-8 pb-2">
            {/* Orbital container */}
            <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>
              {/* Orbit rings */}
              <div
                className="absolute rounded-full border border-border/40"
                style={{ width: 240, height: 240 }}
              />
              <div
                className="absolute rounded-full border border-border/20"
                style={{ width: 290, height: 290 }}
              />

              {/* Orbital product photos */}
              {orbitPhotos.map((photo, i) => {
                const pos = orbitPositions[i];
                return (
                  <div
                    key={photo.id}
                    className="absolute rounded-full overflow-hidden border-2 border-background"
                    style={{
                      width: 52,
                      height: 52,
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                      boxShadow: "0 2px 8px rgba(26,23,20,0.12)",
                    }}
                  >
                    {photo.photo_url ? (
                      <ShimmerImage src={photo.photo_url} alt={photo.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Layers className="w-4 h-4 text-muted-foreground/40" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Center avatar — clickable to upload for own profile */}
              <div className="relative z-10">
                <div
                  className="w-[120px] h-[120px] rounded-full overflow-hidden border-[3px] border-background"
                  style={{ boxShadow: "0 4px 20px rgba(26,23,20,0.16)" }}
                >
                  {profile?.avatar_url ? (
                    <ShimmerImage src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="font-body font-medium text-[34px] text-muted-foreground">{initials}</span>
                    </div>
                  )}
                </div>

                {/* Upload button overlay — own profile only */}
                {isOwnProfile && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-background transition-opacity"
                      style={{ backgroundColor: "hsl(var(--foreground))" }}
                    >
                      {uploadingAvatar ? (
                        <div className="w-3.5 h-3.5 border border-background border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" style={{ color: "hsl(var(--background))" }} strokeWidth={2} />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Nudge to set display name */}
            {isOwnProfile && !editingName && (!profile?.display_name || profile.display_name === profile.user_id?.split("@")[0]) && (
              <button
                onClick={() => { setNameInput(""); setEditingName(true); }}
                className="flex items-center gap-2 mt-2 mb-1 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 transition-colors hover:bg-primary/15"
              >
                <Pencil className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <span className="font-body text-[13px] text-primary font-medium">
                  Adicione seu nome para que outros te encontrem!
                </span>
              </button>
            )}

            {/* Name */}
            {isOwnProfile && editingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={40}
                  className="h-9 text-[15px] bg-muted rounded-lg px-3 border border-border font-body text-foreground outline-none text-center"
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                />
                <button onClick={saveName} className="w-7 h-7 flex items-center justify-center text-foreground"><Check className="w-4 h-4" strokeWidth={2} /></button>
                <button onClick={() => setEditingName(false)} className="w-7 h-7 flex items-center justify-center text-muted-foreground"><X className="w-4 h-4" strokeWidth={2} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1">
                <h1 className="font-body font-medium text-[17px] text-foreground">
                  {profile?.display_name || "Adicionar nome"}
                </h1>
                {isOwnProfile && (
                  <button onClick={() => { setNameInput(profile?.display_name || ""); setEditingName(true); }}>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground/40" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            )}

            {/* Bio */}
            {isOwnProfile && editingBio ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  maxLength={80}
                  placeholder="Bio curta..."
                  className="h-9 text-[13px] bg-muted rounded-lg px-3 border border-border font-body text-foreground outline-none text-center w-[220px]"
                  onKeyDown={(e) => e.key === "Enter" && saveBio()}
                />
                <button onClick={saveBio} className="w-7 h-7 flex items-center justify-center text-foreground"><Check className="w-4 h-4" strokeWidth={2} /></button>
                <button onClick={() => setEditingBio(false)} className="w-7 h-7 flex items-center justify-center text-muted-foreground"><X className="w-4 h-4" strokeWidth={2} /></button>
              </div>
            ) : (
              <button
                className="flex items-center gap-1.5 mt-0.5"
                onClick={() => isOwnProfile && (setBioInput(profile?.bio || ""), setEditingBio(true))}
              >
                <span className="font-body font-light text-[13px] text-muted-foreground">
                  {profile?.bio || (isOwnProfile ? "Adicionar bio..." : "")}
                </span>
                {isOwnProfile && (
                  <Pencil className="w-3 h-3 text-muted-foreground/40" strokeWidth={1.5} />
                )}
              </button>
            )}

            {/* Follow button */}
            {!isOwnProfile && user && (
              <button
                onClick={toggleFollow}
                className="flex items-center gap-1.5 h-9 px-5 rounded-lg font-body text-[13px] font-medium transition-colors mt-3"
                style={{
                  backgroundColor: isFollowing ? "hsl(var(--muted))" : "hsl(var(--foreground))",
                  color: isFollowing ? "hsl(var(--muted-foreground))" : "hsl(var(--background))",
                }}
              >
                {isFollowing ? <><UserCheck className="w-3.5 h-3.5" /> Seguindo</> : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
              </button>
            )}
          </div>

          {/* ── Stats bar ─────────────────────────────────────── */}
          <div className="flex justify-around py-5 border-t border-b border-border mt-4 mb-6">
            <div className="text-center">
              <p className="font-body font-semibold text-[20px] text-foreground leading-tight">{productsCount}</p>
              <p className="label-overline mt-0.5">Produtos</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="font-body font-semibold text-[20px] text-foreground leading-tight">{sets.length}</p>
              <p className="label-overline mt-0.5">SETs</p>
            </div>
            <div className="w-px bg-border" />
            <button className="text-center" onClick={() => { setShowFollowers(true); loadFollowers(); }}>
              <p className="font-body font-semibold text-[20px] text-foreground leading-tight">{followersCount}</p>
              <p className="label-overline mt-0.5">Seguidores</p>
            </button>
            <div className="w-px bg-border" />
            <button className="text-center" onClick={() => { setShowFollowing(true); loadFollowing(); }}>
              <p className="font-body font-semibold text-[20px] text-foreground leading-tight">{followingCount}</p>
              <p className="label-overline mt-0.5">Seguindo</p>
            </button>
          </div>

          {/* ── Public SETs grid ──────────────────────────────── */}
          <p className="label-overline mb-3">SETs públicos</p>
          {sets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="w-9 h-9 text-muted-foreground/30 mb-3" strokeWidth={1.5} />
              <p className="font-body font-light text-[13px] text-muted-foreground">Nenhum SET público ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {sets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => navigate(`/sets/${set.id}`)}
                  className="rounded-xl overflow-hidden border border-border bg-card text-left transition-all active:scale-[0.98]"
                  style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}
                >
                  <div className="relative">
                    {set.photo_url ? (
                      <img src={set.photo_url} alt={set.name} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <Layers className="w-7 h-7 text-muted-foreground/30" strokeWidth={1.5} />
                      </div>
                    )}
                    {set.occasion && (
                      <span
                        className="absolute top-1.5 left-1.5 font-body text-[8px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm"
                        style={{ backgroundColor: "rgba(253,250,247,0.92)", color: "hsl(var(--foreground))" }}
                      >
                        {set.occasion}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-body font-medium text-[12px] text-foreground line-clamp-1">{set.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Heart className="w-2.5 h-2.5 text-muted-foreground" strokeWidth={1.5} />
                      <span className="font-body text-[10px] text-muted-foreground">{set.likes_count}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Followers modal */}
      {showFollowers && (
        <FollowModal
          title="Seguidores"
          list={followersList}
          onClose={() => setShowFollowers(false)}
          onNavigate={(uid) => { setShowFollowers(false); navigate(`/user/${uid}`); }}
        />
      )}

      {/* Following modal */}
      {showFollowing && (
        <FollowModal
          title="Seguindo"
          list={followingList}
          onClose={() => setShowFollowing(false)}
          onNavigate={(uid) => { setShowFollowing(false); navigate(`/user/${uid}`); }}
        />
      )}

      {/* Settings bottom sheet */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(26,23,20,0.4)" }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-lg bg-card rounded-t-2xl pb-8 overflow-hidden"
            style={{ boxShadow: "0 -4px 32px rgba(26,23,20,0.16)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-border" />
            </div>
            <div className="px-6 pt-3 pb-4">
              <p className="font-display text-[18px] font-normal text-foreground mb-4">Configurações</p>
              <div className="rounded-xl border border-border bg-background p-4 mb-4">
                <p className="label-overline mb-1">Conta</p>
                <p className="font-body font-light text-[13px] text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border font-body text-[14px] text-destructive border-destructive/30 hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Crop Modal */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
          }}
        />
      )}
    </>
  );
};

// ── Follow modal ────────────────────────────────────────────────
interface FollowModalProps {
  title: string;
  list: FollowList[];
  onClose: () => void;
  onNavigate: (userId: string) => void;
}

const FollowModal = ({ title, list, onClose, onNavigate }: FollowModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center"
    style={{ backgroundColor: "rgba(26,23,20,0.4)" }}
    onClick={onClose}
  >
    <div
      className="w-full max-w-lg bg-card rounded-t-2xl pb-8 overflow-hidden"
      style={{ boxShadow: "0 -4px 32px rgba(26,23,20,0.16)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-8 h-1 rounded-full bg-border" />
      </div>
      <div className="px-6 pt-3 pb-2">
        <p className="font-display text-[18px] font-normal text-foreground">{title}</p>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-6">
        {list.length === 0 ? (
          <p className="font-body font-light text-[13px] text-muted-foreground py-8 text-center">Nenhuma pessoa aqui ainda.</p>
        ) : (
          <div className="space-y-4 pt-2">
            {list.map((person) => {
              const initials = person.display_name
                ? person.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "?";
              return (
                <button key={person.id} className="flex items-center gap-3 w-full text-left" onClick={() => onNavigate(person.user_id)}>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-body font-medium text-[13px] text-muted-foreground">{initials}</span>
                    )}
                  </div>
                  <p className="font-body font-medium text-[14px] text-foreground">{person.display_name || "Usuária"}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default UserProfile;
