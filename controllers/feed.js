exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{title: 'Post', content: "FirstPost"}]
    });
}

exports.postPosts = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;

    res.status(201).json({
        message: 'Post created with success',
        post: { id: new Date().toISOString(), title: title, content: content}
    })
}