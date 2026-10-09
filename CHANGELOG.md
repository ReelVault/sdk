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

- **Backup code count** — `auth.getBackupCodesStatus()` for `GET /auth/two-factor/backup-codes`, typed by `TwoFactorBackupCodesStatusSchema` / `TwoFactorBackupCodesStatus` (`{ remaining: number | null }`).
- **Rating badge preference** — `hideRatingOverlay` in `ProfilePreferencesSchema`, `UpdateProfilePreferencesSchema` and `ProfilePreferenceDefaultsSchema`. It hides the rating badge on poster cards and defaults to off.
- **Catalog statuses** — `metadata.getStatuses()` for `GET /metadata/statuses`, with `MetadataStatusesResponseSchema` / `MetadataStatusesResponse` (`{ statuses: string[] }`).
- **Dry runs for log cleanup and trickplay deletes** — `admin.cleanupLogs(retentionDays, { dryRun })` and `admin.deleteTrickplayMany(ids, { dryRun })`. `TrickplayDeleteResult` and the log cleanup result carry `dryRun`; a dry run reports what would be removed and removes nothing.
- **Worker history purge dry run** — `PurgeWorkerHistoryOptions.dryRun` and `PurgeWorkerHistoryResponse.dryRun`; a dry run reports the counts a purge would delete and removes nothing.
- **Cancel an update** — `admin.cancelUpdate(target)` for `POST /admin/update/cancel`. `AdminUpdateCancelResponseSchema` / `AdminUpdateCancelResponse` describe the reply, and an update history entry may now have status `cancelled`.
- **Forced server updates** — `admin.installUpdate(target, { force })` and `admin.rollbackUpdate(target, { force })`. A server install or rollback is refused with `update.blocked_active_streams` while streams play, unless `force` is set.
- **Plugin configuration reset, export and import** — `admin.resetPluginConfig(id, { keys? })`, `admin.exportPluginConfig(id)` and `admin.importPluginConfig(id, file)` with `ResetPluginConfigBodySchema` and `PluginConfigExportSchema`. Exports never contain secret fields.
- **Catalog reports unavailable repositories** — `admin.getPluginCatalog()` returns `{ plugins, unavailableRepositories }`; each unavailable repository has its `repositoryId`, `repositoryName` and an `errorCode`. `PluginCatalogResultSchema` / `PluginCatalogResult` describe it.
- **Bulk plugin state and version pinning** — `admin.setPluginsEnabled({ enabled, pluginIds })` returns an outcome per plugin; `admin.setPluginPinned(id, pinned)`; `PluginAdminStatus.pinned`.
- **Refuse a plugin's CSP sources** — `PluginAdminStatus.cspDisabled` and `admin.setPluginCsp(id, enabled)` for `PUT /admin/plugins/:id/csp`.
- **Setting metadata** — `SystemSettingItemView` reports the `unit` of a number setting and `restartRequired` for settings that take effect only after a restart.
- **Server capabilities** — `ServerCapabilitiesSchema` / `ServerCapabilities` and `reelvault.capabilities.get()` for the public `GET /capabilities` endpoint (trickplay, downloads).
- **Profile PIN status** — `profiles.getPinStatus(id)` returns `{ hasPin }` for the owner's profile (`ProfilePinStatusSchema` / `ProfilePinStatus`), so settings can offer removing the PIN without ever receiving it.
- **Filtered marker list** — `media.getAllMarkers({ type, source, q, limit })` narrows the admin marker list on the server; `MediaMarkerFiltersSchema` / `MediaMarkerFilters` describe the filters. Calls without arguments behave as before.
- **Subtitle text search** — `SubtitleFiltersSchema` takes `q` (up to 200 characters); `subtitles.getAll({ q })` matches it against the label, the language and the media file id.
- **Safer database restore** — `admin.restoreDatabase(fileName, { force? })` sends the optional `force`, and `AdminDatabaseRestoreResponse` carries `preRestoreBackup`, the copy taken just before the swap.
- **Audit filter options** — `admin.getAuditOptions()` returns the resource types in the audit log and the administrators who wrote entries (`AdminAuditOptionsSchema` / `AdminAuditOptions`), for the filter dropdowns. `name` is null when the account no longer exists.
- **User list filters** — `admin.getUsers({ role, status })` narrows the account list by role (`admin` or `user`) and by status (`active` or `blocked`), next to the search.
- **Download title link** — `DownloadJob.metadataId` (nullable, also on `AdminDownloadJobSchema`) names the title the download's media file belongs to, so a download can link to its title.
- **Watchlist auto-removal preference** — profile preferences gain `watchlistAutoRemoveWatched` (boolean, off by default). When it is on, a title leaves the watchlist once the profile has watched it. The field is part of `ProfilePreferencesSchema`, `UpdateProfilePreferencesSchema` and `ProfilePreferenceDefaultsSchema`.
- **Watch state controls** — `me.resetPlaybackProgress(mediaFileId, { scope })` takes `scope`: `file` resets only that file, `title` (the default) resets every file of its title. `me.setWatchStateBulk({ mediaFileIds, watched })` marks up to 500 files watched or unwatched in one call (`WatchStateBulkSchema` / `WatchStateBulk`, `WatchStateScopeSchema` / `WatchStateScope`).
- **Update history and environment** — `admin.getUpdateHistory({ page, limit })` pages through the installs and rollbacks (`AdminUpdateHistoryPageSchema` / `AdminUpdateHistoryPage`). `AdminUpdateStatus.environment` reports the container engine (`docker`, `podman` or none), whether the server runs without root and whether systemd manages it as a `user` or `system` unit (`AdminUpdateEnvironmentSchema`).
- **Subtitle extractability** — `Subtitle.extractable` is `false` for image-based embedded tracks (PGS, VobSub), which cannot be served as text.
- **Migration status** — `admin.getDatabaseMigrations()` returns `DatabaseMigrationStatus` (`total`, `applied`, `pending`, `latest`, `migrations`).
- **Paginated marker list** — `media.getAllMarkers(query)` takes `page` next to `limit` and returns `PaginatedResponse<MediaMarker>` (`data`, `total`, `totalPages`) instead of a bare array.
- **Mark all read by type** — `notifications.markAllRead(type?)` marks only the notifications of the given type when one is passed.
- **Live activity capacity** — `AdminLiveActivityResponse` gains `capacity` (`{ limit, active }`): the server-wide stream limit and the number of slots in use.
- **Remove notifications** — `notifications.delete(id)` and `notifications.deleteMany(ids)` (up to 200) remove notifications from the caller's list and return `{ deleted }`.
- **Trickplay regeneration by scope** — `admin.regenerateTrickplay({ scope, id, force? })` (`scope` is `library`, `title` or `season`) returns `TrickplayRegenerationQueued` (`{ operationId?, matching, enqueued, remaining }`); `admin.getTrickplayRegenerationReport(operationId)` returns `TrickplayRegenerationReport` with the generated, budget-skipped, other-skipped, failed, cancelled and unfinished counts.
- **Worker schedule pause, job retry and watchdog state** — `admin.setWorkerScheduleEnabled(workerId, enabled)` returns `WorkerScheduleState` (`{ workerId, enabled, nextRunAt }`); `admin.retryWorkerJob(jobId)` returns `WorkerRetryResponse` (`{ success, jobId }` of the new job); `admin.getWorkerWatchdog()` returns `WorkerWatchdogState` with `recoveredJobs` and `lastRecoveredAt`. `WorkerSummary` gains `scheduleEnabled` and an optional `nextRunAt`.
- **Worker job list** — `admin.getWorkerJobs({ page, limit, workerId, status })` returns one page of worker jobs (`PaginatedResponse<WorkerJob>`).
- **Watchlist bulk changes and clear** — `me.bulkUpdateWatchlist({ add, remove })` (`WatchlistBulkBodySchema`) and `me.clearWatchlist()`, with `WatchlistBulkResponse` and `WatchlistClearResponse`.
- **Log filters** — `admin.getLogs({ module, exclude, from, to })` takes the same filters as the server query.
- **Settings export and import** — `admin.exportSystemSettings()` (`SystemSettingsExportSchema`) and `admin.importSystemSettings(body)` (`ImportSystemSettingsSchema`).
- **Resource history window** — `admin.getResources({ hours })` takes the history window in hours (1–168, default 24).
- **Audit search** — `admin.getAudit({ q })` matches one term against the resource id and the summary of each entry.
- **Download retry, cancel and quota** — `downloads.retry(jobId)` and `downloads.cancel(jobId)`; `MyDownloadsResponseSchema` carries `quota` (`DownloadQuotaSchema`).
- **Notification pages** — `notifications.getPage({ page, limit, unreadOnly, type })` returns `PaginatedResponse<Notification>`.
- **Audit summary** — `admin.getAuditSummary(query)` returns `AdminAuditSummary`: the `total` and one `actors` entry per administrator with `total`, `creates`, `updates`, `deletes`, `lastAt` and `name`.
- **Admin download list paging** — `admin.getDownloadJobs({ page, limit, status })` returns the page envelope with `data` (previously `jobs`) and `counts` per status.
- **Marker import** — `media.importMarkers(ndjson)` sends the NDJSON file as text/plain and returns `MarkerImportResult` (`mediaFiles` and `markers` replaced).
- **Setting change tracking** — `SystemSettingItemView` carries `updatedAt` and `lastModifiedBy`; the realtime event map has `settings:changed` (`keys`, `actorUserId`, `updatedAt`).
- **API key rotation and editing** — `admin.rotateApiKey(id)` and `admin.updateApiKey(id, { name, expiresAtDays })`; `ApiKey` carries `createdByName`.
- **Trickplay removal** — `admin.deleteTrickplay(mediaFileId)` and `admin.deleteTrickplayMany(mediaFileIds)` return `TrickplayDeleteResultSchema`; `admin.getArtifactStats()` reads the artifact rows per owner and kind.
- **Database integrity and optimize** — `admin.getDatabaseIntegrity()` (`DatabaseIntegrity`: `ok` and the messages SQLite reports) and `admin.optimizeDatabase()`.
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
- **Admin user sessions** — `admin.getUserSessions(userId)` lists a user's sessions that have not expired (`AdminUserSessionsPage`, never the token), `admin.revokeUserSession(userId, sessionId)` ends one, and `admin.revokeUsersSessions({ userIds })` ends every session of up to 100 users, returning `revokedSessions`. `AdminUser` carries `lastActiveAt` and `activeSessionCount`.
- **Bulk refresh** — `episodes.bulkRefresh(ids)`, `people.bulkRefresh(ids)` and `media.bulkRefresh(ids)` take up to 50 ids and return `BulkRefreshResult` (`results`, one `{ id, ok, code? }` per id; `code` is set only for a failed id).
- **Season download** — `downloads.queueSeason({ seasonId, quality?, force? })` for `POST /downloads/seasons`, typed by `QueueSeasonDownloadSchema` / `QueueSeasonDownload` and `DownloadSeasonQueueResultSchema` / `DownloadSeasonQueueResult` (`results`, one outcome per episode).
- **Library health and error-check results** — `libraries.getHealth()` for `GET /libraries/health` (`LibraryHealthResponse`: per library the last scan and each path's `exists`, `isDirectory`, `watchStatus` and `unwatchableCode`), and `libraries.getErrorsCheckStatus(operationId)` for `GET /libraries/check-errors/:operationId` (`LibraryErrorsCheckStatus`, whose `result` is set once the check has completed).
- **Bulk subtitle delete** — `subtitles.bulkDelete(ids)` for `POST /subtitles/bulk-delete`, typed by `BulkSubtitleDeleteSchema` / `BulkSubtitleDeleteResultSchema` (one outcome per id).
- **Copy profile preferences** — `profiles.copyPreferences(id, sourceProfileId)` for `POST /profiles/:id/preferences/copy` (`CopyProfilePreferencesSchema`); `CreateProfile` takes `copyPreferencesFromProfileId`.
- **Muted notification types** — `mutedNotificationTypes` (comma-separated) in `ProfilePreferencesSchema`, `UpdateProfilePreferencesSchema` and `ProfilePreferenceDefaultsSchema`.
- **Hidden menu pages** — `hiddenPages` (comma-separated) in `ProfilePreferencesSchema`, `UpdateProfilePreferencesSchema` and `ProfilePreferenceDefaultsSchema`.
- **Bulk artwork refresh and image cache purge** — `metadata.bulkRefreshImages(ids)` for `POST /metadata/bulk-refresh-images` (up to 50 titles, one `{ id, ok, code? }` result per id) and `admin.purgeImageCache()` for `POST /admin/image-cache/purge`, typed by `ImageCachePurgeResultSchema` / `ImageCachePurgeResult` (`removedFiles`, `freedBytes`).
- **Database backup upload** — `admin.uploadDatabaseBackup(file)` posts a SQLite backup to `POST /admin/database/backups/upload` and returns the stored `AdminDatabaseBackup`.
