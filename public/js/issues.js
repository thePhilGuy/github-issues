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

function styleLabel(label) {
    var tag = '<div class="ui basic label" style="' +
              'box-shadow: 0 0 0.05em black;' +
              'border-color: #' + label.color + '!important;">' +
              label.name + '</div>';
    return tag;
}
// ============== API Communication ============================================
var requestStream = Rx.Observable.just('https://api.github.com/repos/npm/npm/issues');

var responseStream = requestStream
  .flatMap(function(requestUrl) {
    return Rx.Observable.create(function (observer) {
        jQuery.getJSON(requestUrl)
        .done(function(response, status, jqXHR) {
            observer.onNext(jqXHR);
        })
        .fail(function(jqXHR, status, error) { observer.onError(error); })
        .always(function() { observer.onCompleted(); });
    });
  });

responseStream.subscribe(function(response) {
    console.log(response.getAllResponseHeaders());
    response.responseJSON.map(function(issue) {
        var issueItem ='<div class="item"> <div class="content">' +
                       '<div class="ui ribbon label issue_number"> #' + issue.number + '</div>' +
                       '<a class="header">' + issue.title + '</a>';

        if (issue.labels.length > 0) {
            issueItem += '<div class="meta">';
            for (var i = 0; i < issue.labels.length; i++) {
                issueItem += styleLabel(issue.labels[i]);
            }
            issueItem += '</div>';
        }

        issueItem +='<div class="description">' + shorten(issue.body, 140) + '</div>' +
                    '<div class="extra">' +
                    '<img src="' + issue.user.avatar_url + '" class="ui circular avatar image">' + issue.user.login +
                    '</div> </div> </div>';

        $('#issues_list').append(issueItem);
    });
});
