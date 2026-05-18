import { useCallback, useState } from "react";

interface UseFilterStateResult {
    filters: Record<string, string>;
    showFilters: boolean;
    toggleShowFilters: () => void;
    handleFilterChange: (column: string, value: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
}

export function useFilterState(): UseFilterStateResult {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [showFilters, setShowFilters] = useState(false);

    const toggleShowFilters = useCallback(() => setShowFilters((p) => !p), []);
    const handleFilterChange = useCallback((column: string, value: string) => {
        setFilters((prev) => ({ ...prev, [column]: value }));
    }, []);
    const clearFilters = useCallback(() => setFilters({}), []);

    const hasActiveFilters = Object.values(filters).some((v) => v.length > 0);

    return {
        filters,
        showFilters,
        toggleShowFilters,
        handleFilterChange,
        clearFilters,
        hasActiveFilters,
    };
}
