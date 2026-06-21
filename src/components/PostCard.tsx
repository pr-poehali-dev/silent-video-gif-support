import { useState } from 'react';
import Icon from '@/components/ui/icon';
import PostMedia from '@/components/PostMedia';
import { addComment, fetchComments, likePost, type Comment, type Post } from '@/lib/api';

const likedKey = (id: number) => `liked-${id}`;

const PostCard = ({ post }: { post: Post }) => {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(() => !!localStorage.getItem(likedKey(post.id)));
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const onLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikes((n) => n + 1);
    localStorage.setItem(likedKey(post.id), '1');
    const real = await likePost(post.id);
    setLikes(real);
  };

  const toggleComments = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      const list = await fetchComments(post.id);
      setComments(list);
      setLoaded(true);
    }
  };

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const c = await addComment(post.id, author.trim() || 'Гость', text.trim());
    if (c) {
      setComments((prev) => [c, ...prev]);
      setText('');
    }
    setSending(false);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card animate-fade-in">
      {post.media_url && (
        <div className="p-3 pb-0">
          <PostMedia post={post} />
        </div>
      )}
      <div className="p-5">
        {post.title && <h2 className="font-display text-2xl font-semibold leading-tight">{post.title}</h2>}
        {post.body_text && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{post.body_text}</p>}

        {post.buttons.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.buttons.map((b, i) => (
              <a
                key={i}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-mint-soft px-4 py-2 text-sm font-medium text-mint-foreground transition-transform hover:scale-[1.03]"
              >
                {b.image_url && <img src={b.image_url} alt="" className="h-5 w-5 rounded-full object-cover" />}
                {b.label || 'Открыть'}
                <Icon name="ArrowUpRight" size={14} />
              </a>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-sm">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name="Heart" size={18} className={liked ? 'fill-rose-500' : ''} />
            {likes}
          </button>
          <button onClick={toggleComments} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <Icon name="MessageCircle" size={18} />
            {post.comment_count + (loaded ? comments.length - post.comment_count : 0)}
          </button>
          <span className="ml-auto text-xs text-muted-foreground">{post.created_at}</span>
        </div>

        {open && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-2 rounded-xl bg-secondary p-3">
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ваше имя (необязательно)"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-mint"
              />
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="Написать комментарий…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-mint"
                />
                <button
                  onClick={submit}
                  disabled={sending}
                  className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-mint-foreground disabled:opacity-50"
                >
                  <Icon name="Send" size={16} />
                </button>
              </div>
            </div>
            {comments.map((c) => (
              <div key={c.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.author}</span>
                  <span className="text-xs text-muted-foreground">{c.created_at}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.body_text}</p>
              </div>
            ))}
            {loaded && comments.length === 0 && (
              <p className="py-2 text-center text-sm text-muted-foreground">Пока нет комментариев. Будьте первым!</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;
