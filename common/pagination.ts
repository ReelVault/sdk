import { t } from "elysia";

/** Offset pagination query — `page`/`limit` only; cursor endpoints use `CursorPaginationQuery`. */
export interface PaginationQuery {
	page?: number | undefined;
	limit?: number | undefined;
}

/**
 * Query for endpoints that honor keyset cursors (`GET /v1/metadata`,
 * `GET /v1/me/watched-history`). Supplying `cursor` switches the server to
 * cursor mode and resets `page` to 1.
 */
export interface CursorPaginationQuery extends PaginationQuery {
	cursor?: string | undefined;
}

export interface PaginationConfig {
	page: number;
	limit: number;
	offset: number;
}

/** Flat offset response envelope — meta first, then the page rows. */
export interface PaginatedResponse<T> {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	data: T[];
}

/** Flat cursor response envelope; `nextCursor` is absent on the last page. */
export interface CursorPaginatedResponse<T> extends PaginatedResponse<T> {
	nextCursor?: string;
}

/**
 * Shared pagination meta object: flat list envelopes and flat admin page
 * envelopes both derive their four counter fields from this definition.
 */
export const PaginationMetaSchema = t.Object({
	page: t.Integer({ minimum: 1 }),
	limit: t.Integer({ minimum: 1 }),
	total: t.Integer({ minimum: 0 }),
	totalPages: t.Integer({ minimum: 0 }),
});

export type PaginationMeta = typeof PaginationMetaSchema.static;
