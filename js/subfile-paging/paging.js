/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { SubfilePaging };

import { Fetch } from '../ajax/ajax-fetch.js';
import { SubfilePagingStore } from '../subfile-paging/paging-store.js';
import { Subfile } from '../subfile-paging/dom-init.js';
import { DdsGrid } from '../dds-grid.js';

const AJAX_RESPOSE_TIMEOUT = 3 * 60 * 1000; // 3 minutes

class SubfilePaging {
    static requestPage(aidKey, store, ajaxRespEventHandler) {
        const to = store.sflRecords.to;
        let adjustedPageSize = store.sflRecords.pageSize;
        let topRrn = store.current.topRrn;
        let reqFrom = -1;
        let reqTo = -1;
        let wantDropped = ! store.fldDrop.isFolded;

        switch (aidKey) {
            case 'PgDn':
                if (topRrn < to && (topRrn + adjustedPageSize) < to && (topRrn + 2 * adjustedPageSize) > (to+1) ) {
                    adjustedPageSize = to - (topRrn + adjustedPageSize);
                }

                topRrn += adjustedPageSize;

                reqFrom = topRrn;
                reqTo = reqFrom + adjustedPageSize;
                break;

            case 'PgUp':
                reqFrom = Math.max(topRrn - adjustedPageSize, 0);
                adjustedPageSize = Math.min(adjustedPageSize, topRrn - reqFrom);
                reqTo = reqFrom + adjustedPageSize;
                break;

            default:
                if (aidKey === store.fldDrop.aidKey) { // Fold/Drop (toggle) request ... same range
                    reqFrom = topRrn;
                    const linesPerRecord = store.fldDrop.isFolded ? store.fldDrop.foldLinesPerRecord : 1; // About to go to drop, more lines fit.
                    reqTo = linesPerRecord * store.sflRecords.pageSize;
                    wantDropped = store.fldDrop.isFolded ? true : false; // Request opposite
                }
                break;
        }

        const data = { 
            action: 'getRecords',
            recordName: store.name,
            requestorAidKey: aidKey, // If case no more reocords use to submit.
            from: reqFrom,
            to: reqTo,
            wantDropped: wantDropped // The toggle happens when we receive the response.
        };

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

    static createDOM_ElementsEdited(sflCtrlFormatName) {
        let sflCtrlStore = SubfilePagingStore.getSflCtlStore(sflCtrlFormatName);
        if (!sflCtrlStore || ! sflCtrlStore.sflEdits) { return; }

        let sflEl = DdsGrid.findSubfile(sflCtrlFormatName);
        if (!sflEl) { return; }

        const edits = sflCtrlStore.sflEdits;
        for (let i = 0, l = edits.length; i < l; i++) {
            for (let fieldName in edits[i].state) {
                const input = Subfile.findFieldInDOM(sflEl, fieldName);
                if (!input) {
                    const newOffPageInput = Subfile.cloneDOM_Element(fieldName, edits[i].state[fieldName]);
                    sflEl.appendChild(newOffPageInput);
                    for (let hiddenFldName in edits[i].hiddenState) {
                        const newOffPageHiddenInput = Subfile.cloneDOM_HiddenElement(hiddenFldName, edits[i].hiddenState[hiddenFldName]);
                        sflEl.appendChild(newOffPageHiddenInput);
                    }
                }
            }
        }
    }
}
