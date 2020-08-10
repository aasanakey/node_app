const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// const isProduction = process.env.NODE_ENV === "production";

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, "src/js/app.js"),
    output: {
        path: path.resolve(__dirname, "public"),
        filename: "js/app.js"
    },
    module: {
        rules: [{
                test: /\.m?js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            },
            {
                test: /\.less$/, // .less and .css
                use: [
                    // isProduction ? MiniCssExtractPlugin.loader : "style-loader",
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "less-loader"
                ]
            },
            {
                test: /\.(png|jpe?g|svg|gif)$/i,
                loader: "file-loader",
                // include: path.join(__dirname, "src"),
                options: {
                    outputPath: "images/assets/", //path to output file to
                    publicPath: "../images/assets", //path used in output bundle files
                    name: "[name][contenthash].[ext]" // name of  output filefile
                }
            },
            {
                test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file-loader",
                options: {
                    name: "[name].[ext]",
                    outputPath: "fonts/",
                    publicPath: "../fonts"
                }
            }
        ]
    },
    // Add an instance of the MiniCssExtractPlugin to the plugins list
    // But remember - only for production!
    // plugins: isProduction ? [new MiniCssExtractPlugin()] : []
    plugins: [
        new MiniCssExtractPlugin({
            filename: "css/styles.css"
        })
    ],
    devtool: "inline-source-map"
        // resolve: {
        //     alias: {
        //         images: path.resolve(__dirname, "src/assets/images")
        //     }
        // }
};