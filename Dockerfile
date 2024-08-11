# Use the base image
FROM nvidia/cuda:12.0.1-devel-ubuntu22.04

# Set the working directory to /root to avoid permission issues
WORKDIR /root


# Change directory to literallyme and run setup.sh
RUN apt update && apt upgrade -y && apt install -y sudo
RUN sudo apt update && sudo apt upgrade -y && sudo apt install -y python-is-python3 python3-pip ffmpeg unzip python3-venv libcudnn9-cuda-12 wget
RUN pip install pipx
RUN pipx ensurepath
RUN pipx install poetry
COPY . /root/literallyme
RUN cd /root/literallyme && ./get_models.sh
RUN cd /root/literallyme && pipx run poetry install
