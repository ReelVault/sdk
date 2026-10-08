# v1.2.1

### Features

- **Trickplay storage stats** — `getTrickplayStats()` and `TrickplayStatsSchema` now carry `storageBytes` and `storageBudgetBytes`, so clients can show how much of the core artifact budget (`system.artifacts.coreMaxStorageGb`) is used.

### Fixes

- **Dashboard view library contract** — `AdminDashboardViewResponseSchema.libraries` now uses `LibraryWithRelationsSchema` (`paths` + file/size stats). The previous base `LibrarySchema` stripped relations during response validation, which crashed the admin libraries page that reads the dashboard-seeded cache.

# v1.2.2

### Features

- **Plugin-declared CSP sources** — `PluginManifest.csp` (typed via `PluginCspDirectives`, allowlisted by `PLUGIN_CSP_DIRECTIVES`) lets a plugin declare extra `img-src` / `media-src` / `connect-src` / `font-src` / `frame-src` sources for host UI content. The server validates them and appends them to the web UI Content-Security-Policy, so provider artwork and embedded players load without widening script or style execution.


# v1.3.0

### Features

- **Change password** — `auth.changePassword({ currentPassword, newPassword })` with `ChangePasswordRequestSchema` / `ChangePasswordResponseSchema`. Every other session is revoked while the current one stays signed in.
- **Subtitle language priority list** — `subtitleFallbackLanguages` on profile preferences and preference defaults: a comma-separated list (e.g. `en,de`) tried after `subtitleLanguage`.
- **Remove from Continue Watching** — `me.dismissContinueWatching(metadataId)` hides a title without discarding resume positions.
- **Rewind on resume** — `resumeRewindSeconds` (0–30) on profile preferences and preference defaults.
- **Plugin UI switches** — `admin.getPluginUiSettings` / `updatePluginUiSettings` / `resetPluginUiSettings` with `PluginUiSettingsSchema` and `UpdatePluginUiSettingsBodySchema`: list the switchable parts of a plugin's UI (pages, dialogs, tabs, slot entries, search provider, pre-roll) and hide them individually or all at once.
- **Liveness and readiness probes** — `health.live()` and `health.ready()` for `GET /health/live` and `GET /health/ready` (`HealthLiveResponseSchema`).
