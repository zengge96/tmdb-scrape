#!/usr/bin/env node
/**
 * 步骤1：生成行号文件，将原始的文件加上行号
 * 输入: 输入文件, 输出文件
 * 输出: 行号#路径（行号是原始文件中的行号）
 * 
 * 用法: node gen_file_with_num.js <输入文件> <输出文件>
 */
const fs = require('fs');

if (process.argv.length < 4) {
  console.log('用法: node gen_file_with_num.js <输入文件> <输出文件>');
  process.exit(1);
}

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3];

function main() {
  console.log('【步骤1】生成行号文件\n');
  console.log(`输入: ${INPUT_FILE}`);
  console.log(`输出: ${OUTPUT_FILE}`);

  // 读取原始文件
  const allLines = fs.readFileSync(INPUT_FILE, 'utf-8')
    .split('\n')
    .filter(l => l.trim());

  let output = '';
  for (let i = 1; i <= allLines.length; i++) {
    const line = allLines[i - 1];
    const path = line.split('#')[0]; // 只取#前的路径
    output += `${i}#${path}\n`; // 使用原始行号
  }

  // 写入输出
  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`完成！已保存到: ${OUTPUT_FILE}\n`);
  console.log('示例:');
  output.split('\n').slice(0, 3).forEach(l => console.log(l));
}

main();