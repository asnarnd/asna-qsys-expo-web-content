/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 */

export { SignatureViewer, SignatureLinkToEdit };

import { CanvasPaint, StrokeSmoother } from './strokes.js';
import { SvgData } from './svg.js';

const COLOR = {
    BACKGROUND_PEN: '#C0C0C0',
    STROKE: '#000000',
    BLURRED_DATE: '#C2BEBD'
}

const Z_INDEX = {
    TOP: 10,
    BACKGROUND: 5
}

const LINE_CAP = 'round';
const LINE_JOIN = 'round';
const STROKE_FILL = 'none';
const MIN_STROKE_SIZE = 4; // pixels
const DOT_TIME = 1000; // milleseconds

const TIMEOUT = {
    STROKE_INCOMPLETE_MILLI_SECONDS: 750,
    ADD_STROKE_MILLI_SECONDS: (3*1000)
}

const XML_SVG_HEAD = '<?xml version="1.0" encoding="utf-8" ?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >';

class SignatureViewer {
    static paintBackground(canvas, frame) {
        const ctx = canvas.getContext('2d');
        const y = canvas.height - (canvas.height / 5);
        const xPad = canvas.width * 0.02;
        const maxX = canvas.width - xPad;
        const dx = xPad;
        const space = dx / 2;
        const penW = 1;
        let frameW = 0;

        if (frame) {
            frameW = 1;
            SignatureViewer.paintDottedFrame(ctx, canvas, 1, 'gray');
        }

        ctx.fillStyle = 'white';
        ctx.clearRect(0 + frameW, 0 + frameW, canvas.width - 1 - frameW, canvas.height - 1 - frameW);

        ctx.beginPath();

        for (let x = xPad; x + (dx + space) < maxX; x += (dx + space)) {
            SignatureViewer.oneDash(ctx, x, y, dx, penW, COLOR.BACKGROUND_PEN);
        }

        SignatureViewer.paintX(ctx, 2 * xPad, y - 5 * penW, COLOR.BACKGROUND_PEN);
    }

    static paintDottedFrame(ctx, canvas, dotRadius, color) {
        const dotCount = canvas.width / 6;
        SignatureViewer.drawDottedLine(ctx, dotRadius, dotRadius, canvas.width - dotRadius, dotRadius, dotRadius, dotCount, color);
        SignatureViewer.drawDottedLine(ctx, dotRadius, canvas.height - dotRadius, canvas.width - dotRadius, canvas.height - dotRadius, dotRadius, dotCount, color);
    }

    static drawDottedLine(ctx, x1, y1, x2, y2, dotRadius, dotCount, dotColor) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const spaceX = dx / (dotCount - 1);
        const spaceY = dy / (dotCount - 1);
        let newX = x1;
        let newY = y1;
        for (let i = 0; i < dotCount; i++) {
            SignatureViewer.drawDot(ctx, newX, newY, dotRadius, dotColor);
            newX += spaceX;
            newY += spaceY;
        }
    }

    static oneDash(ctx, x, y, dx, dy, color) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y);
        ctx.lineWidth = dy;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    static drawDot(ctx, x, y, dotRadius, dotColor) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, 2 * Math.PI, false);
        ctx.fillStyle = dotColor;
        ctx.fill();
    }

    static paintX(ctx, x, y, color) {
        ctx.strokeStyle = color;
        ctx.strokeText('X', x, y);
    }
}

class SignatureLinkToEdit {
    constructor(
        signViewer,
        options,
        zIndex,
        name,
        signImageId,
        ratio,
        dateStampWhenSigning,
        serverDate,
        collectionDataChangedCallback) {
        this.collectionDataChangedCallback = collectionDataChangedCallback;

        this.handleClickEvent = this.handleClickEvent.bind(this);
        this.handleSignatureDataChangedEvent = this.handleSignatureDataChangedEvent.bind(this);

        const anchor = document.createElement('a');
        anchor.setAttribute('href', '#');
        anchor.innerHTML = options.signLinkText;
        anchor.className = 'dds-signature-sign-link';
        anchor.style.position = 'absolute';
        anchor.style.top = '0px';
        anchor.style.zIndex = zIndex;

        anchor.addEventListener('click', this.handleClickEvent, false);

        this.signImageId = signImageId;
        this.name = name;
        this.editorTitleText = options.editorTitleText;
        this.editorCancelText = options.editorCancelText;
        this.editorDoneText = options.editorDoneText;
        this.editorEraseText = options.editorEraseText;
        this.editorInvalidEmptyText = options.editorInvalidEmptyText;
        this.editorPenOutsideWarningText = options.editorPenOutsideWarningText;
        this.maxOutDataLen = options.maxOutDataLen;
        this.tooElaborateWarning = options.tooElaborateWarning;

        this.ratio = ratio;
        this.dateStampWhenSigning = dateStampWhenSigning;
        this.serverDate = serverDate;

        signViewer.appendChild(anchor);
    }

    handleClickEvent() {
        if (!this.editor) {
            this.editor = new SignatureEditor(
                this.editorTitleText,
                this.editorCancelText,
                this.editorDoneText,
                this.editorEraseText,
                this.editorInvalidEmptyText,
                this.editorPenOutsideWarningText,
                this.maxOutDataLen
            );
        }

        this.editor.showModal(
            this.ratio,
            this.dateStampWhenSigning,
            this.serverDate,
            this.handleSignatureDataChangedEvent
        );
    }

    handleSignatureDataChangedEvent(newData) {
        const img = document.getElementById(this.signImageId);
        if (img && newData.text) {
            const base64EncodedXmlSvg = window.btoa(`${XML_SVG_HEAD}${newData.text}`);
            img.style.display = 'block';
            img.src = `data:image/svg+xml;base64,${base64EncodedXmlSvg}`;

            if (newData.wasReduced) {
                alert(this.tooElaborateWarning); // $TO-DO: replace with nicer dialog box
                //console.log('Too elaborate: data.text.length: ' + data.text.length);
            }
        }
        if (this.collectionDataChangedCallback) {
            this.collectionDataChangedCallback(this.name, newData.text);
        }
    }
}

class SignatureEditor {
    constructor(titleText, cancelText, doneText, eraseText, invalidEmptyText, penOutsideWarningText, maxOutDataLen) {
        this.titleText = titleText;
        this.cancelText = cancelText;
        this.doneText = doneText;
        this.eraseText = eraseText;
        this.invalidEmptyText = invalidEmptyText;
        this.maxOutDataLen = maxOutDataLen;
        this.penOutsideWarningText = penOutsideWarningText;

        this.handleCancelBtnClickEvent = this.handleCancelBtnClickEvent.bind(this);
        this.handleDoneBtnClickEvent = this.handleDoneBtnClickEvent.bind(this);
        this.handleEraseBtnClickEvent = this.handleEraseBtnClickEvent.bind(this);

        this.handleWindowOrientationChangeEvent = this.handleWindowOrientationChangeEvent.bind(this); // iOS
        this.handleWindowResizeEvent = this.handleWindowResizeEvent.bind(this); // Android & Desktop
    }

    showModal(ratio, dateStampWhenSigning, serverDate, signatureDataChangedCallback) {
        this.ratio = ratio; 
        this.signatureDataChangedCallback = signatureDataChangedCallback;

        this.editor = document.createElement('div');
        this.editor.className = 'dds-signature-editor';
        this.editor.style.zIndex = DomUtil.findMaxZIndex() + 1;

        const header = document.createElement('div');
        header.className = 'dds-signature-header';

        const topFiller = document.createElement('div');
        topFiller.className = 'dds-signature-editor-filler';

        const signingSurface = document.createElement('div'); // Height computed by adjustToNewSize (below)
        signingSurface.style.backgroundColor = 'white';

        const bottomFiller = document.createElement('div');
        bottomFiller.className = 'dds-signature-editor-filler';

        const footer =  document.createElement('div');
        footer.className = 'dds-signature-footer';

        this.editor.appendChild(header);
        this.editor.appendChild(topFiller);
        this.editor.appendChild(signingSurface);
        this.editor.appendChild(bottomFiller);
        this.editor.appendChild(footer);

        this.createHeaderChildElements(header);
        this.createHeaderFooterChildElements(footer);

        this.saveScrollPosition();
        this.resetScrollPosition();
        this.hideFixedElements();

        document.body.appendChild(this.editor);
        this.adjustToNewSize();

        window.addEventListener('orientationchange', this.handleWindowOrientationChangeEvent, {passive:true});
        window.addEventListener('resize', this.handleWindowResizeEvent, {passive: true});

        this.editorSurface = new EditorSurface(this.editor);
        this.editorSurface.startEditing(
            signingSurface,
            topFiller,
            bottomFiller,
            dateStampWhenSigning,
            serverDate,
            this.penOutsideWarningText
        );
    }

    handleCancelBtnClickEvent() {
        this.editorSurface.reset();
        this.restoreElements();
        this.restoreScrollPosition();
        document.body.removeChild(this.editor);
        delete this.editorSurface;
        this.editorSurface = null;
    }

    handleDoneBtnClickEvent() {
        if (this.invalidEmptyText && !this.editorSurface.anyInkOnSignature()) {
            alert(this.invalidEmptyText); // $TO-DO: replace by nice dialog box !
            return;
        }

        const data = this.editorSurface.export(this.maxOutDataLen);
        this.editorSurface.reset();
        this.restoreElements();
        this.restoreScrollPosition();
        document.body.removeChild(this.editor);
        delete this.editorSurface;
        this.editorSurface = null;

        if (this.signatureDataChangedCallback) {
            this.signatureDataChangedCallback(data);
        }
    }

    handleEraseBtnClickEvent() {
        this.editorSurface.clear(true, true);
    }

    handleWindowOrientationChangeEvent() {
        this.adjustToNewSize();
    }

    handleWindowResizeEvent() {
        this.adjustToNewSize();
    }

    hideFixedElements() {
        this.aFixed = DomUtil.findAllFixed();

        for (let i = 0, l = this.aFixed.length; i < l; i++) {
            this.aFixed[i].el.style.display = 'none';
        }
    }

    restoreElements() {
        for (let i = 0, l = this.aFixed.length; i < l; i++) {
            this.aFixed[i].el.style.display = this.aFixed[i].oldDisplay;
        }
    }

    saveScrollPosition() {
        this.savedScroll = { x: window.pageXOffset, y: window.pageYOffset };
    }

    resetScrollPosition() {
        window.scrollTo(0, 0);
    }

    restoreScrollPosition() {
        if (!this.savedScroll) { return; }

        window.scrollTo(this.savedScroll.x, this.savedScroll.y);
    }

    adjustToNewSize() {
        if (this.editor) {
            const rect = this.editor.getBoundingClientRect();
            const height = rect.width * this.ratio; // Ratio i.e. 3:1

            this.editor.style.gridTemplateRows = `2em 1fr ${height}px 1fr 2em`;

            if (this.editorSurface) {
                this.editorSurface.adjustToNewSize();
            }
        }
    }

    createHeaderChildElements(header) {
        const cancelButton = document.createElement('div');
        const titleDiv = document.createElement('div');
        const doneButton = document.createElement('div');

        cancelButton.className = 'dds-signature-cancel-button';
        titleDiv.className = 'dds-signature-title';
        doneButton.className = 'dds-signature-done-button';

        cancelButton.innerHTML = this.cancelText;
        titleDiv.innerHTML = this.titleText;
        doneButton.innerHTML = this.doneText;

        header.appendChild(cancelButton);
        header.appendChild(titleDiv);
        header.appendChild(doneButton);

        cancelButton.addEventListener('click', this.handleCancelBtnClickEvent, false);
        doneButton.addEventListener('click', this.handleDoneBtnClickEvent, false);
    }

    createHeaderFooterChildElements(footer) {
        const eraseButton = document.createElement('div');
        eraseButton.className = 'dds-signature-erase-button';

        eraseButton.innerHTML = this.eraseText;
        footer.appendChild(eraseButton);

        eraseButton.addEventListener('click', this.handleEraseBtnClickEvent, false);
    }
}

class EditorSurface {
    constructor(editor) {
        this.editor = editor;
        this.handleFillerMouseDownEvent = this.handleFillerMouseDownEvent.bind(this);
        this.handleFillerMouseMoveEvent = this.handleFillerMouseMoveEvent.bind(this);
        this.handleFillerMouseUpEvent = this.handleFillerMouseUpEvent.bind(this);

        this.handleFillerTouchStartEvent = this.handleFillerTouchStartEvent.bind(this);
        this.handleFillerTouchMoveEvent = this.handleFillerTouchMoveEvent.bind(this);
        this.handleFillerTouchEndEvent = this.handleFillerTouchEndEvent.bind(this);

        this.handleClearPenOutsideWarningEvent = this.handleClearPenOutsideWarningEvent.bind(this);
    }

    startEditing(signingSurface, topFiller, bottomFiller, /*ratio,*/ dateStampWhenSigning, serverDate, penOutsideWarningText) {
        this.signingSurface = signingSurface;
        this.penOutsideWarningText = penOutsideWarningText;

        topFiller.addEventListener('mousedown', this.handleFillerMouseDownEvent, false);
        topFiller.addEventListener('mousemove', this.handleFillerMouseMoveEvent, false);
        topFiller.addEventListener('mouseup', this.handleFillerMouseUpEvent, false);

        topFiller.addEventListener('touchstart', this.handleFillerTouchStartEvent, { passive: false });
        topFiller.addEventListener('touchmove', this.handleFillerTouchMoveEvent, { passive: false });
        topFiller.addEventListener('touchend', this.handleFillerTouchEndEvent, { passive: false });

        bottomFiller.addEventListener('mousedown', this.handleFillerMouseDownEvent, false);
        bottomFiller.addEventListener('mousemove', this.handleFillerMouseMoveEvent, false);
        bottomFiller.addEventListener('mouseup', this.handleFillerMouseUpEvent, false);

        bottomFiller.addEventListener('touchstart', this.handleFillerTouchStartEvent, { passive: false });
        bottomFiller.addEventListener('touchmove', this.handleFillerTouchMoveEvent, { passive: false });
        bottomFiller.addEventListener('touchend', this.handleFillerTouchEndEvent, { passive: false });

        // $TO-DO: ... 'MSPointerDown', 'MSPointerMove', 'MSPointerUp'

        this.editorCanvas = this.createCanvas(Z_INDEX.TOP);
        this.signingSurface.appendChild(this.editorCanvas);
        this.editorCanvasBackground = this.createCanvas(Z_INDEX.BACKGROUND);
        this.signingSurface.appendChild(this.editorCanvasBackground);

        this.adjustToNewSize();

        this.sketcher = new Sketcher(this.editorCanvas);
        this.sketcher.go(dateStampWhenSigning ? serverDate : '', this.handleClearPenOutsideWarningEvent);
    }

    createCanvas(zIndex) {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.zIndex = zIndex;
        return canvas;
    }

    setCanvasExtent(canvas) {
        const rect = this.signingSurface.getBoundingClientRect();

        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    warnPenIsOutsideCanvas() {
        if (!this.outsideCanvasPointerDown) { return; }

        if (!this.penOutsideWarning) {
            this.penOutsideWarning = new PenOutsideWarning(
                this.editorCanvasBackground,
                this.penOutsideWarningText
            );
            this.penOutsideWarning.startShowing();
        }
    }

    handleFillerMouseDownEvent(event) {
        event.preventDefault();
        event.stopPropagation();

        this.outsideCanvasPointerDown = true;
    }

    handleFillerMouseMoveEvent() {
        event.preventDefault();
        event.stopPropagation();
        this.warnPenIsOutsideCanvas();
    }

    handleFillerMouseUpEvent() {
        event.preventDefault();
        event.stopPropagation();
        this.outsideCanvasPointerDown = false;
    }

    handleFillerTouchStartEvent() {
        event.preventDefault(); // Ok for passive touch handling
        event.stopPropagation();

        this.outsideCanvasPointerDown = true;
    }

    handleFillerTouchMoveEvent() {
        event.preventDefault(); // Ok for passive touch handling
        event.stopPropagation();
        this.warnPenIsOutsideCanvas();
    }

    handleFillerTouchEndEvent() {
        event.preventDefault(); // Ok for passive touch handling
        event.stopPropagation();
        this.outsideCanvasPointerDown = false;
    }

    reset() {
        if (!this.sketcher) { return; }

        this.sketcher.reset();
    }

    clear(repaintDate, clearWarning) {
        if (!this.sketcher) { return false; }
        this.sketcher.clear(repaintDate);
        if (clearWarning) {
            this.handleClearPenOutsideWarningEvent();
        }
    }

    anyInkOnSignature() {
        if (!this.sketcher) { return false; }
        return this.sketcher.anyInkOnSignature();
    }

    export(maxOutDataLen) {
        return this.sketcher ? this.sketcher.export(maxOutDataLen) : ''; 
    }

    handleClearPenOutsideWarningEvent() {
        if (this.penOutsideWarning) {
            this.penOutsideWarning.stopShowing();
            this.penOutsideWarning = null;
        }
    }

    adjustToNewSize() {
        this.setCanvasExtent(this.editorCanvas);
        this.setCanvasExtent(this.editorCanvasBackground);

        SignatureViewer.paintBackground(this.editorCanvasBackground, true);
        if (this.sketcher) {
            this.sketcher.reset();
            this.sketcher.clear(true);
        }
    }
}

class Sketcher {
    constructor(canvas) {
        this.canvas = canvas;
        this.pathPoints = [];
        this.stroke = {};

        this.handleMouseDownEvent = this.handleMouseDownEvent.bind(this);
        this.handleMouseMoveEvent = this.handleMouseMoveEvent.bind(this);
        this.handleMouseUpEvent = this.handleMouseUpEvent.bind(this);

        this.handleTouchStartEvent = this.handleTouchStartEvent.bind(this);
        this.handleTouchMoveEvent = this.handleTouchMoveEvent.bind(this);
        this.handleTouchEndEvent = this.handleTouchEndEvent.bind(this);
        this.handleTouchCancelEvent = this.handleTouchCancelEvent.bind(this);

        this.handleEndStrokeTimerEvent = this.handleEndStrokeTimerEvent.bind(this);

        this.delayedReset = this.delayedReset.bind(this);
    }

    go(serverDate, clearPenOutsideWarningcallback) {
        this.dateText = serverDate; 
        this.clearPenOutsideWarningcallback = clearPenOutsideWarningcallback;

        this.canvas.style.margin = 0;
        this.canvas.style.padding = 0;

        this.ctx = this.canvas.getContext('2d');
        this.serverDate = serverDate;

        this.reset();
        this.paintDate();

        this.endStrokeTimer = new kickTimer(this.handleEndStrokeTimerEvent, TIMEOUT.STROKE_INCOMPLETE_MILLI_SECONDS);

        this.canvas.addEventListener('mousedown', this.handleMouseDownEvent, false);
        this.canvas.addEventListener('mousemove', this.handleMouseMoveEvent, false);
        this.canvas.addEventListener('mouseup', this.handleMouseUpEvent, false);

        this.canvas.addEventListener('touchstart', this.handleTouchStartEvent, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMoveEvent, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEndEvent, { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchCancelEvent, { passive: false });
    }

    reset() {
        if (!this.ctx) { return; }

        this.inStroke = false;
        this.pathPoints = [];
        this.lastPoint = null;
        this.stroke = {};

        setTimeout(this.delayedReset, 1); // Grid geometry may not be ready yet.
    }

    delayedReset() {
        this.lineWidth = Math.max(Math.round(this.canvas.width / 400) /*+1 pixel for every extra 300px of width.*/, 2 /* minimum line width */);
        this.fatFingerCompensation = 0; // this.lineWidth * -3; // TODO: Only if touch !
        this.lineCurveThreshold = this.lineWidth * 3;

        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = LINE_CAP;
        this.ctx.lineJoin = LINE_JOIN;

        this.ctx.strokeFill = STROKE_FILL;
        this.ctx.strokeStyle = COLOR.STROKE;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.shadowOffsetX = this.ctx.lineWidth * 0.5;
        this.ctx.shadowOffsetY = this.ctx.lineWidth * -0.6;
        this.ctx.shadowBlur = 0;

        this.clear(true);

        this.canvasRect = this.canvas.getBoundingClientRect();
    }

    paintDate() {
        if (!this.dateText || !this.canvas || !this.ctx) { return; }

        const fontH = this.canvas.height / 7;

        this.ctx.save();

        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = COLOR.BLURRED_DATE;
        this.ctx.fillStyle = COLOR.BLURRED_DATE;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.shadowBlur    = 0;
        this.ctx.font = fontH + 'px Arial';

        const x = this.canvas.width - this.ctx.measureText(this.dateText).width - fontH;
        const y = this.canvas.height - (fontH / 3);

        this.ctx.fillText(this.dateText, x, y);
        this.ctx.restore();
    }

    clear(repaintDate) {

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width + 30, this.canvas.height + 30); // JORGE: Why +30 ???
        }

        if (repaintDate) {
            this.paintDate(this.dateText);
        }
    }

    handleMouseDownEvent(event) {
        event.preventDefault();
        event.stopPropagation();

        this.startSketchPainting(event);
    }

    handleMouseMoveEvent(event) {
        event.preventDefault();
        event.stopPropagation();

        this.continueSketchPainting(event);
    }

    handleMouseUpEvent(event) { 
        event.preventDefault();
        event.stopPropagation();

        this.endSketchPainting(event);

    }

    handleEndStrokeTimerEvent() {
        this.endStroke();
    }

    handleTouchStartEvent(event) {
        event.preventDefault(); // Since we are handling touch events with with pasive:false, this is Ok
        event.stopPropagation();

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touchEvent = event.changedTouches[i];
            if (i === 0) {
                this.startSketchPainting(touchEvent);
            }
            else {
                this.continueSketchPainting(touchEvent);
            }
        }
    }

    handleTouchMoveEvent(event) {
        event.preventDefault(); // Since we are handling touch events with with pasive:false, this is Ok
        event.stopPropagation();

        for (let i = 0; i < event.changedTouches.length; i++) {
            this.continueSketchPainting(event.changedTouches[i]);
        }
    }

    handleTouchEndEvent(event) {
        event.preventDefault(); // Since we are handling touch events with with pasive:false, this is Ok
        event.stopPropagation();

        if (event.changedTouches.length) {
            this.endSketchPainting(event.changedTouches[0]);
        }
    }

    handleTouchCancelEvent(event) {
        event.preventDefault(); // Since we are handling touch events with with pasive:false, this is Ok
        event.stopPropagation();

        if (event.changedTouches.length) {
            this.cancelSketchPainting(event);
        }
    }

    startStroke(point) {
        this.lastPoint = point;
        this.stroke = { x: [point.x], y: [point.y]};

        this.pathPoints.push(this.stroke);
        this.inStroke = true;
    }

    endStroke() {
        this.inStroke = false;
    }

    addStroke(point) {
        // Discard very small strokes (diagonal distance away from original point)
        if (!this.inStroke || Sketcher.distance(point, this.lastPoint) <= MIN_STROKE_SIZE) {
            return;
        }

        const positionInStroke = this.stroke.x.length;
        this.stroke.x.push(point.x);
        this.stroke.y.push(point.y);

        this.lastPoint = point;

        setTimeout(
            StrokeSmoother.addStroke(this.ctx, this.stroke, positionInStroke, this.lineCurveThreshold),
            TIMEOUT.ADD_STROKE_MILLI_SECONDS
        );
    }

    anyInkOnSignature() {
        return this.pathPoints ? (this.pathPoints.length) : false;
    }

    screenToClient(event) {
        const documentTopLeft = { x: this.canvasRect.left, y: this.canvasRect.top }; // Note: our grid layout does not have scroll -- see resetScrollPosition()
        return { x: event.clientX - documentTopLeft.x, y: event.clientY - documentTopLeft.y };
    }

    export(maxOutDataLen) {
        let data = this.exportData(); 
        let wasReduced = false;

        // console.log('Export. MaxLen:' + maxOutDataLen);

        if (data.text.length > maxOutDataLen) {
            const excess = (data.text.length - maxOutDataLen);
            const oldLen = data.text.length;
            data = this.exportData(1); 
            const reduction = oldLen - data.text.length;

            // console.log('First attempt. Len:' + data.text.length);

            if (reduction > 0 && reduction < excess) {
                data = this.exportData(Math.ceil(excess / reduction) + 1);
                // console.log('Second attempt. Len:' + data.text.length);
            }
            else {
                // console.log('Did not attempt a second time!');
            }

            wasReduced = true;
        }

        data.wasReduced = wasReduced;

        return data;
    }

    exportData(strokeReduction) {
        const svgParts = SvgData.export(
            this.pathPoints,
            this.canvas.width,
            this.canvas.height,
            this.formatGroupAttr(),
            'display:block', // The default is inline
            this.dateText,
            strokeReduction
        );

        const svg = svgParts.svgTag + svgParts.svg + svgParts.svgEndTag;

        return { text: svg, svgTag: svgParts.svgTag, svg: svgParts.svg, svgEndTag: svgParts.svgEndTag };
    }

    formatGroupAttr(fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin) {
        return 'fill="' + STROKE_FILL + '"' +
            ' stroke="' + COLOR.STROKE + '"' +
            ' stroke-width="' + (this.lineWidth + 1) + '"' +
            ' stroke-linecap="' + LINE_CAP + '"' +
            ' stroke-linejoin="' + LINE_JOIN + '"';
    }

    startSketchPainting(event) {
        const point = this.screenToClient(event);
        this.startPaintingMetrics = { time: performance.now(), pt: point };

        if (this.clearPenOutsideWarningcallback) { this.clearPenOutsideWarningcallback(); }
        this.startStroke(point);
        this.endStrokeTimer.kick();
    }

    continueSketchPainting(event) {
        const point = this.screenToClient(event);

        if (this.clearPenOutsideWarningcallback) { this.clearPenOutsideWarningcallback(); }

        if (!this.inStroke) {
            return;
        }
        this.addStroke(point);
        this.endStrokeTimer.kick();
    }

    endSketchPainting(event) {
        const now = performance.now();
        this.endStroke();
        this.endStrokeTimer.clear();

        if (this.startPaintingMetrics && (this.startPaintingMetrics.time - now) < DOT_TIME) {
            const point = this.screenToClient(event);
            const dist = Sketcher.distance(point, this.startPaintingMetrics.pt);
            // console.log(`[1] ${this.startPaintingMetrics.pt.x},${this.startPaintingMetrics.pt.y} [2] ${point.x},${point.y} dist:${dist}`);
            if (dist <= MIN_STROKE_SIZE) {
                CanvasPaint.basicDot(this.ctx, point.x, point.y, this.lineWidth);
            }
        }
        this.startPaintingMetrics = null;
    }

    cancelSketchPainting(event) {
        this.endStroke();
        this.endStrokeTimer.clear();

        this.pathPoints.pop();
    }

    static distance(pt2, pt1) {
        return Math.sqrt(Math.pow((pt2.x - pt1.x), 2) + Math.pow((pt2.y - pt1.y), 2));
    }
}

class kickTimer {
    constructor(callback, timeout) {
        this.timer = null;
        this.callback = callback;
        this.timeout = timeout;
    }

    kick() {
        this.clear();
        this.timer = setTimeout(this.callback, this.timeout);
    }
    clear() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

class DomUtil {
    static findMaxZIndex() {
        let maxZ_Index = 0;
        let all = document.getElementsByTagName("*");

        const count = all.length;
        for (let i = 0; i < count; i++) {
            const zIndex = DomUtil.getZIndex(all[i]);
            if (zIndex && !isNaN(zIndex) && zIndex > maxZ_Index) {
                maxZ_Index = zIndex;
            }
        }
        return maxZ_Index;
    }

    static getZIndex(el) {
        if (!el) {
            return null;
        }

        let propVal = typeof (el.style) !== 'undefined' ? el.style.zIndex : null;

        if (!propVal) {
            propVal = DomUtil.getComputedStyle(el, 'z-Index');
        }

        if (!propVal || propVal === 'auto') {
            return null;
        }

        return parseInt(propVal, 10);
    }

    static getComputedStyle(el, propName) {
        if (window.getComputedStyle) {
            return window.getComputedStyle(el, null).getPropertyValue(propName);
        }
        else if (el.currentStyle) {
            return el.currentStyle[propName];
        }
        return '';
    }

    static findAllFixed() {
        const all = document.getElementsByTagName("*");
        let result = [];

        for (let i = 0, l = all.length; i < l; i++) {
            const el = all[i];
            if (el.style && el.style.position === 'fixed' && el.style.visibility !== 'none') {
                result.push( { el: el, oldDisplay: el.style.display } );
            }
        }

        return result;
    }

    static getComputedExtX(el) {
        const rect = el.getBoundingClientRect();
        const ml = DomUtil.getComputedStyle(el, 'margin-left');
        const pl = DomUtil.getComputedStyle(el, 'padding-left');
        const mr = DomUtil.getComputedStyle(el, 'margin-right');
        const pr = DomUtil.getComputedStyle(el, 'padding-right');
        const bStyle = DomUtil.getComputedStyle(el, 'border-style');
        let result = rect.width + DomUtil._val(ml) + DomUtil._val(pl) + DomUtil._val(mr) + DomUtil._val(pr);

        if (bStyle && bStyle !== 'none') {
            const bw = DomUtil.getComputedStyle(btn, 'border-width');
            result += DomUtil._val(bw);
        }

        return result;
    }


    static getComputedExtY(el) {
        const rect = el.getBoundingClientRect();
        const mt = DomUtil.getComputedStyle(el, 'margin-top');
        const pt = DomUtil.getComputedStyle(el, 'padding-top');
        const mb = DomUtil.getComputedStyle(el, 'margin-bottom');
        const pb = DomUtil.getComputedStyle(el, 'padding-bottom');
        const bStyle = DomUtil.getComputedStyle(el, 'border-style');
        let result = rect.height + DomUtil._val(mt) + DomUtil._val(pt) + DomUtil._val(mb) + DomUtil._val(pb);

        if (bStyle && bStyle !== 'none') {
            const bw = DomUtil.getComputedStyle(btn, 'border-width');
            result += DomUtil._val(bw);
        }

        return result;
    }

    static _val(sV) {
        let result = 0;
        const v = parseFloat(sV);
        if (v && !isNaN(v)) {
            result = v;
        }

        return result;
    }
}

class PenOutsideWarning {
    constructor(canvas, textWarning) {
        this.canvas = canvas;
        this.textWarning = textWarning;
        this.handleTimerFiringEvent = this.handleTimerFiringEvent.bind(this);
        this.flip = false;
    }

    startShowing() {
        this.ctx = this.canvas.getContext('2d');
        this.timerID = setInterval(this.handleTimerFiringEvent, 500); // every half second
    }

    handleTimerFiringEvent() {
        if (!this.flip) {
            this.paintWarning();
        }
        else {
            this.restoreBackground(this.ctx, this.canvas);
        }

        this.flip = ! this.flip;
    }

    paintWarning() {
        SignatureViewer.paintDottedFrame(this.ctx, this.canvas, 1, 'red');

        this.ctx.save();
        this.ctx.strokeStyle = 'red';
        this.ctx.font = '32px Verdana';
        const dim = this.ctx.measureText(this.textWarning);
        this.ctx.strokeText(this.textWarning, (this.canvas.width - dim.width) / 2, this.canvas.height / 2);
        this.ctx.restore();
    }

    restoreBackground() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        SignatureViewer.paintBackground(this.canvas, true);
    }

    stopShowing() {
        if (!this.timerID) { return; }
        clearInterval(this.timerID);

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            SignatureViewer.paintBackground(this.canvas, true);
        }

        this.timerID = null;
    }
}