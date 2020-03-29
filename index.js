#!/usr/bin/env node

// https://github.com/request/request-promise#api-in-detail

const fs = require('fs');
const secrets = require('./secrets.json');

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

const NF_URL = 'https://rebellion.nerdfitness.com/';
const NF_TOPIC_URL = NF_URL + 'index.php?/topic/';

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

function getNamedInputValue(htmlString, name) {
  const input = htmlString.match(new RegExp(`<input .*?name="${name}".*?>`))[0];
  return input.match(/value="([^"]+)"/)[1];
}

function loadPost() {
  return cloudscraper
    .get(NF_TOPIC_URL + '115008-avatar-the-last-darebender-darebee-pvp-challenge/&do=findComment&comment=2582077')
    .then(htmlString => {
      const csrfKey = getNamedInputValue(htmlString, 'csrfKey');
      console.log('post csrfKey', csrfKey);
      return csrfKey;
    })
}

function updatepost(scraper, csrfKey) {
  scraper
    .get(
      "https://rebellion.nerdfitness.com/index.php?/topic/115008-avatar-the-last-darebender-darebee-pvp-challenge/&do=editComment&comment=2582077&csrfKey=" +
        csrfKey
    )
    .then(htmlString => {
      const plupload = getNamedInputValue(htmlString, "plupload");
      const comment_value_upload = getNamedInputValue(
        htmlString,
        "comment_value_upload"
      );

      console.log("got ids", plupload, comment_value_upload);
      fs.writeFile('./get_updatepost.html', htmlString, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });

      // comment_value: "<p>This pvp was a lot of fun. Anyone want to go another round for when the next challenge starts at Sunday/Monday? I&#39;d be very happy to set up a new thread for it.</p>",
      scraper
        .post(
          "https://rebellion.nerdfitness.com/index.php?/topic/115008-avatar-the-last-darebender-darebee-pvp-challenge/&do=editComment&comment=2582077",
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
          fs.writeFile('./post_updatepost.html', postResponse, (err) => {
            if (err) throw err;
            console.log('file written (post response)');
          });
        })
        .catch(e => {
          console.log("post update error");
          console.log("e", e.substr(0, 500));
        });
    });
}

function login() {
  return new Promise((resolve, reject) => {
    cloudscraper
      .get("https://rebellion.nerdfitness.com/login/")
      .then(htmlString => {
        const csrfToken = getNamedInputValue(htmlString, "csrfKey");
        console.log('login csrfToken', csrfToken);

        cloudscraper
          .post("https://rebellion.nerdfitness.com/login/", {
            form: {
              csrfKey: csrfToken,
              auth: secrets.USERNAME,
              password: secrets.PASSWORD,
              _processLogin: "usernamepassword",
              remember_me: 0,
            },
          })
          .then(htmlString => {
            fs.writeFile('./login_response', htmlString, (err) => {
              if (err) throw err;
              console.log('file written (login response)');
            });
            const csrfTokenLoggedIn = htmlString.match(/csrfKey=(.+?)["&]/)[1];
            console.log('csrfTokenLoggedIn', csrfTokenLoggedIn);
            resolve("logged in");

          })
          .catch(e => {
            console.log("inner error");
            console.log("e", e);
            reject("FAIL");
          });
      })
      .catch(e => {
        if (e instanceof CaptchaError) {
          console.log('captcha :(');
          // console.log(e.response.body.toString('utf8'));
        } else {
          console.log("error");
          console.log("e", e);
        }
        reject("FAIL");
      });
  });
}

(async () => {
  try {
    console.log("before login");
    await login();
    console.log("after login");
    const csrf = await loadPost();
    console.log('csrf from loaded post', csrf);
    updatepost(cloudscraper, csrf);
  } catch (e) {
    console.log('some kind of error');
    console.log('e', e);
  }
})();
