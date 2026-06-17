import fs from 'fs';
import path from 'path';

const migrationsDir = 'c:\\Users\\avipa\\OneDrive\\Desktop\\StoryBridge\\supabase\\migrations';
const files = fs.readdirSync(migrationsDir);

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  if (content.includes('story_views')) {
    console.log(`Found 'story_views' in ${file}`);
  }
}
