// converts dataset from CSV to JSON. Did get help on this implementation online to use the dataset. 

const csv = require('csvtojson');
const fs = require('fs');

const csvFilePath = './data/music.csv'; 
const jsonFilePath = './data/music.json';

csv()
  .fromFile(csvFilePath)
  .then((jsonArray) => {
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2), 'utf8');
    console.log('CSV successfully converted to JSON!');
  })
  .catch((error) => {
    console.error('Error converting CSV to JSON:', error);
  });
