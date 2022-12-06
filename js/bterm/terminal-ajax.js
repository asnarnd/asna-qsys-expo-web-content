/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { AjaxRequest, theAjaxUI as AjaxUI };

import { TerminalDOM } from './terminal-dom.js';
import { DialogPolyfill } from './terminal-dialog-polyfill.js';
import { Fetch } from '../ajax/ajax-fetch.js';

const AJAX_RESPONSE_TIMEOUT = 5 * 60 * 1000; // Milliseconds
const END_OF_PAGE_REL_HREF = '../../Monarch/EoJ';

const DIALOG_ID = {
    CONTINUE_WAITING_DIALOG: 'ask-user-continue-waiting',
};

class AjaxRequest {
    static sendRequest(aidKey, encRequest, telnetFlags, dupFields, handleAjaxResponseEvent) {

        const data = {
            action: 'get5250',
            recordName: '',
            requestorAidKey: aidKey,
            from: 0,
            to: 0,
            mode: '',
            encodedRequest: encRequest,
            telnetFlags: telnetFlags,
            dupFields: dupFields,

        };

        Fetch.fetchWithTimeout(decodeURI(document.URL), data, AJAX_RESPONSE_TIMEOUT)
            .then(function (response) {
                response.json().then(function (jsonStr) {
                    handleAjaxResponseEvent(jsonStr);
                }
                ).catch(function (err) {
                    console.error(`JSON decode error:${err}`);
                });
            }
            ).
            catch(function (err) {
                console.error(`Fetch failed error:${err}`);
            }
        );
    }
}

class AjaxUI {
    constructor() {
        DialogPolyfill.register();
        AjaxUI.registerDialog();
        this.dialogPolyfill = new DialogPolyfill();
        this.dialog = null;

        this.handleYesClickEvent = this.handleYesClickEvent.bind(this);
        this.handleNoClickEvent = this.handleNoClickEvent.bind(this);
    }

    askUserContinueWaiting(msgText, questionText, contHandler, stopHandler) {
        this.dialog = this.dialogPolyfill.dialogQuery(`#${DIALOG_ID.CONTINUE_WAITING_DIALOG}`);
        if (!this.dialog) { return; }

        this.fYes = contHandler;
        this.fNo = stopHandler;

        AjaxUI.setInnerHtml(this.dialog, '#dialog-message', msgText); 
        AjaxUI.setInnerHtml(this.dialog, '#dialog-question', questionText); 
        this.dialog.showModal();
        AjaxUI.AddClickEventListener(this.dialog, '#dialog-action-yes', this.handleYesClickEvent, false);
        AjaxUI.AddClickEventListener(this.dialog, '#dialog-action-no', this.handleNoClickEvent, false);
    }

    handleYesClickEvent(event) {
        AjaxUI.cancelEvent(event);
        this.dialog.close();
        this.fYes();
    }

    handleNoClickEvent(event) {
        TerminalDOM.cancelEvent(event);
        this.dialog.close();
        this.fNo();
    }

    static registerDialog() {
        setTimeout(() => {
            const dialogEl = document.createElement('dialog');
            dialogEl.id = `${DIALOG_ID.CONTINUE_WAITING_DIALOG}`;
            dialogEl.style.fontFamily = 'arial, sans-serif';
            dialogEl.style.borderColor = 'darkgray';
            dialogEl.style.borderStyle = 'solid';
            dialogEl.style.borderWidth = '1px';

            dialogEl.innerHTML = `
                <div id="dialog-message"></div>
                <br>
                <div id="dialog-question"></div>
                <br>
                <form method="dialog">
                    <br>
                    <div style="text-align:center">
                    <button type="button" id="dialog-action-yes">Yes</button>
                     &nbsp;&nbsp;
                    <button type="button" id="dialog-action-no" >No</button>
                    </div>
                </form>
            `;

            document.body.appendChild(dialogEl);
        }, 100);
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
}

const theAjaxUI = new AjaxUI();
