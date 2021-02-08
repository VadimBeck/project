const { src, dest, task, series, watch, parallel } = require("gulp");
const webpack = require("webpack");
const webpackStream = require("webpack-stream");
const webpackConfig = require("./webpack.config.js");
const rm = require("gulp-rm");
const gulpif = require("gulp-if");
const concat = require("gulp-concat");
const sass = require("gulp-sass");
const sassGlob = require("gulp-sass-glob");
const autoprefixer = require("gulp-autoprefixer");
const px2rem = require("gulp-smile-px2rem");
const gcmq = require("gulp-group-css-media-queries");
const cleanCSS = require("gulp-clean-css");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");
const pug = require("gulp-pug");
const svgo = require("gulp-svgo");
const svgSprite = require("gulp-svg-sprite");
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;

const env = process.env.NODE_ENV;
sass.compiler = require("node-sass");

task("clean", () => {
  return src("dist/**/*", { read: false }).pipe(rm());
});

task("templates", () => {
  return src("./src/templates/pages/*.pug")
    .pipe(pug({
        pretty: "\t",
      })
    )
    .pipe(dest("./dist"))
    .pipe(reload({ stream: true }));
});

const styles = [
  "node_modules/normalize.css/normalize.css",
  "src/styles/main.scss",
];

task("styles", () => {
  return src(styles)
    .pipe(gulpif(env === "dev", sourcemaps.init()))
    .pipe(concat("main.min.scss"))
    .pipe(sassGlob())
    .pipe(sass().on("error", sass.logError))
    .pipe(px2rem())
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(gulpif(env === "prod", gcmq()))
    .pipe(gulpif(env === "prod", cleanCSS()))
    .pipe(gulpif(env === "dev", sourcemaps.write()))
    .pipe(dest("dist"))
    .pipe(reload({ stream: true }));
});

task("scripts", () => {
  return src("./src/js/index.js")
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe(gulpif(env === "prod", uglify()))
    .pipe(dest("dist"))
    .pipe(reload({ stream: true }));
});

task("icons", () => {
  return src("src/img/icons/*svg")
    .pipe(
      svgo({
        plugins: [
          {
            removeAttrs: { attrs: "(fill|stroke|style|width|height|data.*)" },
          },
        ],
      })
    )
    .pipe(
      svgSprite({
        mode: {
          symbol: {
            sprite: "../sprite.svg",
          },
        },
      })
    )
    .pipe(dest("dist/img/icons"));
});

task("server", () => {
  browserSync.init({
    server: {
      baseDir: "./dist",
    },
  });
});

task("watch", () => {
  watch("./src/templates/**/*.pug", series("templates"));
  watch("./src/styles/**/*.scss", series("styles"));
  watch("./src/js/**/*.js", series("scripts"));
  watch("./src/img/icons/*.svg", series("icons"));
});

task(
  "default",
  series(
    "clean",
    parallel("templates", "styles", "scripts", "icons"),
    parallel("watch", "server")
  )
);
task(
  "build",
  series("clean", parallel("templates", "styles", "scripts", "icons"))
);
