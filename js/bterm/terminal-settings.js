/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theSettings as Settings, Preferences, LOCAL_STORAGE_KEY };

/*eslint-disable*/
import { MouseEvents } from './terminal-device-pointers.js';
import { Labels } from './terminal-labels.js';
import { ID, ZINDEX, TerminalDOM } from './terminal-dom.js';
import { ToggleSwitch } from './terminal-toggle-switch.js';
import { ColorSettings } from './terminal-settings-colors.js';
/*eslint-enable*/

const LS_NAMESPACE = {
    TERMINAL: 'ASNA.5250Terminal',
    PAGE: 'ASNA.Page'
};

const POINTER_STATE = {
    IDLE: 'idle',
    START: 'start',
    MOVE: 'move'
};

const DRAG_DIRECTION = {
    IDLE: 'idle',
    UP: 'up',
    DOWN: 'down'
};

const DRAG_THRESHOLD = 5;

class Settings {
    constructor() {
        this.handleCaptureReleaseEvent = null;
        this.devicePointers = null;
        this.ptAtStart = null;
        this.ptCurrent = null;
        this.state = POINTER_STATE.IDLE;
        this.dragDir = DRAG_DIRECTION.IDLE;

        this.handlePointerMoveEvent = this.handlePointerMoveEvent.bind(this);
        this.handlePointerEndEvent = this.handlePointerEndEvent.bind(this);
    }

    init(idElementAbove, height, store ) {
        this.statusbarEl = document.getElementById(idElementAbove);
        if (!this.statusbarEl) {
            return;
        }

        theSettingsDialog.init(
            document.getElementById(ID.SETTINGS),
            height,
            TerminalDOM.getLocation(this.statusbarEl),
            TerminalDOM.getDimensions(this.statusbarEl),
            store
        );
    }

    hitTest(el) {
        if (!el || !this.statusbarEl ) { return false; }

        return el.id === this.statusbarEl.id || this.statusbarEl.contains(el);
    }

    startPointerCapture(x, y, handleCaptureReleaseEvent) {
        this.handleCaptureReleaseEvent = handleCaptureReleaseEvent;
        this.eventHandlingOperations('add');

        this.ptAtStart = this.ptCurrent = { x: x, y: y }; // Note: x,y do not include widnow scroll (displacement is relative)
        this.state = POINTER_STATE.START;
        theSettingsDialog.show(); // Shows, but it may not be visible, slide may be zero
    }

    handlePointerMoveEvent(event) {
        if (!(this.state === POINTER_STATE.START || this.state === POINTER_STATE.MOVE)) {
            return;
        }

        let pt = { x: event.clientX, y: event.clientY }; // Note: x,y do not include widnow scroll (displacement is relative)
        let verticalDistance = pt.y - this.ptAtStart.y;

        if (theSettingsDialog.state === 'open') {
            verticalDistance -= theSettingsDialog.height;
        }

        /*eslint-disable*/
        if (theSettingsDialog.height >= -(verticalDistance)) {
            this.slide(verticalDistance);
        }
        /*eslint-enable*/

        this.state = POINTER_STATE.MOVE;
        this.dragDir = pt.y < this.ptCurrent.y ? DRAG_DIRECTION.UP : DRAG_DIRECTION.DOWN;
        this.ptCurrent = { x: pt.x, y: pt.y };
    }

    handlePointerEndEvent(event) {
        let pt = { x: event.clientX, y: event.clientY }; // Note: x,y do not include widnow scroll (displacement is relative)
        let verticalDistance = this.ptAtStart.y - pt.y;

        if (Math.abs(verticalDistance) >= DRAG_THRESHOLD) {
            if (this.dragDir === DRAG_DIRECTION.UP) {
                this.open();
            }
            else {
                this.close();
            }
            this.state = POINTER_STATE.IDLE;
        }

        this.eventHandlingOperations('remove');
        this.dragDir = DRAG_DIRECTION.IDLE;

        if (this.handleCaptureReleaseEvent) {
            this.handleCaptureReleaseEvent(theSettingsDialog.state === DIALOG_STATE.OPEN);
        }
    }

    eventHandlingOperations(operation) {
        if (operation === 'add') {
            this.devicePointers = null;
        }

        if (!this.devicePointers) {
            this.devicePointers = new MouseEvents();
        }

        const fPointer = operation === 'add' ? this.devicePointers.addEventListener : this.devicePointers.removeEventListener;
        fPointer(window, null, this.handlePointerMoveEvent, this.handlePointerEndEvent, null);
    }

    slide(amount) {
        let xlateFnctText = amount !== 0 ? `translate(0px,${amount}px)`: '';

        theSettingsDialog.setStyleTransformation(xlateFnctText);
        TerminalDOM.setStyleTransform(this.statusbarEl, xlateFnctText);
        // $TO-DO: include Tablet BigButtons: Ok and Reset
    }

    open() {
        /*eslint-disable*/
        this.slide(-(theSettingsDialog.height));
        theSettingsDialog.state = DIALOG_STATE.OPEN;
        theSettingsDialog.show(); 
        /*eslint-enable*/
    }
    close() {
        const lastState = theSettingsDialog.state;
        this.slide(0);
        theSettingsDialog.state = DIALOG_STATE.CLOSED;
        theSettingsDialog.hide();

        return lastState === DIALOG_STATE.OPEN;
    }
}

const DIALOG_STATE = {
    UNDEFINED: 'undefined',
    OPEN: 'open',
    CLOSED: 'closed'
};

class SettingsDialog {
    constructor() {
        this.state = DIALOG_STATE.UNDEFINED;
        this.height = 0;
    }

    init(dialogElement, height, locElAbove, dimElAbove, store) {
        this.height = height;

        this.dialogElement = dialogElement;
        if (!this.dialogElement) {
            return;
        }

        this.state = this.dialogElement.style.display === 'block' ? DIALOG_STATE.OPEN : DIALOG_STATE.CLOSED;
        this.computeHeight();

        const setInnerHtml = TerminalDOM.setInnerHTML;

        setInnerHtml(ID.PREF_LFKHS, Labels.get('PREF_LFKHS'));

        if (true /*ASNA.Vendor.IsDesktop()*/) { // Excludes Win8Touch
            this.removeOption(ID.PREF_LKBD);
            setInnerHtml(ID.PREF_LFUBTNS, Labels.get('PREF_LFUBTNS'));
            setInnerHtml(ID.PREF_LKPADNOTE, Labels.get('PREF_LKPADNOTE'));
        }
        else {
            setInnerHtml(ID.PREF_LKBD, Labels.get('PREF_PREF_LKBD'));
            setInnerHtml(ID.PREF_LFUBTNS, Labels.get('PREF_LFUBTNS_MOBILE'));
        }
        setInnerHtml(ID.PREF_LKIBMSHOW, Labels.get('PREF_LKIBMSHOW'));

        setInnerHtml(ID.COLOR_Attr, Labels.get('COLOR_Attr'));
        setInnerHtml(ID.COLOR_Color, Labels.get('COLOR_Color'));
        setInnerHtml(ID.COLOR_BgColor, Labels.get('COLOR_BgColor'));
        setInnerHtml(ID.COLOR_LGREEN, Labels.get('COLOR_LGREEN'));
        setInnerHtml(ID.COLOR_LBLUE, Labels.get('COLOR_LBLUE'));
        setInnerHtml(ID.COLOR_LRED, Labels.get('COLOR_LRED'));
        setInnerHtml(ID.COLOR_LWHITE, Labels.get('COLOR_LWHITE'));
        setInnerHtml(ID.COLOR_LTURQUOISE, Labels.get('COLOR_LTURQUOISE'));
        setInnerHtml(ID.COLOR_LYELLOW, Labels.get('COLOR_LYELLOW'));
        setInnerHtml(ID.COLOR_LPINK, Labels.get('COLOR_LPINK'));
        setInnerHtml(ID.COLOR_Other, Labels.get('COLOR_Other'));
        setInnerHtml(ID.COLOR_LCURSOR, Labels.get('COLOR_LCURSOR'));
        setInnerHtml(ID.COLOR_LSEL, Labels.get('COLOR_LSEL'));

        TerminalDOM.setElValue(ID.COLOR_APPLY, Labels.get('ColorApply'));
        TerminalDOM.setElValue(ID.COLOR_DEFAULTS, Labels.get('ColorDefaults'));

        this.dialogElement.style.left = `${locElAbove.l}px`;
        this.dialogElement.style.top = `${locElAbove.t + (dimElAbove.h - 1)}px`;

        this.dialogElement.style.height = `${this.height}px`;
        this.dialogElement.style.zIndex = ZINDEX.TERMINAL_SETTINGS;

        this.functKeyHotspotSwitch = new ToggleSwitch(
            this.dialogElement.querySelector(`#${ID.SETTINGS_FK_HOTSPOTSCHECKBOX}`),
            store.state.show.functionKeyHotspots,
            store
        );

        this.resetButtonSwitch = new ToggleSwitch(
            this.dialogElement.querySelector(`#${ID.SETTINGS_BUTTONSCHECKBOX}`), 
            store.state.show.bigButtons,
            store
        );
        this.ibmKeypadSwitch = new ToggleSwitch(
            this.dialogElement.querySelector(`#${ID.SETTINGS_IBMKPAD_CHECKBOX}`),
            store.state.show.ibmKeypad,
            store
        );

        ColorSettings.init(
            this.dialogElement.querySelector(`#${ID.SETTINGS_COLORS}`),
            store
        );

        this.hide(); // Initially hidden
    }

    show() {
        if (this.dialogElement) {
            this.dialogElement.style.display = 'block';
            this.computeHeight();
            this.enableChildren();
        }
    }

    hide() {
        if (this.dialogElement) {
            this.dialogElement.style.display = 'none';
            this.disableChildren();
        }
    }

    enableChildren() {
        if (this.functKeyHotspotSwitch) {
            this.functKeyHotspotSwitch.enabled = true;
        }
        if (this.resetButtonSwitch) {
            this.resetButtonSwitch.enabled = true;
        }
        if (this.ibmKeypadSwitch) {
            this.ibmKeypadSwitch.enabled = true;
        }

        // $TO-DO: color button
    }

    disableChildren() {
        if (this.functKeyHotspotSwitch) {
            this.functKeyHotspotSwitch.enabled = false;
        }
        if (this.resetButtonSwitch) {
            this.resetButtonSwitch.enabled = false;
        }
        if (this.ibmKeypadSwitch) {
            this.ibmKeypadSwitch.enabled = false;
        }

        // $TO-DO: color button
    }

    computeHeight() {
        if (this.state === DIALOG_STATE.OPEN) {
            const rect = this.dialogElement.getBoundingClientRect();
            this.height = rect.height;
        }
    }

    setStyleTransformation(functionText) {
        if (!this.dialogElement) { return; }

        TerminalDOM.setStyleTransform(this.dialogElement, functionText);
    }

    removeOption(optLabelId) {
        const optlabel = document.getElementById(optLabelId);
        if (!optlabel) {
            return;
        }

        const chkBoxSpanId = optlabel.getAttribute('for');
        if (!chkBoxSpanId) {
            return;
        }

        const chkBoxSpan = document.getElementById(chkBoxSpanId);
        if (!chkBoxSpan) {
            return;
        }

        const chkBoxLabel = chkBoxSpan.parentElement;
        optlabel.parentElement.removeChild(optlabel);
        chkBoxLabel.parentElement.removeChild(chkBoxLabel)
    }
}

const DEFAULTS = {
    colors: {
        green: '#00FF00', blue: '#0099FF', red: '#FF0000', white: '#FFFFFF', turquoise: '#AFEEEE', yellow: '#FFFF00', pink: '#FF1493', bkgd: '#000000', cursor: '#FFFFFF', sel: '#FFFFFF', statBarColor: '#000000', statBarBkgdColor: '#FFFFFF'
    },
    show: {
        functionKeyHotspots: true,
        bigButtons: false,
        ibmKeypad: false
    },
    locations: {
        ibmKeypad: {
            left: 'calc',
            top: 'calc'
        }
    },
    detect: {
        hasPhysicalKeyboard: true
    }
};

const LOCAL_STORAGE_KEY = {
    COLORS: 'colors',
    SHOW_OPTIONS: 'show',
    LOCATIONS: 'locations'
};

class Preferences {
    static deserializeColors() {
        return Preferences.readFromLocalStorage(LOCAL_STORAGE_KEY.COLORS, DEFAULTS.colors);
    }

    static serializeColors(colors) {
        Preferences.writeToLocalStorage(LOCAL_STORAGE_KEY.COLORS,colors);
    }

    static deserializeShow() {
        return Preferences.readFromLocalStorage(LOCAL_STORAGE_KEY.SHOW_OPTIONS, DEFAULTS.show);
    }

    static serializeShow(show) {
        Preferences.writeToLocalStorage(LOCAL_STORAGE_KEY.SHOW_OPTIONS, show);
    }

    static deserializeLocations() {
        return Preferences.readFromLocalStorage(LOCAL_STORAGE_KEY.LOCATIONS, DEFAULTS.locations);
    }
    static serializeLocations(locations) {
        Preferences.writeToLocalStorage(LOCAL_STORAGE_KEY.LOCATIONS, locations);
    }

    static readFromLocalStorage(key, defaultValue) {
        const str = localStorage.getItem(`${LS_NAMESPACE.TERMINAL}.${key}`);
        if (!str) {
            return defaultValue;
        }

        let result = defaultValue;

        try {
            result = window.JSON.parse(str);
        }
        finally {
            return result;
        }
    }

    static writeToLocalStorage(key, val) {
        let str = '';

        try {
            str = window.JSON.stringify(val);
            localStorage.setItem(`${LS_NAMESPACE.TERMINAL}.${key}`, str);
        }
        /*eslint-disable*/
        catch (e) {}
        /*eslint-enable*/
    }

    static removeFromLocalStorage(key) {
        localStorage.removeItem(`${LS_NAMESPACE.TERMINAL}.${key}`);
    }
}

const theSettings = new Settings();
const theSettingsDialog = new SettingsDialog();
