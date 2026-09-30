import type { PluginCapabilityName } from "./vocabulary";

export type { PluginCapabilityName } from "./vocabulary";

/** Data read before a plugin module is imported. */
export interface PluginManifest {
	id: string;
	name: string;
	version: string;
	entry: string;
	capabilities: PluginCapabilityName[];
	description?: string | undefined;
	homepage?: string | undefined;
	license?: string | undefined;
	/** Oldest server release allowed to install this plugin — the host refuses older ones. */
	minServerVersion?: string | undefined;
}
