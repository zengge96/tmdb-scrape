#!/usr/bin/env node
/**
 * 步骤6：映射路径
 * 输入: 原始文件, 详情文件, 成功输出, 错误输出；详情文件格式：行号#路径#片名#{完整详情}，如果没有详情格式为：行号#路径#片名#{}。
 * 格式: 路径#中文名#TMDB_ID#评分#海报#年份#国家#类型
 * 
 * 用法: node map_path.js <原始文件> <详情文件> <成功输出> <错误输出>
 */

const fs = require('fs');

if (process.argv.length < 6) {
  console.log('用法: node map_path.js <原始文件> <详情文件> <成功输出> <错误输出>');
  process.exit(1);
}

const INCOMPLETE_FILE = process.argv[2];
const TEMP_DETAIL = process.argv[3];
const OUTPUT_SUCCESS = process.argv[4];
const OUTPUT_ERROR = process.argv[5];

// 建立行号→原始路径的映射
function buildLineMap() {
  const lineMap = {};
  const lines = fs.readFileSync(INCOMPLETE_FILE, 'utf-8')
    .split('\n')
    .filter(l => l.trim());
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const path = line.split('#')[0];
    lineMap[lineNum] = path;
  });
  return lineMap;
}

// 处理成功记录
function processSuccess(lineMap) {
  if (!fs.existsSync(TEMP_DETAIL)) return '';
  const lines = fs.readFileSync(TEMP_DETAIL, 'utf-8')
    .split('\n')
    .filter(l => l.trim());
  let output = '';
  for (const line of lines) {
    const parts = line.split('#');
    if (parts.length < 3) continue;
    const lineNum = parseInt(parts[0]);
    let originalPath = lineMap[lineNum] || '';

    let tmdb = {};
    try {
      // 格式: parts[0]=行号, parts[1]=路径, parts[2]=片名, parts[3]="{详情}"
      const detailJson = parts[3] || '{}';
      const json = JSON.parse(detailJson);
      tmdb = Array.isArray(json) ? (json || {}) : json;
    } catch(e) {
      tmdb = {};
    }

    if (!tmdb.id) continue;
    const title = tmdb.title || '';
    const id = tmdb.id || '';
    const rating = tmdb.vote_average ? tmdb.vote_average.toFixed(1) : '0';
    const poster = tmdb.poster_path || '';
    const year = tmdb.year || '';
    const countries = tmdb.countries || '';
    const genres = tmdb.genres || '';

    output += `${originalPath}#${title}#${id}#${rating}#${poster}#${year}#${countries}#${genres}\n`;
  }
  return output;
}

// 处理错误记录
function processError(lineMap) {
  if (!fs.existsSync(TEMP_DETAIL)) return '';
  const lines = fs.readFileSync(TEMP_DETAIL, 'utf-8')
    .split('\n')
    .filter(l => l.trim());
  let output = '';
  for (const line of lines) {
    const parts = line.split('#');
    if (parts.length < 3) continue;
    const lineNum = parseInt(parts[0]);
    let originalPath = lineMap[lineNum] || '';

    let tmdb = {};
    try {
      // 格式: parts[0]=行号, parts[1]=路径, parts[2]=片名, parts[3]="{详情}"
      const detailJson = parts[3] || '{}';
      const json = JSON.parse(detailJson);
      tmdb = Array.isArray(json) ? (json || {}) : json;
    } catch(e) {
      tmdb = {};
    }

    if (tmdb.id) continue;
    output += `${originalPath}\n`;
    }
  return output;
}

// 主函数
function main() {
  console.log('【步骤6】映射路径\n');
  console.log(`原始文件: ${INCOMPLETE_FILE}`);
  console.log(`详情文件: ${TEMP_DETAIL}`);
  console.log(`成功输出: ${OUTPUT_SUCCESS}`);
  console.log(`错误输出: ${OUTPUT_ERROR}\n`);

  // 建立行号映射
  console.log('建立行号映射...');
  const lineMap = buildLineMap();
  console.log(`共 ${Object.keys(lineMap).length} 行`);

  // 处理成功记录
  console.log('处理成功记录...');
  const successData = processSuccess(lineMap);
  const successCount = (successData.match(/\n/g) || []).length || (successData ? 1 : 0);
  fs.writeFileSync(OUTPUT_SUCCESS, successData);
  console.log(`成功: ${successCount} 条 → ${OUTPUT_SUCCESS}`);

  // 处理错误记录
  console.log('处理错误记录...');
  const errorData = processError(lineMap);
  const errorCount = (errorData.match(/\n/g) || []).length || (errorData ? 1 : 0);
  fs.writeFileSync(OUTPUT_ERROR, errorData);
  console.log(`错误: ${errorCount} 条 → ${OUTPUT_ERROR}`);

  console.log('========== 完成 ==========');
}

main();