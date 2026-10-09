import { t } from "elysia";

export const mediaMarkerTypes = ["intro", "credits", "recap", "chapter", "highlight"] as const;

export type MediaMarkerType = (typeof mediaMarkerTypes)[number];

export const mediaMarkerSources = ["automatic", "manual", "plugin"] as const;

export const MediaMarkerSchema = t.Object({
	id: t.String(),
	mediaFileId: t.String(),
	type: t.Union([t.Literal("intro"), t.Literal("credits"), t.Literal("recap"), t.Literal("chapter"), t.Literal("highlight")]),
	startSeconds: t.Number({ minimum: 0 }),
	endSeconds: t.Number({ minimum: 0 }),
	label: t.Nullable(t.String()),
	source: t.Union([t.Literal("automatic"), t.Literal("manual"), t.Literal("plugin")]),
	pluginId: t.Nullable(t.String()),
	createdAt: t.String(),
	updatedAt: t.String(),
});

export type MediaMarker = typeof MediaMarkerSchema.static;

/** Filters of the admin marker list; each one narrows the result on the server. `q` matches label, file id, plugin id and type. */
export const MediaMarkerFiltersSchema = t.Object({
	type: t.Optional(MediaMarkerSchema.properties.type),
	source: t.Optional(MediaMarkerSchema.properties.source),
	q: t.Optional(t.String({ maxLength: 200 })),
});

export type MediaMarkerFilters = typeof MediaMarkerFiltersSchema.static;

export const CreateMediaMarkerSchema = t.Object({
	type: t.Union([t.Literal("intro"), t.Literal("credits"), t.Literal("recap"), t.Literal("chapter"), t.Literal("highlight")]),
	startSeconds: t.Number({ minimum: 0 }),
	endSeconds: t.Number({ minimum: 0 }),
	label: t.Optional(t.String()),
	source: t.Optional(t.Union([t.Literal("automatic"), t.Literal("manual"), t.Literal("plugin")])),
	pluginId: t.Optional(t.String()),
});

export type CreateMediaMarker = typeof CreateMediaMarkerSchema.static;

/** What a marker import replaced: the media files it named and the markers written. */
export const MarkerImportResultSchema = t.Object({
	mediaFiles: t.Integer({ minimum: 0 }),
	markers: t.Integer({ minimum: 0 }),
});

export type MarkerImportResult = typeof MarkerImportResultSchema.static;

export const SetMediaMarkersSchema = t.Object({
	markers: t.Array(CreateMediaMarkerSchema),
});
