#!/bin/bash

lockfile="$1"

if [ -z "$lockfile" ]; then
    echo "Usage: $0 <lockfile>"
    exit 1
fi

if ( set -o noclobber; echo "$$" > "$lockfile" ) 2> /dev/null; then
    rm "$lockfile"
    echo "The lock file is not locked."
else
    echo "The lock file is locked."
fi
