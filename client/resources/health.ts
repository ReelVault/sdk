import type { HealthLive, HealthStatus } from "@sdk/common";
import { BaseResource } from "../core/base-client";

export class HealthClient extends BaseResource {
	check(): Promise<HealthStatus> {
		return this._get("/health");
	}

	/** Process liveness probe — cheap and dependency-free (for container/orchestrator health checks). */
	live(): Promise<HealthLive> {
		return this._get("/health/live");
	}

	/** Readiness probe — answers 503 until the database responds. */
	ready(): Promise<HealthStatus> {
		return this._get("/health/ready");
	}
}
