import type { AttributeLayerInfo } from "../utils";
import { groupLayersByTitle } from "../utils/groupLayersByTitle";

interface GroupedOptionsProps {
    layers: readonly AttributeLayerInfo[];
}

export const GroupedOptions = ({ layers }: GroupedOptionsProps) => {
    const { groups, ungrouped } = groupLayersByTitle(layers);

    return (
        <>
            {Array.from(groups.entries()).map(([groupTitle, groupLayers]) => (
                <optgroup key={groupTitle} label={groupTitle}>
                    {groupLayers.map((layer) => (
                        <option key={layer.id} value={layer.id}>
                            {layer.title}
                        </option>
                    ))}
                </optgroup>
            ))}
            {ungrouped.map((layer) => (
                <option key={layer.id} value={layer.id}>
                    {layer.title}
                </option>
            ))}
        </>
    );
};
