# @reelvault/sdk

Typed TypeScript SDK for [ReelVault](https://github.com/ReelVault/reelvault), the self-hosted media server. It includes:

- a typed HTTP **client** for the ReelVault API,
- the **shared contracts**: the request and response schemas that the server and its clients both use,
- the **plugin SDK** for writing server plugins,
- the **UI kit** for plugin frontends,
- an in-memory **test host** for plugin unit tests.

Because the server and its clients share the same schemas, they cannot disagree about a request or response shape.

## Install

```bash
bun add @reelvault/sdk
# or
npm install @reelvault/sdk
```

Requires Bun 1.4.2 or newer, or Node.js 20 or newer.

## Usage

### API client

```ts
import { ReelVaultClient } from "@reelvault/sdk/client";

const api = new ReelVaultClient({ baseUrl: "http://localhost:3030" });

await api.auth.login({ email: "me@example.com", password: "…" });
const titles = await api.metadata.getAll({ limit: 20 });
```

### Shared types

```ts
import type { MovieDetail, RealtimeEventMap } from "@reelvault/sdk/common";
```

### Plugin

```ts
import { definePlugin } from "@reelvault/sdk/plugin";

export default definePlugin({
	async setup(host) {
		host.logger.info("plugin ready");
	},
});
```

A plugin lists the host features it uses in its `plugin.json` manifest. See the [plugin guide](https://reelvault.org/plugins/getting-started).

## Entry points

| Import                     | Contents                                              |
| -------------------------- | ----------------------------------------------------- |
| `@reelvault/sdk`           | Everything: client, contracts and errors              |
| `@reelvault/sdk/client`    | `ReelVaultClient` and its resource clients            |
| `@reelvault/sdk/common`    | Request and response schemas, with their types        |
| `@reelvault/sdk/plugin`    | `definePlugin`, `PluginHost` and the plugin contracts |
| `@reelvault/sdk/ui`        | Plugin UI kit: custom elements and schema builders    |
| `@reelvault/sdk/ui/schema` | Schema builders only (tree-shakeable)                 |
| `@reelvault/sdk/testing`   | `PluginTestHost`, an in-memory host for unit tests    |

Every entry point ships as ESM and CommonJS, with TypeScript declarations.

## Development

```bash
bun install
bun run check-types
bun test
bun run build        # writes dist/: ESM, CommonJS and .d.ts files
```

To work against a local server or website checkout, link this package:

```bash
# in this directory
bun link

# in the consuming project
bun link @reelvault/sdk
```

## Releases

Pushing a `v*` tag publishes the package to npm through CI.

> **Note:** Plugins do not bundle this package. The server provides its own copy at runtime and resolves `@reelvault/sdk/*` imports itself. Plugin authors add the SDK as a `devDependency`, for types and builds only.

## Documentation

- [SDK overview and API reference](https://reelvault.org/sdk/)
- [Plugin guide](https://reelvault.org/plugins/getting-started)

## License

GPL-3.0-only. See [LICENSE](LICENSE).
