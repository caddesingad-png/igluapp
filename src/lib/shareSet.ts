interface ShareOptions {
  id: string;
  name: string;
  toast: (opts: { title: string; description?: string }) => void;
}

export const getSetUrl = (id: string) => {
  const base = window.location.origin;
  return `${base}/sets/${id}/public`;
};

export const shareSet = async ({ id, name, toast }: ShareOptions) => {
  const url = getSetUrl(id);

  // Try native share sheet first (works on mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: name,
        text: `Check out my beauty set "${name}" on Glambook`,
        url,
      });
      return;
    } catch (e) {
      // User cancelled or not supported – fall through to clipboard
      if ((e as Error).name === "AbortError") return;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: url });
  } catch {
    toast({ title: "Share link", description: url });
  }
};
