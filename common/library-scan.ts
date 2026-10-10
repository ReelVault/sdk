import type { Static } from "@sinclair/typebox";
import { t } from "elysia";
import { MetadataProviderSearchResponseSchema } from "./providers";

/** `POST /libraries/scan` — one scan queued per library, in library order; the scan worker runs them one at a time. */
export const LibraryScanAllResponseSchema = t.Object({
	queued: t.Array(t.Object({ libraryId: t.String(), operationId: t.String() })),
});

export type LibraryScanAllResponse = Static<typeof LibraryScanAllResponseSchema>;

/** `POST /libraries/:libraryId/scan/cancel` — how many of the library's scans were cancelled. */
export const LibraryScanCancelResponseSchema = t.Object({
	cancelled: t.Integer({ minimum: 0 }),
});

export type LibraryScanCancelResponse = Static<typeof LibraryScanCancelResponseSchema>;

/** Why a scan could not ingest a file. */
export const ScanFindingReasonSchema = t.Union([
	t.Literal("recognition_failed"),
	t.Literal("type_mismatch"),
	t.Literal("no_metadata_match"),
	t.Literal("probe_failed"),
]);

export type ScanFindingReason = Static<typeof ScanFindingReasonSchema>;

/** `active` findings need attention; `ignored` ones leave that list until restored, and a rescan keeps them ignored. */
export const ScanFindingStatusSchema = t.Union([t.Literal("active"), t.Literal("ignored")]);

export type ScanFindingStatus = Static<typeof ScanFindingStatusSchema>;

export const ScanFindingSchema = t.Object({
	filePath: t.String(),
	fileName: t.String(),
	reason: ScanFindingReasonSchema,
});

export type ScanFinding = Static<typeof ScanFindingSchema>;

/** `GET /libraries/:libraryId/scan-findings` — the findings of one status, with both counts for the status tabs. */
export const ScanFindingsResponseSchema = t.Object({
	data: t.Array(ScanFindingSchema),
	counts: t.Object({ active: t.Integer({ minimum: 0 }), ignored: t.Integer({ minimum: 0 }) }),
});

export type ScanFindingsResponse = Static<typeof ScanFindingsResponseSchema>;

/** `PATCH /libraries/:libraryId/scan-findings` — ignores a finding, or restores it when `ignored` is false. */
export const UpdateScanFindingSchema = t.Object({
	filePath: t.String({ minLength: 1 }),
	ignored: t.Boolean(),
});

export type UpdateScanFinding = Static<typeof UpdateScanFindingSchema>;

export const ScanFindingIgnoredResponseSchema = t.Object({
	filePath: t.String(),
	ignored: t.Boolean(),
});

export type ScanFindingIgnoredResponse = Static<typeof ScanFindingIgnoredResponseSchema>;

/**
 * `GET /libraries/:libraryId/scan-findings/candidates` — what the providers return for the title parsed from
 * the file name. Searched on request only; a scan never runs this search. `searchTitle` is null when the name
 * yields no title, and `candidates` is empty for findings that are not `no_metadata_match`.
 */
export const ScanFindingCandidatesResponseSchema = t.Object({
	searchTitle: t.Nullable(t.String()),
	searchYear: t.Nullable(t.Integer()),
	candidates: t.Array(MetadataProviderSearchResponseSchema),
});

export type ScanFindingCandidatesResponse = Static<typeof ScanFindingCandidatesResponseSchema>;
