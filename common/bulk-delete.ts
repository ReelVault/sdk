import { t } from "elysia";

import { BulkRefreshItemSchema } from "./bulk-refresh";

/** Up to 50 ids to remove in one request; `force` lets a delete go ahead while a stream plays the files. */
export const BulkDeleteBodySchema = t.Object({
	ids: t.Array(t.String({ minLength: 1, maxLength: 64 }), { minItems: 1, maxItems: 50 }),
	force: t.Optional(t.Boolean()),
});

export type BulkDeleteBody = typeof BulkDeleteBodySchema.static;

/** One outcome per id: `code` is set only when that id was not deleted. */
export const BulkDeleteResultSchema = t.Object({
	results: t.Array(BulkRefreshItemSchema),
});

export type BulkDeleteResult = typeof BulkDeleteResultSchema.static;
