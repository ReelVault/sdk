import type { FieldsQuery, SelectFields } from "@sdk/common/fields";
import type { PaginatedResponse, PaginationQuery } from "@sdk/common/pagination";
import type {
	CreateProfile,
	ProfileFilters,
	ProfilePinStatus,
	ProfileSorting,
	SwitchProfile,
	UpdateProfile,
	Profile,
} from "@sdk/common/profile.types";
import type { ProfilePreferenceDefaults, ProfilePreferences, UpdateProfilePreferences } from "@sdk/common/profile-preferences.types";
import { BaseResource } from "../core/base-client";

export class ProfilesClient extends BaseResource {
	getAll<F extends string>(
		query?: PaginationQuery & FieldsQuery<F> & ProfileFilters & ProfileSorting,
	): Promise<PaginatedResponse<SelectFields<Profile, F>>> {
		return this._get("/profiles", { query });
	}

	create<F extends string>(body: CreateProfile, query?: FieldsQuery<F>): Promise<SelectFields<Profile, F>> {
		return this._post("/profiles", { body, query });
	}

	getById<F extends string>(id: string, query?: FieldsQuery<F>): Promise<SelectFields<Profile, F>> {
		return this._get(`/profiles/${id}`, { query });
	}

	update<F extends string>(id: string, body: UpdateProfile, query?: FieldsQuery<F>): Promise<SelectFields<Profile, F>> {
		return this._patch(`/profiles/${id}`, { body, query });
	}

	delete(id: string): Promise<{ success: boolean }> {
		return this._delete(`/profiles/${id}`);
	}

	switch(body: SwitchProfile): Promise<{ success: boolean }> {
		return this._post("/profiles/switch", { body });
	}

	getPinStatus(id: string): Promise<ProfilePinStatus> {
		return this._get(`/profiles/${id}/pin`);
	}

	getPreferences(id: string): Promise<ProfilePreferences> {
		return this._get(`/profiles/${id}/preferences`);
	}

	updatePreferences(id: string, body: UpdateProfilePreferences): Promise<ProfilePreferences> {
		return this._patch(`/profiles/${id}/preferences`, { body });
	}

	getPreferenceDefaults(): Promise<ProfilePreferenceDefaults> {
		return this._get("/profiles/preferences/defaults");
	}

	resetPreferences(id: string): Promise<ProfilePreferences> {
		return this._delete(`/profiles/${id}/preferences`);
	}

	/** Replaces this profile's preference overrides with a copy of another profile's (same account). */
	copyPreferences(id: string, sourceProfileId: string): Promise<ProfilePreferences> {
		return this._post(`/profiles/${id}/preferences/copy`, { body: { sourceProfileId } });
	}

	uploadAvatar(id: string, file: Blob): Promise<{ avatarUrl: string }> {
		const body = new FormData();
		body.set("file", file, "avatar.upload");

		return this._post(`/profiles/${id}/avatar`, { body, skipRetry: true });
	}
}
