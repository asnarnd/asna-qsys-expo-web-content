/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theWaitForResponseAnimation as WaitForResponseAnimation };


class WaitForResponseAnimation {
    constructor() {
        this.form = null;
        this.startTime = null;
        this.waitingForResponseProcess = this.waitingForResponseProcess.bind(this);
        this.handleClickEventForAttachedElements = this.handleClickEventForAttachedElements.bind(this);
    }

    init(form) {
        this.form = form;
        this.normalWaitCover = this.appendInvisibleCoverAllDiv(form, 'submit-wait');
        this.longWaitCover = this.appendInvisibleCoverAllDiv(form, 'submit-wait submit-wait-if-exceeds-normal-time');
    }

    attachToClickEventForElements(elements) { // Intended for non-Monarch HTML pages - those that don't PushKey(ibmAidKey) -
        this.init();

        for (let i = 0, l = elements.length; i < l; i++) {
            elements[i].addEventListener('click', this.handleClickEventForAttachedElements);
        }
    }

    appendInvisibleCoverAllDiv(form, classes) {
        let parent = form;
        if (!parent) {
            parent = document.body;
        }
        const div = document.createElement('div');
        div.className = classes;
        div.style.position = 'fixed';
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.display = 'none';

        return parent.appendChild(div);
    }

    prepareWaitAnimation(showBackdrop) {
        let highestZIndex = 0;

        highestZIndex = Math.max(
            highestZIndex,
            ...Array.from(document.querySelectorAll("body *:not([data-highest]):not(.yetHigher)"), (elem) => parseFloat(getComputedStyle(elem).zIndex))
                .filter((zIndex) => !isNaN(zIndex))
        );

        if (this.normalWaitCover) {
            this.normalWaitCover.style.zIndex = highestZIndex + 1;
            if (showBackdrop) {
                this.normalWaitCover.style.display = 'block';
            }
        }
        if (this.longWaitCover) {
            this.longWaitCover.style.zIndex = highestZIndex + 1;
        }
    }

    showAnimationIfLongWait(option) {
        this.startTime = new Date().getTime();

        const wait = option.normalWaitTimeout;
        const checkTransaction = option.checkTransaction;

        // console.log(`showAnimationIfLongWait start: ${this.startTime}`);
        return setInterval(() => { this.waitingForResponseProcess(wait, checkTransaction); }, wait / 4);
    }

    handleClickEventForAttachedElements() {
        this.prepareWaitAnimation(true);
        this.showAnimationIfLongWait({ checkTransaction: false, normalWaitTimeout: 2000 });
    }

    waitingForResponseProcess(wait, checkTransaction) {
        //const me = 'waitingForResponseProcess';
        //console.log(`1. ${me}`);
        //console.log(`2. ${me}         startTime:${this.startTime} wait:${wait} checkTransaction:${checkTransaction}`);
        const now = new Date().getTime();
        //console.log(`3. ${me}         showAnimationIfLongWait time:${now}`);

        if (this.startTime && now - this.startTime > wait) {
            this.startTime = null; // Do it only once
            // console.log(`4. ${me}         showAnimationIfLongWait taking longer than:${wait}`);

            if (this.normalWaitCover) { this.normalWaitCover.style.display = 'none'; }
            if (this.longWaitCover) { this.longWaitCover.style.display = 'block'; }
        }

        if (checkTransaction) {
            //console.log(`5. ${me}         needs to check for transaction.`);
            this.checkTransSeq(false);
            //console.log(`6. ${me}         came back from transaction.`);
        }
    }

    checkTransSeq(enteringPage) { // $TO-DO: this is for Apple iOS workaround, may not be needed anymore?
        if (!this.form || !window.JSON) {
            return;
        }

        let sentSeq;

        if (enteringPage && this.form.__SessionInfo__ && this.form.__SessionInfo__.value) {
            sentSeq = window.JSON.parse(this.form.__SessionInfo__.value);
            if (sentSeq.s) {
                localStorage.setItem('ASNA_iOS_Last_SID', sentSeq.s);
            }
        }

        if (!this.form.__TransactionSeq__ || !this.form.__TransactionSeq__.value) {
            return;
        }

        const storKeyName = 'MonarchTransactionSeq';

        sentSeq = window.JSON.parse(this.form.__TransactionSeq__.value);
        let lastSeq = sessionStorage.getItem(storKeyName);

        if (lastSeq) {
            lastSeq = window.JSON.parse(lastSeq);
            if (lastSeq.us === sentSeq.us) {
                if (lastSeq.t > sentSeq.t) {
                    window.location.reload(true);
                    return;
                }
            }
        }

        if (enteringPage) {
            sessionStorage.setItem(storKeyName, window.JSON.stringify(sentSeq));
        }
    }
}

async function loadWaitResponseStyles(stylesheets) {
    let arr = await Promise.all(stylesheets.map(url => fetch(url)));

    arr = await Promise.all(arr.map(url => url.text()));

    const style = document.createElement('style');

    style.textContent = arr.reduce((prev, fileContents) => prev + fileContents, '');

    document.head.appendChild(style);
}

const theWaitForResponseAnimation = new WaitForResponseAnimation();
loadWaitResponseStyles(['../lib/asna-expo/js/wait-response/spinning-wheel.css']);
