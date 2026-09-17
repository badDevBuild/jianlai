import type { UserConfigExport } from "@tarojs/cli"

export default {
   logger: {
    quiet: false,
    stats: true
  },
  defineConstants: {
    // 本地开发时从本地静态服务加载数据（需先启动: cd data/dist && python3 -m http.server 9876）
    'process.env.API_BASE': '"http://127.0.0.1:9876"',
  },
  mini: {},
  h5: {}
} satisfies UserConfigExport<'webpack5'>
