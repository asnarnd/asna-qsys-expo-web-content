/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theKbd as Kbd, FoldDrop, AidKeyHelper, AidKeyMapIndex };

import { PageAlert } from '../js/page-alert.js';
import { SubfileController } from '../js/subfile-paging/dom-init.js';
import { SubfilePagingStore } from '../js/subfile-paging/paging-store.js';

// const KEY_CODE_TAB       =  9;
const KEY_CODE_ESCAPE    = 27;
const KEY_CODE_ENTER     = 13;
const KEY_CODE_PAGE_UP   = 33;
const KEY_CODE_PAGE_DOWN = 34;

const KEY_CODE_F1 = 112;
const KEY_CODE_F12 = KEY_CODE_F1 + 12 - 1;

const AidKeyMapIndex = { // Must match ASNA.Qsys.Expo.Model.AidKey enumeration
    // F1 : 0 ... 
    // F24: 23
    Clear : 24,
    Help : 25,
    PageUp : 26,        // RollDown
    PageDown : 27,      // RollUp
    Print : 28,
    Home : 29,          // AKA Record Backspace
    Enter : 30,
    Attn : 31,
    Reset : 32
};

const OK_TEXT = 'Ok';
const KEY_NOT_VALID_MSG = {
    PgUp_PgDown: 'Roll up or down past the first or last record in file.',
    FunctionKey: 'Function key ${keyName} not allowed'
};

class Kbd {
    processKeyDown(event, aidKeyBitmap) {
        const keyDetail = Kbd.parseKey(event);

        if (!keyDetail.keyCode) {
            return { ignore: true };
        }

        if (keyDetail.keyCode === KEY_CODE_ESCAPE ) {
            return { aidKeyToPush: 'ESC', shouldCancel: true };
        }
        //else if (keyDetail.keyCode === KEY_CODE_TAB) {
        //    return { aidKeyToPush: 'TAB', shouldCancel: true };
        //}

        return this.processKeyDetail(keyDetail, aidKeyBitmap);
    }

    convertKeyNameToKeyDetail(candidateKeyName) {
        let keyCode = '';
        switch (candidateKeyName) {
            case 'Enter': keyCode = KEY_CODE_ENTER; break;
            case 'PgUp': keyCode = KEY_CODE_PAGE_UP; break;
            case 'PgDn': keyCode = KEY_CODE_PAGE_DOWN; break;
            default: {
                const fKeyCand = Kbd.isFuncKey(candidateKeyName);
                if (fKeyCand) {
                    keyCode = KEY_CODE_F1 + fKeyCand.functionNumber - 1;
                }
                break;
            }
        }

        return { keyCode: keyCode };
    }

    processKeyDetail(keyDetail, aidKeyBitmap) {
        const aidKeyHelper = new AidKeyHelper(aidKeyBitmap);

        if ((Kbd.isFKey(keyDetail) || keyDetail.keyCode === KEY_CODE_ENTER || keyDetail.keyCode === KEY_CODE_PAGE_UP || keyDetail.keyCode === KEY_CODE_PAGE_DOWN) && !keyDetail.altKey && !keyDetail.ctrlKey) {
            switch (keyDetail.keyCode) {
                case KEY_CODE_ENTER:
                    if (keyDetail.srcElement && Kbd.isTextArea(keyDetail.srcElement)) {
                        return { returnBooleanValue: true }; // On a text area, <enter> should be handled by the element (in this case to possibly insert a page-break)
                    }
                    else {
                        return { aidKeyToPush: 'Enter', shouldCancel: true };
                    }

                case KEY_CODE_PAGE_UP:
                    return Kbd.processRollKey(aidKeyHelper, 'PgUp', keyDetail.srcElement);

                case KEY_CODE_PAGE_DOWN:
                    return Kbd.processRollKey(aidKeyHelper, 'PgDn', keyDetail.srcElement);

                default: {
                    let functionNumber = Kbd.keyCodeToMapIndex(keyDetail);
                    let keyName = `F${functionNumber}`;
                    if (aidKeyHelper.isEnabled(functionNumber - 1)) {
                        const sflFoldDropAction = FoldDrop.processCadidateKey(keyName, keyDetail.srcElement);
                        if (sflFoldDropAction) {
                            return sflFoldDropAction;
                        }

                        return { aidKeyToPush: keyName, shouldCancel: true };
                    }
                    else {
                        PageAlert.show(KEY_NOT_VALID_MSG.FunctionKey.replace('${keyName}', keyName), OK_TEXT);
                        return { returnBooleanValue: false, shouldCancel: true };
                    }
                }
            }
        }

        return { ignore: true };
    }

    static processRollKey(aidKeyHelper, aidKey, inputEl) {
        let subfileControlName = SubfileController.getClosestSubfileCtrlName(inputEl);

        if (!subfileControlName) { // No subfile has been selected ... look for first one.
            subfileControlName = SubfileController.getFirstSubfileCtrlName();
        }

        if (subfileControlName) {
            const sflCtrlStore = SubfilePagingStore.getSflCtlStore(subfileControlName);
            if (sflCtrlStore) {

                if (aidKey === "PgUp") {
                    if (sflCtrlStore.current && sflCtrlStore.current.topRrn === 0 && aidKeyHelper.isEnabled(AidKeyMapIndex.PageUp)) {
                        return { aidKeyToPush: aidKey, shouldCancel: true }; // We know there would be more records above, post PgUp
                    }
                }
                else { // aidKey === "PgDn"
                    if (sflCtrlStore.sflRecords.isLastPage === "true" && aidKeyHelper.isEnabled(AidKeyMapIndex.PageDown)) {
                        return { aidKeyToPush: aidKey, shouldCancel: true }; // We know there would be more records above, post PgDn
                    }
                }

                return { aidKeyToPush: aidKey, shouldCancel: true, useAjax: true, sflCtlStore: sflCtrlStore };
            }
        }

        if (aidKeyHelper.isEnabled(AidKeyMapIndex.PageDown)) {
            return { aidKeyToPush: aidKey, shouldCancel: true };
        }

        PageAlert.show(KEY_NOT_VALID_MSG.PgUp_PgDown, OK_TEXT);
        return { returnBooleanValue: false, shouldCancel: true };
    }

    static parseKey(event) {
        if (window.event) { // IE specific
            return { keyCode: window.event.keyCode, srcElement: window.event.srcElement, ctrlKey: window.event.ctrlKey, altKey: window.event.altKey, shiftKey: window.event.shiftKey }
        }
        else {
            if (!event) {
                return { keyCode: '', srcElement: null, ctrlKey: null, altKey: null, shiftKey: null };
            }

            return { keyCode: event.which, srcElement: event.target, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey };
        }
    }


    static isFKey(keyDetail) {
        return keyDetail.keyCode >= KEY_CODE_F1 && keyDetail.keyCode <= KEY_CODE_F12;
    }

    static isFuncKey(keyName) {
        const fKeys = [];
        for (let i = 0; i < 24; i++) {
            fKeys.push(`F${i + 1}`);
        }

        const index = fKeys.indexOf(keyName);

        if (index >= 0) {
            return { functionNumber: index + 1 };
        }

        return null;
    }

    isPgUp(keyCode) {
        return keyCode === KEY_CODE_PAGE_UP;
    }

    isPgDn(keyCode) {
        return keyCode === KEY_CODE_PAGE_DOWN;
    }
    
    showInvalidRollAlert() {
        PageAlert.show(KEY_NOT_VALID_MSG.PgUp_PgDown, OK_TEXT);
    }

    static isTextArea(el) {
        return el && el.tagName && el.tagName.toLowerCase() === 'textarea';
    }

    static keyCodeToMapIndex(keyDetail) {
        return keyDetail.shiftKey ? keyDetail.keyCode - 99 : keyDetail.keyCode - 111;
    }
}

class FoldDrop {
    static processCadidateKey(aidKey, eventSrcEl) {
        let subfileControlName = SubfileController.getClosestSubfileCtrlName(eventSrcEl);

        if (!subfileControlName) { // No subfile has been selected ... look for first one.
            subfileControlName = SubfileController.getFirstSubfileCtrlName();
        }

        if (subfileControlName) {
            const sflCtlStore = SubfilePagingStore.getSflCtlStore(subfileControlName);
            if (sflCtlStore && aidKey === sflCtlStore.fldDrop.aidKey) {
                return { aidKeyToPush: aidKey, shouldCancel: true, useAjax: true, sflCtlStore: sflCtlStore };
            }
        }

        return null;
    }
}

const AID_KEY_MAP_CODE = {
    Disabled: '0',
    Attention: 'A',
    Function: 'F'
};

class AidKeyHelper {
    constructor(map) {
        this.map = map;
    }

    decode(mapIndex) {
        if (mapIndex >= this.map.length) {
            return '';
        }
        const code = this.map.substr(mapIndex, 1); 
        return code;
    }

    isEnabled(mapIndex) {
        if (mapIndex < 0)    { return false; }
        if (mapIndex === AidKeyMapIndex.Enter) { return true;  } // Always enabled.
        return this.isAttention(mapIndex) || this.isFunction(mapIndex);
    }

    isAttention(mapIndex) {
        return this.decode(mapIndex) === AID_KEY_MAP_CODE.Attention;
    }

    isFunction(mapIndex) {
        return this.decode(mapIndex) === AID_KEY_MAP_CODE.Function;
    }

    static keyToMapIndex(key) { 
        switch (key.toUpperCase()) {
            case 'CLEAR': return AidKeyMapIndex.Clear;
            case 'HELP': return AidKeyMapIndex.Help;
            case 'PAGEUP': return AidKeyMapIndex.PageUp;
            case 'PAGEDOWN': return AidKeyMapIndex.PageDown;
            case 'PRINT': return AidKeyMapIndex.Print;
            case 'HOME': return AidKeyMapIndex.Home;
            case 'ENTER': return AidKeyMapIndex.Enter;
            case 'ATTN': return AidKeyMapIndex.Attn;
            case 'RESET': return AidKeyMapIndex.Reset;

            default: {
                if (key.match(/F\d{1,3}/)) {
                    const num = parseInt(key.substr(1), 10);
                    return num - 1;
                }
            }
                break;
        }
        return -1;
    }
}

const theKbd = new Kbd();
