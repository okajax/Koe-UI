var gulp = require('gulp');
var plumber = require('gulp-plumber');
var browserify = require('browserify');


gulp.task('build', function () {
    gulp.src(['./js/src/_koeUIcore.js'])
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(browserify())
        .pipe(gulp.dest('./js/dist'))
});
