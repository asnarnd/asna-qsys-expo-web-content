/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 *    Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
 *    Copyright (c) 2010 Brinley Ang http://www.unbolt.net
 *    MIT License http://www.opensource.org/licenses/mit-license.php
 */

export { Signature };

import { AsnaDataAttrName } from '../asna-data-attr.js';
import { Unique } from '../dom-events.js';
import { Base64 } from '../base-64.js';
import { SignatureViewer, SignatureLinkToEdit } from './editor.js';

const Z_INDEX = {
    TOP_MOST: 20,
    TOP: 10,
    BACKGROUND: 5,
}

const SIGN_ID_ENDING = '_sign_img';

class Signature {
    static init(form) {
        const elements = form.querySelectorAll(`input[${AsnaDataAttrName.SIGNATURE_OPTIONS}]`);

        for (let i = 0, l = elements.length; i < l; i++) {
            const input = elements[i];

            const encOptions = input.getAttribute(AsnaDataAttrName.SIGNATURE_OPTIONS);
            let options = {}
            try {
                options = JSON.parse(Base64.decode(encOptions));
            }
            catch (ex) {
                // alert(ex);
            }
            Signature.replaceInputWithViewerAndLinkToSign(input, options);
        }
    }

    static prepareForSubmit(form) {
        const elements = form.querySelectorAll(`div[${AsnaDataAttrName.SIGNATURE_INTERNAL_NAME}]`);
        for (let i = 0, l = elements.length; i < l; i++) {
            const signatureCointainer = elements[i];
            const name = signatureCointainer.getAttribute(AsnaDataAttrName.SIGNATURE_INTERNAL_NAME);
            const svgMarkup = theSignatureCollection.svgDictionary[name];
            const input = document.createElement('input');
            input.name = name;
            input.value = Signature.encodeSvgMarkup(svgMarkup); // Note: we don't add the XML svg file header (reduce response)
            input.style.display = 'none';
            signatureCointainer.appendChild(input);
        }
    }

    static replaceInputWithViewerAndLinkToSign(input, options) {
        const name = input.getAttribute("name");
        const base64EncodedXmlSvg = input.getAttribute("value");
        const gridRow = input.style.gridRow;
        const gridColumn = input.style.gridColumn;

        const containerDiv = document.createElement('div');
        containerDiv.id = Unique.getUniqueID();
        if (name) {
            containerDiv.setAttribute(AsnaDataAttrName.SIGNATURE_INTERNAL_NAME, name);
        }
        if (gridRow) {
            containerDiv.style.gridRow = gridRow;
        }
        if (gridColumn) {
            containerDiv.style.gridColumn = gridColumn;
        }
        containerDiv.style.display = 'inline-block';

        const signViewer = document.createElement('div');
        const backCanvas = Signature.createSigCanvas(Z_INDEX.BACKGROUND);
        const signImage = Signature.createSigImage(containerDiv.id + SIGN_ID_ENDING, Z_INDEX.TOP); 

        const aspectRatio = ImageUtil.getAspect(options.aspectRatio);
        const dimPx = DomUtil.getDimInPixels(input);

        signViewer.className = 'dds-signature-container';
        Signature.setExtents(signViewer, aspectRatio, dimPx.w);

        containerDiv.appendChild(signViewer);
        signViewer.appendChild(backCanvas);
        signViewer.appendChild(signImage);

        input.parentNode.replaceChild(containerDiv, input); // Note: input will be destroyed during DOM's garbage collection.

        Signature.setCanvasExtent(backCanvas);
        SignatureViewer.paintBackground(backCanvas,false);

        if (!options.readOnly) {
            new SignatureLinkToEdit(
                signViewer,
                options,
                Z_INDEX.TOP_MOST,
                name,
                signImage.id,
                aspectRatio,    
                options.dateStampWhenSigning,
                options.serverDate,
                theSignatureCollection.handleDataChangedEvent
            );
        }

        // $TODO- Window and 'orientationchange' and 'resize' handlers

        if (base64EncodedXmlSvg) {
            signImage.src = `data:image/svg+xml;base64,${base64EncodedXmlSvg}`;
            signImage.style.display = 'block';
        }
    }

    static createSigCanvas(zIndex) {
        const canvas = document.createElement('canvas');

        canvas.style.position = 'absolute';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = zIndex;

        return canvas;
    }

    static createSigImage(id, zIndex) {
        const img = document.createElement('img');

        img.id = id;
        img.style.position = 'absolute';
        img.style.left = '0px';
        img.style.top = '0px';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.zIndex = zIndex;
        img.style.display = 'none';

        return img;
    }

    static setExtents(div, ratio, width) {
        div.style.width = width + 'px';
        div.style.height = (width * ratio) + 'px';
    }

    static setCanvasExtent(canvas) {
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    static encodeSvgMarkup(svgMarkup) {
        if (!svgMarkup) { return ''; }

        return window.btoa(svgMarkup); // Note: we don't add the XML svg file header (reduce response)
    }
}

class SignatureCollection {
    constructor() {
        this.svgDictionary = [];

        this.handleDataChangedEvent = this.handleDataChangedEvent.bind(this);
    }

    handleDataChangedEvent(name, svgData) {
        if (!name) { return; }

        this.svgDictionary[name] = svgData;
    }
}

class DomUtil {
    static getDimInPixels(el) {
        let wPropVal = typeof (el.style) !== 'undefined' ? el.style.width : null;
        let hPropVal = typeof (el.style) !== 'undefined' ? el.style.height : null;

        if (!wPropVal || wPropVal.indexOf('%') > 0) {
            wPropVal = DomUtil.getComputedStyle(el, 'width');
        } else {
            wPropVal = DomUtil.toPixel(el, wPropVal);
        }

        if (!hPropVal || hPropVal.indexOf('%') > 0) {
            hPropVal = DomUtil.getComputedStyle(el, 'height');
        } else {
            hPropVal = DomUtil.toPixel(el, hPropVal);
        }

        return { w: parseFloat(wPropVal), h: parseFloat(hPropVal) };
    }

    static getComputedStyle(el, propName) {
        if (window.getComputedStyle) {
            return window.getComputedStyle(el, null).getPropertyValue(propName);
        }
        else if (el.currentStyle) {
            return el.currentStyle[propName];
        }
        return '';
    }

    static toPixel(el, val) {
        let pixValue;

        if (val.toLowerCase().indexOf('px') > 0) {
            pixValue = parseFloat(val);
        }
        else {
            const pointPerInch = 72.0; // PostScript definition
            const cmPerInch = 2.54;
            const DPI = DomUtil.getDpi();
            let fontSize;
            let fontSizePx;
            let mDim;

            if (val.toLowerCase().indexOf('in') > 0) {
                pixValue = parseFloat(val) * DPI;
            }
            else if (val.toLowerCase().indexOf('cm') > 0) {
                pixValue = (parseFloat(val) / cmPerInch) * DPI;
            }
            else if (val.toLowerCase().indexOf('mm') > 0) {
                pixValue = ((parseFloat(val) / 10) / cmPerInch) * DPI;
            }
            else if (val.toLowerCase().indexOf('pt') > 0) {
                pixValue = DPI * (parseFloat(val) / pointPerInch);
            }
            else if (val.toLowerCase().indexOf('em') > 0) {
                fontSize = DomUtil.getComputedStyle(el, 'font-size');

                if (fontSize.toLowerCase().indexOf('pt') > 0) {
                    fontSizePx = (parseFloat(fontSize) / pointPerInch) * DPI;
                }
                else if (fontSize.toLowerCase().indexOf('px') > 0) {
                    fontSizePx = parseFloat(fontSize);
                }
                else if (fontSize.toLowerCase().indexOf('em') > 0) {
                    mDim = DomUtil.measureOneCharOfTextIn(el);
                    fontSizePx = mDim.h;
                }

                if (fontSizePx) {
                    pixValue = parseFloat(val) * fontSizePx;
                }
            }
        }

        return pixValue;
    }

    static getDpi() {
        const testDiv = document.createElement('div');

        testDiv.style.width = '1in';
        testDiv.style.visibility = 'hidden';
        testDiv.style.padding = '0px';
        testDiv.style.margin = '0px';

        document.body.appendChild(testDiv);

        const dpi = testDiv.offsetWidth;

        document.body.removeChild(testDiv);

        return dpi;
    }

    static measureOneCharOfTextIn(el) {
        const measureDiv = document.createElement('div');

        measureDiv.type = 'text'
        measureDiv.id = 'Measure';
        measureDiv.style.position = 'absolute';
        measureDiv.style.visibility = 'hidden';
        measureDiv.style.width = 'auto';
        measureDiv.style.height = 'auto';
        measureDiv.style.margin = '0px';
        measureDiv.style.padding = '0px';
        measureDiv.style.border = '0px';
        measureDiv.style.overflow = 'visible';
        measureDiv.innerHTML = "M";

        el.appendChild(measureDiv);

        const height = measureDiv.clientHeight;
        const width = measureDiv.clientWidth;

        el.removeChild(measureDiv);

        return { w: width, h: height };
    }
}

class ImageUtil {
    static getAspect(aspectRatio) {
        const dft = 9 / 16; // Inverse of 16:9
        if (!aspectRatio) {
            return dft;
        }

        const part = aspectRatio.split(':');
        if (part.length !== 2) {
            return dft;
        }

        const num = parseFloat(part[0]);
        const denom = parseFloat(part[1]);

        if (isNaN(num) || isNaN(denom) || num <= 0.0) {
            return dft;
        }

        return denom / num;
    }

}

const theSignatureCollection = new SignatureCollection();