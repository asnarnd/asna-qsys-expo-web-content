/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const PADCHAR = '=';
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export { Base64, UnicodeToUTF8 };

class Base64 {
    static encode(utf8bytes) {
        if (utf8bytes.length === 0) {
            return '';
        }

        let b10;
        let x = [];
        let imax = utf8bytes.length - utf8bytes.length % 3;
        let i=0;

        for (i = 0; i < imax; i += 3) {
            b10 = (utf8bytes[i] << 16) | (utf8bytes[i + 1] << 8) | utf8bytes[i + 2];
            x.push(ALPHA.charAt(b10 >> 18), ALPHA.charAt((b10 >> 12) & 0x3F), ALPHA.charAt((b10 >> 6) & 0x3f),
                ALPHA.charAt(b10 & 0x3f));
        }
        switch (utf8bytes.length - imax) {
            case 1:
                b10 = utf8bytes[i] << 16;
                x.push(ALPHA.charAt(b10 >> 18), ALPHA.charAt((b10 >> 12) & 0x3F), PADCHAR, PADCHAR);
                break;
            case 2:
                b10 = (utf8bytes[i] << 16) | (utf8bytes[i + 1] << 8);
                x.push(ALPHA.charAt(b10 >> 18), ALPHA.charAt((b10 >> 12) & 0x3F),
                    ALPHA.charAt((b10 >> 6) & 0x3f), PADCHAR);
                break;
        }

        return x.join('');
    }

    static makeDOMException() {
        // sadly in FF,Safari,Chrome you can't make a DOMException
        try {
            return new DOMException(DOMException.INVALID_CHARACTER_ERR);
        } catch (tmp) {
            // not available, just passback a duck-typed equiv
            // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error
            // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error/prototype
            let ex = new Error("DOM Exception 5");

            // ex.number and ex.description is IE-specific.
            ex.code = ex.number = 5;
            ex.name = ex.description = "INVALID_CHARACTER_ERR";

            // Safari/Chrome output format
            ex.toString = () => { return 'Error: ' + ex.name + ': ' + ex.message; };
            return ex;
        }
    }

    static getbyte64(s, i) {
        // This is oddly fast, except on Chrome/V8.
        //  Minimal or no improvement in performance by using a
        //   object with properties mapping chars to value (eg. 'A': 0)
        const idx = ALPHA.indexOf(s.charAt(i));
        if (idx === -1) {
            throw Base64.makeDOMException();
        }
        return idx;
    }

    static decode(s) {
        let imax = s.length;
        if (imax === 0) {
            return s;
        }

        if (imax % 4 !== 0) {
            throw Base64.makeDOMException();
        }

        let pads = 0;
        if (s.charAt(imax - 1) === PADCHAR) {
            pads = 1;
            if (s.charAt(imax - 2) === PADCHAR) {
                pads = 2;
            }
            // either way, we want to ignore this last block
            imax -= 4;
        }

        let x = [];
        let i, b10;
        for (i = 0; i < imax; i += 4) {
            b10 = (Base64.getbyte64(s, i) << 18) | (Base64.getbyte64(s, i + 1) << 12) |
                (Base64.getbyte64(s, i + 2) << 6) | Base64.getbyte64(s, i + 3);
            x.push(b10 >> 16);
            x.push((b10 >> 8) & 0xff);
            x.push(b10 & 0xff);
        }

        switch (pads) {
            case 1:
                b10 = (Base64.getbyte64(s, i) << 18) | (Base64.getbyte64(s, i + 1) << 12) | (Base64.getbyte64(s, i + 2) << 6);
                x.push(b10 >> 16);
                x.push((b10 >> 8) & 0xff);
                break;
            case 2:
                b10 = (Base64.getbyte64(s, i) << 18) | (Base64.getbyte64(s, i + 1) << 12);
                x.push(b10 >> 16);
                break;
        }

        return UTF8toUnicode.getStr(x);
    }
}

class UnicodeToUTF8 {
    static getArray(unicodeText) {
        let utf8 = [];

        for (let n = 0; n < unicodeText.length; n++) {
            const c = unicodeText.charCodeAt(n);

            if (c < 0x80) {
                utf8.push(c);
            }
            else if (c < 0x800) {
                utf8.push((c >> 6) | 0xc0);
                utf8.push((c & 0x3f) | 0x80);
            }
            else if (c < 0x10000) {
                utf8.push((c >> 12) | 0xe0);
                utf8.push(((c >> 6) & 0x3f) | 0x80);
                utf8.push((c & 0x3f) | 0x80);
            }
            else {
                utf8.push((c >> 18) | 0xf0);
                utf8.push(((c >> 12) & 0x3f) | 0x80);
                utf8.push(((c >> 6) & 0x3f) | 0x80);
                utf8.push((c & 0x3f) | 0x80);
            }
        }

        return utf8;
    }

    static getStr(unicodeText) {
        let utf8 = [];

        for (let n = 0; n < unicodeText.length; n++) {
            const c = unicodeText.charCodeAt(n);

            if (c < 0x80) {
                utf8.push(String.fromCharCode(c));
            }
            else if (c < 0x800) {
                utf8.push(String.fromCharCode((c >> 6) | 0xc0));
                utf8.push(String.fromCharCode((c & 0x3f) | 0x80));
            }
            else if (c < 0x10000) {
                utf8.push(String.fromCharCode((c >> 12) | 0xe0));
                utf8.push(String.fromCharCode(((c >> 6) & 0x3f) | 0x80));
                utf8.push(String.fromCharCode((c & 0x3f) | 0x80));
            }
            else {
                utf8.push(String.fromCharCode((c >> 18) | 0xf0));
                utf8.push(String.fromCharCode(((c >> 12) & 0x3f) | 0x80));
                utf8.push(String.fromCharCode(((c >> 6) & 0x3f) | 0x80));
                utf8.push(String.fromCharCode((c & 0x3f) | 0x80));
            }
        }

        return utf8.join('');
    }
}

class UTF8toUnicode  {
    static getStr(utf8_bytes) {
        let unicodeText = [];

        for (let index = 0; index < utf8_bytes.length; index++) {

            if (utf8_bytes[index] < 0x80) {
                unicodeText.push(String.fromCharCode(utf8_bytes[index]));
            }
            else if (utf8_bytes[index] < 0xe0) {
                unicodeText.push(String.fromCharCode(((utf8_bytes[index] << 6) & 0x7c0) | (utf8_bytes[index + 1] & 0x3f)));
                index++;
            }
            else if (utf8_bytes[index] < 0xf0) {
                unicodeText.push(String.fromCharCode(((utf8_bytes[index] << 12) & 0xf000) | ((utf8_bytes[index + 1] << 6) & 0xfc0) |
                    (utf8_bytes[index + 2] & 0x3f)));
                index += 2;
            }
            else {
                unicodeText.push(String.fromCharCode(((utf8_bytes[index] << 18) & 0x1c0000) | ((utf8_bytes[index + 1] << 12) & 0x3f000) |
                    ((utf8_bytes[index + 2] << 6) & 0xfc0) | (utf8_bytes[index + 3] & 0x3f)));
                index += 3;
            }
        }

        return unicodeText.join('');
    }
}

