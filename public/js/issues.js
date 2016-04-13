// ============== Helper Functions =============================================
function shorten(text, limit) {
    var words = text.split(" ");
    var short = "";
    for (var i = 0, chars = 0; i < words.length && chars < limit; i++) {
        short += words[i];
        chars += words[i].length;
        if (chars < limit) short += " ";
    }
    return short;
}

// ============== API Communication ============================================
var requestStream = Rx.Observable.just('https://api.github.com/repos/npm/npm/issues');

var responseStream = requestStream
  .flatMap(function(requestUrl) {
    return Rx.Observable.fromPromise(jQuery.getJSON(requestUrl));
  });

responseStream.subscribe(function(response) {
    response.map(function(issue) {
        var issueItem = '<div>' +
                        '<h3>' + issue.title + '</h3>\n' +
                        '<i>' + issue.labels + '</i>\n' +
                        '<p>' + shorten(issue.body, 140) + '</p>\n' +
                        '<p>' + '<img height="48" width="48" src=' + issue.user.avatar_url + ' />' + issue.user.login + '</p> </div>';
        $('.content').append(issueItem);
    });
});
