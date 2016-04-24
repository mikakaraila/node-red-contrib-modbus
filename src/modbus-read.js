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

    function ModbusRead(config) {

        RED.nodes.createNode(this, config);

        this.name = config.name;
        this.dataType = config.dataType;
        this.adr = config.adr;
        this.quantity = config.quantity;
        this.rate = config.rate;
        this.rateUnit = config.rateUnit;
        this.connection = null;

        var node = this;
        var modbusTCPServer = RED.nodes.getNode(config.server);
        var timerID = null;
        var retryTime = 15000; // 15 sec.

        set_node_status_to("waiting");

        node.receiveEventCloseRead = function () {
            if (node) {
                set_node_status_to("disconnected");
                connectModbusSlave();
            }
        };

        node.receiveEventConnectRead = function () {
            if (node) {
                set_node_status_to("connected");

                timerID = setInterval(function () {
                    ModbusMasterRead();
                }, mbBasics.calc_rateByUnit(node.rate, node.rateUnit));
            }
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

                            node.connection.on('close', node.receiveEventCloseRead);
                            node.connection.on('connect', node.receiveEventConnectRead);
                            callback();

                        } else {

                            timerID = setInterval(function () {
                                connectModbusSlave();
                            }, retryTime);

                            callback('connection is null - retry in ' + retryTime + ' seconds');
                        }
                    },
                    function (callback) {
                        verbose_warn('connection read async done');
                        callback();
                    }
                ],
                function (err) {
                    if (err) {
                        node.connection = null;
                        callback(err);
                    }
                }
            );
        }

        connectModbusSlave();

        function ModbusMasterRead() {

            var msg = {};
            msg.topic = node.name;

            if (node.connection &&
                node.connection.isConnected()) {

                switch (node.dataType) {
                    case "Coil": //FC: 1
                        set_node_status_to("polling");
                        node.connection.readCoils(node.adr, node.quantity, function (resp, err) {
                            if (set_modbus_error(err) && resp) {
                                set_node_status_to("active reading");
                                node.send(build_message(resp.coils, resp));
                            }
                        });
                        break;
                    case "Input": //FC: 2
                        set_node_status_to("polling");
                        node.connection.readDiscreteInput(node.adr, node.quantity, function (resp, err) {
                            if (set_modbus_error(err) && resp) {
                                set_node_status_to("active reading");
                                node.send(build_message(resp.coils, resp));
                            }
                        });
                        break;
                    case "HoldingRegister": //FC: 3
                        set_node_status_to("polling");
                        node.connection.readHoldingRegister(node.adr, node.quantity, function (resp, err) {
                            if (set_modbus_error(err) && resp) {
                                set_node_status_to("active reading");
                                node.send(build_message(resp.register, resp));
                            }
                        });
                        break;
                    case "InputRegister": //FC: 4
                        set_node_status_to("polling");
                        node.connection.readInputRegister(node.adr, node.quantity, function (resp, err) {
                            if (set_modbus_error(err) && resp) {
                                set_node_status_to("active reading");
                                node.send(build_message(resp.register, resp));
                            }
                        });
                        break;
                }
            } else {
                verbose_log('connection not ready - retry in ' + retryTime + ' seconds');

                clearInterval(timerID); // remove ModbusMasterRead

                timerID = setInterval(function () {
                    connectModbusSlave();
                }, retryTime);
            }
        }

        node.on("close", function () {

            verbose_warn("read close");
            clearInterval(timerID);
            set_node_status_to("closed");
            node.receiveEventCloseRead = null;
            node.receiveEventConnectRead = null;
            node.connection = null;
            node = null;
        });

        function verbose_warn(logMessage) {
            if (RED.settings.verbose) {
                node.warn((node.name) ? node.name + ': ' + logMessage : 'Modbus read: ' + logMessage);
            }
        }

        function verbose_log(logMessage) {
            if (RED.settings.verbose) {
                node.log(logMessage);
            }
        }

        function build_message(values, response) {
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
                text: statusOptions.status + get_timeInfo()
            });
        }

        function get_timeInfo() {
            return ' ( ' + node.rate + ' ' + mbBasics.get_timeUnit_name(node.rateUnit) + ' )';
        }

        function set_modbus_error(err) {
            if (err) {
                set_node_status_to("error");
                verbose_log(err);
                node.error('Modbus Read client: ' + JSON.stringify(err));
                return false;
            }
            return true;
        }
    }

    RED.nodes.registerType("modbus-read", ModbusRead);
};
