/**
 * Original Work Copyright 2014 IBM Corp.
 *
 * Copyright (c) 2016, Klaus Landsdorf (http://bianco-royal.de/)
 * All rights reserved.
 * node-red-contrib-modbus
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var assert = require('chai').assert;

var should = require("should");
var nodeUnderTestClient = require("../src/modbus-client.js");
var nodeUnderTest = require("../src/modbus-read.js");
var helper = require("../src/nodered-helper.js");

var nodeFlow = [{
    "id": "8a55b918.be5988",
    "type": "modbus-client",
    "z": "fe6ca4fb.0a3d08",
    "host": "127.0.0.1",
    "port": "502",
    "unit_id": "1"
}, {
    "id": "80f8c8ea.943028",
    "type": "debug",
    "z": "fe6ca4fb.0a3d08",
    "name": "debugNode",
    "active": true,
    "console": "false",
    "complete": "payload",
    "x": 310,
    "y": 120,
    "wires": []
}, {
    "id": "fb0a0636.4dd158",
    "type": "modbus-read",
    "z": "fe6ca4fb.0a3d08",
    "name": "modbusRead",
    "dataType": "Coil",
    "adr": "0",
    "quantity": "1",
    "rate": "1",
    "rateUnit": "s",
    "server": "8a55b918.be5988",
    "x": 120,
    "y": 140,
    "wires": [["80f8c8ea.943028"], ["94647b20.a02e08"]]
}, {
    "id": "94647b20.a02e08",
    "type": "modbus-response",
    "z": "fe6ca4fb.0a3d08",
    "name": "modbusResponse",
    "registerShowMax": 20,
    "x": 330,
    "y": 160,
    "wires": []
}, {id: "n2", type: "helper"}];


var simpleNodeFlow = [{
    id: "n1",
    type: "modbus-read",
    name: "modbusRead",
    dataType: "Coil",
    adr: "0",
    quantity: "1",
    rate: "1",
    rateUnit: "s",
    server: "modbusClient",
    wires: [[], []]
}];

describe('Read node Testing', function () {

    before(function (done) {
        helper.startServer(done);
    });

    afterEach(function () {
        helper.unload();
    });

    describe('Node', function () {


        it('simple Node should be loaded', function (done) {

            var flow = [{id: "n1", type: "modbus-read", name: "modbusRead"}];

            helper.load(nodeUnderTest, flow, function () {

                var modbusNode = helper.getNode("n1");
                modbusNode.should.have.property('name', 'modbusRead');

                done();
            }, function () {
                helper.log("function callback");
            });
        });


        /*
         it('should be loaded', function (done) {

         helper.load([nodeUnderTestClient, nodeUnderTest], nodeFlow, function () {

         var modbusNodeClient = helper.getNode("8a55b918.be5988");
         modbusNodeClient.should.have.property('type', 'modbus-client');

         var helperNode = helper.getNode("n2");
         helperNode.should.have.property('type', 'helper');

         var modbusNode = helper.getNode("f2f9d81d.fe7728");
         modbusNode.should.have.property('name', 'modbusWrite');

         done();
         });
         });
         */
    });

    describe('post', function () {

        it('should fail for invalid node', function (done) {
            helper.request().post('/modbus-read/invalid').expect(404).end(done);
        });
    });
});
