var apiKey = require('../config/apiKey');
var request = require('request');

module.exports = function(router, passport) { // router는 app 객체를 인자로 받은 것
    console.log('user_passport 호출됨.');
    
    router.route('/').get(function(req, res) {
        console.log('/signup 패스로 GET 요청됨.');

        res.render('signup');
        //res.redirect('/public/signup.html');
    });
    //===== 회원가입과 로그인 라우팅 함수 =====//
    router.route('/login').get(function(req, res) {
        console.log('/signin 패스로 GET 요청됨.');

        res.redirect('/public/login.html');
    });

    router.route('/login').post(passport.authenticate('local-login', {       
        successRedirect: '/public/index.html',
        failureRedirect: '/login',
        failureFlash: true
    }));
    
    
    router.route('/signup').get(function(req, res) {
        console.log('/signup 패스로 GET 요청됨.');

        res.render('signup');
        //res.redirect('/public/signup.html');
    });

    router.route('/signup').post(passport.authenticate('local-signup', {
        successRedirect: '/public/404.html',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    router.route('/logout').get(function(req, res) {
        console.log('/logout 패스로 GET 요청됨.');

        req.logout(); // req.user에 들어있는 로그인 세션 삭제
        res.redirect('/');
    });
        
    router.route('/authorize').get(function(req, res) {
        console.log('사용자 인증 후 /authorize 패스로 GET 요청됨.');
        
        var authCode = req.query.code;
        console.log(authCode);
        var option = {
            url: 'https://testapi.openbanking.or.kr/oauth/2.0/token',
            method:'POST',
            header : {
                'Content-Type' : 'application/x-www-form-urlencoded'
            },
            form:{
                code : authCode,
                client_id : apiKey.clientId, 
                client_secret : apiKey.clientSecret,
                redirect_uri : 'http://localhost:3300/authorize',
                grant_type : 'authorization_code'
            }
        }
        
        request(option, function(error, response, body) {
            if (error) {
                console.log(error);
            } else {
                console.log(body);
                var accessValues = JSON.parse(body);
                res.render('resultChild', {data : accessValues})
            }
        });
    });
}