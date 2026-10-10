export interface PluginNotification {
	userId: string;
	profileId?: string | undefined;
	type: string;
	title: string;
	message?: string | undefined;
	data?: Record<string, unknown> | undefined;
	link?: string | undefined;
}

/** A notification for every administrator; the host chooses the recipients. */
export type PluginAdminNotification = Omit<PluginNotification, "userId" | "profileId">;

export interface PluginNotifications {
	create(notification: PluginNotification): Promise<void>;
	/** Sends the notification to every administrator; each recipient counts once against the plugin's daily limit. */
	createForAdmins(notification: PluginAdminNotification): Promise<void>;
}

/** A notification handed to every registered external delivery channel. */
export type OutgoingNotification = {
	id: string;
	userId: string;
	profileId?: string | undefined;
	type: string;
	title: string;
	message?: string | null | undefined;
	data?: Record<string, unknown> | undefined;
	link?: string | null | undefined;
};

export interface PluginNotificationChannel {
	/** Stable identifier used for logs and per-channel error attribution. */
	readonly id: string;
	deliver(notification: OutgoingNotification): Promise<void>;
}

export interface PluginNotificationChannels {
	register(channel: PluginNotificationChannel): void;
}
