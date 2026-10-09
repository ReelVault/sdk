import { t } from "elysia";

export const ApiKeyScopeSchema = t.Union([t.Literal("read_only"), t.Literal("full")]);

export type ApiKeyScope = typeof ApiKeyScopeSchema.static;

/** The raw secret appears only in the create response — the server stores a hash. */
export const ApiKeyCreatedSchema = t.Object({
	id: t.String(),
	name: t.String(),
	keyPrefix: t.String(),
	scope: ApiKeyScopeSchema,
	expiresAt: t.Nullable(t.String({ format: "date-time" })),
	lastUsedAt: t.Nullable(t.String({ format: "date-time" })),
	createdAt: t.String({ format: "date-time" }),
	key: t.String(),
});

export type ApiKeyCreated = typeof ApiKeyCreatedSchema.static;

/** `createdByName` is the administrator who created the key; null when that account no longer exists. */
export const ApiKeySchema = t.Composite([t.Omit(ApiKeyCreatedSchema, ["key"]), t.Object({ createdByName: t.Nullable(t.String()) })]);

export type ApiKey = typeof ApiKeySchema.static;

export const ApiKeyListSchema = t.Array(ApiKeySchema);

export const CreateApiKeyRequestSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 100 }),
	scope: ApiKeyScopeSchema,
	expiresAtDays: t.Optional(t.Integer({ minimum: 1, maximum: 3650 })),
});

export type CreateApiKeyRequest = typeof CreateApiKeyRequestSchema.static;

/** Renames a key or changes its expiry; the secret itself only changes through rotation. */
export const UpdateApiKeyRequestSchema = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
	/** Days from now until the key expires; null removes the expiry. */
	expiresAtDays: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 3650 }), t.Null()])),
});

export type UpdateApiKeyRequest = typeof UpdateApiKeyRequestSchema.static;
