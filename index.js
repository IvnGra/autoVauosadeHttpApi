const fs = require('fs');
const csv = require('csv-parser');
const express = require('express');

const inputFilePath = 'C:/Users/50709287030/Desktop/autoVauosadeHttpApi/LE.txt'; 
const HTTP_PORT = 3000; // HTTP server port

const app = express();
let results = []; // Store parsed CSV data

// Function to load and parse CSV (TSV format)
function loadCSVData() {
  return new Promise((resolve, reject) => {
    const tempResults = [];
    fs.createReadStream(inputFilePath)
      .pipe(csv({ separator: '\t', headers: false })) // Set tab as separator
      .on('data', (data) => {
        tempResults.push({
          serial: data[0]?.replace(/"/g, ''),  // Serial Number
          name: data[1]?.replace(/"/g, ''),    // Product Name
          price: data[9]?.replace(/"/g, ''),   // Price
          brand: data[10]?.replace(/"/g, ''),  // Brand
          total: data[11]?.replace(/"/g, '')   // Total
        });
      })
      .on('end', () => {
        results = tempResults;
        console.log(`CSV parsed successfully, ${results.length} items loaded.`);
        resolve();
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err);
        reject(err);
      });
  });
}

//  Default homepage route
app.get('/', (req, res) => {
  res.send(`
    <h1>CSV to JSON </h1>
    <ul>
      <li><a href="/data">View All Data</a></li>
      <li><a href="/search?serial=">Search by Serial</a></li>
      <li><a href="/search?name=">Search by Name</a></li>
    </ul>
  `);
});

//  Get all data
app.get('/data', (req, res) => {
  res.json(results);
});

//  Search by serial or name
app.get('/search', (req, res) => {
  const { serial, name } = req.query;
  let filteredResults = results;

  if (serial) {
    filteredResults = filteredResults.filter(item =>
      item.serial && item.serial.toLowerCase().includes(serial.toLowerCase())
    );
  }

  if (name) {
    filteredResults = filteredResults.filter(item =>
      item.name && item.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (filteredResults.length > 0) {
    res.json(filteredResults);
  } else {
    res.status(404).send('No matching data found');
  }
});

//  Load CSV and start server
loadCSVData()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(` Server running at http://localhost:${HTTP_PORT}`);
    });
  })
  .catch((error) => {
    console.error(' Failed to load CSV data:', error);
  });
