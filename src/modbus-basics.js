/**

 The BSD 3-Clause License

 Copyright (c) 2016, Klaus Landsdorf (http://bianco-royal.de/)
 All rights reserved.
 node-red-contrib-modbus

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

'use strict';

module.exports.statusLog = false;

module.exports.get_timeUnit_name = function (unit) {

    var unitAbbreviation = '';

    switch (unit) {
        case "ms":
            unitAbbreviation = 'msec.';
            break;
        case "s":
            unitAbbreviation = 'sec.';
            break;
        case "m":
            unitAbbreviation = 'min.';
            break;
        case "h":
            unitAbbreviation = 'h.';
            break;
        default:
            break;
    }

    return unitAbbreviation;
};

module.exports.calc_rateByUnit = function (rate, rateUnit) {

    switch (rateUnit) {
        case "ms":
            break;
        case "s":
            rate = rate * 1000; // seconds
            break;
        case "m":
            rate = rate * 60000; // minutes
            break;
        case "h":
            rate = rate * 3600000; // hours
            break;
        default:
            rate = 10000; // 10 sec.
            break;
    }

    return rate;
};


module.exports.set_node_status_properties = function (statusValue) {

    var fillValue = "red";
    var shapeValue = "dot";

    switch (statusValue) {

        case "connecting":
        case "connected":
        case "initialized":
            fillValue = "green";
            shapeValue = "ring";
            break;

        case "active":
        case "active reading":
        case "active writing":
            fillValue = "green";
            shapeValue = "dot";
            break;

        case "disconnected":
        case "terminated":
            fillValue = "red";
            shapeValue = "ring";
            break;

        case "polling":
            fillValue = "yellow";
            shapeValue = "dot";
            break;

        default:
            if (!statusValue || statusValue == "waiting") {
                fillValue = "blue";
                statusValue = "waiting ...";
            }
            break;
    }

    return { fill: fillValue, shape: shapeValue, status: statusValue  };
};