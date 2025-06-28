// webpack.config.js - Fixed Environment Variables
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // ✨ GitHub Pages configuration
  const isGitHubPages = process.env.GITHUB_PAGES === 'true' || 
                       process.env.GITHUB_ACTIONS === 'true';
  
  // Get repository name from environment
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
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[hash][ext]'
          }
        }
      ]
    },
    
    plugins: [
      // ✅ FIXED: Define global variables with proper fallbacks
      new DefinePlugin({
        __BASE_PATH__: JSON.stringify(basePath),
        __IS_PRODUCTION__: JSON.stringify(isProduction),
        __IS_GITHUB_PAGES__: JSON.stringify(isGitHubPages),
        __PUBLIC_PATH__: JSON.stringify(publicPath),
        __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
        __VERSION__: JSON.stringify('1.0.0'),
        // ✅ FIXED: Add process.env fallback for browser
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.VAPID_PUBLIC_KEY': JSON.stringify(process.env.VAPID_PUBLIC_KEY || null)
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
      
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: './src/public', 
            to: './',
            noErrorOnMissing: true
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
    
    // ✅ FIXED: Add resolve fallbacks for Node.js modules
    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@scripts': path.resolve(__dirname, 'src/scripts'),
        '@presenters': path.resolve(__dirname, 'src/scripts/presenters'),
        '@views': path.resolve(__dirname, 'src/scripts/views'),
        '@data': path.resolve(__dirname, 'src/scripts/data'),
        '@utils': path.resolve(__dirname, 'src/scripts/utils')
      },
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
      headers: {
        'Service-Worker-Allowed': '/'
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