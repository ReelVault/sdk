import { t } from "elysia";
import { BulkRefreshItemSchema } from "./bulk-refresh";
import { PaginationMetaSchema } from "./pagination";

export const DownloadJobSchema = t.Object({
	id: t.String(),
	mediaFileId: t.String(),
	/** Title the download's media file belongs to; null when the file is no longer linked to one. */
	metadataId: t.Nullable(t.String()),
	quality: t.String(),
	status: t.String(),
	progressPercent: t.Number(),
	sizeBytes: t.Nullable(t.Number()),
	fileName: t.Nullable(t.String()),
	downloadUrl: t.Nullable(t.String()),
	errorCode: t.Nullable(t.String()),
	createdAt: t.String(),
	updatedAt: t.String(),
});

export type DownloadJob = typeof DownloadJobSchema.static;

/** Storage the profile's finished downloads use; `maxBytes` 0 means no limit. */
export const DownloadQuotaSchema = t.Object({
	usedBytes: t.Integer({ minimum: 0 }),
	maxBytes: t.Integer({ minimum: 0 }),
});

export type DownloadQuota = typeof DownloadQuotaSchema.static;

export const MyDownloadsResponseSchema = t.Object({ data: t.Array(DownloadJobSchema), quota: DownloadQuotaSchema });

export type MyDownloadsResponse = typeof MyDownloadsResponseSchema.static;

export const PrepareDownloadSchema = t.Object({
	mediaFileId: t.String({ minLength: 1 }),
	quality: t.Optional(t.String()),
});

export type PrepareDownload = typeof PrepareDownloadSchema.static;

/** `POST /downloads/seasons` — every episode of a season is queued; `force` queues a season larger than the free storage. */
export const QueueSeasonDownloadSchema = t.Object({
	seasonId: t.String({ minLength: 1, maxLength: 64 }),
	quality: t.Optional(t.String()),
	force: t.Optional(t.Boolean()),
});

export type QueueSeasonDownload = typeof QueueSeasonDownloadSchema.static;

/** One outcome per episode of the season: `id` is the episode id, `code` is set only when that episode was not queued. */
export const DownloadSeasonQueueResultSchema = t.Object({
	results: t.Array(BulkRefreshItemSchema),
});

export type DownloadSeasonQueueResult = typeof DownloadSeasonQueueResultSchema.static;

export const AdminDownloadJobSchema = t.Composite([
	DownloadJobSchema,
	t.Object({
		profileId: t.String(),
	}),
]);

export type AdminDownloadJob = typeof AdminDownloadJobSchema.static;

/** Downloads per status across every profile. */
export const AdminDownloadStatusCountsSchema = t.Object({
	pending: t.Integer({ minimum: 0 }),
	processing: t.Integer({ minimum: 0 }),
	completed: t.Integer({ minimum: 0 }),
	failed: t.Integer({ minimum: 0 }),
	cancelled: t.Integer({ minimum: 0 }),
});

export type AdminDownloadStatusCounts = typeof AdminDownloadStatusCountsSchema.static;

export const AdminDownloadsResponseSchema = t.Object({
	...PaginationMetaSchema.properties,
	data: t.Array(AdminDownloadJobSchema),
	counts: AdminDownloadStatusCountsSchema,
});

export type AdminDownloadsResponse = typeof AdminDownloadsResponseSchema.static;
