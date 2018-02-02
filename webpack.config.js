const webpack = require('webpack')
const path = require('path')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    devtool: 'eval-source-map',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, './public'),
        filename: 'bundle.js?v=[hash:6]'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: './index.html',
            template: './templates/index.html'
        })
    ],
    module: {
        rules: [
            {
                test: /\.(js)/,
                loader: 'babel-loader',
                exclude: path.resolve(__dirname, './node_modules')
            },
            {
                test: /\.styl$/,
                use: [
                    { loader: 'style-loader', options: { sourceMap: false }},
                    { loader: 'css-loader', options: { sourceMap: false }},
                    {
                        loader: 'postcss-loader',
                        options: {
                            souceMap: false,
                            plugins: () => [autoprefixer]
                        }
                    },
                    { loader: 'stylus-loader', options: { sourceMap: false }},
                ],
                exclude: path.resolve(__dirname, './node_modules')
            }
        ]
    }
}

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map'
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         warnings: false
        //     }
        // }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ])
}
