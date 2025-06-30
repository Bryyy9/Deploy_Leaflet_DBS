// .webpack.dev.config.js - Optimized for development
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/scripts/app.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/bundle.js',
    clean: false, // Don't clean in dev mode
    publicPath: '/'
  },
  
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  plugins: [
    new DefinePlugin({
      __BASE_PATH__: JSON.stringify(''),
      __IS_PRODUCTION__: JSON.stringify(false),
      __IS_DEVELOPMENT__: JSON.stringify(true),
      __IS_GITHUB_PAGES__: JSON.stringify(false),
      __PUBLIC_PATH__: JSON.stringify('/'),
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
      __VERSION__: JSON.stringify('1.0.0-dev'),
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      cache: false
    })
  ],
  
  devServer: {
    port: 3000,
    open: false, // Don't auto-open
    hot: false,
    liveReload: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'src/public'),
      publicPath: '/'
    },
    client: {
      logging: 'error',
      overlay: false,
      progress: false
    },
    devMiddleware: {
      writeToDisk: false
    }
  },
  
  resolve: {
    extensions: ['.js', '.json']
  },
  
  cache: {
    type: 'memory'
  },
  
  stats: 'minimal',
  devtool: 'eval-cheap-module-source-map'
};