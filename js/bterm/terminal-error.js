/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { ErrorCondition };

import { Screen, ScreenAttr, ScreenAttrEntry } from './terminal-screen.js';

class ErrorCondition {

    constructor() {
        this.savedScreen = null;
    }

    hasSavedScreen() {
        return this.savedScreen;
    }

    saveLastScreenRow(regScr) {
        this.savedScreen = null;
        if (!regScr) { return; }

        this.fromPos = regScr.coordToPos(regScr.size.rows - 1, 0);
        this.rowLength = regScr.size.cols;
        this.savedScreen = new Screen(1, regScr.size.cols, regScr.size.msgLight);

        for (let posDest = 0, posOrig = this.fromPos; posDest < this.rowLength; posDest++, posOrig++) {
            this.savedScreen.buffer[posDest] = regScr.buffer[posOrig];

            let newSa = null;
            const sa = regScr.attrMap[posOrig].screenAttr;

            if (sa) {
                newSa = new ScreenAttr(sa.color, sa.reverse, sa.underscore, sa.blink, sa.nonDisp, sa.colSep);
            }

            this.savedScreen.attrMap[posDest] = new ScreenAttrEntry(regScr.attrMap[posOrig].usage, newSa, regScr.attrMap[posOrig].field);
        }
    }

    restoreLastScreenRow(regScr) {
        this.overlapLastScreenRow(regScr, this.savedScreen);
    }

    overlapLastScreenRow(regScr, otherScr) {
        if (!regScr || !otherScr) {
            return;
        }

        for (let posOrig = 0, posDest = this.fromPos; posOrig < this.rowLength; posDest++, posOrig++) {
            regScr.buffer[posDest] = otherScr.buffer[posOrig];

            const sa = otherScr.attrMap[posOrig].screenAttr;
            var newSa = null;

            if (sa) {
                newSa = new ScreenAttr(sa.color, sa.reverse, sa.underscore, sa.blink, sa.nonDisp, sa.colSep);
            }

            regScr.attrMap[posDest] = new ScreenAttrEntry(otherScr.attrMap[posOrig].usage, newSa, otherScr.attrMap[posOrig].field);
        }
    }
}