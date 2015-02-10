var assert = require("chai").assert;
describe('Array', function(){
    describe('#indexOf()', function(){
        beforeEach(function(){
            console.log("before Each");
        });
        afterEach(function(){
            console.log("after Each");
        });
        it('should return -1 when the value is not present', function(){
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));
        })
    });
    describe('#assert.ok notOk', function(){
        it('#should ok', function(){
            assert.ok(1);
            assert.notOk(0);
        })
    });
})