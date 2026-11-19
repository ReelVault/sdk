import { t } from "elysia";

const LanguageCodeSchema = t.String({ minLength: 2, maxLength: 16 });

/**
 * Every preference a profile can set, defined once. The stored preferences, the update body and
 * the server defaults are derived from it, so a new preference cannot be missing from one of them.
 */
const ProfilePreferenceFields = {
	language: LanguageCodeSchema,
	theme: t.Union([t.Literal("system"), t.Literal("light"), t.Literal("dark")]),
	autoplay: t.Boolean(),
	autoSkipIntro: t.Boolean(),
	autoSkipCredits: t.Boolean(),
	autoSkipRecap: t.Boolean(),
	audioLanguage: t.Nullable(LanguageCodeSchema),
	subtitleLanguage: t.Nullable(LanguageCodeSchema),
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
	hdrMode: t.Union([t.Literal("auto"), t.Literal("toneMapToSdr")]),
	maxStreamingBitrateKbps: t.Number({ minimum: 0, maximum: 50000 }),
	/** Comma-separated notification types this profile does not want to see in its list or as live alerts. */
	mutedNotificationTypes: t.String({ maxLength: 512 }),
	/** Comma-separated optional pages (collections, discovery, insights, devices, remote) hidden from the menus. */
	hiddenPages: t.String({ maxLength: 512 }),
	subtitleSize: t.Union([t.Literal("small"), t.Literal("normal"), t.Literal("large"), t.Literal("extra-large")]),
	subtitlePosition: t.Union([t.Literal("bottom"), t.Literal("top"), t.Literal("middle")]),
	subtitleColor: t.Union([t.Literal("white"), t.Literal("yellow"), t.Literal("cyan"), t.Literal("green")]),
	subtitleBackground: t.Union([t.Literal("none"), t.Literal("semi"), t.Literal("solid")]),
};

export const ProfilePreferencesSchema = t.Object({ profileId: t.String(), ...ProfilePreferenceFields });

export type ProfilePreferences = typeof ProfilePreferencesSchema.static;

export const UpdateProfilePreferencesSchema = t.Partial(
	t.Object({
		...ProfilePreferenceFields,
		// Empty strings are accepted on update — the service normalizes them to
		// null (cleared), so clients can send raw form values.
		audioLanguage: t.Nullable(t.String({ maxLength: 16 })),
		subtitleLanguage: t.Nullable(t.String({ maxLength: 16 })),
	}),
);

export type UpdateProfilePreferences = typeof UpdateProfilePreferencesSchema.static;

/** Server-side defaults a profile falls back to when it has no stored overrides. */
export const ProfilePreferenceDefaultsSchema = t.Object(ProfilePreferenceFields);

export type ProfilePreferenceDefaults = typeof ProfilePreferenceDefaultsSchema.static;
