var gulp = require( 'gulp' );
var promises = require('any-promise/register')('bluebird')
var typings = require('typings-core');

gulp.task( 'typings', function( callback ) {
    var options = {
        cwd: process.cwd()
    };
    
    return typings.install( options ).then( function( tree ) {
        console.log( 'Typings installed successfully.' );
    }, function( err ) {
        console.log('Typings failed with error: ', err.cause );       
    });
});
