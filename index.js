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

  articles.map((article) => {
    delete article.object
    delete article.parent
    article.image = article.properties.image.url
    article.slug = article.properties.slug.formula.string
    article.tags = article.properties.tags.multi_select
    article.description = article.properties.description.rich_text.length > 0 ? article.properties.description.rich_text[0].plain_text : ''
    article.title = article.properties.page.title[0].plain_text
    delete article.properties
    article.tags.map((tag) => {
      delete tag.id
    })
    return article
  })

  res.status(200).send(articles)
})

app.get('/articles/:id', async (req, res) => {

})

app.use((req, res) => {
  res.sendStatus(404)
})