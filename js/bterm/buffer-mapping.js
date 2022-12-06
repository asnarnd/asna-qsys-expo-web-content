/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { BufferMapping };

class BufferMapping {
    constructor(_5250cols) {
        this._5250cols = _5250cols;
    }
    coordToPos(row, col) {
        return col + row * this._5250cols;
    }

    rowFromPos(pos) {
        return pos / this._5250cols >> 0;  // Integer division  
    }

    colFromPos(pos) {
        return pos % this._5250cols >> 0; // Integer modulo
    }
    static rowToPixel(row, termLayout) {
        return row * termLayout._5250.cursor.h;
    }
    static colToPixel(col, termLayout) {
        return col * termLayout._5250.cursor.w;
    }
}

