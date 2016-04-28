// ============== Helper Functions =============================================
// parse Mardown into HTML
function parseMarkdown(text) {
    var converter = new showdown.Converter(),
        html      = converter.makeHtml(text);
    return html;
}

// parse usernames into Markdown links to github
function parseUsernames(text) {
    var words = text.split(' ');
    for (var i = 0; i < words.length; i++) {
        if (words[i][0] == '@') {
            words[i] = '['+ words[i] + ']' + '(https://github.com/' + words[i].substring(1) + ')';
        }
    }
    return words.join(' ');
}

// Load issue list at page 1
function loadIssueList(url) {
    var repoPath = url.substring('https://github.com/'.length),
        issuesUrl = 'https://api.github.com/repos/'+ repoPath + '/issues?page=1';
    listRequestStream.onNext(issuesUrl);
}

// map url on requestStream to JSON responses
function mapToJSON(requestStream) {
    return requestStream.flatMap(function(requestUrl) {
        console.log("Request: " + requestUrl);
        return Rx.Observable.create(function (observer) {
            jQuery.getJSON(requestUrl)
            .done(function(response, status, jqXHR) { observer.onNext(jqXHR); })
            .fail(function(jqXHR, status, error) { observer.onError(error); })
            .always(function() { observer.onCompleted(); });
        });
    });
}

// Publish sourceUrl to request stream when selector is clicked
function bindClickableRequest(selector, sourceUrl, stream) {
    Rx.Observable.create(function(observer) {
        $(selector).on('click', function() {
            observer.onNext(sourceUrl);
        });
    }).subscribe(function(url) {
        stream.onNext(url);
    });
}

// Style labels with their custom colors
function styleLabel(label) {
    return $('<div>', {
             'class' : 'ui basic label',
             style   : 'box-shadow: 0 0 0.05em black;' +
                       'border-color: #' + label.color + '!important;">',
             text    : label.name
    });
}

// Shorten text to 140 characters or next full word
function shorten(text, limit) {
    var words = text.split(' '),
        short = ' ';
    for (var i = 0, chars = 0; i < words.length && chars < limit; i++) {
        short += words[i];
        chars += words[i].length;
        if (chars < limit) short += ' ';
        else short += '...';
    }
    return short;
}

// Make pagination menu from issue list response headers
function makePageMenu(headers) {
    var headerLines = headers.split("\n");
    if (headerLines[6].substring(0, 4) === "Link") {
        var tokens = headerLines[6].split(" ");
        var first, prev, current, next, last;
        if (tokens[2] === 'rel="next",') {
            // In case of a first or middle page
            var nextUrl = tokens[1].substring(1, tokens[1].length - 2);
            var nextIdx = nextUrl.split("=")[1];
            next = '<a class="item" id="next_page">' + nextIdx + '</a>';
            var lastUrl = tokens[3].substring(1, tokens[3].length - 2);
            var lastIdx = lastUrl.split("=")[1];
            if (nextIdx != lastIdx) {
                last = '<a class="item" id="last_page">' + lastIdx + '</a>';
            }
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

        if (first) {
            $('#issues_pages').append(first);
            bindClickableRequest('#first_page', firstUrl, listRequestStream);
        }
        if (prev) {
            $('#issues_pages').append(prev);
            bindClickableRequest('#prev_page', prevUrl, listRequestStream);
        }
        $('#issues_pages').append(current);
        if (next) {
            $('#issues_pages').append(next);
            bindClickableRequest('#next_page', nextUrl, listRequestStream);
        }
        if (last) {
            $('#issues_pages').append(last);
            bindClickableRequest('#last_page', lastUrl, listRequestStream);
        }
    }
}
// ====================================================================================

// ============== Github API Communication ============================================
var listRequestStream = new Rx.Subject();
var detailRequestStream = new Rx.Subject();
var commentRequestStream = new Rx.Subject();

// Map requests url on commentRequestStream to JSON ajax request
var commentStream = mapToJSON(commentRequestStream);

// Map requests url on detailRequestStream to JSON ajax request
var detailStream = mapToJSON(detailRequestStream);

// Map requests url on listRequestStream to JSON ajax request
var issueListStream = mapToJSON(listRequestStream);

// Handle the search bar communication with github repository search
$('.search.ui').search({
    apiSettings: {
        url: '//api.github.com/search/repositories?q={query}',
        onResponse: function(githubResponse) {
            var response = {results : []};
            // translate GitHub API response to call a function instead of link to repository
            githubResponse.items.forEach(function(item) {
                var js_url = "javascript:void loadIssueList('" + item.html_url + "')";
                response.results.push({
                    title       : item.name,
                    description : item.description,
                    url         : js_url
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

// Render issue in detail
detailStream.subscribe(function(response) {
    $('#issues_list').empty().hide();
    $('#issues_pages').empty();
    $('#issue_detail').show();

    var issue = response.responseJSON;

    var issueSection = $('#issue_detail');
    var issueTitle = $('<h2>', {
        'class' : 'ui center aligned header',
        text    : issue.title
    });
    var issueDescription = $('<div>', {
        html : parseMarkdown(issue.body)
    });

    issueSection.append([issueTitle, issueDescription]);

    var statusRail = $('<div>', {
        'class' : 'ui right rail'
    });
    var issueStatus = $('<p>', {text : 'Status: '});
    if (issue.state === 'open') {
        issueStatus.append($('<div>', {
            'class' : 'ui green label',
            text    : 'open'
        }));
    } else if (issue.state === 'closed') {
        issueStatus.append($('<div>', {
            'class' : 'ui red label',
            text    : 'closed'
        }));
    } else if (issue.state === 'all') {
        issueStatus.append($('<div>', {
            'class' : 'ui orange label',
            text    : 'all'
        }));
    }
    var railSection = $('<div>', {
        'class' : 'ui segment'
    }).append(issueStatus);
    if (issue.labels.length > 0) {
        metaDiv = $('<div>', { 'class' : 'meta' });
        metaDiv.append('Labels: ');
        issue.labels.forEach(function(label) {
            metaDiv.append(styleLabel(label));
        });
        railSection.append(metaDiv);
    }
    statusRail.append(railSection);
    issueSection.append(statusRail);

    if (issue.comments > 0 ) {
        commentRequestStream.onNext(issue.comments_url);
    }
});

// Render comment list
commentStream.subscribe(function(response) {
    $('#comment_list').empty()

    // Set up comment section and title
    var commentSection = $('<div>', {
        'class' : 'ui comments',
        'id'    : 'comment_list'
    }).append($('<h3>', {
        'class' : 'ui diving header',
        text : 'Comments'
    }));

    response.responseJSON.map(function(comment) {
        var commentDiv = $('<div>', { 'class' : 'comment' });
        var authorAvatar = $('<div>', {
            'class' : 'avatar'
        }).append($('<img>', {
            src : comment.user.avatar_url
        }));
        var content = $('<div>', { 'class' : 'content' });
        var author = $('<a>', {
            'class' : 'author',
            text    : comment.user.login,
            href    : comment.user.html_url
        });

        // Add a timestamp in a metadata tag?

        var commentText = $('<div>', {
            'class' : 'text',
            html    : parseMarkdown(parseUsernames(comment.body))
        });
        content.append([author, commentText]);
        commentDiv.append([authorAvatar, content]);
        commentSection.append(commentDiv);
    });
    $('#issue_detail').append(commentSection);
});

// Render issue list
issueListStream.subscribe(function(response) {
    $('#issue_detail').empty().hide();
    $('#issues_list').empty().show();
    $('#issues_pages').empty();
    var headers = response.getAllResponseHeaders();
    makePageMenu(headers);

    response.responseJSON.map(function(issue) {
        var issueItem = $('<div>', { 'class' : 'item' });
        var contentDiv = $('<div>', { 'class' : 'content' });
        var issueLabel = $('<div>', {
            'class' : 'ui ribbon label issue_number',
            text : '# ' + issue.number
        });
        var issueTitle = $('<a>', {
            'class' : 'header',
            'id' : issue.number,
            text : issue.title
        });

        contentDiv.append([issueLabel, issueTitle]);

        if (issue.labels.length > 0) {
            metaDiv = $('<div>', { 'class' : 'meta' });
            issue.labels.forEach(function(label) {
                metaDiv.append(styleLabel(label));
            });
            contentDiv.append(metaDiv);
        }

        var issueDescription = $('<div>', {
            'class' : 'description',
            text : shorten(issue.body, 140)
        });
        var extra = $('<div>', {
            'class' : 'extra'
        }).append($('<img>', {
            'class' : 'ui circular avatar image',
            src : issue.user.avatar_url
        })).append(issue.user.login);
        if (issue.comments > 0) {
            extra.append($('<div>', {
                'class' : 'ui right floated label',
                text    : issue.comments + ' '
            }).append($('<i>', { 'class' : 'comment icon' })));
        }

        contentDiv.append([issueDescription, extra]);
        issueItem.append(contentDiv);
        $('#issues_list').append(issueItem);
        bindClickableRequest('#' + issue.number, issue.url, detailRequestStream);
    });
});

listRequestStream.onNext('https://api.github.com/repos/npm/npm/issues?page=2');
