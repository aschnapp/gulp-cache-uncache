const through = require('through2');

const caches = {};

const cache = function(name) {
  if (!caches[name]) {
    caches[name] = {};
  }
  caches[name].prev = caches[name].next;
  caches[name].next = new Map();
  return through.obj(function(file, _enc, callback){
    if (!file) return callback();
    // saves file to next
    caches[name].next.set(file.path, {
      original: file.contents,
      processed: caches[name].prev 
        ? caches[name].prev.get(file.path) 
          ? caches[name].prev.get(file.path).processed 
          : undefined 
        : undefined
    });
    this.push(file);
    return callback();
  });
};

const compare = function(name) {
  return through.obj(function(file, _enc, callback){
    let contents = file.checksum;
    if (!contents) {
      if (file.isStream()) {
        this.push(file);
        return callback();
      }
      if (file.isBuffer()) {
        contents = file.contents.toString('utf8');
      }
    }
    let cacheFile = undefined;
    if (caches[name].prev) {
      cacheFile = caches[name].prev.get(file.path);
      if (cacheFile && cacheFile.original) {
        cacheFile = cacheFile.original.toString('utf8');
      }
    }
    // hit - ignore it
    if (typeof cacheFile !== 'undefined' && cacheFile === contents) return callback();
    // miss - add it and pass it through
    this.push(file);
    return callback();
  });
};

const uncache = function(name) {
  return through.obj(function(file, _enc, callback) {
    caches[name].next.set(file.path, {
      original: caches[name].next.get(file.path).original,
      processed: file
    });
    //if building for the first time, pass everything through
    if (!caches[name].prev) {
      this.push(file);
      return callback();
    }
    //bundled once already, loop through all cached file buffers and pass through
    for (let i of caches[name].next) {
      this.push(i[1].processed);
    }
    return callback();
  });
};

const remove = function(name, filePath) {
  if (caches[name]) {
    if (caches[name].next)
      caches[name].next.delete(filePath);
    if (caches[name].prev)
      caches[name].prev.delete(filePath);
  }
};

module.exports = { cache, compare, uncache, remove, caches };
