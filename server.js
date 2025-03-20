const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const { readdirSync } = require('fs');
const path = require('path');

app.use(morgan('dev'));
app.use(express.json());
app.use(cors()); 

// 🚀 Auto load routes
try {
    readdirSync('./routes').forEach((file) => {
        app.use('/api', require(path.join(__dirname, 'routes', file)));
    });
} catch (error) {
    console.error("Error loading routes:", error);
}

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
