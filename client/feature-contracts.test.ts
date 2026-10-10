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

describe("1.3.0 admin and resource request contracts", () => {
	const param = (request: SentRequest | undefined, name: string) => new URL(request?.url ?? "").searchParams.get(name);

	test("cancelling an update sends the target it cancels", async () => {
		const { client, sent } = recordingClient();

		await client.admin.cancelUpdate("web");

		expect(sent).toEqual([{ method: "POST", url: `${BASE_URL}/admin/update/cancel`, body: { target: "web" } }]);
	});

	test("the update history is paged", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getUpdateHistory({ page: 2, limit: 5 });

		expect(param(sent[0], "page")).toBe("2");
		expect(param(sent[0], "limit")).toBe("5");
	});

	test("a worker's scheduled runs are switched with a PUT that carries the flag", async () => {
		const { client, sent } = recordingClient();

		await client.admin.setWorkerScheduleEnabled("check-updates", false);

		expect(sent).toEqual([{ method: "PUT", url: `${BASE_URL}/admin/workers/check-updates/enabled`, body: { enabled: false } }]);
	});

	test("a failed worker job is retried through its job route", async () => {
		const { client, sent } = recordingClient();

		await client.admin.retryWorkerJob("job-1");

		expect(sent).toEqual([{ method: "POST", url: `${BASE_URL}/admin/workers/jobs/job-1/retry`, body: undefined }]);
	});

	test("the worker job list and the active operations are filtered by status on the server", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getWorkerJobs({ status: "failed", limit: 10 });
		await client.admin.getWorkerOperations({ status: "active" });

		expect(sent[0]?.url.startsWith(`${BASE_URL}/admin/workers/jobs?`)).toBe(true);
		expect(param(sent[0], "status")).toBe("failed");
		expect(param(sent[1], "status")).toBe("active");
	});

	test("a user's sessions are paged under that user", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getUserSessions("user-1", { page: 1, limit: 10 });

		expect(new URL(sent[0]?.url ?? "").pathname).toBe("/v1/admin/users/user-1/sessions");
		expect(param(sent[0], "limit")).toBe("10");
	});

	test("a plugin's content-security-policy choice is a PUT of the enabled flag", async () => {
		const { client, sent } = recordingClient();

		await client.admin.setPluginCsp("org.example.plugin", false);

		expect(sent).toEqual([{ method: "PUT", url: `${BASE_URL}/admin/plugins/org.example.plugin/csp`, body: { enabled: false } }]);
	});

	test("a plugin's configuration is exported, imported and reset through its config routes", async () => {
		const { client, sent } = recordingClient();
		const exported = { format: "reelvault.plugin-config" as const, formatVersion: 1 as const, pluginId: "org.example.plugin", values: { region: "eu" } };

		await client.admin.exportPluginConfig("org.example.plugin");
		await client.admin.importPluginConfig("org.example.plugin", exported);
		await client.admin.resetPluginConfig("org.example.plugin", { keys: ["region"] });

		expect(sent.map((request) => `${request.method} ${request.url}`)).toEqual([
			`GET ${BASE_URL}/admin/plugins/org.example.plugin/config/export`,
			`POST ${BASE_URL}/admin/plugins/org.example.plugin/config/import`,
			`POST ${BASE_URL}/admin/plugins/org.example.plugin/config/reset`,
		]);
		expect(sent[1]?.body).toEqual(exported);
		expect(sent[2]?.body).toEqual({ keys: ["region"] });
	});

	test("the plugin interface switches are read, saved and reset on the plugin's ui route", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getPluginUiSettings("org.example.plugin");
		await client.admin.updatePluginUiSettings("org.example.plugin", { enabled: false, disabledKeys: ["button.refresh"] });
		await client.admin.resetPluginUiSettings("org.example.plugin");

		expect(sent).toEqual([
			{ method: "GET", url: `${BASE_URL}/admin/plugins/org.example.plugin/ui`, body: undefined },
			{
				method: "PUT",
				url: `${BASE_URL}/admin/plugins/org.example.plugin/ui`,
				body: { enabled: false, disabledKeys: ["button.refresh"] },
			},
			{ method: "DELETE", url: `${BASE_URL}/admin/plugins/org.example.plugin/ui`, body: undefined },
		]);
	});

	test("the log query carries its level, module, dates and text", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getLogs({ level: "error", module: "scanner", from: "2026-10-01", to: "2026-10-10", q: "timeout" });

		expect(param(sent[0], "level")).toBe("error");
		expect(param(sent[0], "module")).toBe("scanner");
		expect(param(sent[0], "from")).toBe("2026-10-01");
		expect(param(sent[0], "to")).toBe("2026-10-10");
		expect(param(sent[0], "q")).toBe("timeout");
	});

	test("the audit query carries its action, resource type, administrator and text", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getAudit({ action: "update", resourceType: "api_key", actorUserId: "user-1", q: "rotate" });

		expect(param(sent[0], "action")).toBe("update");
		expect(param(sent[0], "resourceType")).toBe("api_key");
		expect(param(sent[0], "actorUserId")).toBe("user-1");
		expect(param(sent[0], "q")).toBe("rotate");
	});

	test("an API key is rotated with a POST and edited with a PATCH", async () => {
		const { client, sent } = recordingClient();

		await client.admin.rotateApiKey("key-1");
		await client.admin.updateApiKey("key-1", { name: "renamed" });

		expect(sent).toEqual([
			{ method: "POST", url: `${BASE_URL}/admin/api-keys/key-1/rotate`, body: undefined },
			{ method: "PATCH", url: `${BASE_URL}/admin/api-keys/key-1`, body: { name: "renamed" } },
		]);
	});

	test("the system settings export is a GET and the import posts the versioned file", async () => {
		const { client, sent } = recordingClient();
		const file = { format: "reelvault.settings" as const, formatVersion: 1 as const, settings: { "stream.hlsSegmentDurationSeconds": 6 } };

		await client.admin.exportSystemSettings();
		await client.admin.importSystemSettings(file);

		expect(sent).toEqual([
			{ method: "GET", url: `${BASE_URL}/admin/settings/export`, body: undefined },
			{ method: "POST", url: `${BASE_URL}/admin/settings/import`, body: file },
		]);
	});

	test("the ended live sessions are read with their limit", async () => {
		const { client, sent } = recordingClient();

		await client.admin.getEndedLiveSessions({ limit: 20 });

		expect(new URL(sent[0]?.url ?? "").pathname).toBe("/v1/admin/live-activity/history");
		expect(param(sent[0], "limit")).toBe("20");
	});

	test("the notification page is filtered by read state and type on the server", async () => {
		const { client, sent } = recordingClient();

		await client.notifications.getPage({ unreadOnly: true, type: "security", page: 1, limit: 10 });

		expect(new URL(sent[0]?.url ?? "").pathname).toBe("/v1/notifications/page");
		expect(param(sent[0], "type")).toBe("security");
		expect(param(sent[0], "unreadOnly")).toBe("true");
	});

	test("marking all notifications read sends the type that the tab shows", async () => {
		const { client, sent } = recordingClient();

		await client.notifications.markAllRead("new_episode");

		expect(sent).toEqual([{ method: "PATCH", url: `${BASE_URL}/notifications`, body: { all: true, type: "new_episode" } }]);
	});

	test("removing notifications sends one DELETE, or a POST with the ids for a group", async () => {
		const { client, sent } = recordingClient();

		await client.notifications.delete("n-1");
		await client.notifications.deleteMany(["n-2", "n-3"]);

		expect(sent).toEqual([
			{ method: "DELETE", url: `${BASE_URL}/notifications/n-1`, body: undefined },
			{ method: "POST", url: `${BASE_URL}/notifications/delete`, body: { ids: ["n-2", "n-3"] } },
		]);
	});

	test("copying the preferences of another profile names the source profile", async () => {
		const { client, sent } = recordingClient();

		await client.profiles.copyPreferences("profile-1", "profile-2");

		expect(sent).toEqual([{ method: "POST", url: `${BASE_URL}/profiles/profile-1/preferences/copy`, body: { sourceProfileId: "profile-2" } }]);
	});

	test("subtitles are deleted in one request for the selected ids", async () => {
		const { client, sent } = recordingClient();

		await client.subtitles.bulkDelete(["sub-1", "sub-2"]);

		expect(sent).toEqual([{ method: "POST", url: `${BASE_URL}/subtitles/bulk-delete`, body: { ids: ["sub-1", "sub-2"] } }]);
	});

	test("a library's scans are cancelled through the library's scan route", async () => {
		const { client, sent } = recordingClient();

		await client.libraries.cancelScans("lib-1");

		expect(sent).toEqual([{ method: "POST", url: `${BASE_URL}/libraries/lib-1/scan/cancel`, body: undefined }]);
	});

	test("a download is cancelled or retried through its job routes", async () => {
		const { client, sent } = recordingClient();

		await client.downloads.cancel("job-1");
		await client.downloads.retry("job-1");

		expect(sent).toEqual([
			{ method: "POST", url: `${BASE_URL}/downloads/job-1/cancel`, body: undefined },
			{ method: "POST", url: `${BASE_URL}/downloads/job-1/retry`, body: undefined },
		]);
	});
});
