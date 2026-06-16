function handler(event) {
    var uri = event.request.uri;

    // 301 .html → clean URL for backwards compat (old bookmarks, external links).
    // Internal links never emit .html, so this only fires for external callers.
    if (uri !== '/index.html' && uri.endsWith('.html')) {
        return {
            statusCode: 301,
            headers: {
                location: { value: uri.slice(0, -5) }
            }
        };
    }

    // Append index.html to trailing slash, .html to extensionless paths
    if (uri.endsWith('/')) {
        event.request.uri = uri + 'index.html';
    } else if (!uri.includes('.', uri.lastIndexOf('/'))) {
        event.request.uri = uri + '.html';
    }

    return event.request;
}
