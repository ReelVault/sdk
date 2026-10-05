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
