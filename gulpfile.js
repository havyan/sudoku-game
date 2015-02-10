var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var gutil = require('gulp-util');

// 语法检查
gulp.task('jshint', function () {
    return gulp.src('src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// 测试
gulp.task('test', function () {
    return gulp.src(['src/test/*.js', 'src/test/*/*.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec'
        }))
        .on('error', gutil.log);
});

// 注册缺省任务
gulp.task('default', ['jshint', 'test']);