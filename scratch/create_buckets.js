import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmbzsljswafgvpfwiwyl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYnpzbGpzd2FmZ3ZwZndpd3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDY1MjUsImV4cCI6MjA5NTc4MjUyNX0.XYgmO4Rd9XS2jVD0zsA8XIqVhEHTfTBbAJB9HbFR16E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBuckets() {
  const buckets = ['avatars', 'covers', 'posts', 'stories'];
  for (const bucket of buckets) {
    console.log(`Attempting to create bucket: ${bucket}...`);
    const { data, error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    if (error) {
      console.error(`Error creating ${bucket}:`, error.message);
    } else {
      console.log(`Successfully created ${bucket}!`, data);
    }
  }
}

createBuckets();
