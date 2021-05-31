const express = require('express')
const morgan = require('morgan')
const dotenv = require('dotenv')
const cors = require('cors')

const {
  Client
} = require("@notionhq/client")

dotenv.config()
const app = express()

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`CORS-enabled web server listening on ${PORT}`)
})

var corsOptions = {
  origin: process.env.ORIGIN,
  optionsSuccessStatus: 200, // For legacy browser support
  methods: "GET",
}

// Middleware
app.use(cors(corsOptions))
app.use(morgan('dev'))
app.use(express.json())

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID

app.get('/articles', async (req, res) => {

  var response = await notion.databases.query({
    database_id: databaseId,
  })

  var articles = response.results
  res.status(200).send(articles)
})

app.get('/articles/:id', async (req, res) => {

})

app.use((req, res) => {
  res.sendStatus(404)
})