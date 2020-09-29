
// ------------------------------------------
// Magnetic.js 0.0.1
// A library for creating beautiful magnet effects
// Copyright (c) 2020 Veaceslav Grimalschi (@grimalschi)
// MIT license
//
// Thanks to Codrops and Mary Lou for examples
// (https://github.com/codrops/MagneticButtons/)
// ------------------------------------------

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Magnetic = factory();
    }
}(typeof window !== "undefined" ? window : global, function () {
    var mousepos = { x: 0, y: 0 };
    window.addEventListener('mousemove', function (event) {
        mousepos = { x: event.clientX, y: event.clientY };
    });

    var instances = [];

    function render() {
        var memory = {
            roots: [],
            rects: [],
        };

        instances.forEach(function measure(instance) {
            if (instance.hover && instance.animated === false) {
                if (memory.roots.indexOf(instance.root) >= 0) {
                    instance.root_rect = memory.rects[memory.roots.indexOf(instance.root)];
                } else {
                    instance.root_rect = instance.root.getBoundingClientRect();
                    memory.roots.push(instance.root);
                    memory.rects.push(instance.root_rect);
                }

                instance.el_rect = instance.el.getBoundingClientRect();

                instance.animated = true;
            }
        });

        instances.forEach(function mutate(instance) {
            var x = 0, y = 0;

            if (instance.hover) {
                var virtual_width = instance.el_rect.width;
                var el_center = instance.el_rect.left + instance.el_rect.width / 2;

                if (mousepos.x < el_center) {
                    virtual_width += (instance.el_rect.left - instance.root_rect.left) * 2;
                } else {
                    virtual_width += (instance.root_rect.right - instance.el_rect.right) * 2;
                }

                x = (mousepos.x - el_center) * (1 - instance.el_rect.width / virtual_width) * instance.distance;

                var el_middle = instance.el_rect.top + instance.el_rect.height / 2;
                var virtual_height = instance.el_rect.height;

                if (mousepos.y < el_middle) {
                    virtual_height += (instance.el_rect.top - instance.root_rect.top) * 2;
                } else {
                    virtual_height += (instance.root_rect.bottom - instance.el_rect.bottom) * 2;
                }

                y = (mousepos.y - el_middle) * (1 - instance.el_rect.height / virtual_height) * instance.distance;
            }

            instance.prevX = instance.prevX * (1 - instance.force) + x * instance.force;
            instance.prevY = instance.prevY * (1 - instance.force) + y * instance.force;

            if (Math.abs(instance.prevX) > 0.1 || Math.abs(instance.prevY) > 0.1) {
                instance.el.style.transform = 'translate3d(' + instance.prevX + 'px, ' + instance.prevY + 'px, 0)';

                instance.animated = true;
            } else {
                if (instance.animated) {
                    instance.el.style.transform = '';
                }

                instance.animated = false;
            }
        });

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    var Magnetic = function(options) {
        "use strict";

        var instance = Object.create(Magnetic.prototype);

        if (options.root instanceof Element) {
            instance.root = options.root;
        } else {
            throw new Error('Parameter "root" should be a valid Element');
        }

        if (options.element instanceof Element) {
            instance.el = options.element;

            if (getComputedStyle(instance.el).display === 'inline') {
                // CSS transform does not work with inline elements
                instance.el.style.display = 'inline-block';
            }
        } else {
            throw new Error('Parameter "element" should be a valid Element');
        }

        if (typeof options.force !== 'number' || isNaN(options.force)) {
            instance.force = 0.1;
        } else {
            // Value 1 causes wrong positioning
            instance.force = Math.min(Math.max(0, options.force), 0.999);
        }

        if (typeof options.distance !== 'number' || isNaN(options.distance)) {
            instance.distance = 1;
        } else {
            instance.distance = options.distance;
        }

        instance.prevX = 0;
        instance.prevY = 0;

        instance.animated = false;

        instance.hover = false;
        instance.root.addEventListener('mouseenter', function () {
            instance.hover = true;
        });
        instance.root.addEventListener('mouseleave', function () {
            instance.hover = false;
        });

        instances.push(instance);

        return instance;
    };

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll('[data-magnetic-root]').forEach(function (root) {
            root.querySelectorAll('[data-magnetic-element]').forEach(function (element) {
                var parent = element;

                while (parent = parent.parentElement) {
                    if (parent.getAttribute('data-magnetic-root') !== null) {
                        // Detecting nested roots
                        if (parent !== root) return;
                    }
                }

                var force = element.getAttribute('data-magnetic-force');
                if (force !== null) force *= 1;

                var distance = element.getAttribute('data-magnetic-distance');
                if (distance !== null) distance *= 1;

                new Magnetic({ root: root, element: element, force: force, distance: distance, });
            });
        });
    });

    return Magnetic;
}));
