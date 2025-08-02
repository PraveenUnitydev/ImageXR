// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = 3000;

// Set storage location and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.static('public'));

// Route to handle file upload
app.post('/upload', upload.fields([{ name: 'mind' }, { name: 'image' }]), (req, res) => {
  if (!req.files || !req.files.mind || !req.files.image) {
    return res.status(400).json({ error: 'Missing files' });
  }

  const mindFile = req.files.mind[0];
  const imageFile = req.files.image[0];

  res.json({
    mindUrl: `/uploads/${mindFile.filename}`,
    imageUrl: `/uploads/${imageFile.filename}`,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
