-- 1. Add likes_count to sets
ALTER TABLE public.sets ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- 2. Add bio to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL;

-- 3. Make profiles publicly viewable (drop restrictive SELECT, add public)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);

-- 4. Create set_likes table
CREATE TABLE IF NOT EXISTS public.set_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  set_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, set_id)
);
ALTER TABLE public.set_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view set likes" ON public.set_likes FOR SELECT USING (true);
CREATE POLICY "Users can like sets" ON public.set_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike sets" ON public.set_likes FOR DELETE USING (auth.uid() = user_id);

-- 5. Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

-- 6. Trigger to keep likes_count in sync
CREATE OR REPLACE FUNCTION public.update_set_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.sets SET likes_count = likes_count + 1 WHERE id = NEW.set_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.sets SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.set_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_likes_count_trigger
AFTER INSERT OR DELETE ON public.set_likes
FOR EACH ROW EXECUTE FUNCTION public.update_set_likes_count();
