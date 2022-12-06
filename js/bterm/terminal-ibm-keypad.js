/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theIbmKeypad as IbmKeypad };

/*eslint-disable*/
import { MouseEvents } from './terminal-device-pointers.js';
import { ID, ZINDEX, TerminalDOM } from './terminal-dom.js';
import { Labels } from './terminal-labels.js';
import { StateChangeActionType } from './terminal-redux.js';
/*eslint-enable*/


const SVG_OPEN_TAG = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">';
const SVG_CLOSE_TAG = '</svg>';
const SVG_LEFT = '<path class="arrows" d="m 27.4375,17.5625 5.327297,-4.625 5.327298,-4.6250005 0.03481,6.0312505 c 0.01867,-0.01675 0.07587,-0.03125 0.104461,-0.03125 l 14.136488,0 c 0.0572,0 0.06965,0.04243 0.06965,0.09375 l 0,6.21875 c 0,0.05132 -0.01246,0.09375 -0.06965,0.09375 l -14.136488,0 c -0.02858,0 -0.08579,-0.0145 -0.104456,-0.03125 l 0,6 -5.362109,-4.5625 -5.327297,-4.5625 z" />';
const SVG_RIGHT = '<path class="arrows" d="M 52.437504,17.5625 47.110207,12.9375 41.782909,8.3124995 41.748099,14.34375 C 41.729429,14.327 41.672229,14.3125 41.643638,14.3125 l -14.136488,0 c -0.0572,0 -0.06965,0.04243 -0.06965,0.09375 l 0,6.21875 c 0,0.05132 0.01246,0.09375 0.06965,0.09375 l 14.136488,0 c 0.02858,0 0.08579,-0.0145 0.104456,-0.03125 l 0,6 5.362109,-4.5625 5.327297,-4.5625 z" />';
const SVG_UP = '<path class="arrows" d="m 40,4.999999 -4.625,5.327298 -4.625,5.327297 6.03125,0.03481 C 36.7645,15.708073 36.75,15.765271 36.75,15.793866 l 0,14.136488 C 36.75,29.987552 36.79243,30 36.84375,30 l 6.21875,0 c 0.05132,0 0.09375,-0.01246 0.09375,-0.06965 l 0,-14.136488 c 0,-0.02858 -0.0145,-0.08579 -0.03125,-0.104456 l 6,0 L 44.5625,10.327298 40,5 z" />';
const SVG_DOWN = '<path class="arrows" d="m 40,30 -4.625,-5.327298 -4.625,-5.327297 6.03125,-0.03481 C 36.7645,19.291926 36.75,19.234728 36.75,19.206133 l 0,-14.136488 c 0,-0.057198 0.04243,-0.069646 0.09375,-0.069646 l 6.21875,0 c 0.05132,0 0.09375,0.01246 0.09375,0.06965 l 0,14.136488 c 0,0.02858 -0.0145,0.08579 -0.03125,0.104456 l 6,0 -4.5625,5.362108 L 40,29.999999 z" />';

const DATA_ATTR = {
    POPUP_RANGE: 'data-popup-range',
    BUTTON_ARRAY_STR: 'data-button-array'
};

class IbmKeypad {
    constructor() {
        this.handleOpacityTransitionEndEvent = this.handleOpacityTransitionEndEvent.bind(this);

        this.handleContainerDragStartEvent = this.handleContainerDragStartEvent.bind(this);
        this.handleContainerDragOverEvent = this.handleContainerDragOverEvent.bind(this);
        this.handleContainerDragEndEvent = this.handleContainerDragEndEvent.bind(this);

        this.handleButtonPointerStartEvent = this.handleButtonPointerStartEvent.bind(this);
        this.activePopup = null;
    }

    init(parentEl, termLayout, actionCallback, actionMap, store) {
        this.actionCallback = actionCallback;
        this.actionMap = actionMap;
        this.store = store;

        this.create(parentEl, termLayout);
        // const userDefPopup = parentEl.querySelector(`#${ID.IBM_KPAD_USR_POPUP}`);
        // const rangePopup = parentEl.querySelector(`#${ID.IBM_KPAD_RANGE_POPUP}`);
        // const enumPopup = parentEl.querySelector(`#${ID.IBM_KPAD_ENUM_POPUP}`);

        if (this.keypad) {
            this.keypad.style.zIndex = ZINDEX.IBM_KPAD_KEYPAD;
        }
        //if (userDefPopup) {
        //    userDefPopup.style.zIndex = ZINDEX.IBM_KPAD_POPUP;
        //}
        //if (enumPopup) {
        //    enumPopup.style.zIndex = ZINDEX.IBM_KPAD_POPUP;
        //}

        if (this.keypad) {
            this.keypad.setAttribute('draggable', 'true');

            this.keypad.addEventListener('dragstart', this.handleContainerDragStartEvent, false);
            document.addEventListener('dragover', this.handleContainerDragOverEvent, false);
            this.keypad.addEventListener('dragend', this.handleContainerDragEndEvent, false);
        }
    }

    initialLocation(termLayout, persistantLocation) {
        if (!this.keypad) { return; }

        this.initLocation(termLayout, persistantLocation);
    }

    create(parentEl) {
        this.keypad = parentEl.querySelector(`#${ID.IBM_KPAD_CONTAINER}`);
        if (!this.keypad) { return; }

        this.keypad.style.display = 'none';
        const fragment = document.createDocumentFragment();
        this.addDefaultIbmButtons(fragment);

        // TO-DO: Add user-defined buttons (persistent data)

        this.keypad.appendChild(fragment);
    }

    initLocation(termLayout, persistantLocation) {
        if (!this.keypad /* || this.locationInitialized */) {
            return;
        }

    /* this.locationInitialized = true; */

        let newLocation = {};

        if (persistantLocation.left !== 'calc' && persistantLocation.top !== 'calc') {
            newLocation.left = persistantLocation.left;
            newLocation.top = persistantLocation.top;
        }
        else {
            if (false/*ASNA.Vendor.IsMobile()*/) {
                newLocation.left = ((termLayout.w - this.metrics.pad.width) / 2);
                newLocation.top = (4 * (termLayout.h / 6));
            }
            else {
                newLocation.left = termLayout.w - this.metrics.pad.width;
                newLocation.top = 0;
            }

            if (false/*ASNA.Vendor.IsMobile() && !_popupOverFits(t)*/) {
                newLocation.top = this.highestFullVisibleTop();
            }
        }

        this.keypad.style.left = `${newLocation.left}px`;
        this.keypad.style.top = `${newLocation.top}px`;

        this.store.dispatch({
            type: StateChangeActionType.LOCATION_CHANGE,
            payload: {
                id: 'ibmKeypad',
                location: newLocation
            }
        });
    }

    show() {
        this.setVisibility(true);
        this.addButtonsPointerEventHandlers();
    }

    hide() {
        this.setVisibility(false);
    }

    setVisibility(state) {
        if (!this.keypad.style) { return; }

        const style = this.keypad.style;
        const opacity = parseFloat(style.opacity);

        if (state && (isNaN(opacity) || opacity === 0)) { // It is OFF, turn it ON
            style.display = 'block';

            style.transitionProperty = 'opacity';
            style.transitionDuration = '1000ms';

            this.keypad.addEventListener('transitionend', this.handleOpacityTransitionEndEvent, false );
            style.opacity = 1;
        }
        else if (!state) { // It is ON, turn it OFF
            this.hideAllPopups();

            style.transitionProperty = 'opacity';
            style.transitionDuration = '1000ms';

            this.keypad.addEventListener('transitionend', this.handleOpacityTransitionEndEvent, false);
            style.opacity = 0;
        }
    }

    handleOpacityTransitionEndEvent(event) {
        event.target.removeEventListener('transitionend', this.handleOpacityTransitionEndEvent);
        const style = this.keypad.style;
        const opacity = parseFloat(style.opacity);

        if (!isNaN(opacity) && opacity > 0) {
            style.display = 'block';
        }
        else {
            style.display = 'none';
        }
    }

    highestFullVisibleTop() {
        const popupH = (1 + 12) * this.metrics.selBtn.height; // 12 FKeys plus empty-cancel button
        const vertBorderH = (this.metrics.pad.height - this.metrics.btn.height) / 2;

        return popupH - (vertBorderH + this.metrics.btn.height);
    }

    addDefaultIbmButtons(fragment) {
        this.metrics = new KeypadMetrics(this.keypad);

        let spc = (this.metrics.pad.width - (8 * this.metrics.btn.width)) / 12;
        if (spc < 0) {
            spc = 0;
        }

        const firstBtnLayout = { left: spc, w: this.metrics.btn.width };

        const fixedBtns = [];
        fixedBtns.push({ type: ID.IBM_KPAD_RANGE_POPUP, text: Labels.get('KPAD_BTN1'), action: 'F1>F12' });
        fixedBtns.push({ type: ID.IBM_KPAD_RANGE_POPUP, text: Labels.get('KPAD_BTN2'), action: 'F13>F24' });
        fixedBtns.push({ type: ID.IBM_KPAD_ENUM_POPUP, text: Labels.get('KPAD_BTN3'), action: IbmKeypad.getSpecialActionKeys() });
        fixedBtns.push({ type: 'gap', text: '', action: '' });

        const x = IbmKeypad.addButtons(fragment, fixedBtns, firstBtnLayout.left, firstBtnLayout);

        const userBtns = [];
        if (true /*ASNA.Vendor.IsDesktop()*/ || false /*ASNA.Vendor.IsWin8Touch()*/) {
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR4")), action: Labels.get("KPAD_USR4") });
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR5")), action: Labels.get("KPAD_USR5") });
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR6")), action: Labels.get("KPAD_USR6") });
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR7")), action: Labels.get("KPAD_USR7") });
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR8")), action: Labels.get("KPAD_USR8") });
        }
        else {
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR4_MOBILE")), action: Labels.get("KPAD_USR4_MOBILE") });
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR5_MOBILE")), action: Labels.get("KPAD_USR5_MOBILE") });
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR6_MOBILE")), action: Labels.get("KPAD_USR6_MOBILE") });
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR7_MOBILE")), action: Labels.get("KPAD_USR7_MOBILE") });
            userBtns.push({ type: ID.IBM_KPAD_CONTAINER, text: Labels.get('KPAD_' + Labels.get("KPAD_USR8_MOBILE")), action: Labels.get("KPAD_USR8_MOBILE") });
        }

        IbmKeypad.addButtons(fragment, userBtns, x, firstBtnLayout);
    }

    hideAllPopups() {

    }

    handleContainerDragStartEvent(event) {
        if (this.activePopup) { this.removeActivePopup(); }
        this.dragging = { mouseStartX: event.clientX, mouseStartY: event.clientY };
    }

    handleContainerDragOverEvent(event) {
        event.dataTransfer.dropEffect = 'move';
        TerminalDOM.cancelEvent(event);
    }

    handleContainerDragEndEvent(event) {
        const keypad = this.keypad;

        let offsetX = this.dragging.mouseStartX - event.clientX;
        let offsetY = this.dragging.mouseStartY - event.clientY;

        const newLocation = {
            left: keypad.getBoundingClientRect().left - offsetX,
            top: keypad.getBoundingClientRect().top - offsetY
        };

        keypad.style.left = `${newLocation.left}px`;
        keypad.style.top = `${newLocation.top}px`;

        TerminalDOM.cancelEvent(event);
        delete this.dragging;

        this.store.dispatch({
            type: StateChangeActionType.LOCATION_CHANGE,
            payload: {
                id: 'ibmKeypad',
                location: newLocation
            }
        });
    }

    addButtonsPointerEventHandlers() {
        if (!this.keypad) { return; }
        this.pointerEvents = new MouseEvents();

        let buttonClass = CSS_NAME.IBM_KPAD_BUTTON;
        if (false /*ASNA.Vendor.IsMobile()*/) {
            buttonClass = CSS_NAME.IBM_KPAD_BUTTON_MOBILE;
        }

        const sel = this.keypad.querySelectorAll(`.${buttonClass}`);
        for (let i = 0, l = sel.length; i < l; i++) {
            const btn = sel[i];
            this.pointerEvents.addEventListener(btn, this.handleButtonPointerStartEvent, null, null);
        }
   }

    handleButtonPointerStartEvent(event) {
        const btn = event.target;

        TerminalDOM.cancelEvent(event);

        const range = btn.getAttribute(DATA_ATTR.POPUP_RANGE);
        const btnArrayJsonStr = btn.getAttribute(DATA_ATTR.BUTTON_ARRAY_STR);

        if (range) {
            this.metrics.completeKeypadLocation(this.keypad);
            this.removeActivePopup();
            this.activePopup = new FkeyRangePopup(btn, range, this.metrics, this.handleButtonPointerStartEvent);
            this.activePopup.show();
            return;
        }
        else if (btnArrayJsonStr) {
            this.metrics.completeKeypadLocation(this.keypad);
            this.removeActivePopup();
            this.activePopup = new SpecialEnumPopup(btn, btnArrayJsonStr, this.metrics, this.handleButtonPointerStartEvent);
            this.activePopup.show();
            return;
        }
        else if (btn.innerText && this.actionCallback) {
            const action = IbmKeypad.getActionFromId(btn.id);
            if (action) {
                console.log(`[handleButtonPointerStartEvent] will attempt to execute:${action}`);
                this.actionCallback('', action);
                this.removeActivePopup();
            }
        }
        else {
            const action = IbmKeypad.getActionFromId(btn.id);
            if (action === CANCEL_POPUP) {
                this.removeActivePopup();
            }
        } 
    }

    removeActivePopup() {
        if (this.activePopup) {
            this.activePopup.hide();
            this.activePopup = null;
        }
    }

    static getActionFromId(id) {
        return id.replace(/^_+/, '');   // Remove leading '_'
    }

    static getSpecialActionKeys() {
        let result = '{ "keys": [';
        const actionList = Labels.get('KPAD_BTN3_ACTIONS').split(',');

        for (let i = 0, l = actionList.length; i < l; i++) {
            result += '{ "text":' + '"' + Labels.get('KPAD_' + actionList[i]) + '",' + '"action":' + '"' + actionList[i] + '"}';
            if (i + 1 < l) {
                result += ',';
            }
        }

        result += ']}';
        return result;
    }

    static addButtons(fragment, buttons, x, layout) {
        for (let i = 0, l = buttons.length; i < l; i++) {
            if (buttons[i].type !== 'gap') {
                let htmlText = '';

                if (buttons[i].action === 'LEFT' || buttons[i].action === 'RIGHT' || buttons[i].action === 'UP' || buttons[i].action === 'DOWN') {
                    htmlText = SVG_OPEN_TAG + IbmKeypad.getSvg(buttons[i].action) + SVG_CLOSE_TAG;
                }
                else {
                    htmlText = buttons[i].text;
                }

                IbmKeypad.addIbmButton(fragment, x, buttons[i].type, htmlText, buttons[i].action);
                x += layout.left + layout.w;
            }
            else {
                x += 3 * layout.left;
            }
        }

        return x;
    }

    static getSvg(action) {
        if (action === 'LEFT') {
            return SVG_LEFT;
        }
        else if (action === 'RIGHT') {
            return SVG_RIGHT;
        }
        else if (action === 'UP') {
            return SVG_UP;
        }

        return SVG_DOWN;  // DOWN
    }

    static addIbmButton(fragment, left, type, text, action) {
        const btn = document.createElement('button');

        if (type === ID.IBM_KPAD_CONTAINER) {
            btn.id = IbmKeypad.buildUniqueID(ID.IBM_KPAD_CONTAINER, action);
        }
        else if (type === ID.IBM_KPAD_RANGE_POPUP) {
            btn.setAttribute(DATA_ATTR.POPUP_RANGE, action);
        }
        else if (type === ID.IBM_KPAD_ENUM_POPUP) {
            btn.setAttribute(DATA_ATTR.BUTTON_ARRAY_STR, action );
        }

        if (false /*ASNA.Vendor.IsMobile()*/) {
            btn.className = CSS_NAME.IBM_KPAD_BUTTON_MOBILE;
        }
        else {
            btn.className = CSS_NAME.IBM_KPAD_BUTTON;
        }
        btn.style.left = left + 'px';

        btn.innerHTML = text;
        fragment.appendChild(btn);

        return btn;
    }

    static buildUniqueID(selType, action) {
        let result = '';
        let underscoreCount = 0;

        if (selType === ID.IBM_KPAD_CONTAINER) {
            underscoreCount = 1;
        }
        else if (selType === ID.IBM_KPAD_USR_POPUP) {
            underscoreCount = 2;
        }
        else if (selType === ID.IBM_KPAD_RANGE_POPUP) {
            underscoreCount = 3;
        }
        else if (selType === ID.IBM_KPAD_ENUM_POPUP) {
            underscoreCount = 4;
        }

        for (let index = 0; index < underscoreCount; index++) {
            result += '_';
        }

        return result + action;
    }
}

const CSS_NAME = {
    IBM_KPAD_BUTTON: 'AsnaTermIbmKeyPadButton',
    IBM_KPAD_BUTTON_MOBILE: 'AsnaTermIbmKeyPadButtonMobile',
    IBM_KPAD_SEL_BUTTON: 'AsnaTermIbmPopupSelButton',
    IBM_KPAD_SEL_BUTTON_MOBILE: 'AsnaTermIbmPopupSelButtonMobile',
    IBM_KPAD_SEL_BUTTON_ACTIVE: 'AsnaTermIbmPopupSelActiveButton',
    IBM_KPAD_SEL_TOOLTIP: 'AsnaTermIbmActionKeyMapTooltip'
}; 

const IBM_KEYPAD = 0;
const USER_DEF_POPUP = 1;
const RANGE_POPUP= 2;
const ENUM_POPUP= 3;
const OBJ_STORAGE_VERSION= 1;
const DISPLAY_POPUP_TIMEOUT= 2000; // 500,
const CANCEL_POPUP= 'DONOTHING';
const MOBILE = 'Mobile';


class KeypadMetrics {
    constructor(keypadEl) {
        this.isMobile = false; // TO-DO: detect

        const dim = TerminalDOM.getDimensions(keypadEl); // It may not be visible yet, get upper-left corner from style
        this.pad = { width: dim.w, height: dim.h }; 

        this.btn = KeypadMetrics.measureButton(this.isMobile ? CSS_NAME.IBM_KPAD_BUTTON_MOBILE : CSS_NAME.IBM_KPAD_BUTTON);
        this.selBtn = KeypadMetrics.measureButton(this.isMobile ? CSS_NAME.IBM_KPAD_SEL_BUTTON_MOBILE : CSS_NAME.IBM_KPAD_SEL_BUTTON);
    }

    completeKeypadLocation(keypadEl) {
        this.pad = keypadEl.getBoundingClientRect(); // It should now be visible.
        // this.pad.left = location.left;
        // this.pad.top = location.top;
    }

    static measureButton(cssName) {
        let button = document.createElement('button');
        button.type = 'button';
        button.className = cssName;

        document.body.appendChild(button);
        let rect = button.getBoundingClientRect();
        document.body.removeChild(button);
        button = null;

        return rect;
    }
}

class KeypadPopup {
    static addPointerListeners(el,handlePointerStart) {
        const children = el.querySelectorAll(`.${KeypadPopup.determineChildBtnClass()}`);
        for (let i = 0, l = children.length; i < l; i++) {
            const btn = children[i];
            new MouseEvents().addEventListener(btn, handlePointerStart, null, null);
        }
    }

    static determineChildBtnClass() {
        if (false /*ASNA.Vendor.IsMobile()*/) {
            return CSS_NAME.IBM_KPAD_SEL_BUTTON_MOBILE;
        }
        return CSS_NAME.IBM_KPAD_SEL_BUTTON;
    }

    static removeElements(popup) {
        if (!popup) { return; }

        while (popup.firstChild) {
            popup.removeChild(popup.firstChild);
        }
        const parent = popup.parentElement;
        if (parent) {
            parent.removeChild(popup);
        }
    }

    static calcPopupRect(anchorButton, metrics, rows ) {
        const rectAnchor = anchorButton.getBoundingClientRect();
        return { left: rectAnchor.left, top: 0, width: metrics.selBtn.width, height: rows * metrics.selBtn.height};
    }

    static calcPlacement(metrics, popupRect) {
        const btnDim = metrics.selBtn;
        const _5250Canvas = document.getElementById(ID.CANVAS);
        const _5250rect = _5250Canvas.getBoundingClientRect();

        let place = '';
        let top = 0;

        let candidateTop = (metrics.pad.top + metrics.pad.height - (metrics.pad.height - btnDim.height) / 2) - popupRect.height;

        if (candidateTop >= 0) {
            top = candidateTop;
            place = 'over';
        }
        else {
            candidateTop = metrics.pad.top + ((metrics.pad.height - btnDim.height) / 2);

            if (candidateTop + popupRect.height < _5250rect.height) {
                top = candidateTop;
                place = 'under';
            }
        }

        if (!place) {
            top = 0;
            place = 'over';
        }

        return { top: top, place: place };
    }
}

class FkeyRangePopup {
    constructor(anchorButton, range, metrics, handleButtonPointerStartEvent) {
        this.anchorButton = anchorButton;
        this.range = range; // 'F1>F12'  or 'F13>F24'
        this.metrics = metrics;

        this.handleButtonPointerStartEvent = handleButtonPointerStartEvent; // Note: this function is bound to IbmKeypad instance
    }

    show(keypad) {
        if (!this.range) { return; }

        const r = this.range.split('>');

        if (!(r.length > 1 && r[0].charAt(0) === 'F')) {
            return;
        }

        const fKeyFrom = parseInt(r[0].substring(1));
        const fKeyTo = parseInt(r[1].substring(1));
        // const rectAnchor = this.anchorButton.getBoundingClientRect();

        const rows = fKeyTo - fKeyFrom + 1 + 1; // Note: We are adding one more button to 'cancel'

        const popupRect = KeypadPopup.calcPopupRect(this.anchorButton, this.metrics, rows);
        const placement = KeypadPopup.calcPlacement(this.metrics, popupRect);

        this.popupElement = document.createElement('div');
        this.popupElement.id = ID.IBM_KPAD_RANGE_POPUP;
        const style = this.popupElement.style;
        style.position = 'absolute';
        style.left = `${popupRect.left}px`;
        style.top = `${placement.top}px`;
        style.width = `${popupRect.width}px`;
        style.height = `${popupRect.height}px`;
        style.display = 'block';
        style.zIndex = ZINDEX.IBM_KPAD_POPUP;

        const fragment = this.addFKeyRangeButtons(fKeyFrom, fKeyTo, rows, placement);
        this.popupElement.appendChild(fragment);

        document.body.appendChild(this.popupElement);
        KeypadPopup.addPointerListeners(this.popupElement, this.handleButtonPointerStartEvent);
    }

    hide() {
        KeypadPopup.removeElements(this.popupElement);
        delete this.popupElement;
    }

    addFKeyRangeButtons(from, to, rows, placement) {
        const fragment = document.createDocumentFragment();
        const offset = placement.place === 'under' ? 1 : 0;

        for (let fn = from - 1, childTop = 0, r = 0; r < rows; fn++ , childTop += this.metrics.selBtn.height, r++) {
            const childBtn = document.createElement('button');

            if (placement.place === 'under' && r === 0 || placement.place === 'over' && r === rows - 1) {
                childBtn.id = IbmKeypad.buildUniqueID(ID.IBM_KPAD_RANGE_POPUP, CANCEL_POPUP);
                childBtn.innerHTML = '';
            }
            else {
                let action = '';

                if (placement.place === 'over') {
                    action = 'F' + (to - r); // Reverse order (to keep the lowest Fn close to where finger is located)
                }
                else {
                    action = 'F' + (fn - offset + 1);
                }
                childBtn.id = IbmKeypad.buildUniqueID(ID.IBM_KPAD_RANGE_POPUP, action);
                childBtn.innerHTML = action;
            }

            childBtn.className = KeypadPopup.determineChildBtnClass();
            childBtn.style.left = '0px';
            childBtn.style.top = `${childTop}px`;

            fragment.appendChild(childBtn);
        }

        return fragment;
    }

}

class SpecialEnumPopup {
    constructor(anchorButton, btnArrayJsonStr, metrics, handleButtonPointerStartEvent) {
        this.anchorButton = anchorButton;
        this.btnArrayJsonStr = btnArrayJsonStr;
        this.metrics = metrics;

        this.handleButtonPointerStartEvent = handleButtonPointerStartEvent; // Note: this function is bound to IbmKeypad instance
    }

    show(keypad) {
        if (!this.btnArrayJsonStr) { return; }

        const btnArray = SpecialEnumPopup.jsonParse(this.btnArrayJsonStr);

        if (!btnArray) { return; }

        const rows = btnArray.keys.length + 1; // Note: We are adding one more button to 'cancel'
        const popupRect = KeypadPopup.calcPopupRect(this.anchorButton, this.metrics, rows);
        const placement = KeypadPopup.calcPlacement(this.metrics, popupRect);

        this.popupElement = document.createElement('div');
        this.popupElement.id = ID.IBM_KPAD_ENUM_POPUP;
        const style = this.popupElement.style;
        style.position = 'absolute';
        style.left = `${popupRect.left}px`;
        style.top = `${placement.top}px`;
        style.width = `${popupRect.width}px`;
        style.height = `${popupRect.height}px`;
        style.display = 'block';
        style.zIndex = ZINDEX.IBM_KPAD_POPUP;

        const fragment = this.addSpecialButtons(rows, btnArray, placement);
        this.popupElement.appendChild(fragment);

        document.body.appendChild(this.popupElement);
        KeypadPopup.addPointerListeners(this.popupElement, this.handleButtonPointerStartEvent);
    }

    hide() {
        KeypadPopup.removeElements(this.popupElement);
        delete this.popupElement;
    }

    addSpecialButtons(rows, btnArray, placement) {
        const fragment = document.createDocumentFragment();
        const offset = placement.place === 'under' ? 1 : 0;

        for (let r = 0, childTop = 0; r < rows; r++ , childTop += this.metrics.selBtn.height) {
            const childBtn = document.createElement('button');

            if (placement.place === 'under' && r === 0 || placement.place === 'over' && r == rows - 1) {
                childBtn.id = IbmKeypad.buildUniqueID(ID.IBM_KPAD_ENUM_POPUP, CANCEL_POPUP);
                childBtn.innerHTML = '';
            }
            else {
                childBtn.id = IbmKeypad.buildUniqueID(ID.IBM_KPAD_ENUM_POPUP, btnArray.keys[r - offset].action);
                childBtn.innerHTML = btnArray.keys[r - offset].text;
            }

            childBtn.className = KeypadPopup.determineChildBtnClass();
            childBtn.style.left = '0px';
            childBtn.style.top = `${childTop}px`;

            fragment.appendChild(childBtn);
        }

        return fragment;
    }

    static jsonParse(str) {
        try {
            return window.JSON.parse(str);
        }
        /*eslint-disable*/
        catch (e) {

        }
        /*eslint-enable*/

        return null;
    }
}

const theIbmKeypad = new IbmKeypad();

