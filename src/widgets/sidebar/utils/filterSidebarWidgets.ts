import type { Widget } from "@core/framework/types";

export function filterSidebarWidgets(
    allWidgets: readonly Widget[],
    excludedIds: readonly string[],
): Widget[] {
    return allWidgets.filter(
        (widget) =>
            widget.showInSidebar !== false &&
            !excludedIds.includes(widget.id),
    );
}
