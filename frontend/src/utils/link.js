export const createIntentUrl = (url, packageName) => {
  const parsed = new URL(url);
  const scheme = parsed.protocol.replace(":", "");
  const packageParam = packageName ? `package=${packageName};` : "";

  // Formatted as a single continuous line to prevent URI parsing errors
  const link = `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;${packageParam}action=android.intent.action.VIEW;type=video/mp4;scheme=${scheme};end`;

  return link;
};

export const getTmdbImageUrl = (image_path, quality = "original") => {
  return `https://image.tmdb.org/t/p/${quality}${image_path}`;
};
