const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const net = require('net');

// Variables
const results = [];
const HTTP_PORT = 3000;   // HTTP server will run on this port
const TCP_PORT = 4000;    // TCP server will run on this port

// Function to load and parse the CSV file into JSON
function loadCSVData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream('C:/Users/50709287030/Desktop/autoVauosadeHttpApi/LE.txt')
      .pipe(csv())
      .on('data', (data) => {
        console.log('Data:', data);  // Log each parsed row
        results.push(data);
      })
      .on('end', () => {
        console.log('CSV data parsed:', results);  // Log parsed results
        resolve(); // Resolve when CSV parsing is complete
      })
      .on('error', (err) => {
        console.error('Error parsing CSV file:', err);
        reject(err); // Reject if there is an error reading the file
      });
  });
}

// Create an Express HTTP server
const app = express();

// HTTP route to serve the parsed CSV data as JSON
app.get('/', (req, res) => {
  if (results.length > 0) {
    console.log('Sending JSON data');
    res.json(results);  // Send the JSON data when the HTTP route is accessed
  } else {
    console.log('No data found');
    res.status(500).send('Error: No data available');
  }
});

// Start the TCP server
const server = net.createServer((socket) => {
  console.log('Client connected:', socket.remoteAddress, socket.remotePort);

  // Send the JSON data to the client upon connection
  socket.write(JSON.stringify(results)); // Send parsed JSON as string

  // Handle incoming data from the client
  socket.on('data', (data) => {
    console.log('Received:', data.toString());
    // Optionally, you can respond to the client
    socket.write('Tere tulemast serverisse');
  });

  // Handle client disconnection
  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

// Start the TCP server
server.listen(TCP_PORT, '0.0.0.0', () => {
  console.log(`TCP Server listening on port ${TCP_PORT}`);
});

// Load the CSV data and start the HTTP server once the data is ready
loadCSVData()
  .then(() => {
    // Start the HTTP server only after the CSV data has been loaded
    app.listen(HTTP_PORT, () => {
      console.log(`HTTP Server is running at http://localhost:${HTTP_PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to load CSV data:', error);
  });
