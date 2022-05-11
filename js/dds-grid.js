/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theDdsGrid as DdsGrid };

import { DdsWindow } from '../js/dds-window.js';
import { AsnaDataAttrName } from '../js/asna-data-attr.js';

const DDS_FILE_LINES = 27;
const MAIN_SELECTOR = 'main[role=main]';
const CLASS_GRID_ROW = 'dds-grid-row';
const CLASS_GRID_EMPTY_ROW = 'dds-grid-empty-row';
const CLASS_PRESERVE_BLANKS = 'dds-preserve-blanks';

class DdsGrid {
    addWinPopupCorners(activeWindowRecord) {
        const winSpecs = DdsWindow.parseWinSpec();
        if (!winSpecs) {
            return;
        }

        const ltCorner = this.findElAtRowCol(activeWindowRecord, 1, winSpecs.left + 1);
        const brCorner = this.findElAtRowCol(activeWindowRecord, winSpecs.height, winSpecs.left + winSpecs.width);

        if (ltCorner && ltCorner.el && brCorner && brCorner.el) {
            DdsWindow.setCorners(ltCorner.el, brCorner.el);
            return; // No need to create corners.
        }

        let leftTopCorner = ltCorner ? ltCorner.el : null;
        let bottomRightCorner = brCorner ? brCorner.el : null;

        if (!leftTopCorner) {
            let divRow = ltCorner ? ltCorner.divRow : null;
            leftTopCorner = this.createSpanGridStyle('' + (winSpecs.left + 1));
            if (!divRow) {
                divRow = this.createDivGridRowStyle('1');
                activeWindowRecord.insertBefore(divRow, activeWindowRecord.firstChild);
            }
            divRow.appendChild(leftTopCorner);
        }

        if (!bottomRightCorner) {
            let divRow = brCorner ? brCorner.divRow: null;
            bottomRightCorner = this.createSpanGridStyle('' + (winSpecs.left + winSpecs.width));
            if (!divRow) {
                divRow = this.createDivGridRowStyle(winSpecs.height);
                activeWindowRecord.appendChild(divRow);
            }
            divRow.appendChild(bottomRightCorner);
        }

        DdsWindow.setCorners(leftTopCorner, bottomRightCorner);
    }

    completeGridRows(form, activeWindowRecord) {
        const records = this.findAllRecords(form);

        if (!records.length) {
            return;
        }

        let lastRowVal = 0;
        let lastRow = null;

        let subfiles = [];

        for (let r = 0; r < records.length; r++) {
            const record = records[r];
            if (activeWindowRecord && !record.getAttribute(AsnaDataAttrName.WINDOW)) {
                continue;
            }

            const ddsRows = this.findRows(record);

            if (!ddsRows) {
                continue;
            }

            for (let i = 0, l = ddsRows.length; i < l; i++) {
                let row = ddsRows[i];
                const rangeVal = row.getAttribute(AsnaDataAttrName.ROW);
                if (!rangeVal) {
                    continue;
                }
                const range = rangeVal.split('-');
                let rowVal = parseInt(range[0], 10);
                let winSpecs = null;
                if (activeWindowRecord && activeWindowRecord.contains(row)) {
                    winSpecs = DdsWindow.parseWinSpec();
                    if (winSpecs && winSpecs.top) {
                        rowVal += winSpecs.top;
                    }
                }
                let emptyRowsBefore = rowVal - 1 - lastRowVal;

                if (emptyRowsBefore > 0) {
                    this.insertEmptyRows(emptyRowsBefore, row, lastRowVal + 1);
                }

                if (range.length === 2) {
                    subfiles.push(row);
                }
                lastRowVal = range.length === 2 ? range[1] : range[0];
                lastRowVal = parseInt(lastRowVal, 10);
                if (winSpecs && winSpecs.top) {
                    lastRowVal += winSpecs.top;
                }
                lastRow = row;
            }
        }
        if (lastRow) { // Complete rows to set the height of the top-record
            const parent = lastRow.parentElement;

            for (let i = lastRowVal; i < DDS_FILE_LINES; i++) {
                parent.appendChild(this.createEmptyDivGridRowStyle(i + 1));
            }
        }

        subfiles.forEach((sfl) => this.completeSubfileGridRows(sfl));
    }

    completeSubfileGridRows(sflEl) {
        const rowSpan = sflEl.getAttribute(AsnaDataAttrName.ROW);
        if (!rowSpan) { return; }  // Unexpected

        const range = rowSpan.split('-');
        if (range.length !== 2) { return; }  // Unexpected

        const fromRow = parseInt(range[0], 10);
        const toRow = parseInt(range[1], 10);

        if (fromRow < 0 || toRow < fromRow) { return; }  // Unexpected

        const rows = sflEl.querySelectorAll(`div[class~=${CLASS_GRID_ROW}]`);
        const emptyRows = sflEl.querySelectorAll(`div[class~=${CLASS_GRID_EMPTY_ROW}]`);

        const subfilePage = (toRow - fromRow) + 1;
        const existingRows = rows.length + emptyRows.length;
        const toAddCount = subfilePage - existingRows;
        if (toAddCount > 0) {
            this.appendEmptyRows(toAddCount, sflEl, fromRow + existingRows)
        }
    }

    findAllRecords(form) {
        const main = form.querySelector(MAIN_SELECTOR);
        if (!main) {
            return;
        }

        return this.findRecords(main);
    }

    findRecords(main) {
        return main.querySelectorAll(`div[${AsnaDataAttrName.RECORD}]`);
    }

    findRows(parentRecord) {
        const all = parentRecord.querySelectorAll(`div[${AsnaDataAttrName.ROW}]`);
        if (!all || !all.length) {
            return null;
        }

        return all;
    }

    insertEmptyRows(count, beforeEl, offset) {
        const parent = beforeEl.parentElement;

        for (let i = 0; i < count; i++) {
            parent.insertBefore(this.createEmptyDivGridRowStyle(i+offset), beforeEl);
        }
    }

    appendEmptyRows(count, parent, offset) {
        for (let i = 0; i < count; i++) {
            parent.appendChild(this.createEmptyDivGridRowStyle(/*i + offset*/));
        }
    }

    createDivGridRowStyle(rowVal) {
        const div = document.createElement('div');
        if (rowVal) {
            div.setAttribute(AsnaDataAttrName.ROW, rowVal);
        }
        div.className = CLASS_GRID_ROW;
        return div;
    }

    createSpanGridStyle(colVal) {
        const span = document.createElement('span');
        span.className = CLASS_PRESERVE_BLANKS;
        span.setAttribute('style', `grid-column: ${colVal} / span 1; grid-row: 1`);
        span.innerText = ' ';
        return span;
    }

    createEmptyDivGridRowStyle(rowVal) {
        const emptyDiv = document.createElement('div');
        if (rowVal) {
            emptyDiv.setAttribute(AsnaDataAttrName.ROW, rowVal);
        }
        emptyDiv.className = CLASS_GRID_EMPTY_ROW;
        return emptyDiv;
    }

    truncateColumns(form) {
        let maxCol = this.calcMaxGridColumnEnd(form.querySelector(MAIN_SELECTOR));
        if (!maxCol) {
            return;
        }

        const backWindows = document.querySelectorAll('.dds-window-background');
        for (let i = 0, l = backWindows.length; i < l; i++) {
            const maxWinGridCol = this.calcMaxGridColumnEnd(backWindows[i]);
            maxCol = Math.max(maxCol, maxWinGridCol);
        }

        if (maxCol > 80) {
            // console.log(`Truncate to: ${maxCol}`);
            document.documentElement.style.setProperty('--dds-grid-columns', maxCol);
        }
    }

    calcMaxGridColumnEnd(container) {
        if (!container) {
            return 0;
        }

        const elementsInlineStyle = container.querySelectorAll('*[style]');

        if (!elementsInlineStyle) {
            return 0;
        }

        let maxCol = 0;

        for (let i = 0, l = elementsInlineStyle.length; i < l; i++) {
            let style = elementsInlineStyle[i].style;
            if (!style || !style.gridColumnEnd) {
                continue;
            }
            maxCol = Math.max(maxCol, style.gridColumnEnd);
        }

        return maxCol;
    }

    findSubfile(sflCtrlName, sflCtl) {
        if (!sflCtl) {
            sflCtl = document.querySelector(`[${AsnaDataAttrName.RECORD}="${sflCtrlName}"]`);
        }

        if (!sflCtl) {
            return null;
        }

        let sfl = null;
        const slfCtlRows = this.findRows(sflCtl);

        for (let row of slfCtlRows) {
            const rangeVal = row.getAttribute(AsnaDataAttrName.ROW);
            if (rangeVal) {
                const range = rangeVal.split('-');
                if (range.length === 2) {
                    sfl = row;
                    break;
                }
            }
        }

        return sfl;
    }

    findElAtRowCol(divRec, row, col) {
        const divRow = divRec.querySelector(`div[${AsnaDataAttrName.ROW}='${row}']`);
        if (!divRow) {
            return null;
        }

        let result = { divRow: divRow, el : null };

        const candidates = divRow.querySelectorAll('[style*="grid-column"]');

        for (let i = 0, l = candidates.length; i < l; i++) {
            if (candidates[i].style.gridColumnStart === '' + col) {
                result.el = candidates[i]; // Note: we don't care about End (or Span)
                return result;
            }
        }

        return result;
    }
}

const theDdsGrid = new DdsGrid;


