/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theDropDown as DropDown };

import { AsnaDataAttrName } from './asna-data-attr.js';
import { StringExt } from './string.js';

class DropDown {
    initBoxes() {
        const elements = document.querySelectorAll(`input[${AsnaDataAttrName.VALUES}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const input = elements[i];

            const values = input.getAttribute(AsnaDataAttrName.VALUES);
            const valuesText = input.getAttribute(AsnaDataAttrName.VALUES_TEXT);
            this.replaceInputWithSelect(input, this.parseAttribute(values), this.parseAttribute(valuesText));
            // Note: no need to remove AsnaDataAttrName.VALUES, AsnaDataAttrName.VALUES_TEXT, etc. (input was replaced).
        }
    }

    parseAttribute(values) {
        if (!values)
            return [];

        let vals = [];
        let state = 'initial';
        let iLexeme = 0;
        let hasEmbbededQuotes = false;
        let valuesEos = values + '\0';

        for (let i = 0, l = valuesEos.length; i < l; i++) {
            const ch = valuesEos[i];

            switch (state) {
                case 'initial':
                    {
                        iLexeme = i;
                        if (ch === '\'')
                            state = 'in-quote';
                        else if (ch !== ' ')
                            state = 'unquoted';
                        break;
                    }
                case 'in-quote':
                    {
                        if (ch === '\'')
                            state = 'second-quote';
                        break;
                    }
                case 'second-quote':
                    {
                        if (ch !== '\'') {
                            state = 'end-quoted';
                        }
                        else {
                            state = 'in-quote';
                            hasEmbbededQuotes = true;
                        }
                        break;
                    }
                case 'unquoted':
                    {
                        if (ch === ',')
                            state = 'end-un-quoted';
                        break;
                    }
            }

            switch (state) {
                case 'end-quoted':
                    {
                        let lexeme = valuesEos.substring(iLexeme + 1, i - 1);
                        if (hasEmbbededQuotes)
                            lexeme = lexeme.Replace("''", "'");
                        vals.push(lexeme);
                        state = 'initial';
                        break;
                    }
                case 'end-end-unquoted':
                    {
                        vals.push(valuesEos.substring(iLexeme, i));
                        state = 'initial';
                        break;
                    }
            }
        }

        if (state === 'unquoted')
            vals.push(valuesEos.substring(iLexeme, i));

        return vals;
    }

    replaceInputWithSelect(input, optionsValues, optionTexts) {
        if (optionsValues.length !== optionTexts.length) {
            window.alert(`${input.name} field define ${optionsValues.length} Values and ${optionTexts.length} ValuesText. Collection size must match!`);
            return;
        }
        const inputName = input.name;
        const div = document.createElement('div');
        const button = document.createElement('button');
        const nav = document.createElement('nav');
        const ul = document.createElement('ul');
        DropDown.copyNonValuesAttributes(div, input);
        div.classList.add('dds-menu-anchor');
        div.removeAttribute('name');

        button.type = 'button';
        button.className = 'dds-menu-anchor';
        button.innerText = '☰';
        nav.className = 'dds-menu';

        div.appendChild(button);
        div.appendChild(nav);

        nav.appendChild(ul);
        for (let i = 0, l = optionsValues.length; i < l; i++) {
            const optValue = optionsValues[i];
            const optText = optionTexts[i];
            if (optText.length > 0 && !(DropDown.allZeroes(optValue) && optText === '0') ) { // Skip when empty.
                const item = document.createElement('li');
                const itemButton = document.createElement('button');
                itemButton.type = 'button';

                item.appendChild(itemButton);

        //        option.value = optValue;
                //if (DropDown.allZeroes(optValue) && optText === '0') {
                //    itemButton.innerText = ' ';
                //}
                //else
                    itemButton.innerText = optText;

                itemButton.addEventListener('click', (e) => {
                    const form = e.target.form;
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.name = inputName;
                    form.appendChild(input);
                    setTimeout(() => {
                        asnaExpo.page.pushKey('Enter', inputName, optValue);
                    }, 1);
                });
                ul.appendChild(item);
            }
        }

        //const value = input.value ? input.value : null;

        const pn = input.parentNode;
        pn.replaceChild(div, input); // Note: input will be destroyed during DOM's garbage collection.
        // pn.insertBefore(button, nav);

        //if (value) {
        //    for (let i = 0, l = nav.options.length; i < l; i++) {
        //        if ( DropDown.isSameOptionValue(nav.options[i].value, value)) {
        //            nav.selectedIndex = i;
        //            break;
        //        }
        //    }
        //}
    }

    static copyNonValuesAttributes(target, source) {
        if (!source.attributes) { return; }

        for (let i = 0, l = source.attributes.length; i < l; i++) {
            const attr = source.attributes[i];
            if (!attr.name || attr.name === AsnaDataAttrName.VALUES || attr.name === AsnaDataAttrName.VALUES_TEXT) {
                continue;
            }

            target.setAttribute(attr.name, attr.value);
        }
    }

    static allZeroes(test) {
        if (!test) {
            return false;
        }

        for (let i = 0, l = test.length; i < l; i++) {
            if (test[i] !== '0') {
                return false;
            }
        }

        return true;
    }

    static isSameOptionValue(optVal, val) {
        if (typeof optVal === 'string' && typeof optVal === typeof val) {
            return StringExt.trim(optVal) == StringExt.trim(val);
        }
        else if (typeof optVal === typeof val) {
            return optVal == val;
        }

        if (typeof optVal === 'string' && typeof val === 'number') {
            const optNumVal = parseInt(StringExt.trim(optVal), 10);
            return optNumVal === val;
        }
        return false; // Don't know
    }
}

const theDropDown = new DropDown();
