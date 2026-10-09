import type { Static } from "@sinclair/typebox";
import { t } from "elysia";

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
