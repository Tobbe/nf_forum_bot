const secrets = require('./secrets.json');
const NF_URL = 'https://rebellion.nerdfitness.com';

module.exports = function login(cloudscraper) {
    return new Promise((resolve, reject) => {
        cloudscraper
            .get(NF_URL + '/login/')
            .then(htmlString => {
                const csrfToken = getNamedInputValue(htmlString, 'csrfKey');
                console.log('login csrfToken', csrfToken);

                cloudscraper
                    .post(NF_URL + '/login/', {
                        form: {
                            csrfKey: csrfToken,
                            auth: secrets.USERNAME,
                            password: secrets.PASSWORD,
                            _processLogin: 'usernamepassword',
                            remember_me: 0,
                        },
                    })
                    .then(htmlString => {
                        resolve(htmlString.match(/csrfKey=(.+?)["&]/)[1]);
                    })
                    .catch(e => {
                        console.log('inner error');
                        console.log('e', e);
                        reject('FAIL');
                    });
            })
            .catch(e => {
                console.log('error');
                console.log('e', e);
                reject('FAIL');
            });
    });
};
