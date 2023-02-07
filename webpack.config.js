const path = require('path');
const glob = require('glob');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');

//TODO: Glob işlemini fonksiyon haline getir.
let jsFiles = glob.sync(path.resolve(__dirname, 'assets/src/js/page_**.js')).reduce(function (obj, el) {
    obj[path.parse(el).name] = el;
    return obj
}, {});

let cssFiles = glob.sync(path.resolve(__dirname, 'assets/src/scss/page_**.scss')).reduce(function (obj, el) {
    obj[path.parse(el).name] = el;
    return obj
}, {});

let config = {
    mode: 'production',
};

jsConfig = Object.assign({}, config,
    {
        entry: jsFiles,
        output: {
            path: path.resolve(__dirname, 'dist/js'),
            filename: '[name].[contenthash].js',
            //Yeni dosya oluştuğunda önceki dosyanın yerine geçsin, clean false olursa sürekli yeni dosya oluşur
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx|mjs)$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'babel-loader',
                        options: {
                            presets: ["@babel/preset-env"]
                        }
                    }],
                }
            ]
        },
        plugins: [
            new WebpackManifestPlugin({
                fileName: 'js.manifest.json',
                //public path verilmediği için plugin otomatik olarak manifestteki dosya adına auto/ ekliyor. bu şekilde replace edebiliriz, ya da publicPath belirlemeliyiz.
                map: f => {
                    f.path = f.path.replace(/^auto\//i, '');
                    return f;
                }
            }),
        ]
    });

cssConfig = Object.assign({}, config,
    {
        entry: cssFiles,
        output: {
            path: path.resolve(__dirname, 'dist/css'),
            filename: 'delete_[name].css',
            clean: true,
        },
        // resolve: {
        //     extensions: ['.scss', '.css'],
        // },
        module: {
            rules: [
                {
                    test: /\.s[ac]ss$/i,
                    exclude: /node_modules/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader',
                    ],
                }
            ]
        },
        plugins: [
            new WebpackManifestPlugin({
                fileName: 'css.manifest.json',
                //public path verilmediği için plugin otomatik olarak manifestteki dosya adına auto/ ekliyor. bu şekilde replace edebiliriz, ya da publicPath belirlemeliyiz.
                map: f => {
                    f.path = f.path.replace(/^auto\//i, '');
                    return f;
                }
            }),
            new MiniCssExtractPlugin({
                filename: '[name]__[contenthash].css',
            }),
            //Yukarıdaki işlemler bittikten sonra bu plugini çalıştır,
            //Bu pluginin içinde de silinecek dosyaları glob paketi ile objede tut, ve obje değerlerini teker teker gez, her gezdiğini sil 
            //Bu işlemin yapılmasının sebebi webpack js üzerine bir yapıya sahiptir, dolayısıyla çift dosya derleme yapıyor, output css olsa bile hem hashli hemde outputdaki çıktı olarak geliyor.
            new WebpackShellPluginNext({
                onBuildEnd: {
                    scripts: [
                        () => {

                            const cssFiles = glob.sync(path.resolve(__dirname, 'dist/css/delete_page_**.css')).reduce(function (obj, el) {
                                obj[path.parse(el).name] = el;
                                return obj
                            }, {});

                            Object.values(cssFiles).forEach(val => {
                                try {
                                    fs.unlinkSync(val)
                                    //file removed
                                } catch (err) {
                                    console.error(err)
                                }
                            });
                        }
                    ]
                }
            })
        ]
    });




module.exports = [
    cssConfig,
    jsConfig
]