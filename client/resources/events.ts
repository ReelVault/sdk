import { BaseResource } from "../core/base-client";

const HTTP_PROTOCOL_REGEX = /^http/;

export class EventsClient extends BaseResource {
	/**
	 * Returns the absolute WebSocket URL for real-time events.
	 * Converts the configured baseUrl (http/https) to ws/wss and appends /v1/events/ws.
	 */
	getWebSocketUrl(query?: { profileId?: string }): string {
		const url = this.apiUrl("/events/ws");
		url.protocol = url.protocol.replace(HTTP_PROTOCOL_REGEX, "ws");
		if (query?.profileId) {
			url.searchParams.set("profileId", query.profileId);
		}

		return url.toString();
	}
}
