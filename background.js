(function () {
    "use strict";

    var BG_COLOR = '#000000';
    var COLOR_RANGE = 4194303;
    var BLUR_PASSES = 5;
    var BLUR_SIZE = 20;
    var FPS = 12; // max FPS (60 is recommended but wibbly-wobbly-timey-wimey looks better when its a bit slower :D)
    var nc = 10;
    var sm = 30;
    var sx = 40;
    var vx = 2;
    var vy = 2;
    var CANVAS_ID = 'background';

    var e = document.getElementById(CANVAS_ID),
        ec = e.getContext("2d"),
        cw = e.width,
        ch = e.height,
        pt = [],
        mul_table = [1, 57, 41, 21, 203, 34, 97, 73, 227, 91, 149, 62, 105, 45, 39, 137, 241, 107, 3, 173, 39, 71, 65, 238, 219, 101, 187, 87, 81, 151, 141, 133, 249, 117, 221, 209, 197, 187, 177, 169, 5, 153, 73, 139, 133, 127, 243, 233, 223, 107, 103, 99, 191, 23, 177, 171, 165, 159, 77, 149, 9, 139, 135, 131, 253, 245, 119, 231, 224, 109, 211, 103, 25, 195, 189, 23, 45, 175, 171, 83, 81, 79, 155, 151, 147, 9, 141, 137, 67, 131, 129, 251, 123, 30, 235, 115, 113, 221, 217, 53, 13, 51, 50, 49, 193, 189, 185, 91, 179, 175, 43, 169, 83, 163, 5, 79, 155, 19, 75, 147, 145, 143, 35, 69, 17, 67, 33, 65, 255, 251, 247, 243, 239, 59, 29, 229, 113, 111, 219, 27, 213, 105, 207, 51, 201, 199, 49, 193, 191, 47, 93, 183, 181, 179, 11, 87, 43, 85, 167, 165, 163, 161, 159, 157, 155, 77, 19, 75, 37, 73, 145, 143, 141, 35, 138, 137, 135, 67, 33, 131, 129, 255, 63, 250, 247, 61, 121, 239, 237, 117, 29, 229, 227, 225, 111, 55, 109, 216, 213, 211, 209, 207, 205, 203, 201, 199, 197, 195, 193, 48, 190, 47, 93, 185, 183, 181, 179, 178, 176, 175, 173, 171, 85, 21, 167, 165, 41, 163, 161, 5, 79, 157, 78, 154, 153, 19, 75, 149, 74, 147, 73, 144, 143, 71, 141, 140, 139, 137, 17, 135, 134, 133, 66, 131, 65, 129, 1],
        shg_table = [0, 9, 10, 10, 14, 12, 14, 14, 16, 15, 16, 15, 16, 15, 15, 17, 18, 17, 12, 18, 16, 17, 17, 19, 19, 18, 19, 18, 18, 19, 19, 19, 20, 19, 20, 20, 20, 20, 20, 20, 15, 20, 19, 20, 20, 20, 21, 21, 21, 20, 20, 20, 21, 18, 21, 21, 21, 21, 20, 21, 17, 21, 21, 21, 22, 22, 21, 22, 22, 21, 22, 21, 19, 22, 22, 19, 20, 22, 22, 21, 21, 21, 22, 22, 22, 18, 22, 22, 21, 22, 22, 23, 22, 20, 23, 22, 22, 23, 23, 21, 19, 21, 21, 21, 23, 23, 23, 22, 23, 23, 21, 23, 22, 23, 18, 22, 23, 20, 22, 23, 23, 23, 21, 22, 20, 22, 21, 22, 24, 24, 24, 24, 24, 22, 21, 24, 23, 23, 24, 21, 24, 23, 24, 22, 24, 24, 22, 24, 24, 22, 23, 24, 24, 24, 20, 23, 22, 23, 24, 24, 24, 24, 24, 24, 24, 23, 21, 23, 22, 23, 24, 24, 24, 22, 24, 24, 24, 23, 22, 24, 24, 25, 23, 25, 25, 23, 24, 25, 25, 24, 22, 25, 25, 25, 24, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 23, 25, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 22, 25, 25, 23, 25, 25, 20, 24, 25, 24, 25, 25, 22, 24, 25, 24, 25, 24, 25, 25, 24, 25, 25, 25, 25, 22, 25, 25, 25, 24, 25, 24, 25, 18],

        /**
         * Box blur function from:
         * http://www.quasimondo.com/BoxBlurForCanvas/FastBlurDemo.html
         *
         * For license information see:
         * http://www.quasimondo.com/BoxBlurForCanvas/FastBlur.js
         */
        boxBlurCanvasRGB = function (id, top_x, top_y, width, height, radius, iterations) {

            radius |= 0;
            iterations |= 0;

            var context = ec,
                imageData = context.getImageData(top_x, top_y, width, height),
                pixels = imageData.data,
                rsum, gsum, bsum, asum, x, y, i, p, p1, p2, yp, yi, yw, idx, wm, hm, wh, rad1, r, g, b, mul_sum, shg_sum, vmin, vmax;

            wm = width - 1;
            hm = height - 1;
            wh = width * height;
            rad1 = radius + 1;

            r = [];
            g = [];
            b = [];

            mul_sum = mul_table[radius];
            shg_sum = shg_table[radius];

            vmin = [];
            vmax = [];

            while (iterations-- > 0) {
                yw = yi = 0;

                for (y = 0; y < height; y++) {
                    rsum = pixels[yw] * rad1;
                    gsum = pixels[yw + 1] * rad1;
                    bsum = pixels[yw + 2] * rad1;

                    for (i = 1; i <= radius; i++) {
                        p = yw + (((i > wm ? wm : i)) << 2);
                        rsum += pixels[p++];
                        gsum += pixels[p++];
                        bsum += pixels[p++];
                    }

                    for (x = 0; x < width; x++) {
                        r[yi] = rsum;
                        g[yi] = gsum;
                        b[yi] = bsum;

                        if (y == 0) {
                            vmin[x] = ((p = x + rad1) < wm ? p : wm) << 2;
                            vmax[x] = ((p = x - radius) > 0 ? p << 2 : 0);
                        }

                        p1 = yw + vmin[x];
                        p2 = yw + vmax[x];

                        rsum += pixels[p1++] - pixels[p2++];
                        gsum += pixels[p1++] - pixels[p2++];
                        bsum += pixels[p1++] - pixels[p2++];

                        yi++;
                    }
                    yw += (width << 2);
                }

                for (x = 0; x < width; x++) {
                    yp = x;
                    rsum = r[yp] * rad1;
                    gsum = g[yp] * rad1;
                    bsum = b[yp] * rad1;

                    for (i = 1; i <= radius; i++) {
                        yp += (i > hm ? 0 : width);
                        rsum += r[yp];
                        gsum += g[yp];
                        bsum += b[yp];
                    }

                    yi = x << 2;
                    for (y = 0; y < height; y++) {
                        pixels[yi] = (rsum * mul_sum) >>> shg_sum;
                        pixels[yi + 1] = (gsum * mul_sum) >>> shg_sum;
                        pixels[yi + 2] = (bsum * mul_sum) >>> shg_sum;

                        if (x == 0) {
                            vmin[y] = ((p = y + rad1) < hm ? p : hm) * width;
                            vmax[y] = ((p = y - radius) > 0 ? p * width : 0);
                        }

                        p1 = x + vmin[y];
                        p2 = x + vmax[y];

                        rsum += r[p1] - r[p2];
                        gsum += g[p1] - g[p2];
                        bsum += b[p1] - b[p2];

                        yi += width << 2;
                    }
                }
            }
            context.putImageData(imageData, top_x, top_y);

        }

        function moveCoords(n) {
            pt[n].x += Math.floor(Math.random() * pt[n].vx);
            pt[n].y += Math.floor(Math.random() * pt[n].vy);

            if (pt[n].x <= (vx + pt[n].r)) {
                pt[n].vx = vx;
            } else if (pt[n].x >= (cw - vx - pt[n].r)) {
                pt[n].vx = -vx;
            }

            if (pt[n].y <= (vy + pt[n].r)) {
                pt[n].vy = vy;
            } else if (pt[n].x >= (ch - vx - pt[n].r)) {
                pt[n].vy = -vy;
            }
        }

        function drawCircle(r, cx, cy, color) {
            ec.beginPath();
            ec.arc(cx, cy, r, 0, 2 * Math.PI, false);
            ec.fillStyle = color;
            ec.fill();
        }

        function init() {
            var tvx, tvy, i;

            ec.fillStyle = BG_COLOR;
            ec.fillRect(0, 0, cw, ch);

            for (i = 0; i < nc; i = i + 1) {
                ec.save();
                tvx = tvy = 0;
                while (tvx == 0) {
                    tvx = Math.floor(Math.random() * vx * (Math.random() <= .5 ? 1 : -1));
                }
                while (tvy == 0) {
                    tvy = Math.floor(Math.random() * vy * (Math.random() <= .5 ? 1 : -1));
                }

                pt[i] = {
                    color: '#' + Math.floor((Math.random() * COLOR_RANGE) + (16777215 - COLOR_RANGE)).toString(16),
                    x: Math.floor(Math.random() * cw),
                    y: Math.floor(Math.random() * ch),
                    vx: tvx,
                    vy: tvy,
                    r: Math.floor((Math.random() * (sx - sm)) + sm)
                };

                drawCircle(pt[i].r, pt[i].x, pt[i].y, pt[i].color);
                ec.restore();
            }

            boxBlurCanvasRGB(CANVAS_ID, 0, 0, cw, ch, BLUR_SIZE, BLUR_PASSES);
            requestAnimationFrame(update);
        }

        function update() {
            ec.fillStyle = BG_COLOR;
            ec.fillRect(0, 0, cw, ch);

            for (var i = 0; i < nc; i = i + 1) {
                ec.save();
                moveCoords(i);
                drawCircle(pt[i].r, pt[i].x, pt[i].y, pt[i].color);
                ec.restore();
            }

            boxBlurCanvasRGB(CANVAS_ID, 0, 0, cw, ch, BLUR_SIZE, BLUR_PASSES);
            setTimeout(function(){requestAnimationFrame(update)}, 1000 / FPS);
        }

    init();

})();
