# Get Started
## Install Node.js by source code
* Download nodejs 8
```
wget https://nodejs.org/dist/v8.1.2/node-v8.1.2.tar.gz
```
* Decompress tar
```
tar xvf node-v8.1.2.tar.gz
```
* Compile and install
```
cd node-v8.1.2
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

# Deploy on CentOS 7.0
1. Update `/etc/mongod.conf`: `dbPath` and `pidFilePath`
2. `cp /data/web/sudoku-game/centos/mongodb.service /usr/lib/systemd/system`
3. `cp /data/web/sudoku-game/centos/sudoku-game.service /usr/lib/systemd/system`
4. `systemctl enable mongodb`
5. `systemctl enable sudoku-game`

# TODO List
* Build prop class hierarchy, separate prop's code from game model
* Change prop data structure to array, it's good for extension
