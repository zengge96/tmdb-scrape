#!/usr/bin/env node
/**
 * 步骤3（旧版）：查询TMDB - 搜索+详情一站式
 * 输入: 行号|片名 文件
 * 输出: 行号|片名|[{详细结果}]
 * 
 * 用法: node tmdb_query.js <输入文件> <输出文件>
 */
const fs = require('fs');
const https = require('https');

const API_KEY = '95b984723a97b73d8e8702fce60d5708';

if (process.argv.length < 4) {
    console.log('用法: node tmdb_query.js <输入文件> <输出文件>');
    process.exit(1);
}

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3];

// 使用Intl.DisplayNames转换国家代码为中文
const regionNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' });

function getCountryCN(code) {
    try {
        return regionNames.of(code);
    } catch (e) {
        return code;
    }
}

// TMDB请求
function tmdbRequest(endpoint, params) {
    return new Promise((resolve, reject) => {
        const query = Object.entries(params)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');
        const url = `https://api.themoviedb.org/3${endpoint}?api_key=${API_KEY}&${query}`;
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode !== 200) {
                        reject({ statusCode: res.statusCode, error: json.status_message });
                    } else {
                        resolve(json);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// 查询Movie
async function searchMovie(query) {
    return tmdbRequest('/search/movie', { query, language: 'zh-CN' });
}

// 查询TV
async function searchTV(query) {
    return tmdbRequest('/search/tv', { query, language: 'zh-CN' });
}

// 获取电影详情
async function getMovieDetails(id) {
    const [zh, en] = await Promise.all([
        tmdbRequest(`/movie/${id}`, { language: 'zh-CN', append_to_response: 'external_ids' }),
        tmdbRequest(`/movie/${id}`, { language: 'en-US' })
    ]);
    return { zh, en };
}

// 获取TV详情
async function getTVDetails(id) {
    const [zh, en] = await Promise.all([
        tmdbRequest(`/tv/${id}`, { language: 'zh-CN', append_to_response: 'external_ids' }),
        tmdbRequest(`/tv/${id}`, { language: 'en-US' })
    ]);
    return { zh, en };
}

// 处理类型翻译
function processGenres(genres) {
    if (!genres) return '';
    return genres.map(g => g.name).join('/')
        .replace(/Sci-Fi/i, '科幻')
        .replace(/Fantasy/i, '玄幻')
        .replace(/War/i, '战争');
}

// 处理单个片名
async function processName(lineNum, name) {
    let results = [];
    try {
        // 先查Movie
        let r = await searchMovie(name);
        if (r.results && r.results.length > 0) {
            for (const m of r.results.slice(0, 5)) {
                try {
                    const details = await getMovieDetails(m.id);
                    const zh = details.zh;
                    const en = details.en;
                    results.push({
                        id: m.id,
                        title: m.title,
                        en_title: en.title || m.title,
                        original_title: m.original_title || m.title,
                        year: m.release_date ? m.release_date.substring(0, 4) : '',
                        vote_average: m.vote_average,
                        poster_path: m.poster_path ? 'https://image.tmdb.org/t/p/original' + m.poster_path : '',
                        type: 'movie',
                        countries: (zh.production_countries || []).map(c => getCountryCN(c.iso_3166_1)).join('/') || (zh.origin_country || []).map(c => getCountryCN(c)).join('/'),
                        genres: processGenres(zh.genres) || '',
                        imdb_id: zh.external_ids?.imdb_id || ''
                    });
                } catch (e) {
                    // 忽略单个详情获取失败
                }
            }
        }
        // 如果Movie没结果，查TV
        if (results.length === 0) {
            r = await searchTV(name);
            if (r.results && r.results.length > 0) {
                for (const m of r.results.slice(0, 5)) {
                    try {
                        const details = await getTVDetails(m.id);
                        const zh = details.zh;
                        const en = details.en;
                        results.push({
                            id: m.id,
                            title: m.name,
                            en_title: en.name || m.name,
                            original_title: m.original_name || m.name,
                            year: m.first_air_date ? m.first_air_date.substring(0, 4) : '',
                            vote_average: m.vote_average,
                            poster_path: m.poster_path ? 'https://image.tmdb.org/t/p/original' + m.poster_path : '',
                            type: 'tv',
                            countries: (zh.production_countries || []).map(c => getCountryCN(c.iso_3166_1)).join('/') || (zh.origin_country || []).map(c => getCountryCN(c)).join('/'),
                            genres: processGenres(zh.genres) || '',
                            imdb_id: zh.external_ids?.imdb_id || ''
                        });
                    } catch (e) {
                        // 忽略
                    }
                }
            }
        }
    } catch (err) {
        console.log(` ⚠️ ${err.message}`);
    }
    return results;
}

// 主函数
async function main() {
    console.log('【步骤3】查询TMDB\n');
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
        console.log(`[${lineNum}] 查询: ${name}`);
        const results = await processName(lineNum, name);
        if (results.length > 0) {
            output += `${lineNum}|${name}|${JSON.stringify(results)}\n`;
            console.log(` → 找到 ${results.length} 个结果`);
            results.forEach((r, i) => {
                console.log(` ${i+1}. ${r.title} (${r.year}) ${r.countries} ${r.genres}`);
            });
        } else {
            output += `${lineNum}|${name}|[]\n`;
            console.log(` → 未找到`);
        }
        await new Promise(r => setTimeout(r, 300));
    }
    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`\n完成！结果已保存到: ${OUTPUT_FILE}`);
}

main().catch(console.error);