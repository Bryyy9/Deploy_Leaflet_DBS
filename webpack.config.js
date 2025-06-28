// webpack.config.js - Simplified Version
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
  
  console.log('🔧 Webpack Config:', {
    isProduction,
    isGitHubPages,
    publicPath,
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
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
        templateParameters: {
          BASE_PATH: isGitHubPages ? publicPath.slice(0, -1) : '',
          IS_PRODUCTION: isProduction,
          PUBLIC_PATH: publicPath
        },
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
    
    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@scripts': path.resolve(__dirname, 'src/scripts'),
        '@presenters': path.resolve(__dirname, 'src/scripts/presenters'),
        '@views': path.resolve(__dirname, 'src/scripts/views'),
        '@data': path.resolve(__dirname, 'src/scripts/data'),
        '@utils': path.resolve(__dirname, 'src/scripts/utils')
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