#!/usr/bin/env node
/**
 * 步骤5：TMDB详情查询（根据AI选中的ID获取详细信息）
 * 输入: 行号|片名|[{选中的TMDB结果}]
 * 输出: 行号|片名|[{完整详情}]
 * 
 * 用法: node tmdb_details.js <输入文件> <输出文件>
 */
const fs = require('fs');
const https = require('https');

const API_KEY = '95b984723a97b73d8e8702fce60d5708';

if (process.argv.length < 4) {
    console.log('用法: node tmdb_details.js <输入文件> <输出文件>');
    process.exit(1);
}

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3];

// Intl.DisplayNames 转换国家代码
const regionNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' });

function getCountryCN(code) {
    try {
        return regionNames.of(code);
    } catch (e) {
        return code;
    }
}

// 获取电影/电视剧详情
function getDetails(id, type) {
    return new Promise((resolve, reject) => {
        const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=zh-CN&append_to_response=external_ids`;
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    // 处理国家
                    const countries = (json.production_countries || [])
                        .map(c => getCountryCN(c.iso_3166_1))
                        .join('/') || (json.origin_country || []).map(c => getCountryCN(c)).join('/');
                    // 处理类型
                    const genres = (json.genres || []).map(g => g.name).join('/');
                    resolve({
                        id: json.id,
                        title: json.title || json.name,
                        original_title: json.original_title || json.original_name,
                        year: (json.release_date || json.first_air_date || '').substring(0, 4),
                        vote_average: json.vote_average,
                        poster_path: json.poster_path ? 'https://image.tmdb.org/t/p/original' + json.poster_path : '',
                        media_type: type,
                        countries: countries,
                        genres: genres,
                        imdb_id: json.external_ids?.imdb_id || '',
                        overview: json.overview || ''
                    });
                } catch (e) {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.setTimeout(10000, () => {
            req.destroy();
            resolve(null);
        });
    });
}

// 主函数
async function main() {
    console.log('【步骤5】TMDB详情查询\n');
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
        console.log(`[${lineNum}] 查询详情: ${name}`);
        try {
            // 解析AI选中的结果
            const start = line.indexOf('|[');
            if (start === -1) {
                output += `${lineNum}|${name}|[]\n`;
                console.log(` → 无选中结果`);
                continue;
            }
            const jsonStr = line.substring(start + 1);
            const selected = JSON.parse(jsonStr);
            if (!selected || selected.length === 0) {
                output += `${lineNum}|${name}|[]\n`;
                console.log(` → 无选中结果`);
                continue;
            }
            // 获取选中项的详情
            const item = selected[0];
            const details = await getDetails(item.id, item.media_type);
            if (details) {
                output += `${lineNum}|${name}|${JSON.stringify([details])}\n`;
                console.log(` → ${details.title} (${details.year}) ${details.countries} ${details.genres}`);
            } else {
                output += `${lineNum}|${name}|[]\n`;
                console.log(` → 获取详情失败`);
            }
        } catch (e) {
            output += `${lineNum}|${name}|[]\n`;
            console.log(` → 解析错误: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 200));
    }
    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`\n完成！详情已保存到: ${OUTPUT_FILE}`);
}

main().catch(console.error);