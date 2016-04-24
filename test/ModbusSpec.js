/**

 The BSD 3-Clause License

 Copyright (c) 2016, Klaus Landsdorf (http://bianco-royal.de/)
 All rights reserved.

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


describe("jasmine.arrayContaining", function () {
    var foo;

    beforeEach(function () {
        foo = [1, 2, 3, 4];
    });

    it("matches arrays with some of the values", function () {
        expect(foo).toEqual(jasmine.arrayContaining([3, 1]));
        expect(foo).not.toEqual(jasmine.arrayContaining([6]));
    });

    describe("when used with a spy", function () {
        it("is useful when comparing arguments", function () {
            var callback = jasmine.createSpy('callback');

            callback([1, 2, 3, 4]);

            expect(callback).toHaveBeenCalledWith(jasmine.arrayContaining([4, 2, 3]));
            expect(callback).not.toHaveBeenCalledWith(jasmine.arrayContaining([5, 2]));
        });
    });
});


describe("jasmine.any", function () {
    it("matches any value", function () {
        expect({}).toEqual(jasmine.any(Object));
        expect(12).toEqual(jasmine.any(Number));
    });

    describe("when used with a spy", function () {
        it("is useful for comparing arguments", function () {
            var foo = jasmine.createSpy('foo');
            foo(12, function () {
                return true;
            });

            expect(foo).toHaveBeenCalledWith(jasmine.any(Number), jasmine.any(Function));
        });
    });
});