/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { StringExt };

const STRING_EMPTY = '';
const ONE_BLANK = ' ';

class StringExt {
    static padLeft(str, targetLength, padChar) {
        if (!str) {
            return STRING_EMPTY;
        }
        const howMany = targetLength - str.length;
        if (!howMany) {
            return str;
        }
        return StringExt.getString(padChar, howMany) + str;
    }

    static padRight(str, targetLength, padChar) {
        if (!str)
            return STRING_EMPTY;
        return str + StringExt.getString(padChar, targetLength - str.length);
    }

    static getString(padChar, length) {
        var pad = STRING_EMPTY;

        if (length <= 0) {
            return STRING_EMPTY;
        }
        if (!padChar)
            padChar = ONE_BLANK;

        do {
            pad += padChar;
        } while (pad.length < length);

        return pad;
    }

    static trim(text) {
        return (text || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
    }

    static dupChar(c, howMany) {
        var result = '';
        if (howMany <= 0) {
            return result;
        }

        while (result.length < howMany) {
            result = result + c;
        }

        return result;
    }

    static zeros(howMany) {
        return this.dupChar('0', howMany);
    }

    static blanks(howMany) {
        return this.dupChar(' ', howMany);
    }

    static nulls(howMany) {
        return this.dupChar('\0', howMany);
    }
}