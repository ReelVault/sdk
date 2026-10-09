import { t } from "elysia";

/** Ids refreshed by one bulk request (at most 50); a larger selection is sent as several requests. */
export const BulkRefreshBodySchema = t.Object({
	ids: t.Array(t.String({ minLength: 1, maxLength: 64 }), { minItems: 1, maxItems: 50 }),
});

export type BulkRefreshBody = typeof BulkRefreshBodySchema.static;

/** The outcome of one id. `code` is set only when it failed: a domain code, or the route's fallback code. */
export const BulkRefreshItemSchema = t.Object({
	id: t.String(),
	ok: t.Boolean(),
	code: t.Optional(t.String()),
});

export type BulkRefreshItem = typeof BulkRefreshItemSchema.static;

export const BulkRefreshResultSchema = t.Object({
	results: t.Array(BulkRefreshItemSchema),
});

export type BulkRefreshResult = typeof BulkRefreshResultSchema.static;
