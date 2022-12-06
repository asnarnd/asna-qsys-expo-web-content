/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {
    theKeyboard as Keyboard,
    theVendorSpecificBehaviour as KeyboardVendorSpecificBehaviour,
    KEY_ACTION,
    InputEvent,
    KEYBOARD_STATE
};

const KEY_ACTION = {
    LEFTDELETE: 'LEFTDELETE',
    PREVIOUS: 'PREVIOUS',
    PRINT: 'PRINT',
    NEXT: 'NEXT',
    NEWLINE: 'NEWLINE',
    FIELDEXIT: 'FIELDEXIT',
    FIELDEXITENTER: 'FIELDEXITENTER',
    ENTER: 'ENTER',
    ERASE: 'ERASE',
    ERASETOEOFLD: 'ERASETOEOFLD',
    RESET: 'RESET',
    FASTLEFT: 'FASTLEFT',
    LEFT: 'LEFT',
    FASTRIGHT: 'FASTRIGHT',
    RIGHT: 'RIGHT',
    UP: 'UP',
    FASTUP: 'FASTUP',
    DOWN: 'DOWN',
    FASTDOWN: 'FASTDOWN',
    INSERT: 'INSERT',
    DELETE: 'DELETE',
    RECORD: 'RECORD', // Home
    LAST: 'LAST', // End
    PGUP: 'PGUP',
    PGDN: 'PGDN',
    COPY: 'COPY',
    NONBREAKINGPASTE: 'NONBREAKINGPASTE',
    PASTE: 'PASTE',
    CUT: 'CUT',
    ATTN: 'ATTN',
    DUP: 'DUP',
    BEGIN: 'BEGIN',
    END: 'END',
    CLEAR: 'CLEAR',
    FIELDMINUS: 'FIELDMINUS',
    AMBIGUOUS_FIELDMINUS: 'AMBIGUOUS_FIELDMINUS',
    FIELDPLUS: 'FIELDPLUS',
    REDIRECT: 'REDIRECT',
    HEX: 'HEX',
    F: 'F' // F1 ... F24
};

const KEYBOARD_STATE = {
    NORMAL: 'normal',
    AJAX_WAIT: 'ajax-wait',
    ERROR : 'error'
};

class Keyboard {
    constructor() {
        this.state = KEYBOARD_STATE.NORMAL;
        this.ambiguityResolverKeyPressChar = 0;
        this.ignoreNextKeyPress = false;
        this.delayedAction = null;
    }

    getKeyObject(keyEvent) {
        const keyObject = new Key(null, false, false, false);

        if (window.event) { // IE / Chrome
            keyObject.code = event.keyCode;
        }
        else { // Netscape/Firefox/Opera
            keyObject.code = keyEvent.which;
        }

        keyObject.ctrlKey = keyEvent.ctrlKey;
        keyObject.altKey = keyEvent.altKey;
        keyObject.shiftKey = keyEvent.shiftKey;

        return keyObject;
    }

    interpretKeyObject(key, isKeyPress, inputEvent) {
        const inputEventObject = inputEvent ? inputEvent: new InputEvent(null, null);

        // Check for user-defined mappings
        if (typeof WingsTerminalMapKey === 'function') {            // $TO-DO: should we rename the callback function?

            WingsTerminalMapKey(key, isKeyPress, inputEventObject);

            if (inputEventObject.action || inputEventObject.character ) {
                return inputEventObject;
            }
        }

        // Default mappings
        if (key.code === 0) {
            // Firefox triggers keyPress with a zero for control characters. Ignore, we have proccessed them already.
        }
        else if (key.code < 0x20) {
            if (key.code === 8) {
                inputEventObject.action = KEY_ACTION.LEFTDELETE;
            }
            else if (key.code === 9) {
                inputEventObject.action = (key.shiftKey) ? KEY_ACTION.PREVIOUS : KEY_ACTION.NEXT;
            }
            else if (key.code === 13) {
                if (key.ctrlKey) {
                    inputEventObject.action = KEY_ACTION.NEWLINE;
                }
                else if (key.shiftKey) {
                    inputEventObject.action = KEY_ACTION.FIELDEXIT;
                }
                else {
                    inputEventObject.action = KEY_ACTION.ENTER;
                }
            }
            else if (key.code === 27) {
                inputEventObject.action = KEY_ACTION.RESET;
            }
        }
        else if (!isKeyPress) {

            if (key.code === 37) {
                inputEventObject.action = key.ctrlKey ? KEY_ACTION.FASTLEFT : KEY_ACTION.LEFT;
            }
            else if (key.code === 39) {
                inputEventObject.action = key.ctrlKey ? KEY_ACTION.FASTRIGHT : KEY_ACTION.RIGHT;
            }
            else if (key.code === 38) {
                inputEventObject.action = key.ctrlKey ? KEY_ACTION.FASTUP : KEY_ACTION.UP;
            }
            else if (key.code === 40) {
                inputEventObject.action = key.ctrlKey ? KEY_ACTION.FASTDOWN : KEY_ACTION.DOWN;
            }
            else if (key.code === 45) {
                inputEventObject.action = KEY_ACTION.INSERT;
            }
            else if (key.code === 46) {
                inputEventObject.action = KEY_ACTION.DELETE;
            }
            else if (key.code === 36) {
                inputEventObject.action = KEY_ACTION.RECORD; // Home
            }
            else if (key.code === 35) {
                inputEventObject.action = KEY_ACTION.LAST; // End
            }
            else if (key.code === 33) {
                inputEventObject.action = KEY_ACTION.PGUP;
            }
            else if (key.code === 34) {
                inputEventObject.action = KEY_ACTION.PGDN;
            }
            else if (key.ctrlKey && key.code === 67) {
                inputEventObject.action = KEY_ACTION.COPY;
            }
            else if (key.ctrlKey && key.code === 86) {
                inputEventObject.action = key.shiftKey ? KEY_ACTION.NONBREAKINGPASTE : KEY_ACTION.PASTE;
            }
            else if (key.ctrlKey && key.code === 88) {
                inputEventObject.action = KEY_ACTION.CUT;
            }
            else if (key.code >= 112 && key.code <= 123) {   // Function keys: "F1" -> "F12"

                var num = key.code - 112 + 1;

                if (key.shiftKey) {
                    num += 12;
                }
                else if (key.ctrlKey) {
                    switch (num) {
                        case 5:
                            inputEventObject.action = KEY_ACTION.ATTN;
                            break;

                        case 6:
                            inputEventObject.action = KEY_ACTION.DUP;
                            break;

                        case 9:
                            inputEventObject.action = KEY_ACTION.BEGIN;
                            break;

                        case 11:
                            inputEventObject.action = KEY_ACTION.END;
                            break;
                    }
                }

                if (!inputEventObject.action) {
                    inputEventObject.action = KEY_ACTION.F + num;
                }
            }
            else if (key.code === 145) {  // Scroll-Lock
                inputEventObject.action = KEY_ACTION.CLEAR;
            }
            else if (key.code === 109 && key.shiftKey) { // Shift + '-'
                if (!theVendorSpecificBehaviour.ambiguousShiftMinus()) {
                    inputEventObject.action = KEY_ACTION.FIELDMINUS;
                }
                else {
                    inputEventObject.action = KEY_ACTION.AMBIGUOUS_FIELDMINUS;
                    this.ambiguityResolverKeyPressChar = 45;
                }
                this.ignoreNextKeyPress = true;
            }
            else if (key.code === 107 && key.shiftKey) { // Shift + '+'
                inputEventObject.action = KEY_ACTION.FIELDPLUS; // Note: Firefox will not be able to distinguish from normal '+' sign.
                this.ignoreNextKeyPress = true;
            }
        }
        else {
            inputEventObject.character = String.fromCharCode(key.code);

            if (key.ctrlKey) {
                switch (inputEventObject.character.toUpperCase()) {
                    case 'C':
                        inputEventObject.action = KEY_ACTION.COPY;
                        break;

                    case 'X':
                        inputEventObject.action = KEY_ACTION.CUT;
                        break;

                    case 'V':
                        inputEventObject.action = key.shiftKey ? KEY_ACTION.NONBREAKINGPASTE : KEY_ACTION.PASTE;
                        break;
                }
            }
        }

        return inputEventObject;
    }

    clearDelayedActionData() {
        this.ambiguityResolverKeyPressChar = -1;
        this.delayedAction = null;
    }
}

class Key {
    constructor(code, ctrlKey, altKey, shiftKey) {
        this.code = code;
        this.ctrlKey = ctrlKey;
        this.altKey = altKey;
        this.shiftKey = shiftKey;
    }
}

class InputEvent {
    constructor(action, character) {
        this.action = action;
        this.character = character;
    }
}

class VendorSpecificBehaviour {
    constructor() {
        const ua = window.navigator ? window.navigator.userAgent : '';
        this.is_Firefox = /firefox/i.test(ua.toLowerCase());
    }

    ambiguousShiftMinus() {
        return this.is_Firefox;
    }

    keyPressAfterKeyDown() {
        return this.is_Firefox;
    }

}

const theKeyboard = new Keyboard();
const theVendorSpecificBehaviour = new VendorSpecificBehaviour();
