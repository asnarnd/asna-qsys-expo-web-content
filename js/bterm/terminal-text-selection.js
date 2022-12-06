/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { TextSelect, TEXT_SELECT_MODES, Point };

const TEXT_SELECT_MODES = {
    PASSIVE: '',
    POTENTIAL_SELECTION: 'potential-selection',
    IN_PROGRESS: 'in-progress',
    COMPLETE: 'complete'
};


class TextSelect {
    constructor(selectionElement) {
        this.selectionElement = selectionElement;
        this.reset();
    }

    clientPt(termParentEl, devPointerEvent) {
        const clientRect = termParentEl.getBoundingClientRect();
        return new Point(devPointerEvent.clientX - clientRect.left, devPointerEvent.clientY - clientRect.top);
    }

    reset() {
        this.mode = TEXT_SELECT_MODES.PASSIVE;
        this.anchor = null;
        this.selectedRect = null;
        this.hide();
    }

    positionElement(rect, color) {
        if (!this.selectionElement) { return; }

        this.selectionElement.style.position = 'absolute';
        this.selectionElement.style.left = `${rect.l}px`;
        this.selectionElement.style.top = `${rect.t}px`;
        this.selectionElement.style.width = `${rect.w}px`;
        this.selectionElement.style.height = `${rect.h}px`;
        this.selectionElement.style.backgroundColor = color;
    }

    show() {
        if (this.selectionElement && this.selectionElement.style && this.selectionElement.style.display !== 'block') {
            this.selectionElement.style.display = 'block';
        }
    }
    hide() {
        if (this.selectionElement && this.selectionElement.style && this.selectionElement.style.display !== 'none') {
            this.selectionElement.style.display = 'none';
        }
    }

    setPotentialSelection(pt) {
        this.anchor = pt;
        this.mode = TEXT_SELECT_MODES.POTENTIAL_SELECTION;
    }
    setInProgress() {
        this.mode = TEXT_SELECT_MODES.IN_PROGRESS;
    }
    setComplete() {
        this.mode = TEXT_SELECT_MODES.COMPLETE;
    }

    static hasPointerMovedToStartSelection(cursorDim, dx, dy) {
        return dx > cursorDim.w || dy > cursorDim.y;
    }

    static normalizeCoordRect(cursorDim, pt, pt2) {
        const row = TextSelect.pixelToRow(cursorDim, Math.min(pt.y, pt2.y));
        const row2 = TextSelect.pixelToRow(cursorDim, Math.max(pt.y, pt2.y));
        const col = TextSelect.pixelToCol(cursorDim, Math.min(pt.x, pt2.x));
        const col2 = TextSelect.pixelToCol(cursorDim, Math.max(pt.x, pt2.x));

        return new Rect(row, col, row2 - row + 1, col2 - col + 1);
    }

    static rowToPixel(cursorDim, row) {
        return row * cursorDim.h;
    }

    static colToPixel(cursorDim, col) {
        return col * cursorDim.w;
    }

    static pixelToRow(cursorDim, pixels) {
        return (pixels / cursorDim.h) >> 0; // Integer division
    }

    static pixelToCol(cursorDim, pixels) {
        return (pixels / cursorDim.w) >> 0; // Integer division
    }

    static getRowColFromPixel(cursorDim, point) {
        return {
            row: TextSelect.pixelToRow(cursorDim, point.y),
            col: TextSelect.pixelToCol(cursorDim, point.x)
        };
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Rect {
    constructor(row,col,rows,cols) {
        this.row = row;
        this.col = col;
        this.rows = rows;
        this.cols = cols;
    }
}