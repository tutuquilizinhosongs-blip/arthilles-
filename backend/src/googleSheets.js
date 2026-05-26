function parseCsvLine(line, delimiter = ',') {
  const values = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function detectDelimiter(line) {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

function normalizeSheetUrl(url) {
  if (!url) return null;
  const value = String(url).trim();
  if (!value) return null;
  if (value.includes('/export?format=csv') || value.includes('output=csv')) return value;

  const match = value.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) return value;

  const gid = value.match(/[?&]gid=([^&]+)/)?.[1] || '0';
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
}

export async function fetchGoogleSheetFaqs(settings = {}) {
  const googleSheets = settings.google_sheets || {};
  if (!googleSheets.enabled || !googleSheets.csvUrl) return [];

  const url = normalizeSheetUrl(googleSheets.csvUrl);
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Google Sheets retornou HTTP ${response.status}`);

  const csv = await response.text();
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header) => header.replace(/^\uFEFF/, '').toLowerCase().trim());
  const questionIndex = headers.findIndex((header) => ['pergunta', 'question'].includes(header));
  const answerIndex = headers.findIndex((header) => ['resposta', 'answer'].includes(header));
  const keywordsIndex = headers.findIndex((header) => ['palavras', 'keywords', 'tags'].includes(header));

  if (questionIndex < 0 || answerIndex < 0) return [];

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    return {
      question: values[questionIndex] || '',
      answer: values[answerIndex] || '',
      keywords: (values[keywordsIndex] || '').split(/[;,]/).map((item) => item.trim()).filter(Boolean)
    };
  }).filter((item) => item.question && item.answer);
}
