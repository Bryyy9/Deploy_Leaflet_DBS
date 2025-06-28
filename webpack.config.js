const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // ✨ GitHub Pages configuration
  const isGitHubPages = process.env.GITHUB_PAGES === 'true' || 
                       process.env.GITHUB_ACTIONS === 'true';
  
  // Get repository name from package.json or environment
  const getPublicPath = () => {
    if (isGitHubPages) {
      const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'leaflet-bri-enhanced';
      return `/${repoName}/`;
    }
    return '/';
  };
  
  return {
    entry: './src/scripts/app.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'bundle.[contenthash].js' : 'bundle.js',
      clean: true,
      publicPath: getPublicPath()
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
          minifyURLs: true,
        } : false
      }),
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: './src/public', 
            to: './',
            noErrorOnMissing: true
          },
          // ✨ Copy test files for debugging
          {
            from: './test-notification.html',
            to: 'test-notification.html',
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
    // ✨ Better source maps for debugging
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};