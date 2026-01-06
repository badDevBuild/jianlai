const fs = require('fs');
const path = '/Users/shushu/剑来/frontend/public/data/characters.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
// Data is a Record<string, Character>, so we access by key
const chen = data['陈平安'];
if (chen) {
    console.log(JSON.stringify(chen.cultivation_log, null, 2));
} else {
    console.log('Chen Pingan not found');
}
