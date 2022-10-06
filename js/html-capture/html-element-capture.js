/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 */

export { HtmlElementCapture };

import './html-to-image.js'; // MIT license to https://github.com/bubkoo/html-to-image

class HtmlElementCapture {
    static captureAsImage(node, htmlToImageCompleteEvent, filterCallback, styleOption) {
        const EMPTY_IMAGE = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
        // const RED_DIAG_BOX = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 60 60" width="100%" height="auto" stroke="red" stroke-linecap="round" stroke-linejoin="round" fill-rule="evenodd" stroke-width=".5"><path fill-opacity="0.14" d="M.25001.25001L50.25 50.25" stroke-dasharray="1 1.5"/><path fill-opacity="0.14" stroke-dasharray="0.5 1" d="M0 0h50.5v50.5H0z"/></svg>';

        let options = {
            imagePlaceholder: EMPTY_IMAGE,
            style: styleOption
        };

        if (typeof filterCallback === 'function') {
            options.filter = filterCallback;
        }

        htmlToImage.toPng(node, options)
            .then(function (dataUrl) {
                htmlToImageCompleteEvent(dataUrl);
            })
            .catch(function (error) {
                htmlToImageCompleteEvent('');
                // console.error('oops, something went wrong!', error);
            });
    }
}