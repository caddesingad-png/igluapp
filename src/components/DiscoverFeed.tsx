import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, UserPlus, UserCheck, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 10;

const OCCASIONS = ["Dia", "Noite", "Trabalho", "Glam", "Natural", "Date"];

interface DiscoverSet {
  id: string;
  name: string;
  occasion: string | null;
  photo_url: string | null;
  likes_count: number;
  user_id: string;
  product_photos: (string | null)[];
  total_products: number;
  creator_name: string | null;
  creator_avatar: string | null;
}

const DiscoverFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sets, setSets] = useState<DiscoverSet[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const [likedSetIds, setLikedSetIds] = useState<Set<string>>(new Set());
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number, currentFilter: string | null, reset: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = (supabase.from("sets" as any) as any)
        .select("id, name, occasion, photo_url, likes_count, user_id, set_products(products(photo_url))")
        .eq("is_public", true)
        .range(from, to)
        .order("likes_count", { ascending: false });

      if (currentFilter) {
        query = query.ilike("occasion", `%${currentFilter}%`);
      }

      const { data, error } = await query;

      if (error || !data) {
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      const mapped: DiscoverSet[] = (data as any[]).map((s) => {
        const allProducts = s.set_products || [];
        const total = allProducts.length;
        return {
          id: s.id,
          name: s.name,
          occasion: s.occasion,
          photo_url: s.photo_url,
          likes_count: s.likes_count ?? 0,
          user_id: s.user_id,
          total_products: total,
          product_photos: allProducts.slice(0, 5).map((sp: any) => sp?.products?.photo_url ?? null),
          creator_name: null,
          creator_avatar: null,
        };
      });

      if (mapped.length < PAGE_SIZE) setHasMore(false);
      else setHasMore(true);

      const userIds = [...new Set(mapped.map((s) => s.user_id))];
      const setIds = mapped.map((s) => s.id);

      const [profilesRes, likesRes, followsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
        user ? (supabase.from("set_likes" as any) as any).select("set_id").eq("user_id", user.id).in("set_id", setIds) : Promise.resolve({ data: [] }),
        user ? (supabase.from("user_follows" as any) as any).select("following_id").eq("follower_id", user.id).in("following_id", userIds) : Promise.resolve({ data: [] }),
      ]);

      const profileMap: Record<string, { name: string | null; avatar: string | null }> = {};
      for (const p of profilesRes.data ?? []) {
        profileMap[p.user_id] = { name: p.display_name, avatar: p.avatar_url };
      }

      const finalMapped = mapped.map((s) => ({
        ...s,
        creator_name: profileMap[s.user_id]?.name ?? null,
        creator_avatar: profileMap[s.user_id]?.avatar ?? null,
      }));

      const newLikedIds = new Set<string>((likesRes.data ?? []).map((r: any) => r.set_id as string));
      const newFollowedIds = new Set<string>((followsRes.data ?? []).map((r: any) => r.following_id as string));

      if (reset) {
        setSets(finalMapped);
        setLikedSetIds(newLikedIds);
        setFollowedUserIds(newFollowedIds);
      } else {
        setSets((prev) => [...prev, ...finalMapped]);
        setLikedSetIds((prev) => new Set<string>([...prev, ...newLikedIds]));
        setFollowedUserIds((prev) => new Set<string>([...prev, ...newFollowedIds]));
      }

      setInitialLoad(false);
      setLoading(false);
      loadingRef.current = false;
    },
    [user]
  );

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setInitialLoad(true);
    fetchPage(0, filter, true);
  }, [filter, fetchPage]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPage(nextPage, filter, false);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [page, hasMore, filter, fetchPage]);

  const toggleLike = async (set: DiscoverSet, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const liked = likedSetIds.has(set.id);

    setLikedSetIds((prev) => {
      const next = new Set(prev);
      liked ? next.delete(set.id) : next.add(set.id);
      return next;
    });
    setSets((prev) =>
      prev.map((s) =>
        s.id === set.id ? { ...s, likes_count: s.likes_count + (liked ? -1 : 1) } : s
      )
    );

    if (liked) {
      await (supabase.from("set_likes" as any) as any).delete().eq("user_id", user.id).eq("set_id", set.id);
    } else {
      await (supabase.from("set_likes" as any) as any).insert({ user_id: user.id, set_id: set.id });
    }
  };

  const toggleFollow = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || userId === user.id) return;
    const followed = followedUserIds.has(userId);

    setFollowedUserIds((prev) => {
      const next = new Set(prev);
      followed ? next.delete(userId) : next.add(userId);
      return next;
    });

    if (followed) {
      await (supabase.from("user_follows" as any) as any).delete().eq("follower_id", user.id).eq("following_id", userId);
    } else {
      await (supabase.from("user_follows" as any) as any).insert({ follower_id: user.id, following_id: userId });
    }
  };

  return (
    <div className="px-6 pt-4 pb-4">
      {/* Occasion filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
        <button
          onClick={() => setFilter(null)}
          className="shrink-0 h-8 px-3.5 rounded-sm font-body text-[12px] uppercase tracking-[0.08em] transition-colors"
          style={{
            backgroundColor: !filter ? "hsl(var(--foreground))" : "hsl(var(--muted))",
            color: !filter ? "hsl(var(--btn-primary-fg))" : "hsl(var(--muted-foreground))",
          }}
        >
          Todos
        </button>
        {OCCASIONS.map((occ) => (
          <button
            key={occ}
            onClick={() => setFilter(occ === filter ? null : occ)}
            className="shrink-0 h-8 px-3.5 rounded-sm font-body text-[12px] uppercase tracking-[0.08em] transition-colors"
            style={{
              backgroundColor: filter === occ ? "hsl(var(--foreground))" : "hsl(var(--muted))",
              color: filter === occ ? "hsl(var(--btn-primary-fg))" : "hsl(var(--muted-foreground))",
            }}
          >
            {occ}
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      {initialLoad ? (
        <div className="flex justify-center pt-16">
          <div className="w-6 h-6 border-[1.5px] border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <Layers className="w-9 h-9 text-muted-foreground/30 mb-3" strokeWidth={1.5} />
          <p className="font-body font-light text-[13px] text-muted-foreground">Nenhum set público encontrado</p>
        </div>
      ) : (
        <div className="columns-2 gap-3">
          {sets.map((set) => {
            const liked = likedSetIds.has(set.id);
            const followed = followedUserIds.has(set.user_id);
            const isOwn = user?.id === set.user_id;

            return (
              <div
                key={set.id}
                className="break-inside-avoid mb-3 rounded-xl bg-card overflow-hidden cursor-pointer"
                style={{ boxShadow: "0 1px 3px rgba(26,23,20,0.06)", border: "1px solid hsl(var(--border))" }}
                onClick={() => navigate(`/sets/${set.id}`)}
              >
                {/* Polaroid-style padded photo */}
                <div className="p-2 pb-1">
                  <div className="relative rounded-[8px] overflow-hidden">
                    {set.photo_url ? (
                      <img
                        src={set.photo_url}
                        alt={set.name}
                        className="w-full aspect-[4/5] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[4/5] bg-muted flex items-center justify-center">
                        <Layers className="w-7 h-7 text-muted-foreground/30" strokeWidth={1.5} />
                      </div>
                    )}

                    {/* Occasion badge — top left */}
                    {set.occasion && (
                      <div className="absolute top-1.5 left-1.5">
                        <span
                          className="font-body text-[8px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm"
                          style={{ backgroundColor: "rgba(253,250,247,0.92)", color: "hsl(var(--foreground))" }}
                        >
                          {set.occasion}
                        </span>
                      </div>
                    )}

                    {/* Like — top right */}
                    <button
                      onClick={(e) => toggleLike(set, e)}
                      className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm"
                      style={{ backgroundColor: "rgba(253,250,247,0.88)" }}
                    >
                      <Heart
                        className="w-3 h-3 transition-colors"
                        style={{
                          fill: liked ? "hsl(var(--primary))" : "none",
                          color: liked ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                        }}
                        strokeWidth={1.5}
                      />
                      <span className="font-body text-[9px] text-muted-foreground">{set.likes_count}</span>
                    </button>
                  </div>

                  {/* Style capsule — 4 products + "+X more" slot */}
                  {set.total_products > 0 && (
                    <div className="mt-2">
                      <p className="font-body text-[8px] uppercase tracking-[0.08em] text-muted-foreground mb-1">
                        Produtos usados
                      </p>
                      <div className="flex gap-1">
                        {/* Show up to 4 product photos — fixed small size */}
                        {Array.from({ length: Math.min(4, set.total_products) }).map((_, i) => {
                          const photo = set.product_photos[i];
                          return photo ? (
                            <img
                              key={i}
                              src={photo}
                              alt=""
                              className="w-9 h-9 object-cover rounded-[4px] shrink-0"
                            />
                          ) : (
                            <div
                              key={i}
                              className="w-9 h-9 rounded-[4px] bg-muted shrink-0"
                            />
                          );
                        })}

                        {/* "+X" overflow slot */}
                        {set.total_products > 4 && (
                          <div
                            className="w-9 h-9 rounded-[4px] shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: "hsl(var(--foreground))" }}
                          >
                            <span
                              className="font-body font-medium leading-none"
                              style={{ fontSize: "9px", color: "hsl(var(--btn-primary-fg))" }}
                            >
                              +{set.total_products - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Set name */}
                  <p className="font-body font-medium text-[12px] text-foreground leading-snug line-clamp-2 mt-2">
                    {set.name}
                  </p>
                </div>

                {/* Creator row */}
                <div
                  className="flex items-center justify-between px-2 pb-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex items-center gap-1 min-w-0"
                    onClick={(e) => { e.stopPropagation(); navigate(`/user/${set.user_id}`); }}
                  >
                    {set.creator_avatar ? (
                      <img src={set.creator_avatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="font-body text-[7px] text-muted-foreground font-medium">
                          {(set.creator_name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="font-body text-[9px] text-muted-foreground truncate">
                      {set.creator_name || "Usuária"}
                    </span>
                  </button>

                  {!isOwn && (
                    <button
                      onClick={(e) => toggleFollow(set.user_id, e)}
                      className="shrink-0 flex items-center gap-0.5 h-5 px-1.5 rounded-sm font-body text-[8px] font-medium transition-colors"
                      style={{
                        backgroundColor: followed ? "hsl(var(--muted))" : "hsl(var(--foreground))",
                        color: followed ? "hsl(var(--muted-foreground))" : "hsl(var(--btn-primary-fg))",
                      }}
                    >
                      {followed ? <UserCheck className="w-2.5 h-2.5" /> : <UserPlus className="w-2.5 h-2.5" />}
                      {followed ? "Seguindo" : "Seguir"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} className="h-8" />
      {loading && !initialLoad && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-[1.5px] border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default DiscoverFeed;
