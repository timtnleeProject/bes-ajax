# bes-ajax #

**A ajax handler using fetch API.**

* Handle numbers of ajax requests on browsers.
* Extend requests based on default/other requests, share same basic options and success, error functions.
* Retry when requests fail.
* Sort requests by their priorities.
* Set requests timeout.

## Menu

* [Example](#example)
* [Demo](#demo)
* [Installation](#installation)
* [Concept](#concept)
* [Document](#document)
* [Version Release](#versionrelease)

## Example ##

### create request ###
    
```js
const besAjax = BesAjaxRequest({
  log: false,
  abort: false,
  resolveFirst: false,
  poolSize: 3
});

const defaultRequest = besAjax.createRequest ({
  host: 'http://127.0.0.1:3000',
  path: 'api',
}, {
  responseType: 'text',
  retry: 7, 
  sleep: 1000,
  primary: 3,
  timeout: 5000,
  name: 'defaultReq'
})
	
defaultRequest.onsuccess = function(res) {
  console.log(this.options.name + ' success:', res)
}
```

### extend requests ###
	
```js
const postRequest = defaultRequest.extend({
  method: 'post',
  headers: { 'Content-Type':'application/json', 'myHeader':'hello'},
  body: JSON.stringify({ name: 'p0855' }),
  path: '/api'
}, {
  retry:0,
  responseType: 'json',
  primary: 0, 
  name: 'postReq',
})

postRequest.onsuccess = function (res) {
  console.log('post request success!')
}
postRequest.send()
```

**append body dynamically**

```js
postRequest.fetchoptions.body = JSON.stringify({name: 'weruy1'})
postRequest.send()
```  

**promise**

```js
defaultRequest.send().then((res1)=>{
  //first response
  postRequest.fetchoptions.body = JSON.stringify({name: res1})
  return postRequest.send()
}).then((res2)=>{
  //second response
}).catch((e)=>{
  //handle error
})
 ```

## Demo ##

**live demo**

[demo page](https://bes-ajax-demo.herokuapp.com/)


## Installation ##

### Webpack ###

**Install package**
```bash
$npm install bes-ajax --save
```
**Import in your script**
```js
import besAjax from 'bes-ajax';
```

### Get Build script ###

Clone the repository.

**Install dependencies**

```bash
$npm install
```
**Build dist script**

```bash
$npm run build
```

Bundled script at `/dist/cdn.min.js`.

**Run example**

```bash
$npm start
```
dev server on `localhost/8000`


## Concept ##

How it works?
 
**Create BesAjaxObject**
> 
> Once you create a [`BesAjaxObject`](#besajaxobject), you can create and extend requests from it, and `BesAjaxObject` will handle all requests. 
 
**Extend request**
 
> When extending request, child will extend ancestors' options: `options`,`fetchtoptions` and
> can add new properties or override them, see [options](#options) and [fetchoptions](#fetchoptions). Also child request will extend all ancestors' callback functions: `onsuccess`, `onerror`, see [onsuccess](#besrequestobjectonsuccess), [onerror](#besrequestobjectonerror).
 
**Pool**

> There's a `exePool` and `waitingPool` in `BesAjaxObject`. When you call `BesRequestObject.send()`, it will return a `Promise`, and create a new task and put it into `exePool`, while length of `exePool` is over `BesAjaxObject.poolSize`, tasks will be put in `waitingPool`, or replace the less primary task in `exePool`. 
>
> Notice that when the less primary task is moved to `waitingPool` and the request has already sent, if `BesAjaxObject.abort` is set to `true`, the request will be aborted using [Fetch abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort), otherwise the request will still going and will not be aborted, since the [Fetch abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) is a experimental technology and not capacity with all browsers, be careful with using this feature.
>
> `BesAjaxObject` will run all tasks ( send requests, retry requests ) in `exePool` later in callback using `setTimeout`.

**Resolve**
 
> If not using abortion, when response return:
>
> If task is in the `exePool`, the `Promise` which return by `BesRequestObject.send()` will be resolve. 
>
> If task is in the `waitingPool`, controller will check if `BesAjaxObject.resolveFirst` is set to `true` , the task will be resolve immediately and remove from `waitingPool`, otherwise it will be resolve later when it moving to `exePool`. 

**Capacity**

> For browser capacity, we have require [fetch polyfill](https://github.com/github/fetch) as a dependency.

  

# Document #

### BesAjaxRequest() ###
- create a new BesAjaxObject.
- **type** `<Function>`
- **return** [`BesAjaxObject`](#besajaxobject)  

### BesAjaxObject ###
- This object can create request object, handle execute pool and waiting pool.
- **type** `<Object>`

### BesAjaxObject.createRequest(`fetchOptions`,`options`) ###
- create a request object.
- **type** `<Function>`
- **parameters**
	- `fetchOptions`
	- `options` 
- **return** [`BesRequestObject`](#besrequestobject)

### BesAjaxObject.log ###
- Turn logs on/off
- **type** `<Boolean>`
- **default** `false`
- **value**
	- `true`:turn on logs.
	- `false`:turn off logs.

### BesAjaxObject.poolSize ###
- Max size of execute pool.
- **type** `<Integer>`
- **default** `5`

### BesAjaxObject.abort ###
- Using [Fetch abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) to abort request when task is pushed to waitingPool.
- **type** `<Boolean>`
- **default** `false`

### BesAjaxObject.resolveFirst ###
- Set to `true`: when requests in `waitingPool` get response, it will be resolve immediately, to `false` :  resolve when it moving back to `exePool`.
- **type** `<Boolean>`
- **default** `false` 

### BesAjaxObject.successHandler(`responseObject`) ###
- Global response success handler function for all requests in BesAjaxObject. To use it, just overwrite it.
- **type** `<Function>`

### BesAjaxObject.errorHandler(`e`) ###
- Global error handler function for all requests in BesAjaxObject. To use it, just overwrite it.
- **type** `<Function>`

### BesAjaxObject.taskPool.on('pool', `Function`) ###
- Fired when exePool/waitingPool push/remove tasks.

### BesRequestObject ###
- Request object
- **type** `<Object>`

### BesRequestObject.extend(`fetchOptions`,`options`) ###
- Create another `BesRequestObject` extended `fetchOptions`, `options`
-Properties in `fetchOptions`, `options` will overwrite the same properties in original `fetchOptions`, `options` in `BesRequestObject`. But only `fetchOptions.headers` will use `Headers.append()`, see [Fetch Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers/append).
- **type** `<Function>`
- **parameters**
	- [`fetchOptions`](#fetchOptions)
	- `options`
- **return** `BesRequestObject`

### BesRequestObject.send() ###
- Send request.
- **type** `<Function>`
- **return** `Promise`

### BesRequestObject.onsuccess ###
- execute when task success, will extend ancestor requests' onsuccess function.
- **type** `<Function>` 
- **parameters**
	- `responseObject` : can be `text`,`json`,`blob`... depends on `responseType` in [`options`](#options).

### BesRequestObject.onerror ###
- execute when task error, will extend ancestor requests' onerror function.
- **type** `<Function>` 
- **parameters**
	- `responseObject` : can be `text`,`json`,`blob`... depends on `responseType` in [`options`](#options).

### fetchoptions ###
- **type** `<Object>`
- Same as [fetch API's init options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
- additional/different options: (request Url will be **url**+**query**, or **host**+**path**+**query**)
	- headers
		- You don't need to pass [Fetch Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers/append), just pass Object or JSON format.
		- **type**:`<Object>`/`<JSON>`
	- url
		- request's url.
		- **type** `<String>`
	- host 
		- request's host. _ex: 'http://example.com'_
		- **type** `<String>`
	- path 
		- request's path. _ex: 'api', '/api'_
		- **type** `<String>`
	- query 
		- request's query string. _ex: 'user=xxx;id=123'_
		- **type** `<String>`   

### options ###
- BesRequestObject options
- **type** `<Object>`
- **options**
	- primary
		- Priority of requests. *0 is the most primary task*.
		- **type** `<Number>`
		- **default** `1`
	- retry
		- Maximum retry time when request fail.
		- **type** `<Integer>`
		- **default** `0` 
	- sleep
		- Wait milliseconds before every retry.
		- **type** `<Integer>`
		- **default** `100`
	- expofn(`x`,`sleep`)
		- change `sleep` when task retry.
		- **type** `<Function>`
		- `x`: request has retried `x` times.
		- `sleep`: current `sleep` value. 
		- **return** sleep
		- ex: `((x ,sleep) => sleep + x*200 )`
	- timeout
		- Requests will be reject after timeout (millisecond).
		- **type** `<Integer>`
	- name
		- Request's ( Task's ) name show in logs.
		- **type** `<String>`
		- default `undefined`
	- responseType
		- Parse success response body with [Body Methods](https://developer.mozilla.org/en-US/docs/Web/API/Body), _'text', 'json' ,'blob'_ etc.
		- **type** `<String>`

## Version Release

**1.0.6**
> 
> Add fetch abort feature.
>
**1.0.7**
>
> Before version 1.0.7, promise and `onerror` function only pass `response.status`. Since 1.0.7 will pass `fetch response` as well.
>
>New options `errorType` in `options`, parse error response.  