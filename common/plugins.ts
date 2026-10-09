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
	error: t.Optional(t.String()),
	/** Stable code for `error` (for example `plugin.manifest_invalid`); translate this, not the message. */
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
});

export type PluginAdminStatus = typeof PluginAdminStatusSchema.static;

/** Redacted plugin configuration values exposed to administrators. */

export const PluginConfigFieldOptionSchema = t.Object({
	label: t.String(),
	value: t.Union([t.String(), t.Number()]),
});

export const PluginConfigFieldSchema = t.Object({
	name: t.String(),
	type: t.Union([t.Literal("string"), t.Literal("number"), t.Literal("boolean"), t.Literal("select"), t.Literal("secret")]),
	label: t.String(),
	description: t.Optional(t.String()),
	default: t.Optional(t.Unknown()),
	required: t.Optional(t.Boolean()),
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
