/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theNavMenu as NavigationMenu };

import { AsnaDataAttrName } from '../js/asna-data-attr.js';

class NavigationMenu {
    init() {
        const nav = document.querySelector(`nav[${AsnaDataAttrName.ACTIVEKEY_LOCATION}]`);

        if (!nav) { // location === 'hidden' ... We already removed the nav element.
            return null;
        }

        const location = nav.getAttribute(AsnaDataAttrName.ACTIVEKEY_LOCATION);
        nav.removeAttribute(AsnaDataAttrName.ACTIVEKEY_LOCATION);

        const main = document.querySelector('main[role=main]');

        if (!main) {
            return null;
        }

        const container = document.createElement('div');
        let defaultWinBackgroundPosition = 'left top';

        switch (location) {
            case 'vertical-left':
                container.className = 'dds-two-vertical-panel-container';
                defaultWinBackgroundPosition = 'right top';
                break;
            case 'vertical-right':
                container.className = 'dds-two-vertical-panel-right-container';
                defaultWinBackgroundPosition = 'center top';
                break;
            case 'horizontal-top':
                container.className = 'dds-two-horizontal-panel-container';
                defaultWinBackgroundPosition = 'center bottom';
                break;
            case 'horizontal-bottom':
                container.className = 'dds-two-horizontal-panel-bottom-container';
                break;
        }

        const cssVarRoot = document.documentElement.style;
        const VAR_WIN_BKGND_POSITION = '--main-window-background-position';
        if (cssVarRoot) { cssVarRoot.setProperty(VAR_WIN_BKGND_POSITION, defaultWinBackgroundPosition ); }

        container.style.visibility = 'hidden'; // Just to avoid flicker ...
        main.parentNode.removeChild(main);
        nav.parentNode.replaceChild(container, nav);

        const navPanel = this.panelWrap(nav);
        switch (location) {
            case 'vertical-left':
                navPanel.style.left = 0;
                break;
            case 'vertical-right':
                navPanel.style.right = 0;
                break;
            case 'horizontal-top':
                navPanel.style.top = 0;
                break;
            case 'horizontal-bottom':
                navPanel.style.bottom = 0;
                break;
        }
        container.appendChild(navPanel);
        container.appendChild(this.panelWrap(main));

        if (nav.classList) {
            nav.classList.remove('display-element-uninitialized');
        }

        return container;
    }

    panelWrap(el) {
        const div = document.createElement('div');
        div.className = 'dds-two-panel-item';

        div.appendChild(el);
        return div;
    }
}

const theNavMenu = new NavigationMenu();

