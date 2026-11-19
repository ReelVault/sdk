import type { DownloadJob, DownloadSeasonQueueResult, MyDownloadsResponse, PrepareDownload, QueueSeasonDownload } from "@sdk/common";
import { BaseResource } from "../core/base-client";

export class DownloadsClient extends BaseResource {
	list(): Promise<MyDownloadsResponse> {
		return this._get("/downloads");
	}

	prepare(body: PrepareDownload): Promise<DownloadJob> {
		return this._post("/downloads/prepare", { body });
	}

	/** Queues every episode of a season; the outcome of each episode comes back in `results`. */
	queueSeason(body: QueueSeasonDownload): Promise<DownloadSeasonQueueResult> {
		return this._post("/downloads/seasons", { body });
	}

	getStatus(jobId: string): Promise<DownloadJob | null> {
		if (!jobId) return Promise.reject(new Error("jobId is required"));

		return this._get<DownloadJob | null>(`/downloads/${jobId}/status`);
	}

	getFileUrl(jobId: string): string {
		return this.apiUrl(`/downloads/${jobId}/file`).toString();
	}

	cancel(jobId: string): Promise<{ success: boolean }> {
		if (!jobId) return Promise.reject(new Error("jobId is required"));

		return this._post<{ success: boolean }>(`/downloads/${jobId}/cancel`, { body: undefined });
	}

	retry(jobId: string): Promise<DownloadJob> {
		if (!jobId) return Promise.reject(new Error("jobId is required"));

		return this._post<DownloadJob>(`/downloads/${jobId}/retry`, { body: undefined });
	}

	remove(jobId: string): Promise<{ success: boolean }> {
		if (!jobId) return Promise.reject(new Error("jobId is required"));

		return this._delete<{ success: boolean }>(`/downloads/${jobId}`);
	}
}
