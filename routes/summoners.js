const express = require('express')
const router = express.Router()
const Summoner = require('../models/summoner')
const fetch = require('node-fetch')
const riotKey = 'api_key=RGAPI-6d026852-4db8-4fa1-9b58-3d66d9d772fd'


//Visi useriai
router.get('/', async (req, res) => {
    try {
        const summoners = await Summoner.find()
        res.json(summoners)
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})


//Vienas pagal varda, galima ieskoti tik tu kurie jau uzregistruoti
router.get('/:summonerName', async (req, res) => {
    try {
        const allSummonersLink = `http://localhost:3000/summoners`
        const responseSummoners = await fetch(allSummonersLink)
        let dataSummoners = await responseSummoners.json()
        let dataSummoner = dataSummoners.find(x => x.name.toLowerCase() === req.params.summonerName.toLowerCase())
        res.json(dataSummoner)
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

//Istorija matchu pagal varda, galima ieskoti tik tu kurie jau uzregistruoti
router.get('/history/:summonerName', async (req, res) => {
    try {
        await getSummonerHistory(req.params.summonerName)
        res.json({message: "History sent"})
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

//Issaugom useri is Riot API
router.post('/:summonerName', async (req, res) => {
    const summoner = new Summoner(await getSummonerInfo(req.params.summonerName))
    try {
        const newSummoner = await summoner.save()
        res.status(201).json(newSummoner)
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
})

//Istrinimas userio is duomenu bazes
router.delete('/:summonerName', async (req,res) => {
    try{
    const allSummonersLink = `http://localhost:3000/summoners`
    const responseSummoners = await fetch(allSummonersLink)
    let dataSummoners = await responseSummoners.json()
    let dataSummoner = dataSummoners.find(x => x.name.toLowerCase() === req.params.summonerName.toLowerCase())
    await Summoner.find({accountId : dataSummoner.accountId}).deleteOne()
    res.json({message: `Deleted summoner ${dataSummoner.name}`})
    }catch(err){
        res.status(500).json({message: err.message})
    }
})



//Accounto info isgavimas Riot API
async function getSummonerInfo(summonerName) {
    const summonerLink = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?${riotKey}`
    const responseSummoner = await fetch(summonerLink)
    let dataSummoner = await responseSummoner.json()
    return dataSummoner
}

//Accounto paskutiniu 20 zaidimu istorija
async function getSummonerHistory(summonerName)
{
    const summonerLink = `http://localhost:3000/summoners/${summonerName}`
    const responseSummoner = await fetch(summonerLink)
    let dataSummoner = await responseSummoner.json()
    const historyLink = `https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/${dataSummoner.puuid}/ids?count=20&${riotKey}`
    const responseHistory = await fetch(historyLink)
    let dataHistory = await responseHistory.json()
    let matchHistory = dataHistory
    let i
    let j
    let dataMatch
    for (i = 0; i < matchHistory.length; i++) {
        const matchLink = `https://europe.api.riotgames.com/tft/match/v1/matches/${matchHistory[i]}?${riotKey}`
        const responseMatch = await fetch(matchLink)
        dataMatch = await responseMatch.json()
        for (j = 0; j < 8; j++) {
            if (dataSummoner.puuid === dataMatch.info.participants[j].puuid) {
                let matchNumber = i + 1
                console.log('[Match ' + matchNumber + "]")
                console.log("Placement: " +dataMatch.info.participants[j].placement)
                console.log("Game length: " +timeFormatting(dataMatch.info.game_length))
                console.log("Time alive: " +timeFormatting(dataMatch.info.participants[j].time_eliminated))
                break;
            }
        }
    }
}

//Funkcija kad graziai atrodytu laikas
function timeFormatting(duration)
{   
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}


module.exports = router