import { SortQuerySchema } from "@sdk/common/sorting";
import { t } from "elysia";
import { MetadataWithRelationSchema } from "./metadata.types";
import { EntitySchema } from "./schema-utils";

export const WatchlistSchema = EntitySchema(t.Object({ id: t.String(), profileId: t.String(), metadataId: t.String() }));

export type Watchlist = typeof WatchlistSchema.static;

/** `GET /me/watchlist?hydrate=true` — every item carries its full metadata card. */
export const HydratedWatchlistItemSchema = t.Composite([
	WatchlistSchema,
	t.Object({ metadata: MetadataWithRelationSchema }),
]);

export type HydratedWatchlistItem = typeof HydratedWatchlistItemSchema.static;

export const CreateWatchlistSchema = t.Object({
	metadataId: t.String(),
	profileId: t.Optional(t.String()),
});

export type CreateWatchlist = typeof CreateWatchlistSchema.static;

export const UpdateWatchlistSchema = t.Partial(CreateWatchlistSchema);

/** One row of the batch watchlist check (`GET /me/watchlist/statuses`). */
export const WatchlistStatusSchema = t.Object({ metadataId: t.String(), inWatchlist: t.Boolean() });

export type WatchlistStatus = typeof WatchlistStatusSchema.static;

export const WatchlistStatusesResponseSchema = t.Object({
	statuses: t.Array(WatchlistStatusSchema),
});

export type WatchlistStatusesResponse = typeof WatchlistStatusesResponseSchema.static;

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
