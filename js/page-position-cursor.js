/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { PositionCursor };

import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { DdsGrid } from '../js/dds-grid.js';

class PositionCursor {

    static toRowCol(form, rc) {
        const rowCol = PositionCursor.parseRowCol(rc);
        if (!(rowCol.row && rowCol.col) ){ return; }

        const rowEl = PositionCursor.findRow(form, rowCol.row);
        if (!rowEl) { return; }

        const inRow = PositionCursor.gridElements(rowEl);
        let firstInput = null;
        for (let i = 0, l = inRow.length; i < l; i++) {
            const candidate = inRow[i];
            if (!PositionCursor.isInputCapable(candidate)) {
                continue;
            }
            if (!firstInput) {
                firstInput = candidate;
            }
            const virtRowColAttrVal = candidate.getAttribute(AsnaDataAttrName.ROWCOL);
            if (virtRowColAttrVal) {
                const virtRowCol = PositionCursor.parseRowCol(virtRowColAttrVal);
                if ((virtRowCol.row && virtRowCol.col) && virtRowCol.row != rowCol.row ) { continue; }
            }
            const start = parseInt(candidate.style.gridColumnStart, 10); // Note: CSS Grid start, end are "one" based.
            const end = parseInt(candidate.style.gridColumnEnd, 10);
            if (rowCol.col >= start && rowCol.col <= end) {
                const offset = rowCol.col-start;
                candidate.focus(); // Note: Page.handleOnFocusEvent will selectText (by default)
                if (offset > 0) {
                    setTimeout( () => PositionCursor.selectText(candidate, offset, offset), 1);
                }
                return;
            }
        }

        if (firstInput) { // default if col does not match
            firstInput.focus();
        }
    }

    static toDefaultField(form) {
        const inputs = document.querySelectorAll(`[${AsnaDataAttrName.POSITION_CURSOR}]`);

        if (inputs.length === 0) {
            PositionCursor.toFirstInput(form);
            return;
        }

        PositionCursor.toMarkedAsDefault(inputs);
    }

    static toMarkedAsDefault(inputs) {
        let found = false;
        for (let i = 0, l = inputs.length; i < l; i++) {
            const input = inputs[i];
            input.removeAttribute(AsnaDataAttrName.POSITION_CURSOR);

            if (!found) { // Let only one determine the cursor position.
                input.focus();
                // console.log(`PositionCursor: focus set to ${input.name}`);
                found = true;
            } // continue to remove attrMarker from all instances.
        }

        if (!found) {
            console.log('PositionCursor.toMarkedAsDefault: found no (non-hidden) input element !!!');
        }
    }

    static toFirstInput(form) {
        const inputCount = form.length;

        let found = false;
        for (let i = 0; i < inputCount; i++) {
            const input = form[i];
            if (input.type && input.type.toUpperCase() === 'HIDDEN') {
                continue;
            }
            input.focus();
            // console.log(`PositionCursor.toFirstInput: focus set to ${input.name}`);
            found = true;
            break;
        }

        if (!found) {
            // console.log('PositionCursor.toFirstInput: found no (non-hidden) input element !!!');
        }
    }

    static toFirstInputInSubfile(sflEl) {
        const inputsInSubfile = sflEl.querySelectorAll('input,select,textarea:not([type="hidden"])');
        const inputCount = inputsInSubfile.length;

        if (inputCount === 0) {
            return;
        }

        PositionCursor.toSelectorWithName(inputsInSubfile, inputCount);
    }

    static toFirstInputInSubfileRow(row) {
        const inputsInRow = row.querySelectorAll('input,select,textarea:not([type="hidden"])');
        const inputCount = inputsInRow.length;

        if (inputCount === 0) {
            return;
        }

        PositionCursor.toSelectorWithName(inputsInRow, inputCount);
    }

    static toSelectorWithName(selector, count) {
        for (let i = 0; i < count; i++) {
            const input = selector[i];
            if (!input.name) {
                continue;
            }

            input.focus();
            break;
        }
    }

    static toLastInputInSubfile(sflEl) {
        const inputsInSubfile = sflEl.querySelectorAll('input,select,textarea:not([type="hidden"])');
        const inputCount = inputsInSubfile.length;

        if (inputCount === 0) {
            return;
        }

        for (let i = inputCount-1; i >=0; i--) {
            const input = inputsInSubfile[i];
            if (!input.name) {
                continue;
            }

            input.focus();
            break;
        }
    }

    static activeFieldName() {
        return document.activeElement ? document.activeElement.name : null;
    }

    static findInput(sflEl, sflInputFieldName, includeHidden) {
        let selector = 'input,select,textarea';
        if (!includeHidden)
            selector += ':not([type="hidden"])';

        const inputsInSubfile = sflEl.querySelectorAll(selector);
        const inputCount = inputsInSubfile.length;

        if (!inputCount) {
            return null;
        }

        for (let i = 0; i < inputCount; i++) {
            const input = inputsInSubfile[i];
            if (!input.name) {
                continue;
            }

            if (input.name === sflInputFieldName) {
                return input;
            }
        }

        return null;
    }

    static isCursorAtSubfile(sflEl) {
        const fieldWithCursorName = PositionCursor.activeFieldName();
        if (!fieldWithCursorName) {
            return false;
        }

        return PositionCursor.findInput(sflEl, fieldWithCursorName) !== null;
    }

    static restoreFocus(sflEl, newFldWithCursorName, aidKey) {
        if (!newFldWithCursorName) {
            if (aidKey === 'PgDn')
                PositionCursor.toLastInputInSubfile(sflEl);
            else
                PositionCursor.toFirstInputInSubfile(sflEl);
            return;
        }

        const input = PositionCursor.findInput(sflEl, newFldWithCursorName);
        if (input) {
            input.focus();
            return;
        }

        if (aidKey === 'PgDn')
            PositionCursor.toLastInputInSubfile(sflEl);
        else
            PositionCursor.toFirstInputInSubfile(sflEl);
    }

    static removeFieldAttribute() {
        const inputs = document.querySelectorAll(`[${AsnaDataAttrName.POSITION_CURSOR}]`);

        for (let i = 0, l = inputs.length; i < l; i++) {
            inputs[i].removeAttribute(AsnaDataAttrName.POSITION_CURSOR);
        }
    }

    static findRow(form,number) {
        const records = DdsGrid.findAllRecords(form);
        if (!records) { return null; }

        for (let i = 0, l = records.length; i < l; i++) {
            const rows = DdsGrid.findRows(records[i]);

            for (let row of rows) {
                const rowVal = row.getAttribute(AsnaDataAttrName.ROW);
                if (!rowVal) {
                    continue;
                }
                let fromRow;
                let toRow;
                if (rowVal.indexOf('-') > 0) { // Subfile
                    const range = rowVal.split('-');
                    if (range.length === 2) {
                        fromRow = parseInt(range[0], 10);
                        toRow = parseInt(range[1], 10);
                    }
                }
                else {
                    fromRow = toRow = parseInt(rowVal, 10);
                }
                if (number >= fromRow && number <= toRow) {
                    return row;
                }
            }
        }

        return null;
    }

    static gridElements(parentRow) {
        const styledEls = parentRow.querySelectorAll('[style]');
        if (!styledEls) { return []; }
        const result = [];
        for (let i = 0, l = styledEls.length; i < l; i++) {
            const el = styledEls[i];
            if (el.style.gridColumn) {
                result.push(el);
            }
        }
        return result;
    }

    static isInputCapable(el) {
        if (!el) { return false; }
        const tagName = el.tagName;
        return tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA'; // Note: always uppercase.
    }

    static selectText(input, fromPos, toPos) {
        if (input.type === 'radio' || input.type === 'checkbox') { return; }
        if (input.createTextRange) {
            const range = el.createTextRange();
            range.collapse(true);
            range.moveEnd('character', fromPos);
            range.moveStart('character', toPos);
            range.select();
        }
        else if (input.setSelectionRange) { // Chrome, Firefox
            input.setSelectionRange(fromPos,toPos);
        }
    }

    static parseRowCol(rowCol) {
        let result = {};

        if (!rowCol || rowCol.indexOf(',') < 0) { return result; }

        const parts = rowCol.split(',');
        if (parts.length !== 2) { return result; }

        result.row = parseInt(parts[0], 10);
        result.col = parseInt(parts[1], 10);

        return result;
    }
}

