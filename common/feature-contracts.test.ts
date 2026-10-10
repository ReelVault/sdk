import { describe, expect, test } from "bun:test";
import { Value } from "@sinclair/typebox/value";
import { AdminAnalyticsSchema } from "./activity";
import { TrickplayDeleteResultSchema, DatabaseIntegritySchema } from "./admin";
import { TwoFactorBackupCodesStatusSchema, ChangePasswordRequestSchema } from "./auth";
import { ServerCapabilitiesSchema } from "./capabilities";
import { MetadataStatusesResponseSchema } from "./metadata";
import { MediaMarkerFiltersSchema } from "./media-markers";
import { UpdateProfilePreferencesSchema } from "./profile-preferences.types";
import { ProfilePinStatusSchema } from "./profile.types";
import { SystemSettingItemViewSchema } from "./settings";
import { SubtitleFiltersSchema } from "./subtitles";
import { PluginConfigFieldSchema } from "./plugins";
import { PurgeWorkerHistoryResponseSchema } from "./workers";

/**
 * Contract checks for the shapes that 1.3.0 added or changed. Each feature has a payload the server sends or
 * accepts, and a payload that must be refused; a bound that moves on either side fails here first.
 */

const analytics = {
	totalWatchMinutes: 0,
	totalPlaysCount: 2,
	completedPlaysCount: 1,
	activeUsersCount: 1,
	mostWatchedTitle: null,
	topContent: [],
	userLeaderboard: [],
	recentPlays: [],
	hourlyActivity: [],
	dailyActivity: [],
};

describe("admin analytics", () => {
	test("reports the finished plays next to the total", () => {
		expect(Value.Check(AdminAnalyticsSchema, analytics)).toBe(true);
		expect(Value.Check(AdminAnalyticsSchema, { ...analytics, completedPlaysCount: -1 })).toBe(false);
		const { completedPlaysCount: _omitted, ...withoutCompleted } = analytics;
		expect(Value.Check(AdminAnalyticsSchema, withoutCompleted)).toBe(false);
	});
});

describe("profile preferences added in 1.3.0", () => {
	test("the bitrate cap runs from unlimited (0) to 50 000 kbps", () => {
		expect(Value.Check(UpdateProfilePreferencesSchema, { maxStreamingBitrateKbps: 0 })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { maxStreamingBitrateKbps: 50000 })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { maxStreamingBitrateKbps: 50001 })).toBe(false);
	});

	test("the HDR mode is auto or tone-mapped to SDR", () => {
		expect(Value.Check(UpdateProfilePreferencesSchema, { hdrMode: "auto" })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { hdrMode: "toneMapToSdr" })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { hdrMode: "always" })).toBe(false);
	});

	test("the rewind on resume runs from 0 to 30 seconds", () => {
		expect(Value.Check(UpdateProfilePreferencesSchema, { resumeRewindSeconds: 30 })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { resumeRewindSeconds: 31 })).toBe(false);
	});

	test("the subtitle fallback list, the rating badge, the watchlist cleanup, the muted types and the hidden pages", () => {
		expect(Value.Check(UpdateProfilePreferencesSchema, { subtitleFallbackLanguages: "en,de" })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { hideRatingOverlay: true })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { watchlistAutoRemoveWatched: true })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { mutedNotificationTypes: "new_episode" })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { hiddenPages: "/trickplay" })).toBe(true);
		expect(Value.Check(UpdateProfilePreferencesSchema, { hideRatingOverlay: "yes" })).toBe(false);
		expect(Value.Check(UpdateProfilePreferencesSchema, { hiddenPages: "x".repeat(513) })).toBe(false);
	});
});

describe("two-factor backup codes", () => {
	test("the remaining count is a non-negative integer, or null when it cannot be read", () => {
		expect(Value.Check(TwoFactorBackupCodesStatusSchema, { remaining: 8 })).toBe(true);
		expect(Value.Check(TwoFactorBackupCodesStatusSchema, { remaining: null })).toBe(true);
		expect(Value.Check(TwoFactorBackupCodesStatusSchema, { remaining: -1 })).toBe(false);
	});
});

describe("password change", () => {
	test("the new password needs at least 8 characters and the current one must be given", () => {
		expect(Value.Check(ChangePasswordRequestSchema, { currentPassword: "old", newPassword: "longenough" })).toBe(true);
		expect(Value.Check(ChangePasswordRequestSchema, { currentPassword: "old", newPassword: "short" })).toBe(false);
		expect(Value.Check(ChangePasswordRequestSchema, { currentPassword: "", newPassword: "longenough" })).toBe(false);
	});
});

describe("catalog and profile lookups", () => {
	test("the catalog statuses are a list of strings", () => {
		expect(Value.Check(MetadataStatusesResponseSchema, { statuses: ["Ended", "Returning Series"] })).toBe(true);
		expect(Value.Check(MetadataStatusesResponseSchema, { statuses: [1] })).toBe(false);
	});

	test("the profile PIN status is a boolean", () => {
		expect(Value.Check(ProfilePinStatusSchema, { hasPin: true })).toBe(true);
		expect(Value.Check(ProfilePinStatusSchema, { hasPin: "yes" })).toBe(false);
	});

	test("the server capabilities list trickplay and downloads", () => {
		expect(Value.Check(ServerCapabilitiesSchema, { trickplay: true, downloads: false })).toBe(true);
		expect(Value.Check(ServerCapabilitiesSchema, { trickplay: true })).toBe(false);
	});
});

describe("filters", () => {
	test("marker filters take a known type and a search text of at most 200 characters", () => {
		expect(Value.Check(MediaMarkerFiltersSchema, { type: "intro", q: "opening" })).toBe(true);
		expect(Value.Check(MediaMarkerFiltersSchema, { type: "outro" })).toBe(false);
		expect(Value.Check(MediaMarkerFiltersSchema, { q: "x".repeat(201) })).toBe(false);
	});

	test("subtitle filters take a search text of at most 200 characters and a non-negative stream index", () => {
		expect(Value.Check(SubtitleFiltersSchema, { q: "danish" })).toBe(true);
		expect(Value.Check(SubtitleFiltersSchema, { q: "x".repeat(201) })).toBe(false);
		expect(Value.Check(SubtitleFiltersSchema, { streamIndex: -1 })).toBe(false);
	});
});

describe("dry runs and results", () => {
	test("a worker history purge reports whether it was a dry run", () => {
		const purge = { success: true, dryRun: true, deletedJobsCount: 3, deletedOperationsCount: 1 };

		expect(Value.Check(PurgeWorkerHistoryResponseSchema, purge)).toBe(true);
		expect(Value.Check(PurgeWorkerHistoryResponseSchema, { ...purge, dryRun: "yes" })).toBe(false);
	});

	test("a trickplay deletion reports whether it was a dry run and the counts it would remove", () => {
		const result = { dryRun: true, mediaFiles: 2, artifacts: 4 };

		expect(Value.Check(TrickplayDeleteResultSchema, result)).toBe(true);
		expect(Value.Check(TrickplayDeleteResultSchema, { ...result, artifacts: -1 })).toBe(false);
	});

	test("a database integrity result carries its verdict and the messages", () => {
		expect(Value.Check(DatabaseIntegritySchema, { ok: true, messages: [] })).toBe(true);
		expect(Value.Check(DatabaseIntegritySchema, { ok: false })).toBe(false);
	});
});

describe("plugin configuration and settings metadata", () => {
	test("a secret field reports whether a value is stored, never the value", () => {
		expect(Value.Check(PluginConfigFieldSchema, { name: "apiKey", type: "secret", label: "API key", hasValue: true })).toBe(true);
		expect(Value.Check(PluginConfigFieldSchema, { name: "apiKey", type: "secret", label: "API key", hasValue: "yes" })).toBe(false);
	});

	test("a number setting carries its bounds, unit and whether a change needs a restart", () => {
		const setting = {
			key: "scanning.pathScanTimeoutMs",
			group: "scanning",
			type: "number",
			value: 120000,
			default: 120000,
			min: 10000,
			max: 3600000,
			unit: "ms",
			restartRequired: false,
			isCustom: false,
		};

		expect(Value.Check(SystemSettingItemViewSchema, setting)).toBe(true);
		expect(Value.Check(SystemSettingItemViewSchema, { ...setting, restartRequired: "no" })).toBe(false);
	});
});
