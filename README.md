# gulp-cache-uncache

Gulp plugin for in memory file caching. Works with concat and preserves file order.

Please check github for the latest version of the readme.

## Installation

```yarn add gulp-cache-uncache --dev```

or 

```npm install --save-dev gulp-cache-uncache```

## Usage

### cache(cacheName)

initializes and caches all original files in the order that comes in

### compare(cacheName)

compares cached files with new changes. Only releases changed files downstream

### uncache(cacheName)

Releases all cached files that have been processed at this point downstream in correct order

### remove(cacheName, absolutePath)

Removes file from cache

### [deprecated (v0.0.2)] postCache(cacheName)

Postprocessing for gulp-cache-uncache. See [index.js](./index.js) for more information

## Example 1 (gulp 3.9.1):

```javascript
const gulp = require('gulp');
const { cache, compare, uncache, remove } = require('gulp-cache-uncache');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

gulp.task('preBundle', () => {
  return gulp.src('src/*')
    .pipe(cache('src')); //caches all files in order
});

gulp.task('bundle', [ 'preBundle' ], () => {
  return gulp.src('src/*')
    .pipe(compare('src')) //compares cached files and only releases changed files
    .pipe(uglify())
    .pipe(uncache('src')) //releases all uglified files in order specified in `cache`
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch' ,() => {
  const watcher = gulp.watch('src/*', ['bundle']);
  watcher.on('change', function (event) {
    if (event.type === 'deleted') {
      remove('src', event.path); //remove file from cache
    }
  });
});

gulp.task('default', ['watch']);
```

## Example 2 (gulp 4.0.0):

```javascript
const gulp = require('gulp');
const { cache, compare, uncache, remove } = require('gulp-cache-uncache');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

gulp.task('preBundle', () => {
  return gulp.src('src/*')
    .pipe(cache('src')); //caches all files in order
});

gulp.task('bundle', () => {
  return gulp.src('src/*')
    .pipe(compare('src')) //compares cached files and only releases changed files
    .pipe(uglify())
    .pipe(uncache('src')) //releases all uglified files in order specified in `cache`
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', () => {
  const watcher = gulp.watch('src/*', gulp.series('preBundle', 'bundle'));
  watcher.on('unlink', function (path) {
    remove('src', path); //remove file from cache
  });
});
```
