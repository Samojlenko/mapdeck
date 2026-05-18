import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@core/framework/hooks";
import type { AnyMapTool } from "@core/framework/types";
import { clampMenuPosition } from "./clampMenuPosition";
import type { ContextMenuPosition, MenuSize } from "./useContextMenu";
import styles from "./ContextMenu.module.css";

export interface ContextMenuProps {
    isOpen: boolean;
    position: ContextMenuPosition | null;
    onClose: () => void;
    tools: AnyMapTool[];
    activeToolId: string | null;
    onToolClick: (tool: AnyMapTool) => void;
    dict: Record<string, string>;
    resolveToolName: (toolId: string) => string;
}

const ContextMenuComponent: React.FC<ContextMenuProps> = ({
    isOpen,
    position,
    onClose,
    tools,
    activeToolId,
    onToolClick,
    dict,
    resolveToolName,
}) => {
    const [menuSize, setMenuSize] = useState<MenuSize | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    const measureMenu = useCallback((node: HTMLDivElement | null) => {
        menuRef.current = node;
        if (node) {
            const rect = node.getBoundingClientRect();
            const cs = window.getComputedStyle(node);
            const margin = parseFloat(cs.paddingLeft) || 8;
            setMenuSize({
                width: rect.width,
                height: rect.height,
                margin,
            });
        } else {
            setMenuSize(null);
        }
    }, []);

    useClickOutside(menuRef, onClose, isOpen, {
        defer: true,
    });

    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKey);
        window.addEventListener("resize", onClose);

        return () => {
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", onClose);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !position) return null;

    const adjustedPosition = menuSize
        ? clampMenuPosition(position, menuSize, {
              width: window.innerWidth,
              height: window.innerHeight,
          })
        : position;

    return createPortal(
        <>
            <div className={styles.overlay} />
            <div
                ref={measureMenu}
                className={styles.menu}
                style={{
                    left: adjustedPosition.x,
                    top: adjustedPosition.y,
                    visibility: menuSize ? undefined : "hidden",
                }}
                role="menu"
            >
                <div className={styles.header}>
                    {dict["contextMenu.mapTools"]}
                </div>
                {tools.map((tool) => {
                    const isActive = activeToolId === tool.id;
                    const toolName = resolveToolName(tool.id);
                    return (
                        <button
                            key={tool.id}
                            type="button"
                            className={
                                isActive ? styles.itemActive : styles.item
                            }
                            onClick={() => onToolClick(tool)}
                            role="menuitem"
                        >
                            <span className={styles.itemLabel}>{toolName}</span>
                        </button>
                    );
                })}
            </div>
        </>,
        document.body,
    );
};

export default ContextMenuComponent;
