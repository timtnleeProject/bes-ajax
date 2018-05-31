const path = require('path');

module.exports = {
	mode:'production',
	entry: './build.js',
	output: {
		filename : 'cdn.min.js',
		path: path.resolve(__dirname, '../dist')
	},
	module: {
		rules:[{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		}]
	}
}