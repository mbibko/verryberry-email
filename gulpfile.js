const gulp = require("gulp");
const gulpSass = require("gulp-sass")(require("sass"));
const browserSync = require("browser-sync").create();
const nunjucksRender = require("gulp-nunjucks-render");
const gulpInlineCss = require("gulp-inline-css");
const sendmail = require("gulp-mailgun");
const through2 = require("through2");

const AttributeRemover = require("html-attributes-remover").default;
const attributeRemover = new AttributeRemover({
  htmlTags: ["div", "table", "td", "span", "h1", "p", "img", "a", "b", "i"],
  attributes: ["class"],
});

function reload(cb) {
  browserSync.reload();
  cb();
}

function html() {
  return gulp
    .src("app/html/*.html")
    .pipe(
      nunjucksRender({
        path: ["app/html/layouts"], // String or Array
      })
    )
    .pipe(gulp.dest("build"));
}

function images() {
  return gulp
    .src("app/images/**/*.{png,jpg,jpeg,gif,svg}", { encoding: false })
    .pipe(gulp.dest("build/images"));
}

function sass() {
  return gulp
    .src("app/scss/main.scss")
    .pipe(gulpSass())
    .pipe(gulp.dest("build"))
    .pipe(browserSync.stream());
}

function inlinecss() {
  return gulp
    .src("build/*.html")
    .pipe(gulpInlineCss())
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          const code = attributeRemover.remove(file.contents.toString());
          file.contents = Buffer.from(code);
        }
        cb(null, file);
      })
    )
    .pipe(gulp.dest("build"));
}

function serve(cb) {
  browserSync.init({
    notify: false,
    open: false,
    server: {
      baseDir: ["build"],
    },
  });
  cb();
}

function watch(cb) {
  gulp.watch("app/images/**/*.*", gulp.series(images, reload));
  gulp.watch("app/scss/**/*.scss", sass);
  gulp.watch("app/html/**/*.html", gulp.series(html, reload));
  cb();
}

function postBuildTask(cb) {
  inlinecss();
  cb();
}

gulp.task("sendmail", () => {
  return gulp
    .src(["build/payment-notification.html"]) // Modify this to select the HTML file(s)
    .pipe(
      sendmail({
        key: "key-c9370f6109ccb5fa6223fd4f673e36c4", // Enter your Mailgun API key here
        sender:
          "postmaster@sandboxa7c0607c0d9d40abb5c50ca20018e3b1.mailgun.org",
        recipient: "mbibko@gmail.com",
        subject: "babymarket mail",
      })
    );
});

gulp.task("default", gulp.parallel(watch, serve));
gulp.task(
  "build",
  gulp.series(gulp.parallel(html, images, sass), postBuildTask)
);
