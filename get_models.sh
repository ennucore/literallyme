#!/bin/bash
wget https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
mkdir -p ~/.insightface/models/buffalo_l
apt install -y unzip
unzip buffalo_l.zip -d ~/.insightface/models/buffalo_l
rm buffalo_l.zip

