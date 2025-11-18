# Adyen Checkout Example - Codespaces

This example is configured to run in a GitHub Codespaces environment.

## Getting Started

1.  Click the "Code" button on the repository page and select "Open with Codespaces".
2.  A new Codespace will be created for you. The `post-create.sh` script will automatically install the dependencies.
3.  The application will start automatically. You can view the application by clicking on the "Ports" tab and opening the forwarded port (8080).

## Configuration

The Codespaces environment is configured in the `.devcontainer` directory.

-   `devcontainer.json`: Configures the Codespaces environment, including the Docker image, forwarded ports, and post-create commands.
-   `post-create.sh`: A script that is run after the Codespace is created. It installs the dependencies.
-   `.gitignore`: Prevents the `node_modules` directory from being committed to the repository.
