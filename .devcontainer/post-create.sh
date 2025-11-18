#!/bin/bash

# This script is executed after the container is created.

# Find all directories containing a package.json file
PROJECTS=($(find . -maxdepth 2 -name "package.json" -not -path "./.devcontainer/*" -not -path "./node_modules/*" | xargs -n 1 dirname | sort -u))

# If no projects are found, exit
if [ ${#PROJECTS[@]} -eq 0 ]; then
    echo "No projects found. Exiting."
    exit 1
fi

# If there is only one project, select it automatically
if [ ${#PROJECTS[@]} -eq 1 ]; then
    SELECTED_PROJECT=${PROJECTS[0]}
    echo "Only one project found: $SELECTED_PROJECT. Selecting it automatically."
else
    # Prompt the user to select a project
    echo "Please select a project to work on:"
    select project in "${PROJECTS[@]}"; do
        if [[ -n "$project" ]]; then
            SELECTED_PROJECT=$project
            break
        else
            echo "Invalid selection. Please try again."
        fi
    done
fi

# Navigate to the selected project directory
cd "$SELECTED_PROJECT"

# Check for .env.example and copy it to .env
if [ -f ".env.example" ]; then
    echo "Found .env.example, copying to .env"
    cp .env.example .env
fi

# Install dependencies
echo "Installing dependencies for $SELECTED_PROJECT..."
npm install

# Print a message to the user
echo ""
echo "----------------------------------------------------------------"
echo "Your development environment is ready!"
echo "You are in the '$SELECTED_PROJECT' directory."
echo "To start the application, you might need to run: npm start"
echo "----------------------------------------------------------------"

# Open the README.md file in the editor
if [ -f "README.md" ]; then
    code README.md
fi
