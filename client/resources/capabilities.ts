import type { ServerCapabilities } from "@sdk/common";
import { BaseResource } from "../core/base-client";

export class CapabilitiesClient extends BaseResource {
	/** Public: which optional server features are switched on. Needs no session. */
	get(): Promise<ServerCapabilities> {
		return this._get("/capabilities");
	}
}
