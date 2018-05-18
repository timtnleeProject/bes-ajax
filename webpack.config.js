const path = require('path');

module.exports = {
	mode:'production',
	entry: './cdn.js',
	output: {
		filename : 'cdn.js',
		path: path.resolve(__dirname, 'dist')
	}
}