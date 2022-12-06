/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { TerminalRender };

import { Screen, ScreenAttr, Field  } from './terminal-screen.js';
import { BufferMapping } from './buffer-mapping.js'
import { CHAR_MEASURE, TerminalDOM } from './terminal-dom.js';
import { StringExt } from '../string.js';

// const _debug = true; // Comment line for production !!!

class TerminalRender {
    constructor(termLayout, termColors, preFontFamily, regScr, dataSet, term5250ParentElement) {
        this.termLayout = termLayout;
        this.termColors = termColors;
        this.preFontFamily = preFontFamily;
        this.regScr = regScr;
        this.dataSet = dataSet;
        this.term5250ParentElement = term5250ParentElement;
    }

    render() {
        const fragment = document.createDocumentFragment();
        let state = 'no section';
        let ch = '\0';
        let n = 0;
        let attr = new ScreenAttr('g', false, false, false, false, false);
        const validLength = this.termLayout._5250.rows * this.termLayout._5250.cols;
        let elRowCol = [];
        let pos;

        for (pos = 0; pos < validLength; pos++) {
            let newState = this.getCanvasSectState(ch, attr, this.regScr.buffer[pos], this.regScr.attrMap[pos].screenAttr, state);

            if (newState === 'no section') {
                if (n > 0) {
                    this.createCanvasSectGroup(fragment, pos - n, pos - 1, elRowCol);
                }
                n = 0;
                state = newState;
            }
            else if (newState === 'switch attr') {
                if (n > 0) {
                    this.createCanvasSectGroup(fragment, pos - n, pos - 1, elRowCol);
                }
                n = 0;
                state = 'count same attr';
            }
            else if (newState === 'count same attr') {
                n = n + 1;
                state = newState;
            }

            ch = this.regScr.buffer[pos];
            attr = this.regScr.attrMap[pos].screenAttr;
        }

        if (n > 0) {
            this.createCanvasSectGroup(fragment, pos - n, pos - 1, elRowCol);
        }

        this.completeEmptyFieldCanvasSections(fragment, elRowCol);

        this.term5250ParentElement.appendChild(fragment);
    }

    getCanvasSectState(ch, attr, newCh, newAttr, currentState) {
        const chChanged = ch !== newCh;
        const attrChanged = !this.isEqualAttr(attr, newAttr);

        if (currentState === 'count same attr' && attrChanged) {
            if (newCh === '\0' && this.isNormalAttr(newAttr)) {
                return 'no section';
            }
            return 'switch attr';
        }

        if (chChanged && newCh === '\0' && this.isNormalAttr(newAttr)) {
            return 'no section';
        }
        else if (chChanged && !attrChanged) {
            return 'count same attr';
        }
        else if (!chChanged && attrChanged) {
            if (currentState === 'count same attr') {
                if (this.isNormalAttr(newAttr)) {
                    return 'no section';
                }
                return 'switch attr';
            }

            return 'count same attr';
        }
        else if (chChanged) { // && attrChanged
            return 'count same attr';
        }

        return currentState;
    }

    createCanvasSection(frag, regScr, fromPos, toPos, row, col, bkColor, color, reverse, underscore) {

        const len = toPos - fromPos + 1;
        const text = Screen.copyPositionsFromBuffer(regScr, fromPos, toPos);
        const rowStr = '' + row;
        const colStr = '' + col;
        const vertPadding = TerminalRender.calcTextVertPadding(this.termLayout);
        const section = document.createElement('div');

        section.type = 'text';
        section.id = 'r' + StringExt.padLeft(rowStr, 2, '0') + 'c' + StringExt.padLeft(colStr, 3, '0');
        section.style.fontFamily = this.preFontFamily;
        section.style.fontSize = this.termLayout._5250.fontSizePix + 'px';
        section.style.position = 'absolute';
        section.style.left = (col * this.termLayout._5250.cursor.w) + 'px';
        section.style.top = (this.termLayout._5250.t + (row * this.termLayout._5250.cursor.h)) + 'px';
        section.style.width = (this.termLayout._5250.cursor.w * len) + 'px';
        section.style.height = (this.termLayout._5250.cursor.h - vertPadding + CHAR_MEASURE.UNDERSCORE_CHAR_HEIGHT) + 'px';
        section.setAttribute('data-asna-len', len);

        TerminalDOM.makeUnselectable(section);
        TerminalDOM.resetBoxStyle(section.style);

        section.style.overflow = 'hidden';
        section.style.paddingTop = vertPadding + 'px';
        section.style.borderBottomWidth = CHAR_MEASURE.UNDERLINE_HEIGHT + 'px';

        this.setCanvasSectionText(section, text, bkColor, color, reverse, underscore, section.id === 'r19c006'); // Instrument for automated testing

        frag.appendChild(section);
    }

    createCanvasSectGroup(frag, fromPos, toPos, elRowCol) {
        let len = toPos - fromPos + 1;
        const attr = this.regScr.attrMap[fromPos].screenAttr;

        if (attr.nonDisplay) {
            return;
        }

        const map = new BufferMapping(this.termLayout._5250.cols);

        let row = map.rowFromPos(fromPos);
        let col = map.colFromPos(fromPos);

        if (this.regScr.attrMap[fromPos].usage !== 'o') {
            const inputField = this.regScr.attrMap[fromPos].field;
            if (inputField && len < inputField.len) { // There is an input field at that position, adjust the length (i.e. field may have '\0', and getCanvasSectState logic may have detemined len of 1)
                len = inputField.len;
                toPos = fromPos + len - 1;
            }
        }

        if (col + len <= this.termLayout._5250.cols) {
            elRowCol.push({ row: row, col: col });
            this.createCanvasSection(frag, this.regScr, fromPos, toPos, row, col, 'bkgd', attr.color, attr.reverse, attr.underscore); // No blink nor colSep
            return;
        }
        else {
            const temp = len;
            len = this.termLayout._5250.cols - col;
            let remLen = temp - len;

            while (len > 0) {
                toPos = fromPos + len - 1;
                elRowCol.push({ row: row, col: col });
                this.createCanvasSection(frag, this.regScr, fromPos, toPos, row, col, 'bkgd', attr.color, attr.reverse, attr.underscore); // No blink nor colSep            

                fromPos = fromPos + len;
                col = 0;
                row = row + 1;

                len = Math.min(this.termLayout._5250.cols, remLen);
                remLen = remLen - len;
            }
        }
    }

    setCanvasSectionText(section, text, bkColor, color, reverse, underscore, instTesting) {
        if (!reverse) {
            if (bkColor !== 'bkgd') {
                section.style.backgroundColor = this.getWebColor(bkColor);
            }
            section.style.color = this.getWebColor(color);
        }
        else {

            if (color !== 'bkgd') {
                section.style.backgroundColor = this.getWebColor(color);
            }
            section.style.color = this.getWebColor(bkColor);
        }

        if (underscore) {
            section.style.borderBottomStyle = 'groove'; // IE ignores, uses 'solid' but Firefox/Chrome use a 3D effect.
            section.style.borderBottomColor = section.style.color;
        }
        else {
            section.style.borderBottomWidth = '0px';
        }

        TerminalRender.setDivText(section, text, this.preFontFamily, instTesting);
    }

    completeEmptyFieldCanvasSections (frag, elRowCol) {
        let missing = [];
        const formatTable = this.dataSet.formatTable;
        if (!formatTable) { return; }

        for (let i = 0; i < this.dataSet.fieldCount; i++) {
            const fld = formatTable[i];
            let found = false;
            for (let j = 0, l = elRowCol.length; j < l; j++) {
                var rowCol = elRowCol[j];
                if (fld.row === rowCol.row && fld.col === rowCol.col) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                missing.push({ row: fld.row, col: fld.col });
            }
        }
        if (!missing.length) {
            return;
        }

        const map = new BufferMapping(this.termLayout._5250.cols);

        for (let i = 0, l = missing.length; i < l; i++) {
            const rowCol = missing[i];
            const pos = map.coordToPos(rowCol.row, rowCol.col);
            const fld = TerminalRender.lookupFieldWithPosition(pos, this.termLayout, this.dataSet);
            if (!fld) { continue; /* should never happen */ }
            this.createCanvasSectGroup(frag, pos, pos + fld.len - 1, []);
        }
    }

    renderInputCanvasSections(termSectionsParent, fromPos, toPos) {
        let fromFld = TerminalRender.lookupFieldWithPosition(fromPos, this.termLayout, this.dataSet);
        const toField = TerminalRender.lookupFieldWithPosition(toPos, this.termLayout, this.dataSet);

        while (!fromFld && fromPos < toPos) {
            fromPos = fromPos + 1;
            fromFld = TerminalRender.lookupFieldWithPosition(fromPos, this.termLayout, this.dataSet);
        }

        if (!fromFld) {
            return;
        }

        let dirtyInputSections = [];

        const fromRow = fromFld.row;
        const numRows = (((fromFld.col + fromFld.len) / this.termLayout._5250.cols) >> 0) + 1;

        if (toField !== fromFld) {
            while (!toField && toField !== fromFld && toPos > fromPos) {
                toPos = toPos - 1;
                toField = lookupFieldWithPosition(toPos);
            }
            if (toField) {
                numRows = (((toField.col + toField.len) / termLayout._5250.cols) >> 0) + 1;
                numRows = (toField.row - fromFld.row) + numRows;
            }
        }

        const toRow = fromRow + (numRows - 1);

        // Collect input canvas sections whose rows are in the range of rows requested.
        // Note: one 5250 field may be broken-down in more than one canvas sections (virtual fields).
        let childNode;
        for (let index = 0; (childNode=termSectionsParent.childNodes[index])!=null; index++) {
            if (childNode.tagName === 'DIV' && childNode.getAttribute('data-asna-len')) {
                const virtField = TerminalRender.parseCanvasSectionId(childNode);

                if (virtField.row >= fromRow && virtField.row <= toRow && Screen.isRowColInInputPos(this.regScr, virtField.row, virtField.col)) {
                    dirtyInputSections[dirtyInputSections.length] = childNode;
                }
            }
        }

        // Refresh the text, by getting content from regeneration buffer.
        // Note: unfortunately, some of the attributes are part of the HTML text, such as underline.
        for (let index = 0; index < dirtyInputSections.length; index++) {
            const virtField = TerminalRender.parseCanvasSectionId(dirtyInputSections[index]);

            const sectStartPos = this.regScr.coordToPos(virtField.row, virtField.col);

            const color = this.regScr.attrMap[sectStartPos].screenAttr.color;
            const reverse = this.regScr.attrMap[sectStartPos].screenAttr.reverse;
            const underscore = this.regScr.attrMap[sectStartPos].screenAttr.underscore;
            const nonDisplay = this.regScr.attrMap[sectStartPos].screenAttr.nonDisp;

            if (nonDisplay) { // This should not happen. We do not create 'non-display' canvas sections.
                continue;
            }

            const text = Screen.copyPositionsFromBuffer(this.regScr, sectStartPos, sectStartPos + virtField.len);
            this.setCanvasSectionText(dirtyInputSections[index], text, 'bkgd', color, reverse, underscore, virtField.row === 19 && virtField.col === 6); // Instrument for automated testing
        }
    }

    renderFieldFromCursorPos(row, col) {
        const fromPos = this.regScr.coordToPos(row, col);
        const eofRowCol = this.regScr.peekEndOfFieldPos(fromPos);

        if (!eofRowCol) {
            return;
        }

        const toPos = this.regScr.coordToPos(eofRowCol.row, eofRowCol.col);

        if (fromPos <= toPos) {
            this.renderInputArea(fromPos, toPos);
        }
    }

    renderInputArea(fromPos, toPos) {
        this.renderInputCanvasSections(this.term5250ParentElement, fromPos, toPos);
    }

    isEqualAttr(attr, newAttr) {
        if (!attr && newAttr || attr && !newAttr) {
            return false;
        }
        return attr.color === newAttr.color &&
            attr.reverse === newAttr.reverse &&
            attr.underscore === newAttr.underscore &&
            attr.blink === newAttr.blink &&
            attr.nonDisp === newAttr.nonDisp &&
            attr.colSep === newAttr.colSep;
    }

    isNormalAttr(attr) {
        return attr && attr.color === 'g' && !attr.reverse && !attr.underscore && !attr.blink && !attr.nonDisp && !attr.colSep;
    }

    getWebColor(c) {
        if (c === 'g') {
            return this.termColors.green;
        }
        if (c === 'b') {
            return this.termColors.blue;
        }
        if (c === 'r') {
            return this.termColors.red;
        }
        if (c === 'w') {
            return this.termColors.white;
        }
        if (c === 't') {
            return this.termColors.turquoise;
        }
        if (c === 'y') {
            return this.termColors.yellow;
        }
        if (c === 'p') {
            return this.termColors.pink;
        }
        if (c === 'bkgd') {
            return this.termColors.bkgd;
        }

        return this.termColors.green; // i.e.  Non-display
    }

    static parseCanvasSectionId(node) {
        return new Field(
            parseInt(node.id.substring(1), 10),   // skip 'r'            
            parseInt(node.id.substring(4), 10),   // skip 'rnnc'
            parseInt(node.getAttribute('data-asna-len'), 10)
        );
    }

    static calcTextVertPadding(termLayout) {
        const rowLeadHeight = termLayout._5250.cursor.h - CHAR_MEASURE.UNDERLINE_HEIGHT - CHAR_MEASURE.UNDERSCORE_CHAR_HEIGHT;

        if (rowLeadHeight > termLayout._5250.fontSizePix) {
            return rowLeadHeight - termLayout._5250.fontSizePix;
        }

        return 0;
    }

    static setDivText(divEl, text, preFontFamily, instTesting) {
        const pre = document.createElement('pre');
        if (instTesting) {
            pre.id = 'cl'; // instrument command-line ID for automation-testing
        }
        pre.style.margin = '0px';
        pre.style.padding = '0px';
        pre.style.border = '0px';
        pre.style.fontFamily = preFontFamily;
        pre.textContent = text; // No need to escape 'pre' elements

        divEl.innerHTML = '';
        divEl.appendChild(pre);
    }

    static lookupFieldWithPosition(pos, termLayout, dataSet) {
        const map = new BufferMapping(termLayout._5250.cols);
        const formatTable = dataSet.formatTable;

        if (!formatTable) {
            return null;
        }

        for (let i = 0; i < dataSet.fieldCount; i++) {
            const candidateField = formatTable[i];
            const fromPos = map.coordToPos(candidateField.row, candidateField.col);
            const toPos = fromPos + candidateField.len;

            if (pos >= fromPos && pos <= toPos) {
                return candidateField;
            }
        }

        return null;
    }

    static htmlEscape(text) {
        const findReplace = [
            [/&/g, "&amp;"],
            [/</g, "&lt;"],
            [/>/g, "&gt;"],
            [/"/g, "&quot;"]
        ];

        let before, after;
        if (typeof _debug !== 'undefined') {
            before = text.length;
        }

        for (var item in findReplace) {
            text = text.replace(findReplace[item][0], findReplace[item][1]);
        }

        if (typeof _debug !== 'undefined') {
            after = text.length;

            if (before !== after) {
                console.log(`Text was escaped! ${before} -> ${after}`);
            }
        }

        return text;
    }

    static clearCanvas(term5250ParentElement) {
        if (!term5250ParentElement) {
            console.log('TerminalRender.clearCanvas error!');
            return;
        }

        let regenBufferSections = [];

        for (let index = 0; term5250ParentElement.childNodes[index]; index++) {
            const childNode = term5250ParentElement.childNodes[index];
            if (childNode.tagName === 'DIV' && childNode.getAttribute('data-asna-len')) {
                regenBufferSections[regenBufferSections.length] = childNode;
            }
        }

        while (regenBufferSections.length > 0) {
            term5250ParentElement.removeChild(regenBufferSections[regenBufferSections.length - 1]);
            regenBufferSections.length = regenBufferSections.length - 1;
        }

        regenBufferSections = []; // Force garbage collector
    }

    static is5250TextElement(term5250ParentElement, candidate) {
        if (!candidate || candidate.tagName.toUpperCase() !== 'PRE') {
            return false;
        }
        const divCandidate = candidate.parentElement;
        if (!divCandidate || divCandidate.tagName.toUpperCase() !== 'DIV') {
            return false;
        }
        return divCandidate.parentElement === term5250ParentElement;
    }

}

