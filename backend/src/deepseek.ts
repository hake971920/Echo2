import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface SummarizeResponse {
  summary: string;
  tags: string[];
}

interface SearchResult {
  note: string;
  relevance: number;
}

export async function callDeepSeek(messages: Message[]): Promise<string> {
  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content || '';
}

export async function summarizeContent(content: string): Promise<SummarizeResponse> {
  const systemPrompt = `你是一个笔记整理助手。请根据用户提供的笔记内容，生成一个简洁的摘要（不超过100字），并提取3-5个关键词标签。
请以JSON格式返回，格式如下：
{"summary": "摘要内容", "tags": ["标签1", "标签2", "标签3"]}`;

  const userMessage = `请总结以下笔记内容：\n\n${content}`;

  const result = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  try {
    const parsed = JSON.parse(result);
    return {
      summary: parsed.summary || result,
      tags: parsed.tags || [],
    };
  } catch {
    return {
      summary: result,
      tags: [],
    };
  }
}

export async function aiSearch(query: string, notes: { id: string; content: string; summary: string }[]): Promise<SearchResult[]> {
  if (notes.length === 0) return [];

  const notesText = notes
    .map((n) => `笔记ID: ${n.id}\n内容: ${n.content}\n摘要: ${n.summary}`)
    .join('\n\n---\n\n');

  const systemPrompt = `你是一个智能搜索助手。根据用户查询，从给定的笔记中找出最相关的内容。
返回JSON数组格式，每个元素包含noteId和relevance分数(0-1)：
[{"noteId": "笔记ID", "relevance": 0.95}]`;

  const userMessage = `用户查询: ${query}\n\n笔记列表:\n${notesText}\n\n请返回与查询最相关的笔记，按相关性排序，只返回前5个。`;

  const result = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  try {
    const parsed = JSON.parse(result);
    return parsed.map((item: { noteId: string; relevance: number }) => ({
      note: item.noteId,
      relevance: item.relevance,
    }));
  } catch {
    return [];
  }
}

export async function fetchWebPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || 
                    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                    html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    let content = contentMatch ? contentMatch[1] : html;

    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    content = content.replace(/<[^>]+>/g, ' ');
    content = content.replace(/&nbsp;/g, ' ');
    content = content.replace(/&amp;/g, '&');
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/\s+/g, ' ').trim();

    const text = title ? `【${title}】\n\n${content}` : content;
    return text.slice(0, 10000);
  } catch (error) {
    throw new Error(`Failed to fetch web page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function summarizeUrl(url: string): Promise<SummarizeResponse & { content: string; title: string }> {
  const content = await fetchWebPage(url);
  
  const titleMatch = content.match(/【([^】]+)】/);
  const title = titleMatch ? titleMatch[1] : url;
  
  const systemPrompt = `你是一个笔记整理助手。请根据用户提供的网页内容，生成一个简洁的摘要（不超过150字），并提取3-5个关键词标签。
请以JSON格式返回，格式如下：
{"summary": "摘要内容", "tags": ["标签1", "标签2", "标签3"]}`;

  const userMessage = `请总结以下网页内容：\n\n${content}`;

  const result = await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  let parsed: { summary: string; tags: string[] };
  try {
    parsed = JSON.parse(result);
  } catch {
    parsed = { summary: result.slice(0, 150), tags: [] };
  }

  return {
    content,
    title,
    summary: parsed.summary || result.slice(0, 150),
    tags: parsed.tags || [],
  };
}