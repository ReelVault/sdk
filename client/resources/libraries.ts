import type {
	LibraryErrorsCheckRequest,
	LibraryErrorsCheckStatus,
	LibraryHealthResponse,
	LibraryScanAllResponse,
	LibraryScanCancelResponse,
	OperationQueuedResponse,
	LibraryScanProgressResponse,
	ScanFindingCandidatesResponse,
	ScanFindingIgnoredResponse,
	ScanFindingsResponse,
	ScanFindingStatus,
	UpdateScanFinding,
} from "@sdk/common";
import type { FieldsQuery, SelectFields } from "@sdk/common/fields";
import type { CreateLibrary, LibraryFilters, LibrarySorting, LibraryWithRelations, UpdateLibrary } from "@sdk/common/library.types";
import type { PaginatedResponse, PaginationQuery } from "@sdk/common/pagination";
import { BaseResource } from "../core/base-client";

export class LibrariesClient extends BaseResource {
	getAll<F extends string>(
		query?: PaginationQuery & FieldsQuery<F> & LibrarySorting & LibraryFilters,
	): Promise<PaginatedResponse<SelectFields<LibraryWithRelations, F>>> {
		return this._get("/libraries", { query });
	}

	create<F extends string>(body: CreateLibrary, query?: FieldsQuery<F>): Promise<SelectFields<LibraryWithRelations, F>> {
		return this._post("/libraries", { body, query });
	}

	getById<F extends string>(libraryId: string, query?: FieldsQuery<F>): Promise<SelectFields<LibraryWithRelations, F>> {
		return this._get(`/libraries/${libraryId}`, { query });
	}

	update<F extends string>(libraryId: string, body: UpdateLibrary, query?: FieldsQuery<F>): Promise<SelectFields<LibraryWithRelations, F>> {
		return this._patch(`/libraries/${libraryId}`, { body, query });
	}

	delete(libraryId: string): Promise<{ success: boolean }> {
		return this._delete(`/libraries/${libraryId}`);
	}

	scan(libraryId: string): Promise<OperationQueuedResponse> {
		return this._post(`/libraries/${libraryId}/scan`, { body: undefined });
	}

	scanAll(): Promise<LibraryScanAllResponse> {
		return this._post("/libraries/scan", { body: undefined });
	}

	cancelScans(libraryId: string): Promise<LibraryScanCancelResponse> {
		return this._post(`/libraries/${libraryId}/scan/cancel`, { body: undefined });
	}

	scanPath(libraryId: string, pathId: string): Promise<OperationQueuedResponse> {
		return this._post(`/libraries/${libraryId}/paths/${pathId}/scan`, { body: undefined });
	}

	checkErrors(libraryPaths: LibraryErrorsCheckRequest["libraryPaths"]): Promise<OperationQueuedResponse> {
		return this._post("/libraries/check-errors", { body: { libraryPaths } });
	}

	/** Status of a check queued by `checkErrors`; `result` is set once it has completed. */
	getErrorsCheckStatus(operationId: string): Promise<LibraryErrorsCheckStatus> {
		return this._get(`/libraries/check-errors/${encodeURIComponent(operationId)}`);
	}

	/** Every library's paths as they are now: whether each exists and whether the watcher covers it. */
	getHealth(): Promise<LibraryHealthResponse> {
		return this._get("/libraries/health");
	}

	getIgnoredAssets(libraryId: string): Promise<Array<{ path: string; fileName: string; reason: string }>> {
		return this._get(`/libraries/${libraryId}/metadata-sidecars/assets`);
	}

	/** Libraries whose scan is queued or running, with its progress; empty when no scan is active. */
	getScanProgress(): Promise<LibraryScanProgressResponse> {
		return this._get("/libraries/scan-progress");
	}

	/** Findings the scans could not ingest, in one status; `counts` covers both statuses. */
	getScanFindings(libraryId: string, status: ScanFindingStatus = "active"): Promise<ScanFindingsResponse> {
		return this._get(`/libraries/${libraryId}/scan-findings`, { query: { status } });
	}

	/** Ignores a finding until it is restored (`ignored: false`). */
	setScanFindingIgnored(libraryId: string, body: UpdateScanFinding): Promise<ScanFindingIgnoredResponse> {
		return this._patch(`/libraries/${libraryId}/scan-findings`, { body });
	}

	/** Searches the providers for the title parsed from the finding's file name; runs only when called. */
	getScanFindingCandidates(libraryId: string, filePath: string): Promise<ScanFindingCandidatesResponse> {
		return this._get(`/libraries/${libraryId}/scan-findings/candidates`, { query: { filePath } });
	}
}
