#!/bin/sh
# 用 RDKit 导出全库显式氢分子图,核对 ef-molcore.js 规范哈希与 Python 构建一致(期望 bad 0)
cd "$(dirname "$0")" && node -e "const M=require('../../ef-molcore.js');const T=require(process.argv[1]);let b=0;for(const t of T)if(M.key(t)!==t.k)b++;console.log('n',T.length,'bad',b);process.exit(b?1:0)" "$PWD/tests.json"
