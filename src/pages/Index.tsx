import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import PostCard from '@/components/PostCard';
import PostMedia from '@/components/PostMedia';
import AdminPanel from '@/components/AdminPanel';
import { fetchPosts, type Post } from '@/lib/api';

type View = 'feed' | 'gallery' | 'login' | 'admin';

const ADMIN_PASSWORD = 'Iwaqq2';

const Index = () => {
  const [view, setView] = useState<View>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await fetchPosts());
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tryLogin = () => {
    if (pwd === ADMIN_PASSWORD) {
      setView('admin');
      setPwdError(false);
    } else {
      setPwdError(true);
    }
  };

  const galleryItems = posts.filter((p) => p.media_url);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-mint">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={() => setView('feed')} className="flex items-center gap-2 text-mint-foreground">
            <Icon name="Aperture" size={22} />
            <span className="font-display text-2xl font-semibold tracking-tight">Studio.m</span>
          </button>
          <div className="flex items-center gap-2">
            {view !== 'feed' && (
              <button
                onClick={() => setView('feed')}
                className="flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-sm font-medium text-mint-foreground"
              >
                <Icon name="ArrowLeft" size={15} /> Назад
              </button>
            )}
            <button
              onClick={() => setView('gallery')}
              className="flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-sm font-medium text-mint-foreground"
            >
              <Icon name="LayoutGrid" size={15} />
              <span className="hidden sm:inline">Галерея</span>
            </button>
            <button
              onClick={() => setView(view === 'admin' ? 'admin' : 'login')}
              className="flex items-center gap-1.5 rounded-full bg-mint-foreground px-4 py-1.5 text-sm font-medium text-mint"
            >
              <Icon name="Lock" size={15} />
              <span className="hidden sm:inline">Админ</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {view === 'feed' && (
          <div className="mx-auto max-w-xl space-y-6">
            {loading ? (
              <p className="py-20 text-center text-muted-foreground">Загрузка…</p>
            ) : posts.length === 0 ? (
              <div className="py-24 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint-soft">
                  <Icon name="Image" size={28} className="text-mint-foreground" />
                </div>
                <p className="mt-4 font-medium">Постов пока нет</p>
                <p className="mt-1 text-sm text-muted-foreground">Зайдите в админ-панель, чтобы создать первый.</p>
              </div>
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </div>
        )}

        {view === 'gallery' && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
              <h1 className="font-display text-4xl font-semibold">Галерея</h1>
              <button onClick={() => setView('feed')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Icon name="ArrowLeft" size={15} /> Вернуться в ленту
              </button>
            </div>
            {galleryItems.length === 0 ? (
              <p className="py-20 text-center text-muted-foreground">Нет медиа для отображения.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {galleryItems.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border border-border">
                    <PostMedia post={p} rounded={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'login' && (
          <div className="mx-auto max-w-sm py-16 animate-fade-in">
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint-soft">
                <Icon name="Lock" size={24} className="text-mint-foreground" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold">Вход в админ-панель</h1>
              <input
                type="password"
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value);
                  setPwdError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && tryLogin()}
                placeholder="Пароль"
                autoFocus
                className={`mt-5 w-full rounded-xl border bg-background px-4 py-3 text-center outline-none focus:border-mint ${
                  pwdError ? 'border-rose-400' : 'border-border'
                }`}
              />
              {pwdError && <p className="mt-2 text-sm text-rose-500">Неверный пароль</p>}
              <button
                onClick={tryLogin}
                className="mt-4 w-full rounded-xl bg-mint py-3 font-medium text-mint-foreground"
              >
                Войти
              </button>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <h1 className="font-display text-4xl font-semibold">Админ-панель</h1>
              <button onClick={() => setView('feed')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Icon name="Eye" size={15} /> Смотреть как зритель
              </button>
            </div>
            <AdminPanel password={ADMIN_PASSWORD} posts={posts} onChanged={load} />
          </div>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="font-display text-lg text-foreground">Studio.m</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
