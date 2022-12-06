/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theIbmDate as IbmDate };

const STRING_EMPTY = '';
const ONE_BLANK = ' ';

class IbmDate {

    textToDate(fmtToUse, dateTxt) {
        let fmtLength;
        let numDigits = 4;
        let iDay;

        if (fmtToUse.length !== dateTxt.length) {
            fmtLength = this.getFormatLength(fmtToUse);
            if ((iDay = fmtToUse.indexOf('DDD')) >= 0) {
                let iSep = this.findFirstNonDigit(dateTxt);
                let yy = iSep >= 0 ? parseInt(dateTxt.substr(0, iSep), 10) : 40; // LoVal IBM JUL: 40/001
                let ddd = iSep >= 0 && dateTxt.length > iSep + 1 ? parseInt(dateTxt.substr(iSep + 1), 10) : 1;
                let sYY = yy > 0 && yy <= 40 ? this.padLeft(yy + STRING_EMPTY, 2, '0') : '39';
                let sDDD = ddd > 0 && ddd <= 365 ? this.padLeft(ddd + STRING_EMPTY, 3, '0') : '001';
                dateTxt = sYY + fmtToUse.substr(iDay - 1, 1) + sDDD;
            }
            else {
                dateTxt = this.padLeft(dateTxt, fmtLength, '0');
            }
        }

        let iYear = fmtToUse.indexOf('YYYY');

        if (iYear < 0) {
            iYear = fmtToUse.indexOf('YYY');
            numDigits = 3;
        }

        if (iYear < 0) {
            iYear = fmtToUse.indexOf('YY');
            numDigits = 2;
        }

        let year = 0;
        if (iYear >= 0) {
            year = this.getNumberFromFormat(dateTxt, iYear, numDigits);
            year = this.getFullYear(year);
        }
        else {
            return new Date();
        }

        let iMonth = fmtToUse.indexOf('MM');
        let month = 0;

        if (iMonth >= 0) {
            month = this.getNumberFromFormat(dateTxt, iMonth, 2) - 1;
        }
        else {
            if ((iDay = fmtToUse.indexOf('DDD')) >= 0) {
                var daysSinceJanOne = this.getNumberFromFormat(dateTxt, iDay, 3);

                var janThatYear = new Date(year, 0);
                return new Date(janThatYear.getFullYear(), janThatYear.getMonth(), parseInt(daysSinceJanOne, 10));
            }

            return new Date();
        }

        iDay = fmtToUse.indexOf('DD');
        let day = 0;

        if (iDay >= 0) {
            day = this.getNumberFromFormat(dateTxt, iDay, 2);
        }
        else {
            return new Date();
        }

        if (isNaN(month) || isNaN(day) || isNaN(year) ||
            month > 11 ||
            day > this.numOfDaysInMonth(month, year) ||
            year <= 0 ||
            month < 0 ||
            day <= 0) {
            return new Date();
        }

        return this.createDate(day, month, year);
    }

    dateToText(d, fmt) {
        let result = '';
        let numDigits = 0;

        let iYear = fmt.indexOf('YYYY');
        numDigits = 4;
        if (iYear < 0) {
            iYear = fmt.indexOf('YYY');
            numDigits = 3;
        }
        if (iYear < 0) {
            iYear = fmt.indexOf('YY');
            numDigits = 2;
        }
        if (iYear >= 0)
            result =this.replaceFmtNum(fmt, d.getFullYear().toString(), iYear, numDigits);

        const iMonth = result.indexOf('MM');
        let iDay;
        if (iMonth >= 0) {
            var monthString = (d.getMonth() + 1).toString();
            if (monthString.length === 1)
                monthString = '0' + monthString;
            result = this.replaceFmtNum(result, monthString, iMonth, 2);
        }
        else {
            if ((iDay = result.indexOf('DDD')) >= 0) {
                var start = new Date(d.getFullYear(), 0, 0);
                var diff = d - start;
                var oneDay = 1000 * 60 * 60 * 24;
                var dayOfYear = Math.floor((diff / oneDay) + 0.1) + '';

                while (dayOfYear.length < 3) {
                    dayOfYear = '0' + dayOfYear;
                }

                return this.replaceFmtNum(result, dayOfYear + '', iDay, 3);
            }
        }

        iDay = result.indexOf('DD');
        if (iDay >= 0) {
            var dayString = d.getDate().toString();
            if (dayString.length === 1)
                dayString = '0' + dayString;
            result = this.replaceFmtNum(result, dayString, iDay, 2);
        }

        return result;
    }

    replaceFmtNum(fmtString, numString, startingAt, numDigits) {
        var result = fmtString;
        var zeroes;
        switch (numString.length - numDigits) {
            case -1:
                zeroes = '0';
                break;
            case -2:
                zeroes = '00';
                break;
            case -3:
                zeroes = '000';
                break;
            case -4:
                zeroes = '0000';
                break;
            default:
                zeroes = '';
                break;
        }
        numString = zeroes + numString.substr(numString.length - numDigits, numString.length);
        return result.substr(0, startingAt) + numString + result.substr(startingAt + numDigits, result.length);
    }

    getFormatLength(fmtToUse) {
        let iYear;
        let numDigits = 4;

        if (!fmtToUse) {
            return 0;
        }

        iYear = fmtToUse.indexOf('YYYY');
        if (iYear < 0) {
            iYear = fmtToUse.indexOf('YYY');
            numDigits = 3;
        }
        if (iYear < 0) {
            iYear = fmtToUse.indexOf('YY');
            numDigits = 2;
        }

        return numDigits + 4; // 'MM'.length + 'DD'.length
    }

    getNumberFromFormat(dateTxt, i, numDigits) {
        let result = STRING_EMPTY;
        if (dateTxt.length >= i + numDigits)
            result = dateTxt.substr(i, numDigits);
        return result;
    }

    padLeft(str, targetLength, padChar) {
        if (!str)
            return STRING_EMPTY;
        return this.getString(padChar, targetLength - str.length) + str;
    }

    getString(padChar, length) {
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

    findFirstNonDigit(txt) {
        for (var i = 0, l = txt.length; i < l; i++) {
            if (isNaN(parseInt(txt.substr(i, 1), 10))) {
                return i;
            }
        }
        return -1;
    }

    numOfDaysInMonth(theMonth, theYear) {
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        if (isNaN(theMonth) || isNaN(theYear) || theMonth < 0 || 11 < theMonth || theYear < 0)
            return 0;

        /*eslint-disable*/
        if (theMonth === 1 && (theYear % 4) === 0 && ((theYear % 100) != 0 || (theYear % 400) == 0)) {
            return daysInMonth[theMonth] + 1;
        }
        /*eslint-enable*/

        return daysInMonth[theMonth];
    }

    getFullYear(yrString) {
        let year = parseInt(yrString, 10);
        let result = 0;
        let padZero = STRING_EMPTY;

        if (isNaN(year) || yrString.length > 4) {
            return 1;
        }

        if (Math.floor(year / 1000) > 0 || yrString.length === 4) { // 4 digits
            result = year;
        }
        else if (Math.floor(year / 100) >= 1 || yrString.length === 3) { //3 digits
            let centuries = Math.floor(year / 100);
            year = year % 100;

            if ((year + '').length === 1) {
                padZero = '0';
            }

            result = (19 + centuries) + padZero + (year % 100) + '';
        }
        else if (Math.floor(year / 10) >= 1 || yrString.length === 2) {
            if (year < 10) {
                result = '200' + year;
            }
            else if (year < 40) {
                result = '20' + year;
            }
            else {
                result = '19' + year;
            }
        }

        return result;
    }

    createDate(day, month, year) {
        try {
            const result = new Date(0, 0, 1);
            result.setDate(day);
            result.setFullYear(year);
            result.setMonth(month);
            return result;
        }
        catch (ex) {
            return new Date();
        }
    }

}

const theIbmDate = new IbmDate();