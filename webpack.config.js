// webpack.config.js - Complete Configuration for StoryMaps Enhanced
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = argv.mode === 'development';
  
  // ✨ Environment Detection
  const isGitHubPages = process.env.GITHUB_PAGES === 'true' || 
                       process.env.GITHUB_ACTIONS === 'true' ||
                       process.env.CI === 'true';
  
  const isNetlify = process.env.NETLIFY === 'true';
  const isVercel = process.env.VERCEL === '1';
  
  // ✨ Dynamic Public Path Configuration
  const getPublicPath = () => {
    // GitHub Pages
    if (isGitHubPages && process.env.GITHUB_REPOSITORY) {
      const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
      const basePath = `/${repoName}/`;
      console.log('🌐 GitHub Pages detected, using base path:', basePath);
      return basePath;
    }
    
    // Netlify
    if (isNetlify) {
      console.log('🌐 Netlify detected, using root path');
      return '/';
    }
    
    // Vercel
    if (isVercel) {
      console.log('🌐 Vercel detected, using root path');
      return '/';
    }
    
    // Local development or other hosting
    console.log('🌐 Using default root path');
    return '/';
  };
  
  const publicPath = getPublicPath();
  
  // ✨ Build Information
  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: isProduction ? 'production' : 'development',
    publicPath: publicPath,
    isGitHubPages: isGitHubPages,
    repository: process.env.GITHUB_REPOSITORY || 'local',
    commit: process.env.GITHUB_SHA?.substring(0, 7) || 'unknown',
    branch: process.env.GITHUB_REF_NAME || 'local'
  };
  
  console.log('🔧 Webpack Build Configuration:', buildInfo);
  
  return {
    // ✨ Entry Point
    entry: {
      main: './src/scripts/app.js'
    },
    
    // ✨ Output Configuration
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction 
        ? 'js/[name].[contenthash:8].js'
        : 'js/[name].js',
      chunkFilename: isProduction 
        ? 'js/[name].[contenthash:8].chunk.js'
        : 'js/[name].chunk.js',
      assetModuleFilename: 'assets/[name].[hash:8][ext]',
      clean: true,
      publicPath: publicPath,
      pathinfo: isDevelopment,
      // ✨ Cross-origin loading
      crossOriginLoading: 'anonymous'
    },
    
    // ✨ Module Rules
    module: {
      rules: [
        // ✨ JavaScript/ES6+ Processing
        {
          test: /\.(js|mjs)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not ie <= 8']
                  },
                  modules: false,
                  useBuiltIns: 'usage',
                  corejs: 3
                }]
              ],
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-proposal-class-properties'
              ],
              cacheDirectory: true
            }
          }
        },
        
        // ✨ CSS Processing
        {
          test: /\.css$/i,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: isDevelopment
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['autoprefixer', {}],
                    ...(isProduction ? [['cssnano', { preset: 'default' }]] : [])
                  ]
                },
                sourceMap: isDevelopment
              }
            }
          ]
        },
        
        // ✨ SCSS/SASS Processing
        {
          test: /\.(scss|sass)$/i,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 2,
                sourceMap: isDevelopment
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['autoprefixer', {}],
                    ...(isProduction ? [['cssnano', { preset: 'default' }]] : [])
                  ]
                },
                sourceMap: isDevelopment
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: isDevelopment
              }
            }
          ]
        },
        
        // ✨ Image Processing
        {
          test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024 // 8kb
            }
          },
          generator: {
            filename: 'assets/images/[name].[hash:8][ext]'
          }
        },
        
        // ✨ Font Processing
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[hash:8][ext]'
          }
        },
        
        // ✨ Audio/Video Processing
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/media/[name].[hash:8][ext]'
          }
        },
        
        // ✨ Document Processing
        {
          test: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/documents/[name].[hash:8][ext]'
          }
        },
        
        // ✨ Raw Text Files
        {
          test: /\.(txt|md)$/i,
          type: 'asset/source'
        }
      ]
    },
    
    // ✨ Plugins Configuration
    plugins: [
      // ✨ HTML Generation
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
        scriptLoading: 'defer',
        templateParameters: {
          BASE_PATH: isGitHubPages ? publicPath.slice(0, -1) : '',
          BUILD_INFO: buildInfo,
          IS_PRODUCTION: isProduction,
          IS_DEVELOPMENT: isDevelopment,
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
          minifyURLs: true,
          removeScriptTypeAttributes: true
        } : false,
        meta: {
          viewport: 'width=device-width, initial-scale=1.0, shrink-to-fit=no',
          'theme-color': '#00d4ff',
          'apple-mobile-web-app-capable': 'yes',
          'apple-mobile-web-app-status-bar-style': 'black-translucent',
          'apple-mobile-web-app-title': 'StoryMaps',
          'msapplication-TileColor': '#00d4ff',
          'msapplication-config': 'browserconfig.xml'
        }
      }),
      
      // ✨ File Copying
      new CopyWebpackPlugin({
        patterns: [
          // ✨ Public Assets
          { 
            from: './src/public', 
            to: './',
            noErrorOnMissing: true,
            globOptions: {
              ignore: ['**/.DS_Store', '**/Thumbs.db']
            }
          },
          
          // ✨ Debug and Test Files
          {
            from: './test-notification.html',
            to: 'test-notification.html',
            noErrorOnMissing: true
          },
          
          // ✨ Jekyll Disable File
          {
            from: './.nojekyll',
            to: '.nojekyll',
            noErrorOnMissing: true
          },
          
          // ✨ Robots.txt
          {
            from: './robots.txt',
            to: 'robots.txt',
            noErrorOnMissing: true
          },
          
          // ✨ Sitemap
          {
            from: './sitemap.xml',
            to: 'sitemap.xml',
            noErrorOnMissing: true
          },
          
          // ✨ Favicon Files
          {
            from: './favicon.ico',
            to: 'favicon.ico',
            noErrorOnMissing: true
          },
          
          // ✨ Browser Config
          {
            from: './browserconfig.xml',
            to: 'browserconfig.xml',
            noErrorOnMissing: true
          }
        ]
      }),
      
      // ✨ Environment Variables
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.PUBLIC_PATH': JSON.stringify(publicPath),
        'process.env.BUILD_INFO': JSON.stringify(buildInfo),
        '__IS_PRODUCTION__': JSON.stringify(isProduction),
        '__IS_DEVELOPMENT__': JSON.stringify(isDevelopment),
        '__IS_GITHUB_PAGES__': JSON.stringify(isGitHubPages),
        '__BASE_PATH__': JSON.stringify(isGitHubPages ? publicPath.slice(0, -1) : ''),
        '__BUILD_TIMESTAMP__': JSON.stringify(buildInfo.timestamp),
        '__VERSION__': JSON.stringify(buildInfo.version)
      })
    ],
    
    // ✨ Development Server Configuration
    devServer: {
      port: 3000,
      host: 'localhost',
      open: true,
      hot: true,
      liveReload: true,
      historyApiFallback: {
        index: '/index.html',
        disableDotRule: true
      },
      static: [
        {
          directory: path.join(__dirname, 'dist'),
          publicPath: '/'
        },
        {
          directory: path.join(__dirname, 'src/public'),
          publicPath: '/'
        }
      ],
      compress: true,
      headers: {
        'Service-Worker-Allowed': '/',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      },
      client: {
        logging: 'info',
        overlay: {
          errors: true,
          warnings: false
        },
        progress: true
      },
      devMiddleware: {
        stats: 'minimal'
      }
    },
    
    // ✨ Module Resolution
    resolve: {
      extensions: ['.js', '.mjs', '.json', '.css', '.scss'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@scripts': path.resolve(__dirname, 'src/scripts'),
        '@presenters': path.resolve(__dirname, 'src/scripts/presenters'),
        '@views': path.resolve(__dirname, 'src/scripts/views'),
        '@data': path.resolve(__dirname, 'src/scripts/data'),
        '@utils': path.resolve(__dirname, 'src/scripts/utils'),
        '@components': path.resolve(__dirname, 'src/scripts/components'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@public': path.resolve(__dirname, 'src/public')
      },
      fallback: {
        "path": false,
        "fs": false,
        "crypto": false
      }
    },
    
    // ✨ Optimization Configuration
    optimization: {
      minimize: isProduction,
      minimizer: [
        // JavaScript Minification
        '...',
        // CSS Minification will be handled by cssnano in postcss
      ],
      
      // ✨ Code Splitting
      splitChunks: isProduction ? {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // ✨ Vendor Libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true
          },
          
          // ✨ Common Modules
          common: {
            minChunks: 2,
            chunks: 'all',
            name: 'common',
            priority: 5,
            reuseExistingChunk: true
          },
          
          // ✨ Styles
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true
          }
        }
      } : false,
      
      // ✨ Runtime Chunk
      runtimeChunk: isProduction ? 'single' : false,
      
      // ✨ Module IDs
      moduleIds: isProduction ? 'deterministic' : 'named',
      chunkIds: isProduction ? 'deterministic' : 'named'
    },
    
    // ✨ Performance Configuration
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
      assetFilter: (assetFilename) => {
        return !assetFilename.endsWith('.map');
      }
    },
    
    // ✨ Source Maps
    devtool: isProduction 
      ? 'source-map' 
      : 'eval-cheap-module-source-map',
    
    // ✨ Stats Configuration
    stats: {
      preset: 'minimal',
      moduleTrace: true,
      errorDetails: true,
      colors: true,
      chunks: false,
      modules: false,
      reasons: isDevelopment,
      usedExports: isDevelopment,
      providedExports: isDevelopment
    },
    
    // ✨ Watch Options
    watchOptions: {
      aggregateTimeout: 300,
      poll: false,
      ignored: /node_modules/
    },
    
    // ✨ Cache Configuration
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    },
    
    // ✨ Experiments
    experiments: {
      topLevelAwait: true,
      outputModule: false
    },
    
    // ✨ Target
    target: ['web', 'es2017'],
    
    // ✨ Mode
    mode: isProduction ? 'production' : 'development'
  };
};