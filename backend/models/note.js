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
        body: { type: String, trim: true, maxLength: 250 },
        pinned: { type: Boolean, default: false },
        order: { type: Number, default: () => Date.now() }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Note', noteSchema);