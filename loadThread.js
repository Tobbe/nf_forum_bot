const cheerio = require('cheerio');
const common = require('./common');

module.exports = function loadThread(cloudscraper, thread) {
    function loadPage(page) {
        return cloudscraper
            .get(common.NF_TOPIC_URL + `/${thread}/page/${page}`)
            .then(htmlString => cheerio.load(htmlString));
    }

    return new Promise((resolve, reject) => {
        cloudscraper
            .get(common.NF_TOPIC_URL + `/${thread}`)
            .then(htmlString => cheerio.load(htmlString))
            .then($ => {
                const pages = $('.ipsPagination').data('pages');
                console.log('need to load ' + pages + ' pages');

                const pagePromises = [Promise.resolve($)];

                for (let i = 2; i <= pages; i++) {
                    pagePromises.push(loadPage(i));
                }

                Promise.all(pagePromises)
                    .then(pages => {
                        const posts = [];

                        console.log('parsing ' + pages.length + ' pages');

                        pages.forEach($ => {
                            const $comments = $('article.ipsComment');
                            $comments.each(function() {
                                const $author = $(this).find(
                                    '.ipsComment_author h3 a'
                                );
                                const href = $author.attr('href');
                                const message = $(this)
                                    .find('div[data-role=commentContent]')
                                    .html();
                                const post = {
                                    author: {
                                        name: $author.text(),
                                        id: href.match(
                                            /profile\/(\d+-.+?)\/$/
                                        )[1],
                                    },
                                    message,
                                };

                                posts.push(post);
                            });
                        });

                        resolve(posts);
                    })
                    .catch(reject);
            });
    });
};
