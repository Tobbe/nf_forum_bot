#!/usr/bin/env node

// https://github.com/request/request-promise#api-in-detail

const fs = require('fs');
const common = require('./common');
const login = require('./login');

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
    .get(common.NF_TOPIC_URL + '/115008-avatar-the-last-darebender-darebee-pvp-challenge/&do=findComment&comment=2582077')
    .then(htmlString => {
      const csrfKey = common.getNamedInputValue(htmlString, 'csrfKey');
      console.log('post csrfKey', csrfKey);
      return csrfKey;
    })
}

function updatepost(scraper, csrfKey) {
  scraper
    .get(
      common.NF_TOPIC_URL + '/115008-avatar-the-last-darebender-darebee-pvp-challenge/&do=editComment&comment=2582077&csrfKey=' +
        csrfKey
    )
    .then(htmlString => {
      const plupload = common.getNamedInputValue(htmlString, "plupload");
      const comment_value_upload = common.getNamedInputValue(
        htmlString,
        "comment_value_upload"
      );

      console.log("got ids", plupload, comment_value_upload);

      // comment_value: "<p>This pvp was a lot of fun. Anyone want to go another round for when the next challenge starts at Sunday/Monday? I&#39;d be very happy to set up a new thread for it.</p>",
      scraper
        .post(
          common.NF_TOPIC_URL + "/115008-avatar-the-last-darebender-darebee-pvp-challenge/&do=editComment&comment=2582077",
          {
            form: {
              form_submitted: 1,
              csrfKey,
              // comment_value: "Test",
              comment_value: "<p>This pvp was a lot of fun. Anyone want to go another round for when the next challenge starts at Sunday/Monday? I&#39;d be very happy to set up a new thread for it.</p>",
            },
          }
        )
        .then(postResponse => {
          console.log("post update done");
          console.log(postResponse.substr(0, 500));
        })
        .catch(e => {
          console.log("post update error");
          console.log("e", e.substr(0, 500));
        });
    });
}

(async () => {
  try {
    console.log("before login");
    await login(cloudscraper);
    console.log("after login");
    const csrf = await loadPost();
    console.log('csrf from loaded post', csrf);
    updatepost(cloudscraper, csrf);
  } catch (e) {
    console.log('some kind of error');
    console.log('e', e);
  }
})();
