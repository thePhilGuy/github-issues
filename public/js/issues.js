var requestStream = Rx.Observable.just('https://api.github.com/repos/npm/npm/issues');

var responseStream = requestStream
  .flatMap(function(requestUrl) {
    return Rx.Observable.fromPromise(jQuery.getJSON(requestUrl));
  });

responseStream.subscribe(function(response) {
    console.log(response.length);
    response.map(function(issue) {
        console.log(issue);
        $('#issues').append('<li>'+issue.url+'</li>');
    });
});
