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
        console.log('/login 패스로 GET 요청됨.');

        res.render('login');
    });

    router.route('/login').post(passport.authenticate('local-login', {       
        successRedirect: '/userInfo',
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
    
    router.route('/userInfo').get(function(req, res) {
        console.log('/userInfo 패스로 GET 요청됨.');

        if (!req.session.user) {
            console.log("로그인이 안되어있습니다.");
            res.render('login');
        }
        
        var database = req.app.get('database');
        var email = req.session.user.email;
        if(database) {
            database.UserModel.findByEmail(email, function(err, results) {
                    if(err) {
                       console.log('에러 발생.');
                       res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                       res.write('<h1>에러 발생</h1>');
                       res.end();
                    } 

                    if(results) {
                        console.dir(results);

                        var accessToken = results[0]._doc.accessToken;
                        var userSeqNumber = results[0]._doc.userSeqNumber;

                        var option = {
                            method : "GET",
                            url : "https://testapi.openbanking.or.kr/v2.0/user/me",
                            headers : {
                                'Authorization' : 'Bearer ' + accessToken
                            },
                            qs : {
                                user_seq_no : userSeqNumber
                            }
                        }
                        
                        request(option, function(error, response, body) {
                            var context = JSON.parse(body);
                            userInfoRender(req, res, context);
                        });
                    } else {
                        console.log('에러 발생.');
                        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                        res.write('<h1>조회된 사용자 정보 없음.</h1>');
                        res.end();
                    }
                });
        } else {
            console.log('에러 발생.');
            res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
            res.write('<h1>데이터베이스 연결 안됨.</h1>');
            res.end();
        }
    });
    
    router.route('/balance').get(function(req, res) {
        console.log('/balance 패스로 GET 요청됨.');
        
        if (!req.session.user) {
            console.log("로그인이 안되어있습니다.");
            res.render('login');
        }
        
        var fintechUseNumber = req.query.fintech_use_num;
        var database = req.app.get('database');
        var email = req.session.user.email;
        if(database) {
            database.UserModel.findByEmail(email, function(err, results) {
                    if(err) {
                       console.log('해당 이메일 DB 조회 중 에러 발생.');
                       res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                       res.write('<h1>에러 발생</h1>');
                       res.end();
                    } 

                    if(results) {
                        console.dir(results);
                        console.log(fintechUseNumber);

                        var accessToken = results[0]._doc.accessToken;
                        var option = {
                            method : "GET",
                            url : "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
                            headers : {
                                'Authorization' : 'Bearer ' + accessToken
                            },
                            qs : {
                                bank_tran_id : 'M202111802U' + Math.floor(Date.now() / 10000),
                                fintech_use_num : fintechUseNumber,
                                tran_dtime : '20190910101921'
                            }
                        }
                        
                        request(option, function(error, response, body) {
                            var context = JSON.parse(body);
                            console.log(context);
                            console.log(context.balance_amt);
                            balanceRender(req, res, context);
                        });
                    } else {
                        console.log('조회된 사용자 정보 없음.');
                        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
                        res.write('<h1>조회된 사용자 정보 없음.</h1>');
                        res.end();
                    }
                });
        } else {
            console.log('DB 연결 중 에러 발생.');
            res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
            res.write('<h1>데이터베이스 연결 안됨.</h1>');
            res.end();
        }
    });
}

var userInfoRender = function(req, res, context) {
    req.app.render('userInfo', context, function(err, html) {
        if(err) {
            console.error('뷰 렌더링 중 에러 발생 : ' + err.stack);
            console.log('에러 발생.');

            // 아래 코드를 함수로 만들어서 처리하면 더 깔끔함
            res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
            res.write('<h1>뷰 렌더링 중 에러 발생</h1>');
            res.write('<br><p>' + err.stack + '<p>');
            res.end();
        }

        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
        res.end(html);
    });
}

var balanceRender = function(req, res, context) {
    req.app.render('balance', context, function(err, html) {
        if(err) {
            console.error('뷰 렌더링 중 에러 발생 : ' + err.stack);
            console.log('뷰 렌더링 에러 발생.');

            // 아래 코드를 함수로 만들어서 처리하면 더 깔끔함
            res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
            res.write('<h1>뷰 렌더링 중 에러 발생</h1>');
            res.write('<br><p>' + err.stack + '<p>');
            res.end();
        }

        res.writeHead(200, {"Content-Type":"text/html;charset=utf8"});
        res.end(html);
    });
}