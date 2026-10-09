import { t } from "elysia";

export const PluginCatalogCategorySchema = t.Union([
	t.Literal("metadata"),
	t.Literal("subtitles"),
	t.Literal("automation"),
	t.Literal("integrations"),
	t.Literal("ui"),
	t.Literal("other"),
]);

export type PluginCatalogCategory = typeof PluginCatalogCategorySchema.static;

/** A catalog repository as visible to admins — the token is never returned. */
export const PluginRepositorySchema = t.Object({
	id: t.String(),
	name: t.String(),
	url: t.String(),
	enabled: t.Boolean(),
	hasToken: t.Boolean(),
	lastRefreshedAt: t.Nullable(t.String({ format: "date-time" })),
	lastErrorCode: t.Nullable(t.String()),
	createdAt: t.String({ format: "date-time" }),
	updatedAt: t.String({ format: "date-time" }),
});

export type PluginRepository = typeof PluginRepositorySchema.static;

export const PluginCatalogInstallStatusSchema = t.Union([t.Literal("available"), t.Literal("installed"), t.Literal("update-available")]);

export type PluginCatalogInstallStatus = typeof PluginCatalogInstallStatusSchema.static;

/** A previously published version as visible to admins — download details stay server-side. */
export const PluginCatalogVersionSchema = t.Object({
	version: t.String(),
	date: t.Optional(t.String()),
	changelog: t.Optional(t.String()),
	minServerVersion: t.Optional(t.String()),
});

export type PluginCatalogVersion = typeof PluginCatalogVersionSchema.static;

export const PluginCatalogEntrySchema = t.Object({
	id: t.String(),
	name: t.String(),
	version: t.String(),
	description: t.Optional(t.String()),
	category: PluginCatalogCategorySchema,
	homepage: t.Optional(t.String()),
	iconUrl: t.Optional(t.String()),
	changelog: t.Optional(t.String()),
	capabilities: t.Optional(t.Array(t.String())),
	date: t.Optional(t.String()),
	/** Oldest server release that can install this plugin version — the server refuses installs below it. */
	minServerVersion: t.Optional(t.String()),
	versions: t.Optional(t.Array(PluginCatalogVersionSchema)),
	repositoryId: t.String(),
	repositoryName: t.String(),
	status: PluginCatalogInstallStatusSchema,
	installedVersion: t.Nullable(t.String()),
});

export type PluginCatalogEntry = typeof PluginCatalogEntrySchema.static;

/** A catalog repository that could not be read; its plugins are missing from the catalog. */
export const PluginCatalogUnavailableRepositorySchema = t.Object({
	repositoryId: t.String(),
	repositoryName: t.String(),
	/** Stable code for why the repository could not be read (for example `plugin.repository_unavailable`). */
	errorCode: t.String(),
});

export type PluginCatalogUnavailableRepository = typeof PluginCatalogUnavailableRepositorySchema.static;

/** The aggregated catalog plus the repositories that did not contribute to it. */
export const PluginCatalogResultSchema = t.Object({
	plugins: t.Array(PluginCatalogEntrySchema),
	unavailableRepositories: t.Array(PluginCatalogUnavailableRepositorySchema),
});

export type PluginCatalogResult = typeof PluginCatalogResultSchema.static;

export const CreatePluginRepositoryBodySchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 100 }),
	url: t.String({ minLength: 8, maxLength: 2048 }),
	/** Access token for private repositories — stored encrypted, never returned. */
	token: t.Optional(t.String({ minLength: 1, maxLength: 512 })),
});

export const UpdatePluginRepositoryBodySchema = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
	url: t.Optional(t.String({ minLength: 8, maxLength: 2048 })),
	/** A string replaces the stored token; null removes it; absent leaves it unchanged. */
	token: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 512 }), t.Null()])),
	enabled: t.Optional(t.Boolean()),
});

export type UpdatePluginRepositoryBody = typeof UpdatePluginRepositoryBodySchema.static;

export const InstallCatalogPluginBodySchema = t.Object({
	repositoryId: t.String({ minLength: 1 }),
	pluginId: t.String({ minLength: 1 }),
	version: t.Optional(t.String({ minLength: 1, maxLength: 32 })),
});

export type InstallCatalogPluginBody = typeof InstallCatalogPluginBodySchema.static;

/** What the install changed: a first install, a newer version, an older one, or the same version again. */
export const PluginInstallDirectionSchema = t.Union([
	t.Literal("install"),
	t.Literal("upgrade"),
	t.Literal("downgrade"),
	t.Literal("reinstall"),
]);

export type PluginInstallDirection = typeof PluginInstallDirectionSchema.static;

/**
 * Where the plugin ended up. `enabled`: running. `disabled`: installed, and it stays disabled as it was.
 * `rolled_back`: the new version did not load and the previous one was restored (`version` is the restored one).
 * `failed`: the new version did not load and could not be undone; the plugin keeps the recorded failure.
 */
export const PluginInstallStateSchema = t.Union([
	t.Literal("enabled"),
	t.Literal("disabled"),
	t.Literal("rolled_back"),
	t.Literal("failed"),
]);

export type PluginInstallState = typeof PluginInstallStateSchema.static;

/** One finding of a dry-run check. `error` blocks the install; `warning` does not. */
export const PluginValidationIssueSchema = t.Object({
	severity: t.Union([t.Literal("error"), t.Literal("warning")]),
	code: t.String(),
	/** Raw diagnostic from the validator, for the administrator reading the report. Translate `code`, not this. */
	message: t.String(),
});

export type PluginValidationIssue = typeof PluginValidationIssueSchema.static;

/** What installing an uploaded archive would do, decided without installing it. */
export const PluginValidationResultSchema = t.Object({
	valid: t.Boolean(),
	pluginId: t.Optional(t.String()),
	version: t.Optional(t.String()),
	installedVersion: t.Optional(t.String()),
	direction: t.Optional(PluginInstallDirectionSchema),
	issues: t.Array(PluginValidationIssueSchema),
});

export type PluginValidationResult = typeof PluginValidationResultSchema.static;

export const InstallCatalogPluginResponseSchema = t.Object({
	pluginId: t.String(),
	version: t.String(),
	upgraded: t.Boolean(),
	previousVersion: t.Optional(t.String()),
	direction: PluginInstallDirectionSchema,
	state: PluginInstallStateSchema,
	/** Raw message of the load failure, when there was one. */
	error: t.Optional(t.String()),
	/** Stable code for `error`, the same one the plugin status reports. */
	errorCode: t.Optional(t.String()),
});

export type InstallCatalogPluginResponse = typeof InstallCatalogPluginResponseSchema.static;
