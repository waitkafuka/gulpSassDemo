var gulp = require('gulp'), //基础库
  clean = require('gulp-clean'),//删除文件
  rev = require('gulp-rev'), //给文件添加版本号
  revAll = require('gulp-rev-all'), //给文件添加版本号
  minifyHtml = require('gulp-minify-html'),//压缩html
  uglify = require('gulp-uglify'),//压缩js
  minifyCss = require('gulp-clean-css'),//压缩css
  plumber = require('gulp-plumber'), //错误跳出
  compass = require('gulp-compass'), //编译sass
  useref = require('gulp-useref'),//合并tpl代码片段
  gulpFilter = require('gulp-filter'),
  gulpSequence = require('gulp-sequence'); //顺序执行task

//配置路径
var config = {
    cssUrl: 'dev/assets/css/*.css', //css路径
    scssUrl: 'dev/assets/sass/**/*.scss', //scss路径
    jsUrl: 'dev/assets/common/*.js', //js路径
    imagesUrl: 'dev/assets/img/*.{png,jpg}', //图片路径
    htmlUrl: 'dev/static/**/*.html' //html路径
  },
  jsFilter = gulpFilter('**/*.js', {
    restore: true
  }),
  htmlFilter = gulpFilter('**/*.html', {
    restore: true
  }),
  cssFilter = gulpFilter('**/*.css', {
    restore: true
  });

// compass编译scss
gulp.task('compass', function() {
  return gulp.src(config.scssUrl)
    .pipe(plumber({
      errorHandler: function(error) {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(compass({
      config_file: 'config.rb',
      css: 'dev/assets/css',
      sass: 'dev/assets/sass',
      images: 'dev/assets/img'
    }))
    .pipe(gulp.dest('dev/assets/css'));
});

//压缩代码，并将全部代码copy至dist目录
gulp.task('compress', function() {
  return gulp.src(['dev/**/*', '!dev/static/**/*', '!dev/**/*.txt'])
    .pipe(jsFilter) //获得js
    .pipe(uglify()) //压缩js
    .pipe(jsFilter.restore) //存储压缩后js
    .pipe(cssFilter) //获取css
    .pipe(minifyCss()) //压缩css
    .pipe(cssFilter.restore) //存储压缩后css
    .pipe(htmlFilter) //获取html
    .pipe(minifyHtml({
      spare: true,
      empty: true
    })) //压缩html
    .pipe(htmlFilter.restore) //存储压缩后html
    .pipe(gulp.dest('dist/'));
});

//为所有静态资源添加版本号
gulp.task('revall', function() {
  return gulp.src([
      'dev/assets/**/*',
      'dev/module/**/*.+(html|js)',
      'dev/static/**/*.+(html|js)',
      'dev/js/**/*.js',
      'dev/tpl/res/*.tpl',
      '!dev/assets/sass/**/*.scss'
    ])
    .pipe(revAll.revision({
      dontRenameFile:['html']
    }))
    .pipe(gulp.dest('dist/'))
    .pipe(revAll.manifestFile())
    .pipe(gulp.dest('dist/'))
    .pipe(revAll.versionFile())
    .pipe(gulp.dest('dist/'));
});

// 监听scss文件 
gulp.task('dev', function() {
  gulp.watch([config.scssUrl, 'config.rb'], ['compass']); // 监听所有.scss文件监听confirg.rb
});

//最终发布执行的任务，gulpSequence()内的任务按顺序执行
gulp.task('default', gulpSequence('compass','revall','compress'));

/*
    开发时执行的任务，gulpSequence()内的任务按顺序执行
    开发调试使用，只是单纯的include引用资源，不做压缩合并，不加版本号
*/
gulp.task('develop', ['revall']);
