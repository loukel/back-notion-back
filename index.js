const express = require('express')
const morgan = require('morgan')
const dotenv = require('dotenv')
const cors = require('cors')
const redis = require("redis")
const ExpressRedisCache = require('express-redis-cache')

dotenv.config()
const app = express()

const {
  Client
} = require("@notionhq/client")
const {
  convertToHTML
} = require('./blocksToHtml')
const cache = ExpressRedisCache({
  client: redis.createClient(process.env.REDIS_URL),
  expire: 60 * 60 * 24 * 3 // 3 days
})

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

app.get('/articles', cache.route(), async (req, res) => {
  var response = await notion.databases.query({
    database_id: databaseId,
  })

  var articles = response.results

  articles.map((article) => {
    delete article.object
    delete article.parent
    article.image = article.properties.image && article.properties.image.url
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

app.get('/articles/:slug', cache.route(), async (req, res) => {
  const slug = req.params.slug

  var page = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'slug',
      text: {
        equals: slug
      }
    }
  })

  page = page.results[0]

  var blockId = page.id

  var blocks = await notion.blocks.children.list({
    block_id: blockId,
  })

  blocks = blocks.results

  const article = {
    created_time: page.created_time,
    last_edited_time: page.last_edited_time,
    archived: page.archived,
    slug: page.properties.slug.formula.string,
    image: page.properties.image && page.properties.image.url,
    tags: page.properties.tags.multi_select, // Format tags with bg color and text color, remove id
    description: page.properties.description.rich_text.length !== 0 && page.properties.description.rich_text[0].plain_text,
    visibility: page.properties.visibility.select.name,
    title: page.properties.page.title[0].plain_text,
    page: convertToHTML(blocks)
  }

  res.send(article)
})

app.delete('/cache', async (req, res) => {
  cache.get((error, entries) => {
    if (error) throw error

    entries.forEach((entry, index) => {
      cache.del(entry.name)
    })
  })

  res.sendStatus(200)
})

app.delete('/cache/articles', async (req, res) => {
  cache.del('/articles', Function())

  res.sendStatus(200)
})

app.delete('/cache/articles/:slug', async (req, res) => {
  cache.del(`/articles/${req.params.slug}`, Function())

  res.sendStatus(200)
})