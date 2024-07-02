const path = require('path');
const CopyPkgJsonPlugin = require("copy-pkg-json-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  experiments: {
    outputModule: true
  },
  externals: [
    'three'
  ],
  module: {
    rules: [
      {
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: "tsconfig.webpack.json"
          }
        }]
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'publish'),
    library: {
      type: 'module'
    },
    clean: true
  },
  plugins: [
    new CopyPkgJsonPlugin({
      remove: ['devDependencies', 'scripts']
    }),
    new CopyPlugin({
      patterns: [
        { from: "README.md", to: "README.md" },
        { from: "LICENSE", to: "LICENSE", toType: "file" }
      ]
    })
  ]
};