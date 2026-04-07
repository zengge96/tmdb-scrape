#!/usr/bin/env node
/**
 * 步骤3：TMDB搜索（仅搜索，不获取详情）
 * 输入: 行号|片名|年份 文件
 * 输出: 行号|片名|[{搜索结果}]
 *
 * 用法: node tmdb_search.js <输入文件> <输出文件> [容错年份数，默认1]
 *
 * 输入格式: 31|Lamb|2021
 * 年份为可选，不提供时不过滤
 */

const fs = require('fs');
const https = require('https');

const API_KEY = '95b984723a97b73d8e8702fce60d5708';

if (process.argv.length < 4) {
  console.log('用法: node tmdb_search.js <输入文件> <输出文件> [容错年份数]');
  process.exit(1);
}

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3];
const YEAR_TOLERANCE = parseInt(process.argv[4]) || 1;

// TMDB搜索请求（Movie + TV）
function tmdbSearch(query) {
  return new Promise((resolve, reject) => {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=zh-CN`;
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// 解析输入行：支持 3 种格式
// 1. 行号|片名|年份
// 2. 行号|片名（无年份）
function parseLine(line) {
  const parts = line.trim().split('|');
  const lineNum = parts[0];
  const name = parts[1]?.trim() || '';
  const year = parts[2]?.trim() || '';
  return { lineNum, name, year };
}

// 检查年份是否在容差范围内
function isYearMatch(resultYear, targetYear, tolerance) {
  if (!targetYear || !resultYear || resultYear === '') return true; // 无年份不过滤
  if (resultYear === '') return true;
  
  const r = parseInt(resultYear);
  const t = parseInt(targetYear);
  
  if (isNaN(r) || isNaN(t)) return true;
  
  return Math.abs(r - t) <= tolerance;
}

// 主函数
async function main() {
  console.log('【步骤3】TMDB搜索\n');
  console.log(`输入: ${INPUT_FILE}`);
  console.log(`输出: ${OUTPUT_FILE}`);
  console.log(`年份容差: ±${YEAR_TOLERANCE}\n`);

  const lines = fs.readFileSync(INPUT_FILE, 'utf-8')
    .split('\n')
    .filter(l => l.trim());

  let output = '';
  for (const line of lines) {
    const { lineNum, name, year } = parseLine(line);
    
    if (!name) continue;
    
    console.log(`[${lineNum}] 搜索: ${name}${year ? ` (${year})` : ''}`);
    
    const results = await tmdbSearch(name);
    
    // 过滤年份（如果提供了年份）
    let filtered = results
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 20); // 先获取更多结果用于过滤
    
    // 应用年份容差过滤
    if (year) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(r => isYearMatch(r.release_date?.substring(0, 4) || r.first_air_date?.substring(0, 4) || '', year, YEAR_TOLERANCE));
      console.log(` → 年份过滤: ${beforeCount} → ${filtered.length} (容差±${YEAR_TOLERANCE})`);
    }
    
    // 最多保留10个结果
    filtered = filtered.slice(0, 10).map(r => ({
      id: r.id,
      title: r.title || r.name,
      year: (r.release_date || r.first_air_date || '').substring(0, 4),
      media_type: r.media_type,
      vote_average: r.vote_average,
      overview: r.overview
    }));

    output += `${lineNum}|${name}|${JSON.stringify(filtered)}\n`;
    console.log(` → 找到 ${filtered.length} 个结果`);

    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`\n完成！搜索结果已保存到: ${OUTPUT_FILE}`);
}

main().catch(console.error);