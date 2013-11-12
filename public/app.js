window.app = angular.module('thanxbits', []);

var el = function(x) { return document.getElementById(x); }
var qs = function(x) { return document.querySelectorAll(x); }

var errhandle = function(r) { console.log("Error",r); }
