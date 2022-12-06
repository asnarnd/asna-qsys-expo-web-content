/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { MouseEvents, PointerEvents };

class MouseEvents {
    constructor() {
    }

    addEventListener(eventTarget, handleStart, handleMove, handleEnd) {
        if (handleStart) {
            eventTarget.addEventListener('mousedown', handleStart, false);
        }
        if (handleMove) {
            eventTarget.addEventListener('mousemove', handleMove, false);
        }
        if (handleEnd) {
            eventTarget.addEventListener('mouseup', handleEnd, false);
        }
    }

    removeEventListener(eventTarget, handleStart, handleMove, handleEnd) {
        if (handleStart) {
            eventTarget.removeEventListener('mousedown', handleStart, false);
        }
        if (handleMove) {
            eventTarget.removeEventListener('mousemove', handleMove, false);
        }
        if (handleEnd) {
            eventTarget.removeEventListener('mouseup', handleEnd, false);
        }
    }
}

class PointerEvents {
    constructor() {
    }

    addEventListener(eventTarget, handleStart, handleMove, handleEnd, handleCancel) {
    }

    removeEventListener(eventTarget, handleStart, handleMove, handleEnd, handleCancel) {
    }
}