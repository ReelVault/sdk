import { SortQuerySchema } from "@sdk/common/sorting";
import { t } from "elysia";
import { MetadataWithRelationSchema } from "./metadata.types";
import { EntitySchema } from "./schema-utils";

export const WatchlistSchema = EntitySchema(t.Object({ id: t.String(), profileId: t.String(), metadataId: t.String() }));

export type Watchlist = typeof WatchlistSchema.static;

/** `GET /me/watchlist?hydrate=true` — every item carries its full metadata card. */
export const HydratedWatchlistItemSchema = t.Composite([WatchlistSchema, t.Object({ metadata: MetadataWithRelationSchema })]);

export type HydratedWatchlistItem = typeof HydratedWatchlistItemSchema.static;

export const CreateWatchlistSchema = t.Object({
	metadataId: t.String(),
	profileId: t.Optional(t.String()),
});

export type CreateWatchlist = typeof CreateWatchlistSchema.static;

/** One row of the batch watchlist check (`GET /me/watchlist/statuses`). */
export const WatchlistStatusSchema = t.Object({ metadataId: t.String(), inWatchlist: t.Boolean() });

export type WatchlistStatus = typeof WatchlistStatusSchema.static;

export const WatchlistStatusesResponseSchema = t.Object({
	statuses: t.Array(WatchlistStatusSchema),
});

export type WatchlistStatusesResponse = typeof WatchlistStatusesResponseSchema.static;

/** `POST /me/watchlist/bulk` — titles to add and to remove in one request (up to 500 of each). */
export const WatchlistBulkBodySchema = t.Object({
	add: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 128 }), { maxItems: 500 })),
	remove: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 128 }), { maxItems: 500 })),
});

export type WatchlistBulkBody = typeof WatchlistBulkBodySchema.static;

export const WatchlistBulkResponseSchema = t.Object({
	success: t.Literal(true),
	added: t.Integer({ minimum: 0 }),
	removed: t.Integer({ minimum: 0 }),
});

export type WatchlistBulkResponse = typeof WatchlistBulkResponseSchema.static;

/** `DELETE /me/watchlist` — empties the watchlist of the active profile. */
export const WatchlistClearResponseSchema = t.Object({
	success: t.Literal(true),
	removed: t.Integer({ minimum: 0 }),
});

export type WatchlistClearResponse = typeof WatchlistClearResponseSchema.static;

export const WatchlistFiltersSchema = t.Object({
	profileId: t.Optional(t.String()),
	metadataId: t.Optional(t.String()),
});

export type WatchlistFilters = typeof WatchlistFiltersSchema.static;

export const WatchlistSortingSchema = t.Composite([
	SortQuerySchema,
	t.Object({
		sortBy: t.Optional(t.Union([t.Literal("createdAt"), t.Literal("updatedAt")])),
	}),
]);

export type WatchlistSorting = typeof WatchlistSortingSchema.static;
