/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theDdsGrid as DdsGrid };

import { AsnaDataAttrName } from './asna-data-attr.js';
import { SubfilePagingStore } from './subfile-paging/paging-store.js';
import { SubfileController } from './subfile-paging/dom-init.js';
import { PositionCursor } from './page-position-cursor.js';

const DDS_FILE_LINES = 27;
const MAIN_SELECTOR = 'main[role=main]';
const CLASS_GRID_ROW = 'dds-grid-row';
const CLASS_GRID_EMPTY_ROW = 'dds-grid-empty-row';
const CLASS_PRESERVE_BLANKS = 'dds-preserve-blanks';
const CLASS_WINDOW_POPUP_RECORD_CONTAINER = 'dds-window-popup-record-container';
const CLASS_GRID_ROW_SPAN = 'dds-grid-row-span';

class DdsGrid {
    completeGridRows(form, activeWindowRecord) {
        const records = this.findAllRecords(form);

        if (!records.length) {
            return;
        }

        let lastRowVal = 0;
        let lastRow = null;

        let rowSpanCollection = [];

        for (let r = 0; r < records.length; r++) {
            const record = records[r];
            const recName = record.getAttribute(AsnaDataAttrName.RECORD);
            let isSubfile = false;
            let isFolded = false;
            if (recName) {
                const subfileControlData = SubfilePagingStore.getSflCtlStore(recName);
                if (subfileControlData) {
                    isSubfile = true;
                    isFolded = subfileControlData.fldDrop.isFolded;
                }
            }
            if (activeWindowRecord && !record.getAttribute(AsnaDataAttrName.WINDOW) ) {
                continue;
            }

            const ddsRows = this.findRows(record);

            if (!ddsRows) {
                continue;
            }

            if (isSubfile && !isFolded) { // When Subfile is dropping fields, don't try to fill row gaps.
                if (ddsRows.length > 0) {
                    const row = ddsRows[0];
                    const range = this.getRowRange(row);
                    if (range && range.length === 2) {
                        const sflFromRow = parseInt(range[0], 10);
                        const sflToRow = parseInt(range[1], 10);
                        if (lastRowVal === 0) { // Subfile is first element.
                            let emptyRowsBefore = sflFromRow - 1;

                            if (emptyRowsBefore > 0) {
                                this.insertEmptyRows(emptyRowsBefore, row, 1);
                            }
                        }

                        lastRowVal = sflToRow;
                        lastRow = row;
                        continue;
                    }
                }
            }

            for (let i = 0, l = ddsRows.length; i < l; i++) {
                const row = ddsRows[i];
                const range = this.getRowRange(row);
                if (!range) {
                    continue;
                }
                let rowVal = parseInt(range[0], 10);
                let emptyRowsBefore = rowVal - 1 - lastRowVal;

                if (emptyRowsBefore > 0 && this.isValidRowNumber(row, rowVal)) {
                    this.insertEmptyRows(emptyRowsBefore, row, lastRowVal + 1);
                }

                if (range.length === 2) {
                    rowSpanCollection.push(row);
                }
                lastRowVal = range.length === 2 ? range[1] : range[0];
                lastRowVal = parseInt(lastRowVal, 10);
                lastRow = row;
            }
        }

        if (!activeWindowRecord) { // Complete rows to set the height of the top-record
            if (lastRow) {
                const parent = lastRow.parentElement;

                for (let i = lastRowVal; i < DDS_FILE_LINES; i++) {
                    parent.appendChild(this.createEmptyDivGridRowStyle(i + 1));
                }
            }
        }
        // else
        //    Note: For Page with active WINDOW, this is done later in page - setMainSizeToImageSize()

        rowSpanCollection.forEach((recordsContainer) => {
            this.completeRowSpanGridRows(recordsContainer);
            this.adjustVirtRowCol(recordsContainer);
        });
    }

    getRowRange(row) {
        const rangeVal = row.getAttribute(AsnaDataAttrName.ROW);
        if (!rangeVal) {
            return null;
        }
        const range = rangeVal.split('-');
        return range;
    }

    completeRowSpanGridRows(recordsContainer) {
        const rowRange = this.getRowRange(recordsContainer);
        if (!rowRange || rowRange.length !== 2) { return; }  // Unexpected

        const fromRow = parseInt(rowRange[0], 10);
        const toRow = parseInt(rowRange[1], 10);

        if (fromRow < 0 || toRow < fromRow) { return; }  // Unexpected

        const requestedRows = (toRow - fromRow) + 1;

        if (recordsContainer.classList.contains(CLASS_GRID_ROW_SPAN)) { // RowSpan Panel
            const cssVarRoot = document.documentElement.style;
            const a = 'var(--dds-grid-row-padding-top)';
            const b = 'calc(var(--body-font-size) * 1.1429)';
            const c = 'var(--dds-grid-row-padding-bottom)';

            recordsContainer.style.gridTemplateRows = `repeat(${requestedRows}, calc(${a} + ${b} + ${c}))`;

            const colSpanOverride = recordsContainer.getAttribute(AsnaDataAttrName.GRID_PANEL_SPAN_STYLE_COL_SPAN);
            if (colSpanOverride) {
                const colCount = parseInt(colSpanOverride);
                if (colCount > 0) {
                    recordsContainer.style.gridTemplateColumns = `repeat(${colCount}, var(--dds-grid-col-width))`;
                }
            }
            else {
                // CLASS_GRID_ROW_SPAN already has the template cols set.
            }
        }
        else {
            const rows = recordsContainer.querySelectorAll(`div[class~=${CLASS_GRID_ROW}]`);
            const emptyRows = recordsContainer.querySelectorAll(`div[class~=${CLASS_GRID_EMPTY_ROW}]`);

            const existingRows = rows.length + emptyRows.length;
            const toAddCount = requestedRows - existingRows;
            if (toAddCount > 0) {
                this.appendEmptyRows(toAddCount, recordsContainer, fromRow + existingRows)
            }
        }
    }

    adjustVirtRowCol(recordsContainer) {
        const rowRange = this.getRowRange(recordsContainer);
        if (!rowRange || rowRange.length !== 2) { return; }
        const fromRow = parseInt(rowRange[0], 10);
        const toRow = parseInt(rowRange[1], 10);

        if (fromRow < 0 || toRow < fromRow) { return; }  // Unexpected

        const rows = SubfileController.selectAllRows(recordsContainer);
        if (!rows || !rows.length) { return; }

        let vRow = fromRow;
        rows.forEach((row) => {
            if (vRow <= toRow) {
                const els = this.selectElementsWithVirtRowCol(row);
                if (els && els.length) {
                    els.forEach((el) => {
                        const rowCol = PositionCursor.parseRowCol(el.getAttribute(AsnaDataAttrName.ROWCOL));
                        if (rowCol.row && rowCol.col) {
                            el.setAttribute(AsnaDataAttrName.ROWCOL, `${vRow},${rowCol.col}`);
                        }
                    });
                }
            }
            vRow++;
        });
    }

    selectElementsWithVirtRowCol(row) {
        return row.querySelectorAll(`*[${AsnaDataAttrName.ROWCOL}]:not([${AsnaDataAttrName.ROWCOL}="])`);
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

    findDirectDescendantRecords(main) {
        let result = [];
        const children = main.children;
        for (let i = 0, l = children.length; i < l; i++) {
            const child = children[i];
            if (child.getAttribute(`${AsnaDataAttrName.RECORD}`)) {
                result.push(child);
            }
        }
        return result;
    }

    findRows(parentRecord) {
        const all = parentRecord.querySelectorAll(`div[${AsnaDataAttrName.ROW}]`);
        if (!all || !all.length) {
            return null;
        }

        return all;
    }

    moveRecordsToPopup(form, winPopup) {
        const mainEl = form.querySelector(MAIN_SELECTOR);
        if (!mainEl) { return; }

        const popupRecordContainer = winPopup.querySelector(`.${CLASS_WINDOW_POPUP_RECORD_CONTAINER}`);
        if (!popupRecordContainer) { return; }

        const records = this.findDirectDescendantRecords(mainEl);
        if (!records) { return; }

        for (let i = 0, l = records.length; i < l; i++) {
            const record = records[0];
            const parent = record.parentElement;
            parent.removeChild(record);
            popupRecordContainer.appendChild(record);
        }
    }

    isValidRowNumber(row, rowNumber) {
        let rangeConstraint = null;
        let parent = row.parentElement;
        while (parent) {
            if (parent.getAttribute(AsnaDataAttrName.RECORD)) {
                break;
            }

            const parentRange = this.getRowRange(parent);
            if (parentRange && parentRange.length === 2) {
                rangeConstraint = parentRange;
                break;
            }
            parent = parent.parentElement;
        }
        if (!rangeConstraint) {
            return true; // row not nested, assume valid.
        }
        const fromRow = parseInt(rangeConstraint[0], 10);
        const toRow = parseInt(rangeConstraint[1], 10);

        if (toRow <= fromRow) {
            return true; // Unexpected range, assume valid.
        }

        return rowNumber >= fromRow && rowNumber <= toRow;
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
        if (!maxCol || isNaN(maxCol)) {
            return;
        }

        if (maxCol > 0) {
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
            const el = elementsInlineStyle[i];
            if (!el.style) {
                continue;
            }

            const gridStartEnd = this.getGridColStartEnd(el);
            if (gridStartEnd && gridStartEnd.end && !isNaN(gridStartEnd.end)) {
                maxCol = Math.max(maxCol, gridStartEnd.end);
            }
        }

        return maxCol;
    }

    getGridColStartEnd(el) {
        const SPAN_ = 'span ';
        const colStart = el.style.gridColumnStart;
        let start = NaN, end = NaN;

        if (colStart) {
            start = parseInt(colStart);
            const colEnd = el.style.gridColumnEnd;
            if (colEnd) {
                if (colEnd.startsWith && colEnd.startsWith(SPAN_)) {
                    if (!isNaN(start)) {
                        end = start + parseInt(colEnd.substring(SPAN_.length));
                    }
                }
                else
                    end = parseInt(colEnd);
            }
        }
        return { start: start, end: end };
    }


    findRowSpanDiv(sflCtrlName, sflCtl) {
        if (!sflCtl) {
            sflCtl = document.querySelector(`[${AsnaDataAttrName.RECORD}="${sflCtrlName}"]`);
        }

        if (!sflCtl) {
            return null;
        }

        let sfl = null;
        const slfCtlRows = this.findRows(sflCtl);

        for (let row of slfCtlRows) {
            const rowRange = this.getRowRange(row);
            if (rowRange && rowRange.length === 2 ) {
                sfl = row;
                break;
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

    calcRowHeight(parentEl) {
        const sampleEl = document.createElement("div");
        sampleEl.className = CLASS_GRID_EMPTY_ROW;
        const newChild = parentEl.appendChild(sampleEl);
        const cssStyle = window.getComputedStyle(sampleEl, null);
        const paddigTop = parseFloat(cssStyle['padding-top']); // parseFloat to remove 'px'
        const paddigBottom = parseFloat(cssStyle['padding-bottom']);
        const minHeight = parseFloat(cssStyle['min-height']);
        parentEl.removeChild(newChild);

        return paddigTop + minHeight + paddigBottom;
    }

    calcColWidth(parentEl) {
        const divRow = this.createDivGridRowStyle('1');
        const cell = this.createSpanGridStyle(1);
        divRow.appendChild(cell);

        const newChild = parentEl.appendChild(divRow);
        const rect = cell.getBoundingClientRect();
        parentEl.removeChild(newChild);

        return rect.width;
    }
}

const theDdsGrid = new DdsGrid;


