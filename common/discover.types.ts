import { t } from "elysia";
import { MetadataWithRelationSchema } from "./metadata.types";

/**
 * Why a title was recommended. The server sends the kind and the provider
 * label only; clients build the sentence in their own language.
 * - `collection`, `keyword`, `genre`: a shared theme (`label` is its name).
 * - `credit`: a shared crew member (`label` is the person, `role` the provider's job name, e.g. "Director").
 * - `person`: a shared billed cast member (`label` is the person).
 * - `seed`: close to one watched title (`label` is its title, `seedId` its metadata id).
 * - `popular`: no viewing history yet; well rated and recently added.
 * - `taste`: a match without one nameable feature.
 */
export const RecommendationReasonKindSchema = t.Union([
	t.Literal("collection"),
	t.Literal("keyword"),
	t.Literal("genre"),
	t.Literal("credit"),
	t.Literal("person"),
	t.Literal("seed"),
	t.Literal("popular"),
	t.Literal("taste"),
]);

export const RecommendationReasonSchema = t.Object({
	metadataId: t.String(),
	kind: RecommendationReasonKindSchema,
	label: t.Optional(t.String()),
	/** The provider's job name for a `credit`, in the provider's language. */
	role: t.Optional(t.String()),
	seedId: t.Optional(t.String()),
});

export const DiscoverResponseSchema = t.Object({
	recentlyAddedMovies: t.Array(MetadataWithRelationSchema),
	recentlyAddedShows: t.Array(MetadataWithRelationSchema),
	/** Movies and shows in one list, kept for clients that show a single row. */
	recommendations: t.Array(MetadataWithRelationSchema),
	recommendedMovies: t.Optional(t.Array(MetadataWithRelationSchema)),
	recommendedShows: t.Optional(t.Array(MetadataWithRelationSchema)),
	/** One reason per title in `recommendations`, `recommendedMovies` and `recommendedShows`. */
	recommendationReasons: t.Optional(t.Array(RecommendationReasonSchema)),
	trending: t.Array(MetadataWithRelationSchema),
});

export type RecommendationReasonKind = typeof RecommendationReasonKindSchema.static;
export type RecommendationReason = typeof RecommendationReasonSchema.static;
export type DiscoverResponse = typeof DiscoverResponseSchema.static;
