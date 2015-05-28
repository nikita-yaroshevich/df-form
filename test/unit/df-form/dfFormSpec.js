'use strict';

describe('', function() {

  var module;
  var dependencies;
  dependencies = [];

  var hasModule = function(module) {
  return dependencies.indexOf(module) >= 0;
  };

  beforeEach(function() {

  // Get module
  module = angular.module('df.form');
  dependencies = module.requires;
  });

  it('should load config module', function() {
    expect(hasModule('df.form.config')).to.be.ok;
  });

  

  
  it('should load directives module', function() {
    expect(hasModule('df.form.directive')).to.be.ok;
  });
  

  
  it('should load services module', function() {
    expect(hasModule('df.form.service')).to.be.ok;
  });
  

});