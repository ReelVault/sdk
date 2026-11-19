import { describe, expect, test } from "bun:test";
import { ReelVaultClient } from "./app-client";
import { ReelVaultError, ReelVaultValidationError } from "./errors";
import { HttpClient } from "./http-client";
import type { ClientConfig, Fetcher } from "./types";

/**
 * Transport behavior every resource relies on: which failures are retried, how an expired
 * token is refreshed, what an aborted or malformed request reports, and how URLs are built.
 * A scripted fetcher plays the server.
 */

const ORIGIN = "http://reelvault.test";

interface Sent {
	method: string;
	url: string;
	authorization: string | null;
}

/** Answers each request with the next scripted response (the last one repeats). */
function scriptedClient(responses: Array<() => Response>, config: Partial<ClientConfig> = {}) {
	const sent: Sent[] = [];
	const fetcher: Fetcher = (url, options) => {
		sent.push({ method: options.method ?? "GET", url, authorization: new Headers(options.headers).get("authorization") });
		const next = responses[Math.min(sent.length - 1, responses.length - 1)];
		if (!next) throw new Error("no scripted response");

		return Promise.resolve(next());
	};

	return { client: new ReelVaultClient({ baseUrl: ORIGIN, fetcher, ...config }), sent };
}

const ok = () => Response.json({ statuses: ["Ended"] });
const unavailable = () => new Response("down", { status: 503 });
const unauthorized = () => Response.json({ statusCode: 401, code: "auth.session_invalid" }, { status: 401 });

describe("retries", () => {
	test("a read that hits a 503 is sent again and returns the later answer", async () => {
		const { client, sent } = scriptedClient([unavailable, ok]);

		const result = await client.metadata.getStatuses();

		expect(result).toEqual({ statuses: ["Ended"] });
		expect(sent).toHaveLength(2);
	});

	test("a POST without an idempotency key is never sent twice, so a job is not queued twice", async () => {
		const { client, sent } = scriptedClient([unavailable, ok]);

		const outcome = await client.admin.regenerateTrickplay({ scope: "titles", ids: ["t1"], force: false }).then(
			() => "resolved",
			(error: unknown) => (error instanceof ReelVaultError ? error.status : "other"),
		);

		expect(outcome).toBe(503);
		expect(sent).toHaveLength(1);
	});

	test("aborting while waiting for a retry rejects at once instead of after the back-off", async () => {
		const controller = new AbortController();
		const http = new HttpClient({
			baseUrl: ORIGIN,
			fetcher: () => Promise.resolve(new Response("slow down", { status: 503, headers: { "retry-after": "20" } })),
			defaultHeaders: {},
			requestInterceptors: [],
			responseInterceptors: [],
			enableRetry: true,
			maxRetries: 3,
			timeout: 30_000,
			credentials: "same-origin",
		});

		const started = Date.now();
		const pending = http.request({ path: "/metadata/statuses", signal: controller.signal }).then(
			() => "resolved",
			() => "rejected",
		);
		setTimeout(() => controller.abort(), 50);

		expect(await pending).toBe("rejected");
		expect(Date.now() - started).toBeLessThan(2_000);
	});
});

describe("token refresh", () => {
	test("two requests rejected with 401 share one refresh and are resent with the new token", async () => {
		let refreshes = 0;
		const { client, sent } = scriptedClient([unauthorized, unauthorized, ok, ok], {
			accessToken: "old",
			onTokenExpired: () => {
				refreshes += 1;

				return Promise.resolve("new");
			},
		});

		await Promise.all([client.metadata.getStatuses(), client.metadata.getAll({ limit: 1 })]);

		expect(refreshes).toBe(1);
		expect(sent.slice(2).map((request) => request.authorization)).toEqual(["Bearer new", "Bearer new"]);
	});

	test("a refresher that throws does not block every later refresh", async () => {
		let calls = 0;
		const { client } = scriptedClient([unauthorized, unauthorized, ok], {
			accessToken: "old",
			onTokenExpired: () => {
				calls += 1;
				if (calls === 1) throw new Error("identity provider down");

				return "fresh";
			},
		});

		const first = await client.metadata.getStatuses().then(
			() => "resolved",
			() => "rejected",
		);
		const second = await client.metadata.getStatuses();

		expect(first).toBe("rejected");
		expect(second).toEqual({ statuses: ["Ended"] });
		expect(calls).toBe(2);
	});
});

describe("responses and URLs", () => {
	test("a success with a malformed JSON body reports its status and URL", async () => {
		const { client } = scriptedClient([() => new Response("{not json", { status: 200, headers: { "content-type": "application/json" } })]);

		const error = await client.metadata.getStatuses().then(
			() => null,
			(failure: unknown) => failure,
		);

		expect(error).toBeInstanceOf(ReelVaultError);
		expect(error instanceof ReelVaultError ? [error.status, error.url] : null).toEqual([200, `${ORIGIN}/v1/metadata/statuses`]);
	});

	test("a missing path id is refused before any request is sent", async () => {
		const { client, sent } = scriptedClient([ok]);

		const error = await client.libraries.scan("").then(
			() => null,
			(failure: unknown) => failure,
		);

		expect(error).toBeInstanceOf(ReelVaultValidationError);
		expect(sent).toEqual([]);
	});

	test("a server behind a path prefix keeps the prefix in every request and link", async () => {
		const { client, sent } = scriptedClient([ok], { baseUrl: "https://media.example.org/reelvault/" });

		await client.metadata.getStatuses();

		expect(sent[0]?.url).toBe("https://media.example.org/reelvault/v1/metadata/statuses");
		expect(client.events.getWebSocketUrl()).toBe("wss://media.example.org/reelvault/v1/events/ws");
	});

	test("array filters repeat their key and empty ones are left out", async () => {
		const { client, sent } = scriptedClient([ok]);

		await client.admin.getLogs({ level: ["error", "warn"], search: undefined });

		expect(sent[0]?.url).toBe(`${ORIGIN}/v1/admin/logs?level=error&level=warn`);
	});
});
