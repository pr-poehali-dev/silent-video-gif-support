import urls from '../../backend/func2url.json';

export const POSTS_URL = (urls as Record<string, string>).posts;
export const INTERACTIONS_URL = (urls as Record<string, string>).interactions;
export const UPLOAD_URL = (urls as Record<string, string>).upload;

export type MediaType = 'photo' | 'video' | 'gif';

export interface PostButton {
  id?: number;
  label: string;
  url: string;
  image_url?: string;
}

export interface Post {
  id: number;
  title: string;
  body_text: string;
  media_type: MediaType;
  media_url: string;
  video_sound: boolean;
  likes: number;
  created_at: string;
  buttons: PostButton[];
  comment_count: number;
}

export interface Comment {
  id: number;
  author: string;
  body_text: string;
  created_at: string;
}

export async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(POSTS_URL);
  const data = await res.json();
  return data.posts || [];
}

export async function createPost(password: string, payload: {
  title: string;
  text: string;
  media_type: MediaType;
  media_url: string;
  video_sound: boolean;
  buttons: PostButton[];
}): Promise<boolean> {
  const res = await fetch(POSTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function deletePost(password: string, id: number): Promise<boolean> {
  const res = await fetch(`${POSTS_URL}?id=${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Password': password },
  });
  return res.ok;
}

export async function likePost(id: number): Promise<number> {
  const res = await fetch(INTERACTIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'like', post_id: id }),
  });
  const data = await res.json();
  return data.likes ?? 0;
}

export async function fetchComments(postId: number): Promise<Comment[]> {
  const res = await fetch(`${INTERACTIONS_URL}?action=comments&post_id=${postId}`);
  const data = await res.json();
  return data.comments || [];
}

export async function addComment(postId: number, author: string, text: string): Promise<Comment | null> {
  const res = await fetch(INTERACTIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'comment', post_id: postId, author, text }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.comment || null;
}

export async function uploadFile(password: string, file: File): Promise<string | null> {
  const data: string = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
    body: JSON.stringify({ data, filename: file.name, content_type: file.type }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.url || null;
}
