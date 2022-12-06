/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theInvertFontColors as InvertFontColors };

class InvertFontColors {
    changeFontColorStyles(el) {
        el = this.firstInputChildIfDiv(el);

        const color = getComputedStyle(el).getPropertyValue('color');
        let bkgndColor = getComputedStyle(el).getPropertyValue('background-color');

        if (bkgndColor === 'rgba(0, 0, 0, 0)' || bkgndColor === 'transparent') {
            bkgndColor = 'white';
        }

        el.style.backgroundColor = color;
        el.style.color = bkgndColor;
    }

    firstInputChildIfDiv(el) {
        if (el.tagName === 'DIV') { // DdsDecDate is a wrapper, find its input child
            var selInput = el.querySelectorAll('input[type=text]');
            if (selInput && selInput.length > 0) {
                el = selInput[0];
            }
        }
        return el;
    }
}

const theInvertFontColors = new InvertFontColors();
