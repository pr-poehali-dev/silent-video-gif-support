import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { createPost, deletePost, uploadFile, type MediaType, type Post, type PostButton } from '@/lib/api';

interface DraftButton extends PostButton {
  _id: string;
}

const AdminPanel = ({ password, posts, onChanged }: { password: string; posts: Post[]; onChanged: () => void }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [videoSound, setVideoSound] = useState(true);
  const [mediaUrl, setMediaUrl] = useState('');
  const [buttons, setButtons] = useState<DraftButton[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const accept = mediaType === 'video' ? 'video/*' : mediaType === 'gif' ? 'image/gif' : 'image/*';

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(password, file);
    if (url) setMediaUrl(url);
    setUploading(false);
  };

  const uploadButtonImage = async (id: string, file: File | undefined) => {
    if (!file) return;
    const url = await uploadFile(password, file);
    if (url) setButtons((prev) => prev.map((b) => (b._id === id ? { ...b, image_url: url } : b)));
  };

  const addButton = () =>
    setButtons((prev) => [...prev, { _id: crypto.randomUUID(), label: '', url: '', image_url: '' }]);

  const reset = () => {
    setTitle('');
    setText('');
    setMediaUrl('');
    setButtons([]);
    setMediaType('photo');
    setVideoSound(true);
  };

  const save = async () => {
    setSaving(true);
    const ok = await createPost(password, {
      title,
      text,
      media_type: mediaType,
      media_url: mediaUrl,
      video_sound: videoSound,
      buttons: buttons.map(({ label, url, image_url }) => ({ label, url, image_url })),
    });
    setSaving(false);
    if (ok) {
      reset();
      onChanged();
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить пост?')) return;
    const ok = await deletePost(password, id);
    if (ok) onChanged();
  };

  const TYPES: { id: MediaType; label: string; icon: string }[] = [
    { id: 'photo', label: 'Фото', icon: 'Image' },
    { id: 'video', label: 'Видео', icon: 'Film' },
    { id: 'gif', label: 'GIF', icon: 'Sparkles' },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-semibold">Новый пост</h2>

        <div className="mt-5 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-mint"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Текст поста"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-mint"
          />

          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setMediaType(t.id);
                  setMediaUrl('');
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  mediaType === t.id ? 'bg-mint text-mint-foreground' : 'border border-border text-muted-foreground'
                }`}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            ))}
          </div>

          {mediaType === 'video' && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={videoSound} onChange={(e) => setVideoSound(e.target.checked)} />
              Видео со звуком
            </label>
          )}

          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-8 transition-colors hover:border-mint"
          >
            {uploading ? (
              <span className="text-sm text-muted-foreground">Загрузка…</span>
            ) : mediaUrl ? (
              <span className="flex items-center gap-2 text-sm text-mint-foreground">
                <Icon name="Check" size={16} /> Файл загружен
              </span>
            ) : (
              <>
                <Icon name="Upload" size={22} className="text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">Загрузить {TYPES.find((t) => t.id === mediaType)?.label}</span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </div>

          <div className="space-y-3 rounded-xl bg-secondary p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Кнопки-ссылки</span>
              <button onClick={addButton} className="flex items-center gap-1 text-sm text-mint-foreground">
                <Icon name="Plus" size={14} /> Добавить
              </button>
            </div>
            {buttons.map((b) => (
              <div key={b._id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2">
                <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-secondary">
                  {b.image_url ? (
                    <img src={b.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="ImagePlus" size={16} className="text-muted-foreground" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadButtonImage(b._id, e.target.files?.[0])} />
                </label>
                <input
                  value={b.label}
                  onChange={(e) => setButtons((p) => p.map((x) => (x._id === b._id ? { ...x, label: e.target.value } : x)))}
                  placeholder="Текст"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none"
                />
                <input
                  value={b.url}
                  onChange={(e) => setButtons((p) => p.map((x) => (x._id === b._id ? { ...x, url: e.target.value } : x)))}
                  placeholder="https://"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none"
                />
                <button onClick={() => setButtons((p) => p.filter((x) => x._id !== b._id))} className="text-muted-foreground hover:text-rose-500">
                  <Icon name="X" size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-foreground py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Публикуем…' : 'Опубликовать'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-semibold">Посты ({posts.length})</h2>
        <div className="mt-5 space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              {p.media_url && p.media_type !== 'video' ? (
                <img src={p.media_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon name={p.media_type === 'video' ? 'Film' : 'FileText'} size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title || 'Без названия'}</p>
                <p className="text-xs text-muted-foreground">{p.likes} лайков · {p.comment_count} комм.</p>
              </div>
              <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-rose-500">
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          ))}
          {posts.length === 0 && <p className="text-sm text-muted-foreground">Постов пока нет.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
