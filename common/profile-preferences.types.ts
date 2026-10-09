import { t } from "elysia";

export const ProfilePreferencesSchema = t.Object({
	profileId: t.String(),
	language: t.String({ minLength: 2, maxLength: 16 }),
	theme: t.Union([t.Literal("system"), t.Literal("light"), t.Literal("dark")]),
	autoplay: t.Boolean(),
	autoSkipIntro: t.Boolean(),
	autoSkipCredits: t.Boolean(),
	autoSkipRecap: t.Boolean(),
	audioLanguage: t.Nullable(t.String({ minLength: 2, maxLength: 16 })),
	subtitleLanguage: t.Nullable(t.String({ minLength: 2, maxLength: 16 })),
	/** Comma-separated language priority list tried after `subtitleLanguage` (e.g. "en,de"). */
	subtitleFallbackLanguages: t.Nullable(t.String({ maxLength: 64 })),
	subtitlesEnabled: t.Boolean(),
	forcedSubtitlesOnly: t.Boolean(),
	autoForcedSubtitles: t.Boolean(),
	preferHearingImpaired: t.Boolean(),
	continueWatchingMinutes: t.Number({ minimum: 0, maximum: 240 }),
	/** Seconds the player rewinds when resuming a title, so you regain context. */
	resumeRewindSeconds: t.Number({ minimum: 0, maximum: 30 }),
	/** Removes a title from the watchlist once this profile has watched it. */
	watchlistAutoRemoveWatched: t.Boolean(),
	/** Hides the rating badge on poster cards, for a lighter grid. */
	hideRatingOverlay: t.Boolean(),
	subtitleSize: t.Union([t.Literal("small"), t.Literal("normal"), t.Literal("large"), t.Literal("extra-large")]),
	subtitlePosition: t.Union([t.Literal("bottom"), t.Literal("top"), t.Literal("middle")]),
	subtitleColor: t.Union([t.Literal("white"), t.Literal("yellow"), t.Literal("cyan"), t.Literal("green")]),
	subtitleBackground: t.Union([t.Literal("none"), t.Literal("semi"), t.Literal("solid")]),
});

export type ProfilePreferences = typeof ProfilePreferencesSchema.static;

export const UpdateProfilePreferencesSchema = t.Partial(
	t.Object({
		language: t.String({ minLength: 2, maxLength: 16 }),
		theme: t.Union([t.Literal("system"), t.Literal("light"), t.Literal("dark")]),
		autoplay: t.Boolean(),
		autoSkipIntro: t.Boolean(),
		autoSkipCredits: t.Boolean(),
		autoSkipRecap: t.Boolean(),
		// Empty strings are accepted on update — the service normalizes them to
		// null (cleared), so clients can send raw form values.
		audioLanguage: t.Nullable(t.String({ maxLength: 16 })),
		subtitleLanguage: t.Nullable(t.String({ maxLength: 16 })),
		subtitleFallbackLanguages: t.Nullable(t.String({ maxLength: 64 })),
		subtitlesEnabled: t.Boolean(),
		forcedSubtitlesOnly: t.Boolean(),
		autoForcedSubtitles: t.Boolean(),
		preferHearingImpaired: t.Boolean(),
		continueWatchingMinutes: t.Number({ minimum: 0, maximum: 240 }),
		resumeRewindSeconds: t.Number({ minimum: 0, maximum: 30 }),
		watchlistAutoRemoveWatched: t.Boolean(),
	hideRatingOverlay: t.Boolean(),
		subtitleSize: t.Union([t.Literal("small"), t.Literal("normal"), t.Literal("large"), t.Literal("extra-large")]),
		subtitlePosition: t.Union([t.Literal("bottom"), t.Literal("top"), t.Literal("middle")]),
		subtitleColor: t.Union([t.Literal("white"), t.Literal("yellow"), t.Literal("cyan"), t.Literal("green")]),
		subtitleBackground: t.Union([t.Literal("none"), t.Literal("semi"), t.Literal("solid")]),
	}),
);

export type UpdateProfilePreferences = typeof UpdateProfilePreferencesSchema.static;

/** Server-side defaults a profile falls back to when it has no stored overrides. */
export const ProfilePreferenceDefaultsSchema = t.Object({
	language: t.String(),
	theme: t.Union([t.Literal("system"), t.Literal("light"), t.Literal("dark")]),
	autoplay: t.Boolean(),
	autoSkipIntro: t.Boolean(),
	autoSkipCredits: t.Boolean(),
	autoSkipRecap: t.Boolean(),
	audioLanguage: t.Nullable(t.String()),
	subtitleLanguage: t.Nullable(t.String()),
	subtitleFallbackLanguages: t.Nullable(t.String()),
	subtitlesEnabled: t.Boolean(),
	forcedSubtitlesOnly: t.Boolean(),
	autoForcedSubtitles: t.Boolean(),
	preferHearingImpaired: t.Boolean(),
	continueWatchingMinutes: t.Number(),
	resumeRewindSeconds: t.Number(),
	watchlistAutoRemoveWatched: t.Boolean(),
	hideRatingOverlay: t.Boolean(),
	subtitleSize: t.Union([t.Literal("small"), t.Literal("normal"), t.Literal("large"), t.Literal("extra-large")]),
	subtitlePosition: t.Union([t.Literal("bottom"), t.Literal("top"), t.Literal("middle")]),
	subtitleColor: t.Union([t.Literal("white"), t.Literal("yellow"), t.Literal("cyan"), t.Literal("green")]),
	subtitleBackground: t.Union([t.Literal("none"), t.Literal("semi"), t.Literal("solid")]),
});

export type ProfilePreferenceDefaults = typeof ProfilePreferenceDefaultsSchema.static;
