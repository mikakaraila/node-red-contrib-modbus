/**

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
    var util = require('util');
    var mbBasics = require('./modbus-basics');

    function ModbusResponse(config) {

        RED.nodes.createNode(this, config);

        this.registerShowMax = config.registerShowMax;

        var node = this;

        set_node_status_to("initialized");

        function verbose_warn(logMessage) {
            if (RED.settings.verbose) {
                node.warn((node.name) ? node.name + ': ' + logMessage : 'Modbus response: ' + logMessage);
            }
        }

        function verbose_log(logMessage) {
            if (RED.settings.verbose) {
                node.log(logMessage);
            }
        }

        function set_node_status_to(statusValue, response) {

            if (mbBasics.statusLog) {
                verbose_log("response status: " + statusValue);
            }

            var fillValue = "red";
            var shapeValue = "dot";

            switch (statusValue) {

                case "initialized":
                    fillValue = "green";
                    shapeValue = "ring";
                    break;

                case "active":
                    fillValue = "green";
                    shapeValue = "dot";
                    break;

                default:
                    if (!statusValue || statusValue == "waiting") {
                        fillValue = "blue";
                        statusValue = "waiting ...";
                    }
                    break;
            }

            node.status({fill: fillValue, shape: shapeValue, text: util.inspect(response, false, null)});
        }

        node.on("input", function (msg) {

            if (msg.payload.hasOwnProperty('register')
                && msg.payload.register.length > node.registerShowMax) {

                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: 'fc: ' + msg.payload.fc + ' byteCount: ' + msg.payload.byteCount + ' registerCount: ' + msg.payload.register.length
                });
            } else {
                set_node_status_to("active", msg.payload);
            }
        });

        node.on("close", function () {
            verbose_warn("read close");
            set_node_status_to("closed");
        });
    }

    RED.nodes.registerType("modbus-response", ModbusResponse);
};
