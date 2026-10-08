import type { PluginCapabilityName, PluginCspDirectives } from "./vocabulary";

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
	/**
	 * Extra CSP sources the host web UI must allow for plugin-provided content
	 * (artwork CDNs, embedded players, external APIs). Script/style execution is
	 * deliberately not extendable.
	 */
	csp?: PluginCspDirectives | undefined;
}
