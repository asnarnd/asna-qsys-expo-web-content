/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theLabels as Labels };

const LOCALES = [
    {
        country: 'United States - English',
        code: 'en-US',
        labels: [
            { id: 'ConfirmExitMsg', text: 'There is an active session with the IBMi.' },
            { id: 'ConfirmPasteMsg', text: 'Text to Paste' },
            { id: 'ConfirmPasteDlgWantsEnter', text: 'Wants Enter' },
            { id: 'ConfirmPasteDlgOk', text: 'Ok' },
            { id: 'ConfirmPasteDlgCancel', text: 'Cancel' },
            { id: 'Error0004Text', text: 'Entry of data not allowed in this input/output field.' },
            { id: 'Error0005Text', text: 'Cursor in protected area of display.' },
            { id: 'Error0006Text', text: 'Key pressed following System Request key was not valid.' },
            { id: 'Error0007Text', text: 'Mandatory data entry field. Must have data entered.' },
            { id: 'Error0008Text', text: 'Field requires alphabetic characters.' },
            { id: 'Error0009Text', text: 'Field requires numeric characters.' },
            { id: 'Error0010Text', text: 'Only characters 0 through 9 allowed.' },
            { id: 'Error0011Text', text: 'Key for sign position of field not valid.' },
            { id: 'Error0012Text', text: 'No room to insert data.' },
            { id: 'Error0013Text', text: 'During insert mode, only data keys allowed.' },
            { id: 'Error0014Text', text: 'Mandatory fill field. Must fill to exit.' },
            { id: 'Error0014Recovery', text: 'Use "Esc" key to Reset error. Enter data in entire field or press "Field Exit":Shift+"Enter" key to blank entire field.' },
            { id: 'Error0015Text', text: 'Check digit error.' },
            { id: 'Error0015Recovery', text: 'Use "Esc" key to Reset error. The cursor is at beginning of field. Enter correct number and check digit or press "Field Exit":Shift+"Enter" key to clear field.' },
            { id: 'Error0016Text', text: 'Field Minus key not valid in field.' },
            { id: 'Error0016Recovery', text: 'Use "Esc" key to Reset error  to continue operation at present cursor position. Continue entering data or press "Field Exit":Shift+"Enter" key to leave field.' },
            { id: 'Error0017Text', text: 'This field must be filled before exiting. Key used not valid.' },
            { id: 'Error0017Recovery', text: 'Use "Esc" key to Reset error.  Cursor positioned to continue entering data in field. Enter data to the end of field or position the cursor to beginning of field and "Field Exit":Shift+"Enter" key to blank entire field.' },
            { id: 'Error0019Text', text: 'Duplicate key or Field Mark key not allowed in field.' },
            { id: 'Error0019Recovery', text: 'Use "Esc" key to Reset error and the "Field Exit":Shift+"Enter" key to leave the field.' },
            { id: 'Error0020Text', text: 'Enter key not allowed in field. Exit field first.' },
            { id: 'Error0020Recovery', text: 'Use "Esc" key to Reset error and "Field Exit":Shift+"Enter" key.' },
            { id: 'Error0021Text', text: 'Mandatory enter field must have data entered.' },
            { id: 'Error0021Recovery', text: 'Use "Esc" key to Reset error  and continue entering data in field.' },
            { id: 'Error0026Text', text: '0-9 required for last position of numeric-only field.' },
            { id: 'Error0026Recovery', text: 'Use "Esc" key to Reset error  to continue.' },
            { id: 'Error0060Text', text: 'Double-byte character required as input.' },
            { id: 'Error0060Recovery', text: 'Use "Esc" key to Reset error and Enter double-byte data or move the cursor to an alphanumeric field.' },
            { id: 'Error0061Text', text: 'Field data must be alphanumeric (not DBCS).' },
            { id: 'Error0061Recovery', text: 'Use "Esc" key to Reset eror and enter alphanumeric data or move the cursor to a DBCS field.' },
            { id: 'HexEntryPrompt', text: 'Enter character or four digit HEX code' },
            { id: 'InsertMode', text: 'INSERT' },
            { id: 'KbdLocked', text: 'LOCKED' },
            { id: 'LockedRecoveryText', text: 'Use "Esc" key to Reset error.' },
            { id: 'Error0004Recovery', text: 'Use "Esc" key to Reset error.' },
            { id: 'Error0005Recovery', text: 'Use "Esc" key to Reset error. Move the cursor to a field where the data can be entered and then enter the data.' },
            { id: 'Error0006Recovery', text: 'Use "Esc" key to Reset error. If system request function required, press "Shift" key, "System Request" key, and "Enter" advance key.' },
            { id: 'Error0007Recovery', text: 'Use "Esc" key to Reset error.  Cursor is now at the first character position in the first mandatory enter field that is not filled. Enter the required data in this field.'},
            { id: 'Error0008Recovery', text: 'Use "Esc" key to Reset error.' },
            { id: 'Error0009Recovery', text: 'Use "Esc" key to Reset error.' },
            { id: 'Error0010Recovery', text: 'Use "Esc" key to Reset error.' },
            { id: 'Error0011Recovery', text: 'Use "Esc" key to Reset error and enter valid key for sign position ("Field+":Shift+"+", "Field-":Shift+"-" , using Numeric keypad).' },
            { id: 'Error0012Recovery', text: 'Use "Esc" key to Reset error. Do not use insert mode to change data or enter last character in field.' },
            { id: 'Error0013Recovery', text: 'Use "Esc" key to Reset error.  For insert mode press "Ins" key.' },
            { id: 'KPAD_BTN1', text: 'F1-F12' },
            { id: 'KPAD_BTN2', text: 'F13-F24' },
            { id: 'KPAD_BTN3', text: 'Special' },
            { id: 'KPAD_BTN3_ACTIONS', text: 'NEWLINE,DUP,BEGIN,END,INSERT,DELETE,FIELDMINUS,FIELDPLUS,HELP,ATTN,RESET' },
            { id: 'KPAD_USR4', text: 'HELP' },
            { id: 'KPAD_USR5', text: 'CLEAR' },
            { id: 'KPAD_USR6', text: 'ERASE' },
            { id: 'KPAD_USR7', text: 'ATTN' },
            { id: 'KPAD_USR8', text: 'FIELDEXIT' },
            { id: 'KPAD_USR4_MOBILE', text: 'RECORD' },
            { id: 'KPAD_USR5_MOBILE', text: 'LEFT' },
            { id: 'KPAD_USR6_MOBILE', text: 'RIGHT' },
            { id: 'KPAD_USR7_MOBILE', text: 'END' },
            { id: 'KPAD_USR8_MOBILE', text: 'FIELDEXIT' },
            { id: 'KPAD_PGUP', text: 'PgUp' },
            { id: 'KPAD_PGDN', text: 'PgDn' },
            { id: 'KPAD_ENTER', text: 'Enter' },
            { id: 'KPAD_NEWLINE', text: 'New Line' },
            { id: 'KPAD_HELP', text: 'Help' },
            { id: 'KPAD_INSERT', text: 'Ins' },
            { id: 'KPAD_DELETE', text: 'Del' },
            { id: 'KPAD_ERASE', text: 'Erase' },
            { id: 'KPAD_DUP', text: 'Dup' },
            { id: 'KPAD_FIELDMINUS', text: 'Fld Minus' },
            { id: 'KPAD_FIELDPLUS', text: 'Fld Plus' },
            { id: 'KPAD_FIELDEXIT', text: 'Fld Exit' },
            { id: 'KPAD_FIELDEXITENTER', text: 'Fld Exit Enter' },
            { id: 'KPAD_RECORD', text: 'Home' },
            { id: 'KPAD_END', text: 'End' },
            { id: 'KPAD_LAST', text: 'Last' },
            { id: 'KPAD_COPY', text: 'Copy' },
            { id: 'KPAD_CUT', text: 'Cut' },
            { id: 'KPAD_PASTE', text: 'Paste' },
            { id: 'KPAD_CLEAR', text: 'Clr' },
            { id: 'KPAD_RESET', text: 'Reset' },
            { id: 'KPAD_BEGIN', text: 'Begin' },
            { id: 'KPAD_ATTN', text: 'Attn' },
            { id: 'KPAD_SYSREQ', text: 'Sys Req' },
            { id: 'KPAD_HEX', text: 'Hex' },
            { id: 'KPAD_PRINT', text: 'Prt' },
            { id: 'PREF_LFKHS', text: 'FKey Hotspots:' },
            { id: 'PREF_LFUBTNS', text: 'Reset Button:' },
            { id: 'PREF_LFUBTNS_MOBILE', text: 'Enter/Reset Buttons:' },
            { id: 'PREF_LKIBMSHOW', text: 'IBM Keypad:' },
            { id: 'COLOR_Attr', text: 'Attribute' },
            { id: 'COLOR_Color', text: 'Color' },
            { id: 'COLOR_BgColor', text: 'Background-color' },
            { id: 'COLOR_LGREEN', text: 'Green' },
            { id: 'COLOR_LBLUE', text: 'Blue' },
            { id: 'COLOR_LRED', text: 'Red' },
            { id: 'COLOR_LWHITE', text: 'White' },
            { id: 'COLOR_LTURQUOISE', text: 'Turquoise' },
            { id: 'COLOR_LYELLOW', text: 'Yellow' },
            { id: 'COLOR_LPINK', text: 'Pink' },
            { id: 'COLOR_Other', text: 'Other elements' },
            { id: 'COLOR_LCURSOR', text: 'Cursor:' },
            { id: 'COLOR_LSEL', text: 'Text selection:' },
            { id: 'ColorApply', text: 'Apply' },
            { id: 'ColorDefaults', text: 'Restore Defaults' },
            { id: 'AJAX_WAIT_TOO_LONG', text: 'Terminal waiting too long for response from Server.' },
            { id: 'AJAX_ASK_CONTINUE', text: 'Do you want to continue waiting?' },
            { id: 'SETTINGS_BTN_COLOR', text: 'Colors' }
            ]
    },
    {
        country: 'Spain - Spanish',
        code: 'es-ES',
        labels: [
            { id: 'ConfirmExitMsg', text: 'Existe una sesión activa con IBMi.' },
            { id: 'ConfirmPasteMsg', text: 'Texto a Pegar' },
            { id: 'ConfirmPasteDlgWantsEnter', text: 'Conservar Intro' },
            { id: 'ConfirmPasteDlgOk', text: 'Vale' },
            { id: 'ConfirmPasteDlgCancel', text: 'Cancela' },
            { id: 'Error0004Text', text: 'No se permite introducir datos en este campo de entrada/salida.' },
            { id: 'Error0005Text', text: 'El cursor está en un área protegida de la patalla.' },
            { id: 'Error0006Text', text: 'Tecla presionada despues de un System Request no permitida.' },
            { id: 'Error0007Text', text: 'Campo de entrada obligado. Deberán introducirse datos.' },
            { id: 'Error0008Text', text: 'Campo requiere letras alfabéticas.' },
            { id: 'Error0009Text', text: 'Campo requiere números.' },
            { id: 'Error0010Text', text: 'Solo se permiten digitos del 0 al 9.' },
            { id: 'Error0011Text', text: 'Signo numérico en posición del campo no es válido.' },
            { id: 'Error0012Text', text: 'No hay espacio para insertar datos.' },
            { id: 'Error0013Text', text: 'En modo de inserción, sólo teclas de datos son permisibles.' },
            { id: 'Error0014Text', text: 'Llenado obligado de campo. Deberó llenar para salir.' },
            { id: 'Error0014Recovery', text: 'Use tecla "Escape" para re-iniciar error. Complete llenado del campo ó presione "Salir de campo": combinación Shift+"Intro" para blanquear campo.' },
            { id: 'Error0015Text', text: 'Dígito de verificación erróneo.' },
            { id: 'Error0015Recovery', text: 'Use tecla "Escape" para re-iniciar error. El cursor está al inicio del campo. Meta el número correcto y verifique dígito  o presione "Salir de campo": combinación Shift+"Intro" para blanquear campo.' },
            { id: 'Error0016Text', text: 'Tecla campo negativo no valildo para este campo.' },
            { id: 'Error0016Recovery', text: 'Use tecla "Escape" para re-iniciar error y continuar operación en la posición presente del cursor. Continúe metiendo datos or presione "Salir de campo": combinación Shift+"Intro" para abandonar campo.' },
            { id: 'Error0017Text', text: 'Este campo deberá ser llenado antes de salir. Tecla usada no es válida.' },
            { id: 'Error0017Recovery', text: 'Use tecla "Escape" para re-iniciar error.  El cursor esta posicionado listo para meter datos al campo. Meta datos hasta el final del campo ó posicione el cursor al inicio del campo y "Salir de campo": combinación Shift+"Intro" to para blanquear completamente campo.' },
            { id: 'Error0019Text', text: 'Tecla duplicidad o Tecla para marcar no permitidas para ese campo.' },
            { id: 'Error0019Recovery', text: 'Use tecla "Escape" para re-iniciar error y presione "Salir de campo": combinación Shift+"Intro" para abandonar el campo.' },
            { id: 'Error0020Text', text: 'Tecla Intro no permitida en campo. Salga del campo primero.' },
            { id: 'Error0020Recovery', text: 'Use tecla "Escape" to re-iniciar error y presione "Salir de campo": combinación Shift+"Intro".' },
            { id: 'Error0021Text', text: 'Captura obligada deberá tener letras.' },
            { id: 'Error0021Recovery', text: 'Use tecla "Escape" to re-iniciar error y continúe llenando el campo.' },
            { id: 'Error0026Text', text: 'Digit 0-9 requerido en la ultima posición para campo numérico exclusivo.' },
            { id: 'Error0026Recovery', text: 'Use tecla "Escape" para re-iniciar error para continuar.' },
            { id: 'Error0060Text', text: 'Letra de doble-byte es requerida como entrada al campo.' },
            { id: 'Error0060Recovery', text: 'Use tecla "Escape" para re-iniciar error e introduzca letras de doble-byte o mueva el cursor hacia un campo alfanumérico.' },
            { id: 'Error0061Text', text: 'Datos del campo deben ser Field alfanumérico (no DBCS).' },
            { id: 'Error0061Recovery', text: 'Use tecla "Escape" para re-iniciar error e introduzca letras alfanumérico or mueva el cursor hacia un campo DBCS.' },
            { id: 'HexEntryPrompt', text: 'Introduzca letras or código hexadecimal del cuatro dígitos' },
            { id: 'InsertMode', text: 'INSERTAR' },
            { id: 'KbdLocked', text: 'BLOQUEO' },
            { id: 'LockedRecoveryText', text: 'Use tecla "Escape" para re-iniciar error ' },
            { id: 'Error0004Recovery', text: 'Use tecla "Escape" para re-iniciar error.' },
            { id: 'Error0005Recovery', text: 'Use tecla "Escape" para re-iniciar error. Move the cursor to a field where the data can be entered and then enter the data.' },
            { id: 'Error0006Recovery', text: 'Use tecla "Escape" para re-iniciar error. If system request function required, press "Shift" key, "System Request" key, and "Enter" advance key.' },
            { id: 'Error0007Recovery', text: 'Use tecla "Escape" para re-iniciar error.  Cursor is now at the first character position in the first mandatory enter field that is not filled. Enter the required data in this field.' },
            { id: 'Error0008Recovery', text: 'Use tecla "Escape" para re-iniciar error.' },
            { id: 'Error0009Recovery', text: 'Use tecla "Escape" para re-iniciar error.' },
            { id: 'Error0010Recovery', text: 'Use tecla "Escape" para re-iniciar error.' },
            { id: 'Error0011Recovery', text: 'Use tecla "Escape" para re-iniciar error y meta código válido para la posición del signo ("Field+":Shift+"+", "Field-":Shift+"-" , usando teclado numérico).' },
            { id: 'Error0012Recovery', text: 'Use tecla "Escape" para re-iniciar error. No use modo de inserción para cambiar datos o meta la última letra en este campo.' },
            { id: 'Error0013Recovery', text: 'Use tecla "Escape" para re-iniciar error. Para modo de inserción tecleé tecla "Ins".' },
            { id: 'PREF_LFKHS', text: 'TFun Inv.:' },
            { id: 'PREF_LFUBTNS', text: 'Botón Resetear:' },
            { id: 'PREF_LFUBTNS_MOBILE', text: 'Botón Intro/Resetear:' },
            { id: 'PREF_LKIBMSHOW', text: 'Teclas de IBM:' },
            { id: 'COLOR_Attr', text: 'Atributo' },
            { id: 'COLOR_Color', text: 'Color' },
            { id: 'COLOR_BgColor', text: 'Color fondo' },
            { id: 'COLOR_LGREEN', text: 'Verde' },
            { id: 'COLOR_LBLUE', text: 'Azul' },
            { id: 'COLOR_LRED', text: 'Rojo' },
            { id: 'COLOR_LWHITE', text: 'Blanco' },
            { id: 'COLOR_LTURQUOISE', text: 'Turqueza' },
            { id: 'COLOR_LYELLOW', text: 'Amarillo' },
            { id: 'COLOR_LPINK', text: 'Rosa' },
            { id: 'COLOR_Other', text: 'Otros elementos' },
            { id: 'COLOR_LCURSOR', text: 'Cursor:' },
            { id: 'COLOR_LSEL', text: 'Selección texto:' },
            { id: 'ColorApply', text: 'Applicar' },
            { id: 'ColorDefaults', text: 'Restaurar Pred.' },
            { id: 'AJAX_WAIT_TOO_LONG', text: 'Ha transcurrido mucho tiempo sin respuesta del servidor.' },
            { id: 'AJAX_ASK_CONTINUE', text: 'Desea continuar esperando?' },
            { id: 'SETTINGS_BTN_COLOR', text: 'Colores' }
        ]
    }
    //{ country: 'France - French', code: 'fr-FR', labels: [] },
    //{ country: 'United Kingdom - English', code: 'en-GB', labels: [] },
    //{ country: 'Austria - German', code: 'de-AT', labels: [] },
    // etc.
];

class Labels {
    constructor() {
        this.resText = [];
        this.loadLabels(Labels.getFirstBrowserLanguage()); 
        // this.loadLabels('es-ES');
    }

    loadLabels(localeCode) {
        const defaultLabels = LOCALES[0].labels; // United States - English (en-US).
        let labels = null;
        for (let i = 0, l = LOCALES.length; i <l; i++) {
            if (LOCALES[i].code === localeCode) {
                labels = LOCALES[i].labels;
                break;
            }
        }

        if (!labels) {
            for (let i = 0, l = LOCALES.length; i < l; i++) {
                if (LOCALES[i].code.substring(0, 3) === localeCodecode.substring(0, 3)) { // i.e. partial match 'en-'
                    labels = LOCALES[i].labels;
                    break;
                }
            }
        }

        if (!labels) {
            labels = defaultLabels;
        }

        for (let i = 0, l = labels.length; i < l; i++) {
            if (labels[i].id && labels[i].text) {
                this.resText[labels[i].id] = labels[i].text;
            }
        }

        // Note: when localizing labels, if is not required to localize ALL (some may remain in English)
        for (let i = 0, l = defaultLabels.length; i < l; i++) {
            const key = defaultLabels[i].id;
            if (!this.resText[key]) {
                this.resText[key] = defaultLabels[i].text;
            }
        }
    }

    get(id) {
        return this.resText[id];
    }

    static getFirstBrowserLanguage() {
        const nav = window.navigator;
        const browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'];
        let i, len, language, shortLanguage = null;

        // support for HTML 5.1 "navigator.languages"
        if (Array.isArray(nav.languages)) {
            for (i = 0; i < nav.languages.length; i++) {
                language = nav.languages[i];
                len = language.length;
                if (!shortLanguage && len) {
                    shortLanguage = language;
                }
                if (language && len > 2) {
                    return language;
                }
            }
        }

        // support for other well known properties in browsers
        for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
            language = nav[browserLanguagePropertyKeys[i]];
            len = language.length;
            if (!shortLanguage && len) {
                shortLanguage = language;
            }
            if (language && len > 2) {
                return language;
            }
        }

        return shortLanguage;
    }
}

const theLabels = new Labels();
