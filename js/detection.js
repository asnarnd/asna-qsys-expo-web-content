/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { BrowserInfo };

class BrowserInfo {
    static navigatorPlatform() {
        const platform = navigator.platform || navigator.userAgentData.platform;
        return platform;
    }

    static isDesktop() {
        // See: https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
        const platform = BrowserInfo.navigatorPlatform();
        if (typeof platform !== 'string' || // Not likely Mobile device
            platform === '') // FireFox - assume it runs on Desktop.
            return true;
        if (!platform.startsWith) { // Very old device, assume Desktop.
            return true;
        }
        return platform.startsWith("Win") || platform.startsWith("Mac"); // Two OS we care about.
    }
}
