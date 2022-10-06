/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theWindow as DdsWindow};
import { HtmlElementCapture } from './html-capture/html-element-capture.js';

const CLASS_GRID_ROW = 'dds-grid-row';
const CLASS_GRID_EMPTY_ROW = 'dds-grid-empty-row';

const debugDdsWindow = false;
const debugClientStorage = false;

import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { Base64 } from './base-64.js';
import { StringExt } from './string.js';

const WINDOW_CSS_CLASS = {
    // PAGE_BACKGROUND: 'dds-window-background',
    WINPOPUP: 'dds-window-popup' //,
    // INACTIVE_BACKDROP: 'dds-window-popup-inactive',
    // PAGE_INACTIVE_BACKGROUND: 'dds-window-background-inactive'
};

const FLAG = {
    PAGE_HAS_WINDOWS : '__pageHasWindows__',
    PAGE_JUST_OPENED :'__firstOuputOp__'
};

class DdsWindow {
    init(form) {
        this.activeWindowRecord = null;
        this.topLeftCorner = null;
        this.bottomRightCorner = null;
        this.winRestoreStack = null;

        this.pageHasWindows = this.getBooleanFlag(form, FLAG.PAGE_HAS_WINDOWS);

        this.htmlToImageStyle = DdsWindow.calcHtmlToImageStyle();

        if (!this.pageHasWindows) {
            return;
        }

        const url = window.location.pathname;
        if ((this.pageJustOpened = this.getBooleanFlag(form, FLAG.PAGE_JUST_OPENED))) {
            ; // Bug in QSys.Expo ClientStorage.removeEntriesForFile(url);
        }

        this.activeWindowRecord = this.getMainWindowRecordSpec(form);
    //    if (!this.activeWindowRecord) {
    //        ClientStorage.removeEntriesForFile(url);
    //    }
        if (this.activeWindowRecord) {
            this.winRestoreStack = ClientStorage.loadStackForFile(url);
        }
        else {
            ClientStorage.removeEntriesForFile(url);
        }
    }

    static calcHtmlToImageStyle() {
        const sampleEl = document.createElement("div");
        sampleEl.className = 'dds-window-background';
        const newChild = document.body.appendChild(sampleEl);
        const cssStyle = window.getComputedStyle(sampleEl, null);
        const style = { 'background-color': cssStyle['background-color'], opacity: cssStyle['opacity'] };
        document.body.removeChild(newChild);

        return style;
    }

    pushRestoreWindow(winName) {
        if (!this.winRestoreStack) {
            this.winRestoreStack = new RestoreStack(winName);
        }
        else {
            this.winRestoreStack.pushWindow(winName);
        }
    }

    serializeWinRestoreStack() {
        if (this.winRestoreStack === null) {
            return;
        }
        const url = window.location.pathname;
        ClientStorage.serializeStackForFile(url, this.winRestoreStack);
    }

    getBooleanFlag(form, name) {
        const el = form[name];
        if (!el || !el.value || !el.value.toLowerCase) {
            return false;
        }

        return el.value.toLowerCase() === 'true';
    }

    restoreWindowPrevPage(/*form, mainPanel*/) {
        if (!this.activeWindowRecord) {
            return;
        }

        const url = window.location.pathname;
        const winName = this.activeWindowRecord.getAttribute(AsnaDataAttrName.RECORD);

        if (!winName) {
            return;
        }

        let imgData = ClientStorage.getBackgroundImage(url, winName);
        if (!imgData) {
            if (this.winRestoreStack) {
                const url = window.location.pathname;
                const winName = this.winRestoreStack.popGE();
                imgData = ClientStorage.getBackgroundImage(url, winName);
                ClientStorage.serializeStackForFile(url, this.winRestoreStack);
            }
            if (!imgData) {
                imgData = ClientStorage.getPrevPageBackground();
            }
        }

        if (imgData) {
            document.documentElement.style.setProperty('--main-window-background', `url(${imgData})`);
        }
    }

    initPopup() {
        if (!this.activeWindowRecord) {
            return {};
        }

        const highestZIndex = this.calcHighestZIndex();

        const winPopup = this.createWinPopup(highestZIndex + 1/*3*/);
        const winSpec = this.parseWinSpec();
        const winOffset = winSpec ? (winSpec.left /*- 1*/) * this.calcColWidth() : 0;

        //if (topStackWindowEntry && topStackWindowEntry.win) {
        //    DdsWindow.log(`restoreWindowPrevPage - win[${topStackWindowEntry.win.length}]`);

        //    for (let i = 0, l = topStackWindowEntry.win.length; i < l; i++) {
        //        const winBackdropEntry = topStackWindowEntry.win[i];
        //        this.createInactivePopup(form, winBackdropEntry.htmlBackdrop, winBackdropEntry.htmlWin, highestZIndex + 1/*3*/);
        //    }
        //}

        return { /*background: backDiv,*/ popup: winPopup, winOffset: winOffset };
    }

    positionPopup(form, newElements, scroll ) {
        const mainEl = DdsWindow.queryFormMainElement(form);

        if (!mainEl || !mainEl.parentElement) {
            return;
        }

        const mainContainer = mainEl.parentElement;
        const mainRect = mainContainer.getBoundingClientRect();
        const popup = newElements.popup;

        if (popup) {
            let newLeft = mainRect.left + newElements.winOffset;
            if (scroll && scroll.left) {
                newLeft -= scroll.left;
            }
            popup.style.left = `${newLeft}px`;
            if (popup.style.top) {
                const top = parseFloat(popup.style.top);
                popup.style.top = `${mainRect.top + top}px`;
            }
            mainEl.appendChild(popup);
        }
    }

    createWinPopup(zIndex) {
        if (!this.activeWindowRecord) {
            return null;
        }

        const winPopup = document.createElement('div');
        const winSpec = this.parseWinSpec();

        winPopup.className = WINDOW_CSS_CLASS.WINPOPUP;
        winPopup.style.zIndex = zIndex;

        if (this.topLeftCorner && this.bottomRightCorner) {
            const leftTopRect = this.topLeftCorner.getBoundingClientRect();
            const bottomRightRect = this.bottomRightCorner.getBoundingClientRect();

            const padding = this.calcRowPadding();
            const headerHeight = this.calcWindowHeaderHeight();
            const border = this.calcPopupBorderWidth();
            const cellH = bottomRightRect.height - 1;

            const top = leftTopRect.y - (headerHeight + padding.top + padding.bottom);
            const width = ((bottomRightRect.x + (bottomRightRect.width - 1) - leftTopRect.x) - 2 * border)-1;
            const height = (((bottomRightRect.y + cellH - leftTopRect.y) - 2 * border) - 1) - cellH;
            winPopup.style.top = `${top}px`;
            winPopup.style.width = `${width}px`;
            winPopup.style.height = `${height}px`;
        }

        const header = document.createElement('div');
        header.innerText = winSpec.title;
        header.className = 'dds-window-header';
        winPopup.appendChild(header);

        return winPopup;
    }

    parseWinSpec() {
        if (!this.activeWindowRecord) {
            return null;
        }

        const encWinSpec = this.activeWindowRecord.getAttribute(AsnaDataAttrName.WINDOW);
        if (encWinSpec) {
            const strJson = Base64.decode(encWinSpec);
            return JSON.parse(strJson);
        }

        return null;
    }

    //createInactivePopup(form, htmlBackdrop, htmlWin, zIndex) {
    //    if (htmlBackdrop) {
    //        const wrapper = document.createElement('div');
    //        wrapper.innerHTML = htmlBackdrop; // Not supposed to have input elements ...
    //        document.body.appendChild(wrapper);
    //        const backDrop = wrapper.firstChild;
    //        backDrop.className = WINDOW_CSS_CLASS.INACTIVE_BACKDROP;
    //    }

    //    if (htmlWin) {
    //        const mainEl = DdsWindow.queryFormMainElement(form);

    //        if (!mainEl || !mainEl.parentElement) {
    //            return;
    //        }

    //        const inactivePopup = document.createElement('div');
    //        inactivePopup.style.position = 'absolute';
    //        inactivePopup.className = WINDOW_CSS_CLASS.PAGE_INACTIVE_BACKGROUND;

    //        const manipulate = new BackDOM_Manipulator();
    //        const mainContainer = mainEl.parentElement;
    //        const mainRect = mainContainer.getBoundingClientRect();

    //        const style = inactivePopup.style;
    //        style.zIndex = zIndex;
    //        style.left = mainRect.left + 'px';
    //        style.top = mainRect.top + 'px';
    //        style.width = mainRect.width + 'px';
    //        style.height = mainRect.height + 'px';

    //        inactivePopup.innerHTML = manipulate.makeReadOnly(htmlWin);
    //        document.body.appendChild(inactivePopup);
    //        inactivePopup.removeAttribute(AsnaDataAttrName.WINDOW);
    //    }
    //}

    prepareForSubmit(form, htmlToImageCompleteEvent, htmlToImageFilterEvent) {
        if (typeof MonarchPageSavingForPopup === 'function') { // Notify user-code
            MonarchPageSavingForPopup();
        }

        const main = form.querySelector('main[role=main]');
        if (main) {
            HtmlElementCapture.captureAsImage(main, htmlToImageCompleteEvent, htmlToImageFilterEvent, this.htmlToImageStyle);
            return true;
        }

        return false;
    }

    completePrepareSubmit(mostRecentBackgroundImageData) {
        if (this.activeWindowRecord) {
            const url = window.location.pathname;
            const winName = this.activeWindowRecord.getAttribute(AsnaDataAttrName.RECORD);

            if (!ClientStorage.getBackgroundImage(url, winName)) { // Save if not already there.
                ClientStorage.savePageBackground(url, winName, mostRecentBackgroundImageData);
                this.pushRestoreWindow(winName);
            }
            this.serializeWinRestoreStack();
        }
        else {
            ClientStorage.savePrevPageBackground(mostRecentBackgroundImageData);
        }

        if (typeof MonarchPageForPopupSaved === 'function') { // Notify user-code
            MonarchPageForPopupSaved();
        }
    }

    calc(cssGlobal) {
        const varValue = getComputedStyle(document.documentElement).getPropertyValue(cssGlobal);
        if (typeof varValue.endsWith == 'function' && varValue.endsWith('em')) {
            return this.convertEmToPixel(StringExt.trim(varValue));
        }
        return parseFloat(StringExt.trim(varValue)); // Assume 'px'
    }

    convertEmToPixel(em) {
        const num = parseFloat(StringExt.trim(em));
        return this.calcFontSize() * num;
    }

    calcColWidth() {
        return this.calc('--dds-grid-col-width');
    }

    calcRowPadding() {
        return { top: this.calc('--dds-grid-row-padding-top'), bottom: this.calc('--dds-grid-row-padding-bottom')};
    }

    calcWindowHeaderHeight() {
        return this.calc('--popup-header-height');
    }

    calcPopupBorderWidth() {
        return this.calc('--popup-border-width');
    }

    calcFontSize() {
        return this.calc('--body-font-size');
    }

    getMainWindowRecordSpec(form) {
        const mainEl = DdsWindow.queryFormMainElement(form);

        if (mainEl) {
            return form.querySelector(`[${AsnaDataAttrName.WINDOW}]`);
        }

        return null;
    }

    calcHighestZIndex() {
        let highestZIndex = 0;

        highestZIndex = Math.max(
            highestZIndex,
            ...Array.from(document.querySelectorAll("body *:not([data-highest]):not(.yetHigher)"), (elem) => parseFloat(getComputedStyle(elem).zIndex))
                .filter((zIndex) => !isNaN(zIndex))
        );

        return highestZIndex;
    }

    setCorners(topLeft, bottomRight) {
        this.topLeftCorner = topLeft;
        this.bottomRightCorner = bottomRight;
    }

    static queryFormMainElement(form) {
        return form.querySelector('main[role=main]');
    }

    static log(msg) {
        if (!debugDdsWindow) {
            return;
        }

        console.log(`DdsWindow::${msg}`);
    }
}

//class DOM_Extractor {
//    getMainInnerHTML(form) {
//        const mainEl = DdsWindow.queryFormMainElement(form);
//        if (!mainEl) {
//            return {};
//        }
//        const frag = document.createRange().createContextualFragment(mainEl.innerHTML);
//        const div = document.createElement('div');
//        div.appendChild(frag);
//        return div.innerHTML;
//    }
//}

//class BackDOM_Manipulator {
//    makeReadOnly(html) {
//        const frag = document.createRange().createContextualFragment(html);

//        const named = frag.querySelectorAll('*[name]');
//        for (let i = 0, l = named.length; i < l; i++) {
//            const input = named[i];
//            if (input.name) {
//                input.removeAttribute('name');
//            }
//            input.setAttribute( 'tabIndex', '0');
//        }

//        const div = document.createElement('div');
//        div.appendChild(frag);
//        return div.innerHTML;

//    }
//}

const STORAGE_NS = {
    DISPLAYFILE: 'ASNA.DisplayFile',
    BACKGROUND: 'ASNA.PrevPage.Background'
};

class RestoreStack {
    constructor(list) {
        this.elements = list.split(',');
    }

    getAsList() {
        if (this.elements == null || this.elements.length == 0)
            return '';
        let result = '';
        for (let i = 0, l = this.elements.length; i < l; i++) {
            if (result)
                result += ',';
            result += this.elements[i];
        }

        return result;
    }

    isEmpty() {
        return this.elements == null || this.elements.length === 0;
    }

    pushWindow(winName) {
        if (!this.elements)
            this.elements = [];

//        const i = this.find(winName);
//        if (i>=0) {
//            this.remove(i); 
//        }

        this.elements.push(winName);
    }

    popGE(/*index*/) {
//        let newElements = [];
//        for (let i = 0, l = this.elements.length; i < l; i++) {
//            const arrayElement = this.elements[i];
//            if (arrayElement.entry.index >= index) {
//                break;
//            }
//            newElements.push(arrayElement);
//        }

//        this.elements = newElements; 
        return this.isEmpty() ? null : this.elements.pop();
    }

//    top() {
//        return this.elements.length > 0 ? this.elements[this.elements.length - 1] : null;
//    }

//    find(winName) {
//        for (let i = 0, l = this.elements.length; i < l; i++) {
//            const arrayElement = this.elements[i];
//            if (arrayElement.winName === winName) {
//                return i;
//            }
//        }

//        return -1;
//    }

//    remove(index) {
//        let newElements = [];
//        for (let i = 0, l = this.elements.length; i < index && i < l; i++) {
//            newElements.push(this.elements[i]);
//        }
//        for (let i = index + 1, l = this.elements.length; i < l; i++) {
//            newElements.push(this.elements[i]);
//        }

//        this.elements = newElements; 
//    }

//    static makeEntry(index, htmlBackground, arrayWinBackdrop ) {
//        let entry = {
//            htmlBackground: htmlBackground,
//            win: arrayWinBackdrop,
//            index: index
//        };

//        return entry;
//    }

//    static makeArrayElement(winName, entry) {
//        return {
//            winName: winName,
//            entry: entry
//        };
//    }

//    static makeWinBackdropEntry(htmlWin/*, htmlBackdrop*/) {
//        return {
//            htmlWin: htmlWin,
//            // htmlBackdrop: htmlBackdrop
//        };
//    }
}

class ClientStorage {
    static loadStackForFile(filePath) {
        const stackList = ClientStorage.getDisplayfileStack(filePath);
        //for (let i = 0, l = keys.length; i < l; i++) {
        //    const key = keys[i];
        //    const val = sessionStorage.getItem(key);
    //        if (val) {
    //            const winName = ClientStorage.winNameFromKey(key);
    //            stack.push(RestoreStack.makeArrayElement( winName, ClientStorage.parseStackItem(val)) );
    //            ClientStorage.log(`loadStackForFile key:${key}.`);
    //        }
        //}

        if (stackList) {
    //        const sorted = stack.sort((a, b) => a.entry.index - b.entry.index);
            return new RestoreStack(stackList); // sorted);
        }

       return  null;
    }

    static serializeStackForFile(filePath, restoreStack) {
        // ClientStorage.removeEntriesForFile(filePath);
        if (!restoreStack) {
            return;
        }
        ClientStorage.setDisplayfileStack(filePath, restoreStack.getAsList());

    //    for (let i = 0, l = stack.elements.length; i < l; i++) {
    //        const key = ClientStorage.makeDisplayfileKey(filePath, stack.elements[i].winName);
    //        sessionStorage.setItem(key, JSON.stringify(stack.elements[i].entry));
    //        ClientStorage.log(`serialize key:${key}.`);
    //    }
    }

    static removeEntriesForFile(filePath) {
        const keys = ClientStorage.getSessionKeysForFile(filePath);

        for (let i = 0, l = keys.length; i < l; i++) {
            const key = keys[i];
            sessionStorage.removeItem(key);
            ClientStorage.log(`removeEntriesForFile key:${key} removed.`);
        }
    }

    static getSessionKeysForFile(filePath) {
        let keys = [];

        for (let i = 0, l = sessionStorage.length; i < l; i++) {
            const key = sessionStorage.key(i);
            if (ClientStorage.displayfileKeyMatchesFile(filePath, key)) {
                keys.push(key);
            }
        }

        return keys;
    }

    static savePrevPageBackground(imageData) {
        const key = ClientStorage.makePrevPageBackgroundKey();
        sessionStorage.setItem(key, imageData);
        ClientStorage.log(`savePrevPageBackground key:${key}.`);
    }

    static savePageBackground(url, winName, imageData) {
        const key = ClientStorage.makeDisplayfileKey(url, winName);
        sessionStorage.setItem(key, imageData);
        ClientStorage.log(`savePageBackground key:${key}.`);
    }

    static getPrevPageBackground() {
        const key = ClientStorage.makePrevPageBackgroundKey();
        const item = sessionStorage.getItem(key);
        return item ? item : '';
    }

    //static parseStackItem(jsonStr) {
    //    let entry = {};
    //    /*eslint-disable*/
    //    try {
    //        entry = JSON.parse(jsonStr);
    //    }
    //    catch (e) {
    //        return {};
    //    }
    //    /*eslint-enable*/
    //    return entry;
    //}

    static makeDisplayfileKey(filePath, winName) {
        const root = `${STORAGE_NS.DISPLAYFILE}${filePath}`;
        return winName ? `${root}/${winName}` : root;
    }

    static getDisplayfileStack(filePath) {
        const stackKey = ClientStorage.makeDisplayfileStackKey(filePath);
        return sessionStorage.getItem(stackKey);
    }

    static makeDisplayfileStackKey(filePath) {
        const root = `${STORAGE_NS.DISPLAYFILE}${filePath}`;
        return `${root}.stack`;
    }

    static setDisplayfileStack(filePath, value) {
        const stackKey = ClientStorage.makeDisplayfileStackKey(filePath);
        sessionStorage.setItem(stackKey, value);
    }

    static makePrevPageBackgroundKey() {
        return STORAGE_NS.BACKGROUND;
    }

    static displayfileKeyMatchesFile(filePath, key) {
        const keyForFilePath = ClientStorage.makeDisplayfileKey(filePath);
        // For example: 
        // keyForFilePath: ASNA.DisplayFile/Y2PM1GEN/CLNTER01D
        // key:            ASNA.DisplayFile/Y2PM1GEN/CLNTER01D/ZMSGCTL
        if (!key.startsWith(STORAGE_NS.DISPLAYFILE) || !key.startsWith(keyForFilePath)) {
            return false;
        }
        const winRecName = ClientStorage.winNameFromKey(key);
        return winRecName !== null;
    }

    static winNameFromKey(validKey) {
        // For example: 
        // key:   'ASNA.DisplayFile/Y2PM1GEN/CLNTER01D/ZMSGCTL'
        // 
        // return 'ZMSGCTL'
        const lastIndex = validKey.lastIndexOf('/');
        if (lastIndex < STORAGE_NS.DISPLAYFILE.length) {
            return null;
        }
        return validKey.substring(lastIndex + 1);
    }

    static getBackgroundImage(url, winName) {
        const key = ClientStorage.makeDisplayfileKey(url, winName);
        return sessionStorage.getItem(key);
    }

    static log(msg) {
        if (!debugClientStorage) {
            return;
        }

        console.log(`ClientStorage::${msg}`);
    }
}

const theWindow = new DdsWindow();

