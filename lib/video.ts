/**
 * Video url helpers for the Instructions cards. A `video` card stores a single
 * url and the player is picked at render time, so admins can paste a YouTube
 * link, a Vimeo link or a direct file url into the same field.
 *
 * YouTube ids are parsed by `getYouTubeVideoId` in lib/youtube.ts.
 */

export type VideoSource = "youtube" | "vimeo" | "file";

/** Which player a url should render with. Unrecognized hosts fall back to `file`. */
export function detectVideoSource(input: string): VideoSource {
  try {
    const url = new URL(input);

    if (url.hostname.includes("youtube.com") || url.hostname === "youtu.be") {
      return "youtube";
    }

    if (url.hostname.includes("vimeo.com")) return "vimeo";

    return "file";
  } catch {
    return "file"; // invalid URL — let the <video> tag fail visibly
  }
}

/**
 * Extract the numeric Vimeo video id from a vimeo.com / player.vimeo.com url.
 * Handles /VIDEOID, /channels/<name>/VIDEOID, /groups/<name>/videos/VIDEOID and
 * player.vimeo.com/video/VIDEOID. Returns "" for unrecognized or invalid input.
 */
export function getVimeoVideoId(input: string): string {
  try {
    const url = new URL(input);

    if (!url.hostname.includes("vimeo.com")) return "";

    // The id is the last all-digits path segment in every supported url shape.
    const segments = url.pathname.split("/").filter(Boolean);

    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(segments[i])) return segments[i];
    }

    return "";
  } catch {
    return ""; // invalid URL
  }
}
