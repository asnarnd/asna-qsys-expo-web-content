/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theTerminalMacros as TerminalMacros };

/*eslint-disable*/
import { QSN } from './ibm-codes.js';
import { KEY_ACTION } from './terminal-keyboard.js';
/*eslint-enable*/

class TerminalMacros {
    loadDefault( action ) {
        const map = [];

        map[KEY_ACTION.ATTN] = { f: action.submitAttention, k: 'Ctrl + F5' };
        map[KEY_ACTION.BEGIN] = { f: function () { action.begin(true); }, k: 'Ctrl + F9' };
        map['BTERMHELP'] = { f: action.bTermHelp, k: '' };
        map[KEY_ACTION.CLEAR] = { f: function () { action.submitAction(QSN.CLEAR); }, k: 'Scroll Lock' };
        map[KEY_ACTION.COPY] = { f: action.copyText, k: 'Ctrl + C' };
        map['CURSOR'] = null; // Swap between normal cursor and cross-hair cursor
        map[KEY_ACTION.CUT] = { f: action.cutText, k: 'Ctrl + X' };
        map[KEY_ACTION.DELETE] = { f: action.delete, k: 'Del' }; // Delete character at cursor position
        map[KEY_ACTION.DOWN] = { f: function () { action.moveCursor('DOWN'); }, k: '' };
        map[KEY_ACTION.DUP] = { f: action.dup, k: 'Ctrl + F6' }; // Mark field (to be duplicated by program logic)
        map[KEY_ACTION.END] = { f: action.end, k: 'Ctrl + F11' };
        map[KEY_ACTION.ENTER] = { f: function () { action.submitAction(QSN.ENTER); }, k: '' };
        map[KEY_ACTION.ERASE] = { f: action.erase, k: '' }; // Erase all input
        map[KEY_ACTION.F +'1'] = { f: function () { action.submitAction(QSN.F1); }, k: '*' };
        map[KEY_ACTION.F +'2'] = { f: function () { action.submitAction(QSN.F2); }, k: '*' };
        map[KEY_ACTION.F +'3'] = { f: function () { action.submitAction(QSN.F3); }, k: '*' };
        map[KEY_ACTION.F +'4'] = { f: function () { action.submitAction(QSN.F4); }, k: '*' };
        map[KEY_ACTION.F +'5'] = { f: function () { action.submitAction(QSN.F5); }, k: '*' };
        map[KEY_ACTION.F +'6'] = { f: function () { action.submitAction(QSN.F6); }, k: '*' };
        map[KEY_ACTION.F +'7'] = { f: function () { action.submitAction(QSN.F7); }, k: '*' };
        map[KEY_ACTION.F +'8'] = { f: function () { action.submitAction(QSN.F8); }, k: '*' };
        map[KEY_ACTION.F +'9'] = { f: function () { action.submitAction(QSN.F9); }, k: '*' };
        map[KEY_ACTION.F +'10'] = { f: function () { action.submitAction(QSN.F10); }, k: '*' };
        map[KEY_ACTION.F +'11'] = { f: function () { action.submitAction(QSN.F11); }, k: '*' };
        map[KEY_ACTION.F +'12'] = { f: function () { action.submitAction(QSN.F12); }, k: '*' };
        map[KEY_ACTION.F +'13'] = { f: function () { action.submitAction(QSN.F13); }, k: 'Shift + F1' };
        map[KEY_ACTION.F +'14'] = { f: function () { action.submitAction(QSN.F14); }, k: 'Shift + F2' };
        map[KEY_ACTION.F +'15'] = { f: function () { action.submitAction(QSN.F15); }, k: 'Shift + F3' };
        map[KEY_ACTION.F +'16'] = { f: function () { action.submitAction(QSN.F16); }, k: 'Shift + F4' };
        map[KEY_ACTION.F +'17'] = { f: function () { action.submitAction(QSN.F17); }, k: 'Shift + F5' };
        map[KEY_ACTION.F +'18'] = { f: function () { action.submitAction(QSN.F18); }, k: 'Shift + F6' };
        map[KEY_ACTION.F +'19'] = { f: function () { action.submitAction(QSN.F19); }, k: 'Shift + F7' };
        map[KEY_ACTION.F +'20'] = { f: function () { action.submitAction(QSN.F20); }, k: 'Shift + F8' };
        map[KEY_ACTION.F +'21'] = { f: function () { action.submitAction(QSN.F21); }, k: 'Shift + F9' };
        map[KEY_ACTION.F +'22'] = { f: function () { action.submitAction(QSN.F22); }, k: 'Shift + F10' };
        map[KEY_ACTION.F +'23'] = { f: function () { action.submitAction(QSN.F23); }, k: 'Shift + F11' };
        map[KEY_ACTION.F +'24'] = { f: function () { action.submitAction(QSN.F24); }, k: 'Shift + F12' };
        map[KEY_ACTION.FASTDOWN] = { f: function () { action.moveCursor('DOWN'); action.moveCursor('DOWN'); action.moveCursor('DOWN'); }, k: '' };
        map[KEY_ACTION.FASTLEFT] = { f: function () { action.moveCursor('LEFT'); action.moveCursor('LEFT'); action.moveCursor('LEFT'); }, k: '' };
        map[KEY_ACTION.FASTRIGHT] = { f: function () { action.moveCursor('RIGHT'); action.moveCursor('RIGHT'); action.moveCursor('RIGHT'); }, k: '' };
        map[KEY_ACTION.FASTUP] = { f: function () { action.moveCursor('UP'); action.moveCursor('UP'); action.moveCursor('UP'); }, k: '' };
        map[KEY_ACTION.FIELDMINUS] = { f: function () { action.field('-'); }, k: 'Shift + "-" (Numeric Keypad)' };
        map[KEY_ACTION.FIELDPLUS] = { f: function () { action.field('+'); }, k: 'Shift + "+" (Numeric Keypad)' };
        map[KEY_ACTION.FIELDEXIT] = { f: action.fieldExit, k: 'Shift + Enter (Numeric Keypad)' };
        map[KEY_ACTION.FIELDEXITENTER] = { f: action.fieldExitEnter, k: '' };
        map['HELP'] = { f: action.submitHelp, k: '' };
        map[KEY_ACTION.HEX] = { f: action.hexInput, k: '' };
        map[KEY_ACTION.INSERT] = { f: action.insert, k: 'Ins' };
        map[KEY_ACTION.LAST] = { f: action.last, k: 'End' };
        map[KEY_ACTION.LEFT] = { f: function () { action.moveCursor('LEFT'); }, k: '' };
        map[KEY_ACTION.LEFTDELETE] = { f: action.leftDelete, k: 'Backspace' };
        map[KEY_ACTION.NEWLINE] = { f: action.newLine, k: 'Ctrl + Enter' };
        map[KEY_ACTION.NEXT] = { f: function () { action.moveToFieldRelative('NEXT'); }, k: 'Tab' };
        map[KEY_ACTION.PASTE] = { f: function () { action.pasteText(); }, k: 'Ctrl + V' };
        map[KEY_ACTION.NONBREAKINGPASTE] = { f: function () { action.pasteText('nb'); }, k: 'Shift + Ctrl + V' };
        map[KEY_ACTION.PGDN] = { f: function () { action.submitAction(QSN.PAGEDOWN); }, k: 'Page Down' };
        map[KEY_ACTION.PGUP] = { f: function () { action.submitAction(QSN.PAGEUP); }, k: 'Page Up' };
        map[KEY_ACTION.PREVIOUS] = { f: function () { action.moveToFieldRelative('PREV'); }, k: 'Shift Tab' };
        map[KEY_ACTION.PRINT] = { f: function () { action.submitAction(QSN.PRINT); }, k: '' };
        map[KEY_ACTION.RECORD] = { f: action.recordHome, k: 'Home' };
        map[KEY_ACTION.REDIRECT] = { f: action.redirect, k: '' };
        map[KEY_ACTION.RESET] = { f: action.reset, k: 'Esc' };
        map[KEY_ACTION.RIGHT] = { f: function () { action.moveCursor('RIGHT'); }, k: '' };
        map['SYSREQ'] = null; // System Request
        map[KEY_ACTION.UP] = { f: function () { action.moveCursor('UP'); }, k: '' };
        map[KEY_ACTION.ERASETOEOFLD] = { f: action.eraseToEndOfField, k: '' };

        return map;
    }
}

const theTerminalMacros = new TerminalMacros();