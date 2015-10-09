/**
 * Created by zhangpn on 11/3/2014.
 */
define(['plugin/PluginConfig',
        'plugin/PluginBase',
        'js/Widgets/DiagramDesigner/DiagramDesignerWidget.DecoratorBase',], function (PluginConfig, PluginBase, Decorator) {

    'use strict';

    var NAME = 'name',
        ISPORT = 'isPort',
        DELIM = '=>';

    var LayoutExporterPlugin = function () {
        PluginBase.call(this);
        this.modelID = 0;
        this.diagram = {};
        this.idLUT = {};
        this.error = '';
        this.connections = [];
        this.components = [];
    };

    LayoutExporterPlugin.prototype = Object.create(PluginBase.prototype);
    LayoutExporterPlugin.prototype.constructor = LayoutExporterPlugin;

    LayoutExporterPlugin.prototype.getName = function () {
        return 'LayoutExporter';
    };

    LayoutExporterPlugin.prototype.main = function (callback) {

        var self = this,
            selectedNode = self.activeNode,
            afterAllVisited;

        // uncomment this to enable updating "validPlugin" field
//        var newRootHash,
//            result,
//            core = self.core;
//        core.setRegistry(self.rootNode, 'validPlugins', '');
//        // Commit changes.
//        core.persist(self.rootNode, function (err) {
//        });
//        newRootHash = core.getHash(self.rootNode);
//        console.info("Plugin updated model");
//        result = {'commitHash': self.commitHash};
//        result.commitHash = self.project.makeCommit([result.commitHash], newRootHash, 'Plugin updated the model.', function (err) {
//        });

        if (!selectedNode) {
            callback('selectedNode is not defined', self.result);
            return;
        }

        // after all children are visited
        afterAllVisited = function (err) {
            var output = {
                components: self.components,
                connections: self.connections
            };

            if (err) {
                callback(err, self.result);
                return;
            }

            // a dirty way to get component size, port relative position, connection pathpoints
            if (window.document) {

                self.getData(window.document);
            }

            self.saveResults(output, callback);

            console.info("Plugin completed");

        };

        self.getChildrenFromNode(selectedNode, afterAllVisited);

    };


    LayoutExporterPlugin.prototype.getChildrenFromNode = function (node, callback) {
        var self = this,
            afterLoading;

        afterLoading = function (err, children) {
            var i,
                itrCallback,
                error = '';
            if (err) {
                callback('Could not load children for object, err: ' + err);
                return;
            }

            for (i = 0; i < children.length; i += 1) {
                self.atNode(children[i], function (err) {
                    if (err) {
                        // todo: error handling
                    }

                });
            }

            callback(null);
        };

        // load activeNode's children
        self.core.loadChildren(node, afterLoading);
    };

    LayoutExporterPlugin.prototype.atNode = function (node, callback) {

        var self = this,
            core = self.core,
            SRCPTR = "src",
            DSTPTR = "dst",
            ptrArray = core.getOwnPointerNames(node),
            component = {},
            connection = {},
            srcPath,
            dstPath,
            counter = 2,
            error = "",
            afterLoadingSrc,
            afterLoadingDst,
            pushConnection,
            afterLoadingChildren;

        afterLoadingSrc = function (err, node) {
            var isPort = core.getRegistry(node, ISPORT),
                portId = "",
                srcObj;

            if (err) {
                pushConnection(err);
                return;
            }

            // if src node is a port, then return srcObj as its parent node
            if (isPort) {
                srcObj = core.getParent(node);
                portId = DELIM + core.getPath(node);
            } else {
                // else return node as srcObj
                srcObj = node;
            }

            connection.srcID = core.getPath(srcObj) + portId;
            pushConnection(null, connection);
        };

        afterLoadingDst = function (err, node) {
            var isPort = core.getRegistry(node, ISPORT),
                portId = "",
                dstObj;

            if (err) {
                pushConnection(err);
                return;
            }

            // if dst node is a port, then return dstObj as its parent node
            if (isPort) {
                dstObj = core.getParent(node);
                portId = DELIM + core.getPath(node);
            } else {
                // else return node as dstObj
                dstObj = node;
            }

            connection.dstID = core.getPath(dstObj) + portId;

            pushConnection(null, connection);
        };

        pushConnection = function (err, connection) {
            // todo: get pathpoints of connection
            if (err) {
                error += err;
            }

            --counter;
            // waiting on two threads -- srcobj and dstobj threads
            if (counter === 0) {
                if (error) {
                    callback(error);
                    return;
                }
                self.connections.push(connection);
                callback(null);
            }
        };

        afterLoadingChildren = function (err, children) {
            var port,
                i;

            if (err) {
                error += err;
                callback(error);
                return;
            }

            // todo: fix relative position of ports
            if (children.length > 0) {
                component.ports = [];
                for (i = 0; i < children.length; i += 1) {
                    port = {
                        name: core.getAttribute(children[i], NAME),
                        id: core.getPath(children[i]),
                        relative_position: {
                            x: 0,
                            y: 0
                        }
                    };
                    component.ports.push(port);
                }
            }

            self.components.push(component);
            callback(null);
        };

        // check if node is a connection
        // todo: find a better way to get connections...
        if (ptrArray.indexOf(SRCPTR) > -1 && ptrArray.indexOf(DSTPTR) > - 1) {
            // get source object and dst object:

            srcPath = core.getPointerPath(node, SRCPTR);
            dstPath = core.getPointerPath(node, DSTPTR);

            // name, id, srcid, dstid, pathpoints

            connection.name = core.getAttribute(node, NAME);
            connection.id = core.getPath(node);

            core.loadByPath(self.rootNode, srcPath, afterLoadingSrc);
            core.loadByPath(self.rootNode, dstPath, afterLoadingDst);

        } else {
            // node is a component, get id, name, position, size if there's one
            // get ports if component has ports

            component.name = core.getAttribute(node, NAME);
            component.id = core.getPath(node);
            component.position = node.data.reg.position;

            // get ports of component if any
            core.loadChildren(node, afterLoadingChildren);
        }
    };

    LayoutExporterPlugin.prototype.saveResults = function (obj, callback) {
        var self = this,
            core = self.core,
            artifact = self.blobClient.createArtifact('LayoutExporterOutput'),
            file = {};

        file[core.getAttribute(self.activeNode, NAME) + ".json"] = JSON.stringify(obj, null, 4);

        artifact.addFiles(file, function (err, hashes) {
            if (err) {
                callback(err, self.result);
                return;
            }
            self.logger.warning(hashes.toString());
            artifact.save(function (err, hash) {
                if (err) {
                    callback(err, self.result);
                    return;
                }
                self.result.addArtifact(hash);
                self.result.setSuccess(true);
                callback(null, self.result);
            });
        });
    };

    LayoutExporterPlugin.prototype.getData = function (doc) {
        var self = this,
            items = $(doc).find('.items'),
            conns = items.children()[0],
            comps = items.find('.designer-item'),
            i,
            j,
            matchFound;

        // find components in designer-items and get size for each component
        for (i = 0; i < comps.length; i += 1) {
            for (j = 0; j < self.components.length; j += 1) {

                // if x pos and y pos of designer item is +/- 6px of component x pos and y pos,
                // then get size of decorator and store it in our layout object
                matchFound = match(comps[i].style.left, comps[i].style.top, self.components[j].position.x, self.components[j].position.y);
                if (matchFound) {
                    self.components[j].size = {};
                    self.components[j].size.width = parseInt($(comps[i]).find('.svg-container')[0].children[0].getAttribute('width'));
                    self.components[j].size.height = parseInt($(comps[i]).find('.svg-container')[0].children[0].getAttribute('height'));

                    // todo: get ports relative position info
                    // different decors wrap connectors differently
                    if (self.components[j].ports) {

                    }
                    break;
                }
            }
        }

        // find connection info

    };

    var match = function (x, y, targetX, targetY) {
        var _meetTarget,
            xMeet,
            yMeet;

        _meetTarget = function (val, target) {
            var RANGE_OFFSET = 6;

            return parseInt(val) <= target + RANGE_OFFSET && parseInt(val) >= target - RANGE_OFFSET;
        };

        xMeet = _meetTarget(x, targetX);
        yMeet = _meetTarget(y, targetY);

        return xMeet && yMeet;
    };

    return LayoutExporterPlugin;
});