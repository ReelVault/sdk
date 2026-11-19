import { ReelVaultValidationError } from "./errors";

interface ValidationOptions {
	method?: string | undefined;
	url?: string | undefined;
}

/**
 * Guards against missing path parameters: empty segments and the stringified
 * `undefined`/`null` that a `$(param)` interpolation would produce.
 */
export function assertValidPath(path: string, options: ValidationOptions = {}): void {
	// The leading "/" yields one empty first segment; any other empty one is a missing parameter (`/libraries//scan`).
	const segments = path.split("/").slice(1);
	const empty = segments.some((segment) => segment === "" || segment === "undefined" || segment === "null");
	if (empty) {
		throw new ReelVaultValidationError([{ path: "(path)", message: `Path contains a missing parameter: ${path}`, value: path }], options);
	}
}
