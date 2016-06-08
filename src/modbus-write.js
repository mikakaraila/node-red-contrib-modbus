/**
 Original Work Copyright 2015 Valmet Automation Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 The BSD 3-Clause License

 Copyright (c) 2016, Klaus Landsdorf (http://bianco-royal.de/)
 All rights reserved.
 node-red-contrib-modbus

 merged back from
 Modified work Copyright © 2016, UChicago Argonne, LLC
 All Rights Reserved
 node-red-contrib-modbustcp (ANL-SF-16-004)
 Jason D. Harper, Argonne National Laboratory

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation and/or
 other materials provided with the distribution.

 3. Neither the name of the copyright holder nor the names of its contributors may be
 used to endorse or promote products derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)

 **/

module.exports = function (RED) {
    "use strict";
    var async = require("async");
    var util = require('util');
    var mbBasics = require('./modbus-basics');

    function ModbusWrite(config) {

        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.dataType = config.dataType;
        this.adr = Number(config.adr);
        this.quantity = config.quantity;

        var node = this;
        var modbusTCPServer = RED.nodes.getNode(config.server);
        var timerID = null;
        var retryTime = 15000; // 15 sec.
        var closeCounter = 0;
        var connectionInitDone = false;

        set_node_status_to("waiting");

        node.receiveEventCloseWrite = function () {
            
            if (connectionInitDone) {

                closeCounter++;

                if (closeCounter > 100) {
                    set_node_status_to("blocked by downloading?");
                    closeCounter = 100;
                } else {
                    set_node_status_to("disconnected");
                }

                if (timerID) {
                    clearInterval(timerID); // clear Timer from events
                }

                timerID = setInterval(function () {
                    closeCounter = 0;
                    // auto reconnect from client
                }, retryTime);
            }
        };

        node.receiveEventConnectWrite = function () {

            if (connectionInitDone) {
                closeCounter = 0;
                set_node_status_to("connected");
            }
        };

        node.receiveEventErrorWrite = function (err) {

            set_node_status_to("error");
            node.error(err);
        };

        function connectModbusSlave() {

            async.series([
                    function (callback) {

                        if (timerID) {
                            clearInterval(timerID); // clear Timer from events
                        }

                        node.connection = null;

                        set_node_status_to("connecting");

                        modbusTCPServer.initializeModbusTCPConnection(
                            function (connection, err) {

                                if (err) {
                                    callback(err);

                                } else if (connection) {
                                    set_node_status_to("initialized");
                                    node.connection = connection;
                                    callback();
                                }
                                else {
                                    callback('connection is null without errors');
                                }
                            }
                        );
                    },
                    function (callback) {

                        if (timerID) {
                            clearInterval(timerID); // clear Timer from events
                        }

                        if (node.connection) {

                            node.connection.on('close', node.receiveEventCloseWrite);
                            node.connection.on('error', node.receiveEventErrorWrite);
                            node.connection.on('connect', node.receiveEventConnectWrite);
                            callback();

                        } else {

                            timerID = setInterval(function () {
                                connectModbusSlave();
                            }, retryTime);

                            callback('connection is null - retry in ' + retryTime + ' seconds');
                        }
                    },
                    function (callback) {
                        verbose_warn('connection write async done');
                        callback();
                    }
                ],
                function (err) {
                    if (err) {
                        node.connection = null;
                        node.error(err);
                    }
                }
            );
        }

        connectModbusSlave();
        connectionInitDone = true;

        node.on("input", function (msg) {

                if (!(msg && msg.hasOwnProperty('payload'))) return;

                if (msg.payload == null) {
                    set_node_status_to("payload error");
                    node.error('ModbusTCPWrite: Invalid msg.payload!');
                    return;
                }

                node.status(null);

            if (!node.connection) {
                    set_node_status_to("waiting");
                    return;
                }

                switch (node.dataType) {
                    case "MCoils": //FC: 15
                        verbose_log('write payload length: ' + msg.payload.length);
                        verbose_warn('array ' + typeof msg.payload + ' ' + msg.payload);
                        if (Number(msg.payload.length) !== Number(node.quantity)) {
                            node.error("Quantity should be less or equal to coil payload array length: " + msg.payload.length + " Addr: " + node.adr + " Q: " + node.quantity);
                        } else {
                            node.connection.writeMultipleCoils(Number(node.adr), msg.payload).then(function (resp) {
                                set_node_status_to("active writing");
                                node.send(build_message(msg.payload, resp));
                            }).fail(set_modbus_error);
                        }
                        break;
                    case "Coil": //FC: 5
                        node.connection.writeSingleCoil(Number(node.adr), (msg.payload == true)).then(function (resp) {
                            set_node_status_to("active writing");
                            node.send(build_message(msg.payload, resp));
                        }).fail(set_modbus_error);
                        break;
                    case "MHoldingRegisters": //FC: 16
                        verbose_log('write payload length: ' + msg.payload.length);
                        verbose_warn('array ' + typeof msg.payload + ' ' + msg.payload);
                        if (Number(msg.payload.length) !== Number(node.quantity)) {
                            node.error("Quantity should be less or equal to register payload array length: " + msg.payload.length + " Addr: " + node.adr + " Q: " + node.quantity);
                        } else {
                            node.connection.writeMultipleRegisters(Number(node.adr), msg.payload).then(function (resp) {
                                set_node_status_to("active writing");
                                node.send(build_message(msg.payload, resp));
                            }).fail(set_modbus_error);
                        }
                        break;
                    case "HoldingRegister": //FC: 6
                        node.connection.writeSingleRegister(Number(node.adr), Number(msg.payload)).then(function (resp) {
                            set_node_status_to("active writing");
                            node.send(build_message(Number(msg.payload), resp));
                        }).fail(set_modbus_error);
                        break;

                    default:
                        break;
                }
            }
        );

        node.on("close", function () {

            verbose_warn("write close");
            set_node_status_to("closed");

            connectionInitDone = false;
            node.receiveEventCloseWrite = null;
            node.receiveEventConnectWrite = null;
            node.receiveEventErrorWrite = null;
            node.connection = null;
        });

        function verbose_warn(logMessage) {
            if (RED.settings.verbose) {
                node.warn((node.name) ? node.name + ': ' + logMessage : 'ModbusWrite: ' + logMessage);
            }
        }

        function verbose_log(logMessage) {
            if (RED.settings.verbose) {
                node.log(logMessage);
            }
        }

        function build_message(values, response) {
            set_node_status_to("connected");
            return [{payload: values}, {payload: response}]
        }

        function set_node_status_to(statusValue) {
            var statusOptions = mbBasics.set_node_status_properties(statusValue);
            if (mbBasics.statusLog) {
                verbose_log("status options: " + JSON.stringify(statusOptions));
            }
            node.status({
                fill: statusOptions.fill,
                shape: statusOptions.shape,
                text: statusOptions.status
            });
        }

        function set_modbus_error(err) {
            if (err) {
                set_node_status_to("error");
                verbose_log(err);
                node.error('Modbus Write client: ' + JSON.stringify(err));
                return false;
            }
            return true;
        }
    }

    RED.nodes.registerType("modbus-write", ModbusWrite);
};
