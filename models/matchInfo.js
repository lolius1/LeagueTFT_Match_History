const mongoose = require('mongoose')

const matchInfoSchema = new mongoose.Schema({
    placement:{
        type: Number,
    },
    gameLength:{
        type: String,
    },
    timeAlive:{
        type: String,
    }
})

module.exports = mongoose.model('MatchInfo', matchInfoSchema)