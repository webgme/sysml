# webgme-sysml
SysML implementation using WebGME as a library

## Installation

### Clone the repository
Install all dependency modules
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

### Environment Special Notes

#### Ubuntu

The node.js package dependencies can be installed with apt-get.
```bash
sudo apt-get install npm mongodb
```

The default command for node.js is not 'node'
unless you install the legacy package.
```bash
sudo apt-get install nodejs-legacy
```

## Current Features
### WebGME-SysML language definition
### WebGME-SysML language and models are provided with domain-specific visualizations (decorator)
### SysML modeling with WebGME-SysML language (under OMG specification v1.3+)
#### Diagrams supported: 
* Block Definition Diagram
* Internal Block Diagram
* Package Diagram (WebGME-flavored)
* Parametric Diagram
* Requirement Diagram
* Use Case Diagram
* Sequence Diagram
(Check out [WebGME-Domain-Tools](https://github.com/webgme/webgme-domain-tools) for Activity Diagram and State Machine Diagram)

### SysML diagrams exportable to Eclipse Papyrus:
* Internal Block Diagram
* Requirement Diagram
* Use Case Diagram

### SysML diagrams importable from Eclipse Papyrus:
* Block Definition Diagram
* Internal Block Diagram
* Parametric Diagram
* Requirement Diagram
* Use Case Diagram

### SysML diagram elements exportable to SysML specs (see Eclipse Papyrus uml file in project for schema)
* Block Definition Diagram
* Internal Block Diagram
* Parametric Diagram
* Requirement Diagram
* Use Case Diagram
* Elements from above diagrams within hierarchical packages are exportable

## Limitations/TODOs
* Not all components in the OMG specs are modeled in WebGME-SysML. Please create an [issue](https://github.com/webgme/webgme-sysml/issues) to recommend or report needed elements
* Only a set of elements from diagrams mentioned above are exportable to Eclipse
* Information regarding connections is exportable to Eclipse, but users will have to manually display the connections onto the diagrams
* WebGME-flavored Package Diagram can be created by adding and organizing different "Package" elements
* Sequence Diagram visualization is still in need of a different visualizer so that it should resemble more of a traditional Sequence Diagram; in current Sequence Diagram, in order to create events in different times, display the "ExecutionSpecification" in vertical order
* Current WebGME-SysML models are not exportable to other existing SysML editors

