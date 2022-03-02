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
import e from 'express';
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

const Schedule = mongoose.model('schedules', {
    "name": {
        type: String,
        required: true
    },
    "friendlyName": {
        type: String,
        required: true
    },
    "schedule": [{
        "name": {
            type: String,
            required: true
        },
        "code": {
            type: String,
            required: true
        },
        "startTime": {
            type: String,
            required: true
        },
        "endTime": {
            type: String,
            required: true
        }
    }]
})

const Day = mongoose.model('days', {
    date: {
        type: String,
        required: true
    },
    schedule: {
        type: String,
        required: true
    }
})

const availableSchedules = (await Schedule.find({})).map(e => e.name)
availableSchedules.push("NONE")


app.get('/', async (req, res) => {
    const {date: d} = req.query
    let time = d ? new Date(d) : new Date()
    if (isNaN(time.getWeek())) time = new Date()
    const now = `${time.getMonth() + 1}-${time.getDate()}-${time.getFullYear() % 100}`

    const day = await Announcement.findOne({
        type: 'day',
        date: now
    })
    const week = await Announcement.findOne({
        type: 'week',
        week: time.getWeek() * time.getFullYear()
    })

    const schDay = (await Day.findOne({date: now}))?.schedule || "NONE"
    
    res.render('index.ejs', {
        date: time.toDateString(),
        day,
        schDay,
        week,
        availableSchedules
    })
})

app.post('/day', async (req, res) => {
    //day is sch day, date is date to change
    const {day, date} = req.body;
    if (day == "NONE") {
        await Day.deleteOne({date})
    } else {
        await Day.updateOne({date}, {
            $set: {
                schedule: day
            }
        }, {upsert: true})
    }
    res.send()
})


//week endpoints

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

app.delete('/week', async (req, res) => {
    const {week, item} = req.body;
    await Announcement.updateOne({
        type: 'week',
        week
    },
    {
        $pull: {
            list: item
        }
    })
    res.send()
})


//day endpoints

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

app.delete('/date', async (req, res) => {
    const {date, item} = req.body;
    await Announcement.updateOne({
        type: 'day',
        date
    },
    {
        $pull: {
            list: item
        }
    })
    res.send()
})

app.listen(3001)