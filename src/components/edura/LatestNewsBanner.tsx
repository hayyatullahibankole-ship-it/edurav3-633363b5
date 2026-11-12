import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Megaphone, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Post = { id: string; title: string; slug: string; published_at: string | null };
const DISMISS_KEY = "edura-dismissed-news";
const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export default function LatestNewsBanner() {
  const [post, setPost] = useState<Post | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(DISMISS_KEY) : null,
  );

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id,title,slug,published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data && setPost(data as Post));
  }, []);

  if (!post || dismissed === post.id) return null;
  const isNew = post.published_at && Date.now() - new Date(post.published_at).getTime() < NEW_WINDOW_MS;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, post.id);
    setDismissed(post.id);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm animate-screen-in">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Megaphone className="h-5 w-5" />
      </div>
      <Link to={`/blog/${post.slug}`} className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
          {isNew ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              Breaking news
            </>
          ) : (
            "Latest news"
          )}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">{post.title}</p>
      </Link>
      <Link to={`/blog/${post.slug}`} aria-label="Read post" className="text-muted-foreground">
        <ChevronRight className="h-5 w-5" />
      </Link>
      <button onClick={dismiss} aria-label="Dismiss news" className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
