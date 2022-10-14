/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { Validate };

import { PageAlert } from '../js/page-alert.js';
import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { AidKeyHelper } from '../js/kbd.js';
import { Base64, UnicodeToUTF8 } from '../js/base-64.js';

const OK_TEXT = 'Ok';
const MANDATORY_FAILED_MSG = {
    Enter: 'Field is Mandatory. Please enter data into field.',
    Fill: 'Each position in the field must have a character entered in it.'
};

class Validate {
    static setupMandatory(form) { // Note: data-* attribute is NOT removed
        const sel = form.querySelectorAll(`[${AsnaDataAttrName.CHECK_MANDATORY}]`);
        const l = sel ? sel.length : 0;

        if (!l) { return }

        for (let i = 0; i < l; i++) {
            const mandatoryEl = sel[i];

            // Events to cover, SELECT, checkbox and text input
            mandatoryEl.addEventListener('input', (e) => { Validate.setDirty(e); });
            mandatoryEl.addEventListener('change', (e) => { Validate.setDirty(e); });
            mandatoryEl.addEventListener('keypress', (e) => { Validate.setDirty(e); });
        }
    }

    static validateMandatory(form, aidKey, aidKeyBitmap) {
        const sel = form.querySelectorAll(`[${AsnaDataAttrName.CHECK_MANDATORY}]`);
        const l = sel ? sel.length : 0;

        if (!l) { return true; }

        let firstFailedEl = null;
        let errMsg = '';

        for (let i = 0; i < l; i++) {
            const el = sel[i];
            const data = Validate.getMandatoryData(el);
            if (!data) continue;

            if (data.isEnter) {
                if (!data._dirty) {
                    firstFailedEl = el;
                    errMsg = MANDATORY_FAILED_MSG.Enter;
                    break;
                }
            }

            if (data.isFill) {
                if (data._dirty && el.value) {
                    let lenCmp = el.getAttribute('maxlength');
                    if (!lenCmp)
                        lenCmp = data.maxFieldLength;
                    if (lenCmp) {
                        if (typeof lenCmp === 'string') {
                            lenCmp = parseInt(lenCmp, 10);
                        }
                        const value = el.value;
                        let valid = typeof value === 'string' && value.length === lenCmp;

                        if (!valid && typeof value === 'number') {
                            const textVal = '' + value;
                            valid = textVal === lenCmp;
                        }

                        if (!valid) {
                            firstFailedEl = el;
                            errMsg = MANDATORY_FAILED_MSG.Fill;
                            break;
                        }
                    }
                }
            }
        }

        if (!firstFailedEl) { return true; }

        const aidKeyHelper = new AidKeyHelper(aidKeyBitmap);

        // Missing Alt, Ctrl keyboard modifiers ???
        const bypass = aidKeyHelper.isAttention(AidKeyHelper.keyToMapIndex(aidKey));

        if (bypass) { return true; }

        PageAlert.show(errMsg, OK_TEXT, firstFailedEl);
        return false;
    }

    static setDirty(event) {
        const el = event.target;
        if (!el) { return; }

        const data = Validate.getMandatoryData(el);
        if (!data) { return; }
        if (data._dirty) { return; } // Already set, no need to do it again.
        data._dirty = true;
        Validate.updateMandatoryData(el, data);
    }

    static getMandatoryData(el) {
        const attr = el.getAttribute(AsnaDataAttrName.CHECK_MANDATORY);
        if (!attr) { return null; }
        const jsonVal = Base64.decode(attr);
        return JSON.parse(jsonVal);
    }

    static updateMandatoryData(el, newData) {
        const encData = Base64.encode(UnicodeToUTF8.getArray(JSON.stringify(newData)));
        el.setAttribute(AsnaDataAttrName.CHECK_MANDATORY, encData);
    }

    static reportFormValidity(form) {
        const inputs = form.querySelectorAll('input,select,textarea:not([type="hidden"])');
        for (let i = 0, l = inputs.length; i < l; i++) {
            const input = inputs[i];

            if (typeof (input.reportValidity) === 'function' && ! input.reportValidity()) {
                return false;
            }
        }
        return true;
    }
}
