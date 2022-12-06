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

export { SvgData, Point, Vector };

const COLOR = {
    // BACKGROUND_PEN: '#C0C0C0',
    // STROKE: '#000000',
    BLURRED_DATE: '#C2BEBD'
}

class SvgData {
    static export(data, width, height, groupAttr, svgStyle, dateText, strokeReduction) {
        const answer = { xmlHeader: '', svgTag: '', svg: '', svgEndTag: '' };
        let l = data.length;
        let svg = [];
        let simplifieddata = [];

        answer.xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

        if (l !== 0) {
            for (let i = 0; i < l; i++) {
                const stroke = SvgData.simplifystroke(data[i]);
                simplifieddata.push(stroke);
            }
        }

        answer.svgTag = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"' +
            ' width="' + width + '"' +
            ' height="' + height + '"' +
            SvgData.formatInlineStyle(svgStyle) +
            '>';

        svg.push('<g ' + groupAttr + '>');

        for (let i = 0, l = simplifieddata.length; i < l; i++) {
            let stroke = simplifieddata[i];

            if (strokeReduction) {
                const end = stroke.x.length - strokeReduction;
                if (end < 1) {
                    continue;
                }
                stroke = { x: stroke.x.slice(0, end), y: stroke.y.slice(0, end) };
            }

            svg.push('<path d="' + SvgData.addstroke(stroke, 0, 0) + '"/>');
        }

        if (dateText) {
            const fontSize = (height * 12) / 100;
            const textColor = COLOR.BLURRED_DATE;

            svg.push('<text x="' + (width - fontSize) + '" ' +
                'y="' + (height - (fontSize / 2)) + '" ' +
                'fill="' + textColor + '" stroke="' + textColor + '" stroke-width="1" ' +
                'font-family="arial" ' +
                'font-size="' + fontSize + '" ' +
                'text-anchor="end">' + dateText + '</text>');
        }

        svg.push('</g>');
        answer.svg = svg.join('');

        answer.svgEndTag = '</svg>';

        return answer;
    }

    static simplifystroke(stroke) {
        let d = [], newstroke = { 'x': [], 'y': [] };

        for (let i = 0, l = stroke.x.length; i < l; i++) {
            d.push({ 'x': stroke.x[i], 'y': stroke.y[i] });
        }
        d = PolylineSimplification.simplify(d, 0.7, true);
        for (let i = 0, l = d.length; i < l; i++) {
            newstroke.x.push(d[i].x);
            newstroke.y.push(d[i].y);
        }
        return newstroke;
    }

    static addstroke(stroke, shiftx, shifty) {
        const lines = [
            'M', // move to
            SvgData.round((stroke.x[0] - shiftx), 2),
            SvgData.round((stroke.y[0] - shifty), 2)
        ];
        
        const lineCurveThreshold = 1;
        const l = stroke.x.length - 1;
        let i = 1;

        for (; i < l; i++) {
            lines.push.apply(lines, SvgData.segmentToCurve(stroke, i, lineCurveThreshold));
        }

        if (l > 0) {
            lines.push.apply(lines, SvgData.lastSegmentToCurve(stroke, i, lineCurveThreshold));
        } else if (l === 0) {
            lines.push.apply(lines, ['l', 1, 1]);
        }

        return lines.join(' ');
    }

    static round(number, position) {
        const tmp = Math.pow(10, position);
        return Math.round(number * tmp) / tmp;
    }

    static segmentToCurve(stroke, positionInStroke, lineCurveThreshold) {
        positionInStroke += 1;

        const Cpoint = new Point(stroke.x[positionInStroke - 1], stroke.y[positionInStroke - 1]);
        const Dpoint = new Point(stroke.x[positionInStroke], stroke.y[positionInStroke]);
        const CDvector = Cpoint.getVectorToPoint(Dpoint);
        const Bpoint = new Point(stroke.x[positionInStroke - 2], stroke.y[positionInStroke - 2]);
        const BCvector = Bpoint.getVectorToPoint(Cpoint);
        const rounding = 2;

        if (BCvector.getLength() > lineCurveThreshold) {
            let ABvector;

            // Yey! Pretty curves, here we come!
            if (positionInStroke > 2) {
                ABvector = (new Point(stroke.x[positionInStroke - 3], stroke.y[positionInStroke - 3])).getVectorToPoint(Bpoint);
            } else {
                ABvector = new Vector(0, 0);
            }

            const minlenfraction = 0.05;
            const maxlen = BCvector.getLength() * 0.35;
            const ABCangle = BCvector.angleTo(ABvector.reverse());
            const BCDangle = CDvector.angleTo(BCvector.reverse());
            const BtoCP1vector = new Vector(
                ABvector.x + BCvector.x,
                ABvector.y + BCvector.y
            ).resizeTo(
                Math.max(minlenfraction, ABCangle) * maxlen
            );
            const CtoCP2vector = (new Vector(
                BCvector.x + CDvector.x,
                BCvector.y + CDvector.y
            )).reverse().resizeTo(
                Math.max(minlenfraction, BCDangle) * maxlen
            );
            const BtoCP2vector = new Vector(
                BCvector.x + CtoCP2vector.x,
                BCvector.y + CtoCP2vector.y
            );

            // returing curve for BC segment
            // all coords are vectors against Bpoint
            return [
                'c', // bezier curve
                SvgData.round(BtoCP1vector.x, rounding),
                SvgData.round(BtoCP1vector.y, rounding),
                SvgData.round(BtoCP2vector.x, rounding),
                SvgData.round(BtoCP2vector.y, rounding),
                SvgData.round(BCvector.x, rounding),
                SvgData.round(BCvector.y, rounding)
            ];
        } else {
            return [
                'l', // line
                SvgData.round(BCvector.x, rounding),
                SvgData.round(BCvector.y, rounding)
            ];
        }
    }

    static lastSegmentToCurve(stroke, lineCurveThreshold) {
        // Here we tidy up things left unfinished

        const positionInStroke = stroke.x.length - 1;
        const Cpoint = new Point(stroke.x[positionInStroke], stroke.y[positionInStroke]);
        const Bpoint = new Point(stroke.x[positionInStroke - 1], stroke.y[positionInStroke - 1]);
        const BCvector = Bpoint.getVectorToPoint(Cpoint);
        const rounding = 2;

        if (positionInStroke > 1 && BCvector.getLength() > lineCurveThreshold) {
            // we have at least 3 elems in stroke
            const ABvector = (new Point(
                stroke.x[positionInStroke - 2],
                stroke.y[positionInStroke - 2])
            ).getVectorToPoint(Bpoint);
            const ABCangle = BCvector.angleTo(
                ABvector.reverse()
            );
            const minlenfraction = 0.05;
            const maxlen = BCvector.getLength() * 0.35;
            const BtoCP1vector = new Vector(
                ABvector.x + BCvector.x, ABvector.y + BCvector.y
            ).resizeTo(
                Math.max(minlenfraction, ABCangle) * maxlen
            );

            return [
                'c', // bezier curve
                SvgData.round(BtoCP1vector.x, rounding),
                SvgData.round(BtoCP1vector.y, rounding),
                SvgData.round(BCvector.x, rounding),
                SvgData.round(BCvector.y, rounding),
                SvgData.round(BCvector.x, rounding),
                SvgData.round(BCvector.y, rounding)
            ];
        } else {
            return [
                'l', // simple line
                SvgData.round(BCvector.x, rounding),
                SvgData.round(BCvector.y, rounding)
            ];
        }
    }

    static formatInlineStyle(style) {
        if (!style) {
            return '';
        }
        return ' style="' + style + '"';
    }
}

// Simplify.js BSD 
// (c) 2012, Vladimir Agafonkin
// mourner.github.com/simplify-js

class PolylineSimplification {
    static simplify(points, tolerance, highestQuality) {
        if (points.length <= 1) {
            return points;
        }

        const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

        points = highestQuality ? points : PolylineSimplification.simplifyRadialDist(points, sqTolerance);
        points = PolylineSimplification.simplifyDouglasPeucker(points, sqTolerance);

        return points;
    }

    // basic distance-based simplification
    static simplifyRadialDist(points, sqTolerance) {
        let prevPoint = points[0];
        let newPoints = [prevPoint];

        for (let i = 1, len = points.length; i < len; i++) {
            let point = points[i];

            if (PolylineSimplification.getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }

        if (prevPoint !== point) {
            newPoints.push(point);
        }

        return newPoints;
    }

    // simplification using optimized Douglas-Peucker algorithm with recursion elimination
    static simplifyDouglasPeucker(points, sqTolerance) {
        const len = points.length;
        const MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
        const markers = new MarkerArray(len);
        let first = 0;
        let last = len - 1;
        let stack = [];
        let newPoints = [];
        let maxSqDist;
        let sqDist;
        let index;

        markers[first] = markers[last] = 1;

        while (last) {
            maxSqDist = 0;

            for (let i = first + 1; i < last; i++) {
                sqDist = PolylineSimplification.getSqSegDist(points[i], points[first], points[last]);

                if (sqDist > maxSqDist) {
                    index = i;
                    maxSqDist = sqDist;
                }
            }

            if (maxSqDist > sqTolerance) {
                markers[index] = 1;
                stack.push(first, index, index, last);
            }

            last = stack.pop();
            first = stack.pop();
        }

        for (let i = 0; i < len; i++) {
            if (markers[i]) {
                newPoints.push(points[i]);
            }
        }

        return newPoints;
    }

    // square distance between 2 points
    static getSqDist(p1, p2) {
        const dx = p1.x - p2.x, dy = p1.y - p2.y;

        return dx * dx + dy * dy;
    }

    // square distance from a point to a segment
    static getSqSegDist(p, p1, p2) {
        let x = p1.x;
        let y = p1.y;
        let dx = p2.x - x;
        let dy = p2.y - y;

        if (dx !== 0 || dy !== 0) {
            const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = p2.x;
                y = p2.y;
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = p.x - x;
        dy = p.y - y;

        return dx * dx + dy * dy;
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    getVectorToCoordinates(x, y) {
        return new Vector(x - this.x, y - this.y);
    }

    getVectorFromCoordinates(x, y) {
        return this.getVectorToCoordinates(x, y).reverse();
    }

    getVectorToPoint(point) {
        return new Vector(point.x - this.x, point.y - this.y);
    }

    getVectorFromPoint(point) {
        return this.getVectorToPoint(point).reverse();
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.length = null;
    }
    reverse() {
        return new Vector(this.x * -1, this.y * -1);
    }

    getLength() {
        if (!this.length) {
            this.length = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        }
        return this.length;
    }

    polarity(e) {
        return Math.round(e / Math.abs(e));
    }

    resizeTo(length) {
        if (this.x === 0 && this.y === 0) {
            this.length = 0;
        } else if (this.x === 0) {
            this.length = length;
            this.y = length * this.polarity(this.y);
        } else if (this.y === 0) {
            this.length = length;
            this.x = length * this.polarity(this.x);
        } else {
            const proportion = Math.abs(this.y / this.x);
            const x = Math.sqrt(Math.pow(length, 2) / (1 + Math.pow(proportion, 2)));
            const y = proportion * x;
            this.length = length;
            this.x = x * this.polarity(this.x);
            this.y = y * this.polarity(this.y);
        }
        return this;
    }

    angleTo(vectorB) {
        const divisor = this.getLength() * vectorB.getLength();
        if (divisor === 0) {
            return 0;
        }

        return Math.acos(
            Math.min(
                Math.max((this.x * vectorB.x + this.y * vectorB.y) / divisor, -1.0)
                , 1.0
            )
        ) / Math.PI;
    }
}
