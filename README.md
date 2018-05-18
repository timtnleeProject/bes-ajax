## BesAjax
**A ajax handler using fetch API.**

* Create default request.
* Extend requests based on default/other requests.
* Retry when requests fail.
* Sort requests by their priorities.


### Create request ###
	var besAjax = BesAjaxRequest();
	var defaultRequest = besAjax.createRequest({
		host: 'http://127.0.0.1:3000',
        path: 'api',
	},{
		responseType: 'text',
        retry: 7,
       	sleep: 1000,
		primary: 3,
		timeout: 5000,
		name: 'defaultReq',
	});
	defaultRequest.send().then((res)=>{
		//handle response
	}).catch((e)=>{
		//handle error
	})

### Extend requests ###
	var postRequest = defaultRequest.extend({
        	method: 'post',
        	headers: { 'Content-Type':'application/json', 'myHeader':'hello'},
        	body: JSON.stringify({ name: 'p0855' }),
    	}, {
			retry:0,
        	responseType: 'json',
			primary: 0, 
	        name: 'postReq',
    	});
	postRequest.send();

append body dynamically

	postRequest.fetchoptions.body = JSON.stringify({name:'weruy1'});
	postRequest.send();

### Demo ###
* Clone the repo.
* run
	
    	$npm install
    	$npm start 

* Visit  `localhost:3000/fetch.html`

### Concept ###

Belows are the steps showing how it works.

**1.Create BesAjaxObject**

Once you create a [`BesAjaxObject`](#BesAjaxObject), you can create and extand requests from it, and `BesAjaxObject` will handle all requests. 

**2.Extend request**

When extending request, child will extend ancestors' options: `options`,`fetchtoptions` and
can add new properties or overide them, see [options](#options) and [fetchoptions](#fetchoptions). Also child request will extend all ancestors' callback functions: `onsuccess`, `onerror`, see [onsuccess](#onsuccess), [onerror](#onerror).

**2.Pool**

There's a `exePool` and `waitingPool` in `BesAjaxObject`. When you call `BesRequestObject.send()`, it will return a `Promise`, and create a new task and put it into `exePool`, while `exePool`'s length is over `BesAjaxObject.poolSize`, tasks will be put in `waitingPool`, or replace the less primary task in `exePool`. 

Notice that although the less primary task is moved to `waitingPool`, if the task is running ( request is already send ) , the request will still going and will not be aborted, since the [Fetch abort](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) is a experimental technology and not compatitive with all browsers.

`BesAjaxObject` will run all tasks ( send requests, retry requests ) in `exePool` later in callback using `setTimeout`.

**3.Resolve**

When response return:

If task is in the `exePool`, the `Promise` which return by `BesRequestObject.send()` will be resolve. 

If task is in the `waitingPool`, controller will check if `BesAjaxObject.resolveFirst` is set to `true` , the task will be resolve immediately and remove from `waitingPool`, otherwise it will be resolve later when it moving to `exePool`.


**4.Compacity**

For browser compacity, include [fetch polyfill](https://github.com/github/fetch).
  

# Document
### BesAjaxRequest()
- create a new BesAjaxObject.
- **type** `<Function>`
- **return** [`BesAjaxObject`](#BesAjaxObject)  
### BesAjaxObject
- This object can create request object, handle execute pool and waiting pool.
- **type** `<Object>`

### BesAjaxObject.createRequest(`fetchOptions`,`options`)
- create a request object.
- **type** `<Function>`
- **parameters**
	- `fetchOptions`
	- `options` 
- **return** [`BesRequestObject`](#BesRequestObject)

### BesAjaxObject.log
- Turn logs on/off
- **type** `<Boolean>`
- **default** `false`
- **value**
	- `true`:turn on logs.
	- `false`:turn off logs.

### BesAjaxObject.poolSize
- Max size of execute pool.
- **type** `<Integer>`
- **default** `5`

### BesAjaxObject.resolveFirst
- Set to `true`: when requests in `waitingPool` get reqsponse, it will be resolve immediately, to `false` :  resolve when it moving back to `exePool`.
- **type** `<Boolean>`
- **default** `false` 

### BesAjaxObject.successHandler(`responseObject`)
- Global response success handler function for all requests in BesAjaxObject. To use it, just overwrite it.
- **type** `<Function>`
### BesAjaxObject.errorHandler(`e`)
- Global error handler function for all requests in BesAjaxObject. To use it, just overwrite it.
- **type** `<Function>`

### BesAjaxObject.on('pool', `Function`)
- Fired when exePool/waitingPool push/remove tasks.

### BesRequestObject
- Request object
- **type** `<Object>`

### BesRequestObject.extend(`fetchOptions`,`options`)
- Create another `BesRequestObject` extended `fetchOptions`, `options`
-Properties in `fetchOptions`, `options` will overwrite the same properties in original `fetchOptions`, `options` in `BesRequestObject`. But only `fetchOptions.headers` will use `Headers.append()`, see [Fetch Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers/append).
- **type** `<Function>`
- **parameters**
	- [`fetchOptions`](#fetchOptions)
	- `options`
- **return** `BesRequestObject`

### BesRequestObject.send()
- Send request.
- **type** `<Function>`
- **return** `Promise`

### BesRequestObject.onsuccess
- execute when task success, will extend ancestor requests' onsuccess function.
- **type** `<Function>` 
### BesRequestObject.onerror
- execute when task error, will extend ancestor requests' onerror function.
- **type** `<Function>` 
### fetchoptions
- **type** `<Object>`
- Same as [fetch API's init options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
- additional/different options:
	- headers
		- You don't need to pass [Fetch Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers/append), just pass Object or JSON format.
		- **type**:`<Object>`/`<JSON>`
	- url
		- request's url. *notice: use **url**, or **host**+**path***
		- **type** `<String>`
	- host 
		- request's host. _ex: 'http://example.com'_
		- **type** `<String>`
	- path 
		- request's path. _ex: 'api'_
		- **type** `<String>`
	- query 
		- request's query string. _ex: 'user=xxx;id=123'_
		- **type** `<String>`   
### options
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
		- preserve response with [Body Methods](https://developer.mozilla.org/en-US/docs/Web/API/Body), _'text', 'json' ,'blob'_ etc.
		- **type** `<String>`
