#!/bin/bash

# Starts Local Web Server in current directory and opens html in
# default browser. Default Browser only tested with Chrome 27.
cd ~/Development/sulcusmusicum
python -m SimpleHTTPServer &
open http://localhost:8000/sulcusmusicum.html
