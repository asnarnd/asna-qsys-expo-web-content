/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { ID, ZINDEX, CHAR_MEASURE, TerminalDOM, TerminalToolbar };

import { Labels } from './terminal-labels.js';
import { AidKey, QSN } from './ibm-codes.js';
import { Validate } from './terminal-validate.js';
import { StringExt } from '../string.js';
import { KEYBOARD_STATE } from './terminal-keyboard.js';

// HTML IDs
const ID = {
    CURSOR: 'AsnaTermCursor',
    CANVAS: 'AsnaTermFacade',
    _5250_TEXT: 'AsnaTerm5250',
    STATUSBAR: 'AsnaTermStatusBar',
    SELECTION: 'AsnaTermTextSelection',
    ERROR_SOUND: 'AsnaTermErrorSound',
    MSG_WAITING: 'AsnaTermMessageIndicator',
    ERRMSG: 'AsnaTermErrMsg',
    TERM_BODY: 'AsnaTermBody',
    SETTINGS: 'AsnaTermSettingsDialog',
    IBM_KPAD_CONTAINER: 'AsnaTermIbmKeyPad',
    // IBM_KPAD_USR_POPUP: 'AsnaTermIbmUserDefKeysPopup',
    IBM_KPAD_RANGE_POPUP: 'AsnaTermIbmFKeysPopup',
    IBM_KPAD_ENUM_POPUP: 'AsnaTermIbmSpecialKeysPopup',
    FINGER_GLOW_CANVAS: 'AsnaMonarchGlowCanvas',
    SETTINGS_SLIDER_MODEL: 'AsnaTermSettingsSliderModel',
    SETTINGS_SLIDER: 'AsnaTermSettingsSlider',
    PREF_LKBD: 'AsnaTermPREF_LKBD',
    PREF_LFKHS: 'AsnaTermPREF_LFKHS',
    PREF_LFUBTNS: 'AsnaTermPREF_LFUBTNS',
    PREF_LKIBMSHOW: 'AsnaTermPREF_LKIBMSHOW',
    SETTINGS_KBDCHECKBOX: 'settingsKbdCheckbox',
    SETTINGS_FK_HOTSPOTSCHECKBOX: 'settingsFK_HotSpotsCheckbox',
    SETTINGS_BUTTONSCHECKBOX: 'settingsButtonsCheckbox',
    SETTINGS_IBMKPAD_CHECKBOX: 'settingsIBMKpadCheckbox',
    SETTINGS_COLORS: 'AsnaTermPREF_Colors',
    ENTER_BIG_BUTTON: 'AsnaTermEnterButton',
    RESET_BIG_BUTTON: 'AsnaTermResetButton',
    COLOR_DIALOG: 'dialog-settings-colors',
    COLOR_CLOSE_ICON: 'bterm-settings-colors-close-icon',
    COLOR_WHEEL: 'AsnaTermColorWheelID',
    WHITE_HEXAGON: 'AsnaTermWhiteHexID',
    GRAY_WHEEL: 'AsnaTermGrayWheelID',
    BLACK_HEXAGON: 'AsnaTermBlackHexID',
    COLOR_GREEN: 'AsnaTermCOLOR_GREEN',
    COLOR_BLUE: 'AsnaTermCOLOR_BLUE',
    COLOR_RED: 'AsnaTermCOLOR_RED',
    COLOR_WHITE: 'AsnaTermCOLOR_WHITE',
    COLOR_TURQUOISE: 'AsnaTermCOLOR_TURQUOISE',
    COLOR_YELLOW: 'AsnaTermCOLOR_YELLOW',
    COLOR_PINK: 'AsnaTermCOLOR_PINK',
    COLOR_CURSOR: 'AsnaTermCOLOR_CURSOR',
    COLOR_SEL: 'AsnaTermCOLOR_SEL',
    COLOR_APPLY: 'AsnaTermColorApplyID',
    COLOR_DEFAULTS: 'AsnaTermColorDefaultsID',
    COLOR_LUMINANCE: 'AsnaTermColorLuminanceID',
    COLOR_LUMSLIDER: 'AsnaTermColorLumSliderID',
    COLOR_Attr: 'AsnaTermCOLOR_Attr',
    COLOR_Color: 'AsnaTermCOLOR_Color',
    COLOR_BgColor: 'AsnaTermCOLOR_BkColor',
    COLOR_LGREEN: 'AsnaTermCOLOR_LGREEN',
    COLOR_LBLUE: 'AsnaTermCOLOR_LBLUE',
    COLOR_LRED: 'AsnaTermCOLOR_LRED',
    COLOR_LWHITE: 'AsnaTermCOLOR_LWHITE',
    COLOR_LTURQUOISE: 'AsnaTermCOLOR_LTURQUOISE',
    COLOR_LYELLOW: 'AsnaTermCOLOR_LYELLOW',
    COLOR_LPINK: 'AsnaTermCOLOR_LPINK',
    COLOR_Other: 'AsnaTermCOLOR_Other',
    COLOR_LCURSOR: 'AsnaTermCOLOR_LCURSOR',
    COLOR_LSEL: 'AsnaTermCOLOR_LSEL'
};

const ZINDEX = {
    TERMINAL_5250_TEXT: 100,
    TERMINAL_TEXT_SELECTION: 200,
    TERMINAL_STATUSBAR: 550, // More than TERMINAL_HOTSPOT & less than ENTER_RESET_BUTTONS
    TERMINAL_SETTINGS: 550,
    TERMINAL_CURSOR_HIDDEN: -200,
    TERMINAL_CURSOR_VISIBLE: 200, // Less than TOUCHABLE_INPUT
    MULTITOUCH_FINGERGLOW: 700,
    TOOLTIP: 800,
    IBM_KPAD_KEYPAD: 600,        // More than TOUCHABLE_INPUT & TERMINAL_HOTSPOT
    IBM_KPAD_POPUP: 600,         // More than TOUCHABLE_INPUT & TERMINAL_HOTSPOT
    TERMINAL_HOTSPOT_POPUP: 600, // More than TOUCHABLE_INPUT & TERMINAL_HOTSPOT 
    TOUCHABLE_INPUT: 500,
    TERMINAL_HOTSPOT: 500,
    ENTER_RESET_BUTTONS: 600
};

const CHAR_MEASURE = {
    UNDERLINE_HEIGHT: 1,
    UNDERSCORE_CHAR_HEIGHT: 1
};

const SAMPLE_ONE = 'M';
const SAMPLE_44 = 'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM'; // 44 characters
const MAX_COORD_STR = '99,999';

class TerminalDOM {
    constructor() {
        this.preFontFamily = '';
        this.sample132 = SAMPLE_44 + SAMPLE_44 + SAMPLE_44;
    }

    static resetBoxStyle(style) {
        style.margin = '0px';
        style.padding = '0px';
        style.border = '0px';
    }

    static makeUnselectable(el) { // Note: document.body.onselectstart is set to return false
        el.unselectable = 'on'; // IE, Opera
        el.style.MozUserSelect = 'none'; // Firefox
        el.style.WebkitUserSelect = 'none'; // Chrome
    }

    static htmlMeasureText(fontHeight, preFontFamily, text) {
        let result = theMeasureCache.find(fontHeight, preFontFamily, text);
        if (result) {
            // console.log(`cache hit: ${text}`);
            return result;
        }

        const measureDiv = document.createElement('div');
        const isIE_7 = navigator.appVersion.indexOf('MSIE 7.') > 0;

        if (!preFontFamily) {
            console.log(`Assert: htmlMeasureText preFontFamily is ${preFontFamily} !`);
        }

        measureDiv.type = 'text';
        measureDiv.style.fontFamily = preFontFamily;
        measureDiv.style.fontSize = fontHeight + 'px';
        measureDiv.style.position = 'absolute';
        measureDiv.style.visibility = 'hidden';
        measureDiv.style.width = 'auto';
        measureDiv.style.height = 'auto';
        measureDiv.style.overflow = 'visible';

        TerminalDOM.resetBoxStyle(measureDiv.style);

        measureDiv.style.whiteSpace = 'pre';
        measureDiv.innerHTML = text;

        document.body.appendChild(measureDiv);

        const height = isIE_7 ? fontHeight : measureDiv.clientHeight;
        const width = measureDiv.clientWidth;

        document.body.removeChild(measureDiv);

        result = { w: width, h: height };
        theMeasureCache.add(fontHeight, preFontFamily, text, result);

        return result;
    }

    static cssSelectorExists(selText) {
        if (!document.styleSheets) { return false; }

        for (let i = 0; i < document.styleSheets.length; i++) {
            var ss = document.styleSheets[i];
            if (!ss.cssRules)
                continue;
            for (let j = 0; j < ss.cssRules.length; j++) {
                if (ss.cssRules[j].selectorText === selText) {
                    return true;
                }
            }
        }

        return false;
    }

    static cssApplyAndGetAttr(el, className, attrName) {
        el.className = className;
        return TerminalDOM.getComputedStyle(el, attrName);
    }

    static getComputedStyle(el, propName) {
        if (window.getComputedStyle) {
            return window.getComputedStyle(el, null).getPropertyValue(propName);
        }
        else if (el.currentStyle) {
            return el.currentStyle[propName];
        }
        return '';
    }

    static fontSizeForHeight(height) {
        let reduction = 0.6;
        if (false /*is_iPad*/) {
            reduction = 0.5;
        }
        return Math.ceil(height * reduction); // Note: pixels.
    }

    static lineHeightCentersVertically() {
        return true; // !is_iPad;
    }

    static getCharWidth(char, termLayout, preFontFamily ) {
        return TerminalDOM.htmlMeasureText(termLayout._5250.fontSizePix, preFontFamily, char).w;
    }

    static alignInputText(input, height, fSize) {
        let top = 0;
        let bottom = 0;
        let lead = 0;

        if (height > fSize) {
            lead = height - fSize;
            top = 0;
            bottom = lead;
        }

        input.style.paddingTop = top + 'px';
        input.style.paddingBottom = bottom + 'px';
    }

    static moveCaretPos(el, pos) {
        if (el.createTextRange) { // IE 
            range = el.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
        else if (el.setSelectionRange) { // Chrome, Firefox
            el.setSelectionRange(pos, pos);
        }
    }

    static cancelEvent(e) {
        if (e && typeof (e.stopPropagation) === 'function') { // Modern browsers. Note: On IE10 e is not window.event
            e.stopPropagation();

            if (typeof (e.preventDefault) === 'function') {
                e.preventDefault(); // On IE9+,  preventDefault() also sets window.event.returnValue to false
            }

            // IE 9+
            if (typeof (e.cancelBubble) === 'boolean') {
                e.cancelBubble = true;
            }
        }
        else if (window.event) { // IE < 9
            window.event.cancelBubble = true;
            window.event.returnValue = false;
            try {
                window.event.keyCode = 0; // May be read-only (handle exception)
            }
            catch (ex) {
            }
        }
    }

    static clearCache() {
        theMeasureCache.clear();
    }

    static getViewportDim(landscape) {
        let w = window.screen.availWidth;
        let h = window.screen.availHeight;

        if (false /*_isMobile() || is_Win8Touch*/) {
            if (typeof (window.innerWidth) === 'number') {
                w = window.innerWidth;
            }
            if (typeof (window.innerHeight) === 'number') {
                h = window.innerHeight;
            }

            if (isNaN(landscapeDevHeight)) {
                landscapeDevHeight = Math.min(window.screen.width, window.screen.height);
            }
        }

        if (landscape) {
            const tw = w;
            const th = h;
            w = Math.max(tw, th);
            h = Math.min(tw, th);

            if (false /* is_Win8Touch && (window.innerHeight === window.screen.height)*/ ) { // When Surface Metro mode, reduce Terminal height to allow touching on status bar for settings.
                h -= 32;
            }
        }

        return { w: w, h: h };
    }

    static setAttrDisplayOnClass(className, val) {
        const selector = document.querySelectorAll('.' + className);

        for (let i = 0, selCount = selector.length; i < selCount; i++) {
            selector[i].style.display = val;
        }
    }

    static removeElClass(className) {
        const selector = document.querySelectorAll('.' + className);

        for (let i = 0, selCount = selector.length; i < selCount; i++) {
            const child = selector[i];
            const parent = child.parentElement;
            if (parent) {
                parent.removeChild(child);
            }
        }
    }

    static getLocation(el) {
        let lPropVal = typeof el.style !== 'undefined' ? el.style.left : null;
        let tPropVal = typeof el.style !== 'undefined' ? el.style.top : null;

        if (!lPropVal) {
            lPropVal = TerminalDOM.getComputedStyle(el, 'left');
        }

        if (!tPropVal) {
            tPropVal = TerminalDOM.getComputedStyle(el, 'top');
        }
        return { l: parseFloat(lPropVal), t: parseFloat(tPropVal) };
    }

    static getDimensions(el) {
        let wPropVal = typeof el.style !== 'undefined' ? el.style.width : null;
        let hPropVal = typeof el.style !== 'undefined' ? el.style.height : null;

        if (!wPropVal) {
            wPropVal = TerminalDOM.getComputedStyle(el, 'width');
        }

        if (!hPropVal) {
            hPropVal = TerminalDOM.getComputedStyle(el, 'height');
        }
        return { w: parseFloat(wPropVal), h: parseFloat(hPropVal) };
    }

    static setInnerHTML(elID, text) {
        const el = document.getElementById(elID);
        if (el && el.innerHTML && text) {
            el.innerHTML = text;
        }
    }

    static setElValue(elID, val) {
        const el = document.getElementById(elID);
        if (el) {
            el.value = val;
        }
    }

    static setStyleTransform(el, f) {
        if (!el || !el.style) {
            return;
        }
        if (typeof el.style.webkitTransform !== 'undefined') {
            el.style.webkitTransform = f;
        }
        else if (typeof el.style.msTransform !== 'undefined') {
            el.style.msTransform = f;
        }
        else if (typeof el.style.MozTransform !== 'undefined') {
            el.style.MozTransform = f;
        }
    }

    static addClass(el, value) {
        if (el.classList && el.classList.add) {
            el.classList.add(value);
            return;
        }

        const classNames = (value || '').split(/\s+/);

        if (el.nodeType === 1) {
            if (!el.className) {
                el.className = value;

            } else {
                var className = ' ' + el.className + ' ';
                var setClass = el.className;

                for (let c = 0, cl = classNames.length; c < cl; c++) {
                    if (className.indexOf(' ' + classNames[c] + ' ') < 0) {
                        setClass += ' ' + classNames[c];
                    }
                }
                el.className = StringExt.trim(setClass);
            }
        }
    }

    static removeClass(el, value) {
        if (el.classList && el.classList.remove) {
            el.classList.remove(value);
            return;
        }

        const classNames = (value || '').split(rspace);

        if (el.nodeType === 1 && el.className) {
            if (value) {
                var className = (' ' + el.className + ' ').replace(rclass, ' ');
                for (var c = 0, cl = classNames.length; c < cl; c++) {
                    className = className.replace(' ' + classNames[c] + ' ', ' ');
                }
                el.className = StringExt.trim(className);

            } else {
                el.className = '';
            }
        }
    }

    static changeClassByAppending(el, appendName) {
        el.className = el.className + appendName;
    }

    static replaceClass(className, replacementClassName) {
        const sel = document.querySelectorAll(`.${className}`);

        for (let i = 0, l = sel.length; i < l; i++) {
            sel[i].className = replacementClassName;
        }
    }

    static getAbsPosition(el) {
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
    }

    static disableAutoCorrect(el) {
        el.setAttribute('autocomplete', 'off');
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('autocapitalize', 'off');
        el.setAttribute('spellcheck', false);
    }

    findPreFontFamily() {
        const el = document.createElement('pre');
        document.body.appendChild(el);
        let ff = TerminalDOM.getComputedStyle(el, 'font-family');
        document.body.removeChild(el);

        this.preFontFamily = this.replaceAll(ff, '"', "'");
        return this.preFontFamily;
    }

    replaceWithInputText(oldElement) {
        let id = oldElement.id;
        let position = oldElement.style.position ? oldElement.style.position : 'absolute';
        let left = oldElement.style.left;
        let top = oldElement.style.top;
        let width = oldElement.style.width;
        let height = oldElement.style.height;
        let parent = oldElement.parentElement;

        parent.removeChild(oldElement);
        let newElement = document.createElement('input');
        newElement.type = 'text';
        newElement.id = id;
        newElement.name = 'cursor';
        newElement.style.position = position;
        newElement.style.left = left;
        newElement.style.top = top;
        newElement.style.width = width;
        newElement.style.height = height;

        parent.appendChild(newElement);
        return newElement;
    }

    isValidMonospace() {
        return TerminalDOM.htmlMeasureText(10, this.preFontFamily, "M").w === TerminalDOM.htmlMeasureText(10, this.preFontFamily, "i").w;
    }

    setPreFontFamily(fontFamily) {
        this.preFontFamily = fontFamily;
    }

    static getElementByName(name) {
        const elements = document.getElementsByName(name);
        return elements.length > 0 ? elements[0] : null; // Note: if name not unique, the first matching is returned.
    }

    getHiddenValue(id) {
        const element = document.getElementById(id);

        if (!element) {
            return null;
        }

        return element.value;
    }

    replaceAll(str, oldChar, newChar) {
        var i = -1;

        if (typeof str !== 'string') {
            return str;
        }

        while ((i = str.indexOf(oldChar, i >= 0 ? i + newChar.length : 0)) !== -1) {
            str = str.substring(0, i) + newChar + str.substring(i + oldChar.length);
        }

        return str;
    }

    setTerminalFont(_5250Cursor) {
        const requestedFontHeight = _5250Cursor.fontSizePix;
        const termW = _5250Cursor.cursor.w * this.sample132.length;

        do {
            if (TerminalDOM.htmlMeasureText(_5250Cursor.fontSizePix, this.preFontFamily, this.sample132).w <= termW) {
                break;
            }

            _5250Cursor.fontSizePix--;

        } while (_5250Cursor.fontSizePix > 0);

        do {
            const oneCharMeasure = TerminalDOM.htmlMeasureText(_5250Cursor.fontSizePix, this.preFontFamily, SAMPLE_ONE);

            if (oneCharMeasure.h <= _5250Cursor.cursor.h) {
                break;
            }

            _5250Cursor.fontSizePix--;

        } while (_5250Cursor.fontSizePix > 0);

        if (_5250Cursor.fontSizePix <= 0) { // Defensive programming
            _5250Cursor.fontSizePix = requestedFontHeight;
        }

        _5250Cursor.cursor.w = TerminalDOM.htmlMeasureText(_5250Cursor.fontSizePix, this.preFontFamily, this.sample132).w / this.sample132.length;
    }

    static getOutputElement(name) {
        const result = document.forms[0][name];
        if (result) {
            return result;
        }

        const newHiddenInput = document.createElement('input');
        newHiddenInput.setAttribute('name', name);
        newHiddenInput.setAttribute('type', 'hidden');
        document.forms[0].appendChild(newHiddenInput);
        return newHiddenInput;
    }
}

const TOOLBAR_ID = {
    CURSOR_POS: 'MonarchTerminalSBarCursorPos',
    INSERT_MODE: 'MonarchTerminalSBarInsertMode',
    ACT_FKEY: 'MonarchTerminalSBarActFKey',
    INDICATORS: 'MonarchTerminalSBarIndicators',
    ERRMSG: 'AsnaTermErrMsg'
};

class TerminalToolbar {
    constructor() {
        this.statusBar = null;
        this.sBarCursorPosEl = null;
        this.sBarInsertModeEl = null;
        this.sBarActFKeyEl = null;
        this.sBarIndEl = null;
        this.sBarErrMsgEl = null;

        this.toolbarFontSizePix = 0;
        this.preFontFamily = '';
        this.designTimeStatusbarHtml = '';
    }

    create(termLayout, fontFamily, termColors) {
        this.toolbarFontSizePix = TerminalDOM.fontSizeForHeight(termLayout.status.h);
        this.preFontFamily = fontFamily;

        this.statusBar = document.getElementById(ID.STATUSBAR);
        if (!statusbar) { return; }

        this.designTimeStatusbarHtml = this.statusBar.innerHTML;

        const oneChar = 'M';
        const oneBlank = ' ';
        const gapToolbarItemsWidth = TerminalDOM.htmlMeasureText(this.toolbarFontSizePix, this.preFontFamily, oneChar).w;

        this.statusBar.style.left = '0px';
        this.statusBar.style.top = termLayout.status.t + 'px';
        this.statusBar.style.height = (termLayout.status.h + 1) + 'px'; // Width is 100% (CSS)
        this.statusBar.style.fontFamily = this.preFontFamily;
        this.statusBar.style.fontSize = this.toolbarFontSizePix + 'px';
        this.statusBar.style.overflow = 'hidden';
        this.statusBar.style.display = 'block';
        this.statusBar.style.zIndex = ZINDEX.TERMINAL_STATUSBAR;
        TerminalDOM.makeUnselectable(this.statusBar);
        TerminalDOM.resetBoxStyle(this.statusBar.style);
        this.statusBar.style.color = termColors.statBarColor;
        this.statusBar.style.backgroundColor = termColors.statBarBkgdColor;

        const insertStrWidth = TerminalDOM.htmlMeasureText(this.toolbarFontSizePix, this.preFontFamily, Labels.get('InsertMode')).w;
        const maxCoordStrWidth = TerminalDOM.htmlMeasureText(this.toolbarFontSizePix, this.preFontFamily, MAX_COORD_STR).w;
        const maxActFKeyStrWidth = TerminalDOM.htmlMeasureText(this.toolbarFontSizePix, this.preFontFamily, AidKey.ToString(QSN.ENTER)).w;
        const maxIndicatorStrWidth = TerminalDOM.htmlMeasureText(this.toolbarFontSizePix, this.preFontFamily, Labels.get('KbdLocked')).w;

        // Status bar window segments (right aligned)
        this.sBarCursorPosEl = this.addToolbarChild(this.statusBar, TOOLBAR_ID.CURSOR_POS, 0, termLayout.w - maxCoordStrWidth, maxCoordStrWidth, termLayout.status.h, true);
        let offsetFromRight = maxCoordStrWidth + gapToolbarItemsWidth;

        this.sBarInsertModeEl = this.addToolbarChild(this.statusBar, TOOLBAR_ID.INSERT_MODE, 0, termLayout.w - offsetFromRight - insertStrWidth, insertStrWidth, termLayout.status.h, true);
        offsetFromRight += insertStrWidth + gapToolbarItemsWidth;

        this.sBarActFKeyEl = this.addToolbarChild(this.statusBar, TOOLBAR_ID.ACT_FKEY, 0, termLayout.w - offsetFromRight - maxActFKeyStrWidth, maxActFKeyStrWidth, termLayout.status.h, true);
        offsetFromRight += maxActFKeyStrWidth + gapToolbarItemsWidth;

        const lastRightAlignedPos = termLayout.w - offsetFromRight - maxIndicatorStrWidth;
        this.sBarIndEl = this.addToolbarChild(this.statusBar, TOOLBAR_ID.INDICATORS, 0, lastRightAlignedPos, maxIndicatorStrWidth, termLayout.status.h, true);

        // Status bar window segments (left aligned)
        const msgIndIconWidth = termLayout.status.h + gapToolbarItemsWidth / 2;
        if (lastRightAlignedPos > msgIndIconWidth) {
            this.sBarErrMsgEl = this.addToolbarChild(this.statusBar, TOOLBAR_ID.ERRMSG, 0, msgIndIconWidth, lastRightAlignedPos - msgIndIconWidth, termLayout.status.h, false);
        }
    }

    render(cursor, editMode, activeFKey, kbdState, kbdAhead, preHelpErrorCode, resetBigButton) {
        // Render from right to left (right-aligned)
        this.renderSbarCursorPos(cursor);
        this.renderSbarInsertMode(editMode);
        this.renderSbarActFKey(activeFKey);
        this.renderSbarIndicators(kbdState, kbdAhead, preHelpErrorCode, resetBigButton );
        this.renderSbarErrMsg(preHelpErrorCode);
    }

    renderSbarCursorPos(cursor) {
        if (!this.sBarCursorPosEl) { return; }

        const strCoord = (cursor.row + 1) + ',' + (cursor.col + 1);
        this.sBarCursorPosEl.innerHTML = strCoord;
    }

    renderSbarInsertMode(editMode) {
        if (!this.sBarInsertModeEl) { return; }

        if (editMode === 'insert') {
            this.sBarInsertModeEl.innerHTML = Labels.get('InsertMode');
        }
        else {
            this.sBarInsertModeEl.innerHTML = '';
        }
    }

    renderSbarActFKey(activeFKey) {
        if (!this.sBarActFKeyEl) { return; }

        if (activeFKey) {
            this.sBarActFKeyEl.innerHTML = activeFKey;
        }
        else {
            this.sBarActFKeyEl.innerHTML = '';
        }
    }

    renderSbarIndicators(kbdState, kbdAhead, preHelpErrorCode, resetBigButton) {
        if (!this.sBarIndEl) { return; }

        if (kbdState === KEYBOARD_STATE.AJAX_WAIT) {
            if (kbdAhead.length) {
                this.sBarIndEl.innerHTML = '[' + kbdAhead.length + ']';
            }
            else {
                this.sBarIndEl.innerHTML = Labels.get('KbdLocked');
            }
        }
        else if (kbdState === KEYBOARD_STATE.ERROR || preHelpErrorCode ) {
            this.sBarIndEl.innerHTML = Labels.get('KbdLocked');
            this.sBarIndEl.title = Labels.get('LockedRecoveryText') + '.';

            if (resetBigButton) {
                resetBigButton.showIfEnabled();
            }
        }
        else {
            this.sBarIndEl.innerHTML = '';
            this.sBarIndEl.title = '';
            if (resetBigButton) {
                resetBigButton.hide();
            }
        }
    }

    renderSbarErrMsg(preHelpErrorCode) {
        if (!this.sBarErrMsgEl) { return; }

        if (preHelpErrorCode) {
            this.sBarErrMsgEl.innerHTML = Labels.get( 'Error' + preHelpErrorCode + 'Text');
            this.sBarErrMsgEl.title = Labels.get('Error' + preHelpErrorCode + 'Recovery');
        }
        else {
            this.sBarErrMsgEl.innerHTML = '';
            this.sBarErrMsgEl.title = '';
        }
    }

    addToolbarChild(parent, id, top, left, width, height, useMonoFont) {
        var child = document.createElement('div');

        if (typeof left === 'number' || Validate.digitsOnly(left)) {
            left = left + 'px';
        }

        if (typeof top === 'number' || Validate.digitsOnly(top)) {
            top = top + 'px';
        }

        if (typeof width === 'number' || Validate.digitsOnly(width)) {
            width = width + 'px';
        }

        if (typeof height === 'number' || Validate.digitsOnly(width)) {
            height = height + 'px';
        }

        child = document.createElement('div');

        child.type = 'text';
        child.id = id;
        child.style.position = 'absolute';
        child.style.left = left;
        child.style.top = top;
        child.style.width = width;
        child.style.height = height;
        if (TerminalDOM.lineHeightCentersVertically()) {
            child.style.lineHeight = height;
        }
        child.style.fontSize = this.toolbarFontSizePix + 'px';
        child.style.overflow = 'hidden';
        child.style.backgroundColor = 'transparent';
        child.style.verticalAlign = 'middle';

        if (useMonoFont) {
            child.style.fontFamily = this.preFontFamily;
        }

        TerminalDOM.makeUnselectable(child);
        TerminalDOM.resetBoxStyle(child.style);

        parent.appendChild(child);

        return child;
    }

    removeToolbars() {
        if (this.statusBar) {
            this.statusBar.innerHTML = this.designTimeStatusbarHtml;
            this.statusBar.style.display = 'none';
        }
    }
}

const MAX_CACHE_ENTRIES = 1000;

class MeasureCache {
    constructor() {
        this.cache = [];
    }
    static hash(fontHeight, preFontFamily, text) {
        return StringExt.padRight(preFontFamily, 20, ' ') + fontHeight + text;
    }
    add(fontHeight, preFontFamily, text, measure) {
        if (this.cache.length >= MAX_CACHE_ENTRIES) {
            console.log('MeasureCache - too may entries!');
            return;
        }
        const hash = MeasureCache.hash(fontHeight, preFontFamily, text);
        this.cache[hash] = measure;
    }
    find(fontHeight, preFontFamily, text) {
        const hash = MeasureCache.hash(fontHeight, preFontFamily, text);
        return this.cache[hash];
    }
    clear() {
        this.cache = [];
    }
}

const theMeasureCache = new MeasureCache();
let landscapeDevHeight = NaN;