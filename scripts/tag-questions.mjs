import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const questionDir = path.join(rootDir, 'public', 'questions');
const dataPath = path.join(rootDir, 'data', 'questions.json');
const chapterListPath = path.join(rootDir, 'Chapter List.md');
const envPath = path.join(rootDir, '.env.local');

const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');

function loadEnvFile() {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');
  contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const eq = line.indexOf('=');
      if (eq === -1) {
        return;
      }
      const key = line.slice(0, eq).trim();
      if (!key || process.env[key]) {
        return;
      }
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    });
}

function bail(message) {
  console.error(message);
  process.exit(1);
}

loadEnvFile();

if (!process.env.OPENAI_API_KEY) {
  bail('Missing OPENAI_API_KEY environment variable.');
}

if (!fs.existsSync(questionDir)) {
  bail(`Questions directory not found: ${questionDir}`);
}

if (!fs.existsSync(dataPath)) {
  bail(`questions.json not found: ${dataPath}`);
}

const chapterGuide = fs.existsSync(chapterListPath)
  ? fs.readFileSync(chapterListPath, 'utf8')
  : bail(`Chapter list not found at ${chapterListPath}`);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const schemaName = 'QuestionClassification';
const schemaDefinition = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ocr_text: {
      type: 'string',
      description: 'OCR transcription of the question prompt.'
    },
    chapters: {
      type: 'array',
      description:
        'List of chapters and subtopics that the question examines. Include multiple entries if more than one chapter applies.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          chapter: {
            type: 'string',
            description:
              'Full chapter name, e.g. "Form 4 Chapter 2: Quadratic Functions".'
          },
          subtopics: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Relevant subtopics from the provided list. Leave empty if unsure.'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence score between 0 and 1.'
          },
          rationale: {
            type: 'string',
            description:
              'Short explanation for why the chapter/subtopics were chosen.'
          }
        },
        required: ['chapter', 'confidence']
      }
    }
  },
  required: ['ocr_text', 'chapters']
};

const schemaFormat = {
  type: 'json_schema',
  name: schemaName,
  schema: schemaDefinition,
  strict: false
};

async function classifyQuestion(imagePath) {
  const imageData = fs.readFileSync(imagePath).toString('base64');

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    text: {
      format: schemaFormat
    },
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: [
              'You are an expert SPM Additional Mathematics teacher and curriculum designer.',
              'Analyse the provided question image by performing OCR and then tagging the question with the most relevant chapters and subtopics.',
              'Choose only from the chapters and subtopics listed below.',
              'If more than one chapter is applicable, include each with its own rationale.',
              '',
              'Chapter reference (including subtopics):',
              chapterGuide
            ].join('\n')
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Steps:',
              '1. Transcribe the question text (OCR).',
              '2. Identify which chapter(s) and subtopic(s) are being assessed.',
              '3. Provide a short rationale and a confidence score for each tag.',
              '',
              'Return the result as JSON that matches the provided schema.'
            ].join('\n')
          },
          {
            type: 'input_image',
            image_url: `data:image/png;base64,${imageData}`
          }
        ]
      }
    ]
  });

  const outputBlock = response.output?.find((block) => block.type === 'output_text');
  const raw = outputBlock?.text ?? response.output_text;

  if (!raw) {
    throw new Error('No text output received from the model.');
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse model output:', raw);
    throw error;
  }
}

async function main() {
  const files = fs
    .readdirSync(questionDir)
    .filter((name) => name.toLowerCase().endsWith('.png'))
    .sort();

  if (files.length === 0) {
    bail(`No PNG files found in ${questionDir}`);
  }

  const existing = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const byId = new Map(existing.map((item) => [item.id, item]));

  const updates = {};
  for (const fileName of files) {
    const id = path.basename(fileName, path.extname(fileName));
    const record = byId.get(id);

    if (record && Array.isArray(record.chapters) && record.chapters.length > 0 && !force) {
      console.log(`Skipping ${id} (chapters already present). Use --force to reprocess.`);
      continue;
    }

    console.log(`Processing ${fileName}…`);
    try {
      const result = await classifyQuestion(path.join(questionDir, fileName));
      updates[id] = result;
    } catch (error) {
      console.error(`Failed processing ${fileName}:`, error.message);
    }
  }

  if (dryRun) {
    console.log('Dry run complete. Results would be:');
    console.log(JSON.stringify(updates, null, 2));
    return;
  }

  const merged = existing.map((entry) => {
    const update = updates[entry.id];
    if (!update) {
      if (!Array.isArray(entry.chapters)) {
        entry.chapters = [];
      }
      return entry;
    }

    return {
      ...entry,
      ocr_text: update.ocr_text,
      chapters: update.chapters,
      metadata_updated_at: new Date().toISOString()
    };
  });

  for (const [id, update] of Object.entries(updates)) {
    if (!byId.has(id)) {
      merged.push({
        id,
        paper_id: 'UNKNOWN',
        question_number: null,
        year: null,
        state: null,
        paper_code: null,
        section: null,
        marks: null,
        question_img: `/questions/${id}.png`,
        solution_img: null,
        ocr_text: update.ocr_text,
        chapters: update.chapters,
        metadata_updated_at: new Date().toISOString()
      });
    }
  }

  merged.sort((a, b) => {
    const aIdx = files.indexOf(`${a.id}.png`);
    const bIdx = files.indexOf(`${b.id}.png`);
    if (aIdx === -1 || bIdx === -1) {
      return a.id.localeCompare(b.id);
    }
    return aIdx - bIdx;
  });

  fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(`Updated ${dataPath} with ${Object.keys(updates).length} classifications.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
