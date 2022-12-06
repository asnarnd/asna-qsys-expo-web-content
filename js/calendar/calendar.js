/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theCalendar as Calendar };

import { CalendarUI } from './calendar-ui.js';
import { Base64 } from '../base-64.js';

class Calendar {

    constructor() {
        this.localDays = [];
        this.localMonths = [];

        this.handleCalendarOnClickEvent = this.handleCalendarOnClickEvent.bind(this);
    }

    setLocalNames(encAbbrevDaysAndMonths) {
        const jsonStr = Base64.decode(encAbbrevDaysAndMonths);
        const init = JSON.parse(jsonStr);

        if (init.abbrevDayNames.length > 0) {
            this.localDays = init.abbrevDayNames;
        }

        if (init.abbrevMonthNames.length > 1) {
            this.localMonths = init.abbrevMonthNames;
        }
    }

    isLocalNamesComplete() {
        return this.localDays.length === 7 && this.localMonths.length === 12;
    }

    wrap(el, wrapper) {
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
    }

    wrapInputWithCalButtonSibling(form, input, encOptions) {
        const jsonStr = Base64.decode(encOptions);
        const options = JSON.parse(jsonStr);

        this.form = form;
        const inputOldStyle = {
            width: input.style.width,
            gridColumn: input.style.gridColumn
        };

        input.removeAttribute('style');
        input.style.width = inputOldStyle.width;

        const wrapper = document.createElement('span');
        wrapper.style.gridColumn = inputOldStyle.gridColumn;
        this.wrap(input, wrapper);

        const button = CalendarUI.createIconButton();
        wrapper.appendChild(button);
        button.addEventListener('click', (event) => { this.handleCalendarOnClickEvent(event, input, options); return false; });
    }

    show(input, options) {
        if (!this.isLocalNamesComplete) {
            return;
        }
        if (options && typeof options.firstDayOfWeek !== 'undefined' && options.dateFormat) {
            CalendarUI.show(this.form, input, this.localDays, this.localMonths, options.firstDayOfWeek, options.dateFormat);
        }
    }

    handleCalendarOnClickEvent(event, input, options) {
        this.show(input, options);
    }
}

async function loadCalendarStyles(stylesheets) {
    let arr = await Promise.all(stylesheets.map(url => fetch(url)));

    arr = await Promise.all(arr.map(url => url.text()));

    const style = document.createElement('style');

    style.textContent = arr.reduce((prev, fileContents) => prev + fileContents, '');

    document.head.appendChild(style);
}

const theCalendar = new Calendar();
loadCalendarStyles(['../lib/asna-expo/js/calendar/calendar.css']);

