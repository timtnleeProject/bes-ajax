var besAjax=require('../src/ajax.js').task;
var assert = require('assert');
function validHost(host){
	var lre = /\/$/;
	if(!lre.test(host))
		host+='/'
	return host;
}
function validPath(path){
	var lre = /\/$/;
	var fre = /^\//;
	if(fre.test(path))
		path=path.slice(1,path.length)
	if(lre.test(path))
		path=path.slice(0,path.length-1)
	return path;
}
function validQuery(query){
	var fre = /^\?/;
	if(!fre.test(query))
		query = '?'+query;
	return query
}
function validUrl(host,path,query){
	return validHost(host)+validPath(path)+validQuery(query)
}
describe('valid url' ,function (done) {
	it('test1' ,()=>{assert.equal(validPath('/path/'), 'path')})
	it('test2' ,()=>{assert.equal(validUrl('http://www.com/','/ptt/','a=z'), 'http://www.com/ptt?a=z')})
	it('test3' ,()=>{assert.equal(validUrl('http://www.com','/ptt','a=z'), 'http://www.com/ptt?a=z')})
})
