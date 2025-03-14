const fs = require('fs');
const path = require('path');

// Path to the uploads directory
const uploadsDir = path.join(__dirname, 'uploads/licenseplates');

console.log('Uploads directory:', uploadsDir);
console.log('Directory exists:', fs.existsSync(uploadsDir));

try {
    // Try to write a test file
    const testFilePath = path.join(uploadsDir, 'test.txt');
    fs.writeFileSync(testFilePath, 'This is a test file');
    console.log('Successfully wrote test file to:', testFilePath);

    // Try to read the test file
    const content = fs.readFileSync(testFilePath, 'utf8');
    console.log('Successfully read test file. Content:', content);

    // Try to delete the test file
    fs.unlinkSync(testFilePath);
    console.log('Successfully deleted test file');
} catch (error) {
    console.error('Error:', error);
} 