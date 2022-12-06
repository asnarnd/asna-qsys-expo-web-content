/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { TerminalHTML };

class TerminalHTML {
    static injectMarkup() {
        const terminalMarkup =
`
    <div id="AsnaTermTextSelection"></div>
    <div id="AsnaTermMessageIndicator" style="position:absolute;left:0px;top:0px;display:none;pointer-events: none">
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
            <g transform="translate(-66.0,-40.0) scale(0.82)">
                <path style="fill:#78e4f8;fill-opacity:1;stroke:none" d="m 85.587276,76.872786 c -2.28938,-1.85094 -3.56813,-1.214175 -7.650897,-7.479608 0,0 -3.140294,-4.910278 -0.0571,-9.706362 3.083198,-4.796085 5.995107,-6.566069 10.50571,-6.737358 4.510604,-0.171288 12.218601,0.171289 17.699841,7.536705 5.48124,7.365416 -2.74062,14.673736 -2.74062,14.673736 0,0 -5.880917,2.569331 -6.223495,2.74062 -0.342577,0.171288 -11.533442,-1.027733 -11.533439,-1.027733 z" />
                <path style="fill:#fdf670;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;fill-opacity:1" d="M 83.246329,59.801008 100.94617,58.202313 102.031,72.24799 84.730832,74.07507 z" />
                <path style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 83.360522,59.915201 c 9.877651,6.052202 9.820555,5.938009 9.820555,5.938009 l 7.765093,-7.765089" />
                <path style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 75.995106,53.577517 5.02447,2.911909" />
                <path style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 87.528548,48.553047 2.055465,5.880914" />
                <path style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 104.08646,60.771644 5.25285,-3.368678" />
                <path style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 103.68679,73.960878 4.73898,3.026101" />
                <path style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 98.491028,76.073439 0.171288,4.910277" />
                <path style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 80.50571,70.763488 -5.252855,-0.0571" />
            </g>
        </svg>
    </div>
    <audio id="AsnaTermErrorSound">
        <source src="/lib/asna-expo/audio/beep.mp3"/>
        <source src="/lib/asna-expo/audio/beep.ogg" />
    </audio>
    <div id="AsnaTermIbmKeyPad"></div>
    <div id="AsnaTermStatusBar">
        <div id="AsnaTermSettingsSliderModel" style="display:none">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="AsnaTermSliderRow">
                <defs>
                    <filter id="filterSlider" y="-0.2" x="-0.2" width="1.4" height="1.4" color-interpolation-filters="sRGB">
                        <feGaussianBlur stdDeviation="1" result="result14" />
                        <feFlood flood-opacity="1" result="result15" flood-color="rgb(55,200,113)" in="result14" />
                        <feTurbulence result="result5" numOctaves="1" baseFrequency="0.004 0.008" seed="25" type="fractalNoise" />
                        <feDisplacementMap in2="result14" yChannelSelector="B" result="result8" in="result5" xChannelSelector="R" scale="100" />
                        <feGaussianBlur stdDeviation="1" result="result17" />
                        <feSpecularLighting in="result8" lighting-color="rgb(255,255,255)" result="result2" surfaceScale="-10" specularConstant="1" specularExponent="50"><feDistantLight azimuth="225" elevation="80" /></feSpecularLighting>
                        <feBlend in2="SourceGraphic" mode="screen" result="result9" />
                        <feComposite in2="SourceGraphic" operator="atop" result="result11" />
                        <feDisplacementMap in2="result5" result="result16" in="result11" scale="0" xChannelSelector="R" />
                    </filter>
                </defs>
                <g transform="translate(0,-750)" style="filter:url(#filterSlider)">
                    <path style="fill:none;stroke:#000000;stroke-width:1.00905192px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 0.18297872,751.36217 43.03675828,0" />
                    <path style="fill:none;stroke:#000000;stroke-width:0.93533707px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 2.9835179,756.43983 36.9784601,0" />
                    <path style="fill:none;stroke:#808183;stroke-width:1.03656518;stroke-linecap:square;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" d="m 1.7026668,752.36856 39.7321492,0" />
                    <path style="fill:none;stroke:#898a8e;stroke-width:1.05750656;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" d="m 1.5513311,753.28345 40.0905989,0" />
                    <path style="fill:#6d6e72;fill-opacity:1;stroke:#616267;stroke-width:1.16094851;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" d="m 1.7484114,754.33557 39.3674836,0" />
                    <path style="fill:#ff0000;stroke:#2c2f3a;stroke-width:1px;stroke-linecap:round;stroke-linejoin:miter;stroke-opacity:1" d="m 0.54476537,753.19475 2.20408633,3.28804" />
                    <path style="fill:#ff0000;stroke:#30323e;stroke-width:1px;stroke-linecap:round;stroke-linejoin:miter;stroke-opacity:1" d="m 40.251148,756.43705 2.204086,-3.28804" />
                    <path style="fill:#2b2e33;fill-opacity:1;stroke:#292b32;stroke-width:1.0985105;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" d="m 2.5856155,755.43345 37.7833315,0" />
                    <path style="fill:none;stroke:#25282e;stroke-width:1.29618824;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:0.90798998;stroke-dasharray:none" d="m 0.65053034,751.46587 0,1.49934" />
                    <path style="fill:none;stroke:#25282e;stroke-width:1.29618824;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:0.90798998;stroke-dasharray:none" d="m 42.598403,751.46587 0,1.49934" />
                </g>
            </svg>
        </div>

        <div id="AsnaTermSettingsSlider"> </div>
    </div>
    <div id="AsnaTermSettingsDialog">
        <div id="AsnaTermSettingsOptions">
            <label id="AsnaTermPREF_LKBD" for="settingsKbdCheckbox" class="AsnaTermSettingsLabel">Kbd:</label>
            <label class="AsnaToggleSwitch" onclick> <span id="settingsKbdCheckbox" class="AsnaToggleSwitch-wrapper"> <span class="AsnaToggleSwitch-on"></span> <span class="AsnaToggleSwitch-off"></span> <span class="AsnaToggleSwitch-handle"></span> </span> </label>
            <label id="AsnaTermPREF_LFKHS" for="settingsFK_HotSpotsCheckbox" class="AsnaTermSettingsLabel">Hotspots:</label>
            <label class="AsnaToggleSwitch" onclick> <span id="settingsFK_HotSpotsCheckbox" class="AsnaToggleSwitch-wrapper"> <span class="AsnaToggleSwitch-on"></span> <span class="AsnaToggleSwitch-off"></span> <span class="AsnaToggleSwitch-handle"></span> </span> </label>
            <label id="AsnaTermPREF_LFUBTNS" for="settingsButtonsCheckbox" class="AsnaTermSettingsLabel">Enter/Reset Buttons:</label>
            <label class="AsnaToggleSwitch" onclick> <span id="settingsButtonsCheckbox" class="AsnaToggleSwitch-wrapper"> <span class="AsnaToggleSwitch-on"></span> <span class="AsnaToggleSwitch-off"></span> <span class="AsnaToggleSwitch-handle"></span> </span> </label>
            <label id="AsnaTermPREF_LKIBMSHOW" for="settingsIBMKpadCheckbox" class="AsnaTermSettingsLabel">IBM Keypad:</label>
            <label class="AsnaToggleSwitch" onclick> <span id="settingsIBMKpadCheckbox" class="AsnaToggleSwitch-wrapper"> <span class="AsnaToggleSwitch-on"></span> <span class="AsnaToggleSwitch-off"></span> <span class="AsnaToggleSwitch-handle"></span> </span> </label>
            <input id="AsnaTermPREF_Colors" type='button' value="Colors" />
        </div>
    </div>
    <button id="AsnaTermEnterButton" class="AsnaTermIbmBigButton AsnaTermGoColorButton" type="button">Enter</button>
    <button id="AsnaTermResetButton" class="AsnaTermIbmBigButton AsnaTermWarningColorButton" type="button">Reset</button>
    <div id="AsnaTerm5250"></div>
    <div id="AsnaTermCursor" tabindex="0" style="left:-100px;top:100px;"></div>
`;
        const div = document.createElement('div');
        div.id = 'AsnaTermFacade';
        div.style.touchAction = 'none';

        div.innerHTML = terminalMarkup;
        document.body.appendChild(div);
    }
}
