/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { thePage as Page };

import { Kbd, FoldDrop, AidKeyHelper, AidKeyMapIndex } from '../js/kbd.js';
import { DomEvents } from '../js/dom-events.js';
import { FeedbackArea } from '../js/feedback-area.js';
import { LetterSpacing } from '../js/letter-spacing.js';
import { InvertFontColors } from '../js/invert-font-colors.js';
import { Calendar } from '../js/calendar/calendar.js';
import { DdsGrid } from '../js/dds-grid.js';
import { DropDown } from '../js/dropdown.js';
import { Checkbox, RadioButtonGroup } from '../js/multiple-choice.js';
import { WaitForResponseAnimation } from '../js/wait-response/wait-response-animation.js';
import { NavigationMenu } from '../js/nav-menu.js';
import { DdsWindow } from '../js/dds-window.js';
import { SubfileController } from '../js/subfile-paging/dom-init.js';
import { SubfilePaging } from '../js/subfile-paging/paging.js';
import { SubfilePagingStore, SubfileState } from '../js/subfile-paging/paging-store.js';
import { PositionCursor } from '../js/page-position-cursor.js';
import { Subfile } from '../js/subfile-paging/dom-init.js';
import { Base64 } from '../js/base-64.js';
import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { Icons, IconCache } from '../js/icon.js';
import { Validate } from '../js/validate.js';
import { StringExt } from '../js/string.js';
import { PageAlert } from './page-alert.js';
import { Signature } from './signature/signature.js';
import { BrowserInfo } from './detection.js';

class Page {
    constructor() {
        this.handleDocumentKeyDown = this.handleDocumentKeyDown.bind(this);
        this.handlePushKeyOnClickEvent = this.handlePushKeyOnClickEvent.bind(this);
        this.handleOnFocusEvent = this.handleOnFocusEvent.bind(this);
        this.handleWindowResizeEvent = this.handleWindowResizeEvent.bind(this);
        this.handleMainPanelScrollEvent = this.handleMainPanelScrollEvent.bind(this);
        this.handleAjaxGetRecordsResponseEvent = this.handleAjaxGetRecordsResponseEvent.bind(this);
        this.handleAjaxGetIconsResponseEvent = this.handleAjaxGetIconsResponseEvent.bind(this);
        this.handleHtmlToImageFilterEvent = this.handleHtmlToImageFilterEvent.bind(this);
        this.handleHtmlToImageCompleteEvent = this.handleHtmlToImageCompleteEvent.bind(this);

        this.pushKey = this.pushKey.bind(this); // Accesible thru window.asnaExpo
    }

    init(options) {
        if (options && options.formId) {
            this.formId = options.formId;
        }

        const thisForm = this.getForm();

        if (!thisForm) {
            return;
        }
        const hiddenInput = thisForm.__atKMap__;
        this.aidKeyBitmap = hiddenInput ? hiddenInput.value: '';
        document.addEventListener('keydown', this.handleDocumentKeyDown, false);

        // If DdsFunctionKeys Location="Hidden", remove it before Window calculations.
        const nav = document.querySelector(`nav[${AsnaDataAttrName.ACTIVEKEY_LOCATION}]`);
        if (nav) {
            const location = nav.getAttribute(AsnaDataAttrName.ACTIVEKEY_LOCATION);
            if (location === 'hidden') {
                nav.parentNode.removeChild(nav);
            }
        }

        DdsWindow.init(thisForm);

        DdsGrid.completeGridRows(thisForm, DdsWindow.activeWindowRecord);
        this.stretchConstantsText();
        this.addOnClickPushKeyEventListener();
        this.applyInvertFontColors();
        this.applyUnderline();
        this.initStandardCalendar();
        DropDown.initBoxes();
        Checkbox.init(thisForm);
        RadioButtonGroup.init(thisForm);
        Signature.init(thisForm);
        this.addOnFocusEventListener();

        WaitForResponseAnimation.init(thisForm);
        const twoPanelContainer = NavigationMenu.init();

        this.setAsInitialized();
        if (twoPanelContainer) {
            twoPanelContainer.removeAttribute('style'); // Style should only contain display-hidden, remove it. Let the class take effect
        }

        this.mainPanel = this.getMainPanel(thisForm);

        this.winPopup = null;
        if (DdsWindow.activeWindowRecord!==null) {
            DdsWindow.restoreWindowPrevPage();
            DdsGrid.setPageHeight(thisForm);
            this.winPopup = DdsWindow.initPopup(thisForm);
        }

        if (this.winPopup) {
            DdsGrid.moveRecordsToPopup(thisForm, this.winPopup);
        }
        else {
            DdsGrid.truncateColumns(thisForm);
        }

        window.addEventListener('resize', this.handleWindowResizeEvent, false);

        //if (this.mainPanel) {
        //    this.mainPanel.addEventListener('scroll', this.handleMainPanelScrollEvent, false);
        //}

        Page.setupAutoPostback(thisForm, this.aidKeyBitmap);
        Page.setupLeftPad(thisForm);
        Validate.setupMandatory(thisForm);

        if (thisForm.__CursorLocation__ && thisForm.__CursorLocation__.value) {
            PositionCursor.removeFieldAttribute();
            PositionCursor.toRowCol(thisForm, thisForm.__CursorLocation__.value);
        }
        else {
            PositionCursor.toDefaultField(thisForm);
        }
        const sflEndIcons = SubfileController.init(thisForm.querySelector('main[role=main]'),DdsWindow.activeWindowRecord!==null);
        this.initIcons(sflEndIcons);

        Page.promptResettableErrorMessage(thisForm);
    }

    static setupAutoPostback(form, aidKeyBitmap) {
        const autoPBEls = form.querySelectorAll(`[${AsnaDataAttrName.AUTO_POSTBACK}]`);

        const aidKeyHelper = new AidKeyHelper(aidKeyBitmap);

        autoPBEls.forEach((el) => {
            const key = el.getAttribute(AsnaDataAttrName.AUTO_POSTBACK);
            el.removeAttribute(AsnaDataAttrName.AUTO_POSTBACK);
            if (key && aidKeyHelper.isEnabled(AidKeyHelper.keyToMapIndex(key))) {
                if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
                    el.addEventListener('input', () => { window.asnaExpo.page.pushKey(key); });
                }
                else {
                    el.addEventListener('click', () => { window.asnaExpo.page.pushKey(key); });
                }
            }
        });
    }

    static setupLeftPad(form) {
        const leftPadEls = form.querySelectorAll(`[${AsnaDataAttrName.LEFT_PAD}]`);

        leftPadEls.forEach((el) => {
            const lpParms = el.getAttribute(AsnaDataAttrName.LEFT_PAD);
            el.removeAttribute(AsnaDataAttrName.LEFT_PAD);
            if (lpParms && lpParms.indexOf(',') > 0) {
                const parts = lpParms.split(',');
                if (parts.length === 2) {
                    const len = parseInt(parts[0], 10);
                    const char = parts[1];
                    if (len > 0 && (char === 'b' || char === 'z')) {
                        el.addEventListener('blur', (e) => {
                            const input = e.target;
                            if (!input || typeof input.value !== 'string') { return; }
                            input.value = StringExt.padLeft(input.value, len, char==='z'?'0':' ');
                        });
                    }
                }
            }
        });
    }

    static promptResettableErrorMessage(form) {
        const sflMsg = form.querySelectorAll(`[${AsnaDataAttrName.SUBFILE_MSG_TEXT}]`);

        const msgText = [];
        for (let i = 0, l = sflMsg.length; i < l; i++) {
            const sflrec = sflMsg[i];
            sflrec.removeAttribute(AsnaDataAttrName.SUBFILE_MSG_TEXT);
            if (sflrec.innerText) {
                msgText.push(sflrec.innerText);
                sflrec.style.display = 'none';
            }
        }

        if (msgText.length) {
            PageAlert.show(msgText[0], "Reset");
        }
    }

    static parseCol(fnStr, data) {
        if (fnStr !== 'coltopix') { return 0; }

        const parts = data.split('(');
        if (parts.length < 2) { return 0; }
        return parseInt(parts[1],10)-1; // Note: closing paren. ignored
    }

    handleDocumentKeyDown(event) {
        if (this.isCalendarActive() || event.target && event.target.tagName === 'BUTTON') { // Not an event generated by page directly.
            return; // Ignore
        }

        const action = Kbd.processKeyDown(event, this.aidKeyBitmap);

        if (action.aidKeyToPush) {
            if (action.useAjax && action.sflCtlStore) {
                SubfilePaging.requestPage(action.aidKeyToPush, action.sflCtlStore, this.handleAjaxGetRecordsResponseEvent);
            }
            else {
                this.pushKey(action.aidKeyToPush);
            }
        }

        if (action.shouldCancel) {
            DomEvents.cancelEvent(event);
        }

        if (action.returnBooleanValue) {
            return action.ReturnBooleanValue;
        }
    }

    handlePushKeyOnClickEvent(event, keyToPush, focusElement, fieldValue, virtualRowCol) {
        const keyDetail = Kbd.convertKeyNameToKeyDetail(keyToPush,this.aidKeyBitmap);
        if (keyDetail) {
            const action = Kbd.processKeyDetail(keyDetail,this.aidKeyBitmap);
            if (action.aidKeyToPush && action.useAjax && action.sflCtlStore) {
                SubfilePaging.requestPage(action.aidKeyToPush, action.sflCtlStore, this.handleAjaxGetRecordsResponseEvent);
                return;
            }
        }

        this.pushKey(keyToPush, focusElement, fieldValue, virtualRowCol);
    }

    handleOnFocusEvent(element) {
        const activeWinSpecs = DdsWindow.parseWinSpec();
        FeedbackArea.updateSubfileCursorRrn(element);
        FeedbackArea.updateElementFeedback(this.getForm(), element, activeWinSpecs);

        window.asnaExpo.page.lastFocus = element;

        if (BrowserInfo.isDesktop()) {
            if (element.value && element.value.length && typeof element.value.length === 'number') {
                const toPos = element.value.length;
                PositionCursor.selectText(element, 0, toPos);
            }
        }
    }

    handleWindowResizeEvent() {
        // console.log(`resize w:${window.innerWidth} h:${window.innerHeight}`);
        if (!this.winNewElements || !(this.winNewElements.background && this.winNewElements.backdrop)) {
            return;
        }
        // DdsWindow.positionPopup(this.getForm(), this.winNewElements);
    }

    handleMainPanelScrollEvent(event) {
        // this.lastKnownScrollPos = event.currentTarget.scrollY;

        if (!this.scroll_InProgress) {
            window.requestAnimationFrame(()=> {
                this.handleWindowScrollChanged(event.target);
                this.scroll_InProgress = false;
            });

            this.scroll_InProgress = true;
        }
    }

    handleAjaxGetRecordsResponseEvent(jsonStr) {

        let res;
        try {
            res = JSON.parse(jsonStr);
        }
        catch (err) {
            console.error('Error parsing AJAX response');
            return;
        }

        if (!res.ok) {
            this.pushKey(res.request.requestorAidKey);
            return;
        }

        // console.log(`AJAX response. ${res.request.recordName} Requested from:${res.request.from} to:${res.request.to} Got ${res.recordCount}`);

        if (res.recordCount <= 0) {
            const aidKeyHelper = new AidKeyHelper(this.aidKeyBitmap);

            if (res.request.requestorAidKey === "PgDn" && aidKeyHelper.isEnabled(AidKeyMapIndex.PageDown) ||
                res.request.requestorAidKey === "PgUp" && aidKeyHelper.isEnabled(AidKeyMapIndex.PageUp)) {
                this.pushKey(res.request.requestorAidKey);
                return;
            }
            
            Kbd.showInvalidRollAlert();
            return;
        }

        const form = this.getForm();
        let sflCtrlStore = SubfilePagingStore.getSflCtlStore(res.request.recordName);
        let sflEl = DdsGrid.findSubfile(res.request.recordName);
        if (!sflEl || !res.html || !sflCtrlStore) { return; } // Ignore - for now ...

        if (typeof (MonarchSubfilePageChanging) === 'function') {   // Notify user-code
            MonarchSubfilePageChanging(res.request.recordName, sflEl, res.request.from, res.request.request.to - 1, res.request.mode);
        }

        const oldTopRrn = sflCtrlStore.current.topRrn;

        sflCtrlStore.sflRecords.from = Math.min(Math.min(sflCtrlStore.sflRecords.from, res.request.from), sflCtrlStore.sflRecords.from);
        sflCtrlStore.sflRecords.to = Math.max(sflCtrlStore.sflRecords.to, res.request.to-1);
        sflCtrlStore.sflRecords.isLastPage = res.isLastPage ? 'true' : 'false';
        sflCtrlStore.current.topRrn = res.request.from;

        if (res.request.requestorAidKey === sflCtrlStore.fldDrop.aidKey) {
            sflCtrlStore.fldDrop.isFolded = ! res.request.wantDropped; 
        }

        let currentPageState = SubfileState.rememberPageState(sflEl);

        // Before replacing Page, save edits by comparing initialState with state of subfile page about to be replaced.
        let currentPageEdits = SubfileState.getPageInputStateChanges(sflCtrlStore.initialPageState, currentPageState);
        if (!sflCtrlStore.sflEdits) { 
            sflCtrlStore.sflEdits = currentPageEdits; // First paging transition
        }
        else {
            sflCtrlStore.sflEdits = SubfileState.mergeInputState(sflCtrlStore.sflEdits, currentPageEdits);
        }

        let cursorPosRrnOffset = -1;
        let lastSflFldWithCursorName = '';
        const needToRestoreCursor = PositionCursor.isCursorAtSubfile(sflEl);
        if (needToRestoreCursor) {
            lastSflFldWithCursorName = PositionCursor.activeFieldName();
            const rrnFld = Subfile.findHiddenRrn(sflEl, lastSflFldWithCursorName);
            if (rrnFld && rrnFld.value ) {
                cursorPosRrnOffset = parseInt(rrnFld.value, 10) - oldTopRrn;
            }
        }

        sflEl.innerHTML = res.html;

        // Re-apply style changes marked by 'data-asna-xxx' attributes
        DdsGrid.completeSubfileGridRows(sflEl);
        this.stretchConstantsText();
        this.addOnClickPushKeyEventListener();
        this.applyInvertFontColors();
        this.initStandardCalendar();
        DropDown.initBoxes();
        this.initIcons();
        Checkbox.init(form);
        RadioButtonGroup.init(form);
        this.addOnFocusEventListener();

        // Now restore the edits if this page had been seen before
        SubfileState.RestoreInputChanges(sflEl, sflCtrlStore.sflEdits);
        const withGridCol = SubfileController.selectAllWithGridColumns(sflEl);
        const sflColRange = SubfileController.calcSflMinMaxColRange(withGridCol);

        if (SubfileController.addMouseCueEvents(sflEl, sflCtrlStore.inputBehaviour) && !DdsWindow.pageHasWindows) {
            SubfileController.constrainRecordCueing(sflEl, sflColRange);
        }

        SubfileController.removeRowGap(sflEl);

        if (sflCtrlStore.sflEnd.showSubfileEnd) {
            const showAtBottom = sflCtrlStore.sflRecords.isLastPage === "true" ? sflCtrlStore.sflEnd.isSufileEnd : false;
            const icon = SubfileController.addSubfileEndCue(
                sflEl,
                showAtBottom,
                showAtBottom ? sflCtrlStore.sflEnd.textOn : sflCtrlStore.sflEnd.textOff,
                sflColRange
            );

            let sflEndIcons = [];
            if (icon && icon.el && icon.iconParms && icon.iconParms.title) {
                sflEndIcons.push(icon);
            }
            if (sflEndIcons.length>0)
                this.initIcons(sflEndIcons);
        }

        sflCtrlStore.initialPageState = SubfileState.rememberPageState(sflEl); // Initial State of new page.

        if (needToRestoreCursor) {
            let newFldWithCursorName = '';
            if (cursorPosRrnOffset >= 0 && lastSflFldWithCursorName) {
                newFldWithCursorName = Subfile.makeFieldName(lastSflFldWithCursorName, sflCtrlStore.current.topRrn + cursorPosRrnOffset);
            }
            PositionCursor.restoreFocus(sflEl, newFldWithCursorName, res.request.requestorAidKey);
        }
        /*
        setLowestRRN(jsonSflCtrl.topRrn);
        sflCursorRow = ASNA.SubfileUI.FindRecordByRRN(el, jsonSflCtrl.topRrn);

        if (sflCursorRow) {
            ASNA.SubfileUI.SetCurrentRecord(el, sflCursorRow);
        }

        */

        //if (DdsWindow.activeWindowRecord !== null) {
        //    DdsGrid.sendMainGridChildrenToFront(form);
        //}

        if (typeof (MonarchSubfilePageChanged) === 'function') {   // Notify user-code
            MonarchSubfilePageChanged(res.request.recordName, sflEl, res.request.from, res.request.request.to - 1, res.request.mode);
        }
    }

    handleWindowScrollChanged(element) {
        if (/*this.winNewElements.background &&*/ this.winNewElements.backdrop) {
            const scroll = { left: element.scrollLeft, top: element.scrollTop };
            DdsWindow.positionPopup(this.getForm(), this.winNewElements, scroll );
        }
    }

    getForm() {
        return this.formId ? document.forms[this.formId] : document.forms[0];
    }

    getMainPanel(form) {
        const mainEl = form.querySelector('main[role=main]');

        if (!mainEl || !mainEl.parentElement) {
            return null;
        }
        return mainEl.parentElement;
    }

    getFirstElementByName(name) {
        const elements = document.getElementsByName(name);
        return elements.length > 0 ? elements[0] : null;
    }

    pushKey(aidKeyToPush, focusElementName, fieldValue, virtualRowCol) {
        let form = this.getForm();

        if (focusElementName) {
            const focusElement = this.getFirstElementByName(focusElementName);
            if (focusElement) {
                FeedbackArea.updateSubfileCursorRrn(focusElement);
                FeedbackArea.updateElementFeedback(form, focusElement, DdsWindow.parseWinSpec());
                if (fieldValue) {
                    focusElement.value = fieldValue;
                }
            }
        }

        if (virtualRowCol) {
            FeedbackArea.updateRowColFeedback(form, virtualRowCol);
        }

        FeedbackArea.updatePushedKey(aidKeyToPush, form);

        if (!Validate.validateMandatory(form, aidKeyToPush, this.aidKeyBitmap)) {
            return;
        }

        WaitForResponseAnimation.prepareWaitAnimation(true);
        WaitForResponseAnimation.showAnimationIfLongWait({ checkTransaction: true, normalWaitTimeout: 2000 });
        const delaySumbit = DdsWindow.prepareForSubmit(form, this.handleHtmlToImageCompleteEvent, this.handleHtmlToImageFilterEvent );

        let sflCtrlRecNames = SubfilePagingStore.getSflCtlStoreNames();
        for (let i = 0; i < sflCtrlRecNames.length; i++ )
            SubfilePaging.createDOM_ElementsEdited(sflCtrlRecNames[i]);

        Checkbox.prepareForSubmit(form);
        RadioButtonGroup.prepareForSubmit(form);
        Signature.prepareForSubmit(form);
        DecDate.prepareForSubmit(form);
        if (!delaySumbit) {
            form.submit();
        }
    }

    handleHtmlToImageFilterEvent(node) {
        if ( typeof MonarchWindowBackgroundHtmlToImageFilter === 'function' ) {
            return MonarchWindowBackgroundHtmlToImageFilter(node);
        }

        return true;
    }

    handleHtmlToImageCompleteEvent(winBackgroundImageData,error) {
        let form = this.getForm();

        if (winBackgroundImageData) {
            DdsWindow.completePrepareSubmit(winBackgroundImageData);
        }

        form.submit();
    }

    stretchConstantsText() {
        const elements = document.querySelectorAll(`[${AsnaDataAttrName.STRETCH_ME}]`);
        let gridColWidth = getComputedStyle(document.documentElement).getPropertyValue('--dds-grid-col-width');

        gridColWidth = parseFloat(gridColWidth); // Remove 'px'

        for (let i = 0, l = elements.length; i < l; i++) {
            const span = elements[i];
            // const stretch = span.getAttribute(AsnaDataAttrName.STRETCH_ME);

            if (span.textContent) { //  && stretch) {
                span.style.letterSpacing = LetterSpacing.computeForElement(span, gridColWidth);
            }
            span.removeAttribute(AsnaDataAttrName.STRETCH_ME);
        }

    }

    addOnClickPushKeyEventListener() {
        const elements = document.querySelectorAll(`[${AsnaDataAttrName.ONCLICK_PUSHKEY}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const el = elements[i];
            const encPushKeyParms = el.getAttribute(AsnaDataAttrName.ONCLICK_PUSHKEY);
            if (encPushKeyParms) {
                const pushKeyParms = JSON.parse(Base64.decode(encPushKeyParms));
                el.addEventListener('click', (event) => {
                    this.handlePushKeyOnClickEvent(event, pushKeyParms.key, pushKeyParms.focusElement, pushKeyParms.fieldValue, pushKeyParms.virtualRowCol);
                });
                el.classList.add('dds-clickable');
                el.removeAttribute(AsnaDataAttrName.ONCLICK_PUSHKEY);
            }
        }
    }

    addOnFocusEventListener() {
        [...this.getForm().elements].forEach((el) => {
            if (el.name) {
                el.addEventListener('focus', () => { this.handleOnFocusEvent(el); } );
            }
        });
    }

    applyInvertFontColors() {
        const elements = document.querySelectorAll(`[${AsnaDataAttrName.REVERSE_IMAGE}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const el = elements[i];

            InvertFontColors.changeFontColorStyles(el);
            el.removeAttribute(AsnaDataAttrName.REVERSE_IMAGE);
        }
    }

    applyUnderline() {
        const elements = document.querySelectorAll(`[${AsnaDataAttrName.UNDERLINE}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const el = elements[i];

            el.classList.add('dds-field-underlined');
            el.removeAttribute(AsnaDataAttrName.UNDERLINE);
        }
    }

    initStandardCalendar() {
        const elements = document.querySelectorAll(`[${AsnaDataAttrName.CALENDAR_NAMES}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const input = elements[i];

            if (!Calendar.isLocalNamesComplete()) { // Small optimization - do it only once.
                Calendar.setLocalNames(input.getAttribute(AsnaDataAttrName.CALENDAR_NAMES));
            }

            Calendar.wrapInputWithCalButtonSibling(this.getForm(), input, input.getAttribute(AsnaDataAttrName.CALENDAR_OPTIONS));
            input.removeAttribute(AsnaDataAttrName.CALENDAR_NAMES);
            input.removeAttribute(AsnaDataAttrName.CALENDAR_OPTIONS);
        }
    }

    isCalendarActive() {
        const list = document.getElementsByClassName('calendar-table');
        return list && list.length;
    }

    initIcons(sflEndIcons) {
        const elements = document.querySelectorAll(`[${AsnaDataAttrName.ICON_ID}]`);

        let data = {};
        for (let i = 0, l = elements.length; i < l; i++) {
            const div = elements[i];
            const encIconParms = div.getAttribute(AsnaDataAttrName.ICON_ID);
            const jsonStrIconParms = Base64.decode(encIconParms);
            const iconParms = JSON.parse(jsonStrIconParms);

            Icons.processDataAsnaIconInfo(div, iconParms, data);
        }

        if (sflEndIcons) {
            for (let i = 0, l = sflEndIcons.length; i < l; i++) {
                Icons.processDataAsnaIconInfo(sflEndIcons[i].el, sflEndIcons[i].iconParms, data);
            }
        }

        if (data.iconForElement) {
            Icons.requestCollection(data, this.handleAjaxGetIconsResponseEvent);
        }
    }

    handleAjaxGetIconsResponseEvent(jsonStr) {

        let res;
        try {
            res = JSON.parse(jsonStr);
        }
        catch (err) {
            console.error('Error parsing AJAX response');
            return;
        }

        if (!res.ok) {
            return;
        }

        if (!this.iconCache) {
            this.iconCache = new IconCache(res.shape);
        }
        else {
            this.iconCache.update(res.shape);
        }

        // const highestZIndex = DdsWindow.calcHighestZIndex();

        for (let i = 0, l = res.request.iconForElement.length; i < l; i++ ) {
            const icon = res.request.iconForElement[i];
            for (let j = 0, lj = icon.elementID.length; j < lj; j++) {
                const el = document.getElementById(icon.elementID[j]);
                if (el) {
                    const shape = this.iconCache.getShape(icon.iconID);
                    Icons.appendSvgContent(el, shape, el.getAttribute(AsnaDataAttrName.ICON_INTERNAL_COLOR), el.getAttribute(AsnaDataAttrName.ICON_INTERNAL_TITLE));
                    el.removeAttribute(AsnaDataAttrName.ICON_INTERNAL_COLOR);
                    el.removeAttribute(AsnaDataAttrName.ICON_INTERNAL_TITLE);
                    //if (DdsWindow.pageHasWindows) {
                    //    el.style.zIndex = highestZIndex +3;
                    //}
                }
            }
        }
    }

    setAsInitialized() {
        const main = document.querySelector(`main[role=main]`);

        if (main.classList) {
            main.classList.remove('display-element-uninitialized');
            main.classList.add('display-element-initialized');
        }
    }
}

class DecDate {
    static prepareForSubmit(form) {
        const elements = form.querySelectorAll(`input[${AsnaDataAttrName.DEC_DATE_OPTIONS}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const input = elements[i];
            const separator = input.getAttribute(AsnaDataAttrName.DEC_DATE_OPTIONS);
            if (separator && separator.length === 1 && input.value && typeof input.value === 'string') {
                input.value = input.value.replace(new RegExp(`${separator}`, `g`), '');
            }
        }
    }
}

const thePage = new Page();

if (!window.asnaExpo) {
    window.asnaExpo = {};
}

window.asnaExpo.page = {
    pushKey: thePage.pushKey,
    lastFocus: null
}
