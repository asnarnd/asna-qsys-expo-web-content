/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theWindow as DdsWindow};
import { HtmlElementCapture } from './html-capture/html-element-capture.js';
import { DomEvents } from './dom-events.js';

const debugDdsWindow = false;
const debugClientStorage = false;

import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { Base64 } from './base-64.js';
import { StringExt } from './string.js';
import { DdsGrid } from './dds-grid.js';

const WINDOW_CSS_CLASS = {
    WINPOPUP: 'dds-window-popup'
};

const FLAG = {
    PAGE_HAS_WINDOWS : '__pageHasWindows__',
    PAGE_JUST_OPENED :'__firstOuputOp__'
};

const NEXT_BACKGROUND_IMAGE_NAME = '*NEXT';
const MAIN_SELECTOR = 'main[role=main]';
const VAR_WIN_BKGND_POSITION = '--main-window-background-position';

class DdsWindow {
    constructor() {
        this.winPopupHeader = null;

        this.handleDragStartEvent = this.handleDragStartEvent.bind(this);
        this.handleDragOverEvent = this.handleDragOverEvent.bind(this);
        this.handleDragEndEvent = this.handleDragEndEvent.bind(this);
    }

    init(form) {
        this.activeWindowRecord = null;
        this.winRestoreStack = null;

        this.pageHasWindows = this.getBooleanFlag(form, FLAG.PAGE_HAS_WINDOWS);

        this.htmlToImageStyle = DdsWindow.calcHtmlToImageStyle();

        if (!this.pageHasWindows) {
            ClientStorage.purgeWinStack();
            ClientStorage.purgePrevPageBackground();
            return;
        }

        DdsWindow.log(`** DdsWindow.init **`);

        const url = window.location.pathname;
        if ((this.pageJustOpened = this.getBooleanFlag(form, FLAG.PAGE_JUST_OPENED))) {
            DdsWindow.log(`init   FLAG.PAGE_JUST_OPENED`);
            ClientStorage.removeEntriesForFile(url);
        }
        else {
            DdsWindow.log(`init   WE HAVE SEEN this page: ${url}`);
        }

        this.activeWindowRecord = this.getMainWindowRecordSpec(form);
        if (this.activeWindowRecord) {
            DdsWindow.log(`init  loadStackForFile`);
            const winName = this.activeWindowRecord.getAttribute(AsnaDataAttrName.RECORD);

            this.winRestoreStack = ClientStorage.loadWinStackForFile(url);
            if (this.winRestoreStack.find(winName)) {
                this.winRestoreStack = ClientStorage.popWinBackgroundPagesGT(url, winName, this.winRestoreStack);
                ClientStorage.removeNamedPageBackground(url, NEXT_BACKGROUND_IMAGE_NAME);
                this.serializeWinRestoreStack();
            }
        }
        else {
            DdsWindow.log(`init  not a WINDOW, clear cache!`);
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
            DdsWindow.log(`pushRestoreWindow (New RestoreStack)    Push: ${winName}`);
        }
        else {
            this.winRestoreStack.pushWindow(winName);
            DdsWindow.log(`pushRestoreWindow Push: ${winName} Current stack: ${this.winRestoreStack.getAsList()}`);
        }
    }

    serializeWinRestoreStack() {
        if (this.winRestoreStack === null) {
            DdsWindow.log(`serializeWinRestoreStack (Stack does not exist.)`);
            return;
        }
        const url = window.location.pathname;
        ClientStorage.serializeWinStackForFile(url, this.winRestoreStack);
    }

    getBooleanFlag(form, name) {
        const el = form[name];
        if (!el || !el.value || !el.value.toLowerCase) {
            return false;
        }

        return el.value.toLowerCase() === 'true';
    }

    restoreWindowPrevPage() {
        let imgData = '';

        if (!this.activeWindowRecord) {
            return imgData;
        }

        const url = window.location.pathname;
        const winName = this.activeWindowRecord.getAttribute(AsnaDataAttrName.RECORD);

        if (!winName || this.winRestoreStack == null ) {
            return imgData;
        }

        let winStackDirty = false;

        if (this.winRestoreStack.isEmpty()) {
            imgData = ClientStorage.copyPrevPageBackgroundTo(url, NEXT_BACKGROUND_IMAGE_NAME);
            if (imgData) {
                ClientStorage.savePageBackground(url, winName, imgData);
                this.pushRestoreWindow(winName);
                winStackDirty = true;
            }
        }
        else {
            imgData = ClientStorage.getNamedPageBackground(url, NEXT_BACKGROUND_IMAGE_NAME);
            if (imgData) {
                ClientStorage.savePageBackground(url, winName, imgData);
                if (!this.winRestoreStack.find(winName)) {
                    this.pushRestoreWindow(winName);
                    winStackDirty = true;
                }
            }
            else {
                imgData = ClientStorage.getNamedPageBackground(url, winName);
            }
        }

        if (winStackDirty) {
            this.serializeWinRestoreStack();
        }

        if (imgData && imgData.length>0) {
            document.documentElement.style.setProperty('--main-window-background', `url(${imgData})`);
        }

        return imgData;
    }

    initPopup(form) {
        if (!this.activeWindowRecord) {
            return {};
        }

        const mainEl = form.querySelector(MAIN_SELECTOR);
        const winPopup = this.createWinPopup(mainEl);
        if (winPopup) {
            mainEl.appendChild(winPopup);
        }
            
        return winPopup;
    }

    positionPopup(form, newElements, scroll ) {
        const mainEl = form.querySelector(MAIN_SELECTOR);

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

    createWinPopup(mainEl) {
        if (!this.activeWindowRecord) {
            return null;
        }

        const winPopup = document.createElement('div');
        const winSpec = this.parseWinSpec();

        winPopup.className = WINDOW_CSS_CLASS.WINPOPUP;
        const rowHeight = DdsGrid.calcRowHeight(mainEl);
        const colWidth = DdsGrid.calcColWidth(mainEl);

        const padding = this.calcRowPadding();
        const headerHeight = this.calcWindowHeaderHeight();
        const border = this.calcPopupBorderWidth();

        const left = winSpec.left * colWidth;
        const top = (winSpec.top * rowHeight ) - (headerHeight + padding.top + padding.bottom);
        const width = (winSpec.width * colWidth) + (2 * border);
        const height = headerHeight + (winSpec.height * rowHeight) + (padding.top + padding.bottom);

        winPopup.style.left = `${left}px`;
        winPopup.style.top = `${top}px`;
        winPopup.style.width = `${width}px`;
        winPopup.style.height = `${height}px`;

        this.winPopupHeader = document.createElement('div');
        this.winPopupHeader.innerText = winSpec.title;
        this.winPopupHeader.className = 'dds-window-header';
        winPopup.appendChild(this.winPopupHeader);
        const recordCointaner = document.createElement('div');
        recordCointaner.className = 'dds-window-popup-record-container';
        winPopup.appendChild(recordCointaner);

        this.winPopupHeader.setAttribute('draggable', 'true');
        this.winPopupHeader.addEventListener('dragstart', this.handleDragStartEvent, false);
        document.addEventListener('dragover', this.handleDragOverEvent, false);
        this.winPopupHeader.addEventListener('dragend', this.handleDragEndEvent, false);

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

    prepareForSubmit(form, htmlToImageCompleteEvent, htmlToImageFilterEvent) {
        if (typeof MonarchPageSavingForPopup === 'function') { // Notify user-code
            MonarchPageSavingForPopup();
        }

        const main = form.querySelector(MAIN_SELECTOR);
        if (main) {
            HtmlElementCapture.captureAsImage(main, htmlToImageCompleteEvent, htmlToImageFilterEvent, this.htmlToImageStyle);
            return true;
        }

        return false;
    }

    completePrepareSubmit(mostRecentBackgroundImageData) {
        DdsWindow.log(`completePrepareSubmit - Got a new Image!`);

        if (this.activeWindowRecord) {
            ClientStorage.savePageBackground(window.location.pathname, NEXT_BACKGROUND_IMAGE_NAME, mostRecentBackgroundImageData);
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
        const mainEl = form.querySelector(MAIN_SELECTOR);

        if (mainEl) {
            return form.querySelector(`[${AsnaDataAttrName.WINDOW}]`);
        }

        return null;
    }

    static log(msg) {
        if (!debugDdsWindow) {
            return;
        }

        console.log(`DdsWindow::${msg}`);
    }

    handleDragStartEvent(event) {
        this.dragging = { mouseStartX: event.screenX, mouseStartY: event.screenY };
    }

    handleDragOverEvent(event) {
        event.dataTransfer.dropEffect = 'move';
        DomEvents.cancelEvent(event);
    }

    handleDragEndEvent(event) {
        let offsetX = this.dragging.mouseStartX - event.screenX;
        let offsetY = this.dragging.mouseStartY - event.screenY;

        const winPopup = this.winPopupHeader.parentElement;
        const currentLeft = parseFloat(winPopup.style.left);
        const currentTop  = parseFloat(winPopup.style.top);

        winPopup.style.left = `${currentLeft - offsetX}px`;
        winPopup.style.top  = `${currentTop - offsetY}px`;

        DomEvents.cancelEvent(event);
        delete this.dragging;
    }

    setVarBackgroundPosition() {
        const main = document.querySelector(MAIN_SELECTOR);
        if (main) {
            const mainRect = main.getBoundingClientRect();
            const cssVarRoot = document.documentElement.style;
            if (cssVarRoot && mainRect) {
                cssVarRoot.setProperty(VAR_WIN_BKGND_POSITION, `${mainRect.left}px ${mainRect.top}px`);
            }
        }
    }
}

const STORAGE_NS = {
    DISPLAYFILE: 'ASNA.DisplayFile',
    BACKGROUND: 'ASNA.PrevPage.Background'
};

class RestoreStack {
    constructor(list) {
        this.elements = list ? list.split(',') : null;
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

        this.elements.push(winName);
    }

    find(winName) {
        if (this.isEmpty()) {
            return false;
        }

        for (let i = 0, l = this.elements.length; i < l; i++) {
            if (this.elements[i] == winName) {
                return true;
            }
        }
        return false;
    }
}

class ClientStorage {
    static loadWinStackForFile(filePath) {
        const stackList = ClientStorage.getDisplayfileStack(filePath);

        if (stackList) {
            ClientStorage.log(`loadStackForFile loaded: ${stackList}`);
            return new RestoreStack(stackList); // sorted);
        }

        ClientStorage.log(`Empty stack for: ${filePath}`);
        return new RestoreStack('');
    }

    static serializeWinStackForFile(filePath, restoreStack) {
        ClientStorage.log(`serializeStackForFile key:${filePath}.`);
        if (!restoreStack) {
            return;
        }
        ClientStorage.setDisplayfileStack(filePath, restoreStack.getAsList());
    }

    static removeEntriesForFile(filePath) {
        const keys = ClientStorage.getSessionKeysForFile(filePath);

        for (let i = 0, l = keys.length; i < l; i++) {
            const key = keys[i];
            sessionStorage.removeItem(key);
            ClientStorage.log(`removeEntriesForFile key:${key} removed.`);
        }
    }

    static purgeWinStack() {
        const keys = ClientStorage.getSessionWinStack();
        if (keys) {
            for (let i = 0, l = keys.length; i < l; i++) {
                sessionStorage.removeItem(keys[i]);
            }
        }
    }

    static getSessionWinStack() {
        let keys = [];
        for (let i = 0, l = sessionStorage.length; i < l; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith(STORAGE_NS.DISPLAYFILE)) {
                keys.push(key);
            }
        }
        return keys;
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

    static purgePrevPageBackground() {
        const key = ClientStorage.makePrevPageBackgroundKey();
        sessionStorage.removeItem(key);
    }

    static copyPrevPageBackgroundTo(url, winName) {
        const prevPageBackground = this.getPrevPageBackground();
        if (prevPageBackground) {
            this.savePageBackground(url, winName, prevPageBackground);
            return prevPageBackground;
        }
        return null;
    }

    static removeNamedPageBackground(url, imageName) {
        const key = ClientStorage.makeDisplayfileKey(url, imageName);
        sessionStorage.removeItem(key);
    }

    static moveNamedPageBackgroundTo(url, srcImageName, destImageName) {
        const sourcekey = ClientStorage.makeDisplayfileKey(url, srcImageName);
        const destKey = ClientStorage.makeDisplayfileKey(url, destImageName);
        const sourceImage = sessionStorage.getItem(sourcekey);
        if (sourceImage) {
            sessionStorage.setItem(destKey, sourceImage);
        }
        sessionStorage.removeItem(sourcekey);
        return sourceImage;
    }

    static savePageBackground(url, winName, imageData) {
        const key = ClientStorage.makeDisplayfileKey(url, winName);
        sessionStorage.setItem(key, imageData);
        ClientStorage.log(`savePageBackground key:${key} Win:${winName}.`);
    }

    static getPrevPageBackground() {
        const key = ClientStorage.makePrevPageBackgroundKey();
        return sessionStorage.getItem(key);
    }

    static getNamedPageBackground(url, winName) {
        const key = ClientStorage.makeDisplayfileKey(url, winName);
        return sessionStorage.getItem(key);
    }


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
        ClientStorage.log(`setDisplayfileStack key:${stackKey} value:${value}`);
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

    static popWinBackgroundPagesGT(url, winName, winRestoreStack) {
        const stack = winRestoreStack.elements;
        let newStack = [];
        let toRemove = [];
        for (let i = 0, l = stack.length, indexWinName = -1; i < l; i++) {
            if (stack[i] == winName) {
                indexWinName = i;
            }
            if (indexWinName < 0 || i <= indexWinName)
                newStack.push(stack[i]);
            else if (i> indexWinName)
                toRemove.push(stack[i]);
        }

        for (let i = 0, l = toRemove.length; i < l; i++) {
            const key = ClientStorage.makeDisplayfileKey(url, toRemove[i]);
            sessionStorage.removeItem(key);
        }

        winRestoreStack.elements = newStack;
        return winRestoreStack;
    }

    static log(msg) {
        if (!debugClientStorage) {
            return;
        }

        console.log(`ClientStorage::${msg}`);
    }
}

const theWindow = new DdsWindow();

