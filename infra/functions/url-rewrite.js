function handler(event) {
    var uri = event.request.uri;

    // Append index.html to trailing slash, .html to extensionless paths
    if (uri.endsWith('/')) {
        event.request.uri = uri + 'index.html';
    } else if (!uri.includes('.', uri.lastIndexOf('/'))) {
        event.request.uri = uri + '.html';
    }

    return event.request;
}
