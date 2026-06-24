import { Reader } from '@contentauth/c2pa-node';
import path from 'path';

async function test() {
  try {
    console.log('Attempting to load C2PA node SDK...');
    const imagePath = 'c:/Users/sowmi/PROJECTS/SIGNET/adobe-20220124-A.jpg';
    console.log(`Reading image from: ${imagePath}`);
    
    const reader = await Reader.fromAsset({
      path: imagePath,
      mimeType: 'image/jpeg'
    });
    
    console.log('Successfully loaded reader!');
    const active = reader.getActive();
    console.log('Active manifest:', active ? 'Yes' : 'No');
    console.log('Full JSON:', reader.json());
  } catch (err) {
    console.error('C2PA Node error:', err);
  }
}

test();
