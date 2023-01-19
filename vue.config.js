const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            mainProcessFile: './src/main-electron.js',
            builderOptions: {
                'appId': 'msg.SML',
                'productName': 'SML',
                'win': {
                    'target': [{ 'target': 'portable' }],
                    'icon': 'logo.png'
                },
                "linux": {
                    "target": [ { "target": "AppImage" } ],
                    "artifactName": "SML",
                    'icon': 'logo.png'
                },
                "mac": {
                    "identity": null,
                    "target": [ { "target": "dir" } ],
                    "icon": "logo.png",
                },
                "portable": {
                    "useZip": false,
                    "artifactName": 'SML.exe'
                },
            }
        }
    },
    configureWebpack: {
        plugins: [
            new MonacoWebpackPlugin({
                //  available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
                languages: [ 'javascript', 'css', 'html', 'typescript', 'json' ]
            })
        ]
    },
    chainWebpack: (config) => {
        config.module
            .rule('pegjs')
            .test(/\.pegjs$/)
            .use('pegjs-loader')
            .loader('pegjs-loader')
            .end()
        
        config
            .plugin('html')
            .tap((args) => {
                args[0].template = './src/resources/boot/index.html'
                return args
            })
    },
    transpileDependencies: [
        'vuetify'
    ],
    lintOnSave: false
}
