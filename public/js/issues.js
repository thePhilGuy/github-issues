// ============== Helper Functions =============================================
function shorten(text, limit) {
    var words = text.split(" ");
    var short = "";
    for (var i = 0, chars = 0; i < words.length && chars < limit; i++) {
        short += words[i];
        chars += words[i].length;
        if (chars < limit) short += " ";
        else short += "...";
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

function makePageMenu(headers) {
    var headerLines = headers.split("\n");
    if (headerLines[6].substring(0, 4) === "Link") {
        var tokens = headerLines[6].split(" ");
    }

    var first = '';
    var prev = '';
    var current = '';
    var next = '';
    var last = '';
    if (tokens[2] === 'rel="next",') {
        // In case of a first or middle page
        var nextUrl = tokens[1].substring(1, tokens[1].length - 2);
        var nextIdx = nextUrl.split("=")[1];
        next = '<a class="item">' + nextIdx + '</a>';
        var lastUrl = tokens[3].substring(1, tokens[3].length - 2);
        var lastIdx = lastUrl.split("=")[1];
        last = '<a class="item" id="last_page">' + lastIdx + '</a>';
        var index = Number(nextIdx) - 1;
        current = '<a class="active item">' + index + '</a>';
    } else if (tokens[2] === 'rel="first",') {
        // In case of a last page
        var firstUrl = tokens[1].substring(1, tokens[1].length - 2);
        var firstIdx = firstUrl.split("=")[1];
        first = '<a class="item">' + firstIdx + '</a>';
        var prevUrl = tokens[3].substring(1, tokens[3].length - 2);
        var prevIdx = prevUrl.split("=")[1];
        prev = '<a class="item">' + prevIdx + '</a>';
        var index = Number(prevIdx) + 1;
        current = '<a class="active item">' + index + '</a>';
    }

    // In case of a middle page
    if (tokens.length > 5) {
        // Get first and prev
        var firstUrl = tokens[5].substring(1, tokens[5].length - 2);
        var firstIdx = firstUrl.split("=")[1];
        first = '<a class="item">' + firstIdx + '</a>';
        var prevUrl = tokens[7].substring(1, tokens[7].length - 2);
        var prevIdx = prevUrl.split("=")[1];
        // check that this is not the 2nd element
        if (firstIdx != prevIdx) {
            prev = '<a class="item">' + prevIdx + '</a>';
        }
    }

    if (first.length > 0) $('#issues_pages').append(first);
    if (prev.length > 0) $('#issues_pages').append(prev);
    $('#issues_pages').append(current);
    if (next.length > 0) $('#issues_pages').append(next);
    if (last.length > 0) {
        $('#issues_pages').append(last);
        var lastLinkRequestStream = Rx.Observable.create(function(observer) {
            $('#last_page').on('click', function() {
                    observer.onNext(lastUrl);
            });
        });
        lastLinkRequestStream.subscribe(function(url) {
            $('#issues_list').empty();
            $('#issues_pages').empty();
            requestStream.onNext(lastUrl);
        });
    }

}
// ============== Search bar api communication ========================================
function sayHi(url) {
    alert("Hello search term: " + url);
}

$('.ui.search').search({
    apiSettings: {
      url: '//api.github.com/search/repositories?q={query}',
      onResponse: function(githubResponse) {
        var response = { results : [] };
        // translate GitHub API response to call a function instead of link to repository
        $.each(githubResponse.items, function(index, item) {
          var js_url = "javascript:void sayHi('" + item.html_url + "')";
          response.results.push({
              title: item.name,
              description: item.description,
              url: js_url
          });
        });
        return response;
    },
    fields: {
      results : 'results',
      title   : 'title',
      url     : 'url',
    },
    minCharacters : 3
  }
});
// ====================================================================================

// ============== Github API Communication ============================================
var requestStream = new Rx.Subject();

var responseStream = requestStream.flatMap(function(requestUrl) {
    console.log("Request: " + requestUrl);
    return Rx.Observable.create(function (observer) {
        jQuery.getJSON(requestUrl)
        .done(function(response, status, jqXHR) { observer.onNext(jqXHR); })
        .fail(function(jqXHR, status, error) { observer.onError(error); })
        .always(function() { observer.onCompleted(); });
    });
});

responseStream.subscribe(function(response) {
    var headers = response.getAllResponseHeaders();
    makePageMenu(headers);
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

requestStream.onNext('https://api.github.com/repos/npm/npm/issues?page=2');
