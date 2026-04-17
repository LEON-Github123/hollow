export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 拦截 /api-proxy/ 的所有请求
    if (url.pathname.startsWith('/api-proxy/')) {
      const targetPath = url.pathname.replace('/api-proxy', '');
      const targetUrl = `https://api.minimax.chat${targetPath}${url.search}`;

      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*"
          }
        });
      }

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

    // 其他原本的请求（如 /index.html）正常返回静态文件
    return env.ASSETS.fetch(request);
  }
};
