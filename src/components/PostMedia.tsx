import type { Post } from '@/lib/api';

const PostMedia = ({ post, rounded = true }: { post: Post; rounded?: boolean }) => {
  if (!post.media_url) return null;
  const cls = `w-full ${rounded ? 'rounded-xl' : ''} bg-muted object-cover`;

  if (post.media_type === 'video') {
    return (
      <video
        src={post.media_url}
        className={cls}
        muted={!post.video_sound}
        controls={post.video_sound}
        autoPlay={!post.video_sound}
        loop={!post.video_sound}
        playsInline
        preload="metadata"
      />
    );
  }

  return <img src={post.media_url} alt={post.title} className={cls} loading="lazy" />;
};

export default PostMedia;
