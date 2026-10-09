import { t } from "elysia";

/** Optional server features a client can check before offering them. */
export const ServerCapabilitiesSchema = t.Object({
	trickplay: t.Boolean(),
	downloads: t.Boolean(),
});

export type ServerCapabilities = typeof ServerCapabilitiesSchema.static;
