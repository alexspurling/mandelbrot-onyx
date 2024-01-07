#!/bin/bash

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <file1> <file2> ... <fileN> <command_to_run>"
    exit 1
fi

files=("${@:1:$#-1}")  # Array of files to monitor
command_to_run="${@: -1}"  # Last argument is the command to run

declare -A previous_timestamps  # Associative array to store previous timestamps

for file in "${files[@]}"; do
    previous_timestamps["$file"]=$(stat -c %Y "$file")
done

GREEN='\033[0;32m'
NC='\033[0m'  # No color, to reset to the default color

# Execute the command at least once
eval "$command_to_run"

echo "Monitoring for changes to ${files[*]}"

while true; do
    for file in "${files[@]}"; do
        current_timestamp=$(stat -c %Y "$file")

        if [ "$current_timestamp" != "${previous_timestamps[$file]}" ]; then
            echo -e "${GREEN}File $file has been modified!${NC} Running command: $command_to_run"
            eval "$command_to_run"

            # Update the previous timestamp for this file
            previous_timestamps["$file"]=$current_timestamp
        fi
    done

    sleep 0.1  # Adjust the polling interval as needed
done
