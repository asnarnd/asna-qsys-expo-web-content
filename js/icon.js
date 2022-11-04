/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { Icons, IconCache };

import { AsnaDataAttrName } from '../js/asna-data-attr.js';
import { Fetch } from '../js/ajax/ajax-fetch.js';
import { Unique } from '../js/dom-events.js';

const AJAX_RESPOSE_TIMEOUT = 1 * 60 * 1000; // 1 minutes

class Icons {
    static processDataAsnaIconInfo(el, iconParms, data) {
        if (!iconParms.awesomeFontId) { return; }

        let id = el.id;

        if (!id) {
            el.id = id = Unique.getUniqueID();
        }
        el.removeAttribute(AsnaDataAttrName.ICON_ID);
        if (iconParms.color) {
            el.setAttribute(AsnaDataAttrName.ICON_INTERNAL_COLOR, iconParms.color);
        }
        if (iconParms.title) {
            el.setAttribute(AsnaDataAttrName.ICON_INTERNAL_TITLE, iconParms.title);
        }
        Icons.collect(data, id, iconParms);
    }

    static requestCollection(data, ajaxRespEventHandler) {
        data.action = 'getIconCollection';

        Fetch.fetchWithTimeout( decodeURI(document.URL), data, AJAX_RESPOSE_TIMEOUT)
            .then(function (response) {
                    response.json().then(function (jsonStr) {
                        ajaxRespEventHandler(jsonStr);
                    }
                    ).catch(function (err) {
                        console.error(`JSON decode error:${err}`);
                    });
                }
            ).
            catch(function (err) {
                console.error(`Fetch failed error:${err}`);
            }
        );
    }

    static collect(data, elId, iconParms) {
        if (!data.iconForElement) {
            data.iconForElement = [];
            data.iconForElement.push(Icons.makeFirstIconRequest(elId, iconParms));
            return;
        }

        const shapeReq = Icons.find(data.iconForElement, iconParms.awesomeFontId);
        if (!shapeReq) {
            data.iconForElement.push(Icons.makeFirstIconRequest(elId, iconParms));
            return;
        }

        shapeReq.elementID.push(elId); // Add element id (same iconParms).
        return;
    }

    static makeFirstIconRequest(elId, iconParms) {
        return {
            elementID: [elId], // Note: this is an array
            iconID: iconParms.awesomeFontId,
            color: iconParms.color,
            title: iconParms.title
        };
    }

    static find(iconForElement, iconID) {
        for (let i = 0, l = iconForElement.length; i < l; i++) {
            const forEl = iconForElement[i];
            if (forEl.iconID === iconID) {
                return forEl;
            }
        }

        return null;
    }

    static appendSvgContent(div, shape, fillColor, title) {
        if (!div) {
            return;
        }

        let width = Icons.calcColWidth() * 2;

        let xOrigin = 0;
        let yOrigin = -256;
        let yExtent = shape.yExtent ? parseInt(shape.yExtent,10) : 1792;
        let xExtent = shape.xExtent ? parseInt(shape.xExtent,10) : 1536;

        if (xExtent < yExtent) {
            xOrigin = -((yExtent - xExtent) / 2);
            xExtent = yExtent;
        }

        const viewBox = {};
        viewBox.MinX = xOrigin;
        viewBox.MinY = (yExtent + yOrigin) * -1;
        viewBox.Width = xExtent;
        viewBox.Height = yExtent;

        const transform = { XScale: 1, YScale: -1 };
        const namespaceURI = 'http://www.w3.org/2000/svg';

        const svg = document.createElementNS(namespaceURI, 'svg');
        svg.setAttribute('x', 0);
        svg.setAttribute('y', 0);
        svg.setAttribute('width', width);
        svg.setAttribute('viewBox', `${viewBox.MinX} ${viewBox.MinY} ${viewBox.Width} ${viewBox.Height}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        if (fillColor && fillColor !== '*class') {
            svg.setAttribute('fill', fillColor);
        }

        if (title) {
            svg.innerHTML = `<title>${title}</title>`;
        }

        const href = document.querySelector(`g[id="${shape.id}"]`);
        if (href) { // Optimization - re-use svg 
            const use = document.createElementNS(namespaceURI, 'use');
            use.setAttribute('href', `#${shape.id}`);
            svg.appendChild(use);
            div.appendChild(svg);
            return;
        }

        const g = document.createElementNS(namespaceURI, 'g');
        g.setAttribute('id', shape.id); // Later used by <use href="#id" >
        g.setAttribute('transform', `scale(${transform.XScale},${transform.YScale})`);

        const path = document.createElementNS(namespaceURI, 'path');
        path.setAttribute('d', shape.d);

        g.appendChild(path);
        svg.appendChild(g);
        div.appendChild(svg);
    }

    static calcColWidth() {
        let gridColWidth = getComputedStyle(document.documentElement).getPropertyValue('--dds-grid-col-width');
        return parseFloat(gridColWidth); // Remove 'px'
    }
}

class IconCache {

    constructor(awesomeFonts) {
        this.cache = [];

        for (let i = 0, l = awesomeFonts.length; i < l; i++) {
            const icon = awesomeFonts[i];
            this.cache[icon.id] = icon;
        }
    }

    update(awesomeFonts) {
        for (let i = 0, l = awesomeFonts.length; i < l; i++) {
            const icon = awesomeFonts[i];
            if (!this.cache[icon.id]) { // Only if not in the cache...
                this.cache[icon.id] = icon;
            }
        }
    }

    getShape(id) {
        return this.cache[id];
    }
}

