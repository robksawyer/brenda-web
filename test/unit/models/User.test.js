'use strict';
/**
 * Test File: Testing User
 * File location: test/models/User.test.js
 */


var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('UserModel', function userModel(){

 describe('to have', function(){

    it('attributes', function(done){

        var attributes = User.attributes;
        expect(attributes).to.have.property('username');
        expect(attributes).to.have.property('fullname');
        expect(attributes).to.have.property('email');
        expect(attributes).to.have.property('passports');
        expect(attributes).to.have.property('email_on_render_complete');
        expect(attributes).to.have.property('email_on_instance_idle');

        done();
    });

  });
});