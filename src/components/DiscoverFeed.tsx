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

      const mapped: DiscoverSet[] = (data as any[]).map((s) => ({
        id: s.id,
        name: s.name,
        occasion: s.occasion,
        photo_url: s.photo_url,
        likes_count: s.likes_count ?? 0,
        user_id: s.user_id,
        product_photos: (s.set_products || []).slice(0, 6).map((sp: any) => sp?.products?.photo_url ?? null),
        creator_name: null,
        creator_avatar: null,
      }));

      if (mapped.length < PAGE_SIZE) setHasMore(false);
      else setHasMore(true);

      // Batch-fetch profiles, likes, follows
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

  // Initial load + filter change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setInitialLoad(true);
    fetchPage(0, filter, true);
  }, [filter, fetchPage]);

  // Infinite scroll
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

    // Optimistic update
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
      await (supabase.from("set_likes" as any) as any)
        .delete()
        .eq("user_id", user.id)
        .eq("set_id", set.id);
    } else {
      await (supabase.from("set_likes" as any) as any)
        .insert({ user_id: user.id, set_id: set.id });
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
      await (supabase.from("user_follows" as any) as any)
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
    } else {
      await (supabase.from("user_follows" as any) as any)
        .insert({ follower_id: user.id, following_id: userId });
    }
  };

  return (
    <div className="px-4 pt-3 pb-4">
      {/* Occasion filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
        <button
          onClick={() => setFilter(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${!filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          Todos
        </button>
        {OCCASIONS.map((occ) => (
          <button
            key={occ}
            onClick={() => setFilter(occ === filter ? null : occ)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === occ ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {occ}
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      {initialLoad ? (
        <div className="flex justify-center pt-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <Layers className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum set público encontrado</p>
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
                className="break-inside-avoid mb-3 rounded-2xl border border-border bg-card overflow-hidden cursor-pointer"
                onClick={() => navigate(`/sets/${set.id}`)}
              >
                {/* Cover photo */}
                {set.photo_url ? (
                  <img
                    src={set.photo_url}
                    alt={set.name}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted/50 grid grid-cols-2 gap-0.5 p-0.5">
                    {Array.from({ length: 4 }).map((_, i) => {
                      const photo = set.product_photos[i];
                      return photo ? (
                        <img key={i} src={photo} alt="" className="w-full aspect-square object-cover" />
                      ) : (
                        <div key={i} className="w-full aspect-square bg-muted" />
                      );
                    })}
                  </div>
                )}

                {/* Product strip (if has cover photo) */}
                {set.photo_url && set.product_photos.some(Boolean) && (
                  <div className="flex gap-0.5 p-0.5 bg-muted/30">
                    {Array.from({ length: 3 }).map((_, i) => {
                      const photo = set.product_photos[i];
                      return photo ? (
                        <img key={i} src={photo} alt="" className="flex-1 aspect-square object-cover rounded-sm" />
                      ) : (
                        <div key={i} className="flex-1 aspect-square rounded-sm bg-muted" />
                      );
                    })}
                  </div>
                )}

                {/* Info */}
                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug flex-1">{set.name}</p>
                    <button
                      onClick={(e) => toggleLike(set, e)}
                      className="shrink-0 flex items-center gap-0.5 mt-0.5"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${liked ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`}
                      />
                      <span className="text-[10px] text-muted-foreground">{set.likes_count}</span>
                    </button>
                  </div>

                  {set.occasion && (
                    <p className="text-[10px] text-muted-foreground mb-2">{set.occasion}</p>
                  )}

                  {/* Creator row */}
                  <div className="flex items-center gap-1.5 justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-bold text-primary">
                          {(set.creator_name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {set.creator_name || "Usuária"}
                      </span>
                    </div>
                    {!isOwn && (
                      <button
                        onClick={(e) => toggleFollow(set.user_id, e)}
                        className={`shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-colors ${
                          followed
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {followed ? (
                          <UserCheck className="w-2.5 h-2.5" />
                        ) : (
                          <UserPlus className="w-2.5 h-2.5" />
                        )}
                        {followed ? "Seguindo" : "Seguir"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8" />
      {loading && !initialLoad && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default DiscoverFeed;
