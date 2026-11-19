import type {
	CreateMediaMarker,
	MediaMarker,
	MetadataCandidate,
	MetadataItem,
	PlaybackArtifact,
	PlaybackArtifactWrite,
	PluginMediaFile,
} from "../common";
import { playbackArtifactKinds } from "../common";
import type { Logger } from "../common/logger";
import type { PluginAccessContext, PluginAccessDenial, PluginAccessPolicy } from "../plugin/access";
import { createPluginEventPayload, type PluginEventHandler, type PluginEventInput, type PluginEventName } from "../plugin/events";
import {
	type ArtifactCreationCandidate,
	type BeforeArtifactCreateHook,
	type BeforeMediaRecognitionHook,
	type BeforeMetadataSaveHook,
	type MediaRecognitionCandidate,
	PluginHookRejection,
} from "../plugin/hooks";
import type { PluginHttpRoute } from "../plugin/http";
import type { OutgoingNotification, PluginAdminNotification, PluginNotification, PluginNotificationChannel } from "../plugin/notifications";
import type { PluginBlob, PluginBlobMetadata, PluginBlobWriteOptions } from "../plugin/storage";
import type {
	ExtractedFrame,
	ExtractedSprite,
	FrameExtractionRequest,
	MediaAnalyzer,
	MetadataAvailability,
	MetadataProvider,
	PluginEnqueueOptions,
	PluginEpisodeMediaFile,
	PluginHost,
	PluginJobDefinition,
	PluginJobHandle,
	PluginMediaFileInfo,
	PluginScheduledTaskDefinition,
	ProviderDiscoveryRequest,
	ProviderDiscoveryResult,
	ProviderMediaType,
	ProviderMetadataResult,
	ProviderResultGenre,
	ProviderSearchRequest,
	ProviderSearchResponse,
	ProviderSeasonResult,
	ProviderStatus,
	SpriteExtractionRequest,
	SubtitleProvider,
} from "../plugin/types";

export interface EnqueuedPluginJob {
	name: string;
	data: unknown;
	options?: PluginEnqueueOptions | undefined;
}

/** The mock acts as one plugin; production stamps that id on everything it writes. */
const TEST_PLUGIN_ID = "test-plugin";

// Defaults matching the real host's limits and timeouts; concurrency is fixed
// here instead of being derived from server capacity.
const HOOK_TIMEOUT_MS = 5_000;
const ACCESS_POLICY_TIMEOUT_MS = 1_000;
const EVENT_HANDLER_TIMEOUT_MS = 5_000;
const EVENT_CONCURRENCY = 8;
const STORAGE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const MAX_STORAGE_KEY_LENGTH = 128;
const MAX_STORAGE_VALUE_BYTES = 64 * 1024;
const MAX_STORAGE_KEYS = 10_000;
const MAX_BLOB_BYTES = 20 * 1024 * 1024;
const MAX_BLOB_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_BLOB_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CONTENT_TYPE_LENGTH = 255;
const ALLOWED_ARTIFACT_CONTENT_TYPES = new Set(["text/vtt", "text/plain", "application/json", "image/webp", "image/png", "image/jpeg"]);
const VALID_ARTIFACT_KINDS: ReadonlySet<string> = new Set(playbackArtifactKinds);
const MAX_ARTIFACT_BYTES = 100 * 1024 * 1024;
const MAX_ARTIFACT_TOTAL_BYTES = 512 * 1024 * 1024;

type ErrorCategory = "validation" | "not_found" | "forbidden" | "conflict" | "internal";

/** A production-shaped error: code and category are what a plugin can branch on. */
export class PluginTestHostError extends Error {
	readonly category: ErrorCategory;
	readonly code: string;
	readonly params?: Record<string, string | number> | undefined;

	constructor(category: ErrorCategory, code: string, message: string, cause?: Error, params?: Record<string, string | number>) {
		super(message, cause === undefined ? undefined : { cause });
		this.name = "PluginTestHostError";
		this.category = category;
		this.code = code;
		this.params = params;
	}
}

function fail(
	category: ErrorCategory,
	code: string,
	message: string,
	causeOrParams?: Error | Record<string, string | number>,
	params?: Record<string, string | number>,
): never {
	if (causeOrParams instanceof Error) throw new PluginTestHostError(category, code, message, causeOrParams, params);
	throw new PluginTestHostError(category, code, message, undefined, causeOrParams);
}

/** Discards all output; the test host logger must never emit logs. */
function noop(): void {
	// Intentionally silent.
}

function timeoutFromConfig(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

async function withTimeout<T>(work: () => T | Promise<T>, timeoutMs: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<never>((_resolve, reject) => {
		timer = setTimeout(() => reject(new PluginTestHostError("internal", "plugin.timeout", `Timed out after ${timeoutMs}ms`)), timeoutMs);
	});

	try {
		const running = (async (): Promise<T> => work())();
		return await Promise.race([running, deadline]);
	} finally {
		if (timer !== undefined) clearTimeout(timer);
	}
}

/** Core publishers fire events without waiting for plugin handlers, just like production. */
function detach(promise: Promise<unknown>): void {
	promise.catch(() => {
		// emit isolates handler failures, so there is nothing to handle here.
	});
}

/** Turns a synchronous validation failure into the rejection the host interface promises. */
function asPromise<T>(work: () => T): Promise<T> {
	try {
		return Promise.resolve(work());
	} catch (error) {
		return Promise.reject(error);
	}
}

function deepFreeze<T>(value: T): T {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const child of Object.values(value)) deepFreeze(child);
	}

	return value;
}

/** Bounded, fail-isolated fan-out — the real bus never lets one handler break the others. */
async function mapConcurrent<T, TResult>(
	items: readonly T[],
	concurrency: number,
	work: (item: T) => Promise<TResult>,
): Promise<TResult[]> {
	const results: TResult[] = [];
	let next = 0;
	const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
		while (next < items.length) {
			const index = next++;
			const item = items[index];
			if (item === undefined) continue;
			results[index] = await work(item);
		}
	});

	await Promise.all(workers);

	return results;
}

type Hook<TCandidate> = (context: { readonly candidate: Readonly<TCandidate> }) => TCandidate | undefined | Promise<TCandidate | undefined>;

type ErasedEventHandler = (payload: never) => void | Promise<void>;

export class PluginTestHost implements PluginHost {
	readonly logger: Logger = createTestLogger();
	readonly config: Readonly<Record<string, unknown>> = {};
	readonly http = {
		fetch: (): Promise<Response> => Promise.resolve(new Response("")),
	};
	readonly registeredProviders: MetadataProvider[] = [];
	readonly registeredSubtitleProviders: SubtitleProvider[] = [];
	readonly registeredMediaAnalyzers: MediaAnalyzer[] = [];
	readonly registeredJobs: PluginJobDefinition[] = [];
	readonly registeredRoutes: PluginHttpRoute[] = [];
	readonly registeredAccessPolicies: PluginAccessPolicy[] = [];
	readonly createdNotifications: PluginNotification[] = [];
	readonly createdAdminNotifications: PluginAdminNotification[] = [];
	readonly enqueuedJobs: EnqueuedPluginJob[] = [];
	private readonly mediaFiles = new Map<string, PluginMediaFile>();
	private readonly metadataItems = new Map<string, MetadataItem>();
	private readonly storedValues = new Map<string, string>();
	private readonly storageLocks = new Map<string, Promise<unknown>>();
	private readonly storedBlobs = new Map<string, { metadata: PluginBlobMetadata; content: Uint8Array }>();
	private readonly storedArtifacts = new Map<string, PlaybackArtifact[]>();
	private readonly artifactContents = new Map<string, Uint8Array>();
	private readonly storedMarkers = new Map<string, MediaMarker[]>();

	private readonly eventHandlers = new Map<PluginEventName, Set<ErasedEventHandler>>();
	private readonly beforeArtifactCreateHooks = new Set<BeforeArtifactCreateHook>();
	private readonly beforeMediaRecognitionHooks = new Set<BeforeMediaRecognitionHook>();
	private readonly beforeMetadataSaveHooks = new Set<BeforeMetadataSaveHook>();
	private readonly hookTimeoutMs: number;
	private readonly accessPolicyTimeoutMs: number;
	private readonly eventHandlerTimeoutMs: number;

	readonly providers = {
		register: (provider: MetadataProvider): Promise<void> => {
			this.registeredProviders.push(provider);

			return Promise.resolve();
		},
		list: (): Promise<ProviderStatus[]> =>
			Promise.resolve(
				this.registeredProviders.map((provider) => ({
					id: provider.id,
					name: provider.name,
					version: provider.version,
					pluginId: TEST_PLUGIN_ID,
				})),
			),
		search: (_request: ProviderSearchRequest): Promise<ProviderSearchResponse[]> => Promise.resolve([]),
		getDetails: (_providerId: string, _type: ProviderMediaType, _externalId: string): Promise<ProviderMetadataResult | null> =>
			Promise.resolve(null),
		getSeasonDetails: (_providerId: string, _externalId: string, _seasonNumber: number): Promise<ProviderSeasonResult | null> =>
			Promise.resolve(null),
		resolveDetails: (_type: ProviderMediaType, _title: string, _year?: number): Promise<ProviderMetadataResult | null> =>
			Promise.resolve(null),
		discover: (_request: ProviderDiscoveryRequest): Promise<ProviderDiscoveryResult | null> => Promise.resolve(null),
		getGenres: (_type: ProviderMediaType, _providerId?: string): Promise<ProviderResultGenre[]> => Promise.resolve([]),
	};

	readonly subtitles = {
		register: (provider: SubtitleProvider): Promise<void> => {
			this.registeredSubtitleProviders.push(provider);

			return Promise.resolve();
		},
	};

	readonly media = {
		get: (mediaFileId: string): Promise<PluginMediaFile | null> => Promise.resolve(this.mediaFiles.get(mediaFileId) ?? null),
		getRevision: (): Promise<null> => Promise.resolve(null),
		listEpisodeFilesBySeason: (): Promise<Map<string, PluginEpisodeMediaFile[]>> =>
			Promise.resolve(new Map<string, PluginEpisodeMediaFile[]>()),
		listAllMediaFiles: (): Promise<PluginMediaFileInfo[]> => Promise.resolve([]),
		registerAnalyzer: (analyzer: MediaAnalyzer): Promise<void> => {
			this.registeredMediaAnalyzers.push(analyzer);

			return Promise.resolve();
		},
	};

	readonly metadata = {
		get: (metadataId: string): Promise<MetadataItem | null> => Promise.resolve(this.metadataItems.get(metadataId) ?? null),
		findByExternalId: (providerId: string, externalId: string, type: ProviderMediaType): Promise<MetadataAvailability | null> =>
			Promise.resolve(this.findAvailability(providerId, externalId, type)),
		findManyByExternalIds: (providerId: string, externalIds: readonly string[], type: ProviderMediaType): Promise<MetadataAvailability[]> =>
			Promise.resolve(
				externalIds
					.map((externalId) => this.findAvailability(providerId, externalId, type))
					.filter((availability): availability is MetadataAvailability => availability !== null),
			),
	};

	readonly artifacts = {
		list: (mediaFileId: string): Promise<PlaybackArtifact[]> =>
			Promise.resolve(structuredClone(this.storedArtifacts.get(mediaFileId) ?? [])),
		write: async (artifact: PlaybackArtifactWrite): Promise<PlaybackArtifact> => {
			const size = artifact.content instanceof Blob ? artifact.content.size : artifact.content.byteLength;
			if (!(artifact.mediaFileId && VALID_ARTIFACT_KINDS.has(artifact.kind))) {
				fail("validation", "artifact.invalid_request", "An artifact needs a media file and a supported kind");
			}
			if (!ALLOWED_ARTIFACT_CONTENT_TYPES.has(artifact.contentType)) {
				fail("validation", "artifact.invalid_content_type", `Content type "${artifact.contentType}" is not allowed`);
			}
			if (size > MAX_ARTIFACT_BYTES) fail("validation", "artifact.too_large", `Artifact must not exceed ${MAX_ARTIFACT_BYTES} bytes`);
			// Gates run before hooks, so a refused write has no hook side effects.
			const storedBytes = [...this.artifactContents.values()].reduce((total, bytes) => total + bytes.byteLength, 0);
			if (storedBytes + size > MAX_ARTIFACT_TOTAL_BYTES) {
				fail("validation", "plugin.artifact.quota_exceeded", "Plugin artifact quota exceeded");
			}
			const candidate = await this.runBeforeArtifactCreate({
				mediaFileId: artifact.mediaFileId,
				kind: artifact.kind,
				contentType: artifact.contentType,
				size,
			});
			// A hook may rename the kind to another valid one, but not move the
			// artifact or change its size — the same rule the store applies.
			if (candidate.mediaFileId !== artifact.mediaFileId || candidate.size !== size || !VALID_ARTIFACT_KINDS.has(candidate.kind)) {
				fail("validation", "plugin.artifact_candidate_invalid", "A hook may not change an artifact's file, size or kind");
			}
			if (!ALLOWED_ARTIFACT_CONTENT_TYPES.has(candidate.contentType)) {
				fail("validation", "artifact.invalid_content_type", `Content type "${candidate.contentType}" is not allowed`);
			}
			this.assertKnownMediaFile(candidate.mediaFileId, "artifact.not_found");
			const content =
				artifact.content instanceof Blob ? new Uint8Array(await artifact.content.arrayBuffer()) : new Uint8Array(artifact.content);
			const id = crypto.randomUUID();
			const storedArtifact: PlaybackArtifact = {
				id,
				mediaFileId: candidate.mediaFileId,
				pluginId: TEST_PLUGIN_ID,
				kind: candidate.kind,
				url: `/v1/media-files/${candidate.mediaFileId}/artifacts/${id}`,
				contentType: candidate.contentType,
				createdAt: new Date().toISOString(),
			};
			this.artifactContents.set(storedArtifact.id, content);
			const mediaArtifacts = this.storedArtifacts.get(candidate.mediaFileId) ?? [];
			mediaArtifacts.push(storedArtifact);
			this.storedArtifacts.set(candidate.mediaFileId, mediaArtifacts);
			detach(
				this.emit("artifact.created", {
					mediaFileId: storedArtifact.mediaFileId,
					artifactId: storedArtifact.id,
					artifactType: storedArtifact.kind,
				}),
			);

			return storedArtifact;
		},
	};

	readonly ffmpeg = {
		runAnalyse: (): Promise<{ exitCode: number; stderr: string }> => Promise.resolve({ exitCode: 0, stderr: "" }),
		extractFrame: (request: FrameExtractionRequest): Promise<ExtractedFrame> =>
			Promise.resolve({
				content: new Uint8Array([0]),
				contentType: request.format === "jpeg" ? "image/jpeg" : "image/webp",
			}),
		extractSprite: (request: SpriteExtractionRequest): Promise<ExtractedSprite> =>
			Promise.resolve({
				content: new Uint8Array([0]),
				contentType: request.format === "jpeg" ? "image/jpeg" : "image/webp",
				frameWidth: request.width,
				frameHeight: request.height,
				columns: request.columns,
				rows: Math.ceil(request.timeMs.length / request.columns),
			}),
	};

	readonly jobs = {
		register: <TData = unknown, TResult = unknown>(definition: PluginJobDefinition<TData, TResult>): Promise<void> => {
			this.registeredJobs.push(definition);

			return Promise.resolve();
		},
		enqueue: (name: string, data: unknown, options?: PluginEnqueueOptions): Promise<PluginJobHandle> => {
			this.enqueuedJobs.push({ name, data, options });

			return Promise.resolve({ id: crypto.randomUUID(), name, operationId: options?.operationId });
		},
		enqueueMany: (
			name: string,
			items: Array<{ data: unknown; options?: PluginEnqueueOptions }>,
			commonOptions?: { operationId?: string; reference?: { type: string; id: string } },
		): Promise<PluginJobHandle[]> => {
			const handles: PluginJobHandle[] = [];
			const opId = commonOptions?.operationId ?? crypto.randomUUID();
			for (const item of items) {
				const opts = { ...item.options, operationId: item.options?.operationId ?? opId };
				this.enqueuedJobs.push({ name, data: item.data, options: opts });
				handles.push({ id: crypto.randomUUID(), name, operationId: opId });
			}

			return Promise.resolve(handles);
		},
	};

	readonly tasks = {
		register: (_task: PluginScheduledTaskDefinition): Promise<void> => {
			// intentionally empty
			return Promise.resolve();
		},
	};

	readonly routes = {
		register: (route: PluginHttpRoute): Promise<void> => {
			this.registeredRoutes.push(route);

			return Promise.resolve();
		},
	};

	readonly access = {
		register: (policy: PluginAccessPolicy): void => {
			if (!policy.id.trim()) fail("validation", "plugin.access_policy_id_required", "An access policy needs a non-empty id");
			if (this.registeredAccessPolicies.some((registered) => registered.id === policy.id)) {
				fail("conflict", "plugin.access_policy_duplicate", `Access policy "${policy.id}" is already registered`);
			}
			this.registeredAccessPolicies.push(policy);
		},
	};

	readonly notifications = {
		create: (notification: PluginNotification): Promise<void> => {
			this.createdNotifications.push(structuredClone(notification));

			return Promise.resolve();
		},
		createForAdmins: (notification: PluginAdminNotification): Promise<void> => {
			this.createdAdminNotifications.push(structuredClone(notification));

			return Promise.resolve();
		},
	};

	/** Channels registered through `host.notificationChannels` during tests. */
	readonly registeredChannels: PluginNotificationChannel[] = [];

	readonly notificationChannels = {
		register: (channel: PluginNotificationChannel): void => {
			this.registeredChannels.push(channel);
		},
	};

	/** Deliver an outgoing notification to every registered test channel. */
	async deliverToChannels(notification: OutgoingNotification): Promise<void> {
		for (const channel of this.registeredChannels) await channel.deliver(notification);
	}

	readonly realtime = {
		broadcast: (_type: string, _payload: unknown): void => {
			// intentionally empty
		},
		sendToUser: (_userId: string, _type: string, _payload: unknown): void => {
			// intentionally empty
		},
		sendToProfile: (_profileId: string, _type: string, _payload: unknown): void => {
			// intentionally empty
		},
		sendToSession: (_sessionId: string, _type: string, _payload: unknown): void => {
			// intentionally empty
		},
	};

	readonly storage = {
		get: (key: string): Promise<unknown> =>
			asPromise(() => {
				assertStorageKey(key);

				return this.readStoredValue(key);
			}),
		set: (key: string, value: unknown): Promise<void> =>
			asPromise(() => {
				this.setStoredValue(key, value);
			}),
		update: (key: string, updater: (current: unknown) => unknown): Promise<unknown> =>
			this.runExclusive(key, async () => {
				assertStorageKey(key);
				const next = await updater(this.readStoredValue(key));
				this.setStoredValue(key, next);

				return next;
			}),
		delete: (key: string): Promise<void> =>
			asPromise(() => {
				assertStorageKey(key);
				this.storedValues.delete(key);
			}),
		list: (prefix?: string): Promise<string[]> =>
			Promise.resolve(
				[...this.storedValues.keys()]
					.filter((key) => !prefix || key.startsWith(prefix))
					.toSorted()
					.slice(0, MAX_STORAGE_KEYS),
			),
		putBlob: async (key: string, content: Blob | Uint8Array, options: PluginBlobWriteOptions): Promise<PluginBlobMetadata> => {
			assertStorageKey(key);
			const bytes = content instanceof Blob ? new Uint8Array(await content.arrayBuffer()) : new Uint8Array(content);
			if (bytes.byteLength > MAX_BLOB_BYTES)
				fail("validation", "plugin.blob.too_large", `Plugin blob must not exceed ${MAX_BLOB_BYTES} bytes`);
			if (!options.contentType.trim() || options.contentType.length > MAX_CONTENT_TYPE_LENGTH) {
				fail("validation", "plugin.blob.invalid_content_type", "Plugin blob needs a non-blank content type");
			}
			if (!Number.isInteger(options.expiresInMs) || options.expiresInMs <= 0 || options.expiresInMs > MAX_BLOB_RETENTION_MS) {
				fail("validation", "plugin.blob.invalid_retention", `Plugin blob retention must be between 1 and ${MAX_BLOB_RETENTION_MS} ms`);
			}
			this.purgeExpiredBlobs();
			const replaced = this.storedBlobs.get(key)?.content.byteLength ?? 0;
			const used = [...this.storedBlobs.values()].reduce((total, blob) => total + blob.content.byteLength, 0) - replaced;
			if (used + bytes.byteLength > MAX_BLOB_TOTAL_BYTES) {
				fail("validation", "plugin.blobs_quota_exceeded", "Plugin blob storage quota exceeded");
			}
			const createdAt = new Date();
			const metadata: PluginBlobMetadata = {
				key,
				contentType: options.contentType,
				size: bytes.byteLength,
				createdAt: createdAt.toISOString(),
				expiresAt: new Date(createdAt.getTime() + options.expiresInMs).toISOString(),
			};
			this.storedBlobs.set(key, { metadata, content: bytes });

			return metadata;
		},
		getBlob: (key: string): Promise<PluginBlob | undefined> =>
			asPromise(() => {
				assertStorageKey(key);

				return this.readLiveBlob(key);
			}),
		deleteBlob: (key: string): Promise<void> =>
			asPromise(() => {
				assertStorageKey(key);
				this.storedBlobs.delete(key);
			}),
	};

	readonly markers = {
		list: (mediaFileId: string): Promise<MediaMarker[]> => Promise.resolve(this.listMarkers(mediaFileId)),
		set: (mediaFileId: string, markers: readonly CreateMediaMarker[]): Promise<MediaMarker[]> =>
			asPromise(() => this.setMarkers(mediaFileId, markers)),
		clear: (mediaFileId: string): Promise<void> => asPromise(() => this.clearMarkers(mediaFileId)),
	};

	readonly events = {
		on: <TEvent extends PluginEventName>(event: TEvent, handler: PluginEventHandler<TEvent>): void => {
			const handlers = this.eventHandlers.get(event) ?? new Set<ErasedEventHandler>();
			handlers.add(handler);
			this.eventHandlers.set(event, handlers);
		},
	};

	readonly hooks = {
		beforeArtifactCreate: (handler: BeforeArtifactCreateHook): void => {
			this.beforeArtifactCreateHooks.add(handler);
		},
		beforeMediaRecognition: (handler: BeforeMediaRecognitionHook): void => {
			this.beforeMediaRecognitionHooks.add(handler);
		},
		beforeMetadataSave: (handler: BeforeMetadataSaveHook): void => {
			this.beforeMetadataSaveHooks.add(handler);
		},
	};

	constructor(config: Readonly<Record<string, unknown>> = {}) {
		this.config = config;
		this.hookTimeoutMs = timeoutFromConfig(config.hookTimeoutMs, HOOK_TIMEOUT_MS);
		this.accessPolicyTimeoutMs = timeoutFromConfig(config.accessPolicyTimeoutMs, ACCESS_POLICY_TIMEOUT_MS);
		this.eventHandlerTimeoutMs = timeoutFromConfig(config.eventHandlerTimeoutMs, EVENT_HANDLER_TIMEOUT_MS);
	}

	/**
	 * Test driver: fires one event at the registered handlers. Production never
	 * lets a failing or slow handler reach the publisher, and neither do we.
	 */
	async emit<TEvent extends PluginEventName>(event: TEvent, input: PluginEventInput<TEvent>): Promise<void> {
		const handlers = this.eventHandlers.get(event);
		if (!handlers || handlers.size === 0) return;

		const payload = createPluginEventPayload(input);
		await mapConcurrent([...handlers], EVENT_CONCURRENCY, async (handler) => {
			try {
				await withTimeout(async () => {
					await Reflect.apply(handler, undefined, [payload]);
				}, this.eventHandlerTimeoutMs);
			} catch (error) {
				this.logger.error(`Plugin event handler for "${event}" failed`, toError(error));
			}
		});
	}

	setMediaFile(mediaFile: PluginMediaFile): void {
		this.mediaFiles.set(mediaFile.id, mediaFile);
	}

	setMetadataItem(metadata: MetadataItem): void {
		this.metadataItems.set(metadata.id, metadata);
	}

	/** Seeds markers owned by the user or another plugin so scoping can be tested. */
	setExistingMarkers(mediaFileId: string, markers: readonly MediaMarker[]): void {
		this.storedMarkers.set(
			mediaFileId,
			markers.map((marker) => structuredClone(marker)),
		);
	}

	private findAvailability(providerId: string, externalId: string, type: ProviderMediaType): MetadataAvailability | null {
		for (const metadata of this.metadataItems.values()) {
			if (metadata.type !== type) continue;

			const matches = metadata.externalIds.some(
				(identity) => identity.providerId === providerId && identity.entityType === type && identity.externalId === externalId,
			);
			if (!matches) continue;

			const fileCount = [...this.mediaFiles.values()].filter((file) => file.metadataId === metadata.id).length;

			return { externalId, metadataId: metadata.id, title: metadata.title, type, hasFiles: fileCount > 0, fileCount };
		}

		return null;
	}

	/** Test driver: every marker on the file, including user and other-plugin markers. */
	getAllMarkers(mediaFileId: string): MediaMarker[] {
		return structuredClone(this.storedMarkers.get(mediaFileId) ?? []);
	}

	getArtifactContent(artifactId: string): Uint8Array | undefined {
		const content = this.artifactContents.get(artifactId);

		return content ? new Uint8Array(content) : undefined;
	}

	private listMarkers(mediaFileId: string): MediaMarker[] {
		return (this.storedMarkers.get(mediaFileId) ?? [])
			.filter((marker) => marker.pluginId === TEST_PLUGIN_ID)
			.toSorted((left, right) => left.startSeconds - right.startSeconds)
			.map((marker) => structuredClone(marker));
	}

	private setMarkers(mediaFileId: string, markers: readonly CreateMediaMarker[]): MediaMarker[] {
		this.assertKnownMediaFile(mediaFileId);
		const now = new Date().toISOString();
		const saved: MediaMarker[] = markers
			.map((marker) => {
				if (marker.startSeconds < 0 || marker.endSeconds < marker.startSeconds) {
					fail("validation", "plugin.marker_invalid_range", "A marker needs 0 <= startSeconds <= endSeconds");
				}

				return {
					id: crypto.randomUUID(),
					mediaFileId,
					type: marker.type,
					startSeconds: marker.startSeconds,
					endSeconds: marker.endSeconds,
					label: marker.label ?? null,
					source: marker.source ?? "plugin",
					pluginId: marker.pluginId ?? TEST_PLUGIN_ID,
					createdAt: now,
					updatedAt: now,
				};
			})
			.toSorted((left, right) => left.startSeconds - right.startSeconds);
		const others = (this.storedMarkers.get(mediaFileId) ?? []).filter((marker) => marker.pluginId !== TEST_PLUGIN_ID);
		this.storedMarkers.set(mediaFileId, [...others, ...saved]);
		detach(this.emit("media.markers.updated", { mediaFileId, markerCount: saved.length }));

		return structuredClone(saved);
	}

	private clearMarkers(mediaFileId: string): void {
		this.assertKnownMediaFile(mediaFileId);
		const others = (this.storedMarkers.get(mediaFileId) ?? []).filter((marker) => marker.pluginId !== TEST_PLUGIN_ID);
		this.storedMarkers.set(mediaFileId, others);
		detach(this.emit("media.markers.updated", { mediaFileId, markerCount: 0 }));
	}

	private assertKnownMediaFile(mediaFileId: string, code = "media_file.not_found"): void {
		if (!this.mediaFiles.has(mediaFileId)) {
			fail("not_found", code, `Media file "${mediaFileId}" does not exist`);
		}
	}

	private readStoredValue(key: string): unknown {
		const serialized = this.storedValues.get(key);
		if (serialized === undefined) return undefined;

		try {
			const parsed: unknown = JSON.parse(serialized);
			return parsed;
		} catch (cause) {
			throw new PluginTestHostError("internal", "plugin.storage_corrupt", `Stored value for "${key}" is corrupt`, toError(cause));
		}
	}

	private setStoredValue(key: string, value: unknown): void {
		assertStorageKey(key);
		let serialized: string | undefined;
		try {
			serialized = JSON.stringify(value) as string | undefined;
		} catch (cause) {
			fail("validation", "plugin.storage.invalid_value", "Plugin storage value must be JSON-serializable", toError(cause));
		}
		if (serialized === undefined) fail("validation", "plugin.storage.invalid_value", "Plugin storage value must be JSON-serializable");
		if (new TextEncoder().encode(serialized).byteLength > MAX_STORAGE_VALUE_BYTES) {
			fail("validation", "plugin.storage.value_too_large", `Plugin storage value must not exceed ${MAX_STORAGE_VALUE_BYTES} bytes`);
		}
		this.storedValues.set(key, serialized);
	}

	/** Serializes read-modify-write per key so concurrent updates cannot lose a write. */
	private async runExclusive<T>(key: string, task: () => Promise<T>): Promise<T> {
		const previous = this.storageLocks.get(key) ?? Promise.resolve();
		let release!: () => void;
		const current = new Promise<void>((resolve) => {
			release = resolve;
		});
		this.storageLocks.set(key, current);
		await previous;
		try {
			return await task();
		} finally {
			release();
			if (this.storageLocks.get(key) === current) this.storageLocks.delete(key);
		}
	}

	private purgeExpiredBlobs(): void {
		const now = new Date();
		for (const [key, stored] of this.storedBlobs) {
			if (new Date(stored.metadata.expiresAt) <= now) this.storedBlobs.delete(key);
		}
	}

	private readLiveBlob(key: string): PluginBlob | undefined {
		const stored = this.storedBlobs.get(key);
		if (!stored || new Date(stored.metadata.expiresAt) <= new Date()) {
			this.storedBlobs.delete(key);

			return undefined;
		}

		const content = new Uint8Array(stored.content.byteLength);
		content.set(stored.content);

		return { ...stored.metadata, content: new Blob([content], { type: stored.metadata.contentType }) };
	}

	private async runHook<TCandidate>(name: string, hooks: ReadonlySet<Hook<TCandidate>>, candidate: TCandidate): Promise<TCandidate> {
		let transformed = candidate;
		for (const hook of hooks) {
			const frozen = deepFreeze(structuredClone(transformed));
			try {
				const result = await withTimeout(() => hook({ candidate: frozen }), this.hookTimeoutMs);
				if (result !== undefined) transformed = result;
			} catch (error) {
				if (error instanceof PluginHookRejection) {
					throw new PluginTestHostError("forbidden", "plugin.hook_rejected", error.message, error, {
						hook: name,
						plugin: TEST_PLUGIN_ID,
					});
				}
				// Production logs a failing or hanging hook and lets the next one run.
				this.logger.error(`Plugin ${name} hook failed`, toError(error));
			}
		}

		return transformed;
	}

	runBeforeMetadataSave(candidate: MetadataCandidate): Promise<MetadataCandidate> {
		return this.runHook("beforeMetadataSave", this.beforeMetadataSaveHooks, candidate);
	}

	runBeforeMediaRecognition(candidate: MediaRecognitionCandidate): Promise<MediaRecognitionCandidate> {
		return this.runHook("beforeMediaRecognition", this.beforeMediaRecognitionHooks, candidate);
	}

	runBeforeArtifactCreate(candidate: ArtifactCreationCandidate): Promise<ArtifactCreationCandidate> {
		return this.runHook("beforeArtifactCreate", this.beforeArtifactCreateHooks, candidate);
	}

	/** First denial wins; a throwing or slow policy fails closed, as it does in production. */
	async checkAccess(context: PluginAccessContext): Promise<PluginAccessDenial | undefined> {
		const frozen = Object.freeze({ ...context });
		for (const policy of this.registeredAccessPolicies) {
			let denial: PluginAccessDenial | undefined;
			try {
				denial = await withTimeout(() => policy.beforeAccess(frozen), this.accessPolicyTimeoutMs);
			} catch {
				return { allowed: false, code: "PLUGIN_ACCESS_UNAVAILABLE", message: "Access could not be verified" };
			}
			if (denial) return denial;
		}

		return undefined;
	}
}

function assertStorageKey(key: string): void {
	if (!STORAGE_KEY_PATTERN.test(key) || key.length > MAX_STORAGE_KEY_LENGTH) {
		fail("validation", "plugin.storage.invalid_key", "Storage keys may contain letters, digits, dot, underscore and dash (max 128)");
	}
}

function toError(value: unknown): Error {
	return value instanceof Error ? value : new Error(String(value));
}

export function createPluginTestHost(config: Readonly<Record<string, unknown>> = {}): PluginTestHost {
	return new PluginTestHost(config);
}

export function createTestLogger(): Logger {
	const logger: Logger = {
		trace: noop,
		debug: noop,
		info: noop,
		warn: noop,
		error: noop,
		fatal: noop,
		child: () => logger,
		time: () => noop,
	};

	return logger;
}
