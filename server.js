// server.js - Simplified for client-side file processing
const express = require('express');
const path = require('path');
const app = express();

// Use Render's PORT environment variable or fallback to 3000
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Handle favicon.ico requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'MindAR Experience Server Running'
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Static files served from public directory');
});