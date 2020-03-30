#!/usr/bin/env node

// https://github.com/request/request-promise#api-in-detail

const common = require('./common');
const login = require('./login');
const updatePost = require('./updatePost');
const loadThread = require('./loadThread');
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

function loadPost() {
    return cloudscraper
        .get(
            common.NF_TOPIC_URL +
                '/115008-avatar-the-last-darebender-darebee-pvp-challenge/&do=findComment&comment=2582077'
        )
        .then(htmlString => {
            const csrfKey = common.getNamedInputValue(htmlString, 'csrfKey');
            console.log('post csrfKey', csrfKey);
            return csrfKey;
        });
}

function calculateScores(posts) {
  // First two posts are just info posts. No scores in those (but there
  // are false positives)
  return posts.slice(2).reduce((scores, post) => {
    let score = scores[post.author.id] ? scores[post.author.id].score : 0;

    const $ = cheerio.load(post.message);
    $('blockquote').remove();
    const message = $('body').html();
    console.log('message without quotes', message);

    if (message.includes('&#x2714;')) {
      score += 2;
    }

    if (message.includes('&#x1F41D;')) {
      score += 1;
    }

    scores[post.author.id] = {
      name: post.author.name,
      score,
    };

    return scores;
  }, {})
}

function formatScores(scores) {
  return `
      <p>Current scores</p>
      <pre class="ipsCode">${JSON.stringify(scores, null, 4)}</pre>
      <p>
          Still working on my score-keeping script, so it&#x27;s a little rough
          around the edges. Please be gentle &#x1F600;
      </p>`;
}

async function updateScores() {
    try {
        console.log('before login');
        const csrfKey = await login(cloudscraper);
        console.log('after login');
        console.log('csrf from login post', csrfKey);
        const posts = await loadThread(
            cloudscraper,
            '116148-dailydare-nerdfitness-edition'
        );
        const scores = calculateScores(posts);
        console.log('scores', scores);
        const message = formatScores(scores);
        await updatePost(
            cloudscraper,
            csrfKey,
            '116148-dailydare-nerdfitness-edition',
            '2582735',
            message
        );
        console.log('all done');
    } catch (e) {
        console.log('some kind of error');
        console.log('e', e);
    }
}

async function postNewChallenge() {
    try {
        console.log('before login');
        const csrfKey = await login(cloudscraper);
        console.log('after login');
        console.log('csrf from login post', csrfKey);
        await updatePost(
            cloudscraper,
            csrfKey,
            '115008-avatar-the-last-darebender-darebee-pvp-challenge',
            '2582077',
            '<p>This PvP was a lot of fun. Anyone want to go another round ' +
                'for when the next challenge starts at Sunday/Monday? I&#39;d ' +
                'be very happy to set up a new thread for it!</p>'
        );
        console.log('all done');
    } catch (e) {
        console.log('some kind of error');
        console.log('e', e);
    }
}

updateScores();
