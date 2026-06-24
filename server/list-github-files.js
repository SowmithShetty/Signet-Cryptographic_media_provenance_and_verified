import fetch from 'node-fetch';

async function listFiles(path = '') {
  try {
    const url = `https://api.github.com/repos/c2pa-org/public-testfiles/contents/${path}`;
    console.log(`Fetching: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'node-fetch'
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      for (const item of data) {
        console.log(`${item.type.toUpperCase()}: ${item.path}`);
      }
    } else {
      console.log('Not an array:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listFiles('legacy/1.4/image/jpeg');
