const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      process.env[key] = value.slice(1, -1);
      continue;
    }

    process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  loadEnvFile(path.join(repoRoot, '.env'));

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
  const email = process.argv[2] || process.env.SUPABASE_TEST_EMAIL;
  const password = process.argv[3] || process.env.SUPABASE_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Provide a test email and password via SUPABASE_TEST_EMAIL/SUPABASE_TEST_PASSWORD or CLI args.'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  console.log(`Using Supabase project: ${supabaseUrl}`);
  console.log(`Testing account: ${email}`);

  const signup = await supabase.auth.signUp({
    email,
    password,
  });

  if (signup.error) {
    const message = signup.error.message || 'Unknown signup error';
    const alreadyExists =
      /already|exists|registered|confirmed/i.test(message);

    if (alreadyExists) {
      console.log(`Signup skipped: ${message}`);
    } else {
      throw signup.error;
    }
  } else {
    console.log(`Signup request accepted for user: ${signup.data.user?.id || 'unknown-user-id'}`);
  }

  const login = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (login.error) {
    throw login.error;
  }

  console.log(`Login successful for user: ${login.data.user?.id || 'unknown-user-id'}`);
  console.log(`Session created: ${Boolean(login.data.session)}`);
}

main().catch((error) => {
  console.error('Supabase auth test failed.');
  console.error(error.message || error);
  process.exit(1);
});
