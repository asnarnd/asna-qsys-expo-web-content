/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theClipboard as Clipboard, thePasteText as PasteText, thePasteUI as PasteUI};

import { DialogPolyfill } from './terminal-dialog-polyfill.js';
import { TerminalDOM } from './terminal-dom.js';

class Clipboard {
    constructor() {
        this.text = '';
    }

    setText(text) {
        this.text = text;

        if (window.clipboardData && typeof window.clipboardData.getData === 'function') {
            window.clipboardData.setData('Text', this.text);
        }
        else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(this.text).then(function () {

            }, function () {
                    console.error('navigator.clipboard.writeText failed');
            });
        }
    }
}

class PasteText {
    constructor() {
        this.mode = 'idle';
    }

    measureWord(text, index) {
        if (index >= text.length) {
            return -1;
        }

        const from = index;
        let c = text.charAt(index);

        while (c === ' ' && index < text.length) {  // Skip leading spaces.
            index++;
            c = text.charAt(index);
        }

        while (c !== ' ' && c !== '\r' && c !== '\n' && index < text.length) { // Stop at white or (CR or NL)
            index++;
            c = text.charAt(index);
        }

        return index - from;
    }

}

const KEY_ENTER = 13;
const KEY_ESCAPE = 27;

const DIALOG_ID = {
    VERIFY_PASTE_DIALOG : 'ask-user-verify-paste',
    VERIFY_PASTE_TEXT_AREA: 'ask-user-verify-paste-dialog-text-area'
};

class PasteUI {
    constructor() {
        this.handleTextAreaInputEvent = this.handleTextAreaInputEvent.bind(this);
        this.handleDialogKeyDownEvent = this.handleDialogKeyDownEvent.bind(this);
        this.handleOkClickEvent = this.handleOkClickEvent.bind(this);
        this.handleCancelClickEvent = this.handleCancelClickEvent.bind(this);

        DialogPolyfill.register();
        PasteUI.registerDialog();
        this.dialogPolyfill = new DialogPolyfill();
        this.dialog = null;
    }

    askUserVerify(text, nonbreaking, question, wantRtnText, okText, cancelText, fOk, fCancel) {
        this.dialog = this.dialogPolyfill.dialogQuery(`#${DIALOG_ID.VERIFY_PASTE_DIALOG}`);
        if (!this.dialog) { return; }

        this.fOk = fOk;
        this.fCancel = fCancel;
        this.nonbreakingPaste = nonbreaking;

        PasteUI.setInnerHtml(this.dialog, '#dialog-question', question);

        this.textArea = this.dialog.querySelector(`#${DIALOG_ID.VERIFY_PASTE_TEXT_AREA}`);
        if (this.textArea) {
            if (text) {
                this.textArea.value = text;
            }
            this.suspendPasteTA_Filtering = false;
            this.textArea.addEventListener('input', this.handleTextAreaInputEvent, false); // Ok to add it multiple-times (same function).
        }

        PasteUI.setInnerHtml(this.dialog, '#dialog-action-ok', okText);
        PasteUI.setInnerHtml(this.dialog, '#dialog-action-cancel', cancelText);
        PasteUI.setInnerHtml(this.dialog, '#dialog-want-rtn-check-lbl', wantRtnText);

        this.dialog.showModal();
        if (/Edge/i.test(navigator.userAgent)) {
            const rTa = this.textArea.getBoundingClientRect();
            this.dialog.style.width = this.textArea.width + 'px';
        }
        this.textArea.focus();
        this.dialog.addEventListener('keydown', this.handleDialogKeyDownEvent, false);
        PasteUI.AddClickEventListener(this.dialog, '#dialog-action-ok', this.handleOkClickEvent, false);
        PasteUI.AddClickEventListener(this.dialog, '#dialog-action-cancel', this.handleCancelClickEvent, false);
    }

    handleDialogKeyDownEvent(event) {
        if (event.which === KEY_ENTER || event.keyCode === KEY_ENTER) {
            const chk = this.dialog.querySelector('#dialog-want-rtn-check');
            if (chk && chk.checked) {
                return;
            }
            TerminalDOM.cancelEvent(event);
            this.dialog.close();
            this.fOk(this.textArea.value, this.nonbreakingPaste);
        } else if (event.which === KEY_ESCAPE || event.keyCode === KEY_ESCAPE) {
            TerminalDOM.cancelEvent(event);
            this.dialog.close();
            this.fCancel();
        }
    }

    handleTextAreaInputEvent() {
        if (this.suspendPasteTA_Filtering) { return; }
        this.suspendPasteTA_Filtering = true;

        const text = this.textArea.value;
        let newText = '';

        let found = false;
        for (let i = 0, l = text.length; i < l; i++) {
            const c = text.charAt(i);
            if (c !== '\r' && c !== '\n' && text.charCodeAt(i) < 0x20) {
                newText = newText + ' ';
                found = true;
            }
            else {
                newText = newText + c;
            }
        }
        if (found) {
            this.textArea.value = newText;
        }
        this.suspendPasteTA_Filtering = false;
    }

    handleOkClickEvent(event) {
        TerminalDOM.cancelEvent(event);
        this.dialog.close();
        this.fOk(this.textArea.value, this.nonbreakingPaste);
    }
    handleCancelClickEvent(event) {
        TerminalDOM.cancelEvent(event);
        this.dialog.close();
        this.fCancel();
    }

    static setInnerHtml(parent, selector, html) {
        const el = parent.querySelector(selector);
        if (el) {
            el.innerHTML = html;
        }
    }
    static AddClickEventListener(parent, selector, f) {
        const el = parent.querySelector(selector);
        if (el) {
            el.addEventListener('click', f, false);
        }
    }
    static registerDialog() {
        setTimeout(() => {
            const dialogEl = document.createElement('dialog');
            dialogEl.id = `${DIALOG_ID.VERIFY_PASTE_DIALOG}`;
            dialogEl.style.fontFamily = 'arial, sans-serif';
            dialogEl.style.borderColor = 'darkgray';
            dialogEl.style.borderStyle = 'solid';
            dialogEl.style.borderWidth = '1px';

            dialogEl.innerHTML = `
                <div id="dialog-question"></div>
                <br>
                <br>
                <form method="dialog">
                    <textarea id="${DIALOG_ID.VERIFY_PASTE_TEXT_AREA}" rows="10" cols="80" style="user-select:text"></textarea>
                    <br>
                    <div>
                        <input type="checkbox" id="dialog-want-rtn-check"></input>
                        <label id="dialog-want-rtn-check-lbl" for="dialog-want-rtn-check">Wants Return</label>
                    </div>
                    <br>
                    <div style="text-align:center">
                    <button type="button" id="dialog-action-ok">Ok</button>
                        &nbsp;&nbsp;
                    <button type="button" id="dialog-action-cancel" >Cancel</button>
                    </div>
                </form>
            `;

            document.body.appendChild(dialogEl);
        }, 100);
    }
}

const theClipboard = new Clipboard();
const thePasteText = new PasteText();
const thePasteUI = new PasteUI();

