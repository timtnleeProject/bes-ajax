const path = require('path');

module.exports = {
	entry: './build.js',
	output: {
		filename : 'cdn.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		loaders:[{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		}]
	}
}