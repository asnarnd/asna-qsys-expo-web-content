/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theWindow as DdsWindow};

const CLASS_GRID_ROW = 'dds-grid-row';
const CLASS_GRID_EMPTY_ROW = 'dds-grid-empty-row';

const debugDdsWindow = false;
const debugClientStorage = false;

import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { Base64 } from './base-64.js';
import { StringExt } from './string.js';

const WINDOW_CSS_CLASS = {
    PAGE_BACKGROUND: 'dds-window-background',
    BACKDROP: 'dds-window-popup',
    INACTIVE_BACKDROP: 'dds-window-popup-inactive',
    PAGE_INACTIVE_BACKGROUND: 'dds-window-background-inactive'
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

        if (!this.pageHasWindows) {
            return;
        }

        if ((this.pageJustOpened = this.getBooleanFlag(form, FLAG.PAGE_JUST_OPENED))) {
            ClientStorage.removeEntriesForFile(window.location.pathname);
        }

        this.activeWindowRecord = this.getMainWindowRecordSpec(form);
        if (this.activeWindowRecord) {
            this.winRestoreStack = ClientStorage.loadStackForFile(window.location.pathname); 
        }
        else {
            ClientStorage.removeEntriesForFile(window.location.pathname);
        }
    }

    pushRestoreWindow(winName, htmlBackground, htmlTopWin) {
        const topWinBackdrop = document.querySelector(`[class=${WINDOW_CSS_CLASS.BACKDROP}]`); // Note: backdrop is not inside the form ...

        let winBackdrop = [];

        const inactiveBackdrops = document.querySelectorAll(`[class=${WINDOW_CSS_CLASS.INACTIVE_BACKDROP}]`);
        const inactiveWindows = document.querySelectorAll(`[class=${WINDOW_CSS_CLASS.PAGE_INACTIVE_BACKGROUND}]`);
        
        for (let i = 0, l = inactiveWindows.length; i < l; i++) {
            const htmlWin = inactiveWindows[i].innerHTML;
            const htmlBackDrop = i < inactiveBackdrops.length ? inactiveBackdrops[i].outerHTML : '';
            const inactiveWinBackdropEntry = RestoreStack.makeWinBackdropEntry(htmlWin, htmlBackDrop);
            winBackdrop.push(inactiveWinBackdropEntry);
        }

        winBackdrop.push(RestoreStack.makeWinBackdropEntry(htmlTopWin, topWinBackdrop !== null ? topWinBackdrop.outerHTML : ''));

        if (winBackdrop) {
            if (!this.winRestoreStack) {
                const newStack = [RestoreStack.makeArrayElement(winName, RestoreStack.makeEntry(0, htmlBackground, winBackdrop))];
                this.winRestoreStack = new RestoreStack(newStack);
            }
            else {
                this.winRestoreStack.pushWindow(winName, htmlBackground, winBackdrop);
            }
        }
    }

    serializeWinRestoreStack() {
        if (this.winRestoreStack === null) {
            return;
        }
        ClientStorage.serialize(window.location.pathname, this.winRestoreStack);
    }

    getBooleanFlag(form, name) {
        const el = form[name];
        if (!el || !el.value || !el.value.toLowerCase) {
            return false;
        }

        return el.value.toLowerCase() === 'true';
    }

    savePrevPageBackground(html) {
        ClientStorage.savePrevPageBackground(html);
    }

    restoreWindowPrevPage(form, mainPanel) {
        if (!this.activeWindowRecord) {
            return {};
        }

        const winName = this.activeWindowRecord.getAttribute(AsnaDataAttrName.RECORD);

        if (!winName) {
            return {};
        }

        let topStackWindowEntry = null;
        let htmlBackground = ClientStorage.getPrevPageBackground();
        
        if (this.winRestoreStack !== null && ! this.winRestoreStack.isEmpty()) {     
            const i = this.winRestoreStack.find(winName);
            if (i >= 0) {
                this.winRestoreStack.popGE(this.winRestoreStack.elements[i].entry.index);
                ClientStorage.serialize(window.location.pathname, this.winRestoreStack); // Convenient for debugging ... 
            }

            const topStackWindow = this.winRestoreStack.top();
            if (topStackWindow) {
                topStackWindowEntry = topStackWindow.entry;
                if (topStackWindowEntry.htmlBackground) {
                    htmlBackground = topStackWindowEntry.htmlBackground; 
                }
            }
        }

        const highestZIndex = this.calcHighestZIndex();

        let backDiv = null;
        if (htmlBackground) {
            backDiv = document.createElement('div');
            backDiv.style.position = 'absolute';
            backDiv.className = WINDOW_CSS_CLASS.PAGE_BACKGROUND;

            const manipulate = new BackDOM_Manipulator();
            backDiv.innerHTML = manipulate.makeReadOnly(htmlBackground);

            mainPanel.style.zIndex = highestZIndex + 4;
            backDiv.style.zIndex = highestZIndex + 1;
            document.body.appendChild(backDiv);

            DdsWindow.log('restoreWindowPrevPage - htmlBackground');
        }

        const winBackdrop = this.createWindowBackdrop(highestZIndex + 3);
        const winSpec = this.parseWinSpec();
        const winOffset = winSpec ? (winSpec.left /*- 1*/) * this.calcColWidth() : 0;

        if (topStackWindowEntry && topStackWindowEntry.win) {
            DdsWindow.log(`restoreWindowPrevPage - win[${topStackWindowEntry.win.length}]`);

            for (let i = 0, l = topStackWindowEntry.win.length; i < l; i++) {
                const winBackdropEntry = topStackWindowEntry.win[i];
                this.createInactivePopup(form, winBackdropEntry.htmlBackdrop, winBackdropEntry.htmlWin, highestZIndex + 3);
            }
        }

        return { background: backDiv, backdrop: winBackdrop, winOffset: winOffset };
    }

    positionBackgroundAndBackdrop(form, newElements, scroll ) {
        const mainEl = DdsWindow.queryFormMainElement(form);

        if (!mainEl || !mainEl.parentElement) {
            return;
        }

        const mainContainer = mainEl.parentElement;
        const mainRect = mainContainer.getBoundingClientRect();

        if (newElements.background) {
            const style = newElements.background.style;

            style.left = `${mainRect.left}px`;
            style.top = `${mainRect.top}px`;
            style.width = `${mainRect.width}px`;
            style.height = `${mainRect.height}px`;
        }

        const backdropEl = newElements.backdrop;
        if (backdropEl) {
            let newLeft = mainRect.left + newElements.winOffset;
            if (scroll && scroll.left) {
                newLeft -= scroll.left;
            }
            backdropEl.style.left = `${newLeft}px`;
            if (backdropEl.style.top) {
                const top = parseFloat(backdropEl.style.top);
                backdropEl.style.top = `${mainRect.top + top}px`;
            }
            document.body.appendChild(backdropEl);
        }
    }

    createWindowBackdrop(zIndex) {
        if (!this.activeWindowRecord) {
            return null;
        }

        const backDrop = document.createElement('div');
        const winSpec = this.parseWinSpec();

        backDrop.className = WINDOW_CSS_CLASS.BACKDROP;
        backDrop.style.zIndex = zIndex;

        if (this.topLeftCorner && this.bottomRightCorner) {
            const leftTopRect = this.topLeftCorner.getBoundingClientRect();
            const bottomRightRect = this.bottomRightCorner.getBoundingClientRect();
            const top = leftTopRect.y;
            const width = (bottomRightRect.x + bottomRightRect.width ) - leftTopRect.x;
            const height = (bottomRightRect.y + bottomRightRect.height) - leftTopRect.y;
            backDrop.style.top = `${top}px`;
            backDrop.style.width = `${width}px`;
            backDrop.style.height = `${height}px`;
        }

        const header = document.createElement('div');
        header.innerText = winSpec.title;
        header.className = 'dds-window-header';
        backDrop.appendChild(header);

        return backDrop;
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

    createInactivePopup(form, htmlBackdrop, htmlWin, zIndex) {
        if (htmlBackdrop) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = htmlBackdrop; // Not supposed to have input elements ...
            document.body.appendChild(wrapper);
            const backDrop = wrapper.firstChild;
            backDrop.className = WINDOW_CSS_CLASS.INACTIVE_BACKDROP;
        }

        if (htmlWin) {
            const mainEl = DdsWindow.queryFormMainElement(form);

            if (!mainEl || !mainEl.parentElement) {
                return;
            }

            const inactivePopup = document.createElement('div');
            inactivePopup.style.position = 'absolute';
            inactivePopup.className = WINDOW_CSS_CLASS.PAGE_INACTIVE_BACKGROUND;

            const manipulate = new BackDOM_Manipulator();
            const mainContainer = mainEl.parentElement;
            const mainRect = mainContainer.getBoundingClientRect();

            const style = inactivePopup.style;
            style.zIndex = zIndex;
            style.left = mainRect.left + 'px';
            style.top = mainRect.top + 'px';
            style.width = mainRect.width + 'px';
            style.height = mainRect.height + 'px';

            inactivePopup.innerHTML = manipulate.makeReadOnly(htmlWin);
            document.body.appendChild(inactivePopup);
            inactivePopup.removeAttribute(AsnaDataAttrName.WINDOW);
        }
    }

    prepareForSubmit(form) {
        const pageExtractor = new DOM_Extractor();

        if (typeof MonarchPageSavingForPopup === 'function') { // Notify user-code
            MonarchPageSavingForPopup();
        }

        const mainContentHtml = pageExtractor.getMainInnerHTML(form);
        if (this.activeWindowRecord) {
            const htmlBackground = ClientStorage.getPrevPageBackground();
            const winName = this.activeWindowRecord.getAttribute(AsnaDataAttrName.RECORD);
            this.pushRestoreWindow(winName, htmlBackground, mainContentHtml);
            this.serializeWinRestoreStack();
        }
        else {
            this.savePrevPageBackground(mainContentHtml);
        }

        if (typeof MonarchPageForPopupSaved === 'function') { // Notify user-code
            MonarchPageForPopupSaved();
        } 
    }

    calcColWidth() {
        let gridColWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--dds-grid-col-width');
        return parseFloat(StringExt.trim(gridColWidthVar)); // Remove 'px'
    }

    calcFontSize() {
        let bodyFontSizeVar = getComputedStyle(document.documentElement).getPropertyValue('--body-font-size');
        return parseFloat(StringExt.trim(bodyFontSizeVar)); // Remove 'px'
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

class DOM_Extractor {
    getMainInnerHTML(form) {
        const mainEl = DdsWindow.queryFormMainElement(form);
        if (!mainEl) {
            return {};
        }
        const frag = document.createRange().createContextualFragment(mainEl.innerHTML);
        const div = document.createElement('div');
        div.appendChild(frag);
        return div.innerHTML;
    }
}

class BackDOM_Manipulator {
    makeReadOnly(html) {
        const frag = document.createRange().createContextualFragment(html);

        const named = frag.querySelectorAll('*[name]');
        for (let i = 0, l = named.length; i < l; i++) {
            const input = named[i];
            if (input.name) {
                input.removeAttribute('name');
            }
            input.setAttribute( 'tabIndex', '0');
        }

        const div = document.createElement('div');
        div.appendChild(frag);
        return div.innerHTML;

    }
}

const STORAGE_NS = {
    DISPLAYFILE: 'ASNA.DisplayFile',
    BACKGROUND: 'ASNA.PrevPage.Background'
};

class RestoreStack {
    constructor(elements) {
        this.elements = elements;
    }

    isEmpty() {
        return this.elements.length === 0;
    }

    pushWindow(winName, htmlBackground, arrayWinBackdrop ) {
        const i = this.find(winName);
        if (i>=0) {
            this.remove(i); 
        }

        this.elements.push(
            RestoreStack.makeArrayElement(
                winName,
                RestoreStack.makeEntry(this.elements.length, htmlBackground, arrayWinBackdrop)
            )
        );
    }

    popGE(index) {
        let newElements = [];
        for (let i = 0, l = this.elements.length; i < l; i++) {
            const arrayElement = this.elements[i];
            if (arrayElement.entry.index >= index) {
                break;
            }
            newElements.push(arrayElement);
        }

        this.elements = newElements; 
    }

    top() {
        return this.elements.length > 0 ? this.elements[this.elements.length - 1] : null;
    }

    find(winName) {
        for (let i = 0, l = this.elements.length; i < l; i++) {
            const arrayElement = this.elements[i];
            if (arrayElement.winName === winName) {
                return i;
            }
        }

        return -1;
    }

    remove(index) {
        let newElements = [];
        for (let i = 0, l = this.elements.length; i < index && i < l; i++) {
            newElements.push(this.elements[i]);
        }
        for (let i = index + 1, l = this.elements.length; i < l; i++) {
            newElements.push(this.elements[i]);
        }

        this.elements = newElements; 
    }

    static makeEntry(index, htmlBackground, arrayWinBackdrop ) {
        let entry = {
            htmlBackground: htmlBackground,
            win: arrayWinBackdrop,
            index: index
        };

        return entry;
    }

    static makeArrayElement(winName, entry) {
        return {
            winName: winName,
            entry: entry
        };
    }

    static makeWinBackdropEntry(htmlWin, htmlBackdrop) {
        return {
            htmlWin: htmlWin,
            htmlBackdrop: htmlBackdrop
        };
    }
}

class ClientStorage {
    static loadStackForFile(filePath) {
        let stack = [];

        const keys = ClientStorage.getSessionKeysForFile(filePath);
        for (let i = 0, l = keys.length; i < l; i++) {
            const key = keys[i];
            const val = sessionStorage.getItem(key);
            if (val) {
                const winName = ClientStorage.winNameFromKey(key);
                stack.push(RestoreStack.makeArrayElement( winName, ClientStorage.parseStackItem(val)) );
                ClientStorage.log(`loadStackForFile key:${key}.`);
            }
        }

        if (stack.length) {
            const sorted = stack.sort((a, b) => a.entry.index - b.entry.index);
            return new RestoreStack(sorted); 
        }

        return  null;
    }

    static serialize(filePath, stack) {
        ClientStorage.removeEntriesForFile(filePath);
        for (let i = 0, l = stack.elements.length; i < l; i++) {
            const key = ClientStorage.makeDisplayfileKey(filePath, stack.elements[i].winName);
            sessionStorage.setItem(key, JSON.stringify(stack.elements[i].entry));
            ClientStorage.log(`serialize key:${key}.`);
        }
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

    static savePrevPageBackground(html) {
        const key = ClientStorage.makePrevPageBackgroundKey();
        sessionStorage.setItem(key, html);
        ClientStorage.log(`savePrevPageBackground key:${key}.`);
    }

    static getPrevPageBackground() {
        const key = ClientStorage.makePrevPageBackgroundKey();
        const item = sessionStorage.getItem(key);
        return item ? item : '';
    }

    static parseStackItem(jsonStr) {
        let entry = {};
        /*eslint-disable*/
        try {
            entry = JSON.parse(jsonStr);
        }
        catch (e) {
            return {};
        }
        /*eslint-enable*/
        return entry;
    }

    static makeDisplayfileKey(filePath, winName) {
        let root = `${STORAGE_NS.DISPLAYFILE}${filePath}`;
        return winName ? `${root}/${winName}` : root;
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

    static log(msg) {
        if (!debugClientStorage) {
            return;
        }

        console.log(`ClientStorage::${msg}`);
    }
}

const theWindow = new DdsWindow();

