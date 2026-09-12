@echo off
echo Starting local web server on http://localhost:8080 ...
echo Open your browser to http://localhost:8080
echo Press Ctrl+C in this window to stop the server.
py -m http.server 8080
pause

