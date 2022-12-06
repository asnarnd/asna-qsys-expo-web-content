/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { AidKey, QSN_SA, QSN };

// IBM Screen Attribute Characters
// http://publib.boulder.ibm.com/infocenter/iseries/v6r1m0/index.jsp?topic=/apis/dsm1f.htm
const QSN_SA = {
    GRN: 0x20,          // Green 
    GRN_RI: 0x21,       // Green/Reverse Image 
    WHT: 0x22,          // White 
    WHT_RI: 0x23,       // White/Reverse Image 
    GRN_UL: 0x24,       // Green/Underscore 
    GRN_UL_RI: 0x25,    // Green/Underscore/Reverse Image 
    WHT_UL: 0x26,       // White/Underscore 
    ND: 0x27,           // Nondisplay
    RED: 0x28,          // Red 
    RED_RI: 0x29,       // Red/Reverse Image 
    RED_BL: 0x2A,       // Red/Blink 
    RED_RI_BL: 0x2B,    // Red/Reverse Image/Blink 
    RED_UL: 0x2C,       // Red/Underscore 
    RED_UL_RI: 0x2d,    // Red/Underscore/Reverse Image    
    RED_UL_BL: 0x2E,    // Red/Underscore/Blink 
    ND_2F: 0x2F,        // Nondisplay 
    TRQ_CS: 0x30,       // Turquoise/Column Separators 
    TRQ_CS_RI: 0x31,    // Turquoise/Column Separators/Reverse Image 
    YLW_CS: 0x32,       // Yellow/Column Separators 
    YLW_CS_RI: 0x33,    // Yellow/Column Separators/Reverse Image 
    TRQ_UL: 0x34,       // Turquoise/Underscore 
    TRQ_UL_RI: 0x35,    // Turquoise/Underscore/Reverse Image 
    YLW_UL: 0x36,       // Yellow/Underscore 
    ND_37: 0x37,        // Nondisplay 
    PNK: 0x38,          // Pink 
    PNK_RI: 0x39,       // Pink/Reverse Image 
    BLU: 0x3A,          // Blue 
    BLU_RI: 0x3B,       // Blue/Reverse Image 
    PNK_UL: 0x3C,       // Pink/Underscore 
    PNK_UL_RI: 0x3D,    // Pink/Underscore/Reverse Image 
    BLU_UL: 0x3E,       // Blue/Underscore
    ND_3F: 0x3F         // Nondisplay
};

// IBM Aid Keys
// http://publib.boulder.ibm.com/infocenter/iseries/v6r1m0/index.jsp?topic=/apis/dsm1f.htm
const QSN = {
    F1: 0x31,
    F2: 0x32,
    F3: 0x33,
    F4: 0x34,
    F5: 0x35,
    F6: 0x36,
    F7: 0x37,
    F8: 0x38,
    F9: 0x39,
    F10: 0x3a,
    F11: 0x3b,
    F12: 0x3c,
    SLP: 0x3f, // Selector Light Pen Auto Enter
    FET: 0x50, // Forward Edge Trigger Auto Enter
    PA1: 0x6c,
    PA2: 0x6e,
    PA3: 0x6b,
    F13: 0xb1,
    F14: 0xb2,
    F15: 0xb3,
    F16: 0xb4,
    F17: 0xb5,
    F18: 0xb6,
    F19: 0xb7,
    F20: 0xb8,
    F21: 0xb9,
    F22: 0xba,
    F23: 0xbb,
    F24: 0xbc,
    CLEAR: 0xbd,
    ENTER: 0xf1,
    HELP: 0xf3,
    PAGEUP: 0xf4,
    PAGEDOWN: 0xf5,
    PRINT: 0xf6,
    RECBS: 0xf8
};

class AidKey {
    static ToString(qsn) {
        switch (qsn) {
            case QSN.F1: return 'F1';
            case QSN.F2: return 'F2';
            case QSN.F3: return 'F3';
            case QSN.F4: return 'F4';
            case QSN.F5: return 'F5';
            case QSN.F6: return 'F6';
            case QSN.F7: return 'F7';
            case QSN.F8: return 'F8';
            case QSN.F9: return 'F9';
            case QSN.F10: return 'F10';
            case QSN.F11: return 'F11';
            case QSN.F12: return 'F12';
            case QSN.SLP: return 'SLP';
            case QSN.FET: return 'FET';
            case QSN.PA1: return 'PA1';
            case QSN.PA2: return 'PA2';
            case QSN.PA3: return 'PA3';
            case QSN.F13: return 'F13';
            case QSN.F14: return 'F14';
            case QSN.F15: return 'F15';
            case QSN.F16: return 'F16';
            case QSN.F17: return 'F17';
            case QSN.F18: return 'F18';
            case QSN.F19: return 'F19';
            case QSN.F20: return 'F20';
            case QSN.F21: return 'F21';
            case QSN.F22: return 'F22';
            case QSN.F23: return 'F23';
            case QSN.F24: return 'F24';
            case QSN.CLEAR: return 'Clear';
            case QSN.ENTER: return 'Enter';
            case QSN.HELP: return 'Help';
            case QSN.PAGEUP: return 'PgUp';
            case QSN.PAGEDOWN: return 'PgDn';
            case QSN.PRINT: return 'Print';
            case QSN.RECBS: return 'RecBs';
        }

        return '';
    }
}