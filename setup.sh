#!/bin/bash
apt update && apt upgrade -y && apt install -y sudo
sudo apt update && sudo apt upgrade -y && sudo apt install -y python-is-python3 python3-pip ffmpeg unzip python3-venv libcudnn9-cuda-12 wget
./get_models.sh
pip install pipx
pipx ensurepath
pipx install poetry
pipx run poetry install
pipx run poetry add onnxruntime-gpu@^1.18.1 --source onnxruntime-cuda-12

