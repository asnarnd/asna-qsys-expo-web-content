/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { Screen, ScreenAttr, ScreenAttrEntry, RowCol, Field, FieldFormatWord, AdjustFill, ShiftEditSpec, InputArea};

/*eslint-disable*/
import { QSN_SA } from './ibm-codes.js';
import { BufferMapping } from './buffer-mapping.js';
import { Validate } from './terminal-validate.js';
import { TerminalRender } from './terminal-render.js';
/*eslint-enable*/

// const _debug = true; // Comment line for production !!!

class Screen {
    constructor(rows, cols, msgLight) {
        this.buffer = [];
        this.attrMap = [];
        this.buffer.length = this.attrMap.length = rows * cols;

        // Initial screen has zero's, all positions are output-only with green text.
        for (let pos = 0; pos < this.buffer.length; pos++) {
            this.buffer[pos] = '\0';
            this.attrMap[pos] = new ScreenAttrEntry('o', this.hexCodeToScreenAttr(QSN_SA.GRN), undefined);
        }

        this.cursorPos = {};
        this.size = { rows: rows, cols: cols, msgLight: msgLight ? msgLight : false };
        this.mapping = new BufferMapping(this.size.cols);

        if (typeof _debug !== 'undefined' ) {
            this.saveDebugState();
            this.handleDebugIntervalTimerEvent = this.handleDebugIntervalTimerEvent.bind(this);
            this.debugInterval = setInterval(this.handleDebugIntervalTimerEvent, 1000);
        }
    }

    loadBuffer(rb) {
        for (let pos = 0; pos < rb.length; pos++) { // Note: rb is a string, buffer is an array.
            this.buffer[pos] = rb.charAt(pos);
        }
    }

    static loadScreenSize(ss) {
        const values = ss.split(',');

        if (values.length < 2) {
            return null;
        }

        const rows = parseInt(values[0], 10);
        const cols = parseInt(values[1], 10);
        let msgLight = false;

        if (values.length > 2 && values[2] === 'm') {
            msgLight = true;
        }

        if (rows === 24 && cols === 80 || rows === 27 && cols === 132) {
            return { rows: rows, cols: cols, msgLight: msgLight };
        }

        return null;
    }

    setMapping(cols) {
        this.mapping = new BufferMapping(cols);
    }

    loadAttributes(a) {
        let posAttr = [];
        let pos = 0;
        let index;
        let fromPos;
        let attr;
        let len;
        let seg;

        while ((index = a.indexOf(',', pos)) > 0) {
            const n = a.substring(pos, index);
            posAttr[posAttr.length] = parseInt(n, 10);
            pos += (index - pos) + 1;
        }

        if (pos < a.length) {
            const n = a.substring(pos);
            posAttr[posAttr.length] = parseInt(n, 10);
        }

        for (seg = 0; seg + 4 <= posAttr.length; seg += 2) {
            fromPos = posAttr[seg] + 1; // Note: attribute takes effect one position after it is specified.
            attr = posAttr[seg + 1];
            const posStopAttr = posAttr[seg + 2];
            len = posStopAttr - fromPos;
            const endAttr = posAttr[seg + 3];

            if (this.mapping.colFromPos(fromPos) === 0 && this.buffer[fromPos] === ' ') {
                fromPos++;
                len--;
            }

            if (len > 0) {
                this.setAttribute(fromPos, attr, len);
            }

            if (endAttr === 0x20) {
                seg += 2;
            }
        }
        if (seg < posAttr.length) {
            fromPos = posAttr[seg] + 1; // Note: attribute takes effect one position after it is specified.
            attr = posAttr[seg + 1];
            len = this.buffer.length - fromPos;
            if (len > 0) {
                this.setAttribute(fromPos, attr, len);
            }
        }
    }

    loadCursorPosition(cu) {
        const values = cu.split(',');

        if (values.length < 2) {
            return;
        }

        let blink = false;

        const row = parseInt(values[0], 10);
        const col = parseInt(values[1], 10);

        if (values.length > 2) {
            blink = true;
        }

        if (!isNaN(row) && !isNaN(col)) {
            this.cursorPos = { row: row - 1, col: col - 1, blink: blink };  // Note: It's OK if cursor row or col are < 0 we'll use that later.
        }
    }

    setAttribute(fromPos, attr, len) {
        if (len <= 0) {
            return;
        }

        const sa = this.hexCodeToScreenAttr(attr);

        while (len-- > 0) {
            if (this.attrMap[fromPos]) {
                this.attrMap[fromPos].screenAttr = sa;
            }

            fromPos = fromPos + 1;
        }
    }

    hexCodeToScreenAttr(hexCode) {
        let color = 'nd';
        let reverse = false;
        let underscore = false;
        let blink = false;
        let nonDisp = false;
        let colSep = false;

        switch (hexCode) {
            case QSN_SA.GRN: color = 'g'; break;
            case QSN_SA.GRN_RI: color = 'g'; reverse = true; break;
            case QSN_SA.WHT: color = 'w'; break;
            case QSN_SA.WHT_RI: color = 'w'; reverse = true; break;
            case QSN_SA.GRN_UL: color = 'g'; underscore = true; break;
            case QSN_SA.GRN_UL_RI: color = 'g'; underscore = true; reverse = true; break;
            case QSN_SA.WHT_UL: color = 'w'; underscore = true; break;
            case QSN_SA.ND: nonDisp = true; break;
            case QSN_SA.RED: color = 'r'; break;
            case QSN_SA.RED_RI: color = 'r'; reverse = true; break;
            case QSN_SA.RED_BL: color = 'r'; blink = true; break;
            case QSN_SA.RED_RI_BL: color = 'r'; reverse = true; blink = true; break;
            case QSN_SA.RED_UL: color = 'r'; underscore = true; break;
            case QSN_SA.RED_UL_RI: color = 'r'; underscore = true; reverse = true; break;
            case QSN_SA.RED_UL_BL: color = 'r'; underscore = true; blink = true; break;
            case QSN_SA.ND_2F: nonDisp = true; break;
            case QSN_SA.TRQ_CS: color = 't'; colSep = true; break;
            case QSN_SA.TRQ_CS_RI: color = 't'; colSep = true; reverse = true; break;
            case QSN_SA.YLW_CS: color = 'y'; colSep = true; break;
            case QSN_SA.YLW_CS_RI: color = 'y'; colSep = true; reverse = true; break;
            case QSN_SA.TRQ_UL: color = 't'; underscore = true; break;
            case QSN_SA.TRQ_UL_RI: color = 't'; underscore = true; reverse = true; break;
            case QSN_SA.YLW_UL: color = 'y'; underscore = true; break;
            case QSN_SA.ND_37: nonDisp = true; break;
            case QSN_SA.PNK: color = 'p'; break;
            case QSN_SA.PNK_RI: color = 'p'; reverse = true; break;
            case QSN_SA.BLU: color = 'b'; break;
            case QSN_SA.BLU_RI: color = 'b'; reverse = true; break;
            case QSN_SA.PNK_UL: color = 'p'; underscore = true; break;
            case QSN_SA.PNK_UL_RI: color = 'p'; underscore = true; reverse = true; break;
            case QSN_SA.BLU_UL: color = 'b'; underscore = true; break;
            case QSN_SA.ND_3F: nonDisp = true; break;
        }

        return new ScreenAttr(color, reverse, underscore, blink, nonDisp, colSep);
    }

    coordToPos(row, col) {
        return this.mapping.coordToPos(row, col);
    }

    setFieldData(pos, field, usage) {
        const atPos = this.attrMap[pos];

        atPos.usage = usage;
        atPos.field = field;
    }

    peekOnePastEndOfField(row, col) {
        return this.peekOnePastEndOfFieldPos(this.coordToPos(row, col));
    }

    peekOnePrevStartOfField(row, col) {
        return this.peekOnePrevStartOfFieldPos(this.coordToPos(row, col));
    }

    peekOnePastEndOfFieldPos(pos) {
        while (pos < this.attrMap.length && this.attrMap[pos].usage !== 'o') {
            pos++;
        }

        if (pos >= this.attrMap.length) {
            return null;
        }

        return new RowCol(this.mapping.rowFromPos(pos), this.mapping.colFromPos(pos));
    }

    peekOnePrevStartOfFieldPos(pos) {
        while (pos > 0 && this.attrMap[pos].usage !== 'o') {
            pos--;
        }

        if (pos < 0) {
            return null;
        }

        return new RowCol(this.mapping.rowFromPos(pos), this.mapping.colFromPos(pos));
    }

    peekEndOfFieldPos(pos) {
        while (pos < this.attrMap.length && this.attrMap[pos].usage !== 'o') {
            pos++;
        }

        if (pos >= this.attrMap.length) {
            return null;
        }

        return new RowCol(this.mapping.rowFromPos(pos), this.mapping.colFromPos(pos));
    }

    insertTextToFieldAtPos(atPos, text) {
        if (text.length !== 1) {
            return false;
        }

        const eofRowCol = this.peekEndOfFieldPos(atPos);
        if (!eofRowCol) {
            return false;
        }

        const eofPos = this.mapping.coordToPos(eofRowCol.row, eofRowCol.col);

        if (eofPos <= atPos) {
            return false;
        }

        // Push letters to the right
        for (let pos = eofPos - 2; pos >= atPos; pos--) {
            this.buffer[pos + 1] = this.buffer[pos];
        }

        this.buffer[atPos] = text;

        return true;
    }

    scanAttrMap(fromPos, target) {
        if (target === 'nextNonOutput') {
            for (let pos = fromPos; pos < this.attrMap.length; pos++) {
                if (this.attrMap[pos].usage !== 'o') {
                    return pos;
                }
            }

            for (let pos = 0; pos < fromPos; pos++) {
                if (this.attrMap[pos].usage !== 'o') {
                    return pos;
                }
            }
        }
        else if (target === 'prevNonOutput') {
            for (let pos = fromPos; pos >= 0; pos--) {
                if (this.attrMap[pos].usage !== 'o') {
                    return pos;
                }
            }

            for (let pos = this.attrMap.length - 1; pos > fromPos; pos--) {
                if (this.attrMap[pos].usage !== 'o') {
                    return pos;
                }
            }
        }

        return -1;
    }

    hotspotScan(termLayout) {
        let result = [];

        for (let pos = 0; pos < this.buffer.length; pos++) {
            const c = this.buffer[pos];
            if ((c === ' ' || c.charCodeAt(0) === 0) &&
                pos + 6 < this.buffer.length &&
                this.buffer[pos + 1] === 'F' &&
                (this.buffer[pos + 3] === '=' || this.buffer[pos + 4] === '=')) {
                let sF = '';
                let label = '';
                let matchLen = 1; // 'F'
                let digits=0;

                if (this.buffer[pos + 3] === '=') {
                    digits = 1;
                } else if (this.buffer[pos + 4] === '=') {
                    digits = 2;
                }

                let valid = true;

                // Get the digits before the equal sign.
                for (let k = pos + 2; k < pos + 2 + digits; k++) {
                    const c = this.buffer[k];

                    if (! Validate.digitsOnly(c)) {
                        valid = false;
                        break;
                    }
                    sF += c;
                    matchLen += 1;
                }

                if (!valid) {
                    continue;
                }

                const f = parseInt(sF, 10);

                if (f < 1 || f > 24) {
                    continue;
                }

                valid = false;

                // Get the label after the equal sign. The last position must be blank.
                for (let k = pos + 2 + digits; k < this.buffer.length; k++) {
                    const c = this.buffer[k];

                    if (c === ' ' || c.charCodeAt(0) === 0) {
                        valid = true;
                        break;
                    }

                    label += c;
                    matchLen += 1;
                }

                if (label.length === 0) {
                    continue;
                }

                const l = this.mapping.colFromPos(pos) * termLayout._5250.cursor.w;
                const r = this.mapping.colFromPos(pos + 2 + digits) * termLayout._5250.cursor.w;
                const t = (this.mapping.rowFromPos(pos) * termLayout._5250.cursor.h) + (TerminalRender.calcTextVertPadding(termLayout) / 2); // Assumes no vert offset.
                const w = matchLen * termLayout._5250.cursor.w;
                const h = termLayout._5250.cursor.h;

                result.push({ 'box': { 'l': l, 't': t, 'r': r, 'w': w, 'h': h }, 'label': label, 'action': 'F' + f });

                pos += matchLen - 1; // The loop will increment one more.
            }
        }

        return result;
    }

    getInputAreaAt(pos) {
        let initialPos = pos;
        let endPos = pos;

        while (initialPos - 1 > 0 && this.attrMap[initialPos - 1].usage !== 'o') {
            initialPos = initialPos - 1;
        }

        while (endPos + 1 + 1 < this.attrMap.length && this.attrMap[endPos + 1].usage !== 'o') {
            endPos = endPos + 1;
        }

        return new InputArea(initialPos, endPos - initialPos + 1);
    }

    copyInputBuffer(inputArea) {
        let result = '';

        for (let pos = inputArea.initialPos; pos < inputArea.initialPos + inputArea.len; pos++) {
            result = result + this.buffer[pos];
        }

        return result;
    }

    saveDebugState(latestChecksum) {
        this.lastChecksum = latestChecksum ? latestChecksum : this.calcBuffChecksum();                
        this.bufferCopy = [...this.buffer];
    }

    handleDebugIntervalTimerEvent() {
        if (!this.mapping) { return; }

        const checksum = this.calcBuffChecksum();
        if (checksum !== this.lastChecksum) {
            console.log('Buffer changed !');

            for (let row = 0; row < 24; row++) {
                const col = 0;

                const fromPos = this.mapping.coordToPos(row, col);
                const rowText = Screen.doCopyFromBuffer(this.bufferCopy, fromPos, fromPos + 80);
                const newRowText = Screen.doCopyFromBuffer(this.buffer, fromPos, fromPos + 80);
                if (rowText !== newRowText) {
                    console.log(`[${row}] old: ${rowText}<<`);
                    console.log(`[${row}] new: ${newRowText}<<`);
                }
            }
        }

        this.saveDebugState(checksum);
    }

    calcBuffChecksum() {
        let r = 0;
        for (let pos = 0; pos < this.buffer.length; pos++) {
            r += this.buffer[pos].charCodeAt(0);
        }
        return r;                     
    }

    getStartOfFieldPos(changeRowAllowed, row, col) {
        const initialRow = row;
        let pos = this.coordToPos(row, col);

        while (pos > 0 && this.attrMap[pos].usage !== 'o') {
            pos--;

            if (!changeRowAllowed) {
                const row = this.mapping.rowFromPos(pos);
                if (row !== initialRow) {
                    break;
                }
            }
        }

        return pos;
    }

    static copyFromBuffer(regScr, row, col, bytes) {
        const fromPos = regScr.mapping.coordToPos(row, col);
        const toPos = fromPos + bytes;
        return Screen.copyPositionsFromBuffer(regScr, fromPos, toPos);
    }

    static copyPositionsFromBuffer(regScr, fromPos, toPos) {
        return Screen.doCopyFromBuffer(regScr.buffer, fromPos, toPos);
    }

    static doCopyFromBuffer(buffer, fromPos, toPos) { // Should I use slice???
        const bytes = toPos - fromPos + 1;
        let index = 0;
        let val = '';

        while (fromPos < buffer.length && index < bytes) {
            val = val + buffer[fromPos];
            fromPos++;
            index++;
        }

        return val;
    }

    static isRowColInInputPos(regScr, row, col) {
        const pos = regScr.mapping.coordToPos(row, col);
        return regScr.attrMap[pos].usage !== 'o';
    }
}

class ScreenAttr {
    constructor(color, reverse, underscore, blink, nonDisp, colSep) {
        this.color = color;
        this.reverse = reverse;
        this.underscore = underscore;
        this.blink = blink;
        this.nonDisp = nonDisp;
        this.colSep = colSep;
    }
}

class ScreenAttrEntry {
    constructor(usage, screenAttr, field) {
        this.usage = usage;
        this.screenAttr = screenAttr;
        this.field = field;
    }
}

class RowCol {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
}

class Field {
    constructor(row, col, len, ffw, dbcsType) {
        this.row = row;
        this.col = col;
        this.len = len;
        this.ffw = ffw;
        this.dbcsType = dbcsType;
        this.dupChars = 0;
    }

    isMandatoryFill() {
        return this.ffw.mf.mandatoryFill;
    }
}

class FieldFormatWord {
    constructor(bypass, dup, mdt, shiftEdit, autoEnter, fieldExitReq, monocase, me, mf) {
        this.bypass = bypass;
        this.dup = dup;          // Also called 'Field Mark'
        this.mdt = mdt;          // Modified Data Tag (true if this field has been modified)
        this.shiftEdit = shiftEdit;    // see: ShiftEditSpec object
        this.autoEnter = autoEnter;    // if true, auto-enter when field is exited.
        this.fieldExitReq = fieldExitReq; // if true, field-exit is required.
        this.monocase = monocase;     // if true, translate operator-keyd letters to uppercase.
        this.me = me;           // madatory enter
        this.mf = mf;           // see: AdjustFill object       
    }

    static factory(ffw) {

        // http://publib.boulder.ibm.com/infocenter/iseries/v6r1m0/index.jsp?topic=/apis/dsm1f.htm Set Field (QsnSetFld) API
        //
        // Note: IBM counts bits from left to right, bit 15 is bit 0
        var checksum = (ffw & 0xc000) >>> 14;

        if (checksum !== 1) { // Must be: 0x01 
            return undefined;
        }

        var bypass = ((ffw & 0x2000) >>> 13) != 0;  // Bit 2
        var dup = ((ffw & 0x1000) >>> 12) != 0;  // Bit 3
        var mdt = ((ffw & 0x800) >>> 11) != 0;  // Bit 4
        var se = (ffw & 0x700) >>> 8;           // Bits 5-7

        var shiftEdit = new ShiftEditSpec(se === 0, se === 0x01, se === 0x02, se === 0x03, se === 0x04, se === 0x05, se === 0x06, se === 0x07);

        var autoEnter = ((ffw & 0x80) >>> 7) != 0; // Bit  8
        var fieldExitReq = ((ffw & 0x40) >>> 6) != 0; // Bit  9
        var monocase = ((ffw & 0x20) >>> 5) != 0; // Bit 10
        var me = ((ffw & 0x08) >>> 3) != 0; // Bit 12

        var caMf = ffw & 0x7;   // Bits 13-15

        var mf = new AdjustFill(caMf === 0x0, caMf === 0x5, caMf === 0x6, caMf === 0x7);

        return new FieldFormatWord(bypass, dup, mdt, shiftEdit, autoEnter, fieldExitReq, monocase, me, mf);
    }
}

class AdjustFill {
    constructor(noAdj, rightAdjZeroFill, rightAdjBlankFill, mandatoryFill) {
        this.noAdj = noAdj;
        this.rightAdjZeroFill = rightAdjZeroFill;
        this.rightAdjBlankFill = rightAdjBlankFill;
        this.mandatoryFill = mandatoryFill;
    }
}

class ShiftEditSpec {
    constructor(alphaShift, alphaOnly, numericShift, numericOnly, katakanaShift, digitsOnly, ioFeature, signedNumeric) {
        this.alphaShift = alphaShift;    // The field accepts all characters. The shift keys are acknowledged. The characters on the lower symbol of each key are valid.
        this.alphaOnly = alphaOnly;     // The field accepts only characters A-Z (both uppercase and lowercase) plus the comma (,), period (.), minus (-), space, and DUP (if the DUP-enable bit is on in the associated Field Format Word (FFW)). Other characters cause operator errors. Some special characters are also acceptable (see the 5250 data stream documentation).
        this.numericShift = numericShift;  // The field accepts all characters from all keys.
        this.numericOnly = numericOnly;   // The field accepts only characters 0-9 and the comma (,), period (.), minus (-), plus (+), space, and DUP (if the DUP-enable bit is on in the associated Field Format Word (FFW)). Other characters cause operator errors. The unit position of this field will carry the sign digit for the field. If the field is exited with the Field - key, the last character in the field will be 'D' zoned, unless the last character in the field is a '+', '-', ',', '.', or space, in which case an error will be posted. In a center-adjusted field, the field will be center-adjusted before any 'D' zoning or testing of the sign character is performed. When a negative field (from the Field - key) is returned, the units digit will have a 'D' zone.
        this.katakanaShift = katakanaShift; // This is the same as the alphabetic shift except that the keyboard is placed in the Katakana shift on the Japan Katakana data entry, typewriter, and G keyboards. This reverses the order of the cursor direction with respect to the screen. If the display is in bidirectional mode, this changes the cursor direction to left to center; otherwise, it changes the cursor direction to center to left.
        this.digitsOnly = digitsOnly;    // The field allows keys 0-9 and DUP (if the DUP-enable bit is on in the associated Field Format Word (FFW)).
        this.ioFeature = ioFeature;     // This field will not accept any data keys from the keyboard. An operator error is posted if keystrokes are entered in this field. The operator may move the cursor into and out of this field similar to operation in any non-bypass input field (that is, Field Advance will position the cursor to the start of the field). This field can be used for input from feature devices such as a magnetic stripe reader of selector light pen while data input from the keyboard is excluded. The Field +, Field Exit, and Dup keys are valid for this field and performance is the same as that for any non-bypass input field.
        this.signedNumeric = signedNumeric; // The field allows keys 0-9 and DUP (if the DUP-enable bit is on in the associated Field Format Word (FFW)). Typing any other character will cause an operator error display. This field reserves the center-hand position for a sign display (- for negative and null for positive); therefore, the largest number of characters that can be entered into this field is one less than the field length. A signed numeric field less than 2 characters long will cause an error to be flagged. No digit may be keyed into the centermost position; however, the cursor can be positioned there by using the cursor movement keys and then followed by the F+ or F- key. This allows changing the sign without affecting the rest of the field.
    }
}

class InputArea {
    constructor(initialPos, len) {
        this.initialPos = initialPos;
        this.len = len;
    }
}
