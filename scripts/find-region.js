import dns from 'dns';
import pkg from 'pg';
const { Client } = pkg;

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'eu-central-1', 'eu-central-2', 'eu-north-1',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'sa-east-1'
];

async function checkRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  
  // Resolve DNS first to avoid slow timeouts for non-existent regions
  try {
    const address = await new Promise((resolve, reject) => {
      dns.lookup(host, (err, addr) => {
        if (err) reject(err);
        else resolve(addr);
      });
    });
    console.log(`\n  DNS resolved for ${region}: ${address}`);
  } catch (e) {
    return null; // DNS lookup failed
  }

  // Try both port 5432 (session) and port 6543 (transaction)
  for (const port of [5432, 6543]) {
    const connString = `postgresql://postgres.jtywhpenfxmttfkutwin:Perseverance25%232026@${host}:${port}/postgres`;
    const client = new Client({
      connectionString: connString,
      connectionTimeoutMillis: 4000,
    });

    try {
      await client.connect();
      await client.end();
      return connString;
    } catch (err) {
      console.log(`  Connect to ${region}:${port} error: ${err.message}`);
    }
  }
  return null;
}

async function run() {
  console.log('Probing Supabase pooler regions to find the project region...');
  for (const region of regions) {
    process.stdout.write(`Checking ${region}... `);
    const connStr = await checkRegion(region);
    if (connStr) {
      console.log('\n\nSUCCESS!');
      console.log(`Region found: ${region}`);
      console.log(`Connection string: ${connStr}`);
      process.exit(0);
    } else {
      process.stdout.write('no\n');
    }
  }
  console.log('\nFailed to find matching region.');
  process.exit(1);
}

run();
