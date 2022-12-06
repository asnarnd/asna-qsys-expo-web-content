/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theColorSettings as ColorSettings };

/*eslint-disable*/
import { DialogPolyfill } from './terminal-dialog-polyfill.js';
import { ID, TerminalDOM } from './terminal-dom.js';
import { StateChangeActionType, JsonUtil } from './terminal-redux.js';
import { MouseEvents } from './terminal-device-pointers.js';
import { Labels } from './terminal-labels.js';
/*eslint-enable*/

const COLOR = {
    WHITE : '#FFFFFF',
    BLACK: '#000000'
};

const STYLE = {
    COLOR_SELECTION: "AsnaTermCOLOR_SELECTION",
    COLOR_ATTR:"AsnaTermCOLOR_ATTR",
    COLOR_ATTR_LIST:"AsnaTermCOLOR_ATTR_LIST",
    // COLOR_SUBTITLE:"AsnaTermCOLOR_Subtitle",
    COLOR_LABEL:"AsnaTermCOLOR_Label",
    COLOR_SAMPLE:"AsnaTermCOLOR_SAMPLE",
    COLOR_SAMPLE_LIST:"AsnaTermCOLOR_SAMPLE_LIST",
    COLOR_SAMPLE_2: "AsnaTermColorSample",
    COLOR_PRE_TEXT: "AsnaTermColorPreText",
    COLOR_INPUT_HEX: "AsnaTermCOLOR_INPUT_HEX",
    COLOR_BKCOLOR: "AsnaTermCOLOR_BKCOLOR",
    COLOR_BKCOLOR_LIST: "AsnaTermCOLOR_BKCOLOR_LIST",
    COLOR_OTHER: "AsnaTermCOLOR_OTHER",
    COLOR_OTHER_LIST: "AsnaTermCOLOR_OTHER_LIST",
    COLOR_COLOR:"AsnaTermCOLOR_COLOR",
    COLOR_COLOR_LIST:"AsnaTermCOLOR_COLOR_LIST",
    COLOR_WHEEL:"AsnaTermColorWheel",
    WHITE_HEX: "AsnaTermWhiteHex",
    GRAY_WHEEL: "AsnaTermGrayWheel",
    BLACK_HEX: "AsnaTermBlackHex",
    COLOR_LUMINANCE: "AsnaTermColorLuminance",
    COLOR_LUM_SLIDER: "AsnaTermColorLumSlider",
    COLOR_APPLY:"AsnaTermColorApply",
    COLOR_DEFAULTS: "AsnaTermColorDefaults"
};

class ColorSettings {
    constructor() {
        this.buttonClickEventHandler = this.buttonClickEventHandler.bind(this);
    }

    init(button, store) {
        this.store = store;
        button.addEventListener('click', this.buttonClickEventHandler, false);
        button.value = Labels.get('SETTINGS_BTN_COLOR');
    }

    buttonClickEventHandler(event) {
        theColorSettingsUI.show(this.store);
    }
}

class ColorSettingsUI {
    constructor() {
        DialogPolyfill.register();
        ColorSettingsUI.registerDialog();
        this.dialog = null;
        this.dialogPolyfill = new DialogPolyfill();
        this.multiColorSelector = null;
        this.grayShadeSelector = null;
        this.whiteSelector = null;
        this.blackSelector = null;
        this.luminanceSelector = null;

        this.handleCloseIconClickEvent = this.handleCloseIconClickEvent.bind(this);
        this.handleFocusInputColorEvent = this.handleFocusInputColorEvent.bind(this);
        this.handleBlurInputColorEvent = this.handleBlurInputColorEvent.bind(this);
        this.handleApplyButtonClickEvent = this.handleApplyButtonClickEvent.bind(this);
        this.handleRestoreButtonClickEvent = this.handleRestoreButtonClickEvent.bind(this);

        this.handleSelectedColorEvent = this.handleSelectedColorEvent.bind(this);
        this.handleLuminanceChangeEvent = this.handleLuminanceChangeEvent.bind(this);
    }

    initDialog(store) {
        this.store = store;
        if (!this.dialog) { return; }
        const closeIcon = this.dialog.querySelector(`#${ID.COLOR_CLOSE_ICON}`);
        if (closeIcon) {
            closeIcon.addEventListener('click', this.handleCloseIconClickEvent, false);
        }

        const applyButton = this.dialog.querySelector(`#${ID.COLOR_APPLY}`);
        if (applyButton) {
            applyButton.addEventListener('click', this.handleApplyButtonClickEvent, false);
        }

        const restoreDefaultsButton = this.dialog.querySelector(`#${ID.COLOR_DEFAULTS}`);
        if (restoreDefaultsButton) {
            restoreDefaultsButton.addEventListener('click', this.handleRestoreButtonClickEvent, false);
        }

        this.multiColorSelector = new MultiColorSelector(this.dialog);
        this.grayShadeSelector = new GrayShadesSelector(this.dialog);
        this.whiteSelector = new SingleColorSelector(this.dialog, ID.WHITE_HEXAGON, COLOR.WHITE);
        this.blackSelector = new SingleColorSelector(this.dialog, ID.BLACK_HEXAGON, COLOR.BLACK);
        this.luminanceSelector = new LuminanceSelector(this.dialog);

        this.writeColors();
        this.originalColors = JsonUtil.duplicateObject(this.readColors()); // Note: writeColors may have converted colors to hex
    }

    show(store) {
        this.dialog = this.dialogPolyfill.dialogQuery(`#${ID.COLOR_DIALOG}`);
        if (!this.dialog) { return; }
        this.initDialog(store);
        this.dialog.showModal();

        this.activeInputEl = this.dialog.querySelector(`#${ID.COLOR_GREEN}`);
        if (this.activeInputEl) {
            this.activeInputEl.focus();
        }
        else {
            console.error(`Could not find Green input color.`);
        }

        this.forColorSampleArray = ColorSettingsUI.getForColorSampleElements(this.dialog);
        this.backColorSampleArray = ColorSettingsUI.getBackrColorSampleElements(this.dialog);

        if (this.multiColorSelector) {
            this.multiColorSelector.show(this.handleSelectedColorEvent);
        }
        if (this.grayShadeSelector) {
            this.grayShadeSelector.show(this.handleSelectedColorEvent);
        }
        if (this.whiteSelector) {
            this.whiteSelector.show(this.handleSelectedColorEvent);
        }
        if (this.blackSelector) {
            this.blackSelector.show(this.handleSelectedColorEvent);
        }
        if (this.luminanceSelector) {
            this.luminanceSelector.show(this.handleLuminanceChangeEvent);
        }
    }

    writeColors() {
        const colors = this.store.state.colors;

        this.setColor(ID.COLOR_GREEN, colors.green, colors.bkgd);
        this.setColor(ID.COLOR_BLUE, colors.blue, colors.bkgd);
        this.setColor(ID.COLOR_RED, colors.red, colors.bkgd);
        this.setColor(ID.COLOR_WHITE, colors.white, colors.bkgd);
        this.setColor(ID.COLOR_TURQUOISE, colors.turquoise, colors.bkgd);
        this.setColor(ID.COLOR_YELLOW, colors.yellow, colors.bkgd);
        this.setColor(ID.COLOR_PINK, colors.pink, colors.bkgd);
        this.setColor(ID.COLOR_CURSOR, null, colors.cursor);
        this.setColor(ID.COLOR_SEL, null, colors.sel);
        // Note: there is no UI for termColors.statBarColor nor termColors.statBarBkgdColor
    }

    readColors() {
        var newColors = {};
        let color;

        color = this.getColorFromInput(ID.COLOR_GREEN);
        if (color) {
            newColors.green = color;
        }

        color = this.getColorFromInput(ID.COLOR_BLUE);
        if (color) {
            newColors.blue = color;
        }

        color = this.getColorFromInput(ID.COLOR_RED);
        if (color) {
            newColors.red = color;
        }

        color = this.getColorFromInput(ID.COLOR_WHITE);
        if (color) {
            newColors.white = color;
        }

        color = this.getColorFromInput(ID.COLOR_TURQUOISE);
        if (color) {
            newColors.turquoise = color;
        }

        color = this.getColorFromInput(ID.COLOR_YELLOW);
        if (color) {
            newColors.yellow = color;
        }

        color = this.getColorFromInput(ID.COLOR_PINK);
        if (color) {
            newColors.pink = color;
        }

        color = this.getColorFromInput(ColorSettingsUI.makeBknd_Id(ID.COLOR_GREEN));
        if (color) {
            newColors.bkgd = color;
        }

        color = this.getColorFromInput(ID.COLOR_CURSOR);
        if (color) {
            newColors.cursor = color;
        }

        color = this.getColorFromInput(ID.COLOR_SEL);
        if (color) {
            newColors.sel = color;
        }

        // Note: There is no UI for newColors.statBarColor nor newColors.statBarBkgdColor
        return newColors;
    }

    setColor(idColor, color, bkgdColor) {
        const dialog = this.dialog;

        const elSampleN = dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(idColor)}`);
        const elSampleU = dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(idColor)}`);
        const elSampleR = dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(idColor)}`);
        const elSampleUR = dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(idColor)}`);
        const el = dialog.querySelector(`#${idColor}`);
        const el_Bknd = dialog.querySelector(`#${ColorSettingsUI.makeBknd_Id(idColor)}`);

        if (elSampleN) {
            if (color) {
                elSampleN.style.color = color;
            }
            elSampleN.style.backgroundColor = bkgdColor;
        }

        if (elSampleU) {
            elSampleU.style.color = color;
            elSampleU.style.backgroundColor = bkgdColor;
        }

        if (elSampleR) {
            elSampleR.style.color = bkgdColor;
            elSampleR.style.backgroundColor = color;
        }

        if (elSampleUR) {
            elSampleUR.style.color = bkgdColor;
            elSampleUR.style.backgroundColor = color;
        }

        if (el) {
            el.value = color !== null ? ColorConversions.getHexColor(color) : ColorConversions.getHexColor(bkgdColor);
            TerminalDOM.disableAutoCorrect(el);
            el.addEventListener('focus', this.handleFocusInputColorEvent, false);
            el.addEventListener('blur', this.handleBlurInputColorEvent, false);
        }

        if (el_Bknd) {
            el_Bknd.value = ColorConversions.getHexColor(bkgdColor);
            TerminalDOM.disableAutoCorrect(el_Bknd);
            el_Bknd.addEventListener('focus', this.handleFocusInputColorEvent, false);
            el_Bknd.addEventListener('blur', this.handleBlurInputColorEvent, false);
        }
    }

    getColorFromInput(id) {
        const dialog = this.dialog;
        const el = dialog.querySelector(`#${id}`);

        if (!el) {
            return null;
        }
        const color = el.value;
        if (!color || !color.length) { // More validation?
            return null;
        }
        return color;
    }

    getActiveElements() {
        if (!this.activeInputEl) {
            return { };
        }

        const dialog = this.dialog;

        return {
            sN: dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(this.activeInputEl.id)}`),  // Normal
            sU: dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(this.activeInputEl.id)}`),  // Underlined
            sR: dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(this.activeInputEl.id)}`),  // Reverse video
            sUR: dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(this.activeInputEl.id)}`) // Underlined + Reverse video
        };
    }

    handleFocusInputColorEvent(event) {
        this.activeInputEl = event.target;
    }

    handleBlurInputColorEvent(event) {
        const color = event.target && event.target.value ? event.target.value : null;
        this.handleSelectedColorEvent(color);
    }

    updateSamples(activeElements, colorSelected) {
        let isBkgd = false;

        if (this.activeInputEl) {
            this.activeInputEl.value = colorSelected;
            isBkgd = this.activeInputEl.id === ID.COLOR_GREEN + '_BKGD';
        }

        if (isBkgd) {
            if (this.forColorSampleArray) {
                for (let i = 0, l = this.forColorSampleArray.length; i < l; i++) {
                    this.forColorSampleArray[i].style.color = colorSelected;
                }
            }

            if (this.backColorSampleArray) {
                for (let i = 0, l = this.backColorSampleArray.length; i<l; i++) {
                    this.backColorSampleArray[i].style.backgroundColor = colorSelected;
                }
            }
        }
        else {

            if (activeElements.sN) {
                const el = activeElements.sN;

                if (el.id === ID.COLOR_CURSOR + '_SAMPLE_N' || el.id === ID.COLOR_SEL + '_SAMPLE_N') {
                    el.style.backgroundColor = colorSelected;
                }
                else {
                    el.style.color = colorSelected;
                }
            }

            if (activeElements.sU) {
                activeElements.sU.style.color = colorSelected;
            }

            if (activeElements.sR) {
                activeElements.sR.style.backgroundColor = colorSelected;
            }

            if (activeElements.sUR) {
                activeElements.sUR.style.backgroundColor = colorSelected;
            }
        }
    }

    static makeSampleN_Id(id) {
        return id + '_SAMPLE_N';
    }

    static makeSampleU_Id(id) {
        return id + '_SAMPLE_U';
    }

    static makeSampleR_Id(id) {
        return id + '_SAMPLE_R';
    }

    static makeSampleUR_Id(id) {
        return id + '_SAMPLE_UR';
    }

    static makeBknd_Id(id) {
        return id + '_BKGD';
    }

    static getForColorSampleElements(dialog) {
        let a = [];

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(ID.COLOR_GREEN)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(ID.COLOR_GREEN)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(ID.COLOR_BLUE)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(ID.COLOR_BLUE)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(ID.COLOR_RED)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(ID.COLOR_RED)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(ID.COLOR_WHITE)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(ID.COLOR_WHITE)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(ID.COLOR_TURQUOISE)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(ID.COLOR_TURQUOISE)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(ID.COLOR_YELLOW)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(ID.COLOR_YELLOW)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleR_Id(ID.COLOR_PINK)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleUR_Id(ID.COLOR_PINK)}`));

        return a;
    }

    static getBackrColorSampleElements(dialog) {
        let a = [];

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(ID.COLOR_GREEN)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(ID.COLOR_GREEN)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(ID.COLOR_BLUE)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(ID.COLOR_BLUE)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(ID.COLOR_RED)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(ID.COLOR_RED)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(ID.COLOR_WHITE)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(ID.COLOR_WHITE)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(ID.COLOR_TURQUOISE)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(ID.COLOR_TURQUOISE)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(ID.COLOR_YELLOW)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(ID.COLOR_YELLOW)}`));

        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleN_Id(ID.COLOR_PINK)}`));
        a.push(dialog.querySelector(`#${ColorSettingsUI.makeSampleU_Id(ID.COLOR_PINK)}`));

        return a;
    }

    handleCloseIconClickEvent() {
        this.dialog.close();
    }

    handleApplyButtonClickEvent() {
        const newColors = this.readColors();
        if (!JsonUtil.equivalent(this.originalColors, newColors)) {
            this.store.dispatch({ type: StateChangeActionType.COLOR_CHANGE, payload: newColors });
        }
        this.dialog.close();
    }

    handleRestoreButtonClickEvent() {
        this.store.dispatch({ type: StateChangeActionType.RESTORE_DEFAULT_COLORS, payload: {} });
        this.dialog.close();
    }

    handleSelectedColorEvent(selectedColor) {
        if (!selectedColor || !this.activeInputEl) { return; }

        const activeElements = this.getActiveElements();
        this.updateSamples(activeElements, selectedColor);
        this.luminanceSelector.update(selectedColor);
    }

    handleLuminanceChangeEvent(luminanceValue) {
        console.log(`[handleLuminanceChangeEvent] ${luminanceValue}`);

        if (!this.activeInputEl) { return; }

        const hexColor = this.activeInputEl.value;
        const rgbColor = ColorConversions.hexToRGB(hexColor);
        const hslColor = ColorConversions.rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);
        const rgbNewLum = ColorConversions.hslToRgb(hslColor.h, hslColor.s, luminanceValue);

        this.updateSamples(this.getActiveElements(), ColorConversions.rgbToHex(rgbNewLum.r, rgbNewLum.g, rgbNewLum.b));
    }

    static registerDialog() {
        setTimeout(() => {
            const dialogEl = document.createElement('dialog');
            dialogEl.id = `${ID.COLOR_DIALOG}`;
            dialogEl.className = 'AsnaTermColors'; 
            dialogEl.innerHTML = `
<span id="${ID.COLOR_CLOSE_ICON}">
<svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
   width="16px" height="16px" viewBox="0 0 512 512" enable-background="new 0 0 60 60" xml:space="preserve">
    <path d="M464 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm0 394c0 3.3-2.7 6-6 6H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h404c3.3 0 6 2.7 6 6v340zM356.5 194.6L295.1 256l61.4 61.4c4.6 4.6 4.6 12.1 0 16.8l-22.3 22.3c-4.6 4.6-12.1 4.6-16.8 0L256 295.1l-61.4 61.4c-4.6 4.6-12.1 4.6-16.8 0l-22.3-22.3c-4.6-4.6-4.6-12.1 0-16.8l61.4-61.4-61.4-61.4c-4.6-4.6-4.6-12.1 0-16.8l22.3-22.3c4.6-4.6 12.1-4.6 16.8 0l61.4 61.4 61.4-61.4c4.6-4.6 12.1-4.6 16.8 0l22.3 22.3c4.7 4.6 4.7 12.1 0 16.8z"></path>
</svg>
</span>
<div class="AsnaTermCOLOR_SELECTION">
    <div class="bterm-color-selection-main-color-table-row">
        <span id="AsnaTermCOLOR_Attr" class="bterm-color-selection-heading">Attribute</span>
        <span ></span>
        <span id="AsnaTermCOLOR_Color" class="bterm-color-selection-heading">Color</span>
        <span id="AsnaTermCOLOR_BkColor" class="bterm-color-selection-heading">Background Color</span>
    </div>
    <div class="bterm-color-selection-main-color-table-row">
        <span id="AsnaTermCOLOR_LGREEN" class="bterm-color-selection-label">Green</span>
        <span class="bterm-color-selection-sample-text-table-row">          
            <span id="AsnaTermCOLOR_GREEN_SAMPLE_N" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">T</pre></span>
            <span id="AsnaTermCOLOR_GREEN_SAMPLE_U" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>e</u></pre></span>
            <span id="AsnaTermCOLOR_GREEN_SAMPLE_R" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">x</pre></span>
            <span id="AsnaTermCOLOR_GREEN_SAMPLE_UR" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>t</u></pre></span>
        </span>
        <input id="AsnaTermCOLOR_GREEN" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
        <input id="AsnaTermCOLOR_GREEN_BKGD" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
    </div>

    <div class="bterm-color-selection-main-color-table-row">
        <span id="AsnaTermCOLOR_LBLUE" class="bterm-color-selection-label">Blue</span>
        <span class="bterm-color-selection-sample-text-table-row">          
            <span id="AsnaTermCOLOR_BLUE_SAMPLE_N" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">T</pre></span>
            <span id="AsnaTermCOLOR_BLUE_SAMPLE_U" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>e</u></pre></span>
            <span id="AsnaTermCOLOR_BLUE_SAMPLE_R" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">x</pre></span>
            <span id="AsnaTermCOLOR_BLUE_SAMPLE_UR" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>t</u></pre></span>
        </span>
        <input id="AsnaTermCOLOR_BLUE" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
        <span></span>
    </div>

    <div class="bterm-color-selection-main-color-table-row">
        <span id="AsnaTermCOLOR_LRED" class="bterm-color-selection-label">Red</span>
        <span class="bterm-color-selection-sample-text-table-row">          
            <span id="AsnaTermCOLOR_RED_SAMPLE_N" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">T</pre></span>
            <span id="AsnaTermCOLOR_RED_SAMPLE_U" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>e</u></pre></span>
            <span id="AsnaTermCOLOR_RED_SAMPLE_R" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">x</pre></span>
            <span id="AsnaTermCOLOR_RED_SAMPLE_UR" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>t</u></pre></span>
        </span>
        <input id="AsnaTermCOLOR_RED" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
        <span></span>
    </div>

    <div class="bterm-color-selection-main-color-table-row">
        <span id="AsnaTermCOLOR_LWHITE" class="bterm-color-selection-label">White</span>
        <span class="bterm-color-selection-sample-text-table-row">          
            <span id="AsnaTermCOLOR_WHITE_SAMPLE_N" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">T</pre></span>
            <span id="AsnaTermCOLOR_WHITE_SAMPLE_U" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>e</u></pre></span>
            <span id="AsnaTermCOLOR_WHITE_SAMPLE_R" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">x</pre></span>
            <span id="AsnaTermCOLOR_WHITE_SAMPLE_UR" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>t</u></pre></span>
        </span>
        <input id="AsnaTermCOLOR_WHITE" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
        <span></span>
    </div>

    <div class="bterm-color-selection-main-color-table-row">
        <span id="AsnaTermCOLOR_LTURQUOISE" class="bterm-color-selection-label">Turquoise</span>
        <span class="bterm-color-selection-sample-text-table-row">          
            <span id="AsnaTermCOLOR_TURQUOISE_SAMPLE_N" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">T</pre></span>
            <span id="AsnaTermCOLOR_TURQUOISE_SAMPLE_U" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>e</u></pre></span>
            <span id="AsnaTermCOLOR_TURQUOISE_SAMPLE_R" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">x</pre></span>
            <span id="AsnaTermCOLOR_TURQUOISE_SAMPLE_UR" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>t</u></pre></span>
        </span>
        <input id="AsnaTermCOLOR_TURQUOISE" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
        <span></span>
    </div>


    <div class="bterm-color-selection-main-color-table-row">
        <span id="AsnaTermCOLOR_LYELLOW" class="bterm-color-selection-label">Yellow</span>
        <span class="bterm-color-selection-sample-text-table-row">          
            <span id="AsnaTermCOLOR_YELLOW_SAMPLE_N" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">T</pre></span>
            <span id="AsnaTermCOLOR_YELLOW_SAMPLE_U" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>e</u></pre></span>
            <span id="AsnaTermCOLOR_YELLOW_SAMPLE_R" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">x</pre></span>
            <span id="AsnaTermCOLOR_YELLOW_SAMPLE_UR" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>t</u></pre></span>
        </span>
        <input id="AsnaTermCOLOR_YELLOW" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
        <span></span>
    </div>

    <div class="bterm-color-selection-main-color-table-row">
        <span id="AsnaTermCOLOR_LPINK" class="bterm-color-selection-label">Pink</span>
        <span class="bterm-color-selection-sample-text-table-row">          
            <span id="AsnaTermCOLOR_PINK_SAMPLE_N" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">T</pre></span>
            <span id="AsnaTermCOLOR_PINK_SAMPLE_U" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>e</u></pre></span>
            <span id="AsnaTermCOLOR_PINK_SAMPLE_R" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText">x</pre></span>
            <span id="AsnaTermCOLOR_PINK_SAMPLE_UR" class="AsnaTermColorSample"><pre class="AsnaTermColorPreText"><u>t</u></pre></span>
        </span>
        <input id="AsnaTermCOLOR_PINK" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
        <span></span>
    </div>
</div>
<br/>
<div >
    <div class="bterm-color-selection-other-color-table-row" >
        <span id="AsnaTermCOLOR_Other" class="bterm-color-selection-heading">Other Elements</span>
        <span></span>
    <div>
    <div class="bterm-color-selection-other-color-table-row" >
        <span id="AsnaTermCOLOR_LCURSOR" class="bterm-color-selection-label">Cursor</span>
        <input id="AsnaTermCOLOR_CURSOR" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
    <div>
    <div class="bterm-color-selection-other-color-table-row" >
        <span id="AsnaTermCOLOR_LSEL" class="bterm-color-selection-label">Text Selection</span>
        <input id="AsnaTermCOLOR_SEL" type="text" class="AsnaTermCOLOR_INPUT_HEX" />
    <div>
<div>
        <canvas id="AsnaTermColorWheelID" class="AsnaTermColorWheel"></canvas>
        <canvas id="AsnaTermWhiteHexID" class="AsnaTermWhiteHex"></canvas>
        <canvas id="AsnaTermGrayWheelID" class="AsnaTermGrayWheel"></canvas>
        <canvas id="AsnaTermBlackHexID" class="AsnaTermBlackHex"></canvas>
        <div id="AsnaTermColorLuminanceID" class="AsnaTermColorLuminance">0% <input id="AsnaTermColorLumSliderID" class="AsnaTermColorLumSlider" type="range" min="0" max="100" step="1" value="50" /> 100%</div>
        <input id="AsnaTermColorApplyID" class="AsnaTermColorApply" type='button' value="Apply"></input>
        <input id="AsnaTermColorDefaultsID" class="AsnaTermColorDefaults" type='button' value="Restore Defaults"></input>
`;

            document.body.appendChild(dialogEl);
        }, 100);
    }
}

const radians30 = Math.PI * (30 / 180);
const sin30 = Math.sin(radians30);
const cos30 = Math.cos(radians30);

const IBM_KEYPAD = 0;
const USER_DEF_POPUP = 1;
const RANGE_POPUP = 2;
const ENUM_POPUP = 3;
const OBJ_STORAGE_VERSION = 1;
const DISPLAY_POPUP_TIMEOUT = 2000; // 500,
const DONOTHING = 'DONOTHING';
const MOBILE = 'Mobile';

class MultiColorSelector {
    constructor(dialog) {
        this.colorWheelEl = dialog.querySelector(`#${ID.COLOR_WHEEL}`);

        if (false) { // this.colorWheelEl && (ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch())) {
            TerminalDOM.changeClassByAppending(this.colorWheelEl, MOBILE);
            TerminalDOM.replaceClass(STYLE.COLOR_INPUT_HEX, `${STYLE.COLOR_INPUT_HEX}${MOBILE}`);
        }

        this.hcAbsPos = TerminalDOM.getAbsPosition(this.colorWheelEl);

        this.hexagonSide = 10.0;// ASNA.Vendor.IsDesktop() ? 10.0 : 20.0;

        this.handlePointerStartEvent = this.handlePointerStartEvent.bind(this);
    }

    show(handleSelectedColorEvent) {
        MultiColorSelector.paint(this.colorWheelEl, this.hexagonSide, HONEY_COMB_COLOR_MAP, HONEY_COMB_COLOR_MAP[6].c.length);

        this.devicePointers = new MouseEvents();
        this.devicePointers.addEventListener(this.colorWheelEl, this.handlePointerStartEvent, null, null);
        this.handleSelectedColorEvent = handleSelectedColorEvent;
    }

    handlePointerStartEvent(event) {
        let relativePt = MultiColorSelector.calcTargetPt(event.target, { x: event.clientX, y: event.clientY });
        const selectedColor = MultiColorSelector.getSelectedColorFromPt(event.target.id, relativePt, this.hexagonSide);

        if (selectedColor) {
            this.handleSelectedColorEvent(selectedColor);
            return;
        }
    }

    static calcTargetPt(target, clientPt) {
        const bounds = target.getBoundingClientRect(); // We could optimize ... caching target 
        return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    static getSelectedColorFromPt(canvasId, pt, side) {
        let selectedColor = null;

        switch (canvasId) {
            case ID.COLOR_WHEEL:
                selectedColor = MultiColorSelector.getSelectedColorFromMap(pt, HONEY_COMB_COLOR_MAP, side);
                break;
            case ID.WHITE_HEXAGON:
                selectedColor = '#FFFFFF';
                break;
            case ID.GRAY_WHEEL:
                selectedColor = MultiColorSelector.getSelectedColorFromMap(pt, GRAY_COLOR_MAP, side);
                break;
            case ID.BLACK_HEXAGON:
                selectedColor = '#000000';
                break;
        }

        return selectedColor;
    }

    static paintPointyHexagon(el, color, pt, side, fill) {
        const h = MultiColorSelector.calcH(side);
        const r = MultiColorSelector.calcR(side);

        const ctx = el.getContext('2d');

        if (fill) {
            ctx.fillStyle = color;
        }
        else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y); // 0
        ctx.lineTo(pt.x + r, pt.y + h);  // 1
        ctx.lineTo(pt.x + r, pt.y + h + side);  // 2
        ctx.lineTo(pt.x, pt.y + h + side + h);  // 3
        ctx.lineTo(pt.x - r, pt.y + h + side);  // 4
        ctx.lineTo(pt.x - r, pt.y + h);  // 5

        if (fill) {
            ctx.closePath();
            ctx.fill();
        }
        else {
            ctx.closePath();
            ctx.stroke();
        }
    }

    static calcH(side) {
        return side * sin30;
    }

    static calcR(side) {
        return side * cos30;
    }

    static paintSingleHex(el, color, side) {
        const h = MultiColorSelector.calcH(side);
        const r = MultiColorSelector.calcR(side);
        const isWhite = color === '#FFFFFF' || color === 'white';

        el.width = 2 * r + 1;
        el.height = side + h + h;

        MultiColorSelector.paintPointyHexagon(el, isWhite ? '#000000' : color, { x: r, y: 0 }, side, !isWhite);
    }

    static paint(el, side, map, hexWideCount) {
        const h = MultiColorSelector.calcH(side);
        const r = MultiColorSelector.calcR(side);
        const pt = { x: 0, y: 0 };

        el.width = hexWideCount * (2 * r);
        el.height = (map.length * (side + h)) + h;

        for (let j = 0; j < map.length; j++) {
            for (let i = 0; i < map[j].c.length; i++) {
                MultiColorSelector.paintPointyHexagon(el, '#' + map[j].c[i], { x: (map[j].s * r) + (r + pt.x) + (i * (2 * r)), y: pt.y }, side, true);
            }

            pt.y += h + side;
        }
    }

    static getSelectedColorFromMap(pt, map, side) {
        let selectedColor = null;

        const mapRow = Math.floor(pt.y / (MultiColorSelector.calcH(side) + side));

        if (mapRow >= 0 && mapRow < map.length) {
            const r = MultiColorSelector.calcR(side);

            pt.x = pt.x - (r * map[mapRow].s);

            let mapCol = Math.floor(pt.x / (2 * r));

            // console.log(`Selected color row: ${mapRow} col:${mapCol} c-len:${map[mapRow].c.length}`);

            if (mapCol >= 0 && mapCol < map[mapRow].c.length) {
                selectedColor = '#' + map[mapRow].c[mapCol];
            }
        }
        else {
            // console.log(`Selected color row: ${mapRow} len:${map.length} -- !`);
        }

        //if (selectedColor) {
        //    console.log(`Selected color: ${selectedColor}`);
        //}

        return selectedColor;
    }
}

class GrayShadesSelector {
    constructor(dialog) {
        this.grayWheelEl = dialog.querySelector(`#${ID.GRAY_WHEEL}`);

        if (false) { // this.colorWheelEl && (ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch())) {
            TerminalDOM.changeClassByAppending(this.grayWheelEl, MOBILE);
        }

        this.grayAbsPos = TerminalDOM.getAbsPosition(this.grayWheelEl);
        this.hexagonSide = 10.0;// ASNA.Vendor.IsDesktop() ? 10.0 : 20.0;

        this.handlePointerStartEvent = this.handlePointerStartEvent.bind(this);
    }

    show(handleSelectedColorEvent) {
        MultiColorSelector.paint(this.grayWheelEl, this.hexagonSide, GRAY_COLOR_MAP, 3.5);

        this.devicePointers = new MouseEvents();
        this.devicePointers.addEventListener(this.grayWheelEl, this.handlePointerStartEvent, null, null);

        this.handleSelectedColorEvent = handleSelectedColorEvent;
    }

    handlePointerStartEvent(event) {
        let relativePt = MultiColorSelector.calcTargetPt(event.target, { x: event.clientX, y: event.clientY });
        const selectedColor = MultiColorSelector.getSelectedColorFromPt(event.target.id, relativePt, this.hexagonSide);

        if (selectedColor) {
            this.handleSelectedColorEvent(selectedColor);
            return;
        }
    }
}

class SingleColorSelector {
    constructor(dialog, id, colorCode) {
        this.colorHexEl = dialog.querySelector(`#${id}`);

        if (false) { // this.colorWheelEl && (ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch())) {
            TerminalDOM.changeClassByAppending(this.colorHexEl, MOBILE);
        }

        this.hexagonSide = 10.0;// ASNA.Vendor.IsDesktop() ? 10.0 : 20.0;
        this.colorCode = colorCode;

        this.handlePointerStartEvent = this.handlePointerStartEvent.bind(this);
    }

    show(handleSelectedColorEvent) {
        MultiColorSelector.paintSingleHex(this.colorHexEl, this.colorCode, this.hexagonSide);

        this.devicePointers = new MouseEvents();
        this.devicePointers.addEventListener(this.colorHexEl, this.handlePointerStartEvent, null, null);

        this.handleSelectedColorEvent = handleSelectedColorEvent;
    }

    handlePointerStartEvent(event) {
        let relativePt = MultiColorSelector.calcTargetPt(event.target, { x: event.clientX, y: event.clientY });
        const selectedColor = MultiColorSelector.getSelectedColorFromPt(event.target.id, relativePt, this.hexagonSide);

        if (selectedColor) {
            this.handleSelectedColorEvent(selectedColor);
            return;
        }
    }
}

class LuminanceSelector {
    constructor(dialog) {
        const luminance = dialog.querySelector(`#${ID.COLOR_LUMINANCE}`);
        this.lumSlider = dialog.querySelector(`#${ID.COLOR_LUMSLIDER}`);

        if (false) { // this.colorWheelEl && (ASNA.Vendor.IsMobile() || ASNA.Vendor.IsWin8Touch())) {
            TerminalDOM.changeClassByAppending(luminance, MOBILE);
            TerminalDOM.changeClassByAppending(this.lumSlider, MOBILE);
        }

        this.handleLuminanceSliderChange = this.handleLuminanceSliderChange.bind(this);
    }

    show(handleLuminanceChangeEvent) {
        if (this.lumSlider) {
            this.lumSlider.addEventListener('change', this.handleLuminanceSliderChange, false);
        }
        this.handleLuminanceChangeEvent = handleLuminanceChangeEvent;
    }

    update(hexColor) {
        const rgbColor = ColorConversions.hexToRGB(hexColor);
        const hslColor = ColorConversions.rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);

        if (this.lumSlider) {
            this.overrideLum = true;
            this.lumSlider.value = hslColor.l * 100;
            this.overrideLum = false;
        }
    }

    handleLuminanceSliderChange(event) {
        if (event.target !== this.lumSlider || this.overrideLum ) {
            return;
        }

        const lum = this.lumSlider.value / 100.0;

        if (this.handleLuminanceChangeEvent) {
            this.handleLuminanceChangeEvent(lum);
        }
    }
}

class ColorConversions {
    static hexToRGB(hex, opacity) {
        let h = hex.replace('#', '');
        h = h.match(new RegExp('(.{' + h.length / 3 + '})', 'g'));

        for (let i = 0; i < h.length; i++)
            h[i] = parseInt(h[i].length === 1 ? h[i] + h[i] : h[i], 16);

        return { r: h[0], g: h[1], b: h[2], a: opacity };
    }

    static rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    static rgbToHex(r, g, b) {
        return "#" + ColorConversions.hexstr(r) + ColorConversions.hexstr(g) + ColorConversions.hexstr(b);
    }

    static hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = ColorConversions.hue2rgb(p, q, h + 1 / 3);
            g = ColorConversions.hue2rgb(p, q, h);
            b = ColorConversions.hue2rgb(p, q, h - 1 / 3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    static hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    static hexstr(number) {
        var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        var low = number & 0xf;
        var high = (number >> 4) & 0xf;
        return '' + chars[high] + chars[low];
    }

    static getHexColor(candidate) {
        let reg = new RegExp(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/);
        const h = candidate.match(reg);
        if (!h || h.length < 4) {
            return candidate;
        }
        return ColorConversions.rgbToHex(h[1], h[2], h[3]);
    }
}

const theColorSettings = new ColorSettings();
const theColorSettingsUI = new ColorSettingsUI();

const HONEY_COMB_COLOR_MAP = [
    { s: 6, c: ['003366', '336699', '3366CC', '003399', '000099', '0000CC', '000066'] },
    { s: 5, c: ['006666', '006699', '0099CC', '0066CC', '0033CC', '0000FF', '3333FF', '333399'] },
    { s: 4, c: ['669999', '009999', '33CCCC', '00CCFF', '0099FF', '0066FF', '3366FF', '3333CC', '666699'] },
    { s: 3, c: ['339966', '00CC99', '00FFCC', '00FFFF', '33CCFF', '3399FF', '6699FF', '6666FF', '6600FF', '6600CC'] },
    { s: 2, c: ['339933', '00CC66', '00FF99', '66FFCC', '66FFFF', '66CCFF', '99CCFF', '9999FF', '9966FF', '9933FF', '9900FF'] },
    { s: 1, c: ['006600', '00CC00', '00FF00', '66FF99', '99FFCC', 'CCFFFF', 'CCCCFF', 'CC99FF', 'CC66FF', 'CC33FF', 'CC00FF', '9900CC'] },
    { s: 0, c: ['003300', '009933', '33CC33', '66FF66', '99FF99', 'CCFFCC', 'FFFFFF', 'FFCCFF', 'FF99FF', 'FF66FF', 'FF00FF', 'CC00CC', '660066'] },
    { s: 1, c: ['336600', '009900', '66FF33', '99FF66', 'CCFF99', 'FFFFCC', 'FFCCCC', 'FF99CC', 'FF66CC', 'FF33CC', 'CC0099', '993399'] },
    { s: 2, c: ['333300', '669900', '99FF33', 'CCFF66', 'FFFF99', 'FFCC99', 'FF9999', 'FF6699', 'FF3399', 'CC3399', '990099'] },
    { s: 3, c: ['666633', '99CC00', 'CCFF33', 'FFFF66', 'FFCC66', 'FF9966', 'FF6666', 'FF0066', 'CC6699', '993366'] },
    { s: 4, c: ['999966', 'CCCC00', 'FFFF00', 'FFCC00', 'FF9933', 'FF6600', 'FF5050', 'CC0066', '660033'] },
    { s: 5, c: ['996633', 'CC9900', 'FF9900', 'CC6600', 'FF3300', 'FF0000', 'CC0000', '990033'] },
    { s: 6, c: ['663300', '996600', 'CC3300', '993300', '990000', '800000', '933333'] }
];

const GRAY_COLOR_MAP = [
    { s: 0, c: ['CCCCCC', '999999', '666666'] },
    { s: 1, c: ['C0C0C0', '808080', '333333'] }
];

