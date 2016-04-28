Github Issues Viewer
====================

This application provides a single page view of Github issues.

# How to Run
This is a simple node.js server serving static files. It runs on systems with node.js and npm (node package manager) installed.

Running these commands from the root directory installs the node modules specifc to this project and launches the server:
```sh
npm install
node app.js
```
The application is then accessed from a browser at [localhost:3000](http://localhost:3000)


# Discussion
I have written several web applications before where the data came from the server side and was rendered onto templates before being served to the client.
Right off the bat with this challenge I approached it thinking that since none of the data belonged to the back end I would write it completely on the client side.
Because I planned to host this project on an EC2 instance and I have long ran out of free AWS, I wanted to place very minimal load on the server, so the server only serves static files.

The idea was to create a dynamic and responsive viewer that communicates with the github API, and formats and displays responses.
There is only one page, on which the user can search for github repositories using the search bar. When a repository is chosen, 30 of its issues are loaded and a pagination menu appears next to the search bar. The user can click on the title of each issue to load the full summary and comments of the issue.

Communication with the github API is done using Rx.js streams with underlying jQuery ajax requests. The search bar uses Semantic UI's search API functions. The html elements are generated - almost manually I would say - using jQuery, and styled with Semantic UI classes. My style is to display information as simply as I can as I am mostly interested in functionality, analysis and data pipelining. I also included showdown.js for their markdown parser and the html skeleton in index.html is based on HTML5 boilerplate.

Building the large majority of contents programmatically turned out to be much more tedious than first estimated. Although I believe this is functional enough for deliver, if I were to start this project over or extend it for continued usage, I would invest much more initial planning time on client-side templating.
