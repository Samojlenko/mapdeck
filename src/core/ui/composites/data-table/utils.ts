import type { TranslationDict } from "@core/framework/types";
import type { SortDirection } from "./types";
import { GLOBAL_FILTER_KEY } from "./constants";

// ── Formatting ───────────────────────────────────────────────────────────────

function formatNumber(value: number): string {
    if (Math.abs(value) >= 1_000_000) return value.toExponential(4);
    return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatBoolean(value: boolean, dict: TranslationDict): string {
    return value
        ? (dict["attributeTable.yes"] ?? "Yes")
        : (dict["attributeTable.no"] ?? "No");
}

export function formatValue(value: unknown, dict: TranslationDict): string {
    if (value == null) return dict["attributeTable.nullValue"] ?? "";
    if (typeof value === "boolean") return formatBoolean(value, dict);
    if (typeof value === "number") return formatNumber(value);
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return `[${value.join(", ")}]`;
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
}

export function getSortIndicator(direction: SortDirection): string {
    if (direction === "asc") return " ↑";
    if (direction === "desc") return " ↓";
    return "";
}

// ── Comparison ───────────────────────────────────────────────────────────────

export function compareValues(a: unknown, b: unknown): number {
    if (a === b) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
}

// ── Filtering ────────────────────────────────────────────────────────────────

export function applyRowFilters(
    row: Record<string, unknown>,
    filters: Record<string, string>,
    dict: TranslationDict,
): boolean {
    const globalFilter = filters[GLOBAL_FILTER_KEY]?.toLowerCase();

    if (globalFilter !== undefined) {
        return Object.values(row).some((val) =>
            formatValue(val, dict).toLowerCase().includes(globalFilter),
        );
    }

    return Object.entries(filters)
        .filter(([col]) => col !== GLOBAL_FILTER_KEY)
        .every(([col, filterVal]) => {
            if (!filterVal) return true;
            return formatValue(row[col], dict)
                .toLowerCase()
                .includes(filterVal.toLowerCase());
        });
}

// ── KV sorting ───────────────────────────────────────────────────────────────

export function applyKvSorting(
    rows: Record<string, unknown>[],
    sortColumn?: string | null,
    sortDirection?: SortDirection,
): [string, unknown][] {
    // flatMap + filter already produces a new array — no extra copy needed
    const entries = rows
        .flatMap(Object.entries)
        .filter(([key]) => !key.startsWith("_"));

    if (!sortColumn || !sortDirection) {
        return entries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    return entries.sort((a, b) => {
        const aVal = sortColumn === "attribute" ? a[0] : a[1];
        const bVal = sortColumn === "attribute" ? b[0] : b[1];
        const result = compareValues(aVal, bVal);
        return sortDirection === "desc" ? -result : result;
    });
}
