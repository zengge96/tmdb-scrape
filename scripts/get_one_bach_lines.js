#!/usr/bin/env node
/**
 * 步骤2：获取批次文件
 * 输入: 带行号的文件, 批次编号, 每批次行数
 * 输出: 打印到控制台，本批次的所有行，格式：行号#路径
 *
 * 用法: node get_one_bach_lines.js <输入文件> <批次编号> <每批次行数>
 */
const fs = require('fs');

if (process.argv.length < 5) {
  console.log('用法: node get_one_bach_lines.js <输入文件> <批次编号> <每批次行数>');
  process.exit(1);
}

const INPUT_FILE = process.argv[2];
const BATCH_NUM = parseInt(process.argv[3], 10);
const BATCH_SIZE = parseInt(process.argv[4], 10);

function main() {
  // 读取带行号的文件
  const lines = fs.readFileSync(INPUT_FILE, 'utf-8')
    .split('\n')
    .filter(l => l.trim());

  // 计算起始和结束位置
  const startIdx = (BATCH_NUM - 1) * BATCH_SIZE;
  const endIdx = Math.min(startIdx + BATCH_SIZE, lines.length);

  if (startIdx >= lines.length) {
    console.log(`批次 ${BATCH_NUM} 超出范围！总行数: ${lines.length}`);
    process.exit(1);
  }

  // 提取该批次的行
  const batchLines = lines.slice(startIdx, endIdx);

  batchLines.forEach(l => console.log(l));
}

main();