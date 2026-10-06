import { t } from "elysia";

export interface PaginationQuery {
	page?: number | undefined;
	limit?: number | undefined;
	cursor?: string | undefined;
}

export interface PaginationConfig {
	page: number;
	limit: number;
	offset: number;
}

export interface PaginatedResponse<T> {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	nextCursor?: string;
	data: T[];
}

/**
 * Shared pagination meta object: flat list envelopes and nested admin page
 * envelopes both derive their four counter fields from this definition.
 */
export const PaginationMetaSchema = t.Object({
	page: t.Integer({ minimum: 1 }),
	limit: t.Integer({ minimum: 1 }),
	total: t.Integer({ minimum: 0 }),
	totalPages: t.Integer({ minimum: 0 }),
});

export type PaginationMeta = typeof PaginationMetaSchema.static;
