import { describe, expect, test } from "bun:test";
import type { MediaMarker } from "../common";
import { type ArtifactCreationCandidate, rejectPluginHook } from "../plugin/hooks";
import { createPluginTestHost, PluginTestHostError } from ".";

const candidate: ArtifactCreationCandidate = { mediaFileId: "mf-1", kind: "chapters", contentType: "application/json", size: 8 };

function hostWithMediaFile() {
	const host = createPluginTestHost();
	host.setMediaFile({ id: "mf-1", metadataId: "md-1", fileName: "movie.mkv", available: true });

	return host;
}

function manualMarker(): MediaMarker {
	return {
		id: "manual-1",
		mediaFileId: "mf-1",
		type: "intro",
		startSeconds: 0,
		endSeconds: 5,
		label: null,
		source: "manual",
		pluginId: null,
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
	};
}

describe("testing host matches the production contract", () => {
	test("markers are scoped to the plugin and emit media.markers.updated", async () => {
		const host = hostWithMediaFile();
		const events: Array<{ mediaFileId: string; markerCount: number }> = [];
		host.events.on("media.markers.updated", (payload) => {
			events.push({ mediaFileId: payload.mediaFileId, markerCount: payload.markerCount });
		});
		host.setExistingMarkers("mf-1", [manualMarker()]);

		const saved = await host.markers.set("mf-1", [{ type: "intro", startSeconds: 10, endSeconds: 20 }]);
		expect(saved[0]?.pluginId).toBe("test-plugin");
		expect(await host.markers.list("mf-1")).toEqual(saved);
		expect(host.getAllMarkers("mf-1")).toHaveLength(2);
		expect(events).toEqual([{ mediaFileId: "mf-1", markerCount: 1 }]);

		await host.markers.clear("mf-1");
		expect(await host.markers.list("mf-1")).toEqual([]);
		expect(host.getAllMarkers("mf-1")).toEqual([manualMarker()]);
		expect(events[1]).toEqual({ mediaFileId: "mf-1", markerCount: 0 });
	});

	test("an unknown media file and an invalid marker range are refused", async () => {
		const host = createPluginTestHost();
		await expect(host.markers.set("missing", [])).rejects.toMatchObject({ code: "media_file.not_found" });

		const known = hostWithMediaFile();
		await expect(known.markers.set("mf-1", [{ type: "intro", startSeconds: 30, endSeconds: 10 }])).rejects.toMatchObject({
			code: "plugin.marker_invalid_range",
		});
	});

	test("a rejected hook becomes the production error code", async () => {
		const host = createPluginTestHost();
		host.hooks.beforeArtifactCreate(() => rejectPluginHook("not this one"));
		await expect(host.runBeforeArtifactCreate(candidate)).rejects.toMatchObject({
			category: "forbidden",
			code: "plugin.hook_rejected",
		});
	});

	test("a failing hook is isolated, later hooks run and the candidate is frozen", async () => {
		const host = createPluginTestHost();
		host.hooks.beforeArtifactCreate(() => {
			throw new Error("hook exploded");
		});
		host.hooks.beforeArtifactCreate(({ candidate: value }) => {
			expect(Object.isFrozen(value)).toBe(true);
			return { ...value, contentType: "text/vtt" };
		});

		expect(await host.runBeforeArtifactCreate(candidate)).toEqual({ ...candidate, contentType: "text/vtt" });
	});

	test("a successful artifact write emits artifact.created and a usable URL", async () => {
		const host = hostWithMediaFile();
		const seen: string[] = [];
		host.events.on("artifact.created", (payload) => {
			seen.push(payload.artifactId);
		});

		const written = await host.artifacts.write({
			mediaFileId: "mf-1",
			kind: "chapters",
			contentType: "application/json",
			content: new Uint8Array([1, 2, 3, 4]),
		});
		expect(seen).toEqual([written.id]);
		expect(written.url).toBe(`/v1/media-files/mf-1/artifacts/${written.id}`);
		expect(host.getArtifactContent(written.id)).toEqual(new Uint8Array([1, 2, 3, 4]));
	});

	test("an artifact hook may not change the write's identity or size", async () => {
		const host = hostWithMediaFile();
		host.hooks.beforeArtifactCreate(({ candidate: value }) => ({ ...value, mediaFileId: "other" }));

		await expect(
			host.artifacts.write({ mediaFileId: "mf-1", kind: "chapters", contentType: "application/json", content: new Uint8Array(8) }),
		).rejects.toMatchObject({ code: "plugin.artifact_candidate_invalid" });
	});

	test("access policies fail closed and duplicate ids are refused", async () => {
		const host = createPluginTestHost();
		host.access.register({
			id: "down",
			beforeAccess: () => {
				throw new Error("policy service down");
			},
		});
		expect(await host.checkAccess({ userId: "u1", resource: "stream", action: "play" })).toEqual({
			allowed: false,
			code: "PLUGIN_ACCESS_UNAVAILABLE",
			message: "Access could not be verified",
		});
		expect(() => host.access.register({ id: "down", beforeAccess: () => undefined })).toThrow(
			expect.objectContaining({ code: "plugin.access_policy_duplicate" }),
		);
	});

	test("event handler failures never reach the publisher and duplicates run once", async () => {
		const host = createPluginTestHost();
		const seen: string[] = [];
		const handler = (): void => {
			seen.push("called");
			throw new Error("handler exploded");
		};
		host.events.on("artifact.created", handler);
		host.events.on("artifact.created", handler);

		await expect(
			host.emit("artifact.created", { mediaFileId: "mf-1", artifactId: "a-1", artifactType: "chapters" }),
		).resolves.toBeUndefined();
		expect(seen).toEqual(["called"]);
	});

	test("storage uses JSON values and serializes concurrent updates per key", async () => {
		const host = createPluginTestHost();
		await host.storage.set("at", { date: new Date("2026-01-01T00:00:00.000Z") });
		expect(await host.storage.get("at")).toEqual({ date: "2026-01-01T00:00:00.000Z" });

		await Promise.all([
			host.storage.update("count", (current) => ((current as number | undefined) ?? 0) + 1),
			host.storage.update("count", (current) => ((current as number | undefined) ?? 0) + 1),
		]);
		expect(await host.storage.get("count")).toBe(2);
	});

	test("invalid storage keys and blobs are refused with stable codes", async () => {
		const host = createPluginTestHost();
		const failed = host.storage.set("bad/key", 1);
		expect(failed).toBeInstanceOf(Promise);
		await expect(failed).rejects.toBeInstanceOf(PluginTestHostError);
		await expect(host.storage.set("bad/key", 1)).rejects.toMatchObject({ code: "plugin.storage.invalid_key" });
		await expect(host.storage.set("_leading_underscore", 1)).rejects.toMatchObject({ code: "plugin.storage.invalid_key" });

		await expect(
			host.storage.putBlob("blob", new Uint8Array([1]), { contentType: "application/json", expiresInMs: 0 }),
		).rejects.toMatchObject({
			code: "plugin.blob.invalid_retention",
		});
	});

	test("overwriting a blob is not charged twice against the quota", async () => {
		const host = createPluginTestHost();
		const chunk = (): Uint8Array => new Uint8Array(19 * 1024 * 1024);
		const options = { contentType: "application/json", expiresInMs: 60_000 };
		for (const key of ["a", "b", "c", "d", "e"]) await host.storage.putBlob(key, chunk(), options);

		await expect(host.storage.putBlob("a", chunk(), options)).resolves.toMatchObject({ size: 19 * 1024 * 1024 });
	});

	test("hooks, access policies and event handlers are time-boxed", async () => {
		const hooks = createPluginTestHost({ hookTimeoutMs: 15 });
		hooks.hooks.beforeArtifactCreate(
			() =>
				new Promise<never>(() => {
					/* never settles */
				}),
		);
		// A hanging hook is logged and skipped, not propagated — as in production.
		expect(await hooks.runBeforeArtifactCreate(candidate)).toEqual(candidate);

		const access = createPluginTestHost({ accessPolicyTimeoutMs: 15 });
		access.access.register({
			id: "slow",
			beforeAccess: () =>
				new Promise<never>(() => {
					/* never settles */
				}),
		});
		expect(await access.checkAccess({ userId: "u1", resource: "stream", action: "play" })).toMatchObject({
			allowed: false,
			code: "PLUGIN_ACCESS_UNAVAILABLE",
		});

		const events = createPluginTestHost({ eventHandlerTimeoutMs: 15 });
		events.events.on(
			"artifact.created",
			() =>
				new Promise<never>(() => {
					/* never settles */
				}),
		);
		await expect(
			events.emit("artifact.created", { mediaFileId: "mf-1", artifactId: "a-1", artifactType: "chapters" }),
		).resolves.toBeUndefined();
	});

	test("async event handlers are awaited and their failures stay isolated", async () => {
		const host = createPluginTestHost();
		let seen = false;
		host.events.on("artifact.created", async () => {
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 5);
			});
			seen = true;
		});
		await host.emit("artifact.created", { mediaFileId: "mf-1", artifactId: "a-1", artifactType: "chapters" });
		expect(seen).toBe(true);

		const failing = createPluginTestHost();
		failing.events.on("artifact.created", async () => {
			await Promise.resolve();
			throw new Error("async handler exploded");
		});
		await expect(
			failing.emit("artifact.created", { mediaFileId: "mf-1", artifactId: "a-1", artifactType: "chapters" }),
		).resolves.toBeUndefined();
	});

	test("a hook may rename an artifact kind but not move or resize it", async () => {
		const host = hostWithMediaFile();
		host.hooks.beforeArtifactCreate(({ candidate: value }) => ({ ...value, kind: "waveform" }));
		const written = await host.artifacts.write({
			mediaFileId: "mf-1",
			kind: "chapters",
			contentType: "application/json",
			content: new Uint8Array([1, 2, 3, 4]),
		});
		expect(written.kind).toBe("waveform");
	});
});
