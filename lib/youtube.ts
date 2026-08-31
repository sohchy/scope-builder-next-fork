/**
 * Extract the 11-character YouTube video id from a watch / embed / shorts / youtu.be URL.
 * Returns "" for unrecognized or invalid input.
 */
export function getYouTubeVideoId(input: string): string {
  try {
    const url = new URL(input);

    // https://www.youtube.com/watch?v=VIDEOID
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

      // https://www.youtube.com/embed/VIDEOID | /shorts/VIDEOID | /v/VIDEOID
      const m = url.pathname.match(/\/(embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[2];
    }

    // https://youtu.be/VIDEOID
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\/+/, "");
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }

    return "";
  } catch {
    return ""; // invalid URL
  }
}
