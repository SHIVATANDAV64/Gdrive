 

import type { MouseEvent as ReactMouseEvent } from 'react';

interface Position {
    x: number;
    y: number;
}

export function useContextMenu() {
    const handleContextMenu = (e: ReactMouseEvent, callback: (pos: Position) => void) => {
        e.preventDefault();
        callback({ x: e.clientX, y: e.clientY });
    };

    return { handleContextMenu };
}

export default useContextMenu;
