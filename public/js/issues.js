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
        next = '<a class="item" id="next_page">' + nextIdx + '</a>';
        var lastUrl = tokens[3].substring(1, tokens[3].length - 2);
        var lastIdx = lastUrl.split("=")[1];
        last = '<a class="item" id="last_page">' + lastIdx + '</a>';
        var index = Number(nextIdx) - 1;
        current = '<div class="active item">' + index + '</div>';
    } else if (tokens[2] === 'rel="first",') {
        // In case of a last page
        var firstUrl = tokens[1].substring(1, tokens[1].length - 2);
        var firstIdx = firstUrl.split("=")[1];
        first = '<a class="item" id="first_page">' + firstIdx + '</a>';
        var prevUrl = tokens[3].substring(1, tokens[3].length - 2);
        var prevIdx = prevUrl.split("=")[1];
        prev = '<a class="item" id="prev_page">' + prevIdx + '</a>';
        var index = Number(prevIdx) + 1;
        current = '<div class="active item">' + index + '</div>';
    }

    // In case of a middle page
    if (tokens.length > 5) {
        // Get first and prev
        var firstUrl = tokens[5].substring(1, tokens[5].length - 2);
        var firstIdx = firstUrl.split("=")[1];
        first = '<a class="item" id="first_page">' + firstIdx + '</a>';
        var prevUrl = tokens[7].substring(1, tokens[7].length - 2);
        var prevIdx = prevUrl.split("=")[1];
        // check that this is not the 2nd element
        if (firstIdx != prevIdx) {
            prev = '<a class="item" id="prev_page">' + prevIdx + '</a>';
        }
    }

    if (first.length > 0) {
        $('#issues_pages').append(first);
        var LinkRequestStream = Rx.Observable.create(function(observer) {
            $('#first_page').on('click', function() {
                    observer.onNext(firstUrl);
            });
        });
        LinkRequestStream.subscribe(function(url) {
            requestStream.onNext(url);
        });
    }
    if (prev.length > 0) {
        $('#issues_pages').append(prev);
        var LinkRequestStream = Rx.Observable.create(function(observer) {
            $('#prev_page').on('click', function() {
                    observer.onNext(prevUrl);
            });
        });
        LinkRequestStream.subscribe(function(url) {
            requestStream.onNext(url);
        });
    }
    $('#issues_pages').append(current);
    if (next.length > 0) {
        $('#issues_pages').append(next);
        var LinkRequestStream = Rx.Observable.create(function(observer) {
            $('#next_page').on('click', function() {
                    observer.onNext(nextUrl);
            });
        });
        LinkRequestStream.subscribe(function(url) {
            requestStream.onNext(url);
        });
    }
    if (last.length > 0) {
        $('#issues_pages').append(last);
        var LinkRequestStream = Rx.Observable.create(function(observer) {
            $('#last_page').on('click', function() {
                    observer.onNext(lastUrl);
            });
        });
        LinkRequestStream.subscribe(function(url) {
            requestStream.onNext(url);
        });
    }

}
// ============== Search bar api communication ========================================
function loadRepo(url) {
    var repoPath = url.substring('https://github.com/'.length);
    var issuesUrl = 'https://api.github.com/repos/'+ repoPath + '/issues?page=1';
    requestStream.onNext(issuesUrl);
}

$('.ui.search').search({
    apiSettings: {
      url: '//api.github.com/search/repositories?q={query}',
      onResponse: function(githubResponse) {
        var response = { results : [] };
        // translate GitHub API response to call a function instead of link to repository
        $.each(githubResponse.items, function(index, item) {
          var js_url = "javascript:void loadRepo('" + item.html_url + "')";
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

// Map requests url on requestStream to JSON ajax request
var responseStream = requestStream.flatMap(function(requestUrl) {
    console.log("Request: " + requestUrl);
    return Rx.Observable.create(function (observer) {
        jQuery.getJSON(requestUrl)
        .done(function(response, status, jqXHR) { observer.onNext(jqXHR); })
        .fail(function(jqXHR, status, error) { observer.onError(error); })
        .always(function() { observer.onCompleted(); });
    });
});

// Handle JSON responses from requestStream
responseStream.subscribe(function(response) {
    $('#issues_list').empty();
    $('#issues_pages').empty();
    // TODO escape html in javascript, create elements properly
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
