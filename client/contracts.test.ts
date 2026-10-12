import { describe, expect, test } from "bun:test";
import type { Fetcher } from "./core/types";
import { ReelVaultClient, ReelVaultValidationError } from "./index";

/**
 * Request contracts of the client: each method sends the documented method, path and body,
 * and a path with a missing identifier never reaches the network. A recording fetcher stands
 * in for the server, so these checks run without one.
 */

const BASE_URL = "http://reelvault.test/v1";

interface SentRequest {
	method: string;
	url: string;
	body: unknown;
}

function recordingClient() {
	const sent: SentRequest[] = [];
	const fetcher: Fetcher = (url, options) => {
		const body = typeof options.body === "string" ? JSON.parse(options.body) : undefined;
		sent.push({ method: options.method ?? "GET", url, body });

		return Promise.resolve(Response.json({ ok: true }));
	};

	return { client: new ReelVaultClient({ baseUrl: BASE_URL, fetcher }), sent };
}

describe("admin requests", () => {
	test("trickplay regeneration sends the titles scope and its ids unchanged", async () => {
		const { client, sent } = recordingClient();

		await client.admin.regenerateTrickplay({ scope: "titles", ids: ["title-1", "title-2"], force: false });

		expect(sent).toEqual([
			{
				method: "POST",
				url: `${BASE_URL}/admin/trickplay/regenerate`,
				body: { scope: "titles", ids: ["title-1", "title-2"], force: false },
			},
		]);
	});

	test("the trickplay report is read from its operation", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getTrickplayRegenerationReport("op-1");

		expect(sent).toEqual([{ method: "GET", url: `${BASE_URL}/admin/trickplay/operations/op-1/report`, body: undefined }]);
	});

	test("live stream termination sends the session ids and the reason", async () => {
		const { client, sent } = recordingClient();

		await client.admin.terminateLiveStreams({ sessionIds: ["session-1"], reason: "maintenance" });

		expect(sent).toEqual([
			{
				method: "POST",
				url: `${BASE_URL}/admin/live-activity/terminate`,
				body: { sessionIds: ["session-1"], reason: "maintenance" },
			},
		]);
	});

	test("the live session log link points at the session's log route, with the id encoded", () => {
		const { client } = recordingClient();

		expect(client.admin.getLiveSessionLogUrl("sess/1")).toBe(`${BASE_URL}/admin/live-activity/sess%2F1/log`);
	});

	test("plugin enable and disable sends every plugin id in one request", async () => {
		const { client, sent } = recordingClient();

		await client.admin.setPluginsEnabled({ enabled: false, pluginIds: ["plugin-1", "plugin-2"] });

		expect(sent).toEqual([
			{ method: "POST", url: `${BASE_URL}/admin/plugins/bulk`, body: { enabled: false, pluginIds: ["plugin-1", "plugin-2"] } },
		]);
	});
});

describe("bulk requests", () => {
	test("media files send their ids, with the force flag when it is given", async () => {
		const { client, sent } = recordingClient();

		await client.media.bulkDelete(["media-1"], { force: true });
		await client.media.bulkRefresh(["media-1"]);

		expect(sent).toEqual([
			{ method: "POST", url: `${BASE_URL}/media-files/bulk-delete`, body: { ids: ["media-1"], force: true } },
			{ method: "POST", url: `${BASE_URL}/media-files/bulk-refresh`, body: { ids: ["media-1"] } },
		]);
	});

	test("metadata, episodes and subtitles each post their own bulk route", async () => {
		const { client, sent } = recordingClient();

		await client.metadata.bulkDelete(["title-1"]);
		await client.metadata.bulkRefreshImages(["title-1"]);
		await client.episodes.bulkRefresh(["episode-1"]);
		await client.subtitles.bulkDelete(["subtitle-1"]);

		expect(sent).toEqual([
			{ method: "POST", url: `${BASE_URL}/metadata/bulk-delete`, body: { ids: ["title-1"] } },
			{ method: "POST", url: `${BASE_URL}/metadata/bulk-refresh-images`, body: { ids: ["title-1"] } },
			{ method: "POST", url: `${BASE_URL}/episodes/bulk-refresh`, body: { ids: ["episode-1"] } },
			{ method: "POST", url: `${BASE_URL}/subtitles/bulk-delete`, body: { ids: ["subtitle-1"] } },
		]);
	});

	test("watch state changes post the files and the watched flag", async () => {
		const { client, sent } = recordingClient();

		await client.me.setWatchStateBulk({ mediaFileIds: ["media-1"], watched: true });

		expect(sent).toEqual([{ method: "POST", url: `${BASE_URL}/me/watch-state/bulk`, body: { mediaFileIds: ["media-1"], watched: true } }]);
	});
});

describe("library requests", () => {
	test("scan progress reads the libraries endpoint", async () => {
		const { client, sent } = recordingClient();

		await client.libraries.getScanProgress();

		expect(sent).toEqual([{ method: "GET", url: `${BASE_URL}/libraries/scan-progress`, body: undefined }]);
	});
});

describe("path guard", () => {
	test("a missing identifier is refused before any request is sent", async () => {
		const { client, sent } = recordingClient();
		const attempt = async () => await client.admin.getTrickplayRegenerationReport("undefined");

		await expect(attempt()).rejects.toThrow(ReelVaultValidationError);
		expect(sent).toEqual([]);
	});
});
