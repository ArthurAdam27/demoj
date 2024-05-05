#!/bin/bash
# shellcheck shell=bash source=/dev/null disable=SC2154

: '
This script initializes the virtual environment for the demoj project.
All libraries and dependencies are installed in the virtual environment.
The deamon will use the virtual environment to run scripts.
'

# Including utility functions
source "$(dirname "$0")"/utils.sh

# Checking if the script is executed as root
check_root

# Displaying initialization message
echo "Initializing virtualenv"

# Get the user
user="$SUDO_USER"

# Checking the existence of the demoj directory
check_directory "/home/$user/demoj" || die "Directory /home/$user/demoj does not exist. Please run repository.sh first"

# Installing python3-venv
echo "Installing python3-venv"
apt install python3.11-venv -y >> "$log_file" 2>&1 || die "Failed to install python3.11-venv"

# Moving to the demoj directory
echo "Changing directory to /home/$user/demoj"
cd "/home/$user/demoj" || exit 1

# Creating the virtual environment
echo "Creating virtual environment"
python3 -m venv venv >> "$log_file" 2>&1 || die "Failed to create virtual environment"

# Activating the virtual environment
echo "Activating virtual environment"
source venv/bin/activate >> "$log_file" 2>&1 || die "Failed to activate virtual environment"

# NOTE: ALL PIP INSTALL COMMANDS GOES HERE
# Installing dependencies based on the user
case "$user" in
    terminal)
        pip install "python-socketio[client]" >> "$log_file" 2>&1 || die "Failed to install socketio"
        ;;
    server)
        pip install "python-socketio[client]" >> "$log_file" 2>&1 || die "Failed to install socketio"
        pip install "flask" >> "$log_file" 2>&1 || die "Failed to install flask"
        pip install "flask-cors" >> "$log_file" 2>&1 || die "Failed to install flask-cors"
        ;;
    network)
        pip install flask >> "$log_file" 2>&1 || die "Failed to install flask"
        pip install flask_cors >> "$log_file" 2>&1 || die "Failed to install flask_cors"
        pip install flask-socketio >> "$log_file" 2>&1 || die "Failed to install flask-socketio"
        ;;
    *)
        die "Invalid user"
        ;;
esac

# Installing libs to manage I2C

# Installing smbus package via pip
echo "Installing smbus"
pip install smbus >> "$log_file" 2>&1 || die "Failed to install smbus"

# Installing rpi_ws281x package via pip
echo "Installing strip led API"
pip install rpi_ws281x >> "$log_file" 2>&1 || die "Failed to install rpi_ws281x"

# Deactivating the virtual environment
echo "Deactivating virtual environment"
deactivate >> "$log_file" 2>&1 || die "Failed to deactivate virtual environment"

echo -e "${GREEN}Virtualenv initialized ${RESET}"

exit 0