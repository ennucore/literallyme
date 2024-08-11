# Use the base image
FROM nvidia/cuda:12.0.1-devel-ubuntu22.04

# Disable automatic tmux (touch ~/.no_auto_tmux)
RUN touch ~/.no_auto_tmux

# Set the working directory to /root to avoid permission issues
WORKDIR /root

# Copy the current repository to the literallyme folder inside the container
COPY . /root/literallyme

# Change directory to literallyme and run setup.sh
RUN cd /root/literallyme && ./setup.sh
