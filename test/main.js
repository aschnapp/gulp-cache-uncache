var { cache, compare, uncache, remove, caches } = require('../');
var File = require('vinyl');
var through = require('through2');
var PassThrough = require('stream').PassThrough;
const { expect } = require('chai');
require('mocha');

describe('gulp-cache-uncache', function() {
  describe('cache', function() {
    it('should cache files', function(done) {
      const file = new File({
        path: '/home/file.js',
        contents: new Buffer('cache')
      });
      const stream = cache('0');
      stream.on('data', function(nfile) {
        const contents = caches['0'].next.get(nfile.path).original.toString();
        expect(contents.toString()).to.equal(file.contents.toString());
        done();
      });
      stream.write(file);
      stream.end();
    });
    it('should move next cache to prev cache', function(done) {
      const file = new File({
        path: '/home/file.js',
        contents: new Buffer('cache')
      });
      const stream = cache('1');
      stream.on('data', function() {
        expect(caches['1'].prev).to.equal(undefined);
      });
      stream.on('end', function() {
        const temp = new Map(caches['1'].next);
        cache('1');
        expect(caches['1'].prev).deep.equal(temp);
        done();
      });
      stream.write(file);
      stream.end();
    });
  });

  describe('compare', function() {
    it('should create a cache that only allows a file through once', function(done) {
      var file = new File({
        path: '/home/file.js',
        contents: new Buffer('cache')
      });
      var stream = compare('2');
      stream.on('data', function(nfile) {
        expect(nfile.path).to.equal(file.path);
        expect(nfile.contents.toString()).to.equal(file.contents.toString());
      });
      stream.on('end', function() {
        done();
      });
      var cacheStream = cache('2');
      cacheStream.write(file);
      stream.write(file);
      stream.write(file);
      stream.write(file);
      stream.write(file);
      stream.write(file);
      stream.end();
    });
  
    it('should create separate caches that only allow a file through once each', function(done) {
      var file = new File({
        path: '/home/file.js',
        contents: new Buffer('cache')
      });
      var file1 = new File({
        path: '/home/file.js',
        contents: new Buffer('cache1')
      });
      var stream = compare('test0');
      var stream1 = compare('test1');
      stream.on('data', function(nfile){
        expect(nfile.path).to.equal(file.path);
        expect(nfile.contents.toString()).to.equal(file.contents.toString());
        // done();
      });
      stream1.on('data', function(nfile1){
        expect(nfile1.path).to.equal(file1.path);
        expect(nfile1.contents.toString()).to.equal(file1.contents.toString());
        // done();
      });
      stream1.on('end', function() {
        done();
      });
      const cacheStream = cache('test0');
      cacheStream.write(file);
      stream.write(file);
      stream.write(file);
      stream.end();

      const cacheStream1 = cache('test1');
      cacheStream1.write(file1);
      stream1.write(file1);
      stream1.write(file1);
      stream1.end();
    });
  
    it('should create a cache that allows a stream file through always', function(done) {
      const file = new File({
        path: '/home/file.js',
        contents: through()
      });
      const cacheStream = cache('4');
      const stream = compare('4');
      let count = 0;
      stream.on('data', function(nfile){
        count++;
        expect(nfile.path).to.equal(file.path);
      });
      stream.on('end', function(){
        expect(count).to.equal(5);
        done();
      });
      cacheStream.write(file);
      stream.write(file);
      cacheStream.write(file);
      stream.write(file);
      cacheStream.write(file);
      stream.write(file);
      cacheStream.write(file);
      stream.write(file);
      cacheStream.write(file);
      stream.write(file);
      stream.end();
    });
  
    it('should create a cache that allows a stream file through always', function(done) {
      const file = new File({
        path: '/home/file.js',
        contents: PassThrough()
      });
      const cacheStream = cache('5');
      const stream = compare('5');
      let count = 0;
      stream.on('data', function(nfile){
        count++;
        expect(nfile.path).to.equal(file.path);
      });
      stream.on('end', function(){
        expect(count).to.equal(5);
        done();
      });
      cacheStream.write(file);
      stream.write(file);
      cacheStream.write(file);
      stream.write(file);
      cacheStream.write(file);
      stream.write(file);
      cacheStream.write(file);
      stream.write(file);
      cacheStream.write(file);
      stream.write(file);
      stream.end();
    });
  });
  describe('uncache', function(done) {
    it('should pass through all files from cache when called for first time', () => {
      const file = new File({
        path: '/home/file.js',
        contents: new Buffer('cache')
      });
      const file1 = new File({
        path: '/home/file1.js',
        contents: new Buffer('cache1')
      });
      let streamcount = 0;
      let uccount = 0;
      const cstream = cache('6');
      const stream = compare('6');
      const ucstream = uncache('6');
      stream.on('data', function() {
        streamcount++;
      });
      ucstream.on('data', function() {
        uccount++;
      });
      ucstream.on('end', function() {
        expect(uccount).to.equal(streamcount);
        done();
      });
      cstream.write(file);
      stream.write(file);
      ucstream.write(file);
      cstream.write(file1);
      stream.write(file1);
      ucstream.write(file1);
      stream.end();
      ucstream.end();
    });
    it('should release all files from cache when called for second time', () => {
      const file = new File({
        path: '/home/file.js',
        contents: new Buffer('cache')
      });
      const file1 = new File({
        path: '/home/file1.js',
        contents: new Buffer('cache1')
      });
      let streamcount = 0;
      let uccount = 0;
      const cstream = cache('7');
      const stream = compare('7');
      const ucstream = uncache('7');
      cstream.write(file);
      stream.write(file);
      ucstream.write(file);
      cstream.write(file1);
      stream.write(file1);
      ucstream.write(file1);
      stream.on('data', function() {
        streamcount++;
      });
      ucstream.on('data', function() {
        uccount++;
      });
      ucstream.on('end', function() {
        expect(uccount).to.equal(streamcount - 1);
        done();
      });
      cstream.write(file);
      stream.write(file);
      ucstream.write(file);
      stream.end();
      ucstream.end();
    });
  });
  describe('remove', function() {
    it('should remove file from cache', function(done) {
      const file = new File({
        path: '/home/file.js',
        contents: new Buffer('cache')
      });
      const file1 = new File({
        path: '/home/file1.js',
        contents: new Buffer('cache')
      });
      const cstream = cache('8');
      cstream.on('data', function() {
        expect(caches['8'].next.has(file.path)).to.equal(true);
      });
      cstream.on('end', function() {
        cache('8');
        remove('8', file.path);
        expect(caches['8'].next.has(file.path)).to.equal(false);
        expect(caches['8'].prev.has(file.path)).to.equal(false);
        done();
      });
      cstream.write(file);
      cstream.write(file1);
      cstream.end();
    });
  });
});
