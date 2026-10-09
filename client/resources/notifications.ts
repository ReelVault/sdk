import type { PaginatedResponse, PaginationQuery } from "@sdk/common/pagination";
import type { Notification } from "@sdk/common/notification.types";
import { BaseResource } from "../core/base-resource";

export class NotificationsClient extends BaseResource {
	getPage(query: PaginationQuery & { unreadOnly?: boolean; type?: string } = {}): Promise<PaginatedResponse<Notification>> {
		return this._get("/notifications/page", { query });
	}

	getAll(query: { unreadOnly?: boolean } = {}): Promise<Notification[]> {
		return this._get("/notifications", { query });
	}

	getUnreadCount(): Promise<{ count: number }> {
		return this._get("/notifications/unread-count");
	}

	markRead(id: string): Promise<{ success: true }> {
		return this._patch(`/notifications/${id}`, { body: { read: true } });
	}

	markAllRead(): Promise<{ success: true }> {
		return this._patch("/notifications", { body: { all: true } });
	}

	/** Removes one notification from the caller's list. */
	delete(id: string): Promise<{ deleted: number }> {
		return this._delete(`/notifications/${id}`);
	}

	/** Removes up to 200 notifications from the caller's list in one request. */
	deleteMany(ids: string[]): Promise<{ deleted: number }> {
		return this._post("/notifications/delete", { body: { ids } });
	}
}
