/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { SubfileController, Subfile };

import { SubfilePagingStore, SubfileState, InputState } from './paging-store.js';
import { PositionCursor } from '../page-position-cursor.js';
import { DdsGrid } from '../dds-grid.js';
import { Base64 } from '../base-64.js';
import { AsnaDataAttrName } from '../asna-data-attr.js';
import { FeedbackArea } from '../feedback-area.js';
import { DdsWindow } from '../dds-window.js';

const HIDDEN_NAME_FOLD_LINES_PER_RECORD = 'fold-lines-per-record';

const EXPO_CLASS = {
    GRID_ROW: 'dds-grid-row',
    GRID_EMPTY_ROW: 'dds-grid-empty-row',
    GRID_ROW_NO_GAP: 'dds-row-no-gap',
    GRID_ROW_SPAN: 'dds-grid-row-span'
};

const EXPO_SUBFILE_CLASS = {
    CANDIDATE_CURRENT_RECORD: 'dds-subfile-candidate-current-record',
    CURRENT_RECORD: 'dds-subfile-current-record'
};

const ICON_NAME_MORE = 'download';
const ICON_NAME_NO_MORE = 'ban-circle';

class SubfileController {

    static init(mainDiv) {
        let sflIcons = [];
        if (mainDiv) {
            const elements = mainDiv.querySelectorAll(`div[${AsnaDataAttrName.SFLC}]`);

            for (let i = 0, l = elements.length; i < l; i++) {
                const sflcDiv = elements[i];

                const initEncodedData = sflcDiv.getAttribute(AsnaDataAttrName.SFLC);

                if (initEncodedData) {
                    try {
                        const encInitData = Base64.decode(initEncodedData);
                        const initData = JSON.parse(encInitData);
                        const sflCtrlStore = SubfilePagingStore.register(initData);
                        if (!SubfileController.hasNestedSflController(sflcDiv)) {
                            const recordsContainer = DdsGrid.findRowSpanDiv(initData.name, sflcDiv);

                            if (recordsContainer) {
                                sflCtrlStore.initialPageState = SubfileState.rememberPageState(recordsContainer);
                                const withGridCol = SubfileController.selectAllWithGridColumns(recordsContainer);
                                const sflColRange = SubfileController.calcSflMinMaxColRange(withGridCol);

                                SubfileController.addMouseCueEvents(recordsContainer, initData.inputBehaviour);
                                SubfileController.removeRowGap(recordsContainer);
                                sflCtrlStore.fldDrop.foldLinesPerRecord = SubfileController.querySubfileFoldLinesPerRecord(recordsContainer);

                                if (sflCtrlStore.sflEnd.showSubfileEnd) {
                                    const isAtBottom = sflCtrlStore.sflEnd.isSufileEnd;
                                    const icon = SubfileController.addSubfileEndCue(
                                        recordsContainer,
                                        isAtBottom,
                                        isAtBottom ? sflCtrlStore.sflEnd.textOn : sflCtrlStore.sflEnd.textOff,
                                        sflColRange
                                    );
                                    if (icon && icon.el && icon.iconParms && icon.iconParms.title) {
                                        sflIcons.push(icon);
                                    }
                                }
                            }
                        }
                    }
                    catch (syntaxErr) {
                        console.warn(syntaxErr.message);
                    }

                    sflcDiv.removeAttribute(AsnaDataAttrName.SFLC);
                }
            }
        }

        return sflIcons;
    }

    static selectAllWithGridColumns(recordsContainer) {
        const withGridColList = recordsContainer.querySelectorAll('[style*="grid-column"]');
        const withGridAreaList = recordsContainer.querySelectorAll('[style*="grid-area"]');
        let result = [];

        withGridColList.forEach(el => result.push(el));
        withGridAreaList.forEach(el => result.push(el));

        return result;
    }

    static calcSflMinMaxColRange(withGridCol) {
        let minCol = 999;
        let maxCol = 1;
        for (let i = 0, l = withGridCol.length; i < l; i++) {
            const colSpan = DdsGrid.getGridColStartEnd(withGridCol[i]);
            if (!isNaN(colSpan.start)) {
                minCol = Math.min(colSpan.start, minCol);
            }

            if (!isNaN(colSpan.end)) {
                maxCol = Math.max(colSpan.end, maxCol);
            }
        }

        return maxCol > minCol ? { min: minCol, max: maxCol } : {};
    }

    static selectAllRows(recordsContainer) {
        return recordsContainer.querySelectorAll(`div[class~="${EXPO_CLASS.GRID_ROW}"], div[class~="${EXPO_CLASS.GRID_EMPTY_ROW}"]`);
    }

    static selectTableRows(recordsContainer) { // Note excludes table headers (th)
        const nonHeaderTd = recordsContainer.querySelectorAll('tr td');
        if (nonHeaderTd.length == 0) { return nonHeaderTd; }

        let result = [];

        for (let i = 0, l = nonHeaderTd.length; i < l; i++) {
            const td = nonHeaderTd[i];
            const tr = td.parentElement;
            if (tr && !result.find((e) => e === tr)) {
                result.push(tr);
            }
        }
        return result;
    }

    static queryLikelyCurrentSflRecord() {
        let likely = document.querySelector(`[class~="${EXPO_SUBFILE_CLASS.CURRENT_RECORD}"]`);
        if (likely) {
            return likely;
        }

        likely = document.querySelector(`[class~="${EXPO_SUBFILE_CLASS.CANDIDATE_CURRENT_RECORD}"]`);
        if (likely) {
            return likely;
        }

        return null;
    }

    static getClosestSubfileCtrlName(el) {
        if (!el) { return ''; }

        if (el.tagName === "BODY") {
            const sflSelectedRecord = SubfileController.queryLikelyCurrentSflRecord();
            if (sflSelectedRecord) {
                el = sflSelectedRecord;
            }
            else if (window.asnaExpo.page.lastFocus) {
                el = window.asnaExpo.page.lastFocus;
            }
        }

        const row = el.closest(`[${AsnaDataAttrName.ROW}]`);
        if (!row) { return ''; }

        const record = row.closest(`[${AsnaDataAttrName.RECORD}]`);
        if (!record) { return ''; }

        const recordName = record.getAttribute(AsnaDataAttrName.RECORD);
        if (!recordName) { return ''; }

        const store = SubfilePagingStore.getSflCtlStore(recordName);
        if (store) {
            return store.name;
        }
        return '';
    }

    static getFirstSubfileCtrlName() {
        const sflCtrlNames = SubfilePagingStore.getSflCtlStoreNames();
        if (sflCtrlNames && sflCtrlNames.length) {
            return sflCtrlNames[0];
        }
        return null;
    }

    static addMouseCueEvents(recordsContainer, inputBehaviour) {
        if (!inputBehaviour || !inputBehaviour.dblClick && !inputBehaviour.clickSetsCurrentRecord ) {
            return false;
        }

        const rows = SubfileController.selectAllRowsIncludeTR(recordsContainer);

        for (let i = 0, l = rows.length; i < l; i++) {
            const row = rows[i];

            if (inputBehaviour.cueCurrentRecord) {
                row.addEventListener('mouseout', () => {
                    row.classList.remove(EXPO_SUBFILE_CLASS.CANDIDATE_CURRENT_RECORD);
                    // SubfileController.hideIconsInRow(row);
                });
                row.addEventListener('mouseover', () => {
                    row.classList.add(EXPO_SUBFILE_CLASS.CANDIDATE_CURRENT_RECORD);
                    // SubfileController.showIconsInRow(row);
                });

                // SubfileController.hideIconsInRow(row);
            }

            const cueCurrentRecord = inputBehaviour.clickSetsCurrentRecord
            row.addEventListener('click', () => {
                SubfileController.setCurrentSelection(recordsContainer, row, cueCurrentRecord);
                PositionCursor.toFirstInputInSubfileRow(row);
            });

            if (inputBehaviour.dblClick.aidKey || inputBehaviour.dblClick.targetField) {
                row.addEventListener('dblclick', () => {
                    SubfileController.executeDblClick(row, inputBehaviour.dblClick.targetField, inputBehaviour.dblClick.targetValue, inputBehaviour.dblClick.aidKey);
                });
            }
        }

        return true;
    }

    static selectAllRowsIncludeTR(recordsContainer) {
        const gridRows = SubfileController.selectAllRows(recordsContainer);
        let gridTableRows = [];

        if (recordsContainer.classList.contains(EXPO_CLASS.GRID_ROW_SPAN)) {
            gridTableRows = SubfileController.selectTableRows(recordsContainer);
        }

        let rows = [...gridRows, ...gridTableRows];
        return rows;
    }

    static removeRowGap(recordsContainer) {
        const gridRows = SubfileController.selectAllRows(recordsContainer);
        gridRows.forEach((row) => { row.classList.add(EXPO_CLASS.GRID_ROW_NO_GAP); });
    }

    static querySubfileFoldLinesPerRecord(recordsContainer) {
        const hiddenElements = recordsContainer.querySelectorAll(`input[type="hidden"][name="${HIDDEN_NAME_FOLD_LINES_PER_RECORD}"]`);
        if (!hiddenElements || hiddenElements.length === 0) { return 1; }
        return hiddenElements[0].value; 
    }

    static setCurrentSelection(recordsContainer, row, cueCurrentRecord) {
        if (cueCurrentRecord) {
            const rows = SubfileController.selectAllRowsIncludeTR(recordsContainer);

            for (let i = 0, l = rows.length; i < l; i++) {
                rows[i].classList.remove(EXPO_SUBFILE_CLASS.CURRENT_RECORD);
            }

            row.classList.add(EXPO_SUBFILE_CLASS.CURRENT_RECORD);
        }

        if (FeedbackArea.updateSubfileCursorRrnFromRow(row)) {
            FeedbackArea.updateSubfileCursorLocation(row);
        }
        // Subfile.setMousePos(row, lastMousePos); TO-DO
    }

    static addSubfileEndCue(recordsContainer, isAtBottom, tooltipText, sflColRange) {
        let iconName = isAtBottom ? ICON_NAME_NO_MORE : ICON_NAME_MORE;

        const iconRow = document.createElement('div');
        iconRow.className = `${EXPO_CLASS.GRID_ROW} ${EXPO_CLASS.GRID_ROW_NO_GAP}`;
        const span = document.createElement('span');
        span.className = 'dds-cells-suitable-for-icons';
        span.classList.add(isAtBottom ? 'sflend-bottom':'sflend-more');

        if (sflColRange.max && sflColRange.min && sflColRange.max > sflColRange.min) {
            span.style.gridArea = `1 / ${(sflColRange.max - sflColRange.min)-1} / auto`;
        }

        span.style.gridRow = '1';
        iconRow.appendChild(span);
        recordsContainer.appendChild(iconRow);

        if (!isAtBottom) {
            span.addEventListener('click', () => { window.asnaExpo.page.pushKey("PgDn") });
        }

        return { el: span, iconParms: { awesomeFontId: iconName, color: '*class', title: tooltipText ? tooltipText: '' } };
    }

    static executeDblClick(row, targetField, targetValue, aidKey) {
        if (!targetField) { return; }
        
        const fieldsInRow = row.querySelectorAll('[name]');
        let field = null;
        let fieldName = '';
        const re = new RegExp(targetField, 'gi');

        for (let i = 0, il = fieldsInRow.length; i < il; i++) {
            const name = fieldsInRow[i].getAttribute('name');
            if (!name) { continue; }
            if (re.exec(name)) {
                field = fieldsInRow[i];
                fieldName = name;
                break;
            }
        }

        if (field && typeof field.value !== 'undefined') {
            if (targetValue) {
                field.value = targetValue;
            }
            if (field.type === 'checkbox' && el.value === el.defaultValue) {
                field.checked = true;
            }
            if (typeof field.focus === 'function') {
                field.focus();
            }
        }

        if (aidKey) {
            window.asnaExpo.page.pushKey(aidKey, fieldName, targetValue);
        }
    }

    static hideIconsInRow(row) {
        const svgInRow = row.querySelectorAll('svg');

        for (let k = 0, lk = svgInRow.length; k < lk; k++) {
            svgInRow[k].classList.add('icon-in-not-selected-row');
        }
    }

    static showIconsInRow(row) {
        const svgInRow = row.querySelectorAll('svg');

        for (let k = 0, lk = svgInRow.length; k < lk; k++) {
            svgInRow[k].classList.remove('icon-in-not-selected-row');
        }
    }

    static hasNestedSflController(sflcDiv) {
        const children = sflcDiv.children;
        for (let i = 0, l = children.length; i < l; i++ ) {
            const child = children[i];
            if (child.getAttribute(AsnaDataAttrName.SFLC)) {
                return true;
            }
        }
        return false;
    }
}

class Subfile {
    static addInputState(state, inputEl) {
        if (!inputEl.name) { return; }  

        let value = Subfile.createInputState(inputEl);
        if (value) {  // DOM elements with value property are input.
            state[inputEl.name] = value;
        }
    }

    static createInputState(inputEl) {
        let state = null;

        if (typeof inputEl.type !== 'undefined' && inputEl.type === 'checkbox') {
            state = new InputState(true, null, inputEl.checked);
        }
        else if (typeof (inputEl.value) !== 'undefined') {
            state = new InputState(false, inputEl.value);
        }

        return state;
    }

    static restoreEdit(recordsContainer, inputName, inputState) {
        if (!(inputState instanceof InputState)) { return; }

        const input = Subfile.findFieldInDOM(recordsContainer, inputName);

        if (input) {
            if (typeof input.type !== 'undefined' && input.type === 'checkbox') {
                input.checked = inputState.checked;
            }
            else if (typeof input.value !== 'undefined') {
                input.value = inputState.value;
            }
        }
    }

    static escapeName(name) {
        return name.replace(/["\\]/g, '\\$&');
    }

    static findFieldInDOM(recordsContainer, fieldname) {
        const fieldnameEscaped = Subfile.escapeName(fieldname);
        const input = recordsContainer.querySelector(`input[name="${fieldnameEscaped}"]`);
        return input;
    }

    static cloneDOM_Element(fieldName, inputState) { 
        const newInput = document.createElement('input');
        newInput.name = fieldName;

        if (inputState.isCheckbox && inputState.checked) {
            newInput.type = 'checkbox'; // Colud be 'radio' important think is that it can be 'ckecked'
            newInput.setAttribute("checked", true);

            console.log(`Created ${fieldName} checked`);
        }
        else { // Note: we don't really care about specific type, the server will get value 
            newInput.type = 'text';
            newInput.setAttribute("value", inputState.value );

            console.log(`Created ${fieldName} value:${newInput.value}`);
        }

        newInput.style.display = 'none'; // avoid disrupting view

        return newInput;
    }

    static cloneDOM_HiddenElement(fieldName, inputState) {
        const newInput = document.createElement('input');
        newInput.name = fieldName;
        newInput.type = 'hidden';

        newInput.setAttribute("value", inputState.value);
        newInput.style.display = 'none'; // avoid disrupting view

        return newInput;
    }

    static findHiddenRrn(recordsContainer, sflInputFieldName) {
        const fldNamespace = Subfile.getFieldNamespace(sflInputFieldName);
        if (!fldNamespace) {
            return -1;
        }
        return PositionCursor.findInput(recordsContainer, `${fldNamespace}._RecordNumber`, true);
    }

    static getFieldNamespace(fieldName) {
        let lastDot = fieldName.lastIndexOf(".");
        if (lastDot < 0) {
            return null;
        }
        return fieldName.substr(0, lastDot);
    }

    static makeFieldName(sflFldName, rrn) {
        const iBracket = sflFldName.indexOf('[');
        const iEndBracket = sflFldName.indexOf(']');

        if (!(iBracket >= 0 && iEndBracket > iBracket)) {
            return ''; // unexpected.
        }

        return `${sflFldName.substr(0, iBracket)}[${rrn}]${sflFldName.substr(iEndBracket + 1)}`;
    }

    static isSubfileInput(inputCandidate) {
        const name = inputCandidate.getAttribute('name');
        if (!name) {
            return false;
        }

        if (!inputCandidate.getAttribute(AsnaDataAttrName.ROWCOL)){
            return false;
        }

        if (!(inputCandidate.getAttribute('value') !== null || inputCandidate.getAttribute('checked') !== null)) {
            return false;
        }

        const parts = name.split('.');
        if (parts.length !== 3) {
            return false;
        }

        const openBracket = name.match(/\[/g);
        const closedBracket = name.match(/\]/g);

        if (!(openBracket.length === 1 && closedBracket === 1)) {
            return false;
        }

        if (typeof name.endsWidth === 'function' && !name.endsWidth(']')) {
            return false;
        }

        return true;
    }

    static getSubfileName(inputCandidate) {
        if (!Subfile.isSubfileInput(inputCandidate)) { return ''; }

        const name = inputCandidate.getAttribute('name');
        const parts = name.split('.');
        if (parts.length !== 3) {
            return '';
        }

        const eos = parts[1].indexOf('[');
        if (eos > 0) {
            return parts[1].substr(0, eos);
        }
    }
}
