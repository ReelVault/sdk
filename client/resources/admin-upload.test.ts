import { describe, expect, test } from "bun:test";
import { NetworkError, ReelVaultClient, ReelVaultError, TimeoutError } from "../index";

/** Minimal XHR stand-in: installPluginArchive uses it for upload progress. */
class FakeXhr {
	static instances: FakeXhr[] = [];
	readonly listeners = new Map<string, Array<() => void>>();
	readonly upload = { addEventListener: (): void => undefined };
	status = 0;
	statusText = "";
	responseText = "";
	timeout = 0;

	constructor() {
		FakeXhr.instances.push(this);
	}

	open(): void {
		// no-op
	}
	setRequestHeader(): void {
		// no-op
	}
	send(): void {
		// no-op
	}
	getResponseHeader(name: string): string | null {
		return name === "x-request-id" ? "req-1" : null;
	}
	addEventListener(type: string, listener: () => void): void {
		this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
	}
	fire(type: string): void {
		for (const listener of this.listeners.get(type) ?? []) listener();
	}
}

const ORIGIN = "http://reelvault.test";

function withFakeXhr(run: (start: () => Promise<unknown>, last: () => FakeXhr) => Promise<void>): Promise<void> {
	const original = globalThis.XMLHttpRequest;
	globalThis.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;

	return run(
		() => new ReelVaultClient({ baseUrl: ORIGIN }).admin.installPluginArchive(new File(["zip"], "plugin.zip")),
		() => FakeXhr.instances.at(-1) as FakeXhr,
	).finally(() => {
		globalThis.XMLHttpRequest = original;
	});
}

describe("installPluginArchive errors", () => {
	test("an HTTP failure is a ReelVaultError with status, code, url and request id", async () => {
		await withFakeXhr(async (start, last) => {
			const pending = start();
			const xhr = last();
			xhr.status = 422;
			xhr.statusText = "Unprocessable Entity";
			xhr.responseText = JSON.stringify({ message: "bad archive", code: "plugin.invalid_archive" });
			xhr.fire("load");

			await expect(pending).rejects.toMatchObject({
				name: "ReelVaultError",
				status: 422,
				code: "plugin.invalid_archive",
				url: `${ORIGIN}/v1/admin/plugins/install-upload`,
				requestId: "req-1",
				method: "POST",
			});
			await expect(pending).rejects.toBeInstanceOf(ReelVaultError);
		});
	});

	test("a plain-text error body keeps the server message", async () => {
		await withFakeXhr(async (start, last) => {
			const pending = start();
			const xhr = last();
			xhr.status = 500;
			xhr.statusText = "Internal Server Error";
			xhr.responseText = "disk full";
			xhr.fire("load");

			await expect(pending).rejects.toMatchObject({ message: expect.stringContaining("HTTP 500: disk full") });
		});
	});

	test("an unexpected 2xx body is a ReelVaultError, not a plain Error", async () => {
		await withFakeXhr(async (start, last) => {
			const pending = start();
			const xhr = last();
			xhr.status = 200;
			xhr.responseText = JSON.stringify({ ok: true });
			xhr.fire("load");

			await expect(pending).rejects.toBeInstanceOf(ReelVaultError);
		});
	});

	test("network failures and timeouts keep their structured types", async () => {
		await withFakeXhr(async (start, last) => {
			const network = start();
			last().fire("error");
			await expect(network).rejects.toBeInstanceOf(NetworkError);

			const timeout = start();
			last().fire("timeout");
			await expect(timeout).rejects.toMatchObject({ timeout: 120_000 });
			await expect(timeout).rejects.toBeInstanceOf(TimeoutError);
		});
	});
});
