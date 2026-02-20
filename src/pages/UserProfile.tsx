import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Layers, UserCheck, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

interface FollowList {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  user_id: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sets, setSets] = useState<PublicSet[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modal states
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<FollowList[]>([]);
  const [followingList, setFollowingList] = useState<FollowList[]>([]);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [profileRes, setsRes, followersRes, followingRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url, bio").eq("user_id", userId).single(),
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
      await (supabase.from("user_follows" as any) as any)
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
    } else {
      await (supabase.from("user_follows" as any) as any)
        .insert({ follower_id: user.id, following_id: userId });
    }
  };

  const loadFollowers = async () => {
    if (!userId) return;
    const { data } = await (supabase.from("user_follows" as any) as any)
      .select("follower_id")
      .eq("following_id", userId);
    if (!data?.length) { setFollowersList([]); return; }
    const ids = data.map((r: any) => r.follower_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
    setFollowersList((profiles ?? []).map((p: any) => ({ ...p, id: p.user_id })));
  };

  const loadFollowing = async () => {
    if (!userId) return;
    const { data } = await (supabase.from("user_follows" as any) as any)
      .select("following_id")
      .eq("follower_id", userId);
    if (!data?.length) { setFollowingList([]); return; }
    const ids = data.map((r: any) => r.following_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
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

  return (
    <>
      <div className="min-h-screen pb-24 bg-background">
        <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
          <div className="flex items-center justify-between max-w-lg mx-auto px-4 h-full">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-foreground">
              <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={1.5} />
            </button>
            <span className="font-display text-[16px] font-normal text-foreground">
              {profile?.display_name || "Perfil"}
            </span>
            <div className="w-8" />
          </div>
        </header>

        <div className="max-w-lg mx-auto px-6 pt-6">
          {/* Avatar + name + bio */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-body font-medium text-[20px] text-muted-foreground">{initials}</span>
                )}
              </div>
              <div>
                <h1 className="font-body font-medium text-[17px] text-foreground">
                  {profile?.display_name || "Usuária"}
                </h1>
                {profile?.bio && (
                  <p className="font-body font-light text-[13px] text-muted-foreground mt-0.5 leading-relaxed max-w-[220px]">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Follow button — só aparece para outros perfis */}
            {!isOwnProfile && user && (
              <button
                onClick={toggleFollow}
                className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-lg font-body text-[13px] font-medium transition-colors"
                style={{
                  backgroundColor: isFollowing ? "hsl(var(--muted))" : "hsl(var(--foreground))",
                  color: isFollowing ? "hsl(var(--muted-foreground))" : "hsl(var(--btn-primary-fg))",
                }}
              >
                {isFollowing ? (
                  <><UserCheck className="w-3.5 h-3.5" /> Seguindo</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5" /> Seguir</>
                )}
              </button>
            )}

            {isOwnProfile && (
              <button
                onClick={() => navigate("/profile")}
                className="shrink-0 h-9 px-4 rounded-lg border border-border font-body text-[13px] text-muted-foreground transition-colors hover:bg-muted"
              >
                Editar perfil
              </button>
            )}
          </div>

          {/* Counters */}
          <div className="flex gap-6 mb-6">
            <div className="text-center">
              <p className="font-body font-medium text-[18px] text-foreground">{sets.length}</p>
              <p className="label-overline">SETs</p>
            </div>
            <button
              className="text-center"
              onClick={() => { setShowFollowers(true); loadFollowers(); }}
            >
              <p className="font-body font-medium text-[18px] text-foreground">{followersCount}</p>
              <p className="label-overline">Seguidores</p>
            </button>
            <button
              className="text-center"
              onClick={() => { setShowFollowing(true); loadFollowing(); }}
            >
              <p className="font-body font-medium text-[18px] text-foreground">{followingCount}</p>
              <p className="label-overline">Seguindo</p>
            </button>
          </div>

          {/* Public SETs grid */}
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
                  {/* Cover */}
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
                  {/* Info */}
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
    </>
  );
};

// ── Mini modal list ──────────────────────────────────────────────
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
      {/* Handle */}
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
                <button
                  key={person.id}
                  className="flex items-center gap-3 w-full text-left"
                  onClick={() => onNavigate(person.user_id)}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-body font-medium text-[13px] text-muted-foreground">{initials}</span>
                    )}
                  </div>
                  <p className="font-body font-medium text-[14px] text-foreground">
                    {person.display_name || "Usuária"}
                  </p>
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
