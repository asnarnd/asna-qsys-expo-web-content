/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { Fetch };

class Fetch {

    static fetchWithTimeout(url, data, timeout) {
        return new Promise((resolve, reject) => {
            // Set timeout timer
            let timer = setTimeout(
                () => reject(new Error('Request timed out')),
                timeout
            );

            const aspNetReqVerElements = document.getElementsByName('__RequestVerificationToken'); // ASP.NET Anti-forgery Token
            let aspNetReqVerificationValue = '';
            if (aspNetReqVerElements && aspNetReqVerElements.length>0) {
                aspNetReqVerificationValue = aspNetReqVerElements[0].value;
            }

            fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': aspNetReqVerificationValue
                },
                body: JSON.stringify(data)
            }).then(
                response => resolve(response),
                err => reject(err)
            ).finally(() => clearTimeout(timer));
        });
    }
}

