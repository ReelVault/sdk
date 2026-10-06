import type { MetadataPlaybackProgressContract, PlaybackItemStatusContract, PlaybackProgressItemContract } from "@sdk/common/stream";
import { t } from "elysia";

export type PlaybackProgressItem = PlaybackProgressItemContract;

export type PlaybackItemStatus = PlaybackItemStatusContract;

export type MetadataPlaybackProgress = MetadataPlaybackProgressContract;

export interface UpdatePlaybackProgress {
	/** Raw playback position — the server normalizes null/undefined/non-finite to 0 and clamps to duration. */
	position?: number | null | undefined;
	audioStreamIndex?: number | null | undefined;
	subtitleId?: string | null | undefined;
	/**
	 * Languages of the tracks the user actually picked (null = cleared / subtitles
	 * off). Stored per title/series so the next episode starts the same way.
	 */
	audioLanguage?: string | null | undefined;
	subtitleLanguage?: string | null | undefined;
}

/** Request body of `PUT /me/media-files/:mediaFileId/playback-progress`. */
export const UpdatePlaybackProgressSchema = t.Object({
	// Server normalizes missing/null/non-finite positions to 0 and clamps to
	// the file duration — clients send the raw playback position.
	position: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
	audioStreamIndex: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	subtitleId: t.Optional(t.Nullable(t.String())),
	// Language-level choices carried over to the whole title/series.
	audioLanguage: t.Optional(t.Nullable(t.String())),
	subtitleLanguage: t.Optional(t.Nullable(t.String())),
});

/** Per-title/series language preferences resolved for a media file. */
export interface StreamPrefs {
	audioLanguage: string | null;
	subtitleLanguage: string | null;
}

/** Response body of `GET /me/stream-prefs/:mediaFileId`. */
export const StreamPrefsSchema = t.Object({
	audioLanguage: t.Nullable(t.String()),
	subtitleLanguage: t.Nullable(t.String()),
});
