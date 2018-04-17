// rollup.config.js
const PRODUCTION = 'production';
const isProd = process.env.NODE_ENV === PRODUCTION;
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const postcss = require('rollup-plugin-postcss');
const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano');
//const buble = require('rollup-plugin-buble');


const postcssPlugins = [cssnext()];
if (isProd) {
    postcssPlugins.push(
        cssnano({
            preset: ['default', {
                discardComments: {
                    removeAll: true
                },
                normalizeWhitespace: false
            }]
        })
    );
}

const postcssConfig = {
    extract: true,
    extensions: [ '.css' ],
    plugins: postcssPlugins
};

const defaultConfig = {
    input: 'src/blender-ui.js',
    output: {
        file: `dist/blender-ui${isProd ? '.min' : ''}.js`,
        format: 'umd',
        name: 'blender-ui'
    },
    plugins: [
        postcss(postcssConfig),
        resolve(),
        commonjs(),
        babel({
            exclude: 'node_modules/**'
        }),
        isProd && uglify()
    ]
};

export default defaultConfig;
