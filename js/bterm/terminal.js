/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theTerminal as Terminal };

const FAKE_DUP = '*';

import { TerminalHTML } from './terminal-html.js';
import { TerminalMacros } from './terminal-macros.js';
import { ID, ZINDEX, TerminalDOM, TerminalToolbar, CHAR_MEASURE } from './terminal-dom.js';
import { Screen, Field, FieldFormatWord } from './terminal-screen.js';
import { Base64, UnicodeToUTF8 } from '../base-64.js';
import { TerminalRender  } from './terminal-render.js';
import { ErrorCondition } from './terminal-error.js';
import { BufferMapping } from './buffer-mapping.js'
import { Set, Validate } from './terminal-validate.js';
import { Keyboard, KeyboardVendorSpecificBehaviour, KEY_ACTION, InputEvent, KEYBOARD_STATE } from './terminal-keyboard.js';
import { DBCS, DBCS_TYPES } from './terminal-dbcs.js';
import { QSN, AidKey } from './ibm-codes.js';
import { FKeyHotspot } from './terminal-fkey-hotspot.js';
import { MouseEvents, PointerEvents } from './terminal-device-pointers.js';
import { TextSelect, TEXT_SELECT_MODES, Point } from './terminal-text-selection.js';
import { Clipboard, PasteText, PasteUI } from './terminal-copy-paste.js';
import { Labels } from './terminal-labels.js';
import { Settings, Preferences, LOCAL_STORAGE_KEY } from './terminal-settings.js';
import { CreateStore, StateChangeActionType, StatePropertyInfo, JsonUtil } from './terminal-redux.js';
import { IbmKeypad } from './terminal-ibm-keypad.js';
import { ActionButton } from './terminal-ibm-enter-reset-buttons.js';
import { StringExt } from '../string.js';
import { AjaxRequest } from './terminal-ajax.js';

const MAX_FIELDS_PER_TABLE = 256;
const SETTINGS_OPENING_HEIGHT = 100;
// const MOUSE_POINTER_ID = 1;

const EXPO_INPUT_NAME = {
    Stream5250: '5250_data_stream'
};

const EXPO_OUTPUT_NAME = {
    UserInput: 'UserInput',
    TelnetFlags: 'UserFlags',
    DupFields: 'DupFields'
};


class Terminal {
    constructor() {
        this.settingsStateReducer = this.settingsStateReducer.bind(this);

        this.submitAction = this.submitAction.bind(this);
        this.submitAttention = this.submitAttention.bind(this);
        this.processBegin = this.processBegin.bind(this);
        this.processBTermHelp = this.processBTermHelp.bind(this);
        this.processCopyText = this.processCopyText.bind(this);
        this.processCutText = this.processCutText.bind(this);
        this.processDelete = this.processDelete.bind(this);
        this.moveCursor = this.moveCursor.bind(this);
        this.processDup = this.processDup.bind(this);
        this.processEnd = this.processEnd.bind(this);
        this.processErase = this.processErase.bind(this);
        this.moveCursor = this.moveCursor.bind(this);
        this.processField = this.processField.bind(this);
        this.processFieldExit = this.processFieldExit.bind(this);
        this.processFieldExitEnter = this.processFieldExitEnter.bind(this);
        this.submitHelp = this.submitHelp.bind(this);
        this.processHexInput = this.processHexInput.bind(this);
        this.processInsert = this.processInsert.bind(this);
        this.processLast = this.processLast.bind(this);
        this.processLeftDelete = this.processLeftDelete.bind(this);
        this.processNewLine = this.processNewLine.bind(this);
        this.moveToFieldRelative = this.moveToFieldRelative.bind(this);
        this.processPasteText = this.processPasteText.bind(this);
        this.processRecordHome = this.processRecordHome.bind(this);
        this.processReDirect = this.processReDirect.bind(this);
        this.processReset = this.processReset.bind(this);
        this.executeVirtualKey = this.executeVirtualKey.bind(this);

        this.resizeFcnt = null;

        this.handleOrientationChangeEvent = this.handleOrientationChangeEvent.bind(this);
        this.handleCursorKeyDownEvent = this.handleCursorKeyDownEvent.bind(this);
        this.handleCursorKeyPressEvent = this.handleCursorKeyPressEvent.bind(this);
        this.handleCursorInputEvent = this.handleCursorInputEvent.bind(this);
        this.handleBodySelectStartEvent = this.handleBodySelectStartEvent.bind(this);
        this.handleWindowResizeEvent = this.handleWindowResizeEvent.bind(this);
        this.handleWindowFocusEvent = this.handleWindowFocusEvent.bind(this);
        this.handleWindowBlurEvent = this.handleWindowBlurEvent.bind(this);
        this.handleWindowBeforeUnloadEvent = this.handleWindowBeforeUnloadEvent.bind(this);
        this.handleTerminalMouseWheelEvent = this.handleTerminalMouseWheelEvent.bind(this);
        this.handleBlinkTimerEvent = this.handleBlinkTimerEvent.bind(this);
        
        this.handlePointerStartEvent = this.handlePointerStartEvent.bind(this);
        this.handlePointerMoveEvent = this.handlePointerMoveEvent.bind(this);
        this.handlePointerEndEvent = this.handlePointerEndEvent.bind(this);

        this.handlePasteTimeoutEvent = this.handlePasteTimeoutEvent.bind(this);
        this.handlePasteTextOkEvent = this.handlePasteTextOkEvent.bind(this);
        this.handlePasteTextCancelEvent = this.handlePasteTextCancelEvent.bind(this);

        this.handleSettingsSlideCompleteEvent = this.handleSettingsSlideCompleteEvent.bind(this);
        this.handleSettingsStateChanged = this.handleSettingsStateChanged.bind(this);

        this.handleAjaxResponseEvent = this.handleAjaxResponseEvent.bind(this);

        this.executeMacro = this.executeMacro.bind(this); // Accesible thru window.asnaExpo
        this.regScr = null;
    }

    init() {
        return new Promise((resolve) => {
            TerminalHTML.injectMarkup();

            setTimeout(() => {

                this.termLayout = {
                    w: NaN, h: NaN,
                    _5250: { l: NaN, t: NaN, w: NaN, h: NaN, rows: NaN, cols: NaN, msgLight: false, fontSizePix: NaN, cursor: { w: NaN, h: NaN } },
                    status: { l: NaN, t: NaN, w: NaN, h: NaN }
                };

                this.editMode = 'ovr';
                this.submit = new Submit();

                this.actionMap = TerminalMacros.loadDefault(
                    {
                        begin: this.processBegin,
                        end: this.processEnd,
                        last: this.processLast,
                        recordHome: this.processRecordHome,

                        moveCursor: this.moveCursor,
                        moveToFieldRelative: this.moveToFieldRelative,

                        delete: this.processDelete,
                        leftDelete: this.processLeftDelete,
                        erase: this.processErase,
                        eraseToEndOfField: this.processEraseToEndOfField,

                        newLine: this.processNewLine,
                        insert: this.processInsert,

                        copyText: this.processCopyText,
                        cutText: this.processCutText,
                        pasteText: this.processPasteText,

                        dup: this.processDup,

                        field: this.processField,
                        fieldExit: this.processFieldExit,
                        fieldExitEnter: this.processFieldExitEnter,

                        hexInput: this.processHexInput,
                        redirect: this.processReDirect,
                        reset: this.processReset,

                        submitAction: this.submitAction,
                        submitAttention: this.submitAttention,
                        submitHelp: this.submitHelp,

                        bTermHelp: this.processBTermHelp
                    }
                );

                this.resText = [];
                this.setScreenSize(24, 80, false);   // (24, 80) or (27, 132)
                this.focus = new Focus();
                this.blinkTimerID = null;
                this.lastColTouched = -1;
                this.kbdAhead = [];

                this.settingsStore = new CreateStore(this.settingsStateReducer);
                this.settingsStore.subscribe(this.handleSettingsStateChanged);

                resolve();
            }, 100);
        });
    }

    settingsStateReducer(state, action) {

        if (typeof state === 'undefined') {
            state = {
                colors:
                    this.getCssDefaultColors(Preferences.deserializeColors()),
                show:
                    Preferences.deserializeShow(),
                locations:
                    Preferences.deserializeLocations(),
                detect: {
                    hasPhysicalKeyboard: true /* TO-DO detection logic !!! */
                }
            };
        }

        switch (action.type) {
            case StateChangeActionType.COLOR_CHANGE:
                return {
                    ...state,
                    colors: action.payload
                };

            case StateChangeActionType.RESTORE_DEFAULT_COLORS:
                return {
                    ...state,
                    colors: this.getCssDefaultColors(Preferences.deserializeColors())
                };

            case StateChangeActionType.TOGGLE_SWITCH_STATE_CHANGE:
                {
                    switch (action.payload.id) {
                        case ID.SETTINGS_FK_HOTSPOTSCHECKBOX:
                            return {
                                ...state,
                                show: {
                                    ...state.show,
                                    functionKeyHotspots: action.payload.state
                                }
                            };
                        case ID.SETTINGS_BUTTONSCHECKBOX:
                            return {
                                ...state,
                                show: {
                                    ...state.show,
                                    bigButtons: action.payload.state
                                }
                            };
                        case ID.SETTINGS_IBMKPAD_CHECKBOX:
                            return {
                                ...state,
                                show: {
                                    ...state.show,
                                    ibmKeypad: action.payload.state
                                }
                            };
                    }
                }
                break;

            case StateChangeActionType.LOCATION_CHANGE:
                {
                    switch (action.payload.id) {
                        case 'ibmKeypad':
                            return {
                                ...state,
                                locations: {
                                    ...state.locations,
                                    ibmKeypad: action.payload.location
                                }
                            };
                            // break;
                    }
                }
                break;

            default:
                return state;
        }

        console.error(`Reducer did not return a state!`);
    }

    handleSettingsStateChanged(lastState) {
        if (StatePropertyInfo.didChange(lastState.colors, this.settingsStore.state.colors)) {
            const defaultColors = this.getCssDefaultColors(Preferences.deserializeColors());
            const newColors = this.settingsStore.state.colors;
            if (JsonUtil.equivalent(newColors, defaultColors)) {
                Preferences.removeFromLocalStorage(LOCAL_STORAGE_KEY.COLORS);
            }
            else {
                Preferences.serializeColors(this.settingsStore.state.colors);
            }
            this.updateChromeColors(newColors);
            if (Settings.close()) {
                this.cursorKeyboardEventHandlingOperations('add');
            }
            this.rebuildPage();
        }

        if (lastState.show.functionKeyHotspots !== this.settingsStore.state.show.functionKeyHotspots) {
            Preferences.serializeShow(this.settingsStore.state.show);
            if (this.settingsStore.state.show.functionKeyHotspots) {
                FKeyHotspot.show();
            }
            else {
                FKeyHotspot.hide();
            }
        }

        if (lastState.show.bigButtons !== this.settingsStore.state.show.bigButtons) {
            Preferences.serializeShow(this.settingsStore.state.show);
            if (this.enterBigButton && false /*ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch()*/) {
                this.enterBigButton.showIfEnabled();
            }
        }

        if (lastState.show.ibmKeypad !== this.settingsStore.state.show.ibmKeypad) {
            Preferences.serializeShow(this.settingsStore.state.show);
            if (this.settingsStore.state.show.ibmKeypad) {
                IbmKeypad.show();
            }
            else {
                IbmKeypad.hide();
            }
        }

        if (lastState.locations.ibmKeypad !== this.settingsStore.state.locations.ibmKeypad) {
            Preferences.serializeLocations(this.settingsStore.state.locations);
        }
    }

    render(arg) {
    /*eslint-disable*/
        if (false /* ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch() */) {
            this.setScreenSize(24, 80, false);
            this.resizeFcnt = function () { return { width: this.termLayout.w, height: this.termLayout.h }; };
        }
        /*eslint-enable*/
        else {
            if (typeof arg === 'function') {
                this.resizeFcnt = arg;
            }
            else if (typeof arg === 'object') {
                if (typeof arg.width === 'undefined' || typeof arg.height === 'undefined') {
                    alert('Terminal.Render(parameter error)');
                    return;
                }
                this.resizeFcnt = function () { return { width: arg.width, height: arg.height }; };
            }
            else {
                alert('Terminal.Render(parameter error)');
                return;
            }
        }

        this.DOM = new TerminalDOM();
        this.DOM.findPreFontFamily();
        if (!this.DOM.isValidMonospace())
            this.DOM.setPreFontFamily('Monospace');

        this.lookupTopElements();   // Firefox needs this explicit lookup.
        this.textSelect = new TextSelect(this.AsnaTermTextSelection);

        this.srcStatusbarHtml = document.getElementById(ID.STATUSBAR).innerHTML;

        this.adjustCanvasSize();

        this.eventHandlingOperations('add');

        if (true /* !ASNA.Vendor.IsMobile() */) {
            TerminalRender.clearCanvas(this.AsnaTerm5250);
        }

        // init();
        this.updateChromeColors(this.settingsStore.state.colors);
        this.initTerminal();
        this.readSubmitResponse();

        this.saveInzFieldValues();
        this.saveManFillFieldValues();
        this.newPageCursorInit();
        this.DOM.setTerminalFont(this.termLayout._5250);

        this.DBCS = new DBCS(this.termLayout, this.DOM.preFontFamily);

        this.toolbar = new TerminalToolbar();
        this.toolbar.create(this.termLayout, this.DOM.preFontFamily, this.settingsStore.state.colors);
        if (false /*ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch()*/) {
            // ASNA.TouchableInput.Create(AsnaTerm5250, formatTable, fieldCount, termLayout, calcTextVertPadding(), CHAR_MEASURE.UNDERSCORE_CHAR_HEIGHT);
        }

        new TerminalRender(this.termLayout, this.settingsStore.state.colors, this.DOM.preFontFamily, this.regScr, this.dataSet, this.AsnaTerm5250).render();
        if (Keyboard.state === KEYBOARD_STATE.ERROR) {
            this.overlapErrorLine();
        }

        this.enterBigButton = new ActionButton(ID.ENTER_BIG_BUTTON, this.settingsStore, this.executeVirtualKey, 'ENTER');
        this.enterBigButton.init(Labels.get('KPAD_ENTER'), this.termLayout);
        if (false /*ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch()*/) {
            this.enterBigButton.showIfEnabled();
        }

        this.resetBigButton = new ActionButton(ID.RESET_BIG_BUTTON, this.settingsStore, this.executeVirtualKey, 'RESET');
        this.resetBigButton.init(Labels.get('KPAD_RESET'), this.termLayout);

        this.renderStatusBar();
        this.setBlinkingTimer();
        this.adjust_5250Div();
        this.focus.hasFocus = true;

        if (this.settingsStore.state.detect.hasPhysicalKeyboard) {
            this.activateInput();
        }
        this.updateCursor();
/*
        ASNA.LocalStorage.ReadIbmKpadUserBtns();
*/
        IbmKeypad.init(this.AsnaTermFacade, this.termLayout, this.executeVirtualKey, this.actionMap, this.settingsStore);

        FKeyHotspot.init(this.AsnaTerm5250, this.regScr.hotspotScan(this.termLayout), this.executeVirtualKey, this.settingsStore.state.show.functionKeyHotspots);

        Settings.init(ID.STATUSBAR, SETTINGS_OPENING_HEIGHT, this.settingsStore);
/*
        if (ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch()) {
            _adjustForOrientation();
        }
*/
        IbmKeypad.initialLocation(this.termLayout, this.settingsStore.state.locations.ibmKeypad);
        if (this.settingsStore.state.show.ibmKeypad) {
            IbmKeypad.show();
        }
        /*
        if (ASNA.Vendor.DidNotResizeAfterRemovingKeyboard(termLayout._5250.h)) {
            setTimeout(function () { rebuildPage(); _notifyUserCode(); }, 2000);
        }
        else {*/
            this.pageReplacedNotifyUserCode();
/*
        }
*/
    }

    renderStatusBar() {
        if (this.suspendSBarRender || !this.toolbar) { return; }

        this.toolbar.render(this.cursor, this.editMode, this.submit.activeFKey, Keyboard.state, this.kbdAhead, this.preHelpErrorCode, this.resetBigButton);

        const msgIndicator = document.getElementById(ID.MSG_WAITING);

        if (msgIndicator) {
            const equalSize = this.termLayout.status.h * 0.75;
            const vCentered = (this.termLayout.status.h - equalSize) / 2;

            msgIndicator.style.height = equalSize + 'px';
            msgIndicator.style.width = equalSize + 'px';
            msgIndicator.style.zIndex = ZINDEX.TERMINAL_STATUSBAR;

            msgIndicator.style.left = '2px';
            msgIndicator.style.top = (this.termLayout.status.t + vCentered) + 'px';

            if (this.termLayout._5250.msgLight) {
                msgIndicator.style.display = 'block';
            }
            else {
                msgIndicator.style.display = 'none';
            }
        }
    }

    hideMsgIndicator() {
        const msgIndicator = document.getElementById(ID.MSG_WAITING);
        if (msgIndicator) {
            msgIndicator.style.display = 'none';
        }
    }

    eventHandlingOperations(operation) {
        if (false /*!ASNA.Vendor.IsDesktop()*/) {
            const fDoc = operation === 'add' ? document.addEventListener : document.removeEventListener;
            fDoc('orientationchange', this.handleOrientationChangeEvent, false);
        }
        else {
            this.cursorKeyboardEventHandlingOperations(operation);
        }

        this.deviceEventHandlingOperations(operation);

        const fDocBody = operation === 'add' ? document.body.addEventListener : document.body.removeEventListener;

        fDocBody('selectstart', this.handleBodySelectStartEvent, false);
        this.windowEventHandlingOperations(operation);

        if (this.AsnaTerm5250) {
            const fTerm = operation === 'add' ? this.AsnaTerm5250.addEventListener : this.AsnaTerm5250.removeEventListener;

            fTerm('mousewheel', this.handleTerminalMouseWheelEvent, false);
            fTerm('DOMMouseScroll', this.handleTerminalMouseWheelEvent, false); // Firefox
        }
    }

    windowEventHandlingOperations(operation) {
        const fWin = operation === 'add' ? window.addEventListener : window.removeEventListener;

        fWin('focus', this.handleWindowFocusEvent, false);
        fWin('blur', this.handleWindowBlurEvent, false);
        fWin('resize', this.handleWindowResizeEvent, false);
        fWin('beforeunload', this.handleWindowBeforeUnloadEvent, false);
    }

    deviceEventHandlingOperations(operation) {
        if (operation === 'add') {
            this.devicePointers = null;
        }

        if (!this.devicePointers) {
            if (false /*!ASNA.Vendor.IsDesktop()*/) {
                this.devicePointers = new PointerEvents();
            }
            else {
                this.devicePointers = new MouseEvents();
            }
        }
        const fPointer = operation === 'add' ? this.devicePointers.addEventListener : this.devicePointers.removeEventListener;

        fPointer(window, this.handlePointerStartEvent, this.handlePointerMoveEvent, this.handlePointerEndEvent, null);
    }

    cursorKeyboardEventHandlingOperations(operation) {
        const fCursor = operation === 'add' ? this.termCursor.addEventListener : this.termCursor.removeEventListener;

        fCursor('keydown', this.handleCursorKeyDownEvent, false);
        fCursor('keypress', this.handleCursorKeyPressEvent, false);
        fCursor('input', this.handleCursorInputEvent, false);
    }

    lookupTopElements() {

        if (!this.AsnaTermFacade) {
            this.AsnaTermFacade = document.getElementById(ID.CANVAS);
        }

        if (!this.AsnaTerm5250) {
            this.AsnaTerm5250 = document.getElementById(ID._5250_TEXT);
        }

        this.termCursor = document.getElementById(ID.CURSOR);

        if (!this.AsnaTermTextSelection) {
            this.AsnaTermTextSelection = document.getElementById(ID.SELECTION);
        }
        this.AsnaTermTextSelection.style.zIndex = ZINDEX.TERMINAL_TEXT_SELECTION;

        this.beep = new Beep(ID.ERROR_SOUND);

        if (this.termCursor) {
            if ( true /*ASNA.Vendor.IsDesktop() || ASNA.Vendor.IsWin8Touch() */) {
                if (this.termCursor.tagName !== 'INPUT') {  // backwards compatibility
                    this.termCursor = this.DOM.replaceWithInputText(this.termCursor);
                }

                this.termCursor.maxLength = 1;
                if (typeof (this.termCursor.autocomplete) !== 'undefined') {
                    this.termCursor.autocomplete = 'off';
                }
            }
            else {
                this.termCursor.style.display = 'block';
            }
        }
    }

    adjustCanvasSize() {
        const requestedSize = this.resizeFcnt();

        this.termLayout.w = requestedSize.width;
        this.termLayout.h = requestedSize.height;

        // PENDING !!! ASNA.FingerSwipe.SetDistanceThreshold(ASNA.Common.ToPixel(null, '30mm'));

        this.AsnaTermFacade.style.width = this.termLayout.w + 'px';
    }

    setScreenSize(totalRows, totalCols, msgLight) {
        // +------------------------------
        // |
        // | _5250
        // |
        // |
        // |
        // +------------------------------
        // + status toolbar
        // +------------------------------

        this.termLayout._5250.rows = totalRows;
        this.termLayout._5250.cols = totalCols;
        this.termLayout._5250.msgLight = msgLight;

        if (this.termLayout.h > 0) {
            this.termLayout.status.h = this.termLayout.h / (this.termLayout._5250.rows + 1); // Rows + Statusbar

            let rowHeightPix = this.termLayout.status.h;
            let rowCellWidth = this.termLayout.w / this.termLayout._5250.cols;

            this.termLayout._5250.w = rowCellWidth * this.termLayout._5250.cols;
            this.termLayout._5250.h = rowHeightPix * this.termLayout._5250.rows;

            this.termLayout._5250.cursor.w = rowCellWidth;
            this.termLayout._5250.cursor.h = rowHeightPix;

            this.termLayout._5250.fontSizePix = rowHeightPix - this.calcLineWidth(rowHeightPix); // font-size is adjusted later, by measuring width.
            this.termLayout._5250.t = 0;

            this.termLayout.status.l = 0;
            this.termLayout.status.t = this.termLayout.h - this.termLayout.status.h;
        }
    }

    calcLineWidth(baseHeight) {
        return baseHeight / 20;
    }

    getCssDefaultColors(defaults) {
        let result = { green: defaults.green, blue: defaults.blue, red: defaults.red, white: defaults.white, turquoise: defaults.turquoise, yellow: defaults.yellow, pink: defaults.pink, bkgd: defaults.bkgd, cursor: defaults.cursor, sel: defaults.sel, statBarColor: defaults.statBarColor, statBarBkgdColor: defaults.statBarBkgdColor };
        let ctDiv = document.createElement('div');
        document.body.appendChild(ctDiv);

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_GREEN')) {
            result.green = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_GREEN', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_BLUE')) {
            result.blue = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_BLUE', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_RED')) {
            result.red = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_RED', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_WHITE')) {
            result.white = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_WHITE', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_TURQUOISE')) {
            result.turquoise = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_TURQUOISE', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_YELLOW')) {
            result.yellow = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_YELLOW', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_PINK')) {
            result.pink = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_PINK', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_BKGD')) {
            result.bkgd = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_BKGD', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_CURSOR')) {
            result.cursor = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_CURSOR', 'color');
        }

        if (TerminalDOM.cssSelectorExists('.AsnaTermDEF_SEL')) {
            result.sel = TerminalDOM.cssApplyAndGetAttr(ctDiv, 'AsnaTermDEF_SEL', 'color');
        }

        const SB_CLASS = 'AsnaTermDEF_STATUSBAR';
        if (TerminalDOM.cssSelectorExists('.' + SB_CLASS)) {
            result.statBarColor = TerminalDOM.cssApplyAndGetAttr(ctDiv, SB_CLASS, 'color');
            result.statBarBkgdColor = TerminalDOM.cssApplyAndGetAttr(ctDiv, SB_CLASS, 'background-color');
        }

        document.body.removeChild(ctDiv);
        return result;
    }

    submitAttention() {
        const flags = '40';// Bit 1 set, where bit 0 is msb and bit 7 is lsb.
        if (this.submit.prepare('Attn', TerminalDOM.getOutputElement(EXPO_OUTPUT_NAME.TelnetFlags), flags)) {
            this.doSubmit();
        }
    }

    processBegin(changeRowAllowed) {
        // Place cursor at the start of a field.
        if (!Screen.isRowColInInputPos(this.regScr, this.cursor.row, this.cursor.col)) {
            return false;
        }

        const newPos = this.regScr.getStartOfFieldPos(changeRowAllowed, this.cursor.row, this.cursor.col);
        return this.moveToPos(newPos + 1);
    }

    processEnd() {
        // Place cursor at the end of a field.
        if (!Screen.isRowColInInputPos(this.regScr, this.cursor.row, this.cursor.col)) {
            return false;
        }

        // If cursor positioned at a field, move to the end of the field (right most non-blank position).
        const endFldRowCol = this.regScr.peekOnePastEndOfField(this.cursor.row, this.cursor.col);
        if (!endFldRowCol) {
            return false;
        }

        const onePastEndFldPos = this.regScr.coordToPos(endFldRowCol.row, endFldRowCol.col);

        if (onePastEndFldPos > 0) {
            return this.moveToPos(onePastEndFldPos - 1, true);
        }

        return false;
    }

    processBTermHelp() {
        const url = 'https://asna.com/us/products/bterm';

        this.submit.activeFKey = 'Redirecting';
        if (false /* ASNA.Vendor.IsMobile() && ASNA.Vendor.IsFullScreen()*/) {
            if (!ASNA.Native.LinkOutToDefaultBrowser(url)) {
                const aEl = document.createElement('A');
                if (aEl) {
                    document.body.appendChild(aEl);
                    aEl.setAttribute('href', url);
                    const dispatch = document.createEvent('HTMLEvents');
                    dispatch.initEvent('click', true, true);
                    aEl.dispatchEvent(dispatch);
                }
            }
        }
        else {
            if (typeof window.open === 'function') {
                window.open(url);
            }
        }
    }

    processCopyText(noResetSelection) {
        if (this.textSelect.mode !== TEXT_SELECT_MODES.COMPLETE || !this.textSelect.selectedRect) {
            return false;
        }

        const selRange = this.getSelRange();
        const toPos = selRange.to;
        let pos = selRange.from;
        let text = '';
        const map = new BufferMapping(this.termLayout._5250.cols);

        while (pos <= toPos) {
            const rowBefore = map.rowFromPos(pos);
            const colBefore = map.colFromPos(pos);

            if (colBefore < this.textSelect.selectedRect.col || colBefore > (this.textSelect.selectedRect.col + (this.textSelect.selectedRect.cols - 1))) {
                text += this.addNewLineRowChanged(++pos, rowBefore);
                continue;
            }

            let character = this.regScr.buffer[pos];
            if (character === '\0') {
                character = ' ';
            }

            text = text + character;
            text += this.addNewLineRowChanged(++pos, rowBefore);
        }

        Clipboard.setText( text );
        if (!noResetSelection) {
            this.textSelect.reset();
        }
        this.updateCursor();

        return true;
    }

    processCutText(noClipboardCopy) {
        if (!noClipboardCopy && !this.processCopyText(true)) {
            return;
        }

        const selRange = this.getSelRange();
        let pos = selRange.from;
        const fromPos = pos;
        const toPos = selRange.to;


        const map = new BufferMapping(this.termLayout._5250.cols);

        while (pos <= toPos) {
            const colBefore = map.colFromPos(pos);

            if (colBefore < this.textSelect.selectedRect.col || colBefore > (this.textSelect.selectedRect.col + (this.textSelect.selectedRect.cols - 1))) {
                pos = pos + 1;
                continue;
            }

            if (this.regScr.attrMap[pos].usage !== 'o') {
                this.regScr.buffer[pos] = ' ';
            }
            pos = pos + 1;
        }
        this.renderInputArea(fromPos, toPos);
        this.textSelect.reset();
        this.updateCursor();
    }

    processDelete() {
        if (this.textSelect.mode === TEXT_SELECT_MODES.COMPLETE) {
            this.processCutText(true);
        }
        else if (Screen.isRowColInInputPos(this.regScr, this.cursor.row, this.cursor.col)) {
            this.doDelete();
        }
    }

    doDelete() {
        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);

        const inputArea = this.regScr.getInputAreaAt(pos);
        const inputstr = this.regScr.copyInputBuffer(inputArea);
        const relNewPos = pos - inputArea.initialPos;
        let newInputStr;

        if (relNewPos > 0) {
            newInputStr = inputstr.substring(0, relNewPos) + inputstr.substring(relNewPos + 1);
        }
        else {
            newInputStr = inputstr.substring(relNewPos + 1);
        }

        this.postProcessInputArea(newInputStr, inputArea, this.cursor.row, this.cursor.col);
    }

    doBackSpace(newRow, newCol) {
        const newPos = this.regScr.coordToPos(newRow, newCol);
        const inputArea = this.regScr.getInputAreaAt(newPos);
        var inputstr = this.regScr.copyInputBuffer(inputArea);
        var relNewPos = newPos - inputArea.initialPos;
        var newInputStr;

        if (relNewPos > 0) {
            newInputStr = inputstr.substring(0, relNewPos) + inputstr.substring(relNewPos + 1);
        }
        else {
            newInputStr = inputstr.substring(relNewPos + 1);
        }

        this.postProcessInputArea(newInputStr, inputArea, newRow, newCol);
    }

    moveCursor(where) {
        const oldRow = this.cursor.row;
        const oldCol = this.cursor.col;
        let dirtyInputFld = false;

        this.preHelpErrorCode = null;
        this.offscreenPos = 0;

        switch (where) {
            case 'LEFT':
                this.cursor.col--;
                break;

            case 'RIGHT':
                this.cursor.col++;
                dirtyInputFld = true;
                break;

            case 'UP':
                this.cursor.row--;
                break;

            case 'DOWN':
                this.cursor.row++;
                break;
        }

        this.cursor.adjustToBounds(this.termLayout._5250);

        if (oldCol === this.cursor.col && oldRow === this.cursor.row) {
            return; // No change ...
        }
        this.updateCursor(dirtyInputFld);
        this.renderStatusBar();
    }

    processDup() {
        if (!this.isCursorInInputPos()) {
            return;
        }

        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        const fld = this.regScr.attrMap[pos].field;

        if (!fld) {
            return;
        }

        if (!this.isDupFld(fld)) {
            this.setPreHelpError('0019');
            return;
        }

        const endFldPos = (this.regScr.coordToPos(fld.row, fld.col) + fld.len) - 1;
        fld.dupChars = (endFldPos - pos) + 1;

        for (let i = 0; i < fld.dupChars; i++)
            this.writeOneCharAtCursor(FAKE_DUP);

        fld.ffw.mdt = true;

        this.renderInputArea(pos, endFldPos);

        if (this.isAutoEnterFld(fld)) {
            this.submitAction(QSN.ENTER, false, 'dup');
        }
        else {
            this.moveToFieldRelative('NEXT');
        }
    }

    processErase() {
        if (typeof (this.inzFldValTable) === 'undefined' || this.inzFldValTable.length !== this.dataSet.fieldCount) {
            return;
        }

        for (let fldIndex = 0; fldIndex < this.dataSet.fieldCount; fldIndex++) {
            const fld = this.dataSet.formatTable[fldIndex];
            this.dataSet.setFieldValue(fld, this.inzFldValTable[fldIndex]);
            fld.ffw.mdt = false;
            fld.dupChars = 0;

            const fromPos = this.regScr.coordToPos(fld.row, fld.col);
            const toPos = fromPos + fld.len;
            this.renderInputArea(fromPos, toPos);
        }

        this.preHelpErrorCode = null;
    }

    processField(sign) { // Erase the  rest of the field and move the cursor to the next field. For numeric fields, change the sign to $sign$.
        let signVal = sign;

        if (sign === '+') {
            signVal = '\0';
        }

        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        const field = TerminalRender.lookupFieldWithPosition(pos, this.termLayout, this.dataSet);
        if (!field) {
            return false;
        }

        const inputArea = this.regScr.getInputAreaAt(pos);
        if (this.processFieldExit(true) && (field.ffw.shiftEdit.signedNumeric || field.ffw.shiftEdit.numericOnly)) {
            if (field.ffw.shiftEdit.signedNumeric) {
                this.regScr.buffer[inputArea.initialPos + field.len - 1] = signVal;
            }
            else if (sign === '-' && field.ffw.shiftEdit.numericOnly) {
                this.regScr.buffer[inputArea.initialPos + field.len - 1] = this.lookupNegativeDigit(this.regScr.buffer[inputArea.initialPos + field.len - 1]);
            }

            this.renderInputArea(inputArea.initialPos + inputArea.len - 1, inputArea.initialPos + inputArea.len);

            if (this.isAutoEnterFld(field)) {
                this.submitAction(QSN.ENTER, false, 'fld+-');
            }
        }
    }

    processFieldExit(dontHandleAutoEnter, justErase) {   // Erase the rest of the field and move cursor to next input field.
        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        const field = TerminalRender.lookupFieldWithPosition(pos, this.termLayout, this.dataSet);

        if (!field) {
            return false;
        }

        const inputArea = this.regScr.getInputAreaAt(pos);
        const value = this.dataSet.getFieldValue(field);
        const firstChrPos = this.findfirstChrPosition(value);
        const upToCursorPos = pos - inputArea.initialPos;
        let adjValue = '';

        // Take field value up to the cursor position.
        if (firstChrPos >= 0 && upToCursorPos > firstChrPos && upToCursorPos < field.len) {
            adjValue = value.substring(firstChrPos, upToCursorPos + offscreenPos);
        }

        // Adjust field value according to FFW
        if (field.ffw.shiftEdit.signedNumeric) { // Adjust right and leave space for sign
            this.dataSet.setFieldValue(field, StringExt.nulls(field.len - adjValue.length - 1) + adjValue);
        }
        else if (field.ffw.mf.rightAdjZeroFill) {
            this.dataSet.setFieldValue(field, StringExt.zeros(field.len - adjValue.length) + adjValue);
        }
        else if (field.ffw.mf.rightAdjBlankFill) {
            this.dataSet.setFieldValue(field, StringExt.blanks(field.len - adjValue.length) + adjValue);
        }
        else {
            adjValue = adjValue + StringExt.nulls(field.len - adjValue.length);
            this.dataSet.setFieldValue(field, adjValue); // No adjust, but truncate to cursor pos.
        }

        this.renderInputArea(inputArea.initialPos, inputArea.initialPos + inputArea.len);
        this.moveToFieldRelative('NEXT');

        if (!justErase) {
            if (!dontHandleAutoEnter && this.isAutoEnterFld(field)) {
                this.submitAction(QSN.ENTER, false, 'fldExit');
            }
        }

        return true;
    }

    processFieldExitEnter() {
        if (this.processFieldExit(true)) {
            this.submitAction(QSN.ENTER, false, 'fldExitEnter');
        }
    }

    processEraseToEndOfField() {
        this.processFieldExit(true, true);
        this.updateCursor();
    }

    lookupNegativeDigit(digit) {
        var negDigit = '}'; // default to '0'
        switch (digit) {
            case '1': negDigit = 'J'; break;
            case '2': negDigit = 'K'; break;
            case '3': negDigit = 'L'; break;
            case '4': negDigit = 'M'; break;
            case '5': negDigit = 'N'; break;
            case '6': negDigit = 'O'; break;
            case '7': negDigit = 'P'; break;
            case '8': negDigit = 'Q'; break;
            case '9': negDigit = 'R'; break;
        }
        return negDigit;
    }

    submitHelp() {
        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        const currFld = TerminalRender.lookupFieldWithPosition(pos, this.termLayout, this.dataSet);

        if (currFld && this.isReqFieldExitFld(currFld)) {
            this.setPreHelpError('0020');
            return;
        }

        if (!this.preHelpErrorCode && (!this.errScr)) {
            this.submitAction(QSN.HELP, false, 'help');
            return;
        }

        const flagsHiddenElement = document.getElementsById(EXPO_FIELD_NAME.TelnetFlags);
        const req5250DataHiddenEl = document.getElementsById(EXPO_FIELD_NAME.Request);

        if (!req5250DataHiddenEl || !flagsHiddenElement) {
            return;
        }

        flagsHiddenElement.value = '01'; // Bit 7 set, where bit 0 is msb and bit 7 is lsb.
        if (this.preHelpErrorCode) {
            req5250DataHiddenEl.value = Base64.encode(UnicodeToUTF8.getArray(this.preHelpErrorCode));
        }
        else {
            req5250DataHiddenEl.value = ''; // Server will get data from error line (cols 2-5), convert to packed and send to IBMi
        }

        this.submit.activeFKey = 'Help';

        this.doSubmit();
    }

    processHexInput() {
        const response = prompt(Labels.get('HexEntryPrompt', ''));
        if (!response) {
            return;
        }
        if (response.length === 1) {
            this.processCharacter(response);
        }
        else if (response.length === 4 && Validate.validateHex(response)) {
            const decVal = parseInt(response, 16); 
            if (decVal >= 64 && decVal <= 254) { // SEU allows X'40' through X'FE' 
                this.processCharacter(String.fromCharCode(decVal));
            }
        }
    }

    processInsert() {
        if (this.editMode === 'insert') {
            this.editMode = 'ovr';
        }
        else {
            this.editMode = 'insert';
        }

        this.updateCursor();
        this.renderStatusBar();
    }

    processLast() {
        if (!Screen.isRowColInInputPos(this.regScr, this.cursor.row, this.cursor.col)) {
            return false;
        }

        // If cursor positioned at a field, move to the end of the field (right most non-blank position).
        const endFldRowCol = this.regScr.peekOnePastEndOfField(this.cursor.row, this.cursor.col);
        if (!endFldRowCol) {
            return false;
        }

        const currentPos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        const onePastEndFldPos = this.regScr.coordToPos(endFldRowCol.row, endFldRowCol.col);

        if (onePastEndFldPos <= 0) {
            return false;
        }

        let newPos = onePastEndFldPos; // Like Mocha, if the field is full, position on top of the last position in the field.

        // Otherwise, leave position one past the field.
        if (this.regScr.buffer[newPos - 1] === '\0' || this.regScr.buffer[newPos - 1] !== ' ') {
            newPos = newPos - 1;

            while (newPos > 0 && (this.regScr.buffer[newPos] === '\0' || this.regScr.buffer[newPos] === ' ')) {
                newPos--;
            }

            if (newPos < currentPos) {
                return false;
            }

            newPos++;
        }

        this.moveToPos(newPos, true);
        return true;
    }

    processLeftDelete() {
        let newCol = this.cursor.col - 1;
        let newRow = this.cursor.row;

        if (newCol < 0) {
            newCol = termLayout._5250.cols - 1;
            newRow = newRow - 1;
        }

        if (newRow >= 0) {
            if (Screen.isRowColInInputPos(this.regScr, newRow, newCol)) {
                this.doBackSpace(newRow, newCol);
            }
            else if (this.autoAdvance) {
                if (this.moveToPrevInputArea(newRow, newCol)) {
                    return this.processLeftDelete();
                }
            }
        }

        return false;
    }

    processNewLine() {
        const map = new BufferMapping(this.termLayout._5250.cols);

        const initialPos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        this.cursor.col = 0;
        this.moveCursor('DOWN');

        while (!Screen.isRowColInInputPos(this.regScr, this.cursor.row, this.cursor.col)) {
            let pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col) + 1;

            if (pos >= this.regScr.buffer.length) {
                pos = 0;
            }

            this.cursor.col = map.colFromPos(pos);
            this.cursor.row = map.rowFromPos(pos);

            if (pos === initialPos || this.regScr.attrMap[pos].field) {  // back to the original position. Break infinite loop.
                break;
            }
        }

        this.processBegin(false);
    }

    moveToFieldRelative(newPos) {
        this.preHelpErrorCode = null;

        if (Screen.isRowColInInputPos(this.regScr, this.cursor.row, this.cursor.col)) {
            let rowCol = null;

            if (newPos === 'NEXT') {
                rowCol = this.regScr.peekOnePastEndOfField(this.cursor.row, this.cursor.col);
            }
            else { // 'PREV' assumed
                rowCol = this.regScr.peekOnePrevStartOfField(this.cursor.row, this.cursor.col);
            }

            if (!rowCol) {
                return false;
            }

            this.cursor.setPosition(rowCol.row, rowCol.col);
        }

        if (newPos === 'NEXT') {
            return this.moveToNextInputArea(this.cursor.row, this.cursor.col);
        }

        // 'PREV' assumed
        if (this.moveToPrevInputArea(this.cursor.row, this.cursor.col)) {
            this.moveToStartOfField();
        }
    }

    processPasteText(nonbreaking) {
        if (PasteText.mode === 'pending' && Keyboard.state !== KEYBOARD_STATE.NORMAL || this.preHelpErrorCode) {
            return; // ignore
        }

        PasteText.mode = 'pending';

        setTimeout(() => { this.handlePasteTimeoutEvent(nonbreaking); }, 100);// Delay operation to avoid Firefox re-entrant code ...
    }

    handlePasteTimeoutEvent(nonbreaking) {
        if (window.clipboardData && typeof window.clipboardData.getData === 'function') {
            const text = window.clipboardData.getData('Text'); 
            if (text) {
                this.doPasteText(text, nonbreaking);
                Clipboard.text = text;
                PasteText.mode = 'idle';
            }
        }
        else if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
            navigator.clipboard.readText().then(function (clipText) {
                theTerminal.doPasteText(clipText, nonbreaking);
                Clipboard.text = clipText;
                PasteText.mode = 'idle';
            });
        }
        else {
            this.eventHandlingOperations('remove');
            this.lastFocus = document.activeElement;
            PasteUI.askUserVerify(
                Clipboard.text,
                nonbreaking,
                Labels.get('ConfirmPasteMsg'),
                Labels.get('ConfirmPasteDlgWantsEnter'),
                Labels.get('ConfirmPasteDlgOk'),
                Labels.get('ConfirmPasteDlgCancel'),
                this.handlePasteTextOkEvent,
                this.handlePasteTextCancelEvent
            );
        }
    }

    doPasteText(text, nonbreaking) {
        if (this.textSelect.mode === TEXT_SELECT_MODES.COMPLETE) { // Position at the upper-left corner of selection.
            this.cursor.setPosition(this.textSelect.selectedRect.row, this.textSelect.selectedRect.col);
        }

        let iNLcol = this.cursor.col;
        let exactJumper = { i: -1, to: -1 };
        this.suspendSBarRender = true;

        let fromPos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        let pos = fromPos;
        const map = new BufferMapping(this.termLayout._5250.cols);

        if (nonbreaking && nonbreaking === 'nb') {
            let done = false;

            for (let i = 0, l = text.length, maxPos = this.regScr.attrMap.length; i < l && pos < maxPos; i++) {
                let c = text.charAt(i);

                while (i < l && pos < maxPos && (c === '\r' || c === '\n')) {
                    pos = this.regScr.coordToPos(this.cursor.row + 1, iNLcol);
                    i++;
                    if (i < l) {
                        let nc = text.charAt(i);
                        if (c === '\r' && nc === '\n') { i++ }

                        c = text.charAt(i);
                        this.cursor.setPosition(map.rowFromPos(pos), map.colFromPos(pos));

                        const row = this.cursor.row;
                        this.cursor.adjustToBounds();
                        if (this.cursor.row < row) {
                            done = true;
                            break;
                        }
                    }
                }

                if (done || i >= l || pos >= maxPos) {
                    break;
                }

                sa = this.regScr.attrMap[pos];
                if (!sa || sa.usage === 'o') {
                    pos++;
                    if (pos < maxPos) {
                        this.cursor.setPosition(map.rowFromPos(pos), map.colFromPos(pos));

                        const row = this.cursor.row;
                        this.cursor.adjustToBounds();
                        if (this.cursor.row < row) {
                            break;
                        }
                    }
                    continue;
                }

                const fld = sa.field;  
                if (fld) {
                    if (fld.ffw && fld.ffw.monocase) {
                        c = c.toUpperCase();
                    }
                    fld.dirty = true;
                    fld.dupChars = 0;
                }
                if (c.charCodeAt(0) < 0x20) { c = ' '; }

                this.cursor.setPosition(map.rowFromPos(pos), map.colFromPos(pos));
                this.writeOneCharAtCursor(c);

                pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
            }
        }
        else {
            for (let i = 0, l = text.length; i < l; i++) {
                if (i === exactJumper.i) {
                    i = exactJumper.to;
                }
                let c = text.charAt(i);

                while (i < l && (c === '\r' || c === '\n')) {
                    pos = this.regScr.coordToPos(this.cursor.row + 1, iNLcol);
                    i++;
                    if (i < l) {
                        let nc = text.charAt(i);
                        if (c === '\r' && nc === '\n') { i++; }
                        c = text.charAt(i);
                        this.cursor.setPosition(map.rowFromPos(pos), map.colFromPos(pos));
                    }
                }

                if (i >= l) {
                    break;
                }

                const row = this.cursor.row;
                pos = this.nextPastablePosition(c);

                if (pos < 0 || this.cursor.row < row) {
                    break;
                }

                while (!this.isCursorInInputPos() || !this.isValidPosForChar(pos, c)) {
                    if (!this.moveToNextInputArea(this.cursor.row, this.cursor.col)) {
                        break;
                    }
                    pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
                }

                const sa = this.regScr.attrMap[pos];
                if (!sa || sa.usage === 'o' || !sa.field) {
                    break; // Logic error. This should never happen!
                }

                if (sa.field.ffw !== undefined && sa.field.ffw.monocase) {
                    c = c.toUpperCase();
                }

                sa.field.ffw.mdt = true;
                sa.field.dupChars = 0;

                if (c === ' ') {
                    if (this.lineBreakFollows(text, i + 1)) {
                        continue;
                    }

                    let fieldStartPos = this.regScr.peekOnePrevStartOfFieldPos(pos);
                    if (fieldStartPos) {
                        fieldStartPos = this.regScr.coordToPos(fieldStartPos.row, fieldStartPos.col) + 1;

                        if (pos > fromPos && pos === fieldStartPos) {
                            continue; // eliminate blanks at the start of an input-capable field (but not the first one)
                        }
                        else {
                            let fieldEndPos = this.regScr.peekOnePastEndOfFieldPos(pos);

                            if (fieldEndPos) {
                                fieldEndPos = this.regScr.coordToPos(fieldEndPos.row, fieldEndPos.col) - 1;

                                const wordLen = PasteText.measureWord(text, i + 1);
                                const avail = fieldEndPos - pos;
                                if (wordLen > avail) { // Word does not fit.
                                    while (pos <= fieldEndPos) {
                                        this.writeOneCharAtCursor(' ');    // Fill field with blanks
                                        pos++;
                                    }
                                    continue; // Next non-blank will be pasted on next field.
                                }
                                else if (wordLen === avail) {
                                    let lb, nxtWBIndex = i + 1 + wordLen;
                                    if ((lb = this.lineBreakFollows(text, nxtWBIndex))) {
                                        exactJumper = { i: nxtWBIndex, to: indexSkipNL(text, lb.brIndex) };
                                    }
                                }
                            }
                        }
                    }
                }

                if (c.charCodeAt(0) < 0x20) {
                    c = ' ';
                }
                this.writeOneCharAtCursor(c);
            }
        }

        this.renderInputArea(fromPos, pos);

        this.updateCursor();
        this.suspendSBarRender = false;
        this.renderStatusBar();
    }

    nextPastablePosition(c) {
        let pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        let notValidForChar;

        while (!this.isCursorInInputPos() || !(notValidForChar = this.isValidPosForChar(pos, c))) {
            let field = null;

            if (this.isCursorInInputPos() && !notValidForChar) {
                field = TerminalRender.lookupFieldWithPosition(this.regScr.coordToPos(this.cursors.row, this.cursor.col), this.termLayout, this.dataSet);
                if (!this.moveToEndOfField(pos))
                    return -1;
            }

            if (!this.moveToNextInputArea(this.cursor.row, this.cursor.col)) {
                return -1;
            }

            let nextField;
            if (field && (nextField = TerminalRender.lookupFieldWithPosition(this.regScr.coordToPos(this.cursor.row, this.cursor.col, this.termLayout, this.dataSet))) && field === nextField) {
                return -1; // Character was not valid for current field and there is only one input field on the page.
            }

            if (this.textSelect.mode === TEXT_SELECT_MODES.COMPLETE) {
                const selRange = this.getSelRange();

                if (pos > selRange.to) {  // Outside the selection. Abort paste.
                    return -1;
                }

                if (this.cursor.col > this.textSelect.selectedRect.col + this.textSelect.selectedRect.cols) {
                    this.cursor.setPosition(this.cursor.row + 1, selectedRect.col);
                }
            }

            pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        }

        return pos;
    }

    lineBreakFollows(text, index) {
        if (index >= text.length) {
            return null;
        }

        let c = text.charAt(index);
        while (c === ' ' && index < text.length) {  // Skip leading spaces.
            index++;
            c = text.charAt(index);
        }
        if (c === '\r' || c === '\n')
            return { brIndex: index };

        return null;
    }

    processRecordHome() {
        const oldPos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        const currFld = TerminalRender.lookupFieldWithPosition(oldPos, this.termLayout, this.dataSet);

        if (currFld && this.isReqFieldExitFld(currFld)) {
            this.setPreHelpError('0020');
            return;
        }

        // Move to first field, position 1 - cursor may be at any place on the screen.
        if (this.moveToNextInputArea(0, 0)) {
            const newPos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);

            if (oldPos === newPos) {   // Already at Home, submit 'Record Backspace'
                this.submitAction(QSN.RECBS, false);
            }
        }
    }

    processReDirect(pageRelativeToThisJavaScriptFile) {
        if (!pageRelativeToThisJavaScriptFile) {
            return;
        }

        this.submit.activeFKey = 'Redirecting';
        window.location = pageRelativeToThisJavaScriptFile;
    }

    processReset() {
        if (Keyboard.state === KEYBOARD_STATE.ERROR) {
            this.removeErrorLine();
            this.resetErrorState();
            this.renderStatusBar();
            this.updateCursor();
        }

        if (this.preHelpErrorCode) {
            this.preHelpErrorCode = null;
            this.renderStatusBar();
        }
        this.textSelect.reset();
    }

    removeErrorLine() {    // put back the saved buffer and saved attrMap

        if (this.errorCondition && this.errorCondition.hasSavedScreen()) {
            this.errorCondition.restoreLastScreenRow(this.regScr);
        }

        TerminalRender.clearCanvas(this.AsnaTerm5250);
        this.renderTerminal();
    }

    resetErrorState() {
        // don't mess with the cursor!
        this.errorCondition = null;
        Keyboard.state = KEYBOARD_STATE.NORMAL;
    }

    submitAction(aidKey, useFormPost, /*, exitReason -> used for debugging */ ) {
        if (!aidKey || Keyboard.state === KEYBOARD_STATE.AJAX_WAIT) {
            return;
        }

        let request = `${aidKey},${this.cursor.row + 1},${this.cursor.col + 1},${this.dataSet.fieldCount}`;

        if (this.dataSet.fieldCount > 0) {
            request += ',';
        }

        const runMandatoryValidation = !this.shouldBypassMandatoryValidation(aidKey);

        for (let index = 0; index < this.dataSet.fieldCount; index++) {
            const fld = this.dataSet.formatTable[index];

            request += `${fld.row + 1},${fld.col + 1},`;

            let fldVal = this.dataSet.getFieldValue(fld);

            if (fld.dbcsType !== 'n') {
                fldVal = this.DBCS.formatFieldValue(fldVal, fld.len, fld.dbcsType);
            }

            if (runMandatoryValidation) {
                let manErr = '';
                if (DataSet.isMandatoryEntry(fld) && this.dataSet.anyFieldModified() && !DataSet.isModifiedDataTag(fld)) {
                    manErr = '0007';
                }
                else if (DataSet.isMandatoryFill(fld) &&
                    DataSet.isModifiedDataTag(fld) &&
                    this.mandatoryFill &&
                    !DataSet.allPosChanged(this.regScr, this.mandatoryFill, fld)) {
                    manErr = '0014';
                }

                if (manErr) {
                    this.setPreHelpError(manErr);
                    this.cursor.setPosition(formatTable[index].row, formatTable[index].col);
                    this.updateCursor();
                    this.renderStatusBar();
                    return;
                }
            }

            if (fld.dupChars > 0) {
                if (fld.dupChars < fld.len) {
                    fldVal = fldVal.substring(0, fld.len - fld.dupChars); // No need to send the fake DUP(s), just send non dup chars.
                }
                else {
                    fldVal = '';
                }
            }

            request += `${fldVal.length},${fldVal}`;

            if (index + 1 < this.dataSet.fieldCount) {
                request += ',';
            }
        }

        const encRequest = Base64.encode(UnicodeToUTF8.getArray(request));
        const dupFldsReq = this.dataSet.listReqDupFlds();

        this.renderStatusBar();

        if (useFormPost || typeof window.FormData !== 'function') { // forced or because Browsers is too old.
            this.postForm(aidKey, encRequest, dupFldsReq);
            return;
        }

        Keyboard.state = KEYBOARD_STATE.AJAX_WAIT;
        document.body.style.cursor = 'wait';
        /// ASNA.Pointer.CancelMoveEvents(window);
        // ASNA.Pointer.RemoveListenToEvents(window);

        AjaxRequest.sendRequest(AidKey.ToString(aidKey), encRequest, '', dupFldsReq, this.handleAjaxResponseEvent);
    }

    postForm(aidKey, encRequest, dupFldsReq) {
        const request = TerminalDOM.getOutputElement(EXPO_OUTPUT_NAME.UserInput);
        if (!request) {
            this.doSubmit();
            return;
        }

        request.value = encRequest;

        const dupFields = TerminalDOM.getOutputElement(EXPO_OUTPUT_NAME.DupFields);
        if (dupFields) {
            dupFields.value = dupFldsReq;
        }

        const telenetFlags = TerminalDOM.getOutputElement(EXPO_OUTPUT_NAME.TelnetFlags);
        if (this.submit.prepare(AidKey.ToString(aidKey), telenetFlags, '')) {
            this.doSubmit();
        }
    }

    renderTerminal() {
        new TerminalRender(
            this.termLayout,
            this.settingsStore.state.colors,
            this.DOM.preFontFamily,
            this.regScr,
            this.dataSet,
            this.AsnaTerm5250).render();
    }

    renderInputArea(fromPos, toPos) {
        new TerminalRender(
            this.termLayout,
            this.settingsStore.state.colors,
            this.DOM.preFontFamily,
            this.regScr,
            this.dataSet,
            this.AsnaTerm5250).renderInputArea(fromPos, toPos);
    }

    handleOrientationChangeEvent() {
    }

    handleCursorKeyDownEvent(ev) {
        if (!ev) {
            ev = window.event;
        }
        // ASNA.TouchSlider.CloseBottom();
        return this.processKeyDown(ev);
    }

    handleCursorKeyPressEvent(event) {
        if (!event) {
            event = window.event;
        }
        // ASNA.TouchSlider.CloseBottom();
        this.processKeyPress(event);
    }

    handleCursorInputEvent() {
        if (!this.hasDbcsFlds || !this.cursor || !this.regScr || !this.regScr.attrMap) {
            return;
        }
        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        const sa = this.regScr.attrMap[pos];

        if (this.isCursorInInputPos() && sa && sa.usage !== 'o' && sa.field) {
            if (sa.field.dbcsType !== 'n') {
                this.processCharacter(this.termCursor.value);
            }
        }
    }

    handleBodySelectStartEvent() {
        return false;
    }

    handleWindowFocusEvent() {
        this.processFocusSet();
    }

    handleWindowBlurEvent() {
        this.processFocusLost();
    }

    handleWindowResizeEvent() {
        if (false /*!ASNA.Vendor.IsWin8Touch() && ASNA.Vendor.IsMobile() && isTouchableInputActive() */) {
            // if (ASNA.Vendor.ReqToReducePageAfterDispKeyboard()) {
            return;
        }

        if (false /*ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch()*/) {
            this.adjustForOrientation();
        }

        const dim = TerminalDOM.getViewportDim(false/*ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch()*/);

        this.termLayout.w = dim.w;
        this.termLayout.h = dim.h;

        // ASNA.FingerSwipe.SetDistanceThreshold(ASNA.Common.ToPixel(null, '30mm'));

        if (theResizeData.isSameSize(this.termLayout.w, this.termLayout.h) ) { // Avoid infinite recursion (IE6, IE7)
            return;
        }

        // ASNA.TouchSlider.CloseBottom();
        this.processResize();
        theResizeData.update(this.termLayout.w, this.termLayout.h);
    }

    handleWindowBeforeUnloadEvent(event) {

        if (this.submit && this.submit.activeFKey) {
            return;
        }

        (event || window.event).returnValue = null; // Note: Browsers no longer allow text of message to be changed.
        return null; // Labels.get('ConfirmExitMsg');
    }

    handleTerminalMouseWheelEvent() {
        if (Keyboard.state === KEYBOARD_STATE.AJAX_WAIT) {
            this.toolbar.renderSbarIndicators(Keyboard.state, this.kbdAhead, this.preHelpErrorCode, this.resetBigButton);
            return;
        }

        // cross-browser wheel delta
        const e = window.event || e; // old IE support
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

        if (delta > 0) {
            this.executeMacro(['', KEY_ACTION.PGUP]);
        }
        else {
            this.executeMacro(['', KEY_ACTION.PGDN]);
        }
    }

    activateInput() {
        if (true /*ASNA.Vendor.IsDesktop()*/) {
            if (this.termCursor && this.termCursor.style && this.termCursor.style.display !== 'none') {
                this.termCursor.focus();
            }
        }
        else {
            this.setFocusAtCursor();
        }
    }

    processFocusSet() {
        const input = document.activeElement;

        if (true /*ASNA.Vendor.IsDesktop()*/) {
            if (this.termCursor)
                this.termCursor.focus();
        }
        else if ((!input || input && input.className !== ASNA.TEMCSS_NAME.TOUCHABLE_INPUT) && true /*ASNA.SettingsDialog.Preference().phyKbd*/) {
            this.setFocusAtCursor();
        }
        else {
            if (input && input.className === ASNA.TEMCSS_NAME.TOUCHABLE_INPUT) {
                const currFld = TerminalRender.lookupFieldWithPosition(this.regScr.coordToPos(cursorPos.row, cursorPos.col), this.termLayout, this.dataSet);

                if (!currFld || input.fld && currFld !== input.fld) {
                    this.moveCursorTouchableInput(input, lastColTouched >= 0 ? lastColTouched : input.fld.col);
                }
            }
        }
        this.focus.hasFocus = true;
        this.cursor.show();
    }

    processFocusLost() {
        if (this.cursor) {
            this.cursor.hide();
        }
        this.focus.hasFocus = false;
    }

    updateChromeColors(colors) {
        const termRender = new TerminalRender(this.termLayout, colors, this.DOM.preFontFamily, this.regScr, this.dataSet, this.AsnaTerm5250);
        this.AsnaTermFacade.style.backgroundColor = termRender.getWebColor('bkgd');
        this.AsnaTermFacade.style.backgroundColor = termRender.getWebColor('bkgd');
        this.termCursor.style.backgroundColor = colors.cursor;
        this.AsnaTermTextSelection.style.backgroundColor = colors.sel;
    }

    initTerminal(msgLight) {
        this.regScr = new Screen(this.termLayout._5250.rows, this.termLayout._5250.cols, msgLight);
        this.errScr = null;
        this.errorCondition = null;

        this.dataSet = new DataSet(this.regScr);
        this.preHelpErrorCode = null;
        this.autoAdvance = true;
    }

    readSubmitResponse() {
        const encData = this.DOM.getHiddenValue(EXPO_INPUT_NAME.Stream5250);
        const data = Base64.decode(encData);
        const stream5250 = JSON.parse(data);
        this.processServerResponse(stream5250);
    }

    processServerResponse(stream) {
        const newSize = Screen.loadScreenSize(stream.screenSize);   // Do this first, so that regen buffer an attr maps are the correct size.

        if (isNaN(this.termLayout.status.h) || (newSize && (newSize.rows !== this.termLayout._5250.rows || newSize.cols !== this.termLayout._5250.cols || newSize.msgLight !== this.termLayout._5250.msgLight))) {
            this.setScreenSize(newSize.rows, newSize.cols, newSize.msgLight);
            this.initTerminal(newSize.msgLight);
        }

        this.regScr.loadBuffer(stream.regenerationBuffer);
        this.regScr.loadAttributes(stream.regenBufferAttributes);

        if (stream.fieldTable) {
            this.dataSet.loadFieldTable(stream.fieldTable);
        }

        if (stream.commandKeySwitches) {
            this.dataSet.loadKeySwitches(stream.commandKeySwitches);
        }

        if (stream.errorRegenerationBuffer && stream.errorRegenerationBuffer.length > 0) {
            this.errScr = new Screen(newSize.rows, newSize.cols, newSize.msgLight);
            this.errScr.loadBuffer(stream.errorRegenerationBuffer);
            this.errScr.setMapping(newSize.cols);
            this.errScr.loadAttributes(stream.errorAttributes);
            this.errScr.loadCursorPosition(stream.errorCursorPosition);
        }

        this.regScr.loadCursorPosition(stream.cursorPosition);
/*
        WingsTerminal.ConfirmExitMsg = Labels.get('ConfirmExitMsg'];
*/
    }

    isDataSetEmpty() {
        return !(this.dataSet && this.dataSet.fieldCount > 0); 
    }

    saveInzFieldValues() {
        this.inzFldValTable = [];

        if (this.isDataSetEmpty()) {
            return;
        }

        for (let fld = 0; fld < this.dataSet.fieldCount; fld++) {
            this.inzFldValTable[fld] = this.dataSet.getFieldValue(this.dataSet.formatTable[fld]);
        }
    }

    saveManFillFieldValues() {
        this.mandatoryFill = [];

        if (this.isDataSetEmpty()) {
            return;
        }

        for (let i = 0; i < this.dataSet.fieldCount; i++) {
            let field = this.dataSet.getField(i);
            if (field && field.isMandatoryFill()) {
                const pos = this.regScr.coordToPos(field.row, field.col);
                for (let k = 0; k < field.len; k++) {
                    this.mandatoryFill[pos + k] = '0';
                }
            }
        }
    }

    newPageCursorInit() {
        if (this.errScr) {
            Keyboard.state = KEYBOARD_STATE.ERROR;
            this.errorCondition = new ErrorCondition();
            this.cursor = new Cursor(this.termCursor, this.errScr.cursorPos);
        }
        else {
            this.cursor = new Cursor(this.termCursor, this.regScr.cursorPos);
        }

        if (!this.cursor.isValid()) {
            if (!this.cursor.setToFirstInputField(this.dataSet))
                this.cursor.setPosition(0, 0); 
        }

        this.cursor.show();
    }

    overlapErrorLine() {
        this.errorCondition.saveLastScreenRow(this.regScr);
        this.errorCondition.overlapLastScreenRow(this.regScr, this.errScr);

        TerminalRender.clearCanvas(this.AsnaTerm5250);
        this.renderTerminal();
    }

    setBlinkingTimer() {
        if (this.blinkTimerID) { return; }
        this.blinkTimerID = setInterval(this.handleBlinkTimerEvent, 500); // Start timer (twice per second) regardless of blinking state.
    }

    clearBlinkingTimer() {
        if (this.blinkTimerID) {
            clearInterval(this.blinkTimerID);
            this.blinkTimerID = null;
        }
    }

    handleBlinkTimerEvent() {
        if (!this.cursor.blink || !this.focus.hasFocus || this.textSelect.mode === TEXT_SELECT_MODES.IN_PROGRESS ) {
            if (this.textSelect.mode === TEXT_SELECT_MODES.IN_PROGRESS || !this.focus.hasFocus) {
                this.cursor.hide();
            }
            return;
        }

        if (!this.cursor.show()) {
            this.cursor.hide();
        }
    }

    adjust_5250Div() {
        if (!this.AsnaTermFacade || !this.AsnaTermFacade.style) {
            return;
        }

        AsnaTermFacade.style.height = this.termLayout.h + 'px';

        if (!isNaN(this.termLayout._5250.cols) && !isNaN(this.termLayout._5250.cursor.w)) {
            this.termLayout._5250.l = 0;
            this.termLayout._5250.t = 0;

            this.termLayout._5250.w = this.termLayout._5250.cursor.w * this.termLayout._5250.cols;
            this.termLayout._5250.h = this.termLayout._5250.cursor.h * this.termLayout._5250.rows;

            this.AsnaTerm5250.style.width = this.termLayout._5250.w + 'px';
            this.AsnaTerm5250.style.height = this.termLayout._5250.h + 'px';
            this.AsnaTerm5250.style.zIndex = ZINDEX.TERMINAL_5250_TEXT;

            if (this.termLayout.w > this.termLayout._5250.w) {
                this.termLayout._5250.l = (this.termLayout.w - this.termLayout._5250.w) / 2;
                this.AsnaTerm5250.style.left = this.termLayout._5250.l + 'px';
            }
        }
    }

    updateCursor(dirtyInputFld) {
        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        let bkgChar = this.regScr.buffer[pos];
        const sa = this.regScr.attrMap[pos];
        const rect = this.getRect(this.cursor.row, this.cursor.col, 1, 1);
        const nonChar = bkgChar === '\0' || sa && sa.screenAttr && sa.screenAttr.nonDisp;

        this.termCursor.style.fontFamily = this.DOM.preFontFamily;
        this.termCursor.style.fontSize = this.termLayout._5250.fontSizePix + 'px';
        this.termCursor.style.backgroundColor = this.settingsStore.state.colors.cursor;

        this.termCursor.style.position = 'absolute';
        this.termCursor.style.top = rect.t + 'px';
        this.termCursor.style.left = rect.l + 'px';

        this.termCursor.style.width = rect.w + 'px';

        if (!nonChar) {
            this.termCursor.style.width = TerminalDOM.getCharWidth(bkgChar, this.termLayout, this.DOM.preFontFamily) + 'px'; // Possibly DBCS
        }

        const subSectMetr = this.getSubSectionMetrics(this.cursor.row, pos - 1);

        if (subSectMetr && subSectMetr.t) { // recalc .left
            const map = new BufferMapping(this.termLayout._5250.cols);

            const lm = this.getRect(this.cursor.row, 0, 1, 1);
            const colOffset = map.colFromPos(subSectMetr.pos);
            const offsetX = colOffset * rect.w;
            const substrW = TerminalDOM.htmlMeasureText(this.termLayout._5250.fontSizePix, this.DOM.preFontFamily, subSectMetr.t).w;

            this.termCursor.style.left = (lm.l + offsetX + substrW) + 'px';
        }

        this.termCursor.style.height = rect.h + 'px';

        TerminalDOM.resetBoxStyle(this.termCursor.style);

        if (false /*ASNA.Vendor.IsDesktop() || ASNA.Vendor.IsWin8Touch()*/) { // $TO-DO: check if cond should be: ! ASNA.Vendor.IsDesktop() || ASNA.Vendor.IsWin8Touch()
            TerminalDOM.alignInputText(this.termCursor, rect.h, termLayout._5250.fontSizePix);
        }

        if (nonChar) {
            bkgChar = ' ';
        }

        if (true /*ASNA.Vendor.IsDesktop()*/) { // Don't do it for Mobile even if || ...Preference().phyKbd
            this.termCursor.value = bkgChar;
            if (this.termCursor.style.display !== 'none') {
                this.termCursor.focus();
            }
            TerminalDOM.moveCaretPos(this.termCursor, 0);
        }
        else {
            TerminalRender.setDivText(this.termCursor, bkgChar, this.DOM.preFontFamily);
        }

        if (dirtyInputFld && sa && sa.usage !== 'o' && sa.field) {
            sa.field.ffw.mdt = true;
        }

        this.focus.haveFocus = true;
    }

    getRect(row, col, rows, cols) {
        const vertPadding = TerminalRender.calcTextVertPadding(this.termLayout);
        const height = this.termLayout._5250.cursor.h - vertPadding + CHAR_MEASURE.UNDERSCORE_CHAR_HEIGHT;
        const top = this.termLayout._5250.t + BufferMapping.rowToPixel(row, this.termLayout) + vertPadding;
        let rH = height * rows;

        if (rows > 1) { // Rows are not adjacent.
            const top2 = this.termLayout._5250.t + BufferMapping.rowToPixel(row + (rows - 1), this.termLayout) + vertPadding;
            rH = top2 + height - top;
        }

        return { l: this.termLayout._5250.l + BufferMapping.colToPixel(col, this.termLayout), t: top, w: this.termLayout._5250.cursor.w * cols, h: rH };
    }

    getSubSectionMetrics(row, pos) {
        const startRowPos = this.regScr.coordToPos(row, 0);
        let startPos = NaN;
        let text = '';
        if (pos < startRowPos) {
            return null;
        }

        for (let currPos = startRowPos; currPos <= pos; currPos++) {
            if (this.regScr.buffer[currPos] === '\0' && this.regScr.attrMap[currPos].usage === 'o') {
                text = '';
            }
            else {
                if (!text) {
                    startPos = currPos;
                }
                text += this.regScr.buffer[currPos] !== '\0' ? this.regScr.buffer[currPos] : ' ';
            }
        }
        return { pos: startPos, t: text };
    }

    setFocusAtCursor() {
        let input = document.activeElement;

        if (input && input && input.className === ASNA.TEMCSS_NAME.TOUCHABLE_INPUT) {
            return; // Already there.
        }

        const currFld = TerminalRender.lookupFieldWithPosition(this.regScr.coordToPos(this.cursor.row, this.cursor.col), this.termLayout, this.dataSet);
        if (currFld) {
            input = null; // $TO-DO: ASNA.TouchableInput.Find(currFld);
            if (input) {
                input.focus();
            }
        }
    }

    moveCursorTouchableInput(input, newCol) {
        if (typeof input.fld === 'undefined') {
            return;
        }

        const newPos = newCol - input.fld.col;

        if (input.value.length < newPos) {
            input.value = Set.blanks(newPos);
            if (input.setSelectionRange) {
                input.setSelectionRange(newPos, newPos);
            }
        }
        this.cursor = new Cursor(this.termCursor, { row: input.fld.row, col: newCol, blink: this.cursor.blink } );
        this.updateCursor(false);
        this.renderStatusBar();
    }

    processKeyDown(event) {
        this.IgnoreNextKeyPress = null;

        const key = Keyboard.getKeyObject(event);
        const inputEvent = Keyboard.interpretKeyObject(key, false);
        let eatKey = true;

        if (inputEvent.action || inputEvent.character) {
            TerminalDOM.cancelEvent(event);

            if (inputEvent.action && (/^AMBIGUOUS_/).test(inputEvent.action)) {
                // delay until KeyPress happens.
                Keyboard.delayedAction = inputEvent.action.substr('AMBIGUOUS_'.length);
                eatKey = false;
            }
            else if (inputEvent.action) {
                this.processActionKey(inputEvent.action);
                if (KeyboardVendorSpecificBehaviour.keyPressAfterKeyDown()) {
                    Keyboard.ignoreNextKeyPress = true; // Avoid action to be processed again!
                }
            }
            else {
                this.processCharacter(inputEvent.character);
            }
        }
        else {
            eatKey = false;
        }

        return !eatKey; // Chrome or IE will use response to issue or not keyPress event.
    }

    processActionKey(action) {
        const parmIndex = action.indexOf(':');
        let parm = null;
        let actionKey;

        if (parmIndex > 0) {
            actionKey = action.substring(0, parmIndex);
            parm = action.substring(parmIndex + 1);
        }
        else {
            actionKey = action;
        }

        const f = this.actionMap[actionKey].f;
        if (f) {
            if (Keyboard.state === KEYBOARD_STATE.AJAX_WAIT) {
                this.kbdAhead.push({ k: 'a', f: f, d: parm });
                this.toolbar.renderSbarIndicators(Keyboard.state, this.kbdAhead, this.preHelpErrorCode, this.resetBigButton );
                return;
            }

            f(parm);
        }
    }

    processKeyPress(event) {
        if (Keyboard.ignoreNextKeyPress) {
            Keyboard.ignoreNextKeyPress = false;
            if (Keyboard.ambiguityResolverKeyPressChar < 0) {
                return;
            }
        }

        const key = Keyboard.getKeyObject(event);
        let inputEvent = null;

        if (Keyboard.ambiguityResolverKeyPressChar >= 0 && Keyboard.delayedAction) {
            if (key.code === Keyboard.ambiguityResolverKeyPressChar) {
                inputEvent = new InputEvent(delayedAction, null);
            }
        }

        if (!inputEvent) {
            inputEvent = Keyboard.interpretKeyObject(key, true, inputEvent);
        }

        Keyboard.clearDelayedActionData();

        if (inputEvent.action) {
            this.processActionKey(inputEvent.action);
            return true;
        }
        else if (inputEvent.character) {
            this.processCharacter(inputEvent.character);
            return true;
        }

        return false;
    }

    processCharacter(character) {
        if (this.preHelpErrorCode) {
            this.beep.play();
            return;
        }
        else if (Keyboard.state !== KEYBOARD_STATE.NORMAL) {
            this.kbdAhead.push({ k: 'c', d: character });
            this.toolbar.renderSbarIndicators(Keyboard.state, this.kbdAhead, this.preHelpErrorCode, this.resetBigButton);
            return;
        }

        if (!this.isCursorInInputPos()) {
            this.setPreHelpError('0005');
            return;
        }

        let pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
        const sa = this.regScr.attrMap[pos];
        let dbcsType = 'n';
        let autoEnter = false;

        if (sa && sa.usage !== 'o' && sa.field) {
            const ffw = sa.field.ffw;
            dbcsType = sa.field.dbcsType;

            if (dbcsType === DBCS_TYPES.J || dbcsType === DBCS_TYPES.G) {
                if (!this.DBCS.isWide(character)) {
                    this.setPreHelpError('0060');
                    return;
                }
            }
            else if (dbcsType === 'n') {
                if (this.DBCS.isWide(character)) {
                    this.setPreHelpError('0061');
                    return;
                }
            }

            if (dbcsType === DBCS_TYPES.E) {
                const isWide = this.DBCS.isWide(character);
                if (!this.isValidECharForFld(character, isWide, sa.field)) {
                    this.setPreHelpError(_isDBCS(charW) ? '0061' : '0060');
                    return;
                }
            }

            if (ffw.shiftEdit.alphaOnly && ! Validate.alphaOnly(character)) {
                this.setPreHelpError('0008');
                return false;
            }
            else if (ffw.shiftEdit.numericOnly) {
                const rowColFldEndPos = this.regScr.peekOnePastEndOfFieldPos(pos);
                if (!rowColFldEndPos) {
                    return false;
                }

                const fldEndPos = this.regScr.coordToPos(rowColFldEndPos.row, rowColFldEndPos.col) - 1;

                if (fldEndPos === pos && ! Validate.digitsOnly(character)) { // Last position does not allow ' ', '+', '-', '.', ','
                    this.setPreHelpError('0026');
                    return false;
                }
                else if (!Validate.numericOnly(character)) { // Digits or ' ', '+', '-', '.', ','
                    this.setPreHelpError('0009');
                    return false;
                }
            }
            else if (ffw.shiftEdit.digitsOnly && !Validate.digitsOnly(character)) {
                this.setPreHelpError('0010');
                return false;
            }
            else if (ffw.shiftEdit.signedNumeric) {
                const rowColFldStartPos = this.regScr.peekOnePrevStartOfFieldPos(pos);
                if (!rowColFldStartPos) {
                    return false;
                }

                const fldStartPos = this.regScr.coordToPos(rowColFldStartPos.row, rowColFldStartPos.col) + 1;

                if (!this.validateSignedNumeric(fldStartPos, pos, sa.field, character)) {
                    if (!preHelpErrorCode) {
                        setPreHelpError('0010');
                    }
                    return false;
                }
            }
            else if (ffw.shiftEdit.ioFeature) {   // Do not accept keyboard input
                this.setPreHelpError('0004');
                return false;
            }

            if (sa.field.ffw && sa.field.ffw.monocase) {
                character = character.toUpperCase();
            }

            if (this.isAutoEnterFld(sa.field)) {
                autoEnter = true;
            }

            sa.field.ffw.mdt = true;
            sa.field.dupChars = 0; // TODO: recompute if there were partial dup chars.
        }
        if (this.editMode === 'insert') {
            this.insertBlankToFieldAtCursor(false);
        }
        else {
            if (this.regScr.buffer[pos] !== '\0') {
                if (this.DBCS.isWide(character) && !this.DBCS.isWide(this.regScr.buffer[pos])) { // DBCS replaces 2 SBCS
                    this.doDelete();
                }
            }
        }

        this.writeTextAtCursor(character);
        if (dbcsType !== 'n' && this.DBCS.isWide(character))
            this.checkTruncateField(sa.field);

        let atDbcsEnd;
        if (autoEnter && this.isLastFieldPos(pos)) {
            this.submitAction(QSN.ENTER, false, 'autoEnterChar');
        }
        else {
            const inputFld = TerminalRender.lookupFieldWithPosition(pos, this.termLayout, this.dataSet);
            pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);

            this.moveCursor('RIGHT');

            if (this.editMode === 'insert') {
                new TerminalRender(
                    this.termLayout,
                    this.settingsStore.state.colors,
                    this.DOM.preFontFamily,
                    this.regScr,
                    this.dataSet,
                    this.AsnaTerm5250).renderFieldFromCursorPos(this.cursor.row, this.cursor.col);
            }
            else if (this.autoAdvance && (!this.isCursorInInputPos() || (dbcsType !== 'n' && (atDbcsEnd = this.atDbcsFieldFullPos(sa.field))))) {
                if (atDbcsEnd) {
                    const tmpPos = coordToPos(sa.field.row, sa.field.col) + sa.field.len;
                    const map = new BufferMapping(this.termLayout._5250.cols);
                    this.cursor.setPosition(map.rowFromPos(tmpPos), map.colFromPos(tmpPos));
                }
                this.moveToNextInputArea(this.cursor.row, this.cursor.col);

                const nxtPos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);
                if (nxtPos <= pos) { // Is there only one input-capable field?
                    const nxtInputFld = TerminalRender.lookupFieldWithPosition(pos, this.termLayout, this.dataSet);

                    if (nxtInputFld === inputFld) { // There is only one input-capable field.
                        this.offscreenPos = 1;
                        this.moveToPos(pos);
                    }
                }
            }
        }
    }

    isCursorInInputPos() {
        return Screen.isRowColInInputPos(this.regScr, this.cursor.row, this.cursor.col);
    }
    
    isValidECharForFld(c, isWide, fld) {
        const fromPos = this.regScr.coordToPos(fld.row, fld.col);
        const value = Screen.copyPositionsFromBuffer(this.regScr, fromPos, fromPos + fld.len);
        value = value.trim();

        if (!value.length) {
            return true;
        }

        if (this.DBCS.isWide(value[0])) {
            return isWide;
        } else {
            return !isWide;
        }
    }

    setPreHelpError(codeID) {
        this.preHelpErrorCode = codeID;
        this.beep.play();
        this.renderStatusBar();
    }

    validateSignedNumeric(startPos, pos, field, letter) {
        // The field allows keys 0-9 and DUP (if the DUP-enable bit is on in the associated Field Format Word (FFW)). 
        // Typing any other character will cause an operator error display. 
        // This field reserves the center-hand position for a sign display (- for negative and null for positive); 
        // therefore, the largest number of characters that can be entered into this field is one less than the field length. 
        // A signed numeric field less than 2 characters long will cause an error to be flagged. 
        // No digit may be keyed into the centermost position; however, the cursor can be positioned there by using the 
        // cursor movement keys and then followed by the F+ or F- key. 
        // This allows changing the sign without affecting the rest of the field.
        const signPos = startPos + field.len - 1;

        if (pos === signPos) {
            if (letter === '-' || letter === '+') { // Note: '+' allowed on IBM Emulator
                return true;
            }

            this.setPreHelpError('0011'); // Could also be '0018'
            return false;
        }

        if (pos < signPos && Valdiate.digitsOnly(letter)) {     // 0-9 in position before last
            return true;
        }

        return false;
    }

    isDupFld(fld) {
        return fld.ffw.dup;
    }

    isAutoEnterFld(fld) {
        return fld.ffw && fld.ffw.autoEnter;
    }

    insertBlankToFieldAtCursor(show) {
        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);

        if (!this.regScr.insertTextToFieldAtPos(pos, ' ')) {
            this.updateCursor();
            this.setPreHelpError('0012');
            this.renderStatusBar();
            return false;
        }

        if (show) {
            new TerminalRender(
                this.termLayout,
                this.settingsStore.state.colors,
                this.DOM.preFontFamily,
                this.regScr,
                this.dataSet,
                this.AsnaTerm5250).renderInputCanvasSections(this.AsnaTerm5250, pos, pos + 1);
        }

        return true;
    }

    isValidPosForChar(pos, c) {
        const sa = this.regScr.attrMap[pos];

        if (!sa || sa.usage === 'o' || !sa.field) {
            return false;
        }

        const ffw = sa.field.ffw;
        const dbcsType = sa.field.dbcsType;

        if (dbcsType !== 'n' && dbcsType !== DBCS_TYPES.G) {
            const isWide = DBCS.isWide(c);
            if (dbcsType === DBCS_TYPES.J && !isWide || (dbcsType === DBCS_TYPES.E && !this.isValidECharForFld(c, isWide, sa.field))) {
                return false;
            }
        }

        if (ffw.shiftEdit.alphaOnly && !validateAlphaOnly(c)) {
            return false;
        }
        else if (ffw.shiftEdit.numericOnly) {
            let fieldEndPos = this.regScr.peekOnePastEndOfFieldPos(pos);
            if (!fieldEndPos) {
                return false;
            }

            fieldEndPos = this.regScr.coordToPos(fieldEndPos.row, fieldEndPos.col) - 1;

            if (pos === fieldEndPos && !Validate.isDigitsOnly(c)) { // Last position does not allow ' ', '+', '-', '.', ','
                return false;
            }
            else if (!Validate.isNumericOnly(c)) { // Digits or ' ', '+', '-', '.', ','
                return false;
            }
        }
        else if (ffw.shiftEdit.digitsOnly && !Validate.isDigitsOnly(c)) {
            return false;
        }
        else if (ffw.shiftEdit.signedNumeric) {

            let fieldStartPos = this.regScr.peekOnePrevStartOfFieldPos(pos);
            if (!fieldStartPos) {
                return false;
            }

            fieldStartPos = this.regScr.coordToPos(fieldStartPos.row, fieldStartPos.col) + 1;

            if (!Validate.isSignedNumeric(fieldStartPos, pos, sa.field, c)) {
                return false;
            }
        }
        else if (ffw.shiftEdit.ioFeature) {   // Do not accept keyboard input
            return false;
        }

        return true;
    }

    writeOneCharAtCursor(c) {
        if (this.editMode === 'insert') {
            this.insertBlankToFieldAtCursor(false);
        }
        this.writeTextAtCursor(c);
        this.moveCursor('RIGHT');
    }

    writeTextAtCursor(str) {
        const pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);

        this.writeText(this.cursor.row + 1, this.cursor.col + 1, str);
        new TerminalRender(
            this.termLayout,
            this.settingsStore.state.colors,
            this.DOM.preFontFamily,
            this.regScr,
            this.dataSet,
            this.AsnaTerm5250).renderInputCanvasSections(this.AsnaTerm5250, pos, pos + 1);
    }

    writeText(row, col, text) {
        const pos = this.regScr.coordToPos(row-1, col-1);
        this.writeTextAtPos(pos, text);
    }

    writeTextAtPos(pos, text) {
        for (let i = 0, l = text.length; i < l; i++) {
            this.writeLetter(text.charAt(i), pos++);
        }
    }

    writeLetter(letter, pos) {
        this.regScr.buffer[pos] = letter;
        if (this.mandatoryFill && this.mandatoryFill[pos] === '0') {
            this.mandatoryFill[pos] = '1';
        }
    }

    findfirstChrPosition = function (str) {
        let index = 0;

        while (index < str.length && (str.charAt(index) === '\0' || str.charAt(index) === ' ')) {
            index++;
        }

        return index;
    }

    checkTruncateField(fld) {
        const value = this.dataSet.getFieldValue(fld);
        const byM = this.DBCS.calcByteLen(value);
        var mod = false;

        while (byM.bytes > fld.len && value.length > 0) {
            mod = true;
            value = value.substring(0, value.length - 1);
            byM = this.DBCS.calcByteLen(value);
        }

        if (mod) {
            // console.log('Need to truncate! old:' + temp + ' new:' + value);

            this.dataSet.setFieldValue(fld, value);
            const pos = this.regScr.coordToPos(fld.row, fld.col);
            new TerminalRender(
                this.termLayout,
                this.settingsStore.state.colors,
                this.DOM.preFontFamily,
                this.regScr,
                this.dataSet,
                this.AsnaTerm5250).renderInputCanvasSections(this.AsnaTerm5250, pos, pos + fld.len);
        }
    }

    isLastFieldPos(pos) {
        const fieldEndPos = this.regScr.peekOnePastEndOfFieldPos(pos);
        if (!fieldEndPos) {
            return false;
        }

        return pos === this.regScrcoordToPos(fieldEndPos.row, fieldEndPos.col) - 1;
    }

    atDbcsFieldFullPos(fld) {
        const value = this.dataSet.getFieldValue(fld);
        const startFldPos = this.regScr.coordToPos(fld.row, fld.col);
        let pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);

        if (pos <= startFldPos) {
            return false;
        }
        else if (pos >= startFldPos + fld.len) {
            return true;
        }

        pos -= startFldPos;
        const byM = calcByteLenDbcs(value, pos);

        if (byM.lastState === 'd' && byM.bytes === fld.len - 1) { // + SI
            return true;
        }

        return byM.bytes >= fld.len; // Regardless of dbcs type ???
    }

    moveToNextInputArea(row, col) {
        const pos = this.regScr.coordToPos(row, col);
        var newPos = this.regScr.scanAttrMap(pos, 'nextNonOutput');

        if (newPos === pos) {
            return false;
        }

        return this.postMoveToInputArea(newPos);
    }

    moveToPrevInputArea(row, col) {
        const pos = this.regScr.coordToPos(row, col);
        const newPos = this.regScr.scanAttrMap(pos, 'prevNonOutput');

        return this.postMoveToInputArea(newPos);
    }

    postMoveToInputArea(newPos) {
        if (newPos < 0) {
            return false;
        }

        this.moveToPos(newPos);
        return true;
    }

    postProcessInputArea(newInputStr, inputArea, row, col) {

        if (newInputStr.length < inputArea.len) {
            newInputStr += '\0';
        }

        this.writeTextAtPos(inputArea.initialPos, newInputStr);
        this.renderInputArea(inputArea.initialPos, inputArea.initialPos + inputArea.len);

        this.cursor.setPosition(row, col);
        this.updateCursor();
        this.renderStatusBar();
    }

    moveToPos(pos, dirtyInputFld) {
        const map = new BufferMapping(this.termLayout._5250.cols);

        this.cursor.setPosition(map.rowFromPos(pos), map.colFromPos(pos));
        this.updateCursor(dirtyInputFld);
        this.renderStatusBar();
    }

    moveToStartOfField() {
        let pos = this.regScr.coordToPos(this.cursor.row, this.cursor.col);

        if (this.regScr.attrMap[pos].usage === 'o') {    // Not at a field, can't go to the start of the field!
            return false;
        }

        if (pos === 0 && this.regScr.attrMap[0].usage !== 'o') {   // Already at the start of the first possible field.
            return true;
        }

        while (pos - 1 >= 0 && this.regScr.attrMap[pos - 1].usage !== 'o') {
            pos--;
        }

        if (pos < 0) {
            return false;
        }

        this.moveToPos(pos);
        return true;
    }


    adjustForOrientation() {
        /*
        var bodyEl = document.getElementById(ASNA.TEID.TERM_BODY);
        var or = ASNA.Vendor.GetOrientation();
        var dim;
        var fncts;
        var deltaX, deltaY;
        var offsetX, offsetY;

        if (!bodyEl || or === ASNA.Vendor.OR_UNDEF) {
            return;
        }

        dim = ASNA.Vendor.GetViewportDim(true);

        if (or === ASNA.Vendor.OR_L_NORM || or === ASNA.Vendor.OR_L_RCLK || or === ASNA.Vendor.OR_L_LCCLK) {
            bodyEl.style.webkitTransform = '';
            bodyEl.style.webkitTransformOrigin = '';
        }
        else if (or === ASNA.Vendor.OR_P_NORM) {
            offsetX = typeof (window.scrollX) !== 'undefined' ? window.scrollX : 0;
            deltaX = offsetX;
            deltaY = dim.w;

            fncts = 'translate(' + deltaX + 'px,' + deltaY + 'px ) rotate(-90deg)';
            bodyEl.style.webkitTransform = fncts;

            bodyEl.style.webkitTransformOrigin = '0% 0%';
        }
        else if (or === ASNA.Vendor.OR_P_UPDN) {
            offsetY = typeof (window.scrollY) !== 'undefined' ? window.scrollY : 0;
            deltaX = dim.h;
            deltaY = offsetY;

            fncts = 'translate(' + deltaX + 'px,' + deltaY + 'px ) rotate(90deg)';
            bodyEl.style.webkitTransform = fncts;
            bodyEl.style.webkitTransformOrigin = '0% 0%';
        }

        bodyEl.style.width = dim.w + 'px';
        */
    }

    processResize() {
        if (this.termLayout.w === 0 || this.termLayout.h === 0) {
            return;
        }
        this.rebuildPage();
    }

    rebuildPage() {
        TerminalDOM.clearCache();
        this.textSelect.reset();
        TerminalRender.clearCanvas(this.AsnaTerm5250);
        this.toolbar.removeToolbars();

        this.hideMsgIndicator();
        FKeyHotspot.remove();
        //if (ASNA.Vendor.IsMobile()) {
        //    ASNA.TouchableInput.Remove();
        //}
        // ASNA.IbmKpad.Remove();

        this.adjustCanvasSize();
        this.setScreenSize(this.termLayout._5250.rows, this.termLayout._5250.cols, this.termLayout._5250.msgLight);
        this.DOM.setTerminalFont(this.termLayout._5250);
        this.toolbar = new TerminalToolbar();
        this.toolbar.create(this.termLayout, this.DOM.preFontFamily, this.settingsStore.state.colors);

        new TerminalRender(this.termLayout, this.settingsStore.state.colors, this.DOM.preFontFamily, this.regScr, this.dataSet, this.AsnaTerm5250).render();

        this.updateCursor();
        this.renderStatusBar();

        this.adjust_5250Div();
        Settings.init(ID.STATUSBAR, SETTINGS_OPENING_HEIGHT, this.settingsStore );
        FKeyHotspot.init(this.AsnaTerm5250, this.regScr.hotspotScan(this.termLayout), this.executeVirtualKey, this.settingsStore.state.show.functionKeyHotspots);
        if (this.enterBigButton) {
            this.enterBigButton.calcLocation(this.termLayout);
        }
        if (this.resetBigButton) {
            this.resetBigButton.calcLocation(this.termLayout);
        }
        /*
        if (ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch()) {
            ASNA.TouchableInput.Create(AsnaTerm5250, formatTable, fieldCount, termLayout, calcTextVertPadding(), underScoreCharHeight);
        }
        */
    }

    isReqFieldExitFld(fld) {
        return fld.ffw.shiftEdit.signedNumeric || fld.ffw.mf.rightAdjZeroFill || fld.ffw.mf.rightAdjBlankFill;
    }

    executeVirtualKey(label, action) {
        if (action && action !== 'DONOTHING' && Keyboard.state !== KEYBOARD_STATE.AJAX_WAIT) {
            this.executeMacro([label, action]);
            this.activateInput();
        }
    }

    doSubmit() {
        this.eventHandlingOperations('remove');
        this.clearBlinkingTimer();

        this.cursor.hide();
        this.submit.go();
    }

    executeMacro(macro) {
        if (!(macro instanceof Array)) {
            return;
        }

        for (let index = 0; index < macro.length; index++) {
            if (typeof macro[index] !== 'string') {
                continue;
            }

            if (index === 0) {  // Name of the macro (used for Menu options)
                continue;
            }

            if (macro[index].length === 1) {
                this.processCharacter(macro[index]);
            }
            else {
                this.processActionKey(macro[index]);
            }
        }
    }

    shouldBypassMandatoryValidation(aidKey) {
        const oneToTwelve = aidKey >= QSN.F1 && aidKey <= QSN.F12;
        const thirteenToTwentyFour = aidKey >= QSN.F13 && aidKey <= QSN.F24;

        if (!oneToTwelve && !thirteenToTwentyFour) { return false; }

        if (oneToTwelve) {
            return this.dataSet.getAttnKey(aidKey - QSN.F1);
        }
        else {
            return this.dataSet.getAttnKey(aidKey - QSN.F13);
        }
    }

    handleAjaxResponseEvent(stream) {
        if (stream.redirectUrl) {
            this.submit.activeFKey = 'Redirecting';
            window.location = stream.redirectUrl;
        }

        this.initTerminal();
        this.processServerResponse(stream);
        Keyboard.state = KEYBOARD_STATE.NORMAL;
        document.body.style.cursor = 'auto';

        this.saveInzFieldValues();
        this.saveManFillFieldValues();
        this.submit.activeFKey = '';
        this.editMode = 'ovr';
        this.newPageCursorInit();
        this.rebuildPage();
        if (Keyboard.state === KEYBOARD_STATE.ERROR) {
           this.overlapErrorLine();
        }
        this.updateCursor();
        this.renderStatusBar();
        this.notifyUserCode();
        while (this.kbdAhead.length > 0) {
            const entry = this.kbdAhead.shift();
            if (entry.k === 'c') {
                this.processCharacter(entry.d);
            }
            else if (entry.k === 'a' && entry.f) {
                entry.f(entry.d);
            }
        }
    }

    notifyUserCode() {
        if (typeof BTerm5250PageReplaced === 'function') {
            BTerm5250PageReplaced();
        }
    }

    handlePointerStartEvent(event) {
        if (isNaN(this.termLayout.w) || !this.textSelect) {
            return;
        }

        this.textSelect.reset();

        const scroll = this.getWindowScroll();
        let pt = { x: event.clientX - scroll.x, y: event.clientY - scroll.y };

        const target = document.elementFromPoint(pt.x, pt.y);

        if (Settings.hitTest(target)) {
            this.deviceEventHandlingOperations('remove');
            this.cursorKeyboardEventHandlingOperations('remove');
            Settings.startPointerCapture(event.clientX, event.clientY, this.handleSettingsSlideCompleteEvent);
            return;
        }

        if (target && !TerminalRender.is5250TextElement(this.AsnaTerm5250,target)) {
            this.activateUI_Element(target);
            return;
        }

        pt = this.textSelect.clientPt(this.AsnaTerm5250, event);

        //if (this.isPointInsideTerminal(pt)) {
            // ASNA.TouchSlider.CloseBottom();
        //}

        this.textSelect.setPotentialSelection(pt);

        //if (id != ASNA.TEConst.MOUSE_POINTER_ID) {
        //    ASNA.FingerSwipe.PointerStart(pt);
        //}
    }

    handlePointerMoveEvent(event) {
        if (!this.devicePointers || isNaN(this.termLayout.w) || !this.textSelect.anchor) {
            return;
        }
        const pt = this.textSelect.clientPt(this.AsnaTerm5250, event);

        if (this.textSelect.mode !== TEXT_SELECT_MODES.COMPLETE) {
            const dx = Math.abs(this.textSelect.anchor.x - pt.x);
            const dy = Math.abs(this.textSelect.anchor.y - pt.y);

            if (this.textSelect.mode === TEXT_SELECT_MODES.POTENTIAL_SELECTION && TextSelect.hasPointerMovedToStartSelection(this.termLayout._5250.cursor, dx, dy) ||
                this.textSelect.mode === TEXT_SELECT_MODES.IN_PROGRESS) {
                this.textSelect.setInProgress(); 

                const selectedRect = this.textSelect.selectedRect = TextSelect.normalizeCoordRect(this.termLayout._5250.cursor, this.textSelect.anchor, pt);
                const rect = this.getRect(selectedRect.row, selectedRect.col, selectedRect.rows, selectedRect.cols);

                this.textSelect.positionElement(rect, this.settingsStore.state.colors.sel);
                this.cursor.hide();
                this.textSelect.show();
            }
        }
    }

    handlePointerEndEvent(event) {
        if (event && event.target && !this.AsnaTerm5250.contains(event.target)) {
            if (!(event.target && this.AsnaTermTextSelection && event.target.id === this.AsnaTermTextSelection.id)) {
                return;
            }
        }

        if (isNaN(this.termLayout.w) || !this.textSelect) {   // Not initialized?
            return;
        }

        const pt = this.textSelect.clientPt(this.AsnaTerm5250, event);

        // if (id != ASNA.TEConst.MOUSE_POINTER_ID) {
        //    ASNA.FingerSwipe.PointerEnd();
        // }

        if (this.textSelect.mode === TEXT_SELECT_MODES.IN_PROGRESS) {
            this.textSelect.setComplete();
            this.cursor.show();
            this.updateCursor();
            this.activateInput();
        }
        else { // Just move the position to where the mouse is located.
            const selectedCursorPos = TextSelect.getRowColFromPixel(this.termLayout._5250.cursor, pt);
            this.textSelect.reset();
            if (Settings.close()) {
                this.cursorKeyboardEventHandlingOperations('add');
            }

            if (selectedCursorPos.row >= 0 &&
                selectedCursorPos.row < this.termLayout._5250.rows &&
                selectedCursorPos.col >= 0 && selectedCursorPos.col < this.termLayout._5250.cols) {
                this.cursor.setPosition(selectedCursorPos.row, selectedCursorPos.col);
                this.updateCursor();
                this.renderStatusBar();
            }
            this.activateInput();
        }

        // ASNA.IbmKpad.HideAllPopups();
    }
    
    getWindowScroll() {
        const scroll = { x: 0, y: 0 };

        if (typeof window.pageXOffset !== 'undefined') {
            scroll.x = window.pageXOffset;
        }
        else if (typeof document.scrollLeft !== 'undefined') {
            scroll.x = document.scrollLeft;
        }

        if (typeof window.pageYOffset !== 'undefined') {
            scroll.y = window.pageYOffset;
        }
        else if (typeof document.scrollTop !== 'undefined') {
            scroll.y = document.scrollTop;
        }

        return scroll;
    }

    activateUI_Element() {
        /*
        if (target) {
            if (target.id && ASNA.CloseIcon && ASNA.CloseIcon.Belongs(target)) {
                ASNA.Pointer.RemoveListenToEvents(window);
                ASNA.CloseIcon.TriggerEvent();
                __pointer = '';
                return;
            }
            else if (target.id && _belongsToStatusbar(target)) {
                ASNA.Pointer.RemoveListenToEvents(window);
                ASNA.TouchSlider.SetCaptureOnCenter(id, x, y, function () { ASNA.Pointer.ListenToEvents(window, _pointerStart, _pointerMove, _pointerEnd, _pointerCancel); });
                __pointer = '';
                return;
            }
            else if (target.id && ASNA.SettingsDialog.Belongs(target)) {
                ASNA.Pointer.RemoveListenToEvents(window);
                ASNA.SettingsDialog.SetCapture(_showColorDialog);
                __pointer = '';
                return;
            }
            else if (ASNA.IbmKpad.Belongs(target)) {
                ASNA.Pointer.CancelMoveEvents(window);
                ASNA.Pointer.RemoveListenToEvents(window);
                ASNA.IbmKpad.SetCapture(ASNA.Common.SkipSvgChildren(target), id, x, y, function () { ASNA.Pointer.ListenToEvents(window, _pointerStart, _pointerMove, _pointerEnd, _pointerCancel); });
                __pointer = '';
                return;
            }
            else if (ASNA.FKeyHotSpot.Belongs(target)) {
                ASNA.Pointer.CancelMoveEvents(window);
                ASNA.Pointer.RemoveListenToEvents(window);
                ASNA.FKeyHotSpot.SetCapture(target, id, x, y, function () { ASNA.Pointer.ListenToEvents(window, _pointerStart, _pointerMove, _pointerEnd, _pointerCancel); });
                __pointer = '';
                return;
            }
            else if (ASNA.BigButton.Belongs(target)) {
                ASNA.Pointer.CancelMoveEvents(window);
                ASNA.Pointer.RemoveListenToEvents(window);
                ASNA.BigButton.SetCapture(target, id, x, y, function () { ASNA.Pointer.ListenToEvents(window, _pointerStart, _pointerMove, _pointerEnd, _pointerCancel); });
                __pointer = '';
                return;
            }
        }
*/
    }

    getSelRange() {
        const from = this.regScr.coordToPos(this.textSelect.selectedRect.row, this.textSelect.selectedRect.col);
        let to = from + this.textSelect.selectedRect.cols - 1;

        if (this.textSelect.selectedRect.rows > 1) {
            const a = ((this.termLayout._5250.cols - 1) - this.textSelect.selectedRect.col) + 1;
            const b = (this.textSelect.selectedRect.rows - 2) * this.termLayout._5250.cols;
            const c = this.textSelect.selectedRect.col + this.textSelect.selectedRect.cols;

            to = from + a + b + c;
        }

        return { from: from, to: to };
    }

    addNewLineRowChanged(pos, rowBefore) {
        const map = new BufferMapping(this.termLayout._5250.cols);

        if (map.rowFromPos(pos) > rowBefore) {
            return '\r\n';
        }

        return '';
    }

    handlePasteTextOkEvent(text,nonbreaking) {
        this.doPasteText(text, nonbreaking);
        PasteText.mode = 'idle';
        this.eventHandlingOperations('add');
        this.repositionAfterModal();
    }

    handlePasteTextCancelEvent() {
        PasteText.mode = 'idle';
        this.eventHandlingOperations('add');
        this.repositionAfterModal();
    }

    repositionAfterModal() {
        this.updateCursor();
        if (this.lastFocus)
            this.lastFocus.focus();
        this.lastFocus = null;
    }

    handleSettingsSlideCompleteEvent(isOpen) {
        this.deviceEventHandlingOperations('add');
        if (!isOpen) {
            this.cursorKeyboardEventHandlingOperations('add');
        }
    }

    pageReplacedNotifyUserCode() {
        if (typeof window.BTerm5250PageReplaced !== 'function') {
            return;
        }
        window.BTerm5250PageReplaced();
    }
 }

class Cursor {
    constructor(domElement, cursorPosition) {
        this.domElement = domElement;
        this.row = cursorPosition.row;
        this.col = cursorPosition.col;
        this.blink = cursorPosition.blink;
        this.isDesktop = true; // $TO-DO: mobile version ...
    }

    isValid() {
        return this.row >= 0 && this.col >= 0;
    }

    setToFirstInputField(dataSet) {
        if (!dataSet.regScr) {
            return false;
        }

        const regScr = dataSet.regScr;
        let firstInputField = null;

        for (let i = 0; i < dataSet.fieldCount; i++) {
            const field = dataSet.getField(i);
            if (field) {
                const startFieldPos = regScr.coordToPos(field.row, field.col);
                if (regScr.attrMap[startFieldPos] && regScr.attrMap[startFieldPos].usage !== 'o') {
                    firstInputField = field;
                    break;
                }
            }
        }
        if (firstInputField) {
            this.row = firstInputField.row;
            this.col = firstInputField.col;
            return true;
        }

        return false;
    }

    show() {
        if (!this.domElement) { return false; }

        if (this.isDesktop) {
            let zIndex = parseInt(this.domElement.style.zIndex, 10);
            if (zIndex !== ZINDEX.TERMINAL_CURSOR_VISIBLE) {
                this.domElement.style.zIndex = ZINDEX.TERMINAL_CURSOR_VISIBLE;
                return true;
            }
        }
        else {
            if (this.domElement.style.display !== 'block') {
                this.domElement.style.display = 'block';
                return true;
            }
        }

        return false;
    }

    hide() {
        if (!this.domElement) { return true; }

        if (this.isDesktop) {
            let zIndex = parseInt(this.domElement.style.zIndex, 10);

            if (zIndex !== ZINDEX.TERMINAL_CURSOR_HIDDEN) {
                this.domElement.style.zIndex = ZINDEX.TERMINAL_CURSOR_HIDDEN;
                return true;
            }
        }
        else {
            if (this.domElement.style.display !== 'none') {
                this.domElement.style.display = 'none';
                return true;
            }
        }

        return false;
    }

    adjustToBounds(_5250) {
        if (this.row < 0) {
            this.row = _5250.rows - 1;
        }

        if (this.row >= _5250.rows) {
            this.row = 0;
        }

        if (this.col < 0) {
            this.col = _5250.cols - 1;
            this.row--;
        }

        if (this.col >= _5250.cols) {
            this.col  = 0;
            this.row++;

            if (this.row >= _5250.rows) {
                this.row = 0;
            }
        }
    }

    setPosition(newRow, newCol) {
        this.row = newRow;
        this.col = newCol;
    }
}

class DataSet {
    constructor(regScr) {
        this.regScr = regScr;
        this.fieldCount = 0;
        this.attnKeyMap = new Array(24);
        this.formatTable = null;
    }

    loadFieldTable(ft) {
        const values = ft.split(',');

        this.hasDbcsFlds = false;

        for (let index = 0; index < values.length; index = index + 5) {
            const row = parseInt(values[index + 0], 10);
            const col = parseInt(values[index + 1], 10);
            const len = parseInt(values[index + 2], 10);
            const ffw = parseInt(values[index + 3], 10);
            const fcwl = parseInt(values[index + 4], 10);

            if (!isNaN(row) && !isNaN(col) && !isNaN(len) && !isNaN(ffw)) {
                const dbcsType = this.parseDbcsType(fcwl, values, index + 5);
                if (dbcsType !== 'n') { this.hasDbcsFlds = true; }

                const ffwObject = FieldFormatWord.factory(ffw);
                if (ffwObject) {
                    this.addField('i', row - 1, col - 1, len, ffwObject, dbcsType);
                }
            }

            if (!isNaN(fcwl) && fcwl > 0) {
                index += fcwl;
            }
        }

        return true;
    }

    loadKeySwitches(ks) {
        const byteVal = ks.split(',');
        if (byteVal.length !== 3) { return; }

        var keyFlags = (parseInt(byteVal[0], 10) << 16) + (parseInt(byteVal[1], 10) << 8) + parseInt(byteVal[2], 10);
        var bit = 1;
        for (var i = 0; i < 24; i++) {
            this.attnKeyMap[i] = (keyFlags & bit) !== 0;
            bit = bit << 1;
        }
    }

    addField(usage, row, col, len, ffw, dbcsType) {
        let pos = this.regScr.coordToPos(row, col);

        if (!this.formatTable) {
            this.formatTable = [];
            this.formatTable.length = MAX_FIELDS_PER_TABLE;
        }

        this.formatTable[this.fieldCount] = new Field(row, col, len, ffw, dbcsType);

        if (ffw.bypass) {
            usage = 'o';
        }

        while (len-- > 0) {
            this.regScr.setFieldData(pos, this.formatTable[this.fieldCount], usage);
            pos++;
        }

        this.fieldCount++;
    }

    parseDbcsType(fcwl, values, offset) {
        var dbcsType = 'n';

        if (isNaN(fcwl) || fcwl <= 0) {
            return dbcsType;
        }

        for (let i = 0; i < fcwl; i++) {
            const fcw = parseInt(values[offset + i], 10);
            if (fcw === 0x8200)
                dbcsType = 'J'; // DBCS Only (note 'O' reserved for Open)
            else if (fcw === 0x8220)
                dbcsType = 'G'; // DBCS Pure (Graphics)
            else if (fcw === 0x8240)
                dbcsType = 'E'; // DBCS Either
            else if (fcw === 0x8280 || fcw === 0x8281 || fcw === 0x82C0)
                dbcsType = 'O'; // DBCS Open

            if (dbcsType !== 'n') { // No need to loop further.
                break;
            }
        }

        return dbcsType;
    }

    getField(index) {
        if (index >= this.fieldCount) {
            return null;
        }
        return this.formatTable[index];
    }

    getFieldValue(field) {
        return field ? Screen.copyFromBuffer(this.regScr, field.row, field.col, field.len) : null;
    }

    setFieldValue(field, newValue) {
        let pos = this.regScr.coordToPos(field.row, field.col);
        let index = 0;

        while (pos < this.regScr.buffer.length && index < field.len && index < newValue.length) {
            this.regScr.buffer[pos++] = newValue.charAt(index);
            index++;
        }

        // Pad rest of field with '\0'
        while (pos < this.regScr.buffer.length && index < field.len) {
            this.regScr.buffer[pos++] = '\0';
            index++;
        }
    }

    anyFieldModified() {
        for (let i = 0; i < this.fieldCount; i++) {
            if (this.formatTable[i].ffw.mdt) {
                return true;
            }
        }
        return false;
    }

    listReqDupFlds() {
        let list = '';

        for (let i = 0; i < this.fieldCount; i++) {
            if (this.formatTable[i].dupChars > 0) {
                if (list.length > 0) {
                    list += ',';
                }
                list += i;
            }
        }

        return list;
    }

    getAttnKey(index) {
        return this.attnKeyMap[index];
    }

    static isMandatoryEntry(fld) {
        return fld.ffw.me;
    }

    static isModifiedDataTag(fld) {
        return fld.ffw.mdt;
    }

    static isMandatoryFill(fld) {
        return fld.ffw.mf.mandatoryFill;
    }

    static allPosChanged(regScr, mandatoryFill, fld) {
        if (!mandatoryFill) {
            return false;
        }

        const pos = regScr.coordToPos(fld.row, fld.col);

        if (mandatoryFill.length < pos + fld.len) {
            return false;
        }

        for (let i = 0; i < fld.len; i++) {
            if (mandatoryFill[pos + i] === '0') {
                return false;
            }
        }

        return true; // All '1'
    }
}

class Focus {
    constructor() {
        this.hasFocus = false;
    }
}

class Beep {
    constructor(audioID) {
        this.audio = document.getElementById(audioID);
    }

    play() {
        if (!this.audio) { return; }
        if (typeof this.audio.play === 'function') {
            this.audio.play();
        }
    }
}

class ResizeData {
    constructor() {
        this.lastWidth = NaN;
        this.lastHeight = NaN;
    }
    isSameSize(newWidth, newHeight) {
        if (isNaN(this.lastWidth) || isNaN(this.lastHeight)) { return false; }
        return this.lastWidth === newWidth && newHeight === this.lastHeight;
    }
    update(newWidth, newHeight) {
        this.lastWidth = newWidth;
        this.lastHeight = newHeight;
    }
}

class Submit {
    constructor() {
        this.activeFKey = '';
    }

    prepare(key, flagsElement, flags) {
        this.activeFKey = key;
        if (flagsElement) {
            flagsElement.value = flags;
            return true;
        }
        return false;
    }

    go() {
        if (document.forms) {
            document.forms[0].submit();
            document.forms[0].submit = function () { }; // Avoid further submits
        }
    }
}

const theTerminal = new Terminal();
const theResizeData = new ResizeData();

// User accesible object and functions.
if (!window.asnaExpo) {
    window.asnaExpo = {};
}

window.asnaExpo.terminal = {
    executeMacro: theTerminal.executeMacro
}
