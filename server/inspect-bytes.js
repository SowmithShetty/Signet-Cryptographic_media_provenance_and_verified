import fs from 'fs';

try {
  const buf = fs.readFileSync('adobe-20220124-A.jpg');
  console.log('File size:', buf.length, 'bytes');
  console.log('First 200 bytes in Hex:');
  console.log(buf.slice(0, 200).toString('hex'));
  console.log('First 200 bytes in ASCII:');
  console.log(buf.slice(0, 200).toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
} catch (err) {
  console.error('Error:', err);
}
