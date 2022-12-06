/*
 * Copyright (c) ASNA, Inc. and its affiliates.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 *    Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
 *    Copyright (c) 2010 Brinley Ang http://www.unbolt.net
 *    MIT License http://www.opensource.org/licenses/mit-license.php
 */

export { CanvasPaint, StrokeSmoother };

import { Point, Vector } from './svg.js';

class CanvasPaint {
    static basicDot(ctx, x, y, size) {
        const fillStyle = ctx.fillStyle;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(x + size / -2, y + size / -2, size, size);
        ctx.fillStyle = fillStyle;
    }
    static basicLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    static basicCurve(ctx, startx, starty, endx, endy, cp1x, cp1y, cp2x, cp2y) {
        ctx.beginPath();
        ctx.moveTo(startx, starty);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
        ctx.stroke();
    }
}

class StrokeSmoother {
    static addStroke(ctx, stroke, positionInStroke, lineCurveThreshold) {
        const Cpoint = new Point(stroke.x[positionInStroke - 1], stroke.y[positionInStroke - 1]);
        const Dpoint = new Point(stroke.x[positionInStroke], stroke.y[positionInStroke]);
        const CDvector = Cpoint.getVectorToPoint(Dpoint);

        if (positionInStroke > 1) {
            const Bpoint = new Point(stroke.x[positionInStroke - 2], stroke.y[positionInStroke - 2]);
            const BCvector = Bpoint.getVectorToPoint(Cpoint);
            let ABvector;

            if (BCvector.getLength() > lineCurveThreshold) {
                if (positionInStroke > 2) {
                    ABvector = (new Point(stroke.x[positionInStroke - 3], stroke.y[positionInStroke - 3])).getVectorToPoint(Bpoint);
                } else {
                    ABvector = new Vector(0, 0);
                }

                const minlenfraction = 0.05;
                const maxlen = BCvector.getLength() * 0.35;
                const ABCangle = BCvector.angleTo(ABvector.reverse());
                const BCDangle = CDvector.angleTo(BCvector.reverse());

                const BCP1vector = (new Vector(
                    ABvector.x + BCvector.x, ABvector.y + BCvector.y
                )).resizeTo(
                    Math.max(minlenfraction, ABCangle) * maxlen
                );
                const CCP2vector = (new Vector(
                    BCvector.x + CDvector.x, BCvector.y + CDvector.y
                )).reverse().resizeTo(
                    Math.max(minlenfraction, BCDangle) * maxlen
                );

                CanvasPaint.basicCurve(ctx,
                    Bpoint.x, Bpoint.y,                                // startx, starty 
                    Cpoint.x, Cpoint.y,                                // endx, endy
                    Bpoint.x + BCP1vector.x, Bpoint.y + BCP1vector.y,  // cp1x, cp1y
                    Cpoint.x + CCP2vector.x, Cpoint.y + CCP2vector.y); // cp2x, cp2y
            }
        }

        if (CDvector.getLength() <= lineCurveThreshold) {
            CanvasPaint.basicLine(ctx, Cpoint.x, Cpoint.y, Dpoint.x, Dpoint.y);
        }
    }
}
