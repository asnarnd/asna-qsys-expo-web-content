/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theFKeyHotspot as FKeyHotspot };

/*eslint-disable*/
import { TerminalDOM, ZINDEX } from './terminal-dom.js';
/*eslint-enable*/

const TEMCSS_NAME = {
    FKEY_HOTSPOT: 'AsnaTermFKeyHotSpot',
    FKEY_HOTSPOT_MOBILE: 'AsnaTermFKeyHotSpotMobile',
    TOUCHABLE_INPUT: 'AsnaTermFldTouchableMask',
    IBM_BIG_BUTTON: 'AsnaTermIbmBigButton',
    IBM_BIG_BUTTON_MOBILE: 'AsnaTermIbmBigButtonMobile',
    GREEN_BUTTON: 'AsnaTermGoColorButton',
    GREEN_BUTTON_MOBILE: 'AsnaTermGoColorButtonMobile',
    ORANGE_BUTTON: 'AsnaTermWarningColorButton',
    ORANGE_BUTTON_MOBILE: 'AsnaTermWarningColorButtonMobile',
    IBM_KPAD_BUTTON: 'AsnaTermIbmKeyPadButton',
    IBM_KPAD_BUTTON_MOBILE: 'AsnaTermIbmKeyPadButtonMobile',
    IBM_KPAD_SEL_BUTTON: 'AsnaTermIbmPopupSelButton',
    IBM_KPAD_SEL_BUTTON_MOBILE: 'AsnaTermIbmPopupSelButtonMobile',
    IBM_KPAD_SEL_BUTTON_ACTIVE: 'AsnaTermIbmPopupSelActiveButton',
    IBM_KPAD_SEL_TOOLTIP: 'AsnaTermIbmActionKeyMapTooltip',
    COLOR_SAMPLE: 'AsnaTermColorSample',
    COLOR_INPUT_HEX: 'AsnaTermCOLOR_INPUT_HEX',
    COLOR_LUMINANCE: 'AsnaTermColorLuminance',
    COLOR_CLOSE_ICON: 'AsnaTermCloseIcon',
    COLOR_APPLY: 'AsnaTermColorApply',
    COLOR_DEFAULTS: 'AsnaTermColorDefaults'
};

class FKeyHotspot {
    constructor() {
        // this.action = '';
        // this.executeFn = null;
        // this.active = false;
        // this.inst;
        // this.onReleaseFn;

        this.handleButtonClickEvent = this.handleButtonClickEvent.bind(this);
    }

    init(parent, boxArray, exeSBCallback, visible) {
        let fragment = document.createDocumentFragment();
        let a = [];
        let dim = this.getFKeyHotSpotDim();

        this.executeFn = exeSBCallback;

        for (let i = 0; i < boxArray.length; i++) {
            const hotSpot = this.createDOM_Button();

            if (false/*ASNA.Vendor.IsMobile()*/) {
                hotSpot.className = TEMCSS_NAME.FKEY_HOTSPOT_MOBILE;
            }
            else {
                hotSpot.className = TEMCSS_NAME.FKEY_HOTSPOT;
            }
            let l = boxArray[i].box.r - dim.w;
            if (l < 0) {
                l = 0;
            }
            hotSpot.style.left = l + 'px';
            hotSpot.style.top = ((boxArray[i].box.t + (boxArray[i].box.h / 2)) - (dim.h / 2)) + 'px';
            hotSpot.style.zIndex = ZINDEX.TERMINAL_HOTSPOT;
            hotSpot.style.display = visible ? 'block' : 'none';

            this.setButtonContent(hotSpot, boxArray[i].action);

            a.push(hotSpot);
            fragment.appendChild(hotSpot);
        }

        parent.appendChild(fragment);
        this.avoidOverlap(a);
        this.addClickEventHandler(a);
    }

    getFKeyHotSpotDim() {
        let hotSpot = this.createDOM_Button();
        let result;

        if (false /*ASNA.Vendor.IsMobile()*/) {
            hotSpot.className = TEMCSS_NAME.FKEY_HOTSPOT_MOBILE;
        }
        else {
            hotSpot.className = TEMCSS_NAME.FKEY_HOTSPOT;
        }

        // $TO-DO: could we use getBoundingRect instead ...
        hotSpot.style.left = '-500px';
        document.body.appendChild(hotSpot);
        result = this.getDim(hotSpot);
        document.body.removeChild(hotSpot);

        return result;
    }

    getLoc = function (el) {
        let lPropVal = typeof (el.style) !== 'undefined' ? el.style.left : null;
        let tPropVal = typeof (el.style) !== 'undefined' ? el.style.top : null;

        if (!lPropVal) {
            lPropVal = this.getComputedStyle(el, 'left');
        }

        if (!tPropVal) {
            tPropVal = this.getComputedStyle(el, 'top');
        }
        return { l: parseFloat(lPropVal), t: parseFloat(tPropVal) };
    }

    getDim(el) {
        let wPropVal = typeof el.style !== 'undefined' ? el.style.width : null;
        let hPropVal = typeof el.style !== 'undefined' ? el.style.height : null;

        if (!wPropVal) {
            wPropVal = this.getComputedStyle(el, 'width');
        }

        if (!hPropVal) {
            hPropVal = this.getComputedStyle(el, 'height');
        }
        return { w: parseFloat(wPropVal), h: parseFloat(hPropVal) };
    }

    getComputedStyle(el, propName) {
        if (window.getComputedStyle) {
            return window.getComputedStyle(el, null).getPropertyValue(propName);
        }
        else if (el.currentStyle) {
            return el.currentStyle[propName];
        }
        return '';
    }

    createDOM_Button() {
        let result;

        if (false /*ASNA.Vendor.IsBtElementSubmits()*/) {
            result = document.createElement('input');
        }
        else {
            result = document.createElement('button');
        }

        result.setAttribute('type', 'button');

        return result;
    }

    setButtonContent(btnEl, text) {
        if (false/*ASNA.Vendor.IsBtElementSubmits()*/) {
            btnEl.value = text;
        }
        else {
            btnEl.innerHTML = text;
        }
    }

    intersect(a, b) {
        if ((a.loc.l + a.dim.w < b.loc.l) || (b.loc.l + b.dim.w < a.loc.l) || (a.loc.t + a.dim.h < b.loc.t) || (b.loc.t + b.dim.h < a.loc.t)) {
            return false;
        }

        return true;
    }

    avoidOverlap(btns) {
        let loc = [];
        let dim = [];
        let changes = [];

        for (let i = 0; i < btns.length; i++) {
            loc.push(this.getLoc(btns[i]));
            dim.push(this.getDim(btns[i]));
        }

        for (let i = loc.length - 1; i >= 0; i--) {
            for (let k = 0; k < i; k++) {
                if (this.intersect({ loc: loc[k], dim: dim[k] }, { loc: loc[i], dim: dim[i] })) {
                    const vOffset = (loc[k].t + dim[k].h) - loc[i].t;
                    if (vOffset > 0) {
                        loc[i].t += vOffset;
                        changes.push({ el: btns[i], t: loc[i].t });  // OK if duplicate
                    }
                }
            }
        }

        for (let i = 0; i < changes.length; i++) {
            const el = changes[i].el;
            el.style.top = changes[i].t + 'px';
        }
    }

    addClickEventHandler(btns, clickEventHandler) {
        for (let i = 0, l = btns.length; i < l; i++) {
            btns[i].addEventListener('click', this.handleButtonClickEvent, false);
        }
    }

    handleButtonClickEvent(event) {
        const _action = this.getButtonContent(event.target);

        if (this.executeFn) {
            this.executeFn('', _action);
        }
    }

    getButtonContent(btnEl) {
        if (this.isBtnElementSubmits()) {
            return btnEl.value;
        }

        return btnEl.innerHTML;
    }

    isBtnElementSubmits() {
        return false;

        // return is_Android && !is_Android_Chrome;
    }

    belongs(el) {
        return el.className === TEMCSS_NAME.FKEY_HOTSPOT_MOBILE || el.className === TEMCSS_NAME.FKEY_HOTSPOT;
    }

    pointerEnd(id, x, y, btn) {
        ASNA.TouchSlider.CloseBottom();
        _action = ASNA.Common.GetButtonContent(btn);

        if (typeof (_executeFn) == 'function') {
            _executeFn('', _action);
        }

        if (typeof (_onReleaseFn) === 'function') {
            _onReleaseFn();
        }
    }

    setCapture(target, id, x, y, onReleaseFn) {
        _onReleaseFn = onReleaseFn;

        _inst = { tgt: target, delta: { val: null }, lastXY: {}, cancelMove: { val: false }, fnStart: null, fnMove: null, fnEnd: _pointerEnd, fnCancel: null, startXfered: true };
        ASNA.Pointer.ListenToEventsInstance(target, function () { return _inst; });
    }

    show() {
        TerminalDOM.setAttrDisplayOnClass(TEMCSS_NAME.FKEY_HOTSPOT, 'block');
        TerminalDOM.setAttrDisplayOnClass(TEMCSS_NAME.FKEY_HOTSPOT_MOBILE, 'block');
    }

    hide() {
        TerminalDOM.setAttrDisplayOnClass(TEMCSS_NAME.FKEY_HOTSPOT, 'none');
        TerminalDOM.setAttrDisplayOnClass(TEMCSS_NAME.FKEY_HOTSPOT_MOBILE, 'none');
    }

    remove() {
        TerminalDOM.removeElClass(TEMCSS_NAME.FKEY_HOTSPOT);
        TerminalDOM.removeElClass(TEMCSS_NAME.FKEY_HOTSPOT_MOBILE);
    }
}

const theFKeyHotspot = new FKeyHotspot();