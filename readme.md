# Get Started
## Install Node.js by source code
* Download nodejs v0.12.7
```
wget https://nodejs.org/dist/v0.12.7/node-v0.12.7.tar.gz
```
* Decompress tar
```
tar xvf node-v0.12.7.tar.gz
```
* Compile and install
```
cd node-v0.12.7
./configure
make
make install
```

## Install MongoDB
* For Ubuntu, please refer:
http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/?_ga=1.172587364.613233872.1441717179
* For CentOS, please refer:
http://docs.mongodb.org/manual/tutorial/install-mongodb-on-red-hat/?_ga=1.213473875.613233872.1441717179

## Install GraphicsMagick
```
sudo apt-get install graphicsmagick
```
## Install Dependencies for node-canvas
* For Ubuntu, please refer:
https://github.com/Automattic/node-canvas/wiki/Installation---Ubuntu-and-other-Debian-based-systems
* For CentOS, pleaser refer:
https://github.com/Automattic/node-canvas/wiki/Installation---Fedora

## Install Dependencies
```
npm install
```

## Start Server
```
npm start
```

## Debug
### Install node-inspector
```
npm install -g node-inspector
```
### Start node-inspector
```
node-inspector
```
### Start Server on debug mode
```
node --debug bin/startup.js
```
