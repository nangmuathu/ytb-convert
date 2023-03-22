const ytdl = require('ytdl-core');
const http = require('http');
const url = require('url');
const NodeCache = require('node-cache');
const cache = new NodeCache();

const successCacheAge = 14400; 
const errorCacheAge = 3600; // 1hrs

// Clear cache on restart
if (process.env.CLEAR_CACHE) {
	cache.flushAll();
}

function sendResponse(response, data) {
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Allow-Methods', 'GET');

	response.setHeader( 'Content-Type', 'application/json' );

	console.log('data------> ', data)
	response.end(JSON.stringify(data));
}

function sendSuccess(response, data) {
	sendResponse(response, {
		success: true,
		data
	});
}

function sendError(response, data) {
	sendResponse(response, {
		success: false,
		data
	});
}


const app = http.createServer(function(request, response) {

	// Get query params
	const queryObject = url.parse(request.url, true).query;

	const idParam = queryObject?.id;
	const urlParam = queryObject?.url;

	if (!idParam && !urlParam) {
		sendError(response, 'Missing `url` or `id` paramater');
	} else {

		const youtubeUrl = idParam ? `https://www.youtube.com/watch?v=${idParam}` : urlParam;
		const cacheValue = cache.get(youtubeUrl);

		if (cacheValue) {

			if (Object.keys(cacheValue).length === 0 && cacheValue.constructor === Object || cacheValue.statusCode) {
				sendError(response, cacheValue);
			}
			else {
				sendSuccess(response, cacheValue);
			}
		}

		else {
			try {

				ytdl.getInfo(youtubeUrl).then(data => {
					cache.set(youtubeUrl, data, successCacheAge);
					sendSuccess(response, data);
				}).catch(error => {
					cache.set(youtubeUrl, error, errorCacheAge);
					sendError(response, error);
				});

			} catch (error) {
				sendError(response, error);
			}
		}
	}
});

app.listen(8000, () => console.log('is running on port: 8000'));
