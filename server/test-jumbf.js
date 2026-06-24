import fs from 'fs';

try {
  const buf = fs.readFileSync('adobe-20220124-A.jpg');
  console.log('File size:', buf.length, 'bytes');
  
  // Search for typical C2PA/JUMBF patterns
  const hasJumb = buf.includes('jumb');
  const hasC2pa = buf.includes('c2pa');
  const hasExif = buf.includes('Exif');
  
  console.log('Contains "jumb":', hasJumb);
  console.log('Contains "c2pa":', hasC2pa);
  console.log('Contains "Exif":', hasExif);
  
  // Let's find occurrences
  let pos = -1;
  while ((pos = buf.indexOf('jumb', pos + 1)) !== -1) {
    console.log('Found "jumb" at offset:', pos);
  }
  
  pos = -1;
  while ((pos = buf.indexOf('c2pa', pos + 1)) !== -1) {
    console.log('Found "c2pa" at offset:', pos);
  }
} catch (err) {
  console.error('Error:', err);
}
