/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { Set, Validate };

class Validate {
    static alphaOnly(letter) {
        if (letter === ' ' || letter === ',' || letter === '.' || letter === '-') {
            return true;
        }

        return /^[a-zA-Z]/.test(letter);
    }

    static numericOnly(letter) {
        if (Validate.digitsOnly(letter)) {
            return true;
        }

        return letter === ' ' || letter === ',' || letter === '.' || letter === '-' || letter === '+';
    }

    static digitsOnly(letter) {
        return /^[0-9]$/.test(letter);
    }

    static validateHex(str) {
        let index = 0;
        let letter;

        if (str.length === 0) {
            return;
        }

        for (index = 0; index < str.length; index++) {
            letter = str.charAt(index);

            if (Validate.digitsOnly(letter)) {
                continue;
            }

            letter = letter.toUpperCase();
            if (letter === 'A' || letter === 'B' || letter === 'C' || letter === 'D' || letter === 'E' || letter === 'F') {
                continue;
            }

            if (index === 1 && str.charAt(0) === '0' && letter === 'X') { // 0x ..
                continue;
            }

            return false;
        }

        return true;
    }

    static isNulls(s) {
        const l = s.length;
        for (var i = 0; i < l; i++) {
            if (s[i] !== '\0')
                return false;
        }
        return true;
    }
}

class Set {
    static dupChar(c, howMany) {
        let result = '';
        if (howMany <= 0) {
            return result;
        }

        while (result.length < howMany) {
            result = result + c;
        }

        return result;
    }
    static blanks(howMany) {
        return Set.dupChar(' ', howMany);
    }
    static zeros(howMany) {
        return Set.dupChar('0', howMany);
    }
    static nulls(howMany) {
        return Set.dupChar('\0', howMany);
    }

}

