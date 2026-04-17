export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  
  // 获取 /api-proxy/ 后面的所有路径片段
  let path = '';
  if (context.params.path) {
    path = Array.isArray(context.params.path) 
      ? context.params.path.join('/') 
      : context.params.path;
  }
  
  const targetUrl = `https://api.minimax.chat/${path}${url.search}`;

  // 处理浏览器发送的 CORS 预检请求 (OPTIONS)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  // 复制原始请求，以便顺带转发请求体 (Body) 和部分 Headers
  const newRequest = new Request(targetUrl, request);
  newRequest.headers.set('Origin', 'https://api.minimax.chat');
  newRequest.headers.set('Referer', 'https://api.minimax.chat/');

  try {
    let response = await fetch(newRequest);
    // 复制目标服务器的响应，并追加允许跨域的 Header
    response = new Response(response.body, response);
    response.headers.set("Access-Control-Allow-Origin", "*");
    
    return response;
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }
}
