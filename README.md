# webgme-sysml
SysML implementation using WebGME as a library

## Installation

### Clone the repository

``` bash
npm install
```

### Start the Mongo database manager
The MongoDB database manager must be
running before starting WebGME.
``` bash
mongod --rest
```

### Start WebGME 
The following starts WebGME with the default configuration.

``` bash
node app.js 
```
alternatively...
``` bash
npm start
```
Go to (http://127.0.0.1:9091) to access the user interface.

The following starts WebGME with a custom configuration.
Make sure you unset the environment variable afterwards.
#### Windows
``` bash
set NODE_ENV=app && node app.js 
```
alternatively...
``` bash
set NODE_ENV=app && npm run app 
```

#### Linux
``` bash
env NODE_ENV=app && node app.js 
```
alternatively...
``` bash
env NODE_ENV=app && npm run app 
```

### (optional) Run the test example for a plugin.

``` bash
npm run test
```

## Environment Special Notes

### Ubuntu

The node.js package dependencies can be installed with apt-get.
```bash
sudo apt-get install npm mongodb
```

The default command for node.js is not 'node'
unless you install the legacy package.
```bash
sudo apt-get install nodejs-legacy
```
