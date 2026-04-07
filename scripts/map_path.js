#!/usr/bin/env node
/**
 * 步骤6：映射路径
 * 输入: 原始文件, 成功文件, 错误文件, 成功输出, 错误输出
 * 格式: 路径#中文名#TMDB_ID#评分#海报#年份#国家#类型
 * 
 * 用法: node map_path.js <原始文件> <成功文件> <错误文件> <成功输出> <错误输出>
 */
const fs = require('fs');

if (process.argv.length < 7) {
    console.log('用法: node map_path.js <原始文件> <成功文件> <错误文件> <成功输出> <错误输出>');
    process.exit(1);
}

const INCOMPLETE_FILE = process.argv[2];
const TEMP_SUCCESS = process.argv[3];
const TEMP_ERROR = process.argv[4];
const OUTPUT_SUCCESS = process.argv[5];
const OUTPUT_ERROR = process.argv[6];

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
    if (!fs.existsSync(TEMP_SUCCESS)) return '';
    const lines = fs.readFileSync(TEMP_SUCCESS, 'utf-8')
        .split('\n')
        .filter(l => l.trim());
    let output = '';
    for (const line of lines) {
        const parts = line.split('#');
        if (parts.length < 3) continue;
        const lineNum = parseInt(parts[0]);
        const originalPath = lineMap[lineNum] || '';
        
        let tmdb = {};
        try {
            // parts[2] 是搜索结果，parts[3] 是完整详情（如果有的话）
            const jsonStr = parts[3] || parts[2] || '[]';
            const json = JSON.parse(jsonStr);
            tmdb = Array.isArray(json) ? (json[0] || {}) : json;
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
    if (!fs.existsSync(TEMP_ERROR)) return '';
    const lines = fs.readFileSync(TEMP_ERROR, 'utf-8')
        .split('\n')
        .filter(l => l.trim());
    let output = '';
    for (const line of lines) {
        const parts = line.split('#');
        if (parts.length < 2) continue;
        const lineNum = parseInt(parts[0]);
        const originalPath = lineMap[lineNum] || '';
        const reason = parts.slice(1).join('|');
        output += `${originalPath}#${reason}\n`;
    }
    return output;
}

// 主函数
function main() {
    console.log('【步骤6】映射路径\n');
    console.log(`原始文件: ${INCOMPLETE_FILE}`);
    console.log(`成功文件: ${TEMP_SUCCESS}`);
    console.log(`错误文件: ${TEMP_ERROR}`);
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