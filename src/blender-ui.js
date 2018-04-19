require( '../assets/css/split.css');
require( '../assets/css/viewport.css');
require('./findindex-polyfill')();
const node = require('./narytree');
const Split = require('split.js');
const simulate = require('./event-simulator');
const VIEWPORT_CONTENT_CLASS = 'viewport-content';
const HANDLE_CLASS = 'split-drag';

// Figure out if we're in IE8 or not. IE8 will still render correctly,
// but will be static instead of draggable.
const isIE8 = global.attachEvent && !global[addEventListener];

const isString = s => typeof s === 'string' || s instanceof String;

const DUMMY = () => false;

//Helper function that allows use of both ids and elements interchangeably.
//Returns DOM element matching the selector or null if no one was found.
const elementOrSelector = idOrEl => isString(idOrEl) ? document.querySelector(idOrEl) : idOrEl;

// Helper function gets a property from the properties object, with a default fallback
const getOption = (options, propName, def) => {
    const value = options[propName];
    if (value !== undefined)
        return value;
    return def;
};

const dist = (dx, dy) => Math.sqrt(dx*dx + dy*dy);

const HORIZONTAL = 'horizontal';
const VERTICAL = 'vertical';

const isHorizontal = direction => direction === HORIZONTAL;

//Returns true if it is a DOM element.
//Taken from https://stackoverflow.com/a/384380/6657837
function isDOMElement(el){
  return typeof HTMLElement === "object"
    ?   el instanceof HTMLElement //DOM2
    :   el && typeof el === "object" && el !== null &&
        el.nodeType === 1 && typeof el.nodeName==="string"
}

const BlenderUI = function (id, options = {}) {

    let nodeCounter = 0;
    window.Split = Split; //for debugging purposes

    const proportion = (start, size, pos) => 100.0 * (pos-start) / size;

    //Converts viewport DOM element to viewport container
    //Called usually when viewport is splitted and needs to change its type.
    function defaultViewportToContainerFn(viewport) {
        viewport.className += ' viewport-container';
        return viewport;
    }

    const content = parent => parent.querySelector(`.${VIEWPORT_CONTENT_CLASS}`);

    //Helper function copies all html content from one element to another
    function copyHtmlContent(from, to) {
        to.innerHTML = from.innerHTML;
    }

    //Helper function _moves_ all html content from one element to another
    //It removes content from source element.
    function moveContent(from, to) {
        let child = from.firstChild;
        while (child !== null) {
            const nextChild = child.nextSibling;
            if (!isDOMElement(child)) {
                child = nextChild;
                continue;
            }
            to.appendChild(child);
            child = nextChild;
        }
        from.innerHTML = '';
    }

    //Creates a handle with default options to split a viewport
    function defaultHandleFn() {
        const handle = document.createElement('div');
        handle.className = HANDLE_CLASS;
        return handle;
    }

    //Creates a viewport DOM element with default options
    //Takes a handle generator function as a parameter
    function defaultViewportFn(numId) {
        const viewport = document.createElement('div');
        viewport.className = 'viewport';
        viewport.id = `v${numId}`;

        const contentContainer = document.createElement('div');
        contentContainer.className = VIEWPORT_CONTENT_CLASS;

        viewport.appendChild(handle());
        viewport.appendChild(contentContainer);
        return viewport;
    }

    function initListeners(viewportNode) {
        const viewport = viewportNode.data.el;
        const handle = viewport.querySelector(`.${HANDLE_CLASS}`);
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
        const domChildren = node.children.map(child => child.data.el);
        if (!isHorizontal(direction)) domChildren.reverse();
        return domChildren;
    }

    function childrenSizes(parent) {
        //[ 100.0 ] is the root viewport case, single element
        return !!parent.data.split ? parent.data.split.getSizes() : [ 100.0 ];;
    }

    function oldSizePosition(child) {
        const parent = child.parent;
        //Children are either the root viewports (no direction=horizontal, otherwise direction is specified),
        //or usual viewports, whose parent always has the direction set
        const domChildren = unrollChildren(parent);
        const sizes = childrenSizes(parent);
        return domChildren.indexOf(child.data.el);
    }

    //returns abstracted values {start, size} of viewport depending on the direction of split
    function measure(domElement, direction) {
        const rect = domElement.getBoundingClientRect();
        const isH = isHorizontal(direction);
        return {
            start: isH ? rect.left : rect.top,
            size: isH ? rect.width : rect.height
        };
    }

    function removeListeners(viewportNode) {
        const viewport = viewportNode.data.el;
        const handle = viewport.querySelector(`.${HANDLE_CLASS}`);

        handle.removeEventListener('mousedown', viewportNode.data.listeners.mousedown);
        handle.removeEventListener('touchdown', viewportNode.data.listeners.touchdown);

        //viewport.removeEventListener('mousemove', viewportNode.data.listeners.mousemove);
    }

    //Called on mousedown or touchdown before any movements.
    //Allows to distinguish mousemove preceded by mousedown.
    function prepareDragging(e) {
        const data = this.data;

        this.data.isMouseDown = true;
        data.origin = {x: e.clientX, y: e.clientY};
        last = this;
    }

    //Called on all mousemove events if there is preceding them mousedown or touchdown event
    function movingMouse(e) {
        e.preventDefault();
        if (last === null) return;
        const data = last.data;
        if (!data.isMouseDown)
            return;
        const vector = {
            x: e.clientX - data.origin.x,
            y: e.clientY - data.origin.y
        };
        if (data.isDragging)
            dragging.call(last, e, data.origin, vector);
        else if (data.isMouseDown && dist(vector.x, vector.y) >= threshold) {
            let direction = Math.abs(vector.x) >= Math.abs(vector.y) ? HORIZONTAL : VERTICAL;
            var activeNode = startDragging.call(last, e, direction, vector);
            if (activeNode) {
                const handle = activeNode.data.el.querySelector(`.${HANDLE_CLASS}`);
                const origin = data.origin;
                stopDragging();
                simulate(handle, 'mousedown', {pointerX: origin.x, pointerY: origin.y});
                activeNode.data.isDragging = true;
            } else {
                stopDragging();
            }
        }
    }

    function stopDragging() {
        if (last === null) return;

        const data = last.data;
        delete data.isDragging;
        delete data.isMouseDown;
        delete data.origin;
        last = null;
    }

    function startDragging(e, direction, vector) {
        const isH = isHorizontal(direction);

        if (isH && vector.x >= 0 || !isH && vector.y <= 0) {
            merge(this, direction);
            return false;
        }

        return split(this, direction);
    }

    //If drag is successfull,
    //this function will be called on each mousemove event
    function dragging(e, origin, vector) {
        const node = this,
            data = this.data,
            direction = node.parent.data.direction;
        const isH = isHorizontal(direction);
        const neighboringPosition = node.parent.children.findIndex(child => child === node);
        const neighbor = node.parent.children[neighboringPosition+1];

        const {start, size} = measure(data.el, direction);
        const neighborDims = measure(neighbor.data.el, direction);
        var pos = isH ? origin.x+vector.x : origin.y+vector.y;
        pos = (isH
                 ? Math.min(Math.max(start+minSize, pos), neighborDims.start+neighborDims.size-minSize)
                 : Math.min(Math.max(neighborDims.start+minSize, pos), start+size-minSize));
        removeGutters(node.parent.data.el);
        const domChildren = unrollChildren(node.parent);
        const sizePos = oldSizePosition(node);
        const sizes = node.parent.data.split.getSizes();
        const oldSize = sizes[sizePos]; // in percentages
        const newSize = 1.0 * oldSize / size * (
            isH ? (pos-start) : (start+size - pos)
        );
        const sizeDiff = newSize - oldSize;
        const neighborSizePos = sizePos + (isH ? 1 : -1);
        sizes[neighborSizePos] -= sizeDiff;
        sizes[sizePos] = newSize;
        node.parent.data.split = Split(domChildren, {
            direction,
            sizes,
            minSize
        });
    }

    function removeGutters(domContainer) {
        let child = domContainer.firstChild;
        while (child !== null) {
            const nextChild = child.nextSibling;
            if (!isDOMElement(child)) {
                child = nextChild;
                continue;
            }
            if (child.className.indexOf('gutter') != -1)
                domContainer.removeChild(child);
            child = nextChild;
        }
    }

    function merge(viewNode, direction = HORIZONTAL) {
        const parent = viewNode.parent;
        const neighbors = parent.children;
        if (neighbors.length === 1 ||                   //no neighbors to merge at all
            parent.data.direction !== direction ||      //can't merge viewports divided in opposite direction
            neighbors[neighbors.length-1] === viewNode) //this viewport is the rightmost (topmost)
            return;
        let position = neighbors.findIndex(child => child === viewNode);
        let neighbor = neighbors[position+1];
        //neighbor is splitted, we can't merge them
        if (neighbor.data.direction) return;

        let sizes = parent.data.split.getSizes();
        let sizePosition = position;
        if (!isHorizontal(direction)) {
            sizePosition = neighbors.length - sizePosition - 1;
        }
        let neighborSizePosition = sizePosition + (isHorizontal(direction) ? 1 : -1);
        let newSize = sizes[sizePosition] + sizes[neighborSizePosition];

        //special case
        if (neighbors.length === 2) {
            removeListeners(neighbor);
            removeListeners(viewNode);
            removeGutters(parent.data.el);
            parent.removeChild(child => true);
            parent.data.el.removeChild(neighbor.data.el);
            parent.data = {el: parent.data.el, id: parent.data.id};
            //when root viewports
            //it is the chance to reset everything
            if (parent.parent === null) {
                nodeCounter = 1;
                viewNode.data.el.removeAttribute('style');
                viewNode.data.el.className = 'viewport';
                viewNode.data.el.id = `v${nodeCounter}`;
                //parent.data.el.className = 'viewport viewport-container';
                parent.addChild(
                    node([], {el: viewNode.data.el, id: nodeCounter})
                ).forEach(initListeners);
                return;
            }
            const childContent = content(viewNode.data.el);
            parent.data.el.removeChild(viewNode.data.el);
            parent.data.el.appendChild(childContent);
            parent.data.el.insertBefore(handle(), childContent);
            parent.data.el.className = `viewport split split-${parent.parent.data.direction}`;
            initListeners(parent);
            return;
        }

        sizes.splice(sizePosition-(isHorizontal(direction) ? 0 : 1), 2, newSize);
        removeListeners(neighbor);
        parent.data.el.removeChild(neighbor.data.el);
        parent.removeChild(child => child === neighbor);
        removeGutters(parent.data.el);

        let domChildren = unrollChildren(parent);
        parent.data.split = Split(domChildren, {
            direction,
            sizes,
            minSize
        });
    }

    function split(viewNode, direction = HORIZONTAL) {
        const isH = isHorizontal(direction);
        const parentNode = viewNode.parent;

        if (parentNode.data.split && parentNode.data.direction !== direction) {
            const parent = viewNode.data.el;
            const left = viewport(++nodeCounter);
            const right = viewport(++nodeCounter);
            left.className += ` split split-${direction}`;
            right.className += ` split split-${direction}`;

            const {start, size} = measure(parent, direction);
            let leftSize = proportion(start, size, start+size-minSize);
            if (leftSize < proportion(start, size, start+minSize)) return false;
            let rightSize = 100.0-leftSize;

            viewNode.addChild(
                node([], {el: left, id: nodeCounter-1}),
                node([], {el: right, id: nodeCounter})
            ).forEach(initListeners);

            const parentContent = content(parent);
            const leftContent = content(left);
            const rightContent = content(right);

            toContainer(parent);
            moveContent(parentContent, leftContent);
            copyHtmlContent(leftContent, rightContent);
            removeListeners(viewNode);
            parent.removeChild(parent.querySelector(`.${HANDLE_CLASS}`));
            parent.removeChild(parentContent);
            parent.appendChild(isH ? left : right);
            parent.appendChild(isH ? right : left);
            onCreate(right);

            let domChildren = unrollChildren(viewNode, direction);
            if (!isH) {
                let tmp = rightSize;
                rightSize = leftSize;
                leftSize = tmp;
            }

            viewNode.data.split = Split(domChildren, {
                direction,
                sizes: [leftSize, 100.0-leftSize],
                minSize
            });
            viewNode.data.direction = direction;
            const newContent = onSplit(parent, left, right);
            if (newContent) {
                const tmpContainer = document.createElement('div');
                tmpContainer.appendChild(newContent);
                copyHtmlContent(tmpContainer, rightContent);
            }
            return viewNode.children[0];
        }


        const left = viewNode.data.el;
        const right = viewport(++nodeCounter);
        const domContainer = parentNode.data.el;

        //saving size before appending
        const {start, size} = measure(left, direction);
        //evaluating new size, but not changing yet
        let leftSize = proportion(start, size, start+size-minSize);
        if (leftSize < proportion(start, size, start+minSize)) return false;
        let rightSize = 100.0-leftSize;

        //need to find old size of splitted viewport before adding new one
        const sizePos = oldSizePosition(viewNode);
        const sizes = childrenSizes(parentNode);
        const partition = sizes[sizePos];
        //actual sizes
        leftSize = partition/100.0 * leftSize;
        rightSize = partition/100.0 * rightSize;

        left.className += ` split split-${direction}`;
        right.className += ` split split-${direction}`;

        //const leftNode = node(node, [], {el: left});
        //const rightNode = node(node, [], {el: right});
        parentNode.addChild(node([], {el: right, id: nodeCounter}), {
            after: viewNode.data.id
        }).forEach(initListeners);
        const domChildren = unrollChildren(parentNode, direction);

        //Copy content of splitted node to the new one and then add to DOM
        const leftContent = content(left);
        const rightContent = content(right);
        copyHtmlContent(leftContent, rightContent);

        if (isH) domContainer.insertBefore(right, left.nextSibling);
        else domContainer.insertBefore(right, left);

        //calling listener
        onCreate(right);

        if (!isH) {
            let tmp = rightSize;
            rightSize = leftSize;
            leftSize = tmp;
        }

        removeGutters(domContainer);
        sizes.splice(sizePos, 1, leftSize, rightSize);
        parentNode.data.split = Split(domChildren, {
            direction,
            sizes,
            minSize
        });

        parentNode.data.direction = direction;
        const newContent = onSplit(parentNode.data.el, left, right);
        if (newContent) {
            const tmpContainer = document.createElement('div');
            tmpContainer.appendChild(newContent);
            copyHtmlContent(tmpContainer, rightContent);
        }

        return viewNode;
    }

    const rootContainer = elementOrSelector(id);
    if ( !isDOMElement(rootContainer) )
        throw new Error(`Please specify the correct container. This container is not a DOM element.`);
    const root = node([], {el: rootContainer, id: nodeCounter});
    const threshold = getOption(options, 'dragThreshold', 10);
    const minSize = getOption(options, 'minSize', 50);
    const handle = getOption(options, 'handle', defaultHandleFn);
    const viewport = getOption(options, 'viewport', defaultViewportFn);
    const contentFn = getOption(options, 'content', DUMMY);
    const toContainer = getOption(options, 'viewportToContainer', defaultViewportToContainerFn);
    const events = getOption(options, 'events', {});
    const onSplit = getOption(events, 'onSplit', DUMMY);
    const onMerge = getOption(events, 'onMerge', DUMMY);
    const onCreate = getOption(events, 'onCreate', DUMMY);
    const rootElement = viewport(++nodeCounter);
    const defaultContent = contentFn();
    if (isDOMElement(defaultContent)) {
        content(rootElement).appendChild(defaultContent);
    }
    var last = null;
    //rootElement.className += ' split split-horizontal';

    rootContainer.appendChild(rootElement);
    let firstChild = node([], {el: rootElement, id: nodeCounter});
    root.addChild(firstChild);

    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('mousemove', movingMouse);
    document.addEventListener('touchmove', movingMouse);
    initListeners(firstChild);

    window.root = root; //for debug
    //rootHandle.addEventListener('mousedown', stopDragging.bind(this.root));
    //rootHandle.addEventListener('touchdown', stopDragging.bind(this.root));
};

module.exports = BlenderUI;
