/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { AsnaDataAttrName };

const AsnaDataAttrName = {
    // 'Div' identification
    ROW: 'data-asna-row',
    RECORD: 'data-asna-record',
    WINDOW: 'data-asna-window',

    // Subfile initialization 
    SFLC: 'data-asna-sflc', 

    // Element's click parameters.
    ONCLICK_PUSHKEY: 'data-asna-onclick-pushkey',

    POSITION_CURSOR: 'data-asna-position-cursor',

    // Feeback reporting
    ROWCOL: 'data-asna-rowcol',
    ALIAS: 'data-asna-alias',

    // Dropdown
    VALUES: 'data-asna-values',
    VALUES_TEXT: 'data-asna-values-text',

    // Font/Color manipulation
    STRETCH_ME: 'data-asna-stretch-me',
    REVERSE_IMAGE: 'data-asna-reverse-image',
    UNDERLINE: 'data-asna-underline',

    // Calendar
    CALENDAR_NAMES: 'data-asna-calendar-names',
    CALENDAR_OPTIONS: 'data-asna-calendar-options',

    // Decimal Date (date whose value is a decimal)
    DEC_DATE_OPTIONS: 'data-asna-decdate-options',

    // Menus
    ACTIVEKEY_LOCATION: 'data-asna-activekey-location',

    // Icons
    ICON_ID: 'data-asna-icon-id',
    ICON_INTERNAL_COLOR: 'data-asna-icon-color', // (internal and volatile)
    ICON_INTERNAL_TITLE: 'data-asna-icon-title', // (internal and volatile)

    // Checkboxes
    CHECKBOX_OPTIONS: 'data-asna-checkbox-options',

    // Radio Button group
    RADIO_BUTTON_GROUP_OPTIONS: 'data-asna-radio-group-options',

    // Signature
    SIGNATURE_OPTIONS: 'data-asna-aignature-options',
    SIGNATURE_INTERNAL_NAME: 'data-asna-signature-name', // (internal and volatile)

    // Misc
    AUTO_POSTBACK: 'data-asna-autopostback',
    CHECK_MANDATORY: 'data-asna-check-mandatory',
    LEFT_PAD: 'data-asna-leftpad',
    SUBFILE_MSG_TEXT: 'data-asna-msg-text', // ** Experimental (see Case 20807: Message Subfile Errors have no way to "Reset" the error
    GRID_PANEL_SPAN_STYLE_COL_SPAN: 'data-asna-grid-panel-col-span'
}
