import { t } from "elysia";
import { PaginatedResponseSchema } from "./api";
import { LibraryWithRelationsSchema } from "./library.types";
import { PaginationMetaSchema } from "./pagination";
import { WorkerOperationSchema } from "./workers";

export const AdminUserSchema = t.Object({
	id: t.String(),
	name: t.String(),
	email: t.String({ format: "email" }),
	role: t.Union([t.Literal("admin"), t.Literal("user")]),
	banned: t.Boolean(),
	banReason: t.Nullable(t.String()),
	banExpires: t.Nullable(t.String({ format: "date-time" })),
	twoFactorEnabled: t.Boolean(),
	/** When the user's most recent session was last used; null when the user has no session. */
	lastActiveAt: t.Nullable(t.String({ format: "date-time" })),
	/** Sessions of the user that have not expired yet. */
	activeSessionCount: t.Integer({ minimum: 0 }),
	createdAt: t.String({ format: "date-time" }),
	updatedAt: t.String({ format: "date-time" }),
});

export type AdminUser = typeof AdminUserSchema.static;

export const AdminUserProfileSchema = t.Object({
	id: t.String(),
	userId: t.String(),
	name: t.String(),
	avatarUrl: t.Nullable(t.String()),
	hasPin: t.Boolean(),
	createdAt: t.String({ format: "date-time" }),
	updatedAt: t.String({ format: "date-time" }),
});

export type AdminUserProfile = typeof AdminUserProfileSchema.static;

export const AdminUsersPageSchema = t.Object({
	...PaginationMetaSchema.properties,
	data: t.Array(AdminUserSchema),
});

export type AdminUsersPage = typeof AdminUsersPageSchema.static;

/** One signed-in session of a user, as the admin session preview shows it (never the token). */
export const AdminUserSessionSchema = t.Object({
	id: t.String(),
	ipAddress: t.Nullable(t.String()),
	userAgent: t.Nullable(t.String()),
	createdAt: t.String({ format: "date-time" }),
	updatedAt: t.String({ format: "date-time" }),
	expiresAt: t.String({ format: "date-time" }),
});

export type AdminUserSession = typeof AdminUserSessionSchema.static;

export const AdminUserSessionsPageSchema = PaginatedResponseSchema(AdminUserSessionSchema);

export type AdminUserSessionsPage = typeof AdminUserSessionsPageSchema.static;

/** `POST /admin/users/sessions/revoke` — every session of the listed users ends. */
export const RevokeUsersSessionsSchema = t.Object({
	userIds: t.Array(t.String({ minLength: 1, maxLength: 64 }), { minItems: 1, maxItems: 100 }),
});

export type RevokeUsersSessions = typeof RevokeUsersSessionsSchema.static;

export const RevokeUsersSessionsResultSchema = t.Object({
	revokedSessions: t.Integer({ minimum: 0 }),
});

export type RevokeUsersSessionsResult = typeof RevokeUsersSessionsResultSchema.static;

export const AdminCreateUserSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 100 }),
	email: t.String({ format: "email" }),
	password: t.String({ minLength: 8, maxLength: 128 }),
	role: t.Optional(t.Union([t.Literal("admin"), t.Literal("user")])),
});

export type AdminCreateUser = typeof AdminCreateUserSchema.static;

export const AdminCreateUserProfileSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 100 }),
	avatarUrl: t.Optional(t.Nullable(t.String({ maxLength: 2048 }))),
	pin: t.Optional(t.Nullable(t.String({ minLength: 4, maxLength: 32 }))),
});

export type AdminCreateUserProfile = typeof AdminCreateUserProfileSchema.static;

export const AdminSetUserPasswordSchema = t.Object({
	newPassword: t.String({ minLength: 8, maxLength: 128 }),
});

export type AdminSetUserPassword = typeof AdminSetUserPasswordSchema.static;

export const AdminStatsSchema = t.Object({
	uptime: t.Number({ minimum: 0 }),
	memory: t.Object({
		rss: t.Number({ minimum: 0 }),
		heapTotal: t.Number({ minimum: 0 }),
		heapUsed: t.Number({ minimum: 0 }),
		heapLimit: t.Optional(t.Number({ minimum: 0 })),
		external: t.Number({ minimum: 0 }),
		arrayBuffers: t.Number({ minimum: 0 }),
	}),
	systemMemory: t.Optional(
		t.Object({
			usedMb: t.Number({ minimum: 0 }),
			totalMb: t.Number({ minimum: 0 }),
			percent: t.Number({ minimum: 0, maximum: 100 }),
		}),
	),
	pressure: t.Optional(t.Union([t.Literal("low"), t.Literal("medium"), t.Literal("high"), t.Literal("critical")])),
	streaming: t.Object({
		activeSessions: t.Integer({ minimum: 0 }),
	}),
	timestamp: t.String({ format: "date-time" }),
	workers: t.Optional(
		t.Object({
			active: t.Integer({ minimum: 0 }),
			waiting: t.Integer({ minimum: 0 }),
			completed: t.Integer({ minimum: 0 }),
			failed: t.Integer({ minimum: 0 }),
		}),
	),
	media: t.Optional(
		t.Object({
			totalFiles: t.Integer({ minimum: 0 }),
			totalSize: t.Integer({ minimum: 0 }),
			moviesCount: t.Integer({ minimum: 0 }),
			episodesCount: t.Integer({ minimum: 0 }),
			withQualityCount: t.Integer({ minimum: 0 }),
		}),
	),
	metadata: t.Optional(
		t.Object({
			totalCount: t.Integer({ minimum: 0 }),
			moviesCount: t.Integer({ minimum: 0 }),
			tvShowsCount: t.Integer({ minimum: 0 }),
			lowConfidenceCount: t.Integer({ minimum: 0 }),
			missingTranslationCount: t.Integer({ minimum: 0 }),
		}),
	),
	markers: t.Optional(
		t.Object({
			totalCount: t.Integer({ minimum: 0 }),
			introsCount: t.Integer({ minimum: 0 }),
			creditsCount: t.Integer({ minimum: 0 }),
			highlightsCount: t.Integer({ minimum: 0 }),
			fromPluginsCount: t.Integer({ minimum: 0 }),
		}),
	),
});

export type AdminStats = typeof AdminStatsSchema.static;

export const AdminCacheDirStatsSchema = t.Object({
	bytes: t.Integer({ minimum: 0 }),
	files: t.Integer({ minimum: 0 }),
});

export const AdminCacheStatsSchema = t.Object({
	timestamp: t.String({ format: "date-time" }),
	disk: t.Object({
		transcodes: AdminCacheDirStatsSchema,
		images: AdminCacheDirStatsSchema,
		subtitles: AdminCacheDirStatsSchema,
	}),
	memory: t.Array(
		t.Object({
			name: t.String({ maxLength: 100 }),
			entries: t.Integer({ minimum: 0 }),
			maxSize: t.Nullable(t.Integer({ minimum: 1 })),
			hits: t.Integer({ minimum: 0 }),
			misses: t.Integer({ minimum: 0 }),
			hitRate: t.Nullable(t.Number({ minimum: 0, maximum: 1 })),
		}),
	),
});

export type AdminCacheStats = typeof AdminCacheStatsSchema.static;

export const ImageCachePurgeResultSchema = t.Object({
	removedFiles: t.Integer({ minimum: 0 }),
	freedBytes: t.Integer({ minimum: 0 }),
});

export type ImageCachePurgeResult = typeof ImageCachePurgeResultSchema.static;

export const AdminResourceAlertSchema = t.Object({
	type: t.String(),
	code: t.String(),
	params: t.Optional(t.Union([t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()])), t.Undefined()])),
	severity: t.Union([t.Literal("warning"), t.Literal("critical")]),
	metric: t.Optional(t.Number()),
	threshold: t.Optional(t.Number()),
	workerId: t.Optional(t.String()),
	timestamp: t.Union([t.String(), t.Number()]),
});

export const AdminResourceAggregatesSchema = t.Object({
	avgCpu: t.Number({ minimum: 0 }),
	maxCpu: t.Number({ minimum: 0 }),
	avgMemory: t.Number({ minimum: 0 }),
	maxMemory: t.Number({ minimum: 0 }),
	avgDisk: t.Number({ minimum: 0 }),
	maxDisk: t.Number({ minimum: 0 }),
});

export const AdminSystemCpuSchema = t.Object({
	detectedCores: t.Number(),
	configuredMaxCores: t.Number(),
	effectiveCores: t.Number(),
	speedFactor: t.Number(),
	capacity: t.Number(),
	cpuProfile: t.Union([t.Literal("conservative"), t.Literal("balanced"), t.Literal("performance"), t.Literal("custom")]),
	reservedWebCores: t.Number(),
	backgroundBudgetCores: t.Number(),
	ffmpegThreads: t.Number(),
	sharpConcurrency: t.Number(),
	workerPoolMaxConcurrent: t.Number(),
	scannerConcurrency: t.Number(),
	ffprobeConcurrency: t.Number(),
});

export type AdminSystemCpu = typeof AdminSystemCpuSchema.static;

export const AdminRescueStateSchema = t.Object({
	state: t.Union([t.Literal("healthy"), t.Literal("rescuing")]),
	stateSince: t.Number(),
	reason: t.Optional(t.Union([t.String(), t.Undefined()])),
	lastLagMs: t.Number(),
	lastPressure: t.Union([t.Literal("low"), t.Literal("medium"), t.Literal("high"), t.Literal("critical")]),
	escalations: t.Number(),
});

export type AdminRescueState = typeof AdminRescueStateSchema.static;

export const AdminWorkerAllocationSchema = t.Object({
	workerId: t.String(),
	requested: t.Number(),
	allocated: t.Number(),
	throttled: t.Boolean(),
	reason: t.Optional(t.Union([t.String(), t.Undefined()])),
});

export type AdminWorkerAllocation = typeof AdminWorkerAllocationSchema.static;

export const AdminResourcesResponseSchema = t.Object({
	current: t.Optional(
		t.Nullable(
			t.Object({
				timestamp: t.Number(),
				cpu: t.Object({
					usedPercent: t.Number({ minimum: 0, maximum: 100 }),
					loadAvg: t.Tuple([t.Number(), t.Number(), t.Number()]),
				}),
				memory: t.Object({
					usedMb: t.Number({ minimum: 0 }),
					totalMb: t.Number({ minimum: 0 }),
					percent: t.Number({ minimum: 0, maximum: 100 }),
				}),
				disk: t.Object({
					usedGb: t.Number({ minimum: 0 }),
					totalGb: t.Number({ minimum: 0 }),
					percent: t.Number({ minimum: 0, maximum: 100 }),
				}),
				pressure: t.Union([t.Literal("low"), t.Literal("medium"), t.Literal("high"), t.Literal("critical")]),
				activeStreams: t.Number({ minimum: 0 }),
				workers: t.Record(t.String(), t.Number()),
			}),
		),
	),
	history: t.Array(
		t.Object({
			id: t.Union([t.String(), t.Integer()]),
			timestamp: t.String(),
			cpu: t.Number(),
			memory: t.Number(),
			disk: t.Number(),
			pressure: t.String(),
			workersJson: t.Optional(t.String()),
		}),
	),
	alerts: t.Array(AdminResourceAlertSchema),
	aggregates: AdminResourceAggregatesSchema,
	config: t.Object({
		monitoringEnabled: t.Boolean(),
		memoryThresholdPercent: t.Number({ minimum: 0, maximum: 100 }),
		diskThresholdPercent: t.Number({ minimum: 0, maximum: 100 }),
		enableDynamicThrottling: t.Boolean(),
	}),
	systemCpu: t.Optional(AdminSystemCpuSchema),
	rescue: t.Optional(AdminRescueStateSchema),
	workerAllocations: t.Optional(t.Array(AdminWorkerAllocationSchema)),
});

export type AdminResourcesResponse = typeof AdminResourcesResponseSchema.static;

export const AdminLogEntrySchema = t.Object(
	{
		levelName: t.String(),
		timestamp: t.String({ format: "date-time" }),
		module: t.Optional(t.String()),
		msg: t.Optional(t.String()),
		err: t.Optional(t.Unknown()),
		errorDetails: t.Optional(t.Unknown()),
	},
	{ additionalProperties: true },
);

export type AdminLogEntry = typeof AdminLogEntrySchema.static;

export const AdminLogsPageSchema = t.Object({
	...PaginationMetaSchema.properties,
	/** True when the requested file is larger than the served tail window. */
	truncated: t.Boolean(),
	/** Size of the served tail window in bytes (the server reads only the end of the file). */
	windowBytes: t.Integer({ minimum: 0 }),
	data: t.Array(AdminLogEntrySchema),
});

export type AdminLogsPage = typeof AdminLogsPageSchema.static;

export const AdminLogFileInfoSchema = t.Object({
	id: t.String(),
	name: t.String(),
	type: t.Union([
		t.Literal("server"),
		t.Literal("ffmpeg-transcode"),
		t.Literal("ffmpeg-directstream"),
		t.Literal("ffmpeg"),
		t.Literal("other"),
	]),
	size: t.Integer({ minimum: 0 }),
	modifiedAt: t.String({ format: "date-time" }),
});

export type AdminLogFileInfo = typeof AdminLogFileInfoSchema.static;

export const AdminAuditActionSchema = t.Union([t.Literal("create"), t.Literal("update"), t.Literal("delete")]);

export const AdminAuditEntrySchema = t.Object({
	id: t.String(),
	actorUserId: t.Nullable(t.String()),
	action: AdminAuditActionSchema,
	resourceType: t.String(),
	resourceId: t.Nullable(t.String()),
	resourceName: t.Nullable(t.String()),
	summary: t.Nullable(t.String()),
	before: t.Nullable(t.Unknown()),
	after: t.Nullable(t.Unknown()),
	requestId: t.Nullable(t.String()),
	ipAddress: t.Nullable(t.String()),
	userAgent: t.Nullable(t.String()),
	createdAt: t.String({ format: "date-time" }),
});

export type AdminAuditEntry = typeof AdminAuditEntrySchema.static;

export const AdminAuditPageSchema = t.Object({
	...PaginationMetaSchema.properties,
	data: t.Array(AdminAuditEntrySchema),
});

export type AdminAuditPage = typeof AdminAuditPageSchema.static;

/** Activity of one administrator for the audit filters; `actorUserId` is null for entries without an actor. */
export const AdminAuditActorSummarySchema = t.Object({
	actorUserId: t.Nullable(t.String()),
	name: t.Nullable(t.String()),
	total: t.Integer({ minimum: 0 }),
	creates: t.Integer({ minimum: 0 }),
	updates: t.Integer({ minimum: 0 }),
	deletes: t.Integer({ minimum: 0 }),
	lastAt: t.Nullable(t.String({ format: "date-time" })),
});

export type AdminAuditActorSummary = typeof AdminAuditActorSummarySchema.static;

export const AdminAuditSummarySchema = t.Object({
	total: t.Integer({ minimum: 0 }),
	actors: t.Array(AdminAuditActorSummarySchema),
});

export type AdminAuditSummary = typeof AdminAuditSummarySchema.static;

/** Values for the audit filter dropdowns: the resource types in the log and the administrators who wrote entries. */
export const AdminAuditOptionsSchema = t.Object({
	resourceTypes: t.Array(t.String()),
	actors: t.Array(t.Object({ actorUserId: t.String(), name: t.Nullable(t.String()) })),
});

export type AdminAuditOptions = typeof AdminAuditOptionsSchema.static;

export const AdminFilesystemDirectorySchema = t.Object({
	name: t.String(),
	path: t.String(),
});

export type AdminFilesystemDirectory = typeof AdminFilesystemDirectorySchema.static;

export const AdminFilesystemBrowseSchema = t.Object({
	currentPath: t.String(),
	parentPath: t.Nullable(t.String()),
	directories: t.Array(AdminFilesystemDirectorySchema),
	exists: t.Boolean(),
});

export type AdminFilesystemBrowse = typeof AdminFilesystemBrowseSchema.static;

export const AdminDatabaseBackupSchema = t.Object({
	fileName: t.String(),
	filePath: t.String(),
	sizeBytes: t.Integer({ minimum: 0 }),
	createdAt: t.String({ format: "date-time" }),
});

export type AdminDatabaseBackup = typeof AdminDatabaseBackupSchema.static;

export const AdminDatabaseBackupListSchema = t.Array(AdminDatabaseBackupSchema);

/** Result of SQLite's quick check: `ok` only when the database reports nothing but the healthy answer. */
export const DatabaseIntegritySchema = t.Object({
	ok: t.Boolean(),
	messages: t.Array(t.String()),
});

export type DatabaseIntegrity = typeof DatabaseIntegritySchema.static;

export const DatabaseMigrationStatusSchema = t.Object({
	/** Migrations shipped with the server. */
	total: t.Integer({ minimum: 0 }),
	/** Migrations the database has recorded as applied. */
	applied: t.Integer({ minimum: 0 }),
	pending: t.Integer({ minimum: 0 }),
	/** Tag of the newest applied migration; `null` before any was recorded. */
	latest: t.Nullable(t.String()),
	migrations: t.Array(t.Object({ tag: t.String(), applied: t.Boolean() })),
});

export type DatabaseMigrationStatus = typeof DatabaseMigrationStatusSchema.static;

/** Restore queues a detached process: it waits for server exit, swaps the
 * database file and relaunches — the caller always gets an ack, not a result. */
export const AdminDatabaseRestoreResponseSchema = t.Object({
	success: t.Boolean(),
	restarting: t.Boolean(),
	restoredFrom: t.String(),
	/** Copy of the database taken just before the swap; restoring it undoes this restore. */
	preRestoreBackup: t.String(),
});

export type AdminDatabaseRestoreResponse = typeof AdminDatabaseRestoreResponseSchema.static;

export const AdminUpdateAssetSchema = t.Object({
	name: t.String(),
	url: t.String(),
	size: t.Integer({ minimum: 0 }),
});

export type AdminUpdateAsset = typeof AdminUpdateAssetSchema.static;

export const AdminUpdateReleaseSchema = t.Object({
	version: t.String(),
	name: t.String(),
	url: t.String(),
	publishedAt: t.Nullable(t.String({ format: "date-time" })),
	notes: t.Nullable(t.String()),
	/** Web releases only — the oldest server version this UI is compatible with. */
	minServerVersion: t.Nullable(t.String()),
	assets: t.Array(AdminUpdateAssetSchema),
});

export type AdminUpdateRelease = typeof AdminUpdateReleaseSchema.static;

export const AdminUpdateTargetSchema = t.Union([t.Literal("server"), t.Literal("web")]);

export type AdminUpdateTarget = typeof AdminUpdateTargetSchema.static;

export const AdminUpdateJobStateSchema = t.Object({
	target: AdminUpdateTargetSchema,
	state: t.Union([
		t.Literal("downloading"),
		t.Literal("verifying"),
		t.Literal("extracting"),
		t.Literal("swapping"),
		t.Literal("restarting"),
	]),
	progressPercent: t.Integer({ minimum: 0, maximum: 100 }),
	message: t.Nullable(t.String()),
	startedAt: t.String({ format: "date-time" }),
});

export type AdminUpdateJobState = typeof AdminUpdateJobStateSchema.static;

/** Where the server runs: a container engine (if any), whether it runs without root, and how systemd manages it. */
export const AdminUpdateEnvironmentSchema = t.Object({
	container: t.Nullable(t.Union([t.Literal("docker"), t.Literal("podman")])),
	rootless: t.Boolean(),
	systemd: t.Nullable(t.Union([t.Literal("user"), t.Literal("system")])),
});

export type AdminUpdateEnvironment = typeof AdminUpdateEnvironmentSchema.static;

export const AdminUpdateStatusSchema = t.Object({
	serverVersion: t.String(),
	webVersion: t.Nullable(t.String()),
	serverUpdateAvailable: t.Boolean(),
	webUpdateAvailable: t.Boolean(),
	webRequiresServerUpdate: t.Boolean(),
	serverLatest: t.Nullable(AdminUpdateReleaseSchema),
	webLatest: t.Nullable(AdminUpdateReleaseSchema),
	installType: t.Union([t.Literal("archive"), t.Literal("docker"), t.Literal("dev")]),
	flavor: t.Nullable(t.Union([t.Literal("default"), t.Literal("full")])),
	environment: AdminUpdateEnvironmentSchema,
	serverRollbackAvailable: t.Boolean(),
	webRollbackAvailable: t.Boolean(),
	lastCheckedAt: t.Nullable(t.String({ format: "date-time" })),
	serverLastErrorCode: t.Nullable(t.String()),
	webLastErrorCode: t.Nullable(t.String()),
	job: t.Nullable(AdminUpdateJobStateSchema),
});

export type AdminUpdateStatus = typeof AdminUpdateStatusSchema.static;

/** One install or rollback run; `finishedAt` stays null while it runs. */
export const AdminUpdateHistoryEntrySchema = t.Object({
	id: t.String(),
	action: t.Union([t.Literal("install"), t.Literal("rollback")]),
	target: AdminUpdateTargetSchema,
	status: t.Union([t.Literal("running"), t.Literal("succeeded"), t.Literal("failed"), t.Literal("cancelled")]),
	fromVersion: t.Nullable(t.String()),
	toVersion: t.String(),
	errorMessage: t.Nullable(t.String()),
	actorUserId: t.Nullable(t.String()),
	startedAt: t.String({ format: "date-time" }),
	finishedAt: t.Nullable(t.String({ format: "date-time" })),
});

export type AdminUpdateHistoryEntry = typeof AdminUpdateHistoryEntrySchema.static;

export const AdminUpdateHistoryPageSchema = t.Object({
	...PaginationMetaSchema.properties,
	data: t.Array(AdminUpdateHistoryEntrySchema),
});

export type AdminUpdateHistoryPage = typeof AdminUpdateHistoryPageSchema.static;

/**
 * Composite view for the admin dashboard: everything the page previously
 * fetched with 6 parallel requests (stats, libraries, worker operations,
 * audit feed, error logs, update status) in one call.
 */
export const AdminDashboardViewResponseSchema = t.Object({
	stats: AdminStatsSchema,
	libraries: t.Array(LibraryWithRelationsSchema),
	operations: PaginatedResponseSchema(WorkerOperationSchema),
	audit: AdminAuditPageSchema,
	logs: AdminLogsPageSchema,
	update: AdminUpdateStatusSchema,
});

export type AdminDashboardViewResponse = typeof AdminDashboardViewResponseSchema.static;

export const AdminUpdateInstallResponseSchema = t.Object({
	started: t.Boolean(),
	target: AdminUpdateTargetSchema,
	version: t.String(),
});

export type AdminUpdateInstallResponse = typeof AdminUpdateInstallResponseSchema.static;

/** Acknowledges a cancel request; the install stops at its next checkpoint, so the job may still show for a moment. */
export const AdminUpdateCancelResponseSchema = t.Object({
	target: AdminUpdateTargetSchema,
});

export type AdminUpdateCancelResponse = typeof AdminUpdateCancelResponseSchema.static;

/** Coverage and storage usage of built-in (core) trickplay artifacts. */
export const TrickplayStatsSchema = t.Object({
	total: t.Integer(),
	withTrickplay: t.Integer(),
	missingTrickplay: t.Integer(),
	/** Bytes currently stored for core trickplay artifacts (sprites + VTT). */
	storageBytes: t.Integer(),
	/** Effective core artifacts budget in bytes (`system.artifacts.coreMaxStorageGb`, 0 = auto-derived). */
	storageBudgetBytes: t.Integer(),
});

export type TrickplayStats = typeof TrickplayStatsSchema.static;

/** What removing trickplay previews took away: the media files that had them and the artifact rows deleted. */
/** `dryRun` is true when the request only counted: nothing was removed. */
export const TrickplayDeleteResultSchema = t.Object({
	dryRun: t.Boolean(),
	mediaFiles: t.Integer({ minimum: 0 }),
	artifacts: t.Integer({ minimum: 0 }),
});

export type TrickplayDeleteResult = typeof TrickplayDeleteResultSchema.static;

/**
 * One library, title or season, or several titles at once (`scope: "titles"` with `ids`), queued as one operation.
 * Regenerate files that already have previews too; without `force` only files with none are queued.
 */
export const TrickplayRegenerateRequestSchema = t.Union([
	t.Object({
		scope: t.Union([t.Literal("library"), t.Literal("title"), t.Literal("season")]),
		id: t.String({ minLength: 1, maxLength: 128 }),
		force: t.Optional(t.Boolean()),
	}),
	t.Object({
		scope: t.Literal("titles"),
		ids: t.Array(t.String({ minLength: 1, maxLength: 128 }), { minItems: 1, maxItems: 50 }),
		force: t.Optional(t.Boolean()),
	}),
]);

export type TrickplayRegenerateRequest = typeof TrickplayRegenerateRequestSchema.static;

export const TrickplayRegenerationQueuedSchema = t.Object({
	operationId: t.Optional(t.String()),
	/** Files in the scope that match, before the per-request cap. */
	matching: t.Integer({ minimum: 0 }),
	enqueued: t.Integer({ minimum: 0 }),
	/** Matching files a later request has to queue, because this one stopped at the cap. */
	remaining: t.Integer({ minimum: 0 }),
});

export type TrickplayRegenerationQueued = typeof TrickplayRegenerationQueuedSchema.static;

export const TrickplayRegenerationReportSchema = t.Object({
	operationId: t.String(),
	total: t.Integer({ minimum: 0 }),
	generated: t.Integer({ minimum: 0 }),
	/** Completed jobs the artifact storage budget skipped. */
	skippedStorageBudget: t.Integer({ minimum: 0 }),
	/** Completed jobs skipped for another reason, such as a file without a duration. */
	skippedOther: t.Integer({ minimum: 0 }),
	failed: t.Integer({ minimum: 0 }),
	cancelled: t.Integer({ minimum: 0 }),
	unfinished: t.Integer({ minimum: 0 }),
});

export type TrickplayRegenerationReport = typeof TrickplayRegenerationReportSchema.static;
