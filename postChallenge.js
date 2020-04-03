#!/usr/bin/env node

// https://github.com/request/request-promise#api-in-detail

const common = require('./common');
const login = require('./login');
const cheerio = require('cheerio');

// var tough = require('tough-cookie');
// var jar = new tough.CookieJar();
var cloudscraper = require('cloudscraper');
var CaptchaError = require('cloudscraper/errors').CaptchaError;

// cloudscraper.debug = true;

var CookieStore = require('tough-cookie-file-store');
var jar = cloudscraper.jar(new CookieStore('./cookie.json'));
// var headers = cloudscraper.defaultParams.headers;
// fs.writeFileSync('./headers.json', JSON.stringify(headers), 'utf-8');
cloudscraper = cloudscraper.defaults({ jar, headers: require('./headers') });

function captchaHandler(_options, { captcha }) {
    // Here you do some magic with the siteKey provided by cloudscraper
    console.error('The url is "' + captcha.uri.href + '"');
    console.error('The site key is "' + captcha.siteKey + '"');
    const token = '';
    captcha.form['g-recaptcha-response'] = token;
    captcha.form['h-captcha-response'] = token;
    // captcha.submit();
}

cloudscraper = cloudscraper.defaults({ onCaptcha: captchaHandler });

async function newPost(cloudscraper, csrfKey, thread, message) {
    const threadId = thread.match(/^(\d+)-/)[1];
    console.log('threadId', threadId);

    return new Promise((resolve, reject) => {
        cloudscraper
            .post(common.NF_TOPIC_URL + `/${thread}`, {
                form: {
                    [`commentform_${threadId}_submitted`]: 1,
                    csrfKey,
                    [`topic_comment_${threadId}`]: message,
                },
            })
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
}

async function postNewChallenge() {
    const d = new Date();
    const months = [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
    ];
    const year = d.getFullYear();
    const month = months[d.getMonth()];
    const dayOfMonth = d.getDate();
    const imgSrc =
        'https://darebee.com/images/dailydare/' +
        `${year}/${month}${dayOfMonth}.jpg`;

    try {
        console.log('before login');
        const csrfKey = await login(cloudscraper);
        console.log('after login');
        console.log('csrf from login post', csrfKey);
        await newPost(
            cloudscraper,
            csrfKey,
            '116148-dailydare-nerdfitness-edition',
            `<p>
                <img
                    data-loaded="true"
                    data-ratio="141.51"
                    src="${imgSrc}"
                    width="930">
                </img>
            </p>`
        );
        console.log('all done');
    } catch (e) {
        console.log('some kind of error');
        console.log('e', e);
    }
}

postNewChallenge();
