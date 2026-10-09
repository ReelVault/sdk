import type { BulkRefreshResult } from "@sdk/common/bulk-refresh";
import type { EpisodeFilters, EpisodeSorting, EpisodeWithRelations } from "@sdk/common/episode.types";
import type { FieldsQuery, SelectFields } from "@sdk/common/fields";
import type { PaginatedResponse, PaginationQuery } from "@sdk/common/pagination";
import { BaseResource } from "../core/base-client";

export class EpisodesClient extends BaseResource {
	getAll<F extends string>(
		query?: PaginationQuery & FieldsQuery<F> & EpisodeFilters & EpisodeSorting,
	): Promise<PaginatedResponse<SelectFields<EpisodeWithRelations, F>>> {
		return this._get("/episodes", { query });
	}

	getById<F extends string>(episodeId: string, query?: FieldsQuery<F>): Promise<SelectFields<EpisodeWithRelations, F>> {
		return this._get(`/episodes/${episodeId}`, { query });
	}

	refresh<F extends string>(episodeId: string): Promise<SelectFields<EpisodeWithRelations, F>> {
		return this._post(`/episodes/${episodeId}/refresh`);
	}

	refreshImage<F extends string>(episodeId: string): Promise<SelectFields<EpisodeWithRelations, F>> {
		return this._post(`/episodes/${episodeId}/refresh-image`);
	}

	/** Refreshes several episodes in turn; the outcome of each id comes back in `results`. */
	bulkRefresh(episodeIds: string[]): Promise<BulkRefreshResult> {
		return this._post("/episodes/bulk-refresh", { body: { ids: episodeIds } });
	}
}
