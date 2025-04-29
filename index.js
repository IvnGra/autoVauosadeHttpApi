const fs = require('fs');
const csv = require('csv-parser');
const express = require('express');

const inputFilePath = 'C:/Users/50709287030/Desktop/autoVauosadeHttpApi/LE.txt'; 
const port = 3000; // HTTP server port

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
          priceBeforeKM: data[8]?.replace(/"/g, ''),   // Price before KM
          brand: data[9]?.replace(/"/g, ''), // Brand
          priceAfterKM: data[10]?.replace(/"/g, '')   // after KM
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


app.get('/search', (req, res) => {
  const { serial, name, search, page=1 } = req.query;
  let limit = 30; // Safely parse limit from query
  let filteredResults = results;

  if (search) {
    let searchLower = search.toLowerCase()
    filteredResults = filteredResults.filter(item =>
      item.serial?.toLowerCase().includes(searchLower) ||
      item.name?.toLowerCase().includes(searchLower)
    );
  } else if (serial) {
    filteredResults = filteredResults.filter(item =>
      item.serial?.toLowerCase().includes(serial.toLowerCase())
    );
  } else if (name) {
    filteredResults = filteredResults.filter(item =>
      item.name?.toLowerCase().includes(name.toLowerCase())
    );
  } else {
    return res.status(400).send('Please provide at least a "serial" or "name" query parameter.');
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const newLimit = limit * page;
  const paginatedResults = filteredResults.slice(startIndex, endIndex, newLimit);

  if (paginatedResults.length > 0) {
    res.json({
      page,
      totalResults: filteredResults.length,
      totalPages: Math.ceil(filteredResults.length / limit),
      data: paginatedResults
    });
  } else {
    res.status(404).send('No matching data found');
  }
});

//  Load CSV and start server
loadCSVData()
  .then(() => {
    app.listen(port, () => {
      console.log(` Server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(' Failed to load CSV data:', error);
  });
