const FILE_HASH_LENGTH = Number(import.meta.env.VITE_FILE_HASH_LENGTH) || 6;
const VITE_STREAM_BASE_URL = import.meta.env.VITE_STREAM_BASE_URL;
const VITE_PROXY_BASE_URL = import.meta.env.VITE_BASE_URL;

export const getStreamingLink = (file) => {
  const base =
    localStorage.getItem("useproxy") == "true"
      ? VITE_PROXY_BASE_URL
      : VITE_STREAM_BASE_URL;
  return `${base}/stream/${file.message_id}?hash=${file.file_hash.slice(0, FILE_HASH_LENGTH)}`;
};

export const createIntentUrl = (url, packageName) => {
  const parsed = new URL(url);
  const scheme = parsed.protocol.replace(":", "");
  const packageParam = packageName ? `package=${packageName};` : "";

  // Formatted as a single continuous line to prevent URI parsing errors
  const link = `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;${packageParam}action=android.intent.action.VIEW;type=video/mp4;scheme=${scheme};end`;

  console.log(link);
  return link;
};

export const getTmdbImageUrl = (image_path) => {
  return `https://image.tmdb.org/t/p/w500${image_path}`;
};
