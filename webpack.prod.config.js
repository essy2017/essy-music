'use strict';

var webpack = require('webpack');
var config  = require('./webpack.config');

for (let i = 0; i < config.length; i++) {
  let cfg = config[i];
  cfg.plugins = cfg.plugins || [];
  cfg.plugins.push(
    new webpack.optimize.UglifyJsPlugin()
  );
}

module.exports = config;
