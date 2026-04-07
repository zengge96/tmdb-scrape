#!/usr/bin/env node
/**
 * 步骤3：TMDB搜索（仅搜索，不获取详情）
 * 输入: 行号|片名 文件
 * 输出: 行号|片名|[{搜索结果}]
 * 
 * 用法: node tmdb_search.js <输入文件> <输出文件>
 */
const fs = require('fs');
const https = require('https');

const API_KEY = '95b984723a97b73d8e8702fce60d5708';

if (process.argv.length < 4) {
    console.log('用法: node tmdb_search.js <输入文件> <输出文件>');
    process.exit(1);
}

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3];

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

// 主函数
async function main() {
    console.log('【步骤3】TMDB搜索\n');
    console.log(`输入: ${INPUT_FILE}`);
    console.log(`输出: ${OUTPUT_FILE}\n`);

    const lines = fs.readFileSync(INPUT_FILE, 'utf-8')
        .split('\n')
        .filter(l => l.trim());

    let output = '';
    for (const line of lines) {
        const idx = line.indexOf('|');
        if (idx === -1) continue;
        const lineNum = line.substring(0, idx);
        const name = line.substring(idx + 1).trim();
        console.log(`[${lineNum}] 搜索: ${name}`);
        const results = await tmdbSearch(name);
        // 只保留movie和tv，过滤掉不需要的类型
        const filtered = results
            .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
            .slice(0, 10) // 最多10个结果
            .map(r => ({
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