import { type Static, t } from "elysia";

export const SystemSettingGroupSchema = t.Union([
	t.Literal("resources"),
	t.Literal("streaming"),
	t.Literal("scanning"),
	t.Literal("downloads"),
	t.Literal("markers"),
	t.Literal("trickplay"),
	t.Literal("images"),
	t.Literal("workers"),
	t.Literal("playback_defaults"),
	t.Literal("system"),
	t.Literal("network"),
]);

export const SystemSettingItemViewSchema = t.Object({
	key: t.String(),
	group: SystemSettingGroupSchema,
	type: t.String(),
	value: t.Any(),
	default: t.Any(),
	options: t.Optional(t.Array(t.String())),
	/** Inclusive bounds of a number setting. */
	min: t.Optional(t.Number()),
	max: t.Optional(t.Number()),
	/** Display unit of a number setting (`ms`, `s`, `days`, ...). */
	unit: t.Optional(t.String()),
	/** The value is read only at startup or when a session begins: a change needs a restart. */
	restartRequired: t.Optional(t.Boolean()),
	isCustom: t.Boolean(),
});

export type SystemSettingItemView = Static<typeof SystemSettingItemViewSchema>;

export const SystemSettingsGroupedSchema = t.Object({
	resources: t.Array(SystemSettingItemViewSchema),
	streaming: t.Array(SystemSettingItemViewSchema),
	scanning: t.Array(SystemSettingItemViewSchema),
	downloads: t.Array(SystemSettingItemViewSchema),
	markers: t.Array(SystemSettingItemViewSchema),
	trickplay: t.Array(SystemSettingItemViewSchema),
	images: t.Array(SystemSettingItemViewSchema),
	workers: t.Array(SystemSettingItemViewSchema),
	playback_defaults: t.Array(SystemSettingItemViewSchema),
	system: t.Array(SystemSettingItemViewSchema),
	network: t.Array(SystemSettingItemViewSchema),
});

export type SystemSettingsGrouped = Static<typeof SystemSettingsGroupedSchema>;

export const UpdateSystemSettingsSchema = t.Record(t.String(), t.Any());

export type UpdateSystemSettings = Static<typeof UpdateSystemSettingsSchema>;

/** `GET /admin/settings/export` — the current value of every setting, versioned so an import can refuse other formats. */
export const SystemSettingsExportSchema = t.Object({
	format: t.Literal("reelvault.settings"),
	formatVersion: t.Literal(1),
	exportedAt: t.String({ format: "date-time" }),
	settings: t.Record(t.String(), t.Any()),
});

export type SystemSettingsExport = Static<typeof SystemSettingsExportSchema>;

/** `POST /admin/settings/import` — an export file. Listed settings are validated and applied; the others keep their values. */
export const ImportSystemSettingsSchema = t.Object(
	{
		format: t.Literal("reelvault.settings"),
		formatVersion: t.Literal(1),
		exportedAt: t.Optional(t.String()),
		settings: t.Record(t.String(), t.Any()),
	},
	{ additionalProperties: false },
);

export type ImportSystemSettings = Static<typeof ImportSystemSettingsSchema>;

export const ResetSystemSettingsSchema = t.Object({
	keys: t.Optional(t.Array(t.String())),
});

export type ResetSystemSettings = Static<typeof ResetSystemSettingsSchema>;
