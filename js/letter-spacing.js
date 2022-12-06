/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theLetterSpacing as LetterSpacing };

import { StringExt } from './string.js';


class LetterSpacing {
    computeForElement(el, gridCellWidthPx) {
        const text = StringExt.trim( el.textContent.replace(/'\u00A0'/g, ' ') );
        const textLen = text.length;

        if ( textLen === 0) {
            return 'initial';
        }

        const fixedPitchTextWidthPx =  textLen * gridCellWidthPx;
        const measureEl = LetterSpacing.createMeasureEl(el);

        measureEl.innerHTML = text;
        document.body.appendChild(measureEl);

        let rectWidthPx = measureEl.getBoundingClientRect().width;
        let letterSpacing = 0;    
        while( rectWidthPx < fixedPitchTextWidthPx ) {
            letterSpacing++;
            measureEl.style.letterSpacing = `${letterSpacing}px`;
            rectWidthPx = measureEl.getBoundingClientRect().width;
        }

        if ( letterSpacing > 1 ){
            letterSpacing -= 1;
            measureEl.style.letterSpacing = `${letterSpacing}px`;
            rectWidthPx = measureEl.getBoundingClientRect().width;                

            while( rectWidthPx < fixedPitchTextWidthPx ) {
                letterSpacing += 1/10;
                measureEl.style.letterSpacing = `${letterSpacing}px`;
                rectWidthPx = measureEl.getBoundingClientRect().width;
            }
        }            
    
        document.body.removeChild(measureEl);
        return `${letterSpacing}px`;
    }

    static createMeasureEl(el) {
        const measureEl = document.createElement(el.tagName);

        if (el.className) {
            measureEl.className = el.className;
        }

        measureEl.style.position = 'absolute';
        measureEl.style.visibility = 'hidden';
        measureEl.style.width = 'auto';
        measureEl.style.height = 'auto';
        measureEl.style.overflow = 'visible';
        measureEl.style.margin = '0px';
        measureEl.style.padding = '0px';
        measureEl.style.border = '0px';
        measureEl.style.fontWeight = getComputedStyle(el).getPropertyValue('font-weight');
        measureEl.style.fontFamily = getComputedStyle(el).getPropertyValue('font-family');
        measureEl.style.fontSize = getComputedStyle(el).getPropertyValue('font-size');

        return measureEl;
    }
}

const theLetterSpacing = new LetterSpacing();

