const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema(
    {
        title: { 
            type: String, 
            required: true, 
            trim: true, 
            maxLength: 80 
        },
        body: { type: String, trim: true, maxLength: 250 }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Note', noteSchema);