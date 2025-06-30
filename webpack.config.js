// webpack.config.js - FIXED VERSION
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;
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
    isDevelopment,
    isGitHubPages,
    publicPath,
    basePath
  });
  
  return {
    entry: './src/scripts/app.js',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      // ✅ FIX: Different filenames for different modes
      filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
      clean: true,
      publicPath: publicPath,
      pathinfo: isDevelopment
    },
    
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDevelopment
              }
            }
          ]
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
        __IS_DEVELOPMENT__: JSON.stringify(isDevelopment),
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
        } : false,
        cache: isProduction
      }),
      
      // ✅ FIX: Conditional copying
      ...(isProduction ? [
        new CopyWebpackPlugin({
          patterns: [
            {
              from: './src/public/service-worker.js',
              to: 'service-worker.js',
              noErrorOnMissing: false
            },
            {
              from: './src/public/manifest.json',
              to: 'manifest.json',
              noErrorOnMissing: false
            },
            {
              from: './src/public',
              to: './',
              noErrorOnMissing: true,
              globOptions: {
                ignore: ['**/service-worker.js', '**/manifest.json']
              }
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
      ] : [
        new CopyWebpackPlugin({
          patterns: [
            {
              from: './src/public/service-worker.js',
              to: 'service-worker.js',
              noErrorOnMissing: false
            },
            {
              from: './src/public/manifest.json',
              to: 'manifest.json',
              noErrorOnMissing: false
            },
            {
              from: './src/public/*.png',
              to: '[name][ext]',
              noErrorOnMissing: true
            }
          ]
        })
      ])
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
      hot: false,
      liveReload: true,
      watchFiles: {
        paths: ['src/**/*'],
        options: {
          usePolling: false,
          interval: 1000,
          ignored: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.git/**'
          ]
        }
      },
      historyApiFallback: {
        index: '/index.html',
        disableDotRule: true
      },
      static: {
        directory: path.join(__dirname, 'dist'),
        watch: {
          ignored: ['**/node_modules/**', '**/dist/**']
        }
      },
      compress: true,
      headers: {
        'Service-Worker-Allowed': '/',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      client: {
        logging: 'warn',
        overlay: {
          errors: true,
          warnings: false
        },
        progress: false,
        reconnect: 3
      },
      devMiddleware: {
        writeToDisk: (filePath) => {
          return /service-worker\.js$|manifest\.json$/.test(filePath);
        }
      }
    },
    
    cache: isDevelopment ? {
      type: 'memory'
    } : false,
    
    optimization: {
      // ✅ FIX: Simplified optimization for development
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
      minimize: isProduction,
      // ✅ FIX: No runtime chunk in development to avoid conflicts
      runtimeChunk: false
    },
    
    stats: isDevelopment ? 'minimal' : 'normal',
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    mode: isProduction ? 'production' : 'development'
  };
};