import type {
	BulkSubtitleDelete,
	BulkSubtitleDeleteResult,
	CreateSubtitleRequest,
	Subtitle,
	SubtitleFilters,
	SubtitleProviderDownloadRequest,
	SubtitleProviderSearchRequest,
	SubtitleProviderSearchResponse,
	SubtitleProviderStatus,
	SubtitleSorting,
	UpdateSubtitleRequest,
} from "@sdk/common";

import type { PaginatedResponse, PaginationQuery } from "@sdk/common/pagination";
import { BaseResource } from "../core/base-client";

export class SubtitlesClient extends BaseResource {
	getAll(query?: PaginationQuery & SubtitleFilters & SubtitleSorting): Promise<PaginatedResponse<Subtitle>> {
		return this._get(`/subtitles`, { query });
	}

	/** Stores an SRT, WebVTT or ASS file as an external subtitle track of the media file (admin). */
	upload(body: { mediaFileId: string; language: string; label?: string | undefined; file: Blob; fileName: string }): Promise<Subtitle> {
		const form = new FormData();
		form.set("mediaFileId", body.mediaFileId);
		form.set("language", body.language);
		if (body.label !== undefined) form.set("label", body.label);
		form.set("file", body.file, body.fileName);

		return this._post("/subtitles/upload", { body: form });
	}

	create(body: CreateSubtitleRequest): Promise<Subtitle> {
		return this._post(`/subtitles`, { body });
	}

	getById(id: string): Promise<Subtitle> {
		return this._get(`/subtitles/${id}`);
	}

	update(id: string, body: UpdateSubtitleRequest): Promise<Subtitle> {
		return this._patch(`/subtitles/${id}`, { body });
	}

	delete(id: string): Promise<{ success: true }> {
		return this._delete(`/subtitles/${id}`);
	}

	/** Removes several subtitles one after another; the outcome of each id comes back in `results`. */
	bulkDelete(subtitleIds: string[]): Promise<BulkSubtitleDeleteResult> {
		return this._post("/subtitles/bulk-delete", { body: { ids: subtitleIds } });
	}

	listProviders(): Promise<SubtitleProviderStatus[]> {
		return this._get(`/subtitles/providers`);
	}

	searchProviders(body: SubtitleProviderSearchRequest): Promise<SubtitleProviderSearchResponse[]> {
		return this._post(`/subtitles/search`, { body });
	}

	downloadFromProvider(providerId: string, body: SubtitleProviderDownloadRequest): Promise<Subtitle> {
		return this._post(`/subtitles/providers/${providerId}/download`, { body });
	}

	getContent(id: string): Promise<string> {
		return this._get(`/subtitles/${id}/content`);
	}
}
