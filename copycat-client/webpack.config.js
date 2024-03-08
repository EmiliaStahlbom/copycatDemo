const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env = {}, argv = {}) => {
    const publicUrl = process.env.PUBLIC_URL || argv.publicUrl || argv.baseUrl || '/';
    const mode = "development"; //env.production ? "production" : "development";
    console.log(`Building application in ${mode} mode.`);

    return {
        mode: mode,
        devtool: env.production ? false : "source-map",
        entry: {
            main: {
                import: "./src/index.tsx"
            }
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            publicPath: publicUrl,
            filename: "main.js"
        },
        performance: {
            maxAssetSize: 1024*1024 /* 1Mb */
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: env.production ? false : true,
                            experimentalWatchApi: true
                        }
                    },
                    exclude: /node_modules/,
                },
                {
                    test: /\.js?$/,
                    use: "babel-loader"
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"]
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        // Creates `style` nodes from JS strings
                        "style-loader",
                        // Translates CSS into CommonJS
                        "css-loader",
                        // Compiles Sass to CSS
                        "sass-loader",
                    ],
                },
                {
                    test: /\.(png|svg|jpe?g|gif|woff2?)$/,
                    loader: "file-loader",
                    options: {
                        name: "[folder]/[name].[ext]",
                    },
                },
            ],
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
        externals: [
        ],
        plugins: [
        
            new webpack.DefinePlugin({
                'process.env.PUBLIC_URL': JSON.stringify(publicUrl)
            }),
            new CleanWebpackPlugin(),
            // Generates an `index.html` file with the bundle injected into <script>.
            new HtmlWebpackPlugin(
                Object.assign(
                    {},
                    {
                        // favicon: "./public/copycat.svg",
                        inject: true,
                        template: "./public/index.html",
                    },
                    env.production
                        ? {
                            minify: {
                                removeComments: true,
                                collapseWhitespace: true,
                                removeRedundantAttributes: true,
                                useShortDoctype: true,
                                removeEmptyAttributes: true,
                                removeStyleLinkTypeAttributes: true,
                                keepClosingSlash: true,
                                minifyJS: true,
                                minifyCSS: true,
                                minifyURLs: true,
                            },
                        }
                        : undefined
                )
            ),
			new CopyWebpackPlugin({
				patterns: [
                    { 
                        from: path.resolve(__dirname, "public", "copycat.svg"), 
                        to: path.resolve(__dirname, "dist") 
                    },
					// { 
                    // //     from: path.resolve(__dirname, "de-richedit"), 
                    // //     to: path.resolve(__dirname, "dist", "de-richedit") 
                    // // },
                    // { 
                    //     from: path.resolve(__dirname, "node_modules", "igv", "dist", "igv.min.js"), 
                    //     to: path.resolve(__dirname, "dist", "genomics.igv.[contenthash].js") 
                    // }
				]
			})
        ]
    }
};
