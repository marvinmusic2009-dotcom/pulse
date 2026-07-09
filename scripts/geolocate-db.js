import https from 'https';

const ip = '2a05:d019:df3:bd01:755d:4596:8c1:7106';
const url = `https://ipinfo.io/${ip}/json`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('IP Geolocation:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
