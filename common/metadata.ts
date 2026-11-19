import { t } from "elysia";
import type { CatalogMediaType, ExternalIdentity } from "./media";
import { CatalogMediaTypeSchema } from "./providers";

/** Distinct non-empty catalog statuses, sorted, for the status filter. */
export const MetadataStatusesResponseSchema = t.Object({
	statuses: t.Array(t.String()),
});

export type MetadataStatusesResponse = typeof MetadataStatusesResponseSchema.static;

export const GlobalSearchResponseSchema = t.Object({
	titles: t.Array(
		t.Object({
			id: t.String(),
			title: t.String(),
			type: CatalogMediaTypeSchema,
			imageId: t.Optional(t.Nullable(t.String())),
			imageUpdatedAt: t.Optional(t.Nullable(t.Date())),
		}),
	),
	people: t.Array(
		t.Object({
			id: t.String(),
			name: t.String(),
			imageId: t.Optional(t.Nullable(t.String())),
			imageUpdatedAt: t.Optional(t.Nullable(t.Date())),
		}),
	),
	collections: t.Array(
		t.Object({
			id: t.String(),
			name: t.String(),
			imageId: t.Optional(t.Nullable(t.String())),
			imageUpdatedAt: t.Optional(t.Nullable(t.Date())),
		}),
	),
	genres: t.Array(t.Object({ id: t.String(), name: t.String() })),
});

export type GlobalSearchResponse = typeof GlobalSearchResponseSchema.static;

export type ArtworkKind = "poster" | "backdrop" | "logo" | "thumbnail" | "profile";

export interface Artwork {
	kind: ArtworkKind;
	url: string;
	width?: number | undefined;
	height?: number | undefined;
	language?: string | undefined;
}

/** Canonical metadata that a plugin may read without accessing the database. */
export interface MetadataItem {
	id: string;
	type: CatalogMediaType;
	title: string;
	originalTitle?: string | undefined;
	overview?: string | undefined;
	tagline?: string | undefined;
	releaseDate: string;
	status?: string | undefined;
	externalIds: ExternalIdentity[];
}

export interface MetadataCandidate {
	type: CatalogMediaType;
	identity: ExternalIdentity;
	title: string;
	originalTitle?: string | undefined;
	overview?: string | undefined;
	tagline?: string | undefined;
	releaseDate?: string | undefined;
	artwork: Artwork[];
}

export const RematchMetadataSchema = t.Object({
	providerId: t.String(),
	externalId: t.String(),
	/** Overwrites the fields an administrator locked as well. Locked fields keep their stored values by default. */
	overwriteLocked: t.Optional(t.Boolean()),
});

export const LinkMetadataProviderSchema = t.Object({
	providerId: t.String(),
	externalId: t.String(),
});
