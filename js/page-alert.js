/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theAlert as PageAlert};

import { DomEvents } from '../js/dom-events.js';
import { DialogPolyfill } from '../js/bterm/terminal-dialog-polyfill.js';

class EnhancedAlert {
    constructor() {
        this.handleOkClickEvent = this.handleOkClickEvent.bind(this);

        DialogPolyfill.register();
        EnhancedAlert.registerDialog();
        this.dialogPolyfill = new DialogPolyfill();
        this.dialog = null;
    }

    static registerDialog() {
        const dialogEl = document.createElement('dialog');
        dialogEl.id = 'alert';
        dialogEl.style.fontFamily = 'arial, sans-serif';
        dialogEl.style.borderColor = 'darkgray';
        dialogEl.style.borderStyle = 'solid';
        dialogEl.style.borderWidth = '1px';

        dialogEl.innerHTML = `
                <div id="alert-msg"></div>
                <form method="dialog">
                    <br>
                    <div style="text-align:center">
                        <button type="button" id="dialog-action-ok">Ok</button>
                    </div>
                </form>
            `;

        document.body.appendChild(dialogEl);
    }

    show(errorMsg, okText, focusWhenDone) {
        this.savedActiveElement = focusWhenDone ? focusWhenDone : document.activeElement;
        this.dialog = this.dialogPolyfill.dialogQuery('#alert');
        if (!this.dialog) { return; }

        EnhancedAlert.setInnerHtml(this.dialog, '#alert-msg', errorMsg);
        EnhancedAlert.setInnerHtml(this.dialog, '#dialog-action-ok', okText);
        this.dialog.showModal();

        EnhancedAlert.AddClickEventListener(this.dialog, '#dialog-action-ok', this.handleOkClickEvent, false);
    }

    handleOkClickEvent(event) {
        DomEvents.cancelEvent(event);
        this.dialog.close();
        this.dialog = null;
        if (this.savedActiveElement && typeof this.savedActiveElement.focus === 'function') {
            setTimeout(function (actEl) {
                actEl.focus();
            }, 1, this.savedActiveElement );
        }
    }

    static AddClickEventListener(parent, selector, f) {
        const el = parent.querySelector(selector);
        if (el) {
            el.addEventListener('click', f, false);
        }
    }

    static setInnerHtml(parent, selector, html) {
        const el = parent.querySelector(selector);
        if (el) {
            el.innerHTML = html;
        }
    }
}

const theAlert = new EnhancedAlert();
