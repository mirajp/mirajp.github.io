module.exports = {
    chainWebpack: config => {
        config.resolve.alias.set('vue$', 'vue/dist/vue.js');

        config.module
            .rule('markdown')
            .test(/\.md$/)
            .use('frontmatter-markdown-loader')
            .loader('frontmatter-markdown-loader')
            .options({
                vue: true,
            })
            // eslint-disable-next-line no-unused-vars
            .tap((options) => {
                return {
                    vue: {
                        root: 'markdown-body',
                    },
                };
            });
    },
    assetsDir: 'static',
    devServer: {
        overlay: {
            warnings: false,
            errors: true,
        },
    },
    outputDir: 'dist',
    publicPath: '/',
};
