import { t } from "elysia";
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
	errorText: t.Nullable(t.String()),
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

export const MyDownloadsResponseSchema = t.Object({ jobs: t.Array(DownloadJobSchema), quota: DownloadQuotaSchema });

export type MyDownloadsResponse = typeof MyDownloadsResponseSchema.static;

export const PrepareDownloadSchema = t.Object({
	mediaFileId: t.String({ minLength: 1 }),
	quality: t.Optional(t.String()),
});

export type PrepareDownload = typeof PrepareDownloadSchema.static;

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
