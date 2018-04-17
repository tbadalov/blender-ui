//Returns id of the parent node
const getOption = (opt, name, def) => {
    const value = opt[name];
    if ( value !== undefined )
        return value;
    return def;
}

const isOption = obj => !obj.hasOwnProperty('children');

// makes tree node with data shaped like this:
// {
//     id: node id
//     el: DOM element
// }
function node(children = [], data = {}) {
    return {
        parent: null,
        children,
        data,
        removeChild: function (filterFn) {
            for (let i = this.children.length-1; i >=0; i--) {
                const child = this.children[i];
                if (filterFn(child)) this.children.splice(i, 1);
            }
        },
        addChild: function () {
            console.log(arguments);
            if ( arguments.length === 0 )
                return;

            let opts = arguments[arguments.length-1];
            let argsLength = arguments.length-1;
            if ( !isOption(opts) ) {
                argsLength = arguments.length;
                opts = {};
                var start = this.children.length;
            }

            let children = [];
            for (var i = 0; i < argsLength; i++) {
                let child = arguments[i];
                child.parent = this;
                children.push(child);
            }

            if (isOption(opts)){
               let after = getOption(opts, 'after', undefined);
               var start = after === undefined ? this.children.length : this.children.findIndex(node => node.data.id === after)+1;
            }

            this.children.splice.apply(this.children, [start, 0].concat(children));
            return children;
        }
    };
}
module.exports = node;
