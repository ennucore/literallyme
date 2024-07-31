#!/bin/bash
./get_models.sh
sudo apt update && sudo apt upgrade -y && sudo apt install -y python-is-python3 python3-pip ffmpeg unzip python3-venv libcudnn9-cuda-12
pip install pipx
pipx ensurepath
pipx install poetry
pipx run poetry install

