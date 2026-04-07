#!/usr/bin/env node
/**
 * 步骤9：合并所有批次输出文件
 * 输入: 成功文件前缀, 错误文件前缀, 成功输出文件, 错误输出文件
 * 
 * 用法: node merge.js <成功文件前缀> <错误文件前缀> <成功输出> <错误输出>
 * 
 * 示例:
 * node merge.js success_ error_ final_success.txt final_error.txt
 * 会合并 success_1.txt, success_2.txt, ... 到 final_success.txt
 */
const fs = require('fs');
const path = require('path');

if (process.argv.length < 6) {
  console.log('用法: node merge.js <成功文件前缀> <错误文件前缀> <成功输出> <错误输出>');
  console.log('示例: node merge.js success_ error_ final_success.txt final_error.txt');
  process.exit(1);
}

const SUCCESS_PREFIX = process.argv[2];
const ERROR_PREFIX = process.argv[3];
const SUCCESS_OUTPUT = process.argv[4];
const ERROR_OUTPUT = process.argv[5];

function getFilesWithPrefix(prefix) {
  const dir = '/tmp/incomplete_lines';
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith(prefix))
    .sort((a, b) => {
      const numA = parseInt(a.replace(prefix, '').replace('.txt', ''));
      const numB = parseInt(b.replace(prefix, '').replace('.txt', ''));
      return numA - numB;
    });
  return files.map(f => path.join(dir, f));
}

function mergeFiles(files, outputFile) {
  let output = '';
  for (const file of files) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      output += content;
      console.log(`合并: ${path.basename(file)}`);
    }
  }
  fs.writeFileSync(outputFile, output);
  return (output.match(/\n/g) || []).length || (output ? 1 : 0);
}

function main() {
  console.log('【步骤9】合并所有批次输出文件\n');
  console.log(`成功文件前缀: ${SUCCESS_PREFIX}`);
  console.log(`错误文件前缀: ${ERROR_PREFIX}`);
  console.log(`成功输出: ${SUCCESS_OUTPUT}`);
  console.log(`错误输出: ${ERROR_OUTPUT}\n`);

  // 合并成功文件
  console.log('合并成功文件...');
  const successFiles = getFilesWithPrefix(SUCCESS_PREFIX);
  const successCount = mergeFiles(successFiles, SUCCESS_OUTPUT);
  console.log(`成功: ${successCount} 条 → ${SUCCESS_OUTPUT}\n`);

  // 合并错误文件
  console.log('合并错误文件...');
  const errorFiles = getFilesWithPrefix(ERROR_PREFIX);
  const errorCount = mergeFiles(errorFiles, ERROR_OUTPUT);
  console.log(`错误: ${errorCount} 条 → ${ERROR_OUTPUT}\n`);

  console.log('========== 完成 ==========');
}

main();