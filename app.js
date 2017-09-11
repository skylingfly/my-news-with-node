var http = require('http');
var path = require('path');
var mime = require('mime');
var fs = require('fs');
var url = require('url'); //get
var querystring = require('querystring'); //post 整合buffer
var __ = require('underscore');

var server = http.createServer(function (req, res) {
            var reqUrl = req.url.toLowerCase();
            reqUrl = (reqUrl === '/favicon.ico' ? '/resources/images/y18.gif' : reqUrl); //判断是否为icon返回另外的路径因为icon不一致
            var method = req.method.toLowerCase();
            var urlobj = url.parse(reqUrl, true);
            //封装
            render(res);

            if ((reqUrl === '/' || reqUrl === '/index') && method === 'get') {
                //读取data.json
                read_data(function (list) {
                    res.render(path.join(__dirname, 'views', 'index.html'), { //
                        title: 'news list',
                        list: list
                    })
                });


            } else if ((urlobj.pathname === '/details') && method === 'get') {
                var id = parseInt(urlobj.query.id); //iddatajson为string
                read_data(function (list) {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].id === id) {
                            var model = list[i];
                            break;
                        }
                    }
                    res.render(path.join(__dirname, 'views', 'details.html'), {
                        model: model
                    })
                })


            } else if ((reqUrl === '/submit') && method === 'get') {
                res.render(path.join(__dirname, 'views', 'submit.html'))

            } else if (reqUrl.startsWith('/resources')) {
                res.render(path.join(__dirname, reqUrl))
            } else if (reqUrl.startsWith('/add') && method === 'get') {
                // 表示 get 方式提交一条新闻
                read_data(function (list) {
                    urlobj.query.id = list.length; //存入ID
                    list.push(urlobj.query); //生成json数据
                    write_data(list);
                    res.statusCode = 302; //跳转状态码为302
                    res.statusMessage = 'OK';
                    res.setHeader('Location', '/');
                    res.end();
                })

            } else if (req.url === '/add' && method === 'post') {
                // 表示 post 方式提交一条新闻
                //同理先 读取datajson,将新数据加到加到数组中
                //可以直接把chunk当成字符串处理 然后var obj= querystring.parse(rawdata);
                //var arr=''; 
                // req.on('data', function (chunk) {
                //     //arr+=chunk;
                // });
                //obj = querystring.parse(arr);//转换为键值对对象
                get_postdata(req,function (obj) {
                read_data(function (list) {
                        obj.id = list.length; //存入ID
                        list.push(obj); //生成json数据
                        write_data(list);
                        res.statusCode = 302; //跳转状态码为302
                        res.statusMessage = 'OK';
                        res.setHeader('Location', '/');
                        res.end();
                    })

                })
                
                }
                else {
                    res.end('404');
                }
            }); server.listen(666, function () {
            console.log('http//:localhost:666')
        });


        //path.join(__dirname, 'views', 'index.html'
        function render(res) {
            res.render = function (pathname, tpldata) {
                fs.readFile(pathname, function (err, data) {
                    if (err) {
                        res.statusCode('404');
                        res.statusMessage('Not found');
                        res.end();
                        return;
                    };
                    if (tpldata) {
                        data = __.template(data.toString())(tpldata); //模板代替生成新数据
                    }
                    res.setHeader('content-Type', mime.lookup(pathname));
                    res.end(data);
                })
            };
        };
        //封装read_data
        function read_data(callback) {
            fs.readFile(path.join(__dirname, 'data', 'data.json'), 'utf8', function (err, data) {
                if (err && err.code !== 'ENOENT') {
                    throw err
                };
                var list = JSON.parse(data || '[]'); //如果json数据为空则返回为[],如果不计算则为undefined
                //存到data.json
                callback(list);

            })
        };
        //封装write_data
        function write_data(list) {
            fs.writeFile(path.join(__dirname, 'data', 'data.json'), JSON.stringify(list), 'utf8', function (err) {
                if (err) {
                    res.end('404');
                    throw err;
                }
                //跳转首页

            });
        };
        //
        function get_postdata(req,callback) {
            var arr = [];
            req.on('data', function (chunk) {
                arr.push(chunk);
            });
            req.on('end', function () {
                var obj = Buffer.concat(arr); //返回buffer大对象
                obj = obj.toString('utf8'); //返回字符串buffer的特有方法
                obj = querystring.parse(obj); //转换为键值对对象
                console.log(obj);
                callback(obj);
            });
        }