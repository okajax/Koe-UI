var gulp = require('gulp');
var browserify = require('browserify');
var riotify = require('riotify');
var source = require('vinyl-source-stream');

gulp.task('build-basic', function () {
  return browserify({
    debug: true,
    entries: ['./js/src/basic.js']
  }).transform([riotify])
    .bundle()
    .pipe(source('koe-ui-basic.js'))
    .pipe(gulp.dest('./js/dist/'));
});
