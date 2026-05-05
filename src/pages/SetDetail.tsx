import { useEffect, useState } from "react";
import ShimmerImage from "@/components/ShimmerImage";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Pencil, Share2, Heart, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { shareSet } from "@/lib/shareSet";
import { useToast } from "@/hooks/use-toast";
import SkeletonSetDetail from "@/components/SkeletonSetDetail";

interface SetLayer {
  id: string;
  layer_order: number;
  layer_name: string;
  layer_icon: string;
  product_ids: string[];
  note: string | null;
}

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

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [followed, setFollowed] = useState(false);
  const [layers, setLayers] = useState<SetLayer[]>([]);

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

        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", setRes.data.user_id)
          .single();
        if (profileData) setCreator(profileData);

        if (user && user.id !== setRes.data.user_id) {
          const [likeRes, followRes] = await Promise.all([
            (supabase.from("set_likes" as any) as any)
              .select("id").eq("user_id", user.id).eq("set_id", id).maybeSingle(),
            (supabase.from("user_follows" as any) as any)
              .select("id").eq("follower_id", user.id).eq("following_id", setRes.data.user_id).maybeSingle(),
          ]);
          setLiked(!!likeRes.data);
          setFollowed(!!followRes.data);
        }
      }

      if (prodRes.data) {
        setProducts((prodRes.data as any[]).map((r) => r.products).filter(Boolean));
      }

      // Load layers
      const { data: layerData } = await (supabase.from("set_layers" as any) as any)
        .select("*")
        .eq("set_id", id)
        .order("layer_order");
      setLayers(layerData ?? []);

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
      await (supabase.from("set_likes" as any) as any).delete().eq("user_id", user.id).eq("set_id", set.id);
    } else {
      await (supabase.from("set_likes" as any) as any).insert({ user_id: user.id, set_id: set.id });
    }
  };

  const toggleFollow = async () => {
    if (!user || !set) return;
    const wasFollowed = followed;
    setFollowed(!wasFollowed);
    if (wasFollowed) {
      await (supabase.from("user_follows" as any) as any).delete().eq("follower_id", user.id).eq("following_id", set.user_id);
    } else {
      await (supabase.from("user_follows" as any) as any).insert({ follower_id: user.id, following_id: set.user_id });
    }
  };

  if (loading) {
    return <SkeletonSetDetail />;
  }

  if (!set) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-body text-muted-foreground">Set não encontrado.</p>
      </div>
    );
  }

  const isOwner = user?.id === set.user_id;

  return (
    <div className="min-h-screen pb-10 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 h-full">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-foreground">
            <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-1">
            {!isOwner && user && (
              <button onClick={toggleLike} className="flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors">
                <Heart
                  className={`w-[18px] h-[18px] transition-all ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  strokeWidth={1.5}
                />
                <span className="font-body text-[12px] text-muted-foreground">{likesCount}</span>
              </button>
            )}
            {isOwner && (
              <>
                <span className="font-body text-[12px] text-muted-foreground flex items-center gap-1 px-2">
                  <Heart className="w-3.5 h-3.5" strokeWidth={1.5} /> {likesCount}
                </span>
                <button onClick={handleShare} className="w-8 h-8 flex items-center justify-center text-foreground">
                  <Share2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
                <button onClick={() => navigate(`/sets/${set.id}/edit`)} className="w-8 h-8 flex items-center justify-center text-foreground">
                  <Pencil className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {set.photo_url && (
          <div className="flex justify-center px-6 pt-6">
            <div className="w-48 h-48 rounded-xl overflow-hidden relative" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
              <ShimmerImage src={set.photo_url} alt={set.name} className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center gap-1.5 mb-1">
            {set.is_public ? (
              <Globe className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            )}
            <span className="label-overline">{set.is_public ? "Set público" : "Set privado"}</span>
          </div>
          <h1 className="font-display text-[26px] font-normal text-foreground">{set.name}</h1>
          {set.occasion && <p className="font-body font-light text-[14px] text-muted-foreground mt-1">{set.occasion}</p>}

          {/* Creator row */}
          {!isOwner && creator && (
            <div className="flex items-center justify-between mt-4 p-4 rounded-xl border border-border bg-card" style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}>
              <button
                className="flex items-center gap-2.5"
                onClick={() => set && navigate(`/user/${set.user_id}`)}
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {creator.avatar_url ? (
                    <ShimmerImage src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-body font-medium text-[13px] text-muted-foreground">
                      {(creator.display_name || "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-body font-medium text-[13px] text-foreground">{creator.display_name || "Usuária"}</p>
                  <p className="label-overline">Criadora</p>
                </div>
              </button>
              {user && (
                <button
                  onClick={toggleFollow}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-md font-body text-[12px] font-medium transition-colors ${
                    followed
                      ? "bg-muted text-muted-foreground border border-border"
                      : "bg-foreground text-btn-dark-fg"
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

        <div className="px-6">
          <p className="label-overline mb-3">
            {products.length} produto{products.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {products.map((p) => (
              <button
                key={p.id}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors"
                style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)" }}
                onClick={() => isOwner && navigate(`/product/${p.id}`)}
              >
                {p.photo_url ? (
                  <div className="w-11 h-11 rounded-[8px] overflow-hidden shrink-0 relative">
                    <ShimmerImage src={p.photo_url} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-[8px] bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-body font-medium text-[13px] text-foreground truncate">{p.name}</p>
                  <p className="font-body font-light text-[11px] text-muted-foreground uppercase tracking-[0.06em] truncate">{p.brand}</p>
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <p className="font-body font-light text-[13px] text-muted-foreground py-4 text-center">Nenhum produto neste set ainda.</p>
            )}
          </div>
        </div>

        {/* ── CAMADAS (read-only) ── */}
        {layers.length > 0 && (
          <div className="px-6 mt-6">
            <p className="label-overline mb-4">
              Camadas
            </p>

            <div className="relative">
              {/* Timeline vertical line */}
              <div
                className="absolute left-[11px] top-0 bottom-0 w-px bg-border"
              />

              <div className="space-y-0">
                {layers.map((layer, idx) => {
                  const layerProducts = products.filter((p) => layer.product_ids.includes(p.id));
                  return (
                    <div key={layer.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className="absolute left-0 top-4 w-[23px] h-[23px] rounded-full flex items-center justify-center text-[11px] bg-background border border-border"
                        style={{ zIndex: 1 }}
                      >
                        <span>{layer.layer_icon}</span>
                      </div>

                      {/* Content */}
                      <div className="pl-10 pb-5">
                        {/* Layer header */}
                        <div className="flex items-center gap-1.5 pt-3.5 mb-2">
                          <span className="font-body text-[11px] text-muted-foreground mr-0.5">
                            {layer.layer_order}
                          </span>
                          <p className="font-body text-[13px] font-medium text-foreground uppercase tracking-[0.05em]">
                            {layer.layer_name}
                          </p>
                        </div>

                        {/* Product chips */}
                        {layerProducts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {layerProducts.map((p) => (
                              <button
                                key={p.id}
                                className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 hover:bg-muted/80 transition-colors"
                                onClick={() => isOwner && navigate(`/product/${p.id}`)}
                              >
                                {p.photo_url && (
                                  <div className="w-4 h-4 rounded-full overflow-hidden relative">
                                    <ShimmerImage src={p.photo_url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <span className="font-body text-[12px] text-foreground">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Note */}
                        {layer.note && (
                          <p className="font-body text-[13px] font-light italic text-muted-foreground">
                            {layer.note}
                          </p>
                        )}

                        {/* Divider (not after last) */}
                        {idx < layers.length - 1 && (
                          <div className="mt-4 h-px bg-border" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetDetail;
