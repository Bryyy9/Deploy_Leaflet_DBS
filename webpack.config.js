// webpack.config.js - UPDATE
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isGitHubPages = process.env.GITHUB_PAGES === 'true' || 
                       process.env.GITHUB_ACTIONS === 'true';
  
  const getPublicPath = () => {
    if (isGitHubPages && process.env.GITHUB_REPOSITORY) {
      const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
      return `/${repoName}/`;
    }
    return '/';
  };
  
  const publicPath = getPublicPath();
  const basePath = isGitHubPages ? publicPath.slice(0, -1) : '';
  
  console.log('🔧 Webpack Config:', {
    isProduction,
    isGitHubPages,
    publicPath,
    basePath,
    repository: process.env.GITHUB_REPOSITORY
  });
  
  return {
    entry: './src/scripts/app.js',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/bundle.[contenthash].js' : 'js/bundle.js',
      clean: true,
      publicPath: publicPath
    },
    
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[hash][ext]'
          }
        }
      ]
    },
    
    plugins: [
      new DefinePlugin({
        __BASE_PATH__: JSON.stringify(basePath),
        __IS_PRODUCTION__: JSON.stringify(isProduction),
        __IS_GITHUB_PAGES__: JSON.stringify(isGitHubPages),
        __PUBLIC_PATH__: JSON.stringify(publicPath),
        __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
        __VERSION__: JSON.stringify('1.0.0'),
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
      }),
      
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      }),
      
      // ✅ FIXED: Pastikan service worker di-copy dengan benar
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: './src/public', 
            to: './',
            noErrorOnMissing: true
          },
          // ✅ TAMBAH: Copy service worker eksplisit
          {
            from: './src/public/service-worker.js',
            to: 'service-worker.js',
            noErrorOnMissing: false
          },
          {
            from: './test-notification.html',
            to: 'test-notification.html',
            noErrorOnMissing: true
          },
          {
            from: './.nojekyll',
            to: '.nojekyll',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    
    resolve: {
      extensions: ['.js', '.json'],
      fallback: {
        "process": false,
        "buffer": false,
        "util": false,
        "path": false,
        "fs": false
      }
    },
    
    devServer: {
      port: 3000,
      open: true,
      hot: true,
      historyApiFallback: {
        index: '/index.html'
      },
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      // ✅ TAMBAH: Headers untuk Service Worker
      headers: {
        'Service-Worker-Allowed': '/',
        'Access-Control-Allow-Origin': '*'
      }
    },
    
    optimization: {
      splitChunks: isProduction ? {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      } : false,
      minimize: isProduction
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    mode: isProduction ? 'production' : 'development'
  };
};