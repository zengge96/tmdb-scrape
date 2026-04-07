#!/usr/bin/env node
/**
 * 步骤1：生成行号文件
 * 输入: 输入文件, 输出文件, 起始行号, 每批条数
 * 输出: 行号|路径（行号是原始文件中的行号）
 * 
 * 用法: node gen_line_num.js <输入文件> <输出文件> <起始行号> <每批条数>
 */
const fs = require('fs');

if (process.argv.length < 6) {
    console.log('用法: node gen_line_num.js <输入文件> <输出文件> <起始行号> <每批条数>');
    process.exit(1);
}

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3];
const START_LINE = parseInt(process.argv[4]);
const BATCH_SIZE = parseInt(process.argv[5]);

function main() {
    console.log('【步骤1】生成行号文件\n');
    console.log(`输入: ${INPUT_FILE}`);
    console.log(`输出: ${OUTPUT_FILE}`);
    console.log(`起始行: ${START_LINE}`);
    console.log(`每批条数: ${BATCH_SIZE}`);

    // 读取原始文件
    const allLines = fs.readFileSync(INPUT_FILE, 'utf-8')
        .split('\n')
        .filter(l => l.trim());

    // 计算起始和结束行
    const endLine = Math.min(START_LINE + BATCH_SIZE - 1, allLines.length);
    console.log(`取第 ${START_LINE} - ${endLine} 行\n`);

    // 提取指定行，使用原始行号
    let output = '';
    for (let i = START_LINE; i <= endLine; i++) {
        const line = allLines[i - 1];
        const path = line.split('#')[0]; // 只取#前的路径
        output += `${i}|${path}\n`;  // 使用原始行号
    }

    // 写入输出
    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`完成！已保存到: ${OUTPUT_FILE}\n`);
    console.log('示例:');
    output.split('\n').slice(0, 3).forEach(l => console.log(l));
}

main();