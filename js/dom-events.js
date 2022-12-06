/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theDomEvents as DomEvents, Unique };

let uniqueID = 0;

class Unique {

    static getUniqueID() {
        return `unique${uniqueID++}`;
    }
}

class DomEvents {
    cancelEvent(event) {
        if (event && typeof (event.stopPropagation) === 'function') { // Modern browsers. Note: On IE10 e is not window.event
            event.stopPropagation();

            if (typeof (event.preventDefault) === 'function') {
                event.preventDefault(); // On IE9+,  preventDefault() also sets window.event.returnValue to false
            }

            // IE 9+
            if (typeof (event.cancelBubble) === 'boolean') {
                event.cancelBubble = true;
            }
        }
        else if (window.event) { // IE < 9
            window.event.cancelBubble = true;
            window.event.returnValue = false;
            /*eslint-disable */
            try {
                window.event.keyCode = 0; // May be read-only (handle exception)
            }
            catch (ex) {
            }
            /*eslint-enable */
        }
    }
}

const theDomEvents = new DomEvents();