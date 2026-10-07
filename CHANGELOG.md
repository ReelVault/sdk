# v1.2.1

### Features

- **Trickplay storage stats** — `getTrickplayStats()` and `TrickplayStatsSchema` now carry `storageBytes` and `storageBudgetBytes`, so clients can show how much of the core artifact budget (`system.artifacts.coreMaxStorageGb`) is used.

### Fixes

- **Dashboard view library contract** — `AdminDashboardViewResponseSchema.libraries` now uses `LibraryWithRelationsSchema` (`paths` + file/size stats). The previous base `LibrarySchema` stripped relations during response validation, which crashed the admin libraries page that reads the dashboard-seeded cache.
