/*
html-to-image.js is licensed under the MIT License.
Original work taken from: https://github.com/bubkoo/html-to-image
MIT License

Copyright (c) 2022 ASNA, Inc.

Copyright (c) 2017 W.Y. 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
export function applyStyle(node, options) {
    const { style } = node;
    if (options.backgroundColor) {
        style.backgroundColor = options.backgroundColor;
    }
    if (options.width) {
        style.width = `${options.width}px`;
    }
    if (options.height) {
        style.height = `${options.height}px`;
    }
    const manual = options.style;
    if (manual != null) {
        Object.keys(manual).forEach((key) => {
            style[key] = manual[key];
        });
    }
    return node;
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function cloneCanvasElement(canvas) {
    return __awaiter(this, void 0, void 0, function* () {
        const dataURL = canvas.toDataURL();
        if (dataURL === 'data:,') {
            return canvas.cloneNode(false);
        }
        return createImage(dataURL);
    });
}
function cloneVideoElement(video, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const poster = video.poster;
        const contentType = getMimeType(poster);
        const dataURL = yield resourceToDataURL(poster, contentType, options);
        return createImage(dataURL);
    });
}
function cloneSingleNode(node, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (node instanceof HTMLCanvasElement) {
            return cloneCanvasElement(node);
        }
        if (node instanceof HTMLVideoElement && node.poster) {
            return cloneVideoElement(node, options);
        }
        return node.cloneNode(false);
    });
}
const isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === 'SLOT';
function cloneChildren(nativeNode, clonedNode, options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const children = isSlotElement(nativeNode) && nativeNode.assignedNodes
            ? toArray(nativeNode.assignedNodes())
            : toArray(((_a = nativeNode.shadowRoot) !== null && _a !== void 0 ? _a : nativeNode).childNodes);
        if (children.length === 0 || nativeNode instanceof HTMLVideoElement) {
            return clonedNode;
        }
        yield children.reduce((deferred, child) => deferred
            .then(() => cloneNode(child, options))
            .then((clonedChild) => {
            if (clonedChild) {
                clonedNode.appendChild(clonedChild);
            }
        }), Promise.resolve());
        return clonedNode;
    });
}
function cloneCSSStyle(nativeNode, clonedNode) {
    const targetStyle = clonedNode.style;
    if (!targetStyle) {
        return;
    }
    const sourceStyle = window.getComputedStyle(nativeNode);
    if (sourceStyle.cssText) {
        targetStyle.cssText = sourceStyle.cssText;
        targetStyle.transformOrigin = sourceStyle.transformOrigin;
    }
    else {
        toArray(sourceStyle).forEach((name) => {
            let value = sourceStyle.getPropertyValue(name);
            if (name === 'font-size' && value.endsWith('px')) {
                const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
                value = `${reducedFont}px`;
            }
            targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
        });
    }
}
function cloneInputValue(nativeNode, clonedNode) {
    if (nativeNode instanceof HTMLTextAreaElement) {
        clonedNode.innerHTML = nativeNode.value;
    }
    if (nativeNode instanceof HTMLInputElement) {
        clonedNode.setAttribute('value', nativeNode.value);
    }
}
function cloneSelectValue(nativeNode, clonedNode) {
    if (nativeNode instanceof HTMLSelectElement) {
        const clonedSelect = clonedNode;
        const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute('value'));
        if (selectedOption) {
            selectedOption.setAttribute('selected', '');
        }
    }
}
function decorate(nativeNode, clonedNode) {
    if (clonedNode instanceof Element) {
        cloneCSSStyle(nativeNode, clonedNode);
        clonePseudoElements(nativeNode, clonedNode);
        cloneInputValue(nativeNode, clonedNode);
        cloneSelectValue(nativeNode, clonedNode);
    }
    return clonedNode;
}
export function cloneNode(node, options, isRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isRoot && options.filter && !options.filter(node)) {
            return null;
        }
        return Promise.resolve(node)
            .then((clonedNode) => cloneSingleNode(clonedNode, options))
            .then((clonedNode) => cloneChildren(node, clonedNode, options))
            .then((clonedNode) => decorate(node, clonedNode));
    });
}
function formatCSSText(style) {
    const content = style.getPropertyValue('content');
    return `${style.cssText} content: '${content.replace(/'|"/g, '')}';`;
}
function formatCSSProperties(style) {
    return toArray(style)
        .map((name) => {
        const value = style.getPropertyValue(name);
        const priority = style.getPropertyPriority(name);
        return `${name}: ${value}${priority ? ' !important' : ''};`;
    })
        .join(' ');
}
function getPseudoElementStyle(className, pseudo, style) {
    const selector = `.${className}:${pseudo}`;
    const cssText = style.cssText
        ? formatCSSText(style)
        : formatCSSProperties(style);
    return document.createTextNode(`${selector}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo) {
    const style = window.getComputedStyle(nativeNode, pseudo);
    const content = style.getPropertyValue('content');
    if (content === '' || content === 'none') {
        return;
    }
    const className = uuid();
    try {
        clonedNode.className = `${clonedNode.className} ${className}`;
    }
    catch (err) {
        return;
    }
    const styleElement = document.createElement('style');
    styleElement.appendChild(getPseudoElementStyle(className, pseudo, style));
    clonedNode.appendChild(styleElement);
}
export function clonePseudoElements(nativeNode, clonedNode) {
    clonePseudoElement(nativeNode, clonedNode, ':before');
    clonePseudoElement(nativeNode, clonedNode, ':after');
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function getContentFromDataUrl(dataURL) {
    return dataURL.split(/,/)[1];
}
export function isDataUrl(url) {
    return url.search(/^(data:)/) !== -1;
}
export function makeDataUrl(content, mimeType) {
    return `data:${mimeType};base64,${content}`;
}
export function fetchAsDataURL(url, init, process) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(url, init);
        if (res.status === 404) {
            throw new Error(`Resource "${res.url}" not found`);
        }
        const blob = yield res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onloadend = () => {
                try {
                    resolve(process({ res, result: reader.result }));
                }
                catch (error) {
                    reject(error);
                }
            };
            reader.readAsDataURL(blob);
        });
    });
}
const cache = {};
function getCacheKey(url, contentType, includeQueryParams) {
    let key = url.replace(/\?.*/, '');
    if (includeQueryParams) {
        key = url;
    }
    // font resource
    if (/ttf|otf|eot|woff2?/i.test(key)) {
        key = key.replace(/.*\//, '');
    }
    return contentType ? `[${contentType}]${key}` : key;
}
export function resourceToDataURL(resourceUrl, contentType, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
        if (cache[cacheKey] != null) {
            return cache[cacheKey];
        }
        // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
        if (options.cacheBust) {
            // eslint-disable-next-line no-param-reassign
            resourceUrl += (/\?/.test(resourceUrl) ? '&' : '?') + new Date().getTime();
        }
        let dataURL;
        try {
            const content = yield fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
                if (!contentType) {
                    // eslint-disable-next-line no-param-reassign
                    contentType = res.headers.get('Content-Type') || '';
                }
                return getContentFromDataUrl(result);
            });
            dataURL = makeDataUrl(content, contentType);
        }
        catch (error) {
            dataURL = options.imagePlaceholder || '';
            let msg = `Failed to fetch resource: ${resourceUrl}`;
            if (error) {
                msg = typeof error === 'string' ? error : error.message;
            }
            if (msg) {
                console.warn(msg);
            }
        }
        cache[cacheKey] = dataURL;
        return dataURL;
    });
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function embedBackground(clonedNode, options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const background = (_a = clonedNode.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue('background');
        if (background) {
            const cssString = yield embedResources(background, null, options);
            clonedNode.style.setProperty('background', cssString, clonedNode.style.getPropertyPriority('background'));
        }
    });
}
function embedImageNode(clonedNode, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(clonedNode instanceof HTMLImageElement && !isDataUrl(clonedNode.src)) &&
            !(clonedNode instanceof SVGImageElement &&
                !isDataUrl(clonedNode.href.baseVal))) {
            return;
        }
        const url = clonedNode instanceof HTMLImageElement
            ? clonedNode.src
            : clonedNode.href.baseVal;
        const dataURL = yield resourceToDataURL(url, getMimeType(url), options);
        yield new Promise((resolve, reject) => {
            clonedNode.onload = resolve;
            clonedNode.onerror = reject;
            if (clonedNode instanceof HTMLImageElement) {
                clonedNode.srcset = '';
                clonedNode.src = dataURL;
            }
            else {
                clonedNode.href.baseVal = dataURL;
            }
        });
    });
}
function embedChildren(clonedNode, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const children = toArray(clonedNode.childNodes);
        const deferreds = children.map((child) => embedImages(child, options));
        yield Promise.all(deferreds).then(() => clonedNode);
    });
}
export function embedImages(clonedNode, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (clonedNode instanceof Element) {
            yield embedBackground(clonedNode, options);
            yield embedImageNode(clonedNode, options);
            yield embedChildren(clonedNode, options);
        }
    });
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
const URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
const FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function toRegex(url) {
    // eslint-disable-next-line no-useless-escape
    const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
    return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, 'g');
}
export function parseURLs(cssText) {
    const urls = [];
    cssText.replace(URL_REGEX, (raw, quotation, url) => {
        urls.push(url);
        return raw;
    });
    return urls.filter((url) => !isDataUrl(url));
}
export function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
            const contentType = getMimeType(resourceURL);
            let dataURL;
            if (getContentFromUrl) {
                const content = yield getContentFromUrl(resolvedURL);
                dataURL = makeDataUrl(content, contentType);
            }
            else {
                dataURL = yield resourceToDataURL(resolvedURL, contentType, options);
            }
            return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
        }
        catch (error) {
            // pass
        }
        return cssText;
    });
}
function filterPreferredFontFormat(str, { preferredFontFormat }) {
    return !preferredFontFormat
        ? str
        : str.replace(FONT_SRC_REGEX, (match) => {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
                if (!format) {
                    return '';
                }
                if (format === preferredFontFormat) {
                    return `src: ${src};`;
                }
            }
        });
}
export function shouldEmbed(url) {
    return url.search(URL_REGEX) !== -1;
}
export function embedResources(cssText, baseUrl, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!shouldEmbed(cssText)) {
            return cssText;
        }
        const filteredCSSText = filterPreferredFontFormat(cssText, options);
        const urls = parseURLs(filteredCSSText);
        return urls.reduce((deferred, url) => deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
    });
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cssFetchCache = {};
function fetchCSS(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let cache = cssFetchCache[url];
        if (cache != null) {
            return cache;
        }
        const res = yield fetch(url);
        const cssText = yield res.text();
        cache = { url, cssText };
        cssFetchCache[url] = cache;
        return cache;
    });
}
function embedFonts(data, options) {
    return __awaiter(this, void 0, void 0, function* () {
        let cssText = data.cssText;
        const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
        const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
        const loadFonts = fontLocs.map((loc) => __awaiter(this, void 0, void 0, function* () {
            let url = loc.replace(regexUrl, '$1');
            if (!url.startsWith('https://')) {
                url = new URL(url, data.url).href;
            }
            return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
                cssText = cssText.replace(loc, `url(${result})`);
                return [loc, result];
            });
        }));
        return Promise.all(loadFonts).then(() => cssText);
    });
}
function parseCSS(source) {
    if (source == null) {
        return [];
    }
    const result = [];
    const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
    // strip out comments
    let cssText = source.replace(commentsRegex, '');
    // eslint-disable-next-line prefer-regex-literals
    const keyframesRegex = new RegExp('((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})', 'gi');
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const matches = keyframesRegex.exec(cssText);
        if (matches === null) {
            break;
        }
        result.push(matches[0]);
    }
    cssText = cssText.replace(keyframesRegex, '');
    const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
    // to match css & media queries together
    const combinedCSSRegex = '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]' +
        '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})';
    // unified regex
    const unifiedRegex = new RegExp(combinedCSSRegex, 'gi');
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let matches = importRegex.exec(cssText);
        if (matches === null) {
            matches = unifiedRegex.exec(cssText);
            if (matches === null) {
                break;
            }
            else {
                importRegex.lastIndex = unifiedRegex.lastIndex;
            }
        }
        else {
            unifiedRegex.lastIndex = importRegex.lastIndex;
        }
        result.push(matches[0]);
    }
    return result;
}
function getCSSRules(styleSheets, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = [];
        const deferreds = [];
        // First loop inlines imports
        styleSheets.forEach((sheet) => {
            if ('cssRules' in sheet) {
                try {
                    toArray(sheet.cssRules || []).forEach((item, index) => {
                        if (item.type === CSSRule.IMPORT_RULE) {
                            let importIndex = index + 1;
                            const url = item.href;
                            const deferred = fetchCSS(url)
                                .then((metadata) => embedFonts(metadata, options))
                                .then((cssText) => parseCSS(cssText).forEach((rule) => {
                                try {
                                    sheet.insertRule(rule, rule.startsWith('@import')
                                        ? (importIndex += 1)
                                        : sheet.cssRules.length);
                                }
                                catch (error) {
                                    console.error('Error inserting rule from remote css', {
                                        rule,
                                        error,
                                    });
                                }
                            }))
                                .catch((e) => {
                                console.error('Error loading remote css', e.toString());
                            });
                            deferreds.push(deferred);
                        }
                    });
                }
                catch (e) {
                    const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
                    if (sheet.href != null) {
                        deferreds.push(fetchCSS(sheet.href)
                            .then((metadata) => embedFonts(metadata, options))
                            .then((cssText) => parseCSS(cssText).forEach((rule) => {
                            inline.insertRule(rule, sheet.cssRules.length);
                        }))
                            .catch((err) => {
                            console.error('Error loading remote stylesheet', err.toString());
                        }));
                    }
                    console.error('Error inlining remote css file', e.toString());
                }
            }
        });
        return Promise.all(deferreds).then(() => {
            // Second loop parses rules
            styleSheets.forEach((sheet) => {
                if ('cssRules' in sheet) {
                    try {
                        toArray(sheet.cssRules || []).forEach((item) => {
                            ret.push(item);
                        });
                    }
                    catch (e) {
                        console.error(`Error while reading CSS rules from ${sheet.href}`, e.toString());
                    }
                }
            });
            return ret;
        });
    });
}
function getWebFontRules(cssRules) {
    return cssRules
        .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
        .filter((rule) => shouldEmbed(rule.style.getPropertyValue('src')));
}
function parseWebFontRules(node, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (node.ownerDocument == null) {
            throw new Error('Provided element is not within a Document');
        }
        const styleSheets = toArray(node.ownerDocument.styleSheets);
        const cssRules = yield getCSSRules(styleSheets, options);
        return getWebFontRules(cssRules);
    });
}
export function getWebFontCSS(node, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const rules = yield parseWebFontRules(node, options);
        const cssTexts = yield Promise.all(rules.map((rule) => {
            const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
            return embedResources(rule.cssText, baseUrl, options);
        }));
        return cssTexts.join('\n');
    });
}
export function embedWebFonts(clonedNode, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const cssText = options.fontEmbedCSS != null
            ? options.fontEmbedCSS
            : options.skipFonts
                ? null
                : yield getWebFontCSS(clonedNode, options);
        if (cssText) {
            const styleNode = document.createElement('style');
            const sytleContent = document.createTextNode(cssText);
            styleNode.appendChild(sytleContent);
            if (clonedNode.firstChild) {
                clonedNode.insertBefore(styleNode, clonedNode.firstChild);
            }
            else {
                clonedNode.appendChild(styleNode);
            }
        }
    });
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function toSvg(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { width, height } = getImageSize(node, options);
        const clonedNode = (yield cloneNode(node, options, true));
        yield embedWebFonts(clonedNode, options);
        yield embedImages(clonedNode, options);
        applyStyle(clonedNode, options);
        const datauri = yield nodeToDataURL(clonedNode, width, height);
        return datauri;
    });
}
export function toCanvas(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { width, height } = getImageSize(node, options);
        const svg = yield toSvg(node, options);
        const img = yield createImage(svg);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const ratio = options.pixelRatio || getPixelRatio();
        const canvasWidth = options.canvasWidth || width;
        const canvasHeight = options.canvasHeight || height;
        canvas.width = canvasWidth * ratio;
        canvas.height = canvasHeight * ratio;
        if (!options.skipAutoScale) {
            checkCanvasDimensions(canvas);
        }
        canvas.style.width = `${canvasWidth}`;
        canvas.style.height = `${canvasHeight}`;
        if (options.backgroundColor) {
            context.fillStyle = options.backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas;
    });
}
export function toPixelData(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { width, height } = getImageSize(node, options);
        const canvas = yield toCanvas(node, options);
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, width, height).data;
    });
}
export function toPng(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = yield toCanvas(node, options);
        return canvas.toDataURL();
    });
}
export function toJpeg(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = yield toCanvas(node, options);
        return canvas.toDataURL('image/jpeg', options.quality || 1);
    });
}
export function toBlob(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = yield toCanvas(node, options);
        const blob = yield canvasToBlob(canvas);
        return blob;
    });
}
export function getFontEmbedCSS(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return getWebFontCSS(node, options);
    });
}
const WOFF = 'application/font-woff';
const JPEG = 'image/jpeg';
const mimes = {
    woff: WOFF,
    woff2: WOFF,
    ttf: 'application/font-truetype',
    eot: 'application/vnd.ms-fontobject',
    png: 'image/png',
    jpg: JPEG,
    jpeg: JPEG,
    gif: 'image/gif',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
};
function getExtension(url) {
    const match = /\.([^./]*?)$/g.exec(url);
    return match ? match[1] : '';
}
export function getMimeType(url) {
    const extension = getExtension(url).toLowerCase();
    return mimes[extension] || '';
}
export {};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function resolveUrl(url, baseUrl) {
    // url is absolute already
    if (url.match(/^[a-z]+:\/\//i)) {
        return url;
    }
    // url is absolute already, without protocol
    if (url.match(/^\/\//)) {
        return window.location.protocol + url;
    }
    // dataURI, mailto:, tel:, etc.
    if (url.match(/^[a-z]+:/i)) {
        return url;
    }
    const doc = document.implementation.createHTMLDocument();
    const base = doc.createElement('base');
    const a = doc.createElement('a');
    doc.head.appendChild(base);
    doc.body.appendChild(a);
    if (baseUrl) {
        base.href = baseUrl;
    }
    a.href = url;
    return a.href;
}
export const uuid = (() => {
    // generate uuid for className of pseudo elements.
    // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
    let counter = 0;
    // ref: http://stackoverflow.com/a/6248722/2519373
    const random = () => 
    // eslint-disable-next-line no-bitwise
    `0000${((Math.random() * Math.pow(36, 4)) << 0).toString(36)}`.slice(-4);
    return () => {
        counter += 1;
        return `u${random()}${counter}`;
    };
})();
export function delay(ms) {
    return (args) => new Promise((resolve) => {
        setTimeout(() => resolve(args), ms);
    });
}
export function toArray(arrayLike) {
    const arr = [];
    for (let i = 0, l = arrayLike.length; i < l; i++) {
        arr.push(arrayLike[i]);
    }
    return arr;
}
function px(node, styleProperty) {
    const win = node.ownerDocument.defaultView || window;
    const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
    return val ? parseFloat(val.replace('px', '')) : 0;
}
function getNodeWidth(node) {
    const leftBorder = px(node, 'border-left-width');
    const rightBorder = px(node, 'border-right-width');
    return node.clientWidth + leftBorder + rightBorder;
}
function getNodeHeight(node) {
    const topBorder = px(node, 'border-top-width');
    const bottomBorder = px(node, 'border-bottom-width');
    return node.clientHeight + topBorder + bottomBorder;
}
export function getImageSize(targetNode, options = {}) {
    const width = options.width || getNodeWidth(targetNode);
    const height = options.height || getNodeHeight(targetNode);
    return { width, height };
}
export function getPixelRatio() {
    let ratio;
    let FINAL_PROCESS;
    try {
        FINAL_PROCESS = process;
    }
    catch (e) {
        // pass
    }
    const val = FINAL_PROCESS && FINAL_PROCESS.env
        ? FINAL_PROCESS.env.devicePixelRatio
        : null;
    if (val) {
        ratio = parseInt(val, 10);
        if (Number.isNaN(ratio)) {
            ratio = 1;
        }
    }
    return ratio || window.devicePixelRatio || 1;
}
// @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
const canvasDimensionLimit = 16384;
export function checkCanvasDimensions(canvas) {
    if (canvas.width > canvasDimensionLimit ||
        canvas.height > canvasDimensionLimit) {
        if (canvas.width > canvasDimensionLimit &&
            canvas.height > canvasDimensionLimit) {
            if (canvas.width > canvas.height) {
                canvas.height *= canvasDimensionLimit / canvas.width;
                canvas.width = canvasDimensionLimit;
            }
            else {
                canvas.width *= canvasDimensionLimit / canvas.height;
                canvas.height = canvasDimensionLimit;
            }
        }
        else if (canvas.width > canvasDimensionLimit) {
            canvas.height *= canvasDimensionLimit / canvas.width;
            canvas.width = canvasDimensionLimit;
        }
        else {
            canvas.width *= canvasDimensionLimit / canvas.height;
            canvas.height = canvasDimensionLimit;
        }
    }
}
export function canvasToBlob(canvas, options = {}) {
    if (canvas.toBlob) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, options.type ? options.type : 'image/png', options.quality ? options.quality : 1);
        });
    }
    return new Promise((resolve) => {
        const binaryString = window.atob(canvas
            .toDataURL(options.type ? options.type : undefined, options.quality ? options.quality : undefined)
            .split(',')[1]);
        const len = binaryString.length;
        const binaryArray = new Uint8Array(len);
        for (let i = 0; i < len; i += 1) {
            binaryArray[i] = binaryString.charCodeAt(i);
        }
        resolve(new Blob([binaryArray], {
            type: options.type ? options.type : 'image/png',
        }));
    });
}
export function createImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.crossOrigin = 'anonymous';
        img.decoding = 'sync';
        img.src = url;
    });
}
export function svgToDataURL(svg) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve()
            .then(() => new XMLSerializer().serializeToString(svg))
            .then(encodeURIComponent)
            .then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
    });
}
export function nodeToDataURL(node, width, height) {
    return __awaiter(this, void 0, void 0, function* () {
        const xmlns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(xmlns, 'svg');
        const foreignObject = document.createElementNS(xmlns, 'foreignObject');
        svg.setAttribute('width', `${width}`);
        svg.setAttribute('height', `${height}`);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        foreignObject.setAttribute('width', '100%');
        foreignObject.setAttribute('height', '100%');
        foreignObject.setAttribute('x', '0');
        foreignObject.setAttribute('y', '0');
        foreignObject.setAttribute('externalResourcesRequired', 'true');
        svg.appendChild(foreignObject);
        foreignObject.appendChild(node);
        return svgToDataURL(svg);
    });
}
