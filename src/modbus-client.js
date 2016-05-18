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
    var modbus = require('jsmodbus');
    var util = require('util');

    function ModbusClientNode(config) {

        RED.nodes.createNode(this, config);

        this.host = config.host;
        this.port = config.port;
        this.unit_id = config.unit_id;

        var node = this;

        node.client = null;
        var serverInfo = ' at ' + node.host + ':' + node.port + ' unit_id: ' + node.unit_id;
        var connections = 0;

        function verbose_warn(logMessage) {
            if (RED.settings.verbose) {
                node.warn('Client -> ' + logMessage + serverInfo);
            }
        }

        function verbose_log(logMessage) {
            if (RED.settings.verbose) {
                node.log('Client -> ' + logMessage + serverInfo);
            }
        }

        node.initializeModbusTCPConnection = function (handler) {

            if (node.client && connections > 0) {
                verbose_log(connections + ' Connections connected to modbus slave');
                handler(node.client);
            }
            else {
                verbose_log('Connecting to modbus slave with ' + connections + ' connections');

                node.client = null;
                try {
                    node.client = modbus.client.tcp.complete({
                        'host': config.host,
                        'port': config.port,
                        'autoReconnect': true,
                        'timeout': 5000,
                        'unitId': Number(config.unit_id)
                    });

                    node.client.connect();
                    connections++;

                    handler(node.client);
                }
                catch (err) {
                    handler(null, err);
                }
            }
        };

        node.on("close", function () {
            verbose_warn("Client close");
            verbose_log('disconnecting from modbus slave');

            if (node.client && connections > 0) {
                node.client.close();
                node.client = null;
                verbose_warn("Client closed " + connections--);
            }
            else {
                node.client = null;
                verbose_warn("Client closed");
            }
        });
    }

    RED.nodes.registerType("modbus-client", ModbusClientNode);
};
