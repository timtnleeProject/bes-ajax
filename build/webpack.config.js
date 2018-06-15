const path = require('path');

module.exports = {
	mode:'development',
	entry: './build.js',
	output: {
		filename : 'cdn.js',
		path: path.resolve(__dirname, '../')
	},
	module: {
		rules:[{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		}]
	},
	devServer: {
        contentBase: path.join(__dirname, "../"),
        compress: true,
        port: 8000,
        open: true,
        index: 'index.html'
    }
}