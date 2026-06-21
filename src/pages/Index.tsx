import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

type MediaType = 'video' | 'gif';

interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  name: string;
  views: number;
  seen: boolean;
  createdAt: number;
}

type Tab = 'home' | 'upload' | 'gallery' | 'stats' | 'contacts';

const STORAGE_KEY = 'minimal-media-items';

const loadItems = (): MediaItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Главная', icon: 'House' },
  { id: 'gallery', label: 'Галерея', icon: 'LayoutGrid' },
  { id: 'upload', label: 'Загрузка', icon: 'Upload' },
  { id: 'stats', label: 'Статистика', icon: 'ChartLine' },
  { id: 'contacts', label: 'Контакты', icon: 'Mail' },
];

const MediaCard = ({ item, onView }: { item: MediaItem; onView: (id: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !counted.current) {
            counted.current = true;
            onView(item.id);
          }
        });
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [item.id, onView]);

  return (
    <div ref={ref} className="group relative animate-fade-in">
      <div className="relative overflow-hidden rounded-sm bg-muted aspect-square">
        {item.type === 'video' ? (
          <video
            src={item.url}
            className="h-full w-full object-cover"
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={item.url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        )}

        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider backdrop-blur">
          <Icon name={item.type === 'video' ? 'Film' : 'Image'} size={12} />
          {item.type === 'video' ? 'Без звука' : 'GIF'}
        </div>

        {item.seen && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-background backdrop-blur">
            <Icon name="Check" size={12} />
            Просмотрено
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="truncate text-sm text-foreground">{item.name}</p>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Icon name="Eye" size={13} />
          {item.views}
        </span>
      </div>
    </div>
  );
};

const Index = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [items, setItems] = useState<MediaItem[]>(loadItems);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const handleView = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, views: it.views + 1, seen: true } : it))
    );
  }, []);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const added: MediaItem[] = [];
    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');
      if (!isVideo && !isImage) return;
      added.push({
        id: crypto.randomUUID(),
        type: isVideo ? 'video' : 'gif',
        url: URL.createObjectURL(file),
        name: file.name.replace(/\.[^.]+$/, ''),
        views: 0,
        seen: false,
        createdAt: Date.now(),
      });
    });
    if (added.length) {
      setItems((prev) => [...added, ...prev]);
      setTab('gallery');
    }
  }, []);

  const totalViews = items.reduce((s, i) => s + i.views, 0);
  const seenCount = items.filter((i) => i.seen).length;
  const videoCount = items.filter((i) => i.type === 'video').length;
  const gifCount = items.filter((i) => i.type === 'gif').length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={() => setTab('home')} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-foreground text-background">
              <Icon name="Aperture" size={16} />
            </div>
            <span className="font-display text-2xl font-medium tracking-tight">Медиа</span>
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`rounded-sm px-3 py-2 text-sm transition-colors ${
                  tab === n.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <button
            onClick={() => setTab('upload')}
            className="flex items-center gap-2 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Icon name="Plus" size={16} />
            <span className="hidden sm:inline">Загрузить</span>
          </button>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs ${
                tab === n.id ? 'bg-secondary' : 'text-muted-foreground'
              }`}
            >
              <Icon name={n.icon} size={14} />
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container py-12">
        {tab === 'home' && (
          <section className="animate-fade-in">
            <div className="mx-auto max-w-2xl py-16 text-center">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Минималистичная галерея
              </p>
              <h1 className="font-display text-5xl font-medium leading-tight tracking-tight sm:text-7xl">
                Видео и GIF.<br />Ничего лишнего.
              </h1>
              <p className="mx-auto mt-6 max-w-md text-balance text-muted-foreground">
                Видео воспроизводятся автоматически без звука. GIF загружаются мгновенно
                и отмечаются как просмотренные, когда попадают в кадр.
              </p>
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => setTab('upload')}
                  className="rounded-sm bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Загрузить медиа
                </button>
                <button
                  onClick={() => setTab('gallery')}
                  className="rounded-sm border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Открыть галерею
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-8">
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                  <h2 className="font-display text-2xl font-medium">Недавнее</h2>
                  <button onClick={() => setTab('gallery')} className="text-sm text-muted-foreground hover:text-foreground">
                    Смотреть всё →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {items.slice(0, 4).map((it) => (
                    <MediaCard key={it.id} item={it} onView={handleView} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'upload' && (
          <section className="mx-auto max-w-2xl animate-fade-in">
            <h1 className="font-display text-4xl font-medium">Загрузка медиа</h1>
            <p className="mt-2 text-muted-foreground">
              Поддерживаются видео (MP4, WebM, MOV) и GIF. Видео будут показаны без звука.
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed py-20 transition-colors ${
                dragOver ? 'border-foreground bg-secondary' : 'border-border hover:border-foreground/40'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Icon name="Upload" size={24} />
              </div>
              <p className="mt-4 font-medium">Перетащите файлы сюда</p>
              <p className="mt-1 text-sm text-muted-foreground">или нажмите для выбора</p>
              <input
                ref={fileRef}
                type="file"
                accept="video/*,image/gif,image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3 rounded-sm border border-border p-4">
                <Icon name="Film" size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Видео без звука</p>
                  <p className="text-muted-foreground">Автовоспроизведение, зацикливание</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-sm border border-border p-4">
                <Icon name="Image" size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">GIF анимация</p>
                  <p className="text-muted-foreground">Отметка просмотра в кадре</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'gallery' && (
          <section className="animate-fade-in">
            <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
              <div>
                <h1 className="font-display text-4xl font-medium">Галерея</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? 'файл' : 'файлов'} · просмотрено {seenCount}
                </p>
              </div>
            </div>
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Icon name="ImageOff" size={28} className="text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">Пока пусто</p>
                <p className="mt-1 text-sm text-muted-foreground">Загрузите первое видео или GIF</p>
                <button
                  onClick={() => setTab('upload')}
                  className="mt-6 rounded-sm bg-foreground px-5 py-2.5 text-sm font-medium text-background"
                >
                  Загрузить
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {items.map((it) => (
                  <MediaCard key={it.id} item={it} onView={handleView} />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'stats' && (
          <section className="mx-auto max-w-4xl animate-fade-in">
            <h1 className="font-display text-4xl font-medium">Статистика просмотров</h1>
            <p className="mt-2 text-muted-foreground">Сколько раз ваши медиа попадали в кадр зрителю.</p>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Всего просмотров', value: totalViews, icon: 'Eye' },
                { label: 'Файлов', value: items.length, icon: 'Files' },
                { label: 'Видео', value: videoCount, icon: 'Film' },
                { label: 'GIF', value: gifCount, icon: 'Image' },
              ].map((s) => (
                <div key={s.label} className="rounded-sm border border-border p-5">
                  <Icon name={s.icon} size={18} className="text-muted-foreground" />
                  <p className="mt-3 font-display text-4xl font-medium">{s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="mb-4 font-display text-2xl font-medium">Рейтинг по просмотрам</h2>
              {items.length === 0 ? (
                <p className="rounded-sm border border-border p-6 text-sm text-muted-foreground">
                  Нет данных. Загрузите медиа, чтобы увидеть статистику.
                </p>
              ) : (
                <div className="space-y-2">
                  {[...items]
                    .sort((a, b) => b.views - a.views)
                    .map((it) => {
                      const max = Math.max(...items.map((i) => i.views), 1);
                      return (
                        <div key={it.id} className="flex items-center gap-4 rounded-sm border border-border p-3">
                          <Icon name={it.type === 'video' ? 'Film' : 'Image'} size={16} className="shrink-0 text-muted-foreground" />
                          <span className="w-32 shrink-0 truncate text-sm">{it.name}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${(it.views / max) * 100}%` }} />
                          </div>
                          <span className="w-10 shrink-0 text-right text-sm font-medium">{it.views}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === 'contacts' && (
          <section className="mx-auto max-w-xl animate-fade-in">
            <h1 className="font-display text-4xl font-medium">Контакты</h1>
            <p className="mt-2 text-muted-foreground">Свяжитесь с нами любым удобным способом.</p>
            <div className="mt-8 space-y-3">
              {[
                { icon: 'Mail', label: 'Почта', value: 'hello@media.studio' },
                { icon: 'Phone', label: 'Телефон', value: '+7 900 000-00-00' },
                { icon: 'MapPin', label: 'Адрес', value: 'Москва, ул. Минимализма, 1' },
                { icon: 'Send', label: 'Telegram', value: '@media_studio' },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4 rounded-sm border border-border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary">
                    <Icon name={c.icon} size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
                    <p className="font-medium">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="font-display text-lg text-foreground">Медиа</span>
          <span>© {new Date().getFullYear()} · Минималистичная галерея</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
