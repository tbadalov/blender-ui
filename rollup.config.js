// rollup.config.js
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const postcss = require('rollup-plugin-postcss');
//const buble = require('rollup-plugin-buble');

const defaultConfig = {
    input: 'src/blender-ui.js',
    output: {
        file: 'dist/blender-ui.js',
        format: 'umd',
        name: 'blender-ui'
    },
    plugins: [
        resolve(),
        commonjs(),
        babel({
            exclude: 'node_modules/**'
        })
    ]
};


function config(filename = `dist/${defaultConfig.output.name}.js`, plugins = [], moduleName = defaultConfig.output.name) {
    console.log(filename);
    const editedConfig = Object.assign({}, defaultConfig);
    editedConfig.output = Object.assign({}, defaultConfig.output, {
        file: filename,
        format: defaultConfig.output.format,
        name: moduleName
    });
    editedConfig.plugins = [].concat(editedConfig.plugins, plugins);

    return editedConfig;
}

export default [
    config(),
    config(`dist/${defaultConfig.output.name}.min.js`, [ uglify() ])
]
