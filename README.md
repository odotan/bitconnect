Download from: https://github.com/odotan/bitconnect

### Instructions:

1. Install Node from http://nodejs.org

'''
sudo apt-get install nodejs
'''

Make sure to get NPM as well (to see if you have NPM installed, just try running '''npm''' on the command line)

2. Install pybitcointools from http://github.com/vbuterin/pybitcointools
 ```
 sudo python setup.py install
 ```
3. Install MongoDb from http://www.mongodb.org/downloads
or using homebrew on osx
```
brew update
brew install mongodb
```
start mongodb
 on Linux:
 ``` 
  sudo service mongodb start
 ```
 on OSX:
  http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/
  
  basically what it says:
  ```
   mkdir -p /data/db
   chown `id -u` /data/db
   mongod
   ``` 
4. Install and run compass
 ``` 
  gem install compass
  compass watch
 ```
4. Go to the directory, and type ```npm install```
5. To run the server, type ```node server.js```
 * verify server.js https and http ports are available
 * verify you have added the key.pem and cert.pem files to the projects root directory
6. To see the page, visit http://localhost:80 in your browser.


### Notes
http://dataurl.net/#dataurlmaker


### Development Steps

```
mongod
```

```
compass watch
```

change server.js dev flag to true

```
node server.js
```

run ngrok from project root dir
```
./ngrok localhost:8000
```

go to facebook dev and modify Site Url to include the ngrok generated domain

now browse to the ngrok url for development changes tracking
