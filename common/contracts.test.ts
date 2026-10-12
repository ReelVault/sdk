import { describe, expect, test } from "bun:test";
import { Value } from "@sinclair/typebox/value";
import { TrickplayRegenerateRequestSchema } from "./admin";
import { BulkTerminateSessionsSchema } from "./admin-live-activity";
import { BulkDeleteBodySchema } from "./bulk-delete";
import { BulkRefreshBodySchema } from "./bulk-refresh";
import { LibraryScanProgressResponseSchema, UpdateScanFindingSchema } from "./library-scan";
import { WatchStateBulkSchema } from "./playback-progress.types";
import { PluginValidationIssueSchema } from "./plugin-catalog";
import { PluginBulkStateBodySchema } from "./plugins";
import { WatchlistBulkBodySchema } from "./watchlist.types";

/**
 * Contract checks for the request and response shapes of 1.3.0. The limits here are the ones
 * the server enforces and documents: a limit that moves on either side fails here first.
 */

const ids = (count: number, prefix = "id") => Array.from({ length: count }, (_, index) => `${prefix}-${index}`);

describe("trickplay regeneration request", () => {
	test("accepts a library, title or season scope with one id", () => {
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "library", id: "lib-1" })).toBe(true);
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "title", id: "title-1", force: true })).toBe(true);
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "season", id: "season-1" })).toBe(true);
	});

	test("accepts up to 50 titles in one titles request", () => {
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "titles", ids: ids(50) })).toBe(true);
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "titles", ids: ids(51) })).toBe(false);
	});

	test("refuses an empty title list and an over-long title id", () => {
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "titles", ids: [] })).toBe(false);
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "titles", ids: ["x".repeat(129)] })).toBe(false);
	});

	test("a titles request needs ids, and an unknown scope is refused", () => {
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "titles", id: "title-1" })).toBe(false);
		expect(Value.Check(TrickplayRegenerateRequestSchema, { scope: "all", id: "x" })).toBe(false);
	});
});

describe("bulk id lists", () => {
	test("bulk refresh takes 1 to 50 ids", () => {
		expect(Value.Check(BulkRefreshBodySchema, { ids: ids(1) })).toBe(true);
		expect(Value.Check(BulkRefreshBodySchema, { ids: ids(50) })).toBe(true);
		expect(Value.Check(BulkRefreshBodySchema, { ids: ids(51) })).toBe(false);
		expect(Value.Check(BulkRefreshBodySchema, { ids: [] })).toBe(false);
	});

	test("bulk delete takes 1 to 50 ids and the force flag", () => {
		expect(Value.Check(BulkDeleteBodySchema, { ids: ids(50), force: true })).toBe(true);
		expect(Value.Check(BulkDeleteBodySchema, { ids: ids(51) })).toBe(false);
	});

	test("live stream termination takes up to 100 sessions and a reason of up to 200 characters", () => {
		expect(Value.Check(BulkTerminateSessionsSchema, { sessionIds: ids(100, "session"), reason: "maintenance" })).toBe(true);
		expect(Value.Check(BulkTerminateSessionsSchema, { sessionIds: ids(101, "session") })).toBe(false);
		expect(Value.Check(BulkTerminateSessionsSchema, { sessionIds: ["s-1"], reason: "x".repeat(200) })).toBe(true);
		expect(Value.Check(BulkTerminateSessionsSchema, { sessionIds: ["s-1"], reason: "x".repeat(201) })).toBe(false);
	});

	test("plugin enable and disable takes up to 100 plugins", () => {
		expect(Value.Check(PluginBulkStateBodySchema, { enabled: true, pluginIds: ids(100, "plugin") })).toBe(true);
		expect(Value.Check(PluginBulkStateBodySchema, { enabled: true, pluginIds: ids(101, "plugin") })).toBe(false);
	});

	test("watch state changes take up to 500 files", () => {
		expect(Value.Check(WatchStateBulkSchema, { mediaFileIds: ids(500, "file"), watched: true })).toBe(true);
		expect(Value.Check(WatchStateBulkSchema, { mediaFileIds: ids(501, "file"), watched: true })).toBe(false);
	});

	test("watchlist changes take up to 500 titles to add and to remove", () => {
		expect(Value.Check(WatchlistBulkBodySchema, { add: ids(500), remove: ids(500) })).toBe(true);
		expect(Value.Check(WatchlistBulkBodySchema, { add: ids(501) })).toBe(false);
		expect(Value.Check(WatchlistBulkBodySchema, { remove: ids(501) })).toBe(false);
	});
});

describe("library scan progress", () => {
	test("a queued scan has no percentage and a running scan has one between 0 and 100", () => {
		const response = {
			data: [
				{ libraryId: "lib-1", status: "pending", progressPercent: null },
				{ libraryId: "lib-2", status: "running", progressPercent: 42 },
			],
		};

		expect(Value.Check(LibraryScanProgressResponseSchema, response)).toBe(true);
		const running = (progressPercent: number) => ({ data: [{ libraryId: "lib-2", status: "running", progressPercent }] });

		expect(Value.Check(LibraryScanProgressResponseSchema, running(101))).toBe(false);
		expect(Value.Check(LibraryScanProgressResponseSchema, running(-1))).toBe(false);
	});

	test("only pending and running are reported as active", () => {
		const done = { data: [{ libraryId: "lib-1", status: "done", progressPercent: null }] };

		expect(Value.Check(LibraryScanProgressResponseSchema, done)).toBe(false);
	});
});

describe("scan finding update", () => {
	test("names a file and a boolean ignored flag", () => {
		expect(Value.Check(UpdateScanFindingSchema, { filePath: "/media/movie.mkv", ignored: true })).toBe(true);
		expect(Value.Check(UpdateScanFindingSchema, { filePath: "", ignored: true })).toBe(false);
		expect(Value.Check(UpdateScanFindingSchema, { filePath: "/media/movie.mkv", ignored: "yes" })).toBe(false);
	});
});

describe("plugin validation issues", () => {
	test("params hold only primitive values the translation can interpolate", () => {
		const issue = {
			severity: "error",
			code: "plugin.catalog_entry_invalid",
			message: "entry 2 is invalid",
			params: { index: 2, field: "homepage", strict: true, unset: null },
		};

		expect(Value.Check(PluginValidationIssueSchema, issue)).toBe(true);
		expect(Value.Check(PluginValidationIssueSchema, { ...issue, params: { nested: { a: 1 } } })).toBe(false);
		expect(Value.Check(PluginValidationIssueSchema, { ...issue, params: { list: [1] } })).toBe(false);
	});

	test("params are optional, and severity is error or warning only", () => {
		expect(Value.Check(PluginValidationIssueSchema, { severity: "warning", code: "plugin.x", message: "x" })).toBe(true);
		expect(Value.Check(PluginValidationIssueSchema, { severity: "fatal", code: "plugin.x", message: "x" })).toBe(false);
	});
});
