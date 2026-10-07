export function getYouTubeVideoId(url) {
  if (!url) {
    return "qJ-Op0x0yCM";
  }

  const regExp =
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;

  const match = url.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  if (url.trim().length === 11 && !url.includes("/") && !url.includes(".")) {
    return url.trim();
  }

  return "qJ-Op0x0yCM";
}
