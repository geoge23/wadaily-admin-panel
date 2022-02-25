Date.prototype.getWeek = function() {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                            - 3 + (week1.getDay() + 6) % 7) / 7);
}


import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config()

const app = express()
app.set('view engine', 'ejs')
app.use(express.json())

const db = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
const Announcement = mongoose.model('announcements', {
    type: {
        type: String,
        enum: ['day', 'week']
    },
    date: {
        type: String
    },
    week: {
        type: Number
    },
    list: [String]
})

app.get('/', async (req, res) => {
    const {date: d} = req.params
    const date = new Date(d)

    const day = await Announcement.findOne({
        type: 'day',
        date: '1-2-3'
    })
    const week = await Announcement.findOne({
        type: 'week',
        week: date.getWeek() * date.getFullYear()
    })
    
    res.render('index.ejs', {
        date,
        day,
        week
    })
})

app.post('/day', (req, res) => {
    //day is sch day, date is date to change
    const {day, date} = req.body;
    res.send()
})

app.get('/week', async (req, res) => {
    const {week} = req.query;
    let doc = await Announcement.findOne({
        type: 'week',
        week
    })
    res.status(200).send(doc || {
        type: 'week',
        week,
        list: []
    })
})

app.post('/week', async (req, res) => {
    console.log(req.body)
    const {list, week} = req.body;
    let doc = await Announcement.findOne({
        type: 'week',
        week
    })
    if (doc == undefined) {
        doc = new Announcement({
            type: 'week',
            week
        })
    }
    doc.list = list;
    await doc.save();
    res.send();
})

app.get('/date', async (req, res) => {
    const {date} = req.query;
    let doc = await Announcement.findOne({
        type: 'day',
        date
    })
    res.status(200).send(doc || {
        type: 'day',
        date,
        list: []
    })
})

app.post('/date', async (req, res) => {
    const {list, date} = req.body;
    let doc = await Announcement.findOne({
        type: 'day',
        date
    })
    if (doc == undefined) {
        doc = new Announcement({
            type: 'day',
            date
        })
    }
    doc.list = list;
    await doc.save();
    res.send();
})

app.listen(3001)