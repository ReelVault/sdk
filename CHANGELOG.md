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

- **Plugin configuration reset, export and import** — `admin.resetPluginConfig(id, { keys? })`, `admin.exportPluginConfig(id)` and `admin.importPluginConfig(id, file)` with `ResetPluginConfigBodySchema` and `PluginConfigExportSchema`. Exports never contain secret fields.
- **Catalog reports unavailable repositories** — `admin.getPluginCatalog()` returns `{ plugins, unavailableRepositories }`; each unavailable repository has its `repositoryId`, `repositoryName` and an `errorCode`. `PluginCatalogResultSchema` / `PluginCatalogResult` describe it.
- **Bulk plugin state and version pinning** — `admin.setPluginsEnabled({ enabled, pluginIds })` returns an outcome per plugin; `admin.setPluginPinned(id, pinned)`; `PluginAdminStatus.pinned`.
- **Refuse a plugin's CSP sources** — `PluginAdminStatus.cspDisabled` and `admin.setPluginCsp(id, enabled)` for `PUT /admin/plugins/:id/csp`.
- **Setting metadata** — `SystemSettingItemView` reports the `unit` of a number setting and `restartRequired` for settings that take effect only after a restart.
- **Server capabilities** — `ServerCapabilitiesSchema` / `ServerCapabilities` and `reelvault.capabilities.get()` for the public `GET /capabilities` endpoint (trickplay, downloads).
- **Profile PIN status** — `profiles.getPinStatus(id)` returns `{ hasPin }` for the owner's profile (`ProfilePinStatusSchema` / `ProfilePinStatus`), so settings can offer removing the PIN without ever receiving it.
- **Filtered marker list** — `media.getAllMarkers({ type, source, q, limit })` narrows the admin marker list on the server; `MediaMarkerFiltersSchema` / `MediaMarkerFilters` describe the filters. Calls without arguments behave as before.
- **Subtitle text search** — `SubtitleFiltersSchema` takes `q` (up to 200 characters); `subtitles.getAll({ q })` matches it against the label, the language and the media file id.
- **Worker job list** — `admin.getWorkerJobs({ page, limit, workerId, status })` returns one page of worker jobs (`PaginatedResponse<WorkerJob>`).
- **Watchlist bulk changes and clear** — `me.bulkUpdateWatchlist({ add, remove })` (`WatchlistBulkBodySchema`) and `me.clearWatchlist()`, with `WatchlistBulkResponse` and `WatchlistClearResponse`.
- **Log filters** — `admin.getLogs({ module, exclude, from, to })` takes the same filters as the server query.
- **Settings export and import** — `admin.exportSystemSettings()` (`SystemSettingsExportSchema`) and `admin.importSystemSettings(body)` (`ImportSystemSettingsSchema`).
- **Resource history window** — `admin.getResources({ hours })` takes the history window in hours (1–168, default 24).
- **Audit search** — `admin.getAudit({ q })` matches one term against the resource id and the summary of each entry.
- **Download retry, cancel and quota** — `downloads.retry(jobId)` and `downloads.cancel(jobId)`; `MyDownloadsResponseSchema` carries `quota` (`DownloadQuotaSchema`).
- **Notification pages** — `notifications.getPage({ page, limit, unreadOnly, type })` returns `PaginatedResponse<Notification>`.
- **Audit summary** — `admin.getAuditSummary(query)` returns `AdminAuditSummary`: the `total` and one `actors` entry per administrator with `total`, `creates`, `updates`, `deletes`, `lastAt` and `name`.
- **Bulk stream termination** — `admin.terminateLiveStreams({ sessionIds, reason })` returns `BulkTerminateSessionsResult`: the `terminated` and `failed` counts and one result per session.
- **Change password** — `auth.changePassword({ currentPassword, newPassword })` with `ChangePasswordRequestSchema` / `ChangePasswordResponseSchema`. Every other session is revoked while the current one stays signed in.
- **Subtitle language priority list** — `subtitleFallbackLanguages` on profile preferences and preference defaults: a comma-separated list (e.g. `en,de`) tried after `subtitleLanguage`.
- **Remove from Continue Watching** — `me.dismissContinueWatching(metadataId)` hides a title without discarding resume positions.
- **Rewind on resume** — `resumeRewindSeconds` (0–30) on profile preferences and preference defaults.
- **Plugin UI switches** — `admin.getPluginUiSettings` / `updatePluginUiSettings` / `resetPluginUiSettings` with `PluginUiSettingsSchema` and `UpdatePluginUiSettingsBodySchema`: list the switchable parts of a plugin's UI (pages, dialogs, tabs, slot entries, search provider, pre-roll) and hide them individually or all at once.
- **Liveness and readiness probes** — `health.live()` and `health.ready()` for `GET /health/live` and `GET /health/ready` (`HealthLiveResponseSchema`).
- **Number setting bounds** — `SystemSettingItemView` carries `min` and `max` for number settings.
- **Stable slot entry ids** — `PluginSlotContribution.id` (optional) keys an entry in administrator interface switches, so the switch survives reordering and edits of the other entries in the same slot.
- **Plugin failure codes** — `PluginRuntimeStatus.errorCode` (optional) carries a stable code for `error`: `plugin.manifest_invalid`, `plugin.load_failed`, `plugin.already_installed` or a domain code
- **Unreadable plugin configuration is visible** — `PluginAdminStatus` (returned by the admin plugin endpoints) carries `configReadError` (`plugin.config_unreadable`) when a plugin's `config.json` exists but cannot be read. Previously the plugin silently ran on its defaults.
.
- **Secret presence in plugin configuration** — `PluginConfigField.hasValue` (optional) on secret fields tells whether a value is stored, so an interface can show "set" without ever receiving the secret.
- **Plugin package details** — `PluginAdminStatus` gains `capabilities` (declared in the manifest), `installedAt`, `source`, `integrityOk` (package matched its recorded integrity at the last check) and `updateAvailable` (an enabled catalog offers a newer version).
- **Plugin install outcome** — `InstallCatalogPluginResponse` reports `previousVersion`, `direction` (`install` / `upgrade` / `downgrade` / `reinstall`) and `state` (`enabled` / `disabled` / `rolled_back` / `failed`), with `error` and `errorCode` when the new version did not load. An install no longer reports success while the plugin is not running.
- **Admin plugin client types** — `admin.getPlugins()`, `enablePlugin()`, `disablePlugin()`, `reloadPlugin()` and `reloadPlugins()` return `PluginAdminStatus`, which carries the package details and `configReadError`.
- **Plugin archive dry run** — `admin.validatePluginArchive(file)` (`POST /admin/plugins/validate`) checks an uploaded archive without installing it and returns `valid`, the plugin id and version, the installed version, the `direction` of the change and the `issues` (`severity` `error` or `warning`, a stable `code` and a raw `message`).
- **Profile update accepts null** — `UpdateProfileSchema` takes `pin: null` (remove the PIN) and `avatarUrl: null` (remove the avatar); omitted fields stay as they are.
