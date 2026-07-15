/**
 * Generic OGC URL utilities — pure functions for URL parsing and building.
 * Protocol-agnostic: works for any HTTP service.
 */

/**
 * Parse a URL into clean base URL and flat parameter dictionary.
 * All query parameters are extracted case-sensitively (as-is from the URL).
 */
export function parseUrl(url: string): { baseUrl: string; params: Record<string, string> } {
    try {
        const parsed = new URL(url);
        const params: Record<string, string> = {};
        parsed.searchParams.forEach((value, key) => {
            params[key] = value;
        });
        parsed.search = "";
        return { baseUrl: parsed.toString(), params };
    } catch {
        return { baseUrl: url, params: {} };
    }
}

/**
 * Build a URL from a base URL and a flat parameter dictionary.
 * Existing parameters on the base URL are preserved.
 */
export function buildUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    return url.toString();
}
