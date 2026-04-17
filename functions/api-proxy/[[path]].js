export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  let path = '';
  if (context.params.path) {
    path = Array.isArray(context.params.path) 
      ? context.params.path.join('/') 
      : context.params.path;
  }
  
  const targetUrl = `https://api.minimax.chat/${path}${url.search}`;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  // Build clean headers for downstream request
  const headers = new Headers();
  headers.set('Content-Type', request.headers.get('Content-Type') || 'application/json');
  if (request.headers.has('Authorization')) {
    headers.set('Authorization', request.headers.get('Authorization'));
  }

  let bodyData;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    bodyData = await request.text();
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: bodyData
    });
    
    // Read response text to avoid Chunked/Gzip encoding conflicts caused by proxying streams
    const respText = await upstreamResponse.text();
    
    return new Response(respText, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }
}
