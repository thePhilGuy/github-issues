var requestStream = Rx.Observable.just('https://api.github.com/repos/npm/npm/issues');

var responseStream = requestStream
  .flatMap(function(requestUrl) {
    return Rx.Observable.fromPromise(jQuery.getJSON(requestUrl));
  });

responseStream.subscribe(function(response) {
    console.log(response.length);
    response.map(function(issue) {
        console.log(issue);
        var issueItem = '<div>' +
                        '<h3>' + issue.title + '</h3>\n' +
                        '<i>' + issue.labels + '</i>\n' +
                        '<p>' + issue.body + '</p>\n' +
                        '<p>' + issue.user.login + '<img src=' + issue.user.avatar_url + ' /> </p> </div>';
        $('.content').append(issueItem);
    });
});
