import { defineConfig } from 'umi';

const isProd = process.env.NODE_ENV === 'production';
const devServerPort = process.env.PORT || '8000';
const devServerOrigin = `http://localhost:${devServerPort}`;

export default defineConfig({
  npmClient: 'pnpm',
  writeToDisk: isProd,
  mfsu: isProd ? false : { strategy: 'normal' },
  history: {
    type: 'memory',
  },
  // 图片限制在 4MB 内打包成 base64
  // 大于 4MB 建议使用在线资源，否则打包到生产因为 vscode 插件 webview 的路径问题会无法显示
  inlineLimit: 4 * 1024 * 1024,
  publicPath: isProd ? './' : `${devServerOrigin}/`,
  // 生产环境下将所有文件打包成 umi.js 和 umi.css
  extraBabelPlugins: isProd ? ['babel-plugin-dynamic-import-node'] : [],
  // externals: { react: "react" },
  jsMinifier: 'esbuild',
  jsMinifierOptions: {
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
  },
  chainWebpack(memo) {
    if (isProd) {
      return;
    }

    memo.devServer.set('client', {
      webSocketURL: {
        protocol: 'ws',
        hostname: 'localhost',
        port: devServerPort,
        pathname: '/ws',
      },
    });
  },
});
