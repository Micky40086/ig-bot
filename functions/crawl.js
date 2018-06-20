const request = require("request");
const cheerio = require("cheerio");

exports.getNewPost = function(account,timestamp) {
    return new Promise(function(resolveParam, rejectParam) {
        const data = getScriptJson(`https://www.instagram.com/${account}/`)
        .then((resData) => {
            let posts = resData.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges
            let new_posts = []
            var postsProcessed = 0
            posts.forEach( function(element) {
                if (timestamp - 300 < element.node.taken_at_timestamp ) {
                    new_posts.push(element.node.shortcode)
                } 
                postsProcessed++
                if (postsProcessed === posts.length) {
                    if (new_posts.length) {
                        getPostsMessages(new_posts).then((messages) => {
                            resolveParam(messages)
                        }).catch((error) => {
                            rejectParam(error)
                        })
                    } else {
                        resolveParam([])
                    }
                }
            })
        }).catch((error) => {
            rejectParam(error.message)
        })
    })
}

exports.getPttNewPost = function(area,timestamp) {
    return new Promise(function(resolveParam, rejectParam) {
        getHtml(`https://www.ptt.cc/bbs/${area}/index.html`)
        .then((res) => {
            var newPosts = []
            res.forEach(function(element){
                let arr = element.code.split('/')
                if (timestamp - 1800 < parseInt(arr[arr.length-1].split('.')[1])) {
                    newPosts.push(element)
                }
            })
            resolveParam(newPosts)
        }).catch((error) => {
            rejectParam(error)
        })
    })
}

function getHtml(url) {
    return new Promise(function(resolveParam, rejectParam) {
        request(url, function (error, response, body) {
            let $ = cheerio.load(body)
            if (response.statusCode == 200) {
                var result = []
                $('.r-ent .title a').each(function(i,item){
                    result.push({ 'code': item.attribs.href, 'title': $(this).text() })
                })
                resolveParam(result)
            } else {
                rejectParam('getHtml request error!')
            }
        });
    })
}


function getPostsMessages(items) {
    return new Promise(function(resolveParam, rejectParam) {
        var return_messages = []
        var itemsProcessed = 0
        items.forEach(function(post_id) {
            getScriptJson(`https://www.instagram.com/p/${post_id}/`).then((result) => {
                let media = result.entry_data.PostPage[0].graphql.shortcode_media
                if (media.edge_sidecar_to_children) {
                    media.edge_sidecar_to_children.edges.forEach(function(item) {
                        if (item.node.is_video) {
                            return_messages.push(video_template(item.node.video_url, item.node.display_url))
                        } else {
                            return_messages.push(image_template(item.node.display_url))
                        }
                    })
                } else {
                    if (media.is_video) {
                        return_messages.push(video_template(media.video_url, media.display_url))
                    } else {
                        return_messages.push(image_template(media.display_url))
                    }
                }
                itemsProcessed++
                if (itemsProcessed === items.length) {
                    resolveParam(return_messages)
                }
            }).catch((error) => {
                rejectParam(error.message)
            })
        })
    })
}

function image_template(image_url) {
    return {
        "type": "image",
        "originalContentUrl": image_url,
        "previewImageUrl": image_url
    }
}

function video_template(video_url, image_url) {
    return {
        "type": "video",
        "originalContentUrl": video_url,
        "previewImageUrl": image_url
    }
}

function getScriptJson(url) {
    return new Promise(function(resolveParam, rejectParam) {
        request(url, function (error, response, body) {
            //console.log('error:', error) // Print the error if one occurred
            //console.log('statusCode:', response && response.statusCode) // Print the response status code if a response was received
            //console.log('body:', body) // Print the HTML for the Google homepage.
            let $ = cheerio.load(body)
            if (response.statusCode == 200) {
                resolveParam(JSON.parse($('script').get()[3].children[0].data.substring($('script').get()[3].children[0].data.indexOf('{'),$('script').get()[3].children[0].data.length - 1)))
            } else {
                rejectParam(new Error('request error!'))
            }
        });
    })
}