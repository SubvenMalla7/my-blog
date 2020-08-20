import express from 'express'
import bodyParser from 'body-parser'
import { MongoClient } from 'mongodb';
import path from 'path';


// const articalInfo = {
//     'learn-react': {
//         upvotes: 0,
//         comments: [], 
//     },
//     'learn-node': {
//         upvotes: 0,
//         comments: [],
//     },
//     'my-thoughts-on-resume': {
//         upvotes: 0,
//         comments: [],
//     },
// }

const withDb = async (operations, res) => {
    try {

        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });

        const db = client.db('my-blogs');

        await operations(db);

        client.close();
    } catch (error) {

        res.status(500).json({ message: 'Error connecting db', error });
    }
}

const app = express();

app.use(express.static(path.join(__dirname, '/build')));

app.use(bodyParser.json());

app.get('/api/article/:name', async (req, res) => {

    withDb(async (db) => {
        const articlename = req.params.name;
        const articalInfo = await db.collection('articles').findOne({ name: articlename });
        res.status(200).json(articalInfo);
    }, res)
}
)

app.post('/api/article/:name/upvotes', async (req, res) => {
    withDb(async (db) => {
        const articlename = req.params.name;
        const articalInfo = await db.collection('articles').findOne({ name: articlename });
        await db.collection('articles').updateOne({ name: articlename }, {
            '$set': {
                upvotes: articalInfo.upvotes + 1,
            },
        });
        const updatedArticle = await db.collection('articles').findOne({ name: articlename });
        res.status(200).json(updatedArticle);
    }, res);
});


app.post('/api/article/:name/add-comments', async (req, res) => {
    const articlename = req.params.name;
    const { username, text } = req.body;

    withDb(async (db) => {
        const articalInfo = await db.collection('articles').findOne({ name: articlename });
        await db.collection('articles').updateOne({ name: articlename }, {
            '$set': {
                comments: articalInfo.comments.concat({ username, text }),
            },
        });
        const updatedArticle = await db.collection('articles').findOne({ name: articlename });
        res.status(200).json(updatedArticle);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})


app.listen(8000, () => console.log('Listing at port 8000'));