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

/**
 * What a reset of playback progress covers: only the given file (`file`), or every
 * file of its title (`title` — all versions of a movie, all episodes of a series).
 */
export const WatchStateScopeSchema = t.Union([t.Literal("file"), t.Literal("title")]);

export type WatchStateScope = typeof WatchStateScopeSchema.static;

/** Request body of `POST /me/watch-state/bulk`: mark the files watched (finished) or unwatched. */
export const WatchStateBulkSchema = t.Object({
	mediaFileIds: t.Array(t.String({ minLength: 1, maxLength: 128 }), { minItems: 1, maxItems: 500 }),
	watched: t.Boolean(),
});

export type WatchStateBulk = typeof WatchStateBulkSchema.static;

export const WatchStateBulkResultSchema = t.Object({
	updated: t.Integer({ minimum: 0 }),
});

export type WatchStateBulkResult = typeof WatchStateBulkResultSchema.static;

/** Response body of `GET /me/stream-prefs/:mediaFileId`: per-title/series language preferences resolved for a media file. */
export const StreamPrefsSchema = t.Object({
	audioLanguage: t.Nullable(t.String()),
	subtitleLanguage: t.Nullable(t.String()),
});

export type StreamPrefs = typeof StreamPrefsSchema.static;
