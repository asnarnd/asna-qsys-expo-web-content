/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theFeedbackArea as FeedbackArea };

import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { Subfile } from '../js/subfile-paging/dom-init.js';

const FEEDBACK_HIDDEN_FIELD_NAME = {
    pushedKey: '__PushedKey__',
    atCursorLocation: '__atCursorLocation__',
    atRowCol: '__atRowCol__',

    // Subfile
    atSflCursorRrn: '__atSflRRN__',

    // Window
    activeWindowTopLeft: '__activeWindowTopLeft__'
}

class FeedbackArea {

    updatePushedKey(aidKey, form) {
        FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.pushedKey, aidKey);
    }

    updateRowColFeedback(form, virtualRowCol) {
        if (form) { // Clear the last value ...
            FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atRowCol, rowcol);
        }
    }

    updateElementFeedback(form, el, activeWinSpecs, sflCursorRrn) {
        if (form) { // Clear the last value ...
            FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atCursorLocation, '');
            FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atRowCol, '');
            FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.activeWindowTopLeft, '');
        }

        if (!form || !el || !el.name) {
            return;
        }

        this.updateElementCursorLocation(form, el);

        let rowcol = el.getAttribute(AsnaDataAttrName.ROWCOL);
        if (rowcol) {
            FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atRowCol, rowcol);
        }

        if (activeWinSpecs && typeof activeWinSpecs.top !== 'undefined' && typeof activeWinSpecs.left !== 'undefined') {
            FeedbackArea.setHiddenFieldValue(form,
                FEEDBACK_HIDDEN_FIELD_NAME.activeWindowTopLeft, `${activeWinSpecs.top},${activeWinSpecs.left}`);
        }

        if (sflCursorRrn >= 0) {
            FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atSflCursorRrn, sflCursorRrn);
        }
    }

    updateElementCursorLocation(form, el) {
        let modelName = el.name;
        let alias = el.getAttribute(AsnaDataAttrName.ALIAS);
        const dot = modelName.indexOf('.');

        if (dot < 0) {
            if (alias) {
                modelName = alias;
            }
            modelName = `${this.findRecordAncestorName(el)}.${modelName}`;
        }
        else if (alias) {
            let record = modelName.substring(0, dot);
            modelName = `${record}.${alias}`;
        }

        FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atCursorLocation, modelName);
    }

    findRecordAncestorName(el) {
        const recAncestor = el.closest(`div[${AsnaDataAttrName.RECORD}]`);
        if (recAncestor) {
            const recName = recAncestor.getAttribute(AsnaDataAttrName.RECORD);
            if (recName)
                return recName;
        }

        return '?';
    }

    getElementAtCursor(form) {
        const input = form[FEEDBACK_HIDDEN_FIELD_NAME.atCursorLocation];
        if (!input) { return null; }

        return form[input.value];
    }

    updateSubfileCursorRrn(element) {
        const subfileName = Subfile.getSubfileName(element);
        if (subfileName) {
            FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atSflCursorRrn, Subfile.getRrn(element));
        }
    }

    updateSubfileCursorRrnFromRow(row) {
        const input_RecordNumber = this.getHiddenInputRowRecNumber(row);
        if (input_RecordNumber) {
            const val = input_RecordNumber.getAttribute('value');
            FeedbackArea.setHiddenFieldValue(input_RecordNumber.form, FEEDBACK_HIDDEN_FIELD_NAME.atSflCursorRrn, val);
            return val;
        }
        return null;
    }

    updateSubfileCursorLocation(row) {
        const inputsInRow = row.querySelectorAll('input,select,textarea:not([type="hidden"])');
        if (inputsInRow.length > 0) {
            const firstInput = inputsInRow[0];
            this.updateElementCursorLocation(firstInput.form, firstInput);
            return;
        }
        const input_RecordNumber = this.getHiddenInputRowRecNumber(row);
        if (input_RecordNumber) { // Expected to be found.
            const form = input_RecordNumber.form;
            FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atCursorLocation, '');
            const noFieldNamespace = input_RecordNumber.getAttribute('name');
            if (noFieldNamespace) {
                const lastIndex = noFieldNamespace.lastIndexOf('.'); // index of '._RecordNumber'
                if (lastIndex > 0) {
                    const noFieldCursorLoc = noFieldNamespace.substring(0, lastIndex);
                    FeedbackArea.setHiddenFieldValue(form, FEEDBACK_HIDDEN_FIELD_NAME.atCursorLocation, noFieldCursorLoc);
                }
            }
        }
    }

    getHiddenInputRowRecNumber(row) {
        let parent = row;
        if (row.tagName !== 'TR') { // Normal subfile.
            parent = row.parentElement;
        }
        const siblingHidden = parent.querySelectorAll('input[type="hidden"][name][value]')
        for (let i = 0, l = siblingHidden.length; i < l; i++) {
            const input = siblingHidden[i];
            if (input.getAttribute('name').endsWith('._RecordNumber')) {
                return input;
            }
        }
        return null;
    }

    static setHiddenFieldValue(form, inputName, value) {
        if (form[inputName]) {
            form[inputName].value = value;
        }
    }
}

const theFeedbackArea = new FeedbackArea();

