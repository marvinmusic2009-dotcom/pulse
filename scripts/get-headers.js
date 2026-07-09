import https from 'https';

const options = {
  hostname: 'jtywhpenfxmttfkutwin.supabase.co',
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXdocGVuZnhtdHRma3V0d2luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU3MDM0MSwiZXhwIjoyMDk5MTQ2MzQxfQ.mh90-jaavL6HDfe1zZ--xtZnzvCoFMNCVbjekEbBbuU'
  }
};

const req = https.request(options, (res) => {
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  process.exit(0);
});

req.on('error', (e) => {
  console.error(e);
  process.exit(1);
});

req.end();
