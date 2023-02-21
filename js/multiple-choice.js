/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theCheckbox as Checkbox };
export { theRadioButtonGroup as RadioButtonGroup };

import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { Base64 } from '../js/base-64.js';
import { Unique } from '../js/dom-events.js';


class Checkbox {
    init(form) {
        const elements = form.querySelectorAll(`input[${AsnaDataAttrName.CHECKBOX_OPTIONS}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const input = elements[i];
            const checkboxOptions = { checked: false };
            
            const encOptions = input.getAttribute(AsnaDataAttrName.CHECKBOX_OPTIONS);
            try {
                const options = JSON.parse(Base64.decode(encOptions));
                if (options.readOnly) {
                    checkboxOptions.readonly = true;
                }

                if (options.textLabel) {
                    checkboxOptions.textLabel = options.textLabel;
                }
                checkboxOptions.checked = options.currentValue === options.trueValue;
            }
            catch (ex) {
                // alert(ex);
            }
            Checkbox.replaceInputWithDivWithLabelAndCheckbox(input, checkboxOptions);
        }
    }

    static replaceInputWithDivWithLabelAndCheckbox(input, checkboxOptions) {
        const div = document.createElement('div');
        div.style.gridColumn = input.style.gridColumn;
        if (input.tabIndex) {
            div.tabIndex = input.tabIndex;
        }
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = Unique.getUniqueID();
        checkbox.name = input.name;
        checkbox.checked = checkboxOptions.checked;
        if (checkboxOptions.readonly)
            checkbox.disabled = true;

        const encOptions = input.getAttribute(AsnaDataAttrName.CHECKBOX_OPTIONS);
        checkbox.setAttribute(AsnaDataAttrName.CHECKBOX_OPTIONS, encOptions);
        checkbox.style.verticalAlign = 'middle';

        const label = document.createElement('label');
        label.setAttribute('for', checkbox.id);
        label.style.fontSize = 'calc(var(--body-font-size) * 0.75)'; // TO-DO: move this to CSS
        if (checkboxOptions.textLabel) {
            label.innerText = checkboxOptions.textLabel;
        }

        const rowcol = input.getAttribute(AsnaDataAttrName.ROWCOL);
        if (rowcol) {
            checkbox.setAttribute(AsnaDataAttrName.ROWCOL, rowcol);
        }

        const positionCursor = input.getAttribute(AsnaDataAttrName.POSITION_CURSOR);
        if (positionCursor !== null) {
            checkbox.setAttribute(AsnaDataAttrName.POSITION_CURSOR, positionCursor);
        }

        div.appendChild(checkbox);
        div.appendChild(label);

        input.replaceWith(div);
    }

    prepareForSubmit(form) {
        const elements = form.querySelectorAll(`input[${AsnaDataAttrName.CHECKBOX_OPTIONS}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const input = elements[i];
            const checked = input.checked;

            const encOptions = input.getAttribute(AsnaDataAttrName.CHECKBOX_OPTIONS);
            try {
                const options = JSON.parse(Base64.decode(encOptions));
                input.style.display = 'none';
                input.type = 'text';
                if (!options.readOnly) {
                    if (checked && options.trueValue) {
                        input.value = options.trueValue;
                    }
                    else if (!checked  && options.falseValue) {
                        input.value = options.falseValue;
                    }
                }
            }
            catch (ex) {
                // alert(ex);
            }
        }
    }
}

const RADIO_GROUP_TAGNAME = 'span';

class RadioButtonGroup {
    init(form) {
        const elements = form.querySelectorAll(`input[${AsnaDataAttrName.RADIO_BUTTON_GROUP_OPTIONS}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const input = elements[i];

            const encOptions = input.getAttribute(AsnaDataAttrName.RADIO_BUTTON_GROUP_OPTIONS);
            let options = {}
            try {
                options = JSON.parse(Base64.decode(encOptions));
            }
            catch (ex) {
                // alert(ex);
            }
            RadioButtonGroup.replaceInputWithDivWithLabelAndRadios(input, options);
        }
    }

    static replaceInputWithDivWithLabelAndRadios(input, options) {
        const div = document.createElement('div');
        const divRadioGroup = document.createElement(RADIO_GROUP_TAGNAME);
        divRadioGroup.id = Unique.getUniqueID();
        divRadioGroup.setAttribute('data-name', input.name);
        div.style.gridColumn = input.style.gridColumn;
        if (input.tabIndex) {
            div.tabIndex = input.tabIndex;
        }

        const rowcol = input.getAttribute(AsnaDataAttrName.ROWCOL);
        if (rowcol) {
            div.setAttribute(AsnaDataAttrName.ROWCOL, rowcol);
        }

        const positionCursor = input.getAttribute(AsnaDataAttrName.POSITION_CURSOR);
        if (positionCursor !== null) {
            divRadioGroup.setAttribute(AsnaDataAttrName.POSITION_CURSOR, positionCursor);
        }

        divRadioGroup.setAttribute(AsnaDataAttrName.RADIO_BUTTON_GROUP_OPTIONS, input.getAttribute(AsnaDataAttrName.RADIO_BUTTON_GROUP_OPTIONS));

        const labelGroup = document.createElement('label');
        labelGroup.setAttribute('for', divRadioGroup.id);
        labelGroup.style.fontSize = 'calc(var(--body-font-size) * 0.75)'; // TO-DO: move this to CSS

        if (options.textLabel) {
            labelGroup.innerText = options.textLabel;
        }

        for (let i = 0; i < options.valueText.length; i++) {
            const spanRadio = document.createElement('span');
            const labelRadio = document.createElement('label'); 

            labelRadio.style.fontSize = 'calc(var(--body-font-size) * 0.75)'; // TO-DO: move this to CSS
            labelRadio.innerText = options.valueText[i];
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = Unique.getUniqueID();
            radio.name = input.name; // Note: all with same name, that defines a group
            radio.checked = i < options.values.length ? options.currentValue === options.values[i] : false;
            labelRadio.setAttribute('for', radio.id);
            spanRadio.appendChild(radio);
            spanRadio.appendChild(labelRadio);
            divRadioGroup.appendChild(spanRadio);
        }

        div.appendChild(labelGroup);
        div.appendChild(divRadioGroup);
        input.replaceWith(div);
    }

    prepareForSubmit(form) {
        const groupContainers = form.querySelectorAll(`${RADIO_GROUP_TAGNAME}[${AsnaDataAttrName.RADIO_BUTTON_GROUP_OPTIONS}]`);
        let fields = [];

        for (let i = 0, l = groupContainers.length; i < l; i++) {
            const groupContainer = groupContainers[i];
            const encOptions = groupContainer.getAttribute(AsnaDataAttrName.RADIO_BUTTON_GROUP_OPTIONS);
            let options = {}
            try {
                options = JSON.parse(Base64.decode(encOptions));
            }
            catch (ex) {
                // alert(ex);
            }
            if (!options.values) {
                continue;
            }
            const fieldName = groupContainer.getAttribute('data-name');
            const radios = groupContainer.querySelectorAll('input[type="radio"]');
            const indexChecked = RadioButtonGroup.lookupChecked(radios, fieldName);

            fields.push({ name: fieldName, value: indexChecked >= 0 ? options.values[indexChecked] : '', parent: groupContainer.parentNode });
        }

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const toReplace = field.parent;
            const input = document.createElement('input');
            input.type = 'text';
            input.style.display = 'none';
            input.name = field.name;
            input.value = field.value;
            input.setAttribute(AsnaDataAttrName.ROWCOL, toReplace.getAttribute(AsnaDataAttrName.ROWCOL));
            toReplace.replaceWith(input);
        }
    }

    static lookupChecked(radios, fieldName) {
        for (let i = 0; i < radios.length; i++) {
            const radio = radios[i];
            if (radio.name === fieldName && radio.checked) {
                return i;
            }
        }
        return -1;
    }
}

const theCheckbox = new Checkbox();
const theRadioButtonGroup = new RadioButtonGroup();
