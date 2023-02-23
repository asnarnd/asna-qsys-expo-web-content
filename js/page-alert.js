/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theAlert as PageAlert};

import { AsnaDataAttrName } from '../js/asna-data-attr.js';
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

    static selectFirstMsgPanel() {
        const msgPanels = document.querySelectorAll('.dds-message-panel');
        if (!msgPanels || msgPanels.length === 0) { return null; }
        return msgPanels[0];
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

    prependPanelMsg(msg) {
        const msgPanel = EnhancedAlert.selectFirstMsgPanel();
        if (!msgPanel) { return false; }
        this.removeVolatileMsgs(msgPanel);
        let ul = msgPanel.querySelector('ul');
        if (!ul) {
            ul = document.createElement('ul');
            msgPanel.appendChild(ul);
        }
        const li = document.createElement('li');
        li.innerText=msg;
        li.setAttribute(AsnaDataAttrName.VOLATILE_MSG, '');

        const firstChild = ul.firstChild;
        if (!firstChild) {
            ul.appendChild(li);
        }
        else {
            ul.insertBefore(li, firstChild);
        }
        return true;
    }

    removeVolatileMsgs(msgPanel) {
        if (!msgPanel) {
            msgPanel = EnhancedAlert.selectFirstMsgPanel();
        }
        if (!msgPanel) {
            return;
        }
        const volatileElements = msgPanel.querySelectorAll(`li[${AsnaDataAttrName.VOLATILE_MSG}]`);
        volatileElements.forEach((li) => {
            const ul = li.parentElement;
            ul.removeChild(li);
        });
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
