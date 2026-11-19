import { SortQuerySchema } from "@sdk/common/sorting";
import { t } from "elysia";
import { EntitySchema } from "./schema-utils";

export const ProfileSchema = EntitySchema(
	t.Object({ id: t.String(), userId: t.String(), name: t.String(), avatarUrl: t.Nullable(t.String()), pin: t.Nullable(t.String()) }),
);

export type Profile = typeof ProfileSchema.static;

/** `POST /profiles/:id/preferences/copy` — the profile takes over another profile's preference overrides. */
export const CopyProfilePreferencesSchema = t.Object({
	sourceProfileId: t.String({ minLength: 1 }),
});

export type CopyProfilePreferences = typeof CopyProfilePreferencesSchema.static;

/** A profile PIN, wherever it is set or entered: the switch accepts no other length. */
export const ProfilePinSchema = t.String({ minLength: 4, maxLength: 8 });

export const CreateProfileSchema = t.Object({
	/** Copies this profile's preference overrides from another profile of the same account, when given. */
	copyPreferencesFromProfileId: t.Optional(t.String({ minLength: 1 })),
	name: t.String({ minLength: 1 }),
	pin: t.Optional(t.Union([ProfilePinSchema, t.Undefined()])),
	avatarUrl: t.Optional(t.Union([t.String(), t.Undefined()])),
});

export type CreateProfile = typeof CreateProfileSchema.static;

/** Omitted fields stay as they are; `null` removes the PIN or the avatar. */
export const UpdateProfileSchema = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	pin: t.Optional(t.Union([ProfilePinSchema, t.Null()])),
	avatarUrl: t.Optional(t.Union([t.String(), t.Null()])),
});

export type UpdateProfile = typeof UpdateProfileSchema.static;

/** Whether the owner's profile has a PIN set; the PIN itself is never returned. */
export const ProfilePinStatusSchema = t.Object({ hasPin: t.Boolean() });

export type ProfilePinStatus = typeof ProfilePinStatusSchema.static;

export const SwitchProfileSchema = t.Object({
	profileId: t.String(),
	pin: t.Optional(ProfilePinSchema),
});

export type SwitchProfile = typeof SwitchProfileSchema.static;

export const ProfileFiltersSchema = t.Object({
	userId: t.Optional(t.String()),
	name: t.Optional(t.String()),
});

export type ProfileFilters = typeof ProfileFiltersSchema.static;

export const ProfileSortingSchema = t.Composite([
	SortQuerySchema,
	t.Object({
		sortBy: t.Optional(t.Union([t.Literal("name"), t.Literal("createdAt"), t.Literal("updatedAt")])),
	}),
]);

export type ProfileSorting = typeof ProfileSortingSchema.static;
