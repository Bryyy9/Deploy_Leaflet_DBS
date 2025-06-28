// webpack.config.js - Auto create .nojekyll
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');
const fs = require('fs');

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

  // ✅ CUSTOM PLUGIN: Create .nojekyll file
  class CreateNoJekyllPlugin {
    apply(compiler) {
      compiler.hooks.afterEmit.tapAsync('CreateNoJekyllPlugin', (compilation, callback) => {
        const outputPath = compiler.options.output.path;
        const nojekyllPath = path.join(outputPath, '.nojekyll');
        
        // Create .nojekyll file
        fs.writeFile(nojekyllPath, '', (err) => {
          if (err) {
            console.warn('⚠️ Failed to create .nojekyll:', err.message);
          } else {
            console.log('✅ Created .nojekyll file');
          }
          callback();
        });
      });
    }
  }
  
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
      // ✨ Define global variables
      new DefinePlugin({
        __BASE_PATH__: JSON.stringify(basePath),
        __IS_PRODUCTION__: JSON.stringify(isProduction),
        __IS_GITHUB_PAGES__: JSON.stringify(isGitHubPages),
        __PUBLIC_PATH__: JSON.stringify(publicPath),
        __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
        __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
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
          }
        ]
      }),

      // ✅ ADD: Custom plugin to create .nojekyll
      ...(isGitHubPages ? [new CreateNoJekyllPlugin()] : [])
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