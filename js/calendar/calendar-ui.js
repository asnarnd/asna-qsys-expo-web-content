/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { theCalendarUI as CalendarUI };

/*eslint-disable*/
import { IbmDate } from './ibm-date.js';
import { DomEvents } from '../dom-events.js';
import { Kbd } from '../kbd.js';
/*eslint-enable*/

const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;
const MAX_WEEKS = 6;
const TOP_ROW_DRAG_BAR = 5;
const TITLE_COL_SPAN = 3;
const BLANK = ' ';

const ICON_CALENDAR = `
<svg viewBox="0 -256 1850 1850" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" >
<g transform="matrix(1 0 0 -1 91.119 1297.9)">
<path fill="currentColor" d="m128-128h288v288h-288v-288zm352 0h320v288h-320v-288zm-352 352h288v320h-288v-320zm352 0h320v320h-320v-320zm-352 384h288v288h-288v-288zm736-736h320v288h-320v-288zm-384 736h320v288h-320v-288zm768-736h288v288h-288v-288zm-384 352h320v320h-320v-320zm-352 864v288q0 13-9.5 22.5t-22.5 9.5h-64q-13 0-22.5-9.5t-9.5-22.5v-288q0-13 9.5-22.5t22.5-9.5h64q13 0 22.5 9.5t9.5 22.5zm736-864h288v320h-288v-320zm-384 384h320v288h-320v-288zm384 0h288v288h-288v-288zm32 480v288q0 13-9.5 22.5t-22.5 9.5h-64q-13 0-22.5-9.5t-9.5-22.5v-288q0-13 9.5-22.5t22.5-9.5h64q13 0 22.5 9.5t9.5 22.5zm384 64v-1280q0-52-38-90t-90-38h-1408q-52 0-90 38t-38 90v1280q0 52 38 90t90 38h128v96q0 66 47 113t113 47h64q66 0 113-47t47-113v-96h384v96q0 66 47 113t113 47h64q66 0 113-47t47-113v-96h128q52 0 90-38t38-90z"></path>
</g>
</svg>`;

const ICON_GO_TODAY = `
<svg style="height: 100%" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="M1303 964l-512 512q-10 9-23 9t-23-9l-288-288q-9-10-9-23t9-22l46-46q9-9 22-9t23 9l220 220 444-444q10-9 23-9t22 9l46 46q9 9 9 22t-9 23zm-1175 700h1408v-1024h-1408v1024zm384-1216v-288q0-14-9-23t-23-9h-64q-14 0-23 9t-9 23v288q0 14 9 23t23 9h64q14 0 23-9t9-23zm768 0v-288q0-14-9-23t-23-9h-64q-14 0-23 9t-9 23v288q0 14 9 23t23 9h64q14 0 23-9t9-23zm384-64v1280q0 52-38 90t-90 38h-1408q-52 0-90-38t-38-90v-1280q0-52 38-90t90-38h128v-96q0-66 47-113t113-47h64q66 0 113 47t47 113v96h384v-96q0-66 47-113t113-47h64q66 0 113 47t47 113v96h128q52 0 90 38t38 90z"/>
</svg>`;

const ICON_CLOSE = `
<svg style="height: 100%"  viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/>
</svg>`;

const ICON_PREV_YEAR = `
<span class="calendar-nav-image">
<svg style="height: 100%" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="M1683 141q19-19 32-13t13 32v1472q0 26-13 32t-32-13l-710-710q-9-9-13-19v710q0 26-13 32t-32-13l-710-710q-19-19-19-45t19-45l710-710q19-19 32-13t13 32v710q4-10 13-19z"/>
</svg>
</span>`;

const ICON_PREV_MONTH = `
<span class="calendar-nav-image-larger">
<svg style="height: 100%" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="M1216 448v896q0 26-19 45t-45 19-45-19l-448-448q-19-19-19-45t19-45l448-448q19-19 45-19t45 19 19 45z "/>
</svg>
</span>`;

const ICON_NEXT_MONTH = `
<span class="calendar-nav-image-larger">
<svg style="height: 100%" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="M1152 896q0 26-19 45l-448 448q-19 19-45 19t-45-19-19-45v-896q0-26 19-45t45-19 45 19l448 448q19 19 19 45z"/>
</svg>
</span>`;

const ICON_NEXT_YEAR = `
<span class="calendar-nav-image">
<svg style="height: 100%" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="M109 1651q-19 19-32 13t-13-32v-1472q0-26 13-32t32 13l710 710q9 9 13 19v-710q0-26 13-32t32 13l710 710q19 19 19 45t-19 45l-710 710q-19 19-32 13t-13-32v-710q-4 10-13 19z "/>
</svg>
</span>`;

class CalendarUI {
    constructor() {
        // Other fields are created dynamically by function show ...
        this.dateFmt = 'ISO';
        this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        this.calMap = this.emptyCalMap();

        this.date = null;

        this.calendarContainerElement = null;
        this.calendarTableElement = null;
        this.calendarTitleElement = null;
        this.calendarDaysInMonthTableBodyElement = null;

        this.handleCloseCalendarMouseDownEvent = this.handleCloseCalendarMouseDownEvent.bind(this);
        this.handleGotoTodayMouseDownEvent = this.handleGotoTodayMouseDownEvent.bind(this);

        this.handleCalendarBlurEvent = this.handleCalendarBlurEvent.bind(this);

        this.handlePrevMonthMouseDownEvent = this.handlePrevMonthMouseDownEvent.bind(this);
        this.handleNextMonthMouseDownEvent = this.handleNextMonthMouseDownEvent.bind(this);
        this.handlePrevYearMouseDownEvent = this.handlePrevYearMouseDownEvent.bind(this);
        this.handleNextYearMouseDownEvent = this.handleNextYearMouseDownEvent.bind(this);

        this.handleDateCellMouseDownEvent = this.handleDateCellMouseDownEvent.bind(this);

        this.handleDocumentKeyDownEvent = this.handleDocumentKeyDownEvent.bind(this);
        this.handleDocumentMouseDownEvent = this.handleDocumentMouseDownEvent.bind(this);

        this.handleDragStartEvent = this.handleDragStartEvent.bind(this);
        this.handleDragOverEvent = this.handleDragOverEvent.bind(this);
        this.handleDragEndEvent = this.handleDragEndEvent.bind(this);
    }

    show(form, input, localDays, localMonths, firstDayOfWeek, dateFormat) {
        if (!input.getBoundingClientRect) { // Required to position the calendar ...
            return;
        }
        const date = IbmDate.textToDate(dateFormat, input.value);

        this.initialize(form, input, date, dateFormat, localDays, localMonths, firstDayOfWeek);
        this.showUI(input.getBoundingClientRect());
    }

    hide() {
        const elFocus = this.input;

        this.removeDOM_elements();

        document.removeEventListener('keydown', this.handleDocumentKeyDownEvent);
        document.removeEventListener('mousedown', this.handleDocumentMouseDownEvent);
        document.removeEventListener('dragover', this.handleDragOverEvent);

        this.date = null;

        if (elFocus) {
            let timerID = setTimeout(function () {
                if (timerID) {
                    clearTimeout(timerID);
                    timerID = null;
                }
                elFocus.focus();
            }, 100);   // Delay operation needed for Firefox, Chrome ...
        }
    }

    initialize(form, input, date, dateFmt, localDays, localMonths, firstDayOfWeek) {
        this.form = form;
        this.input = input;
        this.date = date;
        this.year = date.getFullYear();
        this.month = date.getMonth();
        this.day = date.getDate();
        this.fday = firstDayOfWeek;

        if (dateFmt) {
            this.dateFmt = dateFmt;
        }

        if (localDays) {
            this.dayNames = localDays.slice(); // Make a copy, may be modified.
        }

        if (localMonths) {
            this.monthNames = localMonths;
        }

        this.date = IbmDate.createDate(this.day, this.month, this.year);

        this.monthDisplayed = this.date.getMonth();
        this.yearDisplayed = this.date.getFullYear();
        this.dayDisplayed = this.date.getDate();
        this.firstWeekDay = this.fday;

        this.setDaysOrder(this.firstWeekDay);

        this.createDOM_elements();

        let hiddenInput = this.form.__atKMap__;
        this.aidKeyBitmap = hiddenInput ? hiddenInput.value : '';

        document.addEventListener('keydown', this.handleDocumentKeyDownEvent, false);
        document.addEventListener('mousedown', this.handleDocumentMouseDownEvent, false);
    }

    updateInput() {
        if (!this.input) {
            return;
        }

        this.input.value = IbmDate.dateToText(this.date, this.dateFmt);
    }

    setDaysOrder(firstDay) {
        if (isNaN(firstDay) || !this.dayNames || this.dayNames.length !== DAYS_IN_WEEK)
            return;
        if (firstDay >= 0 && firstDay <= DAYS_IN_WEEK-1 ) {
            for (let i = 0; i < firstDay; i++) {
                this.dayNames.push(this.dayNames.shift());
            }
        }
    }

    createIconButton() {
        const calButton = document.createElement('button');
        calButton.className = 'calendar-button';
        calButton.setAttribute('type', 'button');

        calButton.innerHTML = ICON_CALENDAR;

        return calButton;
    }

    createDOM_elements() {
        this.calendarTableElement = document.createElement('table');
        this.calendarTableElement.className = 'calendar-table';

        this.calendarContainerElement = document.createElement('div');
        this.calendarContainerElement.tabIndex = '0';
        this.calendarContainerElement.style.position = 'absolute';
        this.calendarContainerElement.style.display = 'none';
        this.calendarContainerElement.style.zIndex = this.calcMaxZindex() + 1;
        this.calendarContainerElement.appendChild(this.calendarTableElement);

        this.calendarContainerElement.addEventListener('blur', (event) => { this.handleCalendarBlurEvent(event); return false; });
        
        const tableHead = document.createElement('thead');

        const topRow = document.createElement('tr');
        topRow.className = 'calendar-top-row';

        const todayGotoToday = document.createElement('td');
        todayGotoToday.className = 'calendar-goto-today';
        todayGotoToday.innerHTML = ICON_GO_TODAY;
        todayGotoToday.addEventListener('mousedown', (event) => { this.handleGotoTodayMouseDownEvent(event); return false; });

        topRow.appendChild(todayGotoToday);
        this.dragBar = document.createElement('td');
        this.dragBar.className = 'calendar-drag-bar';
        this.dragBar.colSpan = TOP_ROW_DRAG_BAR;
        this.calendarContainerElement.setAttribute('draggable', 'true');

        this.calendarContainerElement.addEventListener('dragstart', this.handleDragStartEvent, false);
        document.addEventListener('dragover', this.handleDragOverEvent, false);
        this.calendarContainerElement.addEventListener('dragend', this.handleDragEndEvent, false);

        topRow.appendChild(this.dragBar);

        const closeCalendar = document.createElement('td');
        closeCalendar.className = 'calendar-close';
        closeCalendar.innerHTML = ICON_CLOSE;
        closeCalendar.addEventListener('mousedown', (event) => { this.handleCloseCalendarMouseDownEvent(event); return false; });
        topRow.appendChild(closeCalendar);

        const navRow = document.createElement('tr');
        navRow.className = 'calendar-nav-row';

        const prevYear = document.createElement('td');
        prevYear.className = 'calendar-nav-icon';
        prevYear.innerHTML = ICON_PREV_YEAR;
        prevYear.addEventListener('mousedown', (event) => { this.handlePrevYearMouseDownEvent(event); return false; });
        navRow.appendChild(prevYear);

        const prevMonth = document.createElement('td');
        prevMonth.className = 'calendar-nav-icon';
        prevMonth.innerHTML = ICON_PREV_MONTH;
        prevMonth.addEventListener('mousedown', (event) => { this.handlePrevMonthMouseDownEvent(event); return false; });
        navRow.appendChild(prevMonth);

        this.calendarTitleElement = document.createElement('td');
        this.calendarTitleElement.className = 'calendar-title';
        this.calendarTitleElement.colSpan = TITLE_COL_SPAN;
        navRow.appendChild(this.calendarTitleElement);

        const nextMonth = document.createElement('td');
        nextMonth.className = 'calendar-nav-icon';
        nextMonth.innerHTML = ICON_NEXT_MONTH;
        nextMonth.addEventListener('mousedown', (event) => { this.handleNextMonthMouseDownEvent(event); return false; });
        navRow.appendChild(nextMonth);

        const nextYear = document.createElement('td');
        nextYear.className = 'calendar-nav-icon';
        nextYear.innerHTML = ICON_NEXT_YEAR;
        nextYear.addEventListener('mousedown', (event) => { this.handleNextYearMouseDownEvent(event); return false; });
        navRow.appendChild(nextYear);

        const daysOfWeek = document.createElement('tr');
        for (let day = 0; day < DAYS_IN_WEEK; day++) {
            const dayInWeek = document.createElement('td');
            dayInWeek.className = "calendar-week-day-cell";
            dayInWeek.innerText = this.dayNames[day];

            daysOfWeek.appendChild(dayInWeek);
        }

        this.calendarDaysInMonthTableBodyElement = document.createElement('tbody');

        for (let week = 0; week < MAX_WEEKS; week++) {
            const row = document.createElement('tr');
            for (let j = 0; j < DAYS_IN_WEEK; j++) {
                const cell = document.createElement('td');
                // cell.setAttribute('unselectable', true);
                cell.addEventListener('mousedown', (event) => { this.handleDateCellMouseDownEvent(event, week); return false; });
                row.appendChild(cell);
            }
            this.calendarDaysInMonthTableBodyElement.appendChild(row);
        }

        this.calendarTableElement.appendChild(this.calendarDaysInMonthTableBodyElement);

        tableHead.appendChild(topRow);
        tableHead.appendChild(navRow);
        tableHead.appendChild(daysOfWeek);

        this.calendarTableElement.appendChild(tableHead);
        this.calendarTableElement.appendChild(this.calendarDaysInMonthTableBodyElement);

        document.body.appendChild(this.calendarContainerElement);
    }

    removeDOM_elements() {
        if (this.calendarContainerElement) {
            document.body.removeChild(this.calendarContainerElement);
        }
        // Note: assumes Browser knows how to removeEventListener for elements no longer referenced (IE had memory leaks).
        this.calendarTableElement = null;
        this.calendarContainerElement = null;
        this.calendarTitleElement = null;
        this.calendarDaysInMonthTableBodyElement = null;
    }

    isCalendarCreated() {
        return this.calendarTableElement !== null &&
            this.calendarTitleElement !== null &&
            this.calendarDaysInMonthTableBodyElement !== null;
    }

    updateCalendar() {
        if (!this.date) {
            return;
        }

        this.calMap = this.emptyCalMap();

        const numDays = IbmDate.numOfDaysInMonth(this.monthDisplayed, this.yearDisplayed);
        const tempDate = IbmDate.createDate(1, this.monthDisplayed, this.yearDisplayed);

        let firstDay = tempDate.getDay() - this.firstWeekDay;
        firstDay = firstDay % DAYS_IN_WEEK;
        if (firstDay < 0) {
            firstDay += DAYS_IN_WEEK;
        }
        firstDay = Math.floor(firstDay);
        tempDate.setDate(firstDay * -1 + 1);

        this.calendarTitleElement.innerText = this.monthNames[this.monthDisplayed] + BLANK + this.yearDisplayed;

        const calDayOfMonth = this.date.getDate();
        const calMonth = this.date.getMonth();
        const calYear = this.date.getFullYear();
        const todayDate = new Date();
        const todayDayOfMonth = todayDate.getDate();
        const todayMonth = todayDate.getMonth();
        const todayYear = todayDate.getFullYear();

        let row = this.calendarDaysInMonthTableBodyElement.firstChild;

        for (let week = 0; week < MAX_WEEKS; week++) {
            if (this.monthDisplayed === tempDate.getMonth() || tempDate.getDate() > DAYS_IN_WEEK) {
                let cell = row.firstChild;
                for (let dayOfWeek = 0; dayOfWeek < DAYS_IN_WEEK; dayOfWeek++) {
                    let thisDayOfMonth = tempDate.getDate();
                    cell.innerText = thisDayOfMonth;
                    let thisMonth = tempDate.getMonth();
                    let thisYear = tempDate.getFullYear();

                    if (this.monthDisplayed === thisMonth) {
                        if (thisDayOfMonth === calDayOfMonth && thisMonth === calMonth && thisYear === calYear) {
                            cell.className = 'calendar-selected-date-cell';
                        }
                        else if (todayDayOfMonth === thisDayOfMonth && todayMonth === thisMonth && todayYear === thisYear) {
                            cell.className = 'calendar-today-date-cell';
                        }
                        else {
                            cell.className = 'calendar-date-cell';
                        }

                        this.calMap[week][dayOfWeek] = thisDayOfMonth;
                    }
                    else {
                        cell.className = 'calendar-ex-date-cell';
                    }
                    cell = cell.nextSibling;
                    tempDate.setDate(tempDate.getDate() + 1);
                }
                row = row.nextSibling;
            }
            else {
                let cell = row.firstChild;
                for (let dayOfWeek = 0; dayOfWeek < DAYS_IN_WEEK; dayOfWeek++) {
                    cell.innerText = '';
                    cell = cell.nextSibling;
                }
            }
        }
    }

    showUI(rect) {
        if ( this.date && this.isCalendarCreated() ) {
            this.calendarContainerElement.style.left = `${rect.left}px`;
            this.calendarContainerElement.style.top = `${rect.top}px`;

            this.updateCalendar();
            this.calendarContainerElement.style.display = 'block';

            this.calendarContainerElement.focus();
        }
    }

    handleCalendarBlurEvent(event) { // Lost Focus
        if (event.target && !this.calendarContainerElement.contains(event.target)) {
            this.hide();
        }
    }

    handleCloseCalendarMouseDownEvent(event) { 
        this.hide();
    }

    handleGotoTodayMouseDownEvent(event) {
        this.date = new Date(); // Set selection to "today"
        const sameMonthYear = this.date.getMonth() === this.monthDisplayed && this.date.getFullYear() === this.yearDisplayed;

        if (!sameMonthYear) {
            this.monthDisplayed = this.date.getMonth();
            this.yearDisplayed = this.date.getFullYear();
            this.dayDisplayed = this.date.getDate();
        }

        this.updateCalendar();
    }

    handlePrevMonthMouseDownEvent(event) {
        this.moveMonths(-1);
        this.updateCalendar();
    }

    handleNextMonthMouseDownEvent(event) {
        this.moveMonths(1);
        this.updateCalendar();
    }

    handlePrevYearMouseDownEvent(event) {
        if (this.moveYears(-1)) {
            this.updateCalendar();
        }
    }

    handleNextYearMouseDownEvent(event) {
        if (this.moveYears(1)) {
            this.updateCalendar();
        }
    }

    handleDateCellMouseDownEvent(event, weekSelected) {
        if (!event.currentTarget || this.dragging ) {
            return;
        }

        let daySelected = parseInt(event.currentTarget.innerText, 10);
        let action = this.testDayInWeek(daySelected, weekSelected);

        switch (action) {
            case 'prev-month':
                this.moveMonths(-1);
                this.updateCalendar();
                break;
            case 'next-month':
                this.moveMonths(1);
                this.updateCalendar();
                break;
            case 'select':
                this.date = IbmDate.createDate(daySelected, this.monthDisplayed, this.yearDisplayed);
                this.updateInput();
                this.hide();
                break;
        }
    }

    handleDocumentKeyDownEvent(event) {
        let action = Kbd.processKeyDown(event, this.aidKeyBitmap);

        if (action.aidKeyToPush === 'ESC' || action.aidKeyToPush === 'TAB') {
            this.hide();
        }

        if (action.shouldCancel) {
            DomEvents.cancelEvent(event);
        }

        if (action.returnBooleanValue) {
            return action.ReturnBooleanValue;
        }
    }

    handleDocumentMouseDownEvent(event) {
        if (event.target) {
            if (this.calendarContainerElement.contains(event.target)) {
                return;
            }
        }
        // click outside calendar
        this.hide();
    }

    handleDragStartEvent(event) {
        this.dragging = { mouseStartX: event.clientX, mouseStartY: event.clientY };
    }

    handleDragOverEvent(event) {
        event.dataTransfer.dropEffect = 'move';
        DomEvents.cancelEvent(event);
    }

    handleDragEndEvent(event) {
        const cal = this.calendarContainerElement;

        let offsetX = this.dragging.mouseStartX - event.clientX;
        let offsetY = this.dragging.mouseStartY - event.clientY;

        cal.style.left = `${cal.getBoundingClientRect().left - offsetX}px`;
        cal.style.top = `${cal.getBoundingClientRect().top - offsetY}px`;

        DomEvents.cancelEvent(event);
        delete this.dragging;
    }

    testDayInWeek(day, week) {
        if (isNaN(day) || !(week >= 0 && week < MAX_WEEKS) || !(day>=1 && day<=31)) {
            return 'unexpected';
        }

        for (let dow = 0; dow < DAYS_IN_WEEK; dow++) {
            if (this.calMap[week][dow] === day)
                return 'select';
        }
        return week === 0 && day > 15? 'prev-month' : 'next-month';
    }

    moveMonths(relativeMonthsAmount) {
        if (isNaN(relativeMonthsAmount)) {
            return;
        }
        let nextMonthNumber = this.monthDisplayed + relativeMonthsAmount;

        if (this.moveYears((nextMonthNumber < 0 ? -1 : 0) + nextMonthNumber / MONTHS_IN_YEAR)) {
            this.monthDisplayed = nextMonthNumber % MONTHS_IN_YEAR;
            if (this.monthDisplayed < 0) {
                this.monthDisplayed += MONTHS_IN_YEAR;
            }
        }
    }

    moveYears(relativeYearsAmount) {
        if (isNaN(relativeYearsAmount)) {
            return false;
        }

        if (relativeYearsAmount === 0) {
            return true;
        }

        let requestedYear = this.yearDisplayed + (relativeYearsAmount > 0 ? Math.floor(relativeYearsAmount) : Math.ceil(relativeYearsAmount));
        this.yearDisplayed = requestedYear;
        return true;
    }

    emptyCalMap() {
        return [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ];
    }

    //dumpMap(caller) {
    //    console.log(`*** ${caller} ***`);
    //    for (let week = 0; week < MAX_WEEKS; week++) {
    //        let row = '';
    //        for (let day = 0; day < DAYS_IN_WEEK; day++) {
    //            row += `${this.calMap[week][day]} `;
    //        }
    //        console.log(`week:${week} ${row}`);
    //    }
    //    console.log();
    //}

    calcMaxZindex() {
        let maxZ = Array.from(document.querySelectorAll('body *'))
            .map(a => parseFloat(window.getComputedStyle(a).zIndex))
            .filter(a => !isNaN(a))
            .sort()
            .pop();
        return maxZ ? maxZ : 0;
    }
}

const theCalendarUI = new CalendarUI();