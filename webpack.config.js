/*
* @Author: lushijie
* @Date:   2016-02-25 15:33:13
* @Last Modified by:   lushijie
* @Last Modified time: 2016-11-07 10:17:01
*/
var webpack = require('webpack');
var path = require('path');
var moment = require('moment');
var Pconf = require('./webpack.plugin.conf.js');

var isDev = JSON.parse(JSON.stringify(process.env.NODE_ENV || 'development')) == 'development';

var DEFINE_INJECT = {
    ENV:{
        'a': JSON.stringify('development variable'),
        //替换规则是 API_URL = 后面的值，所以要添加 JSON.stringify
        'API_URL': JSON.stringify('http://localhost/url'),
        //Please keep process.env
        'process.env': {
            //Note: by default, React will be in development mode, which is slower, and not advised for production.
            NODE_ENV: JSON.stringify('development')
        }
    },
    PUB:{
        'a': 123123,
        'API_URL': JSON.stringify('http://online/url'),
        //Please keep process.env
        'process.env': {
            NODE_ENV: JSON.stringify('production')
        }
    }
};
var definePluginOptions = {DEFINE_INJECT: DEFINE_INJECT[isDev ? 'ENV':'PUB']};
var bannerPluginOptions = 'This file is modified by lushijie at ' + moment().format('YYYY-MM-DD h:mm:ss');
var htmlPluginOptions = {
        filename: 'views/home.html',// 访问地址 http://127.0.0.1:5050/dist/views/home.html
        title: 'Webpack-Seed',
        hash: true,
        inject: false, //此时不注入相关的js,否则如果之前手动引入了js，可能导致重复引入
        template: path.resolve(__dirname,'src/views/home.html'),
        favicon:path.resolve(__dirname,'src/img/common/favicon.ico'),
        minify:{
            removeComments: false,
            collapseWhitespace: false,
            minifyCSS: false
        },
        //chunks: ['common','home'],
        //excludeChunks: ['','']
};

module.exports = {
    //dev = cheap-module-eval-source-map
    //online = cheap-module-source-map, 没有列信息,外联.map这样.map文件只会在F12开启时进行下载
    devtool: isDev ? 'cheap-module-eval-source-map' : 'cheap-module-source-map',

    //基础目录（绝对路径），entry根据此路径进行解析
    context: __dirname,

    //entry 情况1,字符串
    //eg: entry: './public/resource/js/page/home.js',
    //在开启commonsChunkPluginentry 为字符串，生成 common.bundle.js 与 main.bundle.js

    //entry 情况2，数组
    //eg: entry: ['./public/resource/js/page/home.js'],
    //在开启commonsChunkPlugin情况下生成common.bundle.js与main.bundle.js
    //如果没有开启commonsChunkPlugin只会生成一个main.bundle.js

    //entry 情况3，对象
    //eg: entry: {home: './public/resource/js/page/home.js'},
    //在开启commonsChunkPlugin情况下生成 common.bundle.js 与 home.bundle.js

    entry: {
        home: './src/js/page/home.js',
        vendor: [
            //'jquery'
            // 1. vendor 引入主要是为了提取各个模块的common部分, 此处（home,jquery 会提取common,生成common.js）, 不用vendor,jquery会被单独打入home.js不利于缓存.
            //2. 在页面中引入vendor.bundle.js不意味着将jquery主动注入了，依然需要providePlugin支持或者在各个模块手动require方式引入
        ]
    },
    output: {
        publicPath: '/dist/',//webpack-dev-server会使用改路径寻找output文件
        path: 'dist',// 正式部署时打包进入的文件夹名称
        filename: '[name].bundle.js',
        chunkFilename: '[name].[chunkhash:8].chunk.js'//当时entry使用对象形式时，[hash]不可以使用，[id]、[chunkhash]与[name]可以使用
    },
    module: {
        preLoaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                // include: [
                //     path.join(__dirname, "public/resource/js/page"),
                //     path.join(__dirname, "public/resource/js/common")
                // ],
                loader: 'eslint-loader'
            }
        ],
        loaders: [
            {
                //通过imports-loader向特定模块注入变量，注入模块
                test: path.join(__dirname, 'src/js/page/home.js'),
                loader: "imports?importLib=jquery,importVar=>'variable',importObj=>{size:50}"
            },
            {
                //1.css文件外联方式实现
                //test:/\.css$/,
                // loader: Pconf.extractTextPluginConf.extract(['css'])

                //2.css文件内联方式实现
                test:/\.css$/,
                loader: (NODE_ENV == 'development') ? "style!css?sourceMap!postcss?sourceMap" : "style!css!postcss"
                //1.可以通过 postcss-js 插件处理写在 js 中的样式loader: "style-loader!css-loader!postcss-loader?parser=postcss-js"
                //2.也可以通过 babel 结合 postcss-js 处理 es6 语法中的样式loader: "style-loader!css-loader!postcss-loader?parser=postcss-js!babel"
            },
            {
                //1.scss 样式文件外联文件形式
                // test:/\.scss$/,
                // loader: Pconf.extractTextPluginConf.extract(['css','sass'])

                //2.scss 样式文件内敛方式实现
                test:/\.scss$/,
                loader: (NODE_ENV == 'development') ? "style!css?sourceMap!postcss?sourceMap!sass?sourceMap" : "style!css!postcss!sass"
            },
            {
                //图片如果小于8192kb将会以base64形式存在，否则产生图片文件
                test: /\.(png|jpg|gif|ttf|eot|svg|woff|woff2)$/,
                loader: 'url-loader?limit=8192&name=./assets/[name].[ext]'
            },
            {
                test: /\.json$/,
                loader: 'json'
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                include: [
                    path.join(__dirname, 'src/js'),
                ],
                exclude: [
                  path.join(__dirname, 'node_modules'),
                ],
                query: {
                    cacheDirectory: true,
                    //transform-runtime 默认会导入 babel-polyfill，可配置
                    plugins: ['transform-runtime'],
                    //其中 babel-preset-es2015 处理 ES6，babel-preset-react 处理 JSX
                    presets: ['es2015', 'stage-0', 'react']
                }
            }
        ]
    },
    plugins: [
        Pconf.cleanPluginConf(['dist']),
        Pconf.bannerPluginConf(bannerPluginOptions),
        Pconf.definePluginConf(definePluginOptions),
        !isDev ? Pconf.uglifyJsPluginConf() : Pconf.noopPluginConf(),
        Pconf.extractTextPluginConf(),
        Pconf.commonsChunkPluginConf(),
        !isDev ? Pconf.minChunkSizePluginConf() : Pconf.noopPluginConf(),
        isDev  ? Pconf.hotModuleReplacementPluginConf() : Pconf.noopPluginConf(),
        !isDev ? Pconf.OccurrenceOrderPluginConf() : Pconf.noopPluginConf(),
        !isDev ? Pconf.dedupePluginConf() : Pconf.noopPluginConf(),
        Pconf.providePluginConf({
            $: 'jquery'
        }),
        Pconf.htmlWebPackPluginConf(htmlPluginOptions),
        //Pconf.transferWebpackPluginConf()
    ],
    resolve:{
        root: [
            __dirname
        ],
        extensions: ['', '.js', '.jsx'],
        alias:{
            //别名，可在引用的时候使用缩写
            'rjs': 'src/js',
            'rcss': 'src/css',
            'rimg': 'src/img',
            'mock': 'src/mock'
        }
    },
    devServer: {
        stats: {
            cached: false,
            colors: true
        },
        contentBase: __dirname,//devserver的根目录，默认__dirname
        hot: true, //配合hotModuleReplacementPlugin使用
        inline: true,
        port: 5050,
        host: '0.0.0.0',
        // proxy: {
        //       "/proxy": {
        //         ignorePath: true,
        //         target: "http://wan.sogou.com",
        //         secure: false,//optional for https
        //         changeOrigin: true,
        //       }
        // },
        // historyAPI支持
        // historyApiFallback: {
        //     index: '/dist/views/home/index.html' //waring: 因为devserver生成的是虚拟目录要使用相对目录
        //     rewrites: [
        //         { from: /\//, to: '/dist/views/home/index.html'}
        //     ]
        // }
    },
    postcss: function () {
        return {
            plugins: [require('precss'), require('autoprefixer')]
        }
    }
};
