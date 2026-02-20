import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Pencil, Share2, Heart, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { shareSet } from "@/lib/shareSet";
import { useToast } from "@/hooks/use-toast";

interface SetData {
  id: string;
  name: string;
  occasion: string | null;
  photo_url: string | null;
  is_public: boolean;
  user_id: string;
  likes_count?: number;
}

interface SetProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  photo_url: string | null;
}

interface CreatorProfile {
  display_name: string | null;
  avatar_url: string | null;
}

const SetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [set, setSet] = useState<SetData | null>(null);
  const [products, setProducts] = useState<SetProduct[]>([]);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Like / follow state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [setRes, prodRes] = await Promise.all([
        (supabase.from("sets" as any) as any).select("*").eq("id", id).single(),
        (supabase.from("set_products" as any) as any)
          .select("product_id, products(id, name, brand, category, photo_url)")
          .eq("set_id", id),
      ]);

      if (setRes.data) {
        setSet(setRes.data);
        setLikesCount(setRes.data.likes_count ?? 0);

        // Fetch creator profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", setRes.data.user_id)
          .single();
        if (profileData) setCreator(profileData);

        // If logged in and not owner, check like/follow
        if (user && user.id !== setRes.data.user_id) {
          const [likeRes, followRes] = await Promise.all([
            (supabase.from("set_likes" as any) as any)
              .select("id")
              .eq("user_id", user.id)
              .eq("set_id", id)
              .maybeSingle(),
            (supabase.from("user_follows" as any) as any)
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", setRes.data.user_id)
              .maybeSingle(),
          ]);
          setLiked(!!likeRes.data);
          setFollowed(!!followRes.data);
        }
      }

      if (prodRes.data) {
        setProducts((prodRes.data as any[]).map((r) => r.products).filter(Boolean));
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const handleShare = async () => {
    if (!set) return;
    if (!set.is_public) {
      await (supabase.from("sets" as any) as any).update({ is_public: true }).eq("id", set.id);
      setSet((s) => s ? { ...s, is_public: true } : s);
    }
    await shareSet({ id: set.id, name: set.name, toast });
  };

  const toggleLike = async () => {
    if (!user || !set) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => c + (wasLiked ? -1 : 1));

    if (wasLiked) {
      await (supabase.from("set_likes" as any) as any)
        .delete()
        .eq("user_id", user.id)
        .eq("set_id", set.id);
    } else {
      await (supabase.from("set_likes" as any) as any)
        .insert({ user_id: user.id, set_id: set.id });
    }
  };

  const toggleFollow = async () => {
    if (!user || !set) return;
    const wasFollowed = followed;
    setFollowed(!wasFollowed);

    if (wasFollowed) {
      await (supabase.from("user_follows" as any) as any)
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", set.user_id);
    } else {
      await (supabase.from("user_follows" as any) as any)
        .insert({ follower_id: user.id, following_id: set.user_id });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Set not found.</p>
      </div>
    );
  }

  const isOwner = user?.id === set.user_id;

  return (
    <div className="min-h-screen pb-10 bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-1">
            {/* Like button — always shown for non-owners */}
            {!isOwner && user && (
              <button
                onClick={toggleLike}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors"
              >
                <Heart
                  className={`w-4.5 h-4.5 transition-all ${liked ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"}`}
                />
                <span className="text-xs text-muted-foreground">{likesCount}</span>
              </button>
            )}
            {isOwner && (
              <>
                <span className="text-xs text-muted-foreground flex items-center gap-1 px-2">
                  <Heart className="w-3.5 h-3.5" /> {likesCount}
                </span>
                <Button variant="ghost" size="icon" onClick={handleShare}>
                  <Share2 className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate(`/sets/${set.id}/edit`)}>
                  <Pencil className="w-5 h-5 text-muted-foreground" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Cover photo — square */}
        {set.photo_url && (
          <div className="flex justify-center px-4 pt-4">
            <img
              src={set.photo_url}
              alt={set.name}
              className="w-48 h-48 object-cover rounded-2xl shadow-sm"
            />
          </div>
        )}

        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            {set.is_public ? (
              <Globe className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {set.is_public ? "Set público" : "Set privado"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{set.name}</h1>
          {set.occasion && <p className="text-muted-foreground mt-1">{set.occasion}</p>}

          {/* Creator info + Follow (non-owner) */}
          {!isOwner && creator && (
            <div className="flex items-center justify-between mt-4 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {(creator.display_name || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{creator.display_name || "Usuária"}</p>
                  <p className="text-xs text-muted-foreground">Criadora</p>
                </div>
              </div>
              {user && (
                <button
                  onClick={toggleFollow}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    followed
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {followed ? (
                    <><UserCheck className="w-3 h-3" /> Seguindo</>
                  ) : (
                    <><UserPlus className="w-3 h-3" /> Seguir</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {products.length} produto{products.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {products.map((p) => (
              <button
                key={p.id}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                onClick={() => isOwner && navigate(`/product/${p.id}`)}
              >
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.brand}</p>
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum produto neste set ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetDetail;
