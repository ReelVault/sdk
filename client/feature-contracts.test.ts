import { describe, expect, test } from "bun:test";
import type { Fetcher } from "./core/types";
import { ReelVaultClient } from "./index";

/**
 * Request contracts of the methods 1.3.0 added: each sends the documented method, path and body or query.
 * A recording fetcher stands in for the server, as in `contracts.test.ts`.
 */

const BASE_URL = "http://reelvault.test/v1";

interface SentRequest {
	method: string;
	url: string;
	body: unknown;
}

function recordingClient() {
	const sent: SentRequest[] = [];
	const fetcher: Fetcher = async (url, options) => {
		const body = typeof options.body === "string" ? JSON.parse(options.body) : undefined;
		sent.push({ method: options.method ?? "GET", url, body });

		return Response.json({ ok: true });
	};

	return { client: new ReelVaultClient({ baseUrl: BASE_URL, fetcher }), sent };
}

describe("1.3.0 request contracts", () => {
	test("dismissing a continue-watching title sends a DELETE for that title", async () => {
		const { client, sent } = recordingClient();

		await client.me.dismissContinueWatching("title-1");

		expect(sent).toEqual([{ method: "DELETE", url: `${BASE_URL}/me/continue-watching/title-1`, body: undefined }]);
	});

	test("the PIN status of a profile is read from its PIN route", async () => {
		const { client, sent } = recordingClient();

		await client.profiles.getPinStatus("profile-1");

		expect(sent).toEqual([{ method: "GET", url: `${BASE_URL}/profiles/profile-1/pin`, body: undefined }]);
	});

	test("the catalog statuses and the backup-code count are read from their routes", async () => {
		const { client, sent } = recordingClient();

		await client.metadata.getStatuses();
		await client.auth.getBackupCodesStatus();

		expect(sent.map((request) => `${request.method} ${request.url}`)).toEqual([
			`GET ${BASE_URL}/metadata/statuses`,
			`GET ${BASE_URL}/auth/two-factor/backup-codes`,
		]);
	});

	test("the health probes are read from the live and ready routes", async () => {
		const { client, sent } = recordingClient();

		await client.health.live();
		await client.health.ready();

		expect(sent.map((request) => request.url)).toEqual([`${BASE_URL}/health/live`, `${BASE_URL}/health/ready`]);
	});

	test("a log cleanup dry run sends the flag in the query", async () => {
		const { client, sent } = recordingClient();

		await client.admin.cleanupLogs(7, { dryRun: true });

		expect(new URL(sent[0]?.url ?? "").searchParams.get("dryRun")).toBe("true");
		expect(sent[0]?.method).toBe("DELETE");
	});

	test("the resource window is sent as the hours query", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getResources({ hours: 6 });

		expect(new URL(sent[0]?.url ?? "").searchParams.get("hours")).toBe("6");
		expect(sent[0]?.method).toBe("GET");
	});

	test("queueing a season sends its id as the body", async () => {
		const { client, sent } = recordingClient();

		await client.downloads.queueSeason({ seasonId: "season-1" });

		expect(sent).toEqual([{ method: "POST", url: `${BASE_URL}/downloads/seasons`, body: { seasonId: "season-1" } }]);
	});

	test("a password change sends the current and the new password", async () => {
		const { client, sent } = recordingClient();

		await client.auth.changePassword({ currentPassword: "old-password", newPassword: "new-password" });

		expect(sent).toEqual([
			{
				method: "POST",
				url: `${BASE_URL}/auth/change-password`,
				body: { currentPassword: "old-password", newPassword: "new-password" },
			},
		]);
	});

	test("releasing the caller's playback sessions is one DELETE on the mine route", async () => {
		const { client, sent } = recordingClient();

		await client.playbackSessions.releaseMine();

		expect(sent).toEqual([{ method: "DELETE", url: `${BASE_URL}/playback-sessions/mine`, body: undefined }]);
	});
});
