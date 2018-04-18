/*! Blender-UI - v2.0.0 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.BlenderUI = factory());
}(this, (function () { 'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var findindexPolyfill = function findindexPolyfill() {
	          // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
	          if (!Array.prototype.findIndex) {
	                    Object.defineProperty(Array.prototype, 'findIndex', {
	                              value: function value(predicate) {
	                                        // 1. Let O be ? ToObject(this value).
	                                        if (this == null) {
	                                                  throw new TypeError('"this" is null or not defined');
	                                        }

	                                        var o = Object(this);

	                                        // 2. Let len be ? ToLength(? Get(O, "length")).
	                                        var len = o.length >>> 0;

	                                        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
	                                        if (typeof predicate !== 'function') {
	                                                  throw new TypeError('predicate must be a function');
	                                        }

	                                        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
	                                        var thisArg = arguments[1];

	                                        // 5. Let k be 0.
	                                        var k = 0;

	                                        // 6. Repeat, while k < len
	                                        while (k < len) {
	                                                  // a. Let Pk be ! ToString(k).
	                                                  // b. Let kValue be ? Get(O, Pk).
	                                                  // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
	                                                  // d. If testResult is true, return k.
	                                                  var kValue = o[k];
	                                                  if (predicate.call(thisArg, kValue, k, o)) {
	                                                            return k;
	                                                  }
	                                                  // e. Increase k by 1.
	                                                  k++;
	                                        }

	                                        // 7. Return -1.
	                                        return -1;
	                              },
	                              configurable: true,
	                              writable: true
	                    });
	          }
	};

	//Returns id of the parent node
	var getOption = function getOption(opt, name, def) {
	    var value = opt[name];
	    if (value !== undefined) return value;
	    return def;
	};

	var isOption = function isOption(obj) {
	    return !obj.hasOwnProperty('children');
	};

	// makes tree node with data shaped like this:
	// {
	//     id: node id
	//     el: DOM element
	// }
	function node() {
	    var children = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    return {
	        parent: null,
	        children: children,
	        data: data,
	        removeChild: function removeChild(filterFn) {
	            for (var i = this.children.length - 1; i >= 0; i--) {
	                var child = this.children[i];
	                if (filterFn(child)) this.children.splice(i, 1);
	            }
	        },
	        addChild: function addChild() {
	            console.log(arguments);
	            if (arguments.length === 0) return;

	            var opts = arguments[arguments.length - 1];
	            var argsLength = arguments.length - 1;
	            if (!isOption(opts)) {
	                argsLength = arguments.length;
	                opts = {};
	                var start = this.children.length;
	            }

	            var children = [];
	            for (var i = 0; i < argsLength; i++) {
	                var child = arguments[i];
	                child.parent = this;
	                children.push(child);
	            }

	            if (isOption(opts)) {
	                var after = getOption(opts, 'after', undefined);
	                var start = after === undefined ? this.children.length : this.children.findIndex(function (node) {
	                    return node.data.id === after;
	                }) + 1;
	            }

	            this.children.splice.apply(this.children, [start, 0].concat(children));
	            return children;
	        }
	    };
	}
	var narytree = node;

	var split = createCommonjsModule(function (module, exports) {
	/*! Split.js - v1.3.5 */

	(function (global, factory) {
		module.exports = factory();
	}(commonjsGlobal, (function () {
	// The programming goals of Split.js are to deliver readable, understandable and
	// maintainable code, while at the same time manually optimizing for tiny minified file size,
	// browser compatibility without additional requirements, graceful fallback (IE8 is supported)
	// and very few assumptions about the user's page layout.
	var global = window;
	var document = global.document;

	// Save a couple long function names that are used frequently.
	// This optimization saves around 400 bytes.
	var addEventListener = 'addEventListener';
	var removeEventListener = 'removeEventListener';
	var getBoundingClientRect = 'getBoundingClientRect';
	var NOOP = function () { return false; };

	// Figure out if we're in IE8 or not. IE8 will still render correctly,
	// but will be static instead of draggable.
	var isIE8 = global.attachEvent && !global[addEventListener];

	// This library only needs two helper functions:
	//
	// The first determines which prefixes of CSS calc we need.
	// We only need to do this once on startup, when this anonymous function is called.
	//
	// Tests -webkit, -moz and -o prefixes. Modified from StackOverflow:
	// http://stackoverflow.com/questions/16625140/js-feature-detection-to-detect-the-usage-of-webkit-calc-over-calc/16625167#16625167
	var calc = (['', '-webkit-', '-moz-', '-o-'].filter(function (prefix) {
	    var el = document.createElement('div');
	    el.style.cssText = "width:" + prefix + "calc(9px)";

	    return (!!el.style.length)
	}).shift()) + "calc";

	// The second helper function allows elements and string selectors to be used
	// interchangeably. In either case an element is returned. This allows us to
	// do `Split([elem1, elem2])` as well as `Split(['#id1', '#id2'])`.
	var elementOrSelector = function (el) {
	    if (typeof el === 'string' || el instanceof String) {
	        return document.querySelector(el)
	    }

	    return el
	};

	// The main function to initialize a split. Split.js thinks about each pair
	// of elements as an independant pair. Dragging the gutter between two elements
	// only changes the dimensions of elements in that pair. This is key to understanding
	// how the following functions operate, since each function is bound to a pair.
	//
	// A pair object is shaped like this:
	//
	// {
	//     a: DOM element,
	//     b: DOM element,
	//     aMin: Number,
	//     bMin: Number,
	//     dragging: Boolean,
	//     parent: DOM element,
	//     isFirst: Boolean,
	//     isLast: Boolean,
	//     direction: 'horizontal' | 'vertical'
	// }
	//
	// The basic sequence:
	//
	// 1. Set defaults to something sane. `options` doesn't have to be passed at all.
	// 2. Initialize a bunch of strings based on the direction we're splitting.
	//    A lot of the behavior in the rest of the library is paramatized down to
	//    rely on CSS strings and classes.
	// 3. Define the dragging helper functions, and a few helpers to go with them.
	// 4. Loop through the elements while pairing them off. Every pair gets an
	//    `pair` object, a gutter, and special isFirst/isLast properties.
	// 5. Actually size the pair elements, insert gutters and attach event listeners.
	var Split = function (ids, options) {
	    if ( options === void 0 ) options = {};

	    var dimension;
	    var clientAxis;
	    var position;
	    var elements;

	    // All DOM elements in the split should have a common parent. We can grab
	    // the first elements parent and hope users read the docs because the
	    // behavior will be whacky otherwise.
	    var parent = elementOrSelector(ids[0]).parentNode;
	    var parentFlexDirection = global.getComputedStyle(parent).flexDirection;

	    // Set default options.sizes to equal percentages of the parent element.
	    var sizes = options.sizes || ids.map(function () { return 100 / ids.length; });

	    // Standardize minSize to an array if it isn't already. This allows minSize
	    // to be passed as a number.
	    var minSize = options.minSize !== undefined ? options.minSize : 100;
	    var minSizes = Array.isArray(minSize) ? minSize : ids.map(function () { return minSize; });
	    var gutterSize = options.gutterSize !== undefined ? options.gutterSize : 10;
	    var snapOffset = options.snapOffset !== undefined ? options.snapOffset : 30;
	    var direction = options.direction || 'horizontal';
	    var cursor = options.cursor || (direction === 'horizontal' ? 'ew-resize' : 'ns-resize');
	    var gutter = options.gutter || (function (i, gutterDirection) {
	        var gut = document.createElement('div');
	        gut.className = "gutter gutter-" + gutterDirection;
	        return gut
	    });
	    var elementStyle = options.elementStyle || (function (dim, size, gutSize) {
	        var style = {};

	        if (typeof size !== 'string' && !(size instanceof String)) {
	            if (!isIE8) {
	                style[dim] = calc + "(" + size + "% - " + gutSize + "px)";
	            } else {
	                style[dim] = size + "%";
	            }
	        } else {
	            style[dim] = size;
	        }

	        return style
	    });
	    var gutterStyle = options.gutterStyle || (function (dim, gutSize) { return (( obj = {}, obj[dim] = (gutSize + "px"), obj))
	        var obj; });

	    // 2. Initialize a bunch of strings based on the direction we're splitting.
	    // A lot of the behavior in the rest of the library is paramatized down to
	    // rely on CSS strings and classes.
	    if (direction === 'horizontal') {
	        dimension = 'width';
	        clientAxis = 'clientX';
	        position = 'left';
	    } else if (direction === 'vertical') {
	        dimension = 'height';
	        clientAxis = 'clientY';
	        position = 'top';
	    }

	    // 3. Define the dragging helper functions, and a few helpers to go with them.
	    // Each helper is bound to a pair object that contains it's metadata. This
	    // also makes it easy to store references to listeners that that will be
	    // added and removed.
	    //
	    // Even though there are no other functions contained in them, aliasing
	    // this to self saves 50 bytes or so since it's used so frequently.
	    //
	    // The pair object saves metadata like dragging state, position and
	    // event listener references.

	    function setElementSize (el, size, gutSize) {
	        // Split.js allows setting sizes via numbers (ideally), or if you must,
	        // by string, like '300px'. This is less than ideal, because it breaks
	        // the fluid layout that `calc(% - px)` provides. You're on your own if you do that,
	        // make sure you calculate the gutter size by hand.
	        var style = elementStyle(dimension, size, gutSize);

	        // eslint-disable-next-line no-param-reassign
	        Object.keys(style).forEach(function (prop) { return (el.style[prop] = style[prop]); });
	    }

	    function setGutterSize (gutterElement, gutSize) {
	        var style = gutterStyle(dimension, gutSize);

	        // eslint-disable-next-line no-param-reassign
	        Object.keys(style).forEach(function (prop) { return (gutterElement.style[prop] = style[prop]); });
	    }

	    // Actually adjust the size of elements `a` and `b` to `offset` while dragging.
	    // calc is used to allow calc(percentage + gutterpx) on the whole split instance,
	    // which allows the viewport to be resized without additional logic.
	    // Element a's size is the same as offset. b's size is total size - a size.
	    // Both sizes are calculated from the initial parent percentage,
	    // then the gutter size is subtracted.
	    function adjust (offset) {
	        var a = elements[this.a];
	        var b = elements[this.b];
	        var percentage = a.size + b.size;

	        a.size = (offset / this.size) * percentage;
	        b.size = (percentage - ((offset / this.size) * percentage));

	        setElementSize(a.element, a.size, this.aGutterSize);
	        setElementSize(b.element, b.size, this.bGutterSize);
	    }

	    // drag, where all the magic happens. The logic is really quite simple:
	    //
	    // 1. Ignore if the pair is not dragging.
	    // 2. Get the offset of the event.
	    // 3. Snap offset to min if within snappable range (within min + snapOffset).
	    // 4. Actually adjust each element in the pair to offset.
	    //
	    // ---------------------------------------------------------------------
	    // |    | <- a.minSize               ||              b.minSize -> |    |
	    // |    |  | <- this.snapOffset      ||     this.snapOffset -> |  |    |
	    // |    |  |                         ||                        |  |    |
	    // |    |  |                         ||                        |  |    |
	    // ---------------------------------------------------------------------
	    // | <- this.start                                        this.size -> |
	    function drag (e) {
	        var offset;

	        if (!this.dragging) { return }

	        // Get the offset of the event from the first side of the
	        // pair `this.start`. Supports touch events, but not multitouch, so only the first
	        // finger `touches[0]` is counted.
	        if ('touches' in e) {
	            offset = e.touches[0][clientAxis] - this.start;
	        } else {
	            offset = e[clientAxis] - this.start;
	        }

	        // If within snapOffset of min or max, set offset to min or max.
	        // snapOffset buffers a.minSize and b.minSize, so logic is opposite for both.
	        // Include the appropriate gutter sizes to prevent overflows.
	        if (offset <= elements[this.a].minSize + snapOffset + this.aGutterSize) {
	            offset = elements[this.a].minSize + this.aGutterSize;
	        } else if (offset >= this.size - (elements[this.b].minSize + snapOffset + this.bGutterSize)) {
	            offset = this.size - (elements[this.b].minSize + this.bGutterSize);
	        }

	        // Actually adjust the size.
	        adjust.call(this, offset);

	        // Call the drag callback continously. Don't do anything too intensive
	        // in this callback.
	        if (options.onDrag) {
	            options.onDrag();
	        }
	    }

	    // Cache some important sizes when drag starts, so we don't have to do that
	    // continously:
	    //
	    // `size`: The total size of the pair. First + second + first gutter + second gutter.
	    // `start`: The leading side of the first element.
	    //
	    // ------------------------------------------------
	    // |      aGutterSize -> |||                      |
	    // |                     |||                      |
	    // |                     |||                      |
	    // |                     ||| <- bGutterSize       |
	    // ------------------------------------------------
	    // | <- start                             size -> |
	    function calculateSizes () {
	        // Figure out the parent size minus padding.
	        var a = elements[this.a].element;
	        var b = elements[this.b].element;

	        this.size = a[getBoundingClientRect]()[dimension] + b[getBoundingClientRect]()[dimension] + this.aGutterSize + this.bGutterSize;
	        this.start = a[getBoundingClientRect]()[position];
	    }

	    // stopDragging is very similar to startDragging in reverse.
	    function stopDragging () {
	        var self = this;
	        var a = elements[self.a].element;
	        var b = elements[self.b].element;

	        if (self.dragging && options.onDragEnd) {
	            options.onDragEnd();
	        }

	        self.dragging = false;

	        // Remove the stored event listeners. This is why we store them.
	        global[removeEventListener]('mouseup', self.stop);
	        global[removeEventListener]('touchend', self.stop);
	        global[removeEventListener]('touchcancel', self.stop);

	        self.parent[removeEventListener]('mousemove', self.move);
	        self.parent[removeEventListener]('touchmove', self.move);

	        // Delete them once they are removed. I think this makes a difference
	        // in memory usage with a lot of splits on one page. But I don't know for sure.
	        delete self.stop;
	        delete self.move;

	        a[removeEventListener]('selectstart', NOOP);
	        a[removeEventListener]('dragstart', NOOP);
	        b[removeEventListener]('selectstart', NOOP);
	        b[removeEventListener]('dragstart', NOOP);

	        a.style.userSelect = '';
	        a.style.webkitUserSelect = '';
	        a.style.MozUserSelect = '';
	        a.style.pointerEvents = '';

	        b.style.userSelect = '';
	        b.style.webkitUserSelect = '';
	        b.style.MozUserSelect = '';
	        b.style.pointerEvents = '';

	        self.gutter.style.cursor = '';
	        self.parent.style.cursor = '';
	    }

	    // startDragging calls `calculateSizes` to store the inital size in the pair object.
	    // It also adds event listeners for mouse/touch events,
	    // and prevents selection while dragging so avoid the selecting text.
	    function startDragging (e) {
	        // Alias frequently used variables to save space. 200 bytes.
	        var self = this;
	        var a = elements[self.a].element;
	        var b = elements[self.b].element;

	        // Call the onDragStart callback.
	        if (!self.dragging && options.onDragStart) {
	            options.onDragStart();
	        }

	        // Don't actually drag the element. We emulate that in the drag function.
	        e.preventDefault();

	        // Set the dragging property of the pair object.
	        self.dragging = true;

	        // Create two event listeners bound to the same pair object and store
	        // them in the pair object.
	        self.move = drag.bind(self);
	        self.stop = stopDragging.bind(self);

	        // All the binding. `window` gets the stop events in case we drag out of the elements.
	        global[addEventListener]('mouseup', self.stop);
	        global[addEventListener]('touchend', self.stop);
	        global[addEventListener]('touchcancel', self.stop);

	        self.parent[addEventListener]('mousemove', self.move);
	        self.parent[addEventListener]('touchmove', self.move);

	        // Disable selection. Disable!
	        a[addEventListener]('selectstart', NOOP);
	        a[addEventListener]('dragstart', NOOP);
	        b[addEventListener]('selectstart', NOOP);
	        b[addEventListener]('dragstart', NOOP);

	        a.style.userSelect = 'none';
	        a.style.webkitUserSelect = 'none';
	        a.style.MozUserSelect = 'none';
	        a.style.pointerEvents = 'none';

	        b.style.userSelect = 'none';
	        b.style.webkitUserSelect = 'none';
	        b.style.MozUserSelect = 'none';
	        b.style.pointerEvents = 'none';

	        // Set the cursor, both on the gutter and the parent element.
	        // Doing only a, b and gutter causes flickering.
	        self.gutter.style.cursor = cursor;
	        self.parent.style.cursor = cursor;

	        // Cache the initial sizes of the pair.
	        calculateSizes.call(self);
	    }

	    // 5. Create pair and element objects. Each pair has an index reference to
	    // elements `a` and `b` of the pair (first and second elements).
	    // Loop through the elements while pairing them off. Every pair gets a
	    // `pair` object, a gutter, and isFirst/isLast properties.
	    //
	    // Basic logic:
	    //
	    // - Starting with the second element `i > 0`, create `pair` objects with
	    //   `a = i - 1` and `b = i`
	    // - Set gutter sizes based on the _pair_ being first/last. The first and last
	    //   pair have gutterSize / 2, since they only have one half gutter, and not two.
	    // - Create gutter elements and add event listeners.
	    // - Set the size of the elements, minus the gutter sizes.
	    //
	    // -----------------------------------------------------------------------
	    // |     i=0     |         i=1         |        i=2       |      i=3     |
	    // |             |       isFirst       |                  |     isLast   |
	    // |           pair 0                pair 1             pair 2           |
	    // |             |                     |                  |              |
	    // -----------------------------------------------------------------------
	    var pairs = [];
	    elements = ids.map(function (id, i) {
	        // Create the element object.
	        var element = {
	            element: elementOrSelector(id),
	            size: sizes[i],
	            minSize: minSizes[i],
	        };

	        var pair;

	        if (i > 0) {
	            // Create the pair object with it's metadata.
	            pair = {
	                a: i - 1,
	                b: i,
	                dragging: false,
	                isFirst: (i === 1),
	                isLast: (i === ids.length - 1),
	                direction: direction,
	                parent: parent,
	            };

	            // For first and last pairs, first and last gutter width is half.
	            pair.aGutterSize = gutterSize;
	            pair.bGutterSize = gutterSize;

	            if (pair.isFirst) {
	                pair.aGutterSize = gutterSize / 2;
	            }

	            if (pair.isLast) {
	                pair.bGutterSize = gutterSize / 2;
	            }

	            // if the parent has a reverse flex-direction, switch the pair elements.
	            if (parentFlexDirection === 'row-reverse' || parentFlexDirection === 'column-reverse') {
	                var temp = pair.a;
	                pair.a = pair.b;
	                pair.b = temp;
	            }
	        }

	        // Determine the size of the current element. IE8 is supported by
	        // staticly assigning sizes without draggable gutters. Assigns a string
	        // to `size`.
	        //
	        // IE9 and above
	        if (!isIE8) {
	            // Create gutter elements for each pair.
	            if (i > 0) {
	                var gutterElement = gutter(i, direction);
	                setGutterSize(gutterElement, gutterSize);

	                gutterElement[addEventListener]('mousedown', startDragging.bind(pair));
	                gutterElement[addEventListener]('touchstart', startDragging.bind(pair));

	                parent.insertBefore(gutterElement, element.element);

	                pair.gutter = gutterElement;
	            }
	        }

	        // Set the element size to our determined size.
	        // Half-size gutters for first and last elements.
	        if (i === 0 || i === ids.length - 1) {
	            setElementSize(element.element, element.size, gutterSize / 2);
	        } else {
	            setElementSize(element.element, element.size, gutterSize);
	        }

	        var computedSize = element.element[getBoundingClientRect]()[dimension];

	        if (computedSize < element.minSize) {
	            element.minSize = computedSize;
	        }

	        // After the first iteration, and we have a pair object, append it to the
	        // list of pairs.
	        if (i > 0) {
	            pairs.push(pair);
	        }

	        return element
	    });

	    function setSizes (newSizes) {
	        newSizes.forEach(function (newSize, i) {
	            if (i > 0) {
	                var pair = pairs[i - 1];
	                var a = elements[pair.a];
	                var b = elements[pair.b];

	                a.size = newSizes[i - 1];
	                b.size = newSize;

	                setElementSize(a.element, a.size, pair.aGutterSize);
	                setElementSize(b.element, b.size, pair.bGutterSize);
	            }
	        });
	    }

	    function destroy () {
	        pairs.forEach(function (pair) {
	            pair.parent.removeChild(pair.gutter);
	            elements[pair.a].element.style[dimension] = '';
	            elements[pair.b].element.style[dimension] = '';
	        });
	    }

	    if (isIE8) {
	        return {
	            setSizes: setSizes,
	            destroy: destroy,
	        }
	    }

	    return {
	        setSizes: setSizes,
	        getSizes: function getSizes () {
	            return elements.map(function (element) { return element.size; })
	        },
	        collapse: function collapse (i) {
	            if (i === pairs.length) {
	                var pair = pairs[i - 1];

	                calculateSizes.call(pair);

	                if (!isIE8) {
	                    adjust.call(pair, pair.size - pair.bGutterSize);
	                }
	            } else {
	                var pair$1 = pairs[i];

	                calculateSizes.call(pair$1);

	                if (!isIE8) {
	                    adjust.call(pair$1, pair$1.aGutterSize);
	                }
	            }
	        },
	        destroy: destroy,
	    }
	};

	return Split;

	})));
	});

	//Simulates input events
	//https://stackoverflow.com/questions/6157929/how-to-simulate-a-mouse-click-using-javascript
	function simulate(element, eventName) {
	    var options = extend(defaultOptions, arguments[2] || {});
	    var oEvent,
	        eventType = null;

	    for (var name in eventMatchers) {
	        if (eventMatchers[name].test(eventName)) {
	            eventType = name;break;
	        }
	    }

	    if (!eventType) throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

	    if (document.createEvent) {
	        oEvent = document.createEvent(eventType);
	        if (eventType == 'HTMLEvents') {
	            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
	        } else {
	            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView, options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
	        }
	        element.dispatchEvent(oEvent);
	    } else {
	        options.clientX = options.pointerX;
	        options.clientY = options.pointerY;
	        var evt = document.createEventObject();
	        oEvent = extend(evt, options);
	        element.fireEvent('on' + eventName, oEvent);
	    }
	    return element;
	}

	function extend(destination, source) {
	    for (var property in source) {
	        destination[property] = source[property];
	    }return destination;
	}

	var eventMatchers = {
	    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
	    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
	};
	var defaultOptions = {
	    pointerX: 0,
	    pointerY: 0,
	    button: 0,
	    ctrlKey: false,
	    altKey: false,
	    shiftKey: false,
	    metaKey: false,
	    bubbles: true,
	    cancelable: true
	};

	var eventSimulator = simulate;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	findindexPolyfill();

	var VIEWPORT_CONTENT_CLASS = 'viewport-content';
	var HANDLE_CLASS = 'split-drag';

	// Figure out if we're in IE8 or not. IE8 will still render correctly,
	// but will be static instead of draggable.
	var isIE8 = commonjsGlobal.attachEvent && !commonjsGlobal[addEventListener];

	var isString = function isString(s) {
	    return typeof s === 'string' || s instanceof String;
	};

	var DUMMY = function DUMMY() {
	    return false;
	};

	//Helper function that allows use of both ids and elements interchangeably.
	//Returns DOM element matching the selector or null if no one was found.
	var elementOrSelector = function elementOrSelector(idOrEl) {
	    return isString(idOrEl) ? document.querySelector(idOrEl) : idOrEl;
	};

	// Helper function gets a property from the properties object, with a default fallback
	var getOption$1 = function getOption(options, propName, def) {
	    var value = options[propName];
	    if (value !== undefined) return value;
	    return def;
	};

	var dist = function dist(dx, dy) {
	    return Math.sqrt(dx * dx + dy * dy);
	};

	var HORIZONTAL = 'horizontal';
	var VERTICAL = 'vertical';

	var isHorizontal = function isHorizontal(direction) {
	    return direction === HORIZONTAL;
	};

	//Returns true if it is a DOM element.
	//Taken from https://stackoverflow.com/a/384380/6657837
	function isDOMElement(el) {
	    return (typeof HTMLElement === 'undefined' ? 'undefined' : _typeof(HTMLElement)) === "object" ? el instanceof HTMLElement //DOM2
	    : el && (typeof el === 'undefined' ? 'undefined' : _typeof(el)) === "object" && el !== null && el.nodeType === 1 && typeof el.nodeName === "string";
	}

	var BlenderUI = function BlenderUI(id) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


	    var nodeCounter = 0;
	    window.Split = split; //for debugging purposes

	    var proportion = function proportion(start, size, pos) {
	        return 100.0 * (pos - start) / size;
	    };

	    //Converts viewport DOM element to viewport container
	    //Called usually when viewport is splitted and needs to change its type.
	    function defaultViewportToContainerFn(viewport) {
	        viewport.className += ' viewport-container';
	        return viewport;
	    }

	    var content = function content(parent) {
	        return parent.querySelector('.' + VIEWPORT_CONTENT_CLASS);
	    };

	    //Helper function copies all html content from one element to another
	    function copyContent(from, to) {
	        to.innerHTML = from.innerHTML;
	    }

	    //Helper function _moves_ all html content from one element to another
	    //It removes content from source element.
	    function moveContent(from, to) {
	        copyContent(from, to);
	        from.innerHTML = '';
	    }

	    //Creates a handle with default options to split a viewport
	    function defaultHandleFn() {
	        var handle = document.createElement('div');
	        handle.className = HANDLE_CLASS;
	        return handle;
	    }

	    //Creates a viewport DOM element with default options
	    //Takes a handle generator function as a parameter
	    function defaultViewportFn(numId) {
	        var viewport = document.createElement('div');
	        viewport.className = 'viewport';
	        viewport.id = 'v' + numId;

	        var content = document.createElement('div');
	        content.className = VIEWPORT_CONTENT_CLASS;

	        viewport.appendChild(handle());
	        viewport.appendChild(content);
	        return viewport;
	    }

	    function initListeners(viewportNode) {
	        var viewport = viewportNode.data.el;
	        var handle = viewport.querySelector('.' + HANDLE_CLASS);
	        viewportNode.data.listeners = {
	            mousedown: prepareDragging.bind(viewportNode)
	        };
	        viewportNode.data.listeners.touchdown = viewportNode.data.listeners.mousedown;

	        handle.addEventListener('mousedown', viewportNode.data.listeners.mousedown);
	        handle.addEventListener('touchdown', viewportNode.data.listeners.touchdown);
	    }

	    //Goes through all children and adds their dom element into an array,
	    //in the order as they appear in the HTML code.
	    //Returns this array of dom elements.
	    function unrollChildren(node, direction) {
	        if (direction === undefined) {
	            if (node.data.direction === undefined) {
	                if (node.children.length === 0) return [];
	                direction = HORIZONTAL;
	            } else direction = node.data.direction;
	        }
	        var domChildren = node.children.map(function (child) {
	            return child.data.el;
	        });
	        if (!isHorizontal(direction)) domChildren.reverse();
	        return domChildren;
	    }

	    function childrenSizes(parent) {
	        //[ 100.0 ] is the root viewport case, single element
	        return !!parent.data.split ? parent.data.split.getSizes() : [100.0];    }

	    function oldSizePosition(child) {
	        var parent = child.parent;
	        //Children are either the root viewports (no direction=horizontal, otherwise direction is specified),
	        //or usual viewports, whose parent always has the direction set
	        var domChildren = unrollChildren(parent);
	        var sizes = childrenSizes(parent);
	        return domChildren.indexOf(child.data.el);
	    }

	    //returns abstracted values {start, size} of viewport depending on the direction of split
	    function measure(domElement, direction) {
	        var rect = domElement.getBoundingClientRect();
	        var isH = isHorizontal(direction);
	        return {
	            start: isH ? rect.left : rect.top,
	            size: isH ? rect.width : rect.height
	        };
	    }

	    function removeListeners(viewportNode) {
	        var viewport = viewportNode.data.el;
	        var handle = viewport.querySelector('.' + HANDLE_CLASS);

	        handle.removeEventListener('mousedown', viewportNode.data.listeners.mousedown);
	        handle.removeEventListener('touchdown', viewportNode.data.listeners.touchdown);

	        //viewport.removeEventListener('mousemove', viewportNode.data.listeners.mousemove);
	    }

	    //Called on mousedown or touchdown before any movements.
	    //Allows to distinguish mousemove preceded by mousedown.
	    function prepareDragging(e) {
	        var data = this.data;

	        this.data.isMouseDown = true;
	        data.origin = { x: e.clientX, y: e.clientY };
	        last = this;
	    }

	    //Called on all mousemove events if there is preceding them mousedown or touchdown event
	    function movingMouse(e) {
	        e.preventDefault();
	        if (last === null) return;
	        var data = last.data;
	        if (!data.isMouseDown) return;
	        var vector = {
	            x: e.clientX - data.origin.x,
	            y: e.clientY - data.origin.y
	        };
	        if (data.isDragging) dragging.call(last, e, data.origin, vector);else if (data.isMouseDown && dist(vector.x, vector.y) >= threshold) {
	            var direction = Math.abs(vector.x) >= Math.abs(vector.y) ? HORIZONTAL : VERTICAL;
	            var activeNode = startDragging.call(last, e, direction, vector);
	            if (activeNode) {
	                var _handle = activeNode.data.el.querySelector('.' + HANDLE_CLASS);
	                var origin = data.origin;
	                stopDragging();
	                eventSimulator(_handle, 'mousedown', { pointerX: origin.x, pointerY: origin.y });
	                activeNode.data.isDragging = true;
	            } else {
	                stopDragging();
	            }
	        }
	    }

	    function stopDragging() {
	        if (last === null) return;

	        var data = last.data;
	        delete data.isDragging;
	        delete data.isMouseDown;
	        delete data.origin;
	        last = null;
	    }

	    function startDragging(e, direction, vector) {
	        var isH = isHorizontal(direction);

	        if (isH && vector.x >= 0 || !isH && vector.y <= 0) {
	            merge(this, direction);
	            return false;
	        }

	        return split$$1(this, direction);
	    }

	    //If drag is successfull,
	    //this function will be called on each mousemove event
	    function dragging(e, origin, vector) {
	        var node = this,
	            data = this.data,
	            direction = node.parent.data.direction;
	        var isH = isHorizontal(direction);
	        var neighboringPosition = node.parent.children.findIndex(function (child) {
	            return child === node;
	        });
	        var neighbor = node.parent.children[neighboringPosition + 1];

	        var _measure = measure(data.el, direction),
	            start = _measure.start,
	            size = _measure.size;

	        var neighborDims = measure(neighbor.data.el, direction);
	        var pos = isH ? origin.x + vector.x : origin.y + vector.y;
	        pos = isH ? Math.min(Math.max(start + minSize, pos), neighborDims.start + neighborDims.size - minSize) : Math.min(Math.max(neighborDims.start + minSize, pos), start + size - minSize);
	        removeGutters(node.parent.data.el);
	        var domChildren = unrollChildren(node.parent);
	        var sizePos = oldSizePosition(node);
	        var sizes = node.parent.data.split.getSizes();
	        var oldSize = sizes[sizePos]; // in percentages
	        var newSize = 1.0 * oldSize / size * (isH ? pos - start : start + size - pos);
	        var sizeDiff = newSize - oldSize;
	        var neighborSizePos = sizePos + (isH ? 1 : -1);
	        sizes[neighborSizePos] -= sizeDiff;
	        sizes[sizePos] = newSize;
	        node.parent.data.split = split(domChildren, {
	            direction: direction,
	            sizes: sizes,
	            minSize: minSize
	        });
	    }

	    function removeGutters(domContainer) {
	        var child = domContainer.firstChild;
	        while (child !== null) {
	            var nextChild = child.nextSibling;
	            if (!isDOMElement(child)) {
	                child = nextChild;
	                continue;
	            }
	            if (child.className.indexOf('gutter') != -1) domContainer.removeChild(child);
	            child = nextChild;
	        }
	    }

	    function merge(viewNode) {
	        var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : HORIZONTAL;

	        var parent = viewNode.parent;
	        var neighbors = parent.children;
	        if (neighbors.length === 1 || //no neighbors to merge at all
	        parent.data.direction !== direction || //can't merge viewports divided in opposite direction
	        neighbors[neighbors.length - 1] === viewNode) //this viewport is the rightmost (topmost)
	            return;
	        var position = neighbors.findIndex(function (child) {
	            return child === viewNode;
	        });
	        var neighbor = neighbors[position + 1];
	        //neighbor is splitted, we can't merge them
	        if (neighbor.data.direction) return;

	        var sizes = parent.data.split.getSizes();
	        var sizePosition = position;
	        if (!isHorizontal(direction)) {
	            sizePosition = neighbors.length - sizePosition - 1;
	        }
	        var neighborSizePosition = sizePosition + (isHorizontal(direction) ? 1 : -1);
	        var newSize = sizes[sizePosition] + sizes[neighborSizePosition];

	        //special case
	        if (neighbors.length === 2) {
	            removeListeners(neighbor);
	            removeListeners(viewNode);
	            removeGutters(parent.data.el);
	            parent.removeChild(function (child) {
	                return true;
	            });
	            parent.data.el.removeChild(neighbor.data.el);
	            parent.data = { el: parent.data.el, id: parent.data.id };
	            //when root viewports
	            //it is the chance to reset everything
	            if (parent.parent === null) {
	                nodeCounter = 1;
	                viewNode.data.el.removeAttribute('style');
	                viewNode.data.el.className = 'viewport';
	                viewNode.data.el.id = 'v' + nodeCounter;
	                //parent.data.el.className = 'viewport viewport-container';
	                parent.addChild(narytree([], { el: viewNode.data.el, id: nodeCounter })).forEach(initListeners);
	                return;
	            }
	            var childContent = content(viewNode.data.el);
	            parent.data.el.removeChild(viewNode.data.el);
	            parent.data.el.appendChild(childContent);
	            parent.data.el.insertBefore(handle(), childContent);
	            parent.data.el.className = 'viewport split split-' + parent.parent.data.direction;
	            initListeners(parent);
	            return;
	        }

	        console.log("merging");

	        sizes.splice(sizePosition - (isHorizontal(direction) ? 0 : 1), 2, newSize);
	        removeListeners(neighbor);
	        parent.data.el.removeChild(neighbor.data.el);
	        parent.removeChild(function (child) {
	            return child === neighbor;
	        });
	        removeGutters(parent.data.el);

	        var domChildren = unrollChildren(parent);
	        parent.data.split = split(domChildren, {
	            direction: direction,
	            sizes: sizes,
	            minSize: minSize
	        });
	    }

	    function split$$1(viewNode) {
	        var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : HORIZONTAL;

	        var isH = isHorizontal(direction);
	        var parentNode = viewNode.parent;

	        if (parentNode.data.split && parentNode.data.direction !== direction) {
	            var parent = viewNode.data.el;
	            var _left = viewport(++nodeCounter);
	            var _right = viewport(++nodeCounter);
	            _left.className += ' split split-' + direction;
	            _right.className += ' split split-' + direction;

	            var _measure2 = measure(parent, direction),
	                _start = _measure2.start,
	                _size = _measure2.size;

	            var _leftSize = proportion(_start, _size, _start + _size - minSize);
	            if (_leftSize < proportion(_start, _size, _start + minSize)) return false;
	            var _rightSize = 100.0 - _leftSize;

	            viewNode.addChild(narytree([], { el: _left, id: nodeCounter - 1 }), narytree([], { el: _right, id: nodeCounter })).forEach(initListeners);

	            var parentContent = content(parent);
	            var _leftContent = content(_left);
	            var _rightContent = content(_right);

	            toContainer(parent);
	            moveContent(parentContent, _leftContent);
	            copyContent(_leftContent, _rightContent);
	            removeListeners(viewNode);
	            parent.removeChild(parent.querySelector('.' + HANDLE_CLASS));
	            parent.removeChild(parentContent);
	            parent.appendChild(isH ? _left : _right);
	            parent.appendChild(isH ? _right : _left);
	            onCreate(_right);

	            var _domChildren = unrollChildren(viewNode, direction);
	            if (!isH) {
	                var tmp = _rightSize;
	                _rightSize = _leftSize;
	                _leftSize = tmp;
	            }

	            viewNode.data.split = split(_domChildren, {
	                direction: direction,
	                sizes: [_leftSize, 100.0 - _leftSize],
	                minSize: minSize
	            });
	            viewNode.data.direction = direction;
	            var _newContent = onSplit(parent, _left, _right);
	            if (_newContent) {
	                var tmpContainer = document.createElement('div');
	                tmpContainer.appendChild(_newContent);
	                copyContent(tmpContainer, _rightContent);
	            }
	            return viewNode.children[0];
	        }

	        var left = viewNode.data.el;
	        var right = viewport(++nodeCounter);
	        var domContainer = parentNode.data.el;

	        //saving size before appending

	        var _measure3 = measure(left, direction),
	            start = _measure3.start,
	            size = _measure3.size;
	        //evaluating new size, but not changing yet


	        var leftSize = proportion(start, size, start + size - minSize);
	        if (leftSize < proportion(start, size, start + minSize)) return false;
	        var rightSize = 100.0 - leftSize;

	        //need to find old size of splitted viewport before adding new one
	        var sizePos = oldSizePosition(viewNode);
	        var sizes = childrenSizes(parentNode);
	        var partition = sizes[sizePos];
	        //actual sizes
	        leftSize = partition / 100.0 * leftSize;
	        rightSize = partition / 100.0 * rightSize;

	        left.className += ' split split-' + direction;
	        right.className += ' split split-' + direction;

	        //const leftNode = node(node, [], {el: left});
	        //const rightNode = node(node, [], {el: right});
	        parentNode.addChild(narytree([], { el: right, id: nodeCounter }), {
	            after: viewNode.data.id
	        }).forEach(initListeners);
	        var domChildren = unrollChildren(parentNode, direction);

	        //Copy content of splitted node to the new one and then add to DOM
	        var leftContent = content(left);
	        var rightContent = content(right);
	        copyContent(leftContent, rightContent);

	        if (isH) domContainer.insertBefore(right, left.nextSibling);else domContainer.insertBefore(right, left);

	        //calling listener
	        onCreate(right);

	        if (!isH) {
	            var _tmp = rightSize;
	            rightSize = leftSize;
	            leftSize = _tmp;
	        }

	        removeGutters(domContainer);
	        sizes.splice(sizePos, 1, leftSize, rightSize);
	        parentNode.data.split = split(domChildren, {
	            direction: direction,
	            sizes: sizes,
	            minSize: minSize
	        });

	        parentNode.data.direction = direction;
	        var newContent = onSplit(parentNode.data.el, left, right);
	        if (newContent) {
	            var _tmpContainer = document.createElement('div');
	            _tmpContainer.appendChild(newContent);
	            copyContent(_tmpContainer, rightContent);
	        }

	        return viewNode;
	    }

	    var rootContainer = elementOrSelector(id);
	    if (!isDOMElement(rootContainer)) throw new Error('Please specify the correct container. This container is not a DOM element.');
	    var root = narytree([], { el: rootContainer, id: nodeCounter });
	    var threshold = getOption$1(options, 'dragThreshold', 10);
	    var minSize = getOption$1(options, 'minSize', 50);
	    var handle = getOption$1(options, 'handle', defaultHandleFn);
	    var viewport = getOption$1(options, 'viewport', defaultViewportFn);
	    var toContainer = getOption$1(options, 'viewportToContainer', defaultViewportToContainerFn);
	    var events = getOption$1(options, 'events', {});
	    var onSplit = getOption$1(events, 'onSplit', DUMMY);
	    var onMerge = getOption$1(events, 'onMerge', DUMMY);
	    var onCreate = getOption$1(events, 'onCreate', DUMMY);
	    var rootElement = viewport(++nodeCounter);
	    var last = null;
	    //rootElement.className += ' split split-horizontal';

	    rootContainer.appendChild(rootElement);
	    var firstChild = narytree([], { el: rootElement, id: nodeCounter });
	    root.addChild(firstChild);

	    document.addEventListener('mouseup', stopDragging);
	    document.addEventListener('mousemove', movingMouse);
	    document.addEventListener('touchmove', movingMouse);
	    initListeners(firstChild);

	    window.root = root; //for debug
	    //rootHandle.addEventListener('mousedown', stopDragging.bind(this.root));
	    //rootHandle.addEventListener('touchdown', stopDragging.bind(this.root));
	};

	var blenderUi = BlenderUI;

	return blenderUi;

})));
