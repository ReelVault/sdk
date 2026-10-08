# v1.2.1

### Features

- **Trickplay storage stats** — `getTrickplayStats()` and `TrickplayStatsSchema` now carry `storageBytes` and `storageBudgetBytes`, so clients can show how much of the core artifact budget (`system.artifacts.coreMaxStorageGb`) is used.

### Fixes

- **Dashboard view library contract** — `AdminDashboardViewResponseSchema.libraries` now uses `LibraryWithRelationsSchema` (`paths` + file/size stats). The previous base `LibrarySchema` stripped relations during response validation, which crashed the admin libraries page that reads the dashboard-seeded cache.

# v1.2.2

### Features

- **Plugin-declared CSP sources** — `PluginManifest.csp` (typed via `PluginCspDirectives`, allowlisted by `PLUGIN_CSP_DIRECTIVES`) lets a plugin declare extra `img-src` / `media-src` / `connect-src` / `font-src` / `frame-src` sources for host UI content. The server validates them and appends them to the web UI Content-Security-Policy, so provider artwork and embedded players load without widening script or style execution.
