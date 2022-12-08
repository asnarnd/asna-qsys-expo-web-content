/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { Fetch };

const JOB_HANDLE_KEY = 'JobHandle';
const HIDDEN_FIELD_NAME = {
    JOB_HANDLE = '__ASNA_JobHandle__',
    ASP_NET_ANTI_FORGERY_TOKEN = '__RequestVerificationToken'
};

class Fetch {

    static fetchWithTimeout(url, data, timeout) {
        return new Promise((resolve, reject) => {
            // Set timeout timer
            const timer = setTimeout(
                () => reject(new Error('Request timed out')),
                timeout
            );

            url = Fetch.addJobHandle(url);
            fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': Fetch.getHiddenFieldValue(HIDDEN_FIELD_NAME.ASP_NET_ANTI_FORGERY_TOKEN)
                },
                body: JSON.stringify(data)
            }).then(
                response => resolve(response),
                err => reject(err)
            ).finally(() => clearTimeout(timer));
        });
    }

    static getHiddenFieldValue(fieldName) {
        const fields = document.getElementsByName(fieldName);
        if (fields && fields.length > 0) {
            return fields[0].value;
        }
        return '';
    }

    static addJobHandle(url) {
        if (url.search(`${JOB_HANDLE_KEY}=`) > 0)
            return url;

        const jobHandle = Fetch.getHiddenFieldValue(HIDDEN_FIELD_NAME.JOB_HANDLE);
        if (!jobHandle) {
            return url;
        }

        const queryKeyVal = `${JOB_HANDLE_KEY}=${jobHandle}`;

        url = url.replace(/#$/, '');

        if (url.search(/\\?/) > 0) {
            return url + '&' + queryKeyVal;
        }

        return url + '?' + queryKeyVal;
    }
}

