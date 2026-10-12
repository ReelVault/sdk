import { t } from "elysia";

export const PluginLifecycleStateSchema = t.Union([
	t.Literal("discovered"),
	t.Literal("validated"),
	t.Literal("resolved"),
	t.Literal("initialized"),
	t.Literal("enabled"),
	t.Literal("disabled"),
	t.Literal("failed"),
	t.Literal("unloaded"),
]);

export type PluginLifecycleState = typeof PluginLifecycleStateSchema.static;

export const PluginLoadPhaseSchema = t.Union([
	t.Literal("manifest"),
	t.Literal("config"),
	t.Literal("entry"),
	t.Literal("import"),
	t.Literal("setup"),
	t.Literal("initialization"),
	t.Literal("activation"),
]);

export type PluginLoadPhase = typeof PluginLoadPhaseSchema.static;

/** A safe administrative view of one plugin runtime, with no configuration values. */
export const PluginRuntimeStatusSchema = t.Object({
	id: t.String(),
	name: t.String(),
	version: t.String(),
	description: t.Optional(t.String()),
	state: PluginLifecycleStateSchema,
	providers: t.Integer({ minimum: 0 }),
	subtitleProviders: t.Integer({ minimum: 0 }),
	jobs: t.Integer({ minimum: 0 }),
	/** Stable code of the failure (for example `plugin.manifest_invalid`); translate this, not a message. */
	errorCode: t.Optional(t.String()),
	failurePhase: t.Optional(PluginLoadPhaseSchema),
});

export type PluginRuntimeStatus = typeof PluginRuntimeStatusSchema.static;

/** Administrator view of one plugin: the runtime status plus what the server found on disk for it. */
export const PluginAdminStatusSchema = t.Object({
	...PluginRuntimeStatusSchema.properties,
	/**
	 * Stable code (`plugin.config_unreadable`) when the plugin's `config.json` exists but cannot be read.
	 * The plugin then runs on its defaults, so an absent value here is not the same as a saved one.
	 */
	configReadError: t.Optional(t.String()),
	/** Capabilities the plugin's manifest declares; empty when the manifest cannot be read. */
	capabilities: t.Array(t.String()),
	/** Installer-managed plugins only: when the installed package was written. */
	installedAt: t.Optional(t.String()),
	/** Installer-managed plugins only: where the package came from (`upload` or a catalog reference). */
	source: t.Optional(t.String()),
	/**
	 * Installer-managed plugins only: the package on disk matched its recorded integrity at the last check
	 * (server start or install). A mismatch found at start is reported until the plugin is installed again.
	 */
	integrityOk: t.Optional(t.Boolean()),
	/** Installer-managed plugins only: the administrator refuses the CSP sources the manifest declares. */
	cspDisabled: t.Optional(t.Boolean()),
	/** Installer-managed plugins only: the installed version is kept, so catalog updates are not offered. */
	pinned: t.Optional(t.Boolean()),
	/** An enabled catalog offers a newer version of this plugin. */
	updateAvailable: t.Boolean(),
});

export type PluginAdminStatus = typeof PluginAdminStatusSchema.static;

/** Redacted plugin configuration values exposed to administrators. */

/** Plain text, or a locale map such as `{ en: "Language", pl: "Język" }`, the same as plugin UI text. */
export const PluginLocalizedTextSchema = t.Union([t.String(), t.Record(t.String(), t.String())]);

export const PluginConfigFieldOptionSchema = t.Object({
	label: PluginLocalizedTextSchema,
	value: t.Union([t.String(), t.Number()]),
});

export const PluginConfigFieldSchema = t.Object({
	name: t.String(),
	type: t.Union([t.Literal("string"), t.Literal("number"), t.Literal("boolean"), t.Literal("select"), t.Literal("secret")]),
	label: PluginLocalizedTextSchema,
	description: t.Optional(PluginLocalizedTextSchema),
	default: t.Optional(t.Unknown()),
	required: t.Optional(t.Boolean()),
	/** Secret fields only: whether a value is stored. The value itself is never returned. */
	hasValue: t.Optional(t.Boolean()),
	min: t.Optional(t.Number()),
	max: t.Optional(t.Number()),
	step: t.Optional(t.Number()),
	options: t.Optional(t.Array(PluginConfigFieldOptionSchema)),
});

export const PluginConfigDetailsSchema = t.Object({
	id: t.String(),
	name: t.String(),
	version: t.String(),
	description: t.Optional(t.String()),
	config: t.Record(t.String(), t.Unknown()),
	fields: t.Array(PluginConfigFieldSchema),
});

export type PluginConfigDetails = typeof PluginConfigDetailsSchema.static;

export const UpdatePluginConfigBodySchema = t.Record(t.String(), t.Unknown());

/** Enables or disables several plugins in one request. */
export const PluginBulkStateBodySchema = t.Object({
	enabled: t.Boolean(),
	pluginIds: t.Array(t.String({ maxLength: 128 }), { minItems: 1, maxItems: 100 }),
});

export type PluginBulkStateBody = typeof PluginBulkStateBodySchema.static;

/** One outcome per requested plugin, in request order. A failure does not stop the others. */
export const PluginBulkStateResultSchema = t.Object({
	results: t.Array(
		t.Object({
			pluginId: t.String(),
			ok: t.Boolean(),
			error: t.Optional(t.String()),
			errorCode: t.Optional(t.String()),
		}),
	),
});

export type PluginBulkStateResult = typeof PluginBulkStateResultSchema.static;

/** Keeps (`true`) or releases (`false`) the installed version of a plugin. */
export const PluginPinUpdateBodySchema = t.Object({ pinned: t.Boolean() });

export type PluginPinUpdateBody = typeof PluginPinUpdateBodySchema.static;

/** Allows (`true`) or refuses (`false`) the CSP sources the plugin's manifest declares. */
export const PluginCspUpdateBodySchema = t.Object({ enabled: t.Boolean() });

export type PluginCspUpdateBody = typeof PluginCspUpdateBodySchema.static;

/** Restores the defaults for the listed fields, or for every stored value when `keys` is omitted. */
export const ResetPluginConfigBodySchema = t.Object({
	keys: t.Optional(t.Array(t.String({ maxLength: 128 }), { maxItems: 256 })),
});

export type ResetPluginConfigBody = typeof ResetPluginConfigBodySchema.static;

/**
 * A plugin configuration as exported by an administrator. Secret fields are never part of an export,
 * and an import ignores them, so a file can be moved between installations without moving credentials.
 */
export const PluginConfigExportSchema = t.Object({
	format: t.Literal("reelvault.plugin-config"),
	formatVersion: t.Literal(1),
	pluginId: t.String(),
	values: t.Record(t.String(), t.Unknown()),
});

export type PluginConfigExport = typeof PluginConfigExportSchema.static;

/** Kind of UI contribution an administrator can switch off. */
export const PluginUiSurfaceKindSchema = t.Union([
	t.Literal("page"),
	t.Literal("dialog"),
	t.Literal("tab"),
	t.Literal("slot"),
	t.Literal("searchProvider"),
	t.Literal("playbackPreRoll"),
]);

export type PluginUiSurfaceKind = typeof PluginUiSurfaceKindSchema.static;

/** One switchable piece of a plugin's UI. `key` is stable across restarts and is what overrides refer to. */
export const PluginUiContributionSchema = t.Object({
	key: t.String(),
	surface: PluginUiSurfaceKindSchema,
	label: t.String(),
	adminOnly: t.Boolean(),
	enabled: t.Boolean(),
});

export type PluginUiContribution = typeof PluginUiContributionSchema.static;

/** Interface switches of one plugin. `enabled: false` hides the plugin's whole UI regardless of the contributions. */
export const PluginUiSettingsSchema = t.Object({
	pluginId: t.String(),
	enabled: t.Boolean(),
	contributions: t.Array(PluginUiContributionSchema),
});

export type PluginUiSettings = typeof PluginUiSettingsSchema.static;

export const UpdatePluginUiSettingsBodySchema = t.Object({
	enabled: t.Boolean(),
	/** Keys of the contributions to hide; every other contribution stays visible. */
	disabledKeys: t.Array(t.String({ minLength: 1 }), { maxItems: 500 }),
});

export type UpdatePluginUiSettingsBody = typeof UpdatePluginUiSettingsBodySchema.static;
