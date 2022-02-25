import express from 'express'

const app = express()
app.set('view engine', 'ejs')
app.use(express.json())

app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.post('/day', (req, res) => {
    const {day, date} = req.body;
    res.send()
})

app.listen(3001)