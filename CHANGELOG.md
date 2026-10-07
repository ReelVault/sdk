# v1.2.1

### Fixes

- **Dashboard view library contract** — `AdminDashboardViewResponseSchema.libraries` now uses `LibraryWithRelationsSchema` (`paths` + file/size stats). The previous base `LibrarySchema` stripped relations during response validation, which crashed the admin libraries page that reads the dashboard-seeded cache.
