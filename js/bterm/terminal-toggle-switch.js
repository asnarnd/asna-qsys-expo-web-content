/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { ToggleSwitch };

/*eslint-disable*/
import { TerminalDOM } from './terminal-dom.js';
import { MouseEvents } from './terminal-device-pointers.js';
import { StateChangeActionType } from './terminal-redux.js';
/*eslint-enable*/

class ToggleSwitch {
    constructor(element, checked, store) {
        this.store = store;
        this.enabled = false;
        this.element = element;
        if (this.element) {
            this.element._checked = checked;
            this.updateUI();
        }

        this.pointerStart = this.pointerStart.bind(this);

        this.devicePointers = new MouseEvents();
        this.devicePointers.addEventListener(this.element, this.pointerStart, this.pointerMove, this.pointerEnd);
    }

    updateUI() {
        if (!this.element) { return; }

        if (this.element._checked) {
            TerminalDOM.removeClass(this.element, 'AsnaToggleSwitchSwipeLeft');
            TerminalDOM.addClass(this.element, 'AsnaToggleSwitchSwipeRight');
        }
        else {
            TerminalDOM.removeClass(this.element, 'AsnaToggleSwitchSwipeRight');
            TerminalDOM.addClass(this.element, 'AsnaToggleSwitchSwipeLeft');
        }
    }

    pointerStart(event) {
        if (!this.enabled) {
            return;
        }
        this.switchState();
        TerminalDOM.cancelEvent(event);
    }

    pointerMove(event) {
        if (!this.enabled) {
            return;
        }
        TerminalDOM.cancelEvent(event); // Stop propagation
    }

    pointerEnd(event) {
        if (!this.enabled) {
            return;
        }
        TerminalDOM.cancelEvent(event); // Stop propagation
    }

    switchState() {
        if (!this.enabled || !this.element ) {
            return;
        }
        this.element._checked = !this.element._checked;
        this.updateUI();
        this.store.dispatch( {
            type: StateChangeActionType.TOGGLE_SWITCH_STATE_CHANGE,
            payload: {
                id: this.element.id, state: this.element._checked
            }
        });
    }
}
