/**
 * Test File: Testing UserController
 * File location: test/controllers/UserController.test.js
 */
'use strict';

var DataService = require('../../../api/services/DataService');
var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('UserController', function(){

  describe('Model', function(){
    it('should have attributes', function(done){
      User.findOne()
        .where({id: 1})
        .populate('passports')
        .then(function(res){

            res = res.toJSON();

            expect(res).to.have.property('id');
            expect(res).to.have.property('username');
            expect(res).to.have.property('fullname');
            expect(res).to.have.property('email');
            expect(res).to.have.property('passports');
            expect(res).to.have.property('email_on_render_complete');
            expect(res).to.have.property('email_on_instance_idle');

            done();
        })
        .catch(done);

    });
  });

});
