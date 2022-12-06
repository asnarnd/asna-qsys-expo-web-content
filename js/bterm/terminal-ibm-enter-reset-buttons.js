/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { ActionButton };

/*eslint-disable*/
import { ZINDEX, TerminalDOM } from './terminal-dom.js';
import { MouseEvents, PointerEvents } from './terminal-device-pointers.js';
/*eslint-enable*/

class ActionButton {
    constructor(id, settingsStore, executeFn, action ) {
        this.el = document.querySelector(`#${id}`);
        this.settingsStore = settingsStore;
        this.executeFn = executeFn;
        this.action = action;

        this.handleClickEvent = this.handleClickEvent.bind(this);
    }

    init(label, alignment, termLayout, ) {
        if (!this.el) { return; }

        this.el.innerHTML = label;
        this.calcLocation(alignment, termLayout);
        this.el.style.zIndex = ZINDEX.ENTER_RESET_BUTTONS;

        if (this.executeFn && this.action) {
            this.el.addEventListener('click', this.handleClickEvent, false);
        }
    }

    calcLocation(termLayout) {
        if (!this.el) { return; }

        const dim = TerminalDOM.getDimensions(this.el);

        this.el.style.left = `${termLayout.w - dim.w}px`;
        this.el.style.top = `${termLayout.h - dim.h}px`;
    }

    showIfEnabled() {
        this.hide();
        if (this.settingsStore && this.settingsStore.state.show.bigButtons) {
            this.show();
        }
    }

    show() {
        if (this.el) {
            this.el.style.display = 'block';
        }
    }

    hide() {
        if (this.el) {
            this.el.style.display = 'none';
        }
    }

    handleClickEvent(event) {
        TerminalDOM.cancelEvent(event);
        if (this.executeFn && this.action) {
            this.executeFn('', this.action);
        }
    }
}