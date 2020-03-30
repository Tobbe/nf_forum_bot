const secrets = require('./secrets.json');
const common = require('./common');

module.exports = function updatePost(
    cloudscraper,
    csrfKey,
    thread,
    postId,
    message
) {
    return new Promise((resolve, reject) => {
        cloudscraper
            .get(
                common.NF_TOPIC_URL +
                    `/${thread}/&do=editComment&comment=${postId}` +
                    `&csrfKey=${csrfKey}`
            )
            .then(htmlString => {
                const plupload = common.getNamedInputValue(
                    htmlString,
                    'plupload'
                );
                const comment_value_upload = common.getNamedInputValue(
                    htmlString,
                    'comment_value_upload'
                );

                console.log('got ids', plupload, comment_value_upload);

                // comment_value: "<p>This pvp was a lot of fun. Anyone want to go another round for when the next challenge starts at Sunday/Monday? I&#39;d be very happy to set up a new thread for it.</p>",
                cloudscraper
                    .post(
                        common.NF_TOPIC_URL +
                            `/${thread}/&do=editComment&comment=${postId}` +
                            `&csrfKey=${csrfKey}`,
                        {
                            form: {
                                form_submitted: 1,
                                csrfKey,
                                comment_value: message,
                            },
                        }
                    )
                    .then(postResponse => {
                        console.log('post update done');
                        console.log(postResponse.substr(0, 500));
                        resolve('OK');
                    })
                    .catch(e => {
                        console.log('post update error');
                        console.log('e', e.substr(0, 500));
                        reject(e);
                    });
            });
    });
};
