define(function(require,exports){
    var Service = require('service');
    var fnAssemble = require('fnAssemble');
    var photoSuffix='!square.75';
    var ratyOptions={ 
        hints:['很差','差','一般','好','很好'],
        starOff  : 'star-off.png',
        starOn   : 'star-on.png',
        readOnly :true,
        path: window.ratyPath
    };
    var newsTpl='<div class="baby-news-item">'+
                        '<div class="baby-news-detail clearfix">'+
                            '<div class="baby-news-face">'+
                                '<img src="{avatar}" />'+
                            '</div>'+
                            '<div class="baby-news-info">'+
                                '<p class="baby-news-txt">{txt}</p>'+
                            '</div>'+
                        '</div>'+
                        '<div class="baby-news-review">{reviews}</div>'+
                        '<div class="baby-news-media">'+
                            '<div class="baby-news-photo">{photos}</div>'+
                            '<div class="baby-news-video">{videos}</div>'+
                        '</div>'+
                        '<div class="baby-news-handle">'+
                            '<p class="baby-news-time">{time} 来自{identity}</p>'+
                            '<a href="javascript:;" class="baby-news-del" data-uuid="{uuid}" data-owner="{owner}">删除</a>'+
                        '</div>'+
                    '</div>';

    var Tweet = {
        newsTpl:newsTpl,
        //绑定宝宝动态
        bindBabyNews:function(){
            var self=this,$book_wrapper=self.$book_wrapper,zIndex=99,tpl,student=self.data.student,newsTpl=self.newsTpl;

            //添加qq表情的样式
            if( $('.book-qqface-style').length == 0 ){
                $('head').append($('<link type="text/css" class="book-qqface-style" rel="stylesheet" href="'+window.qqFaceCssPath+'" />'));
            }       
            //点击删除动态
            $book_wrapper.delegate('.book-limit-parent .baby-news-del','click',function(e){
                var $target=$(e.currentTarget),$parent=$target.closest('.baby-news-item'),
                    uuid=$target.attr('data-uuid'),owner=$target.attr('data-owner');

                
                self.xhrTweetDel({id:uuid},function(){
                    $parent.remove();
                });
                
                //点击上传图片、视频图标  显示层
            }).delegate('.book-limit-parent .baby-news-upimg,.book-limit-parent .baby-news-upvideo','click',function(e){
                var $target=$(e.currentTarget),$parent=$target.closest('.page'),selector=$target.attr('data-layer');
                //console.log(zIndex);
                $parent.find(selector).css('zIndex',++zIndex).show();

                //关闭上传层
            }).delegate('.book-limit-parent .easy-layer-close','click',function(e){
                var $target=$(e.currentTarget),$parent=$target.closest('.easy-layer');

                $parent.hide().find('.news-photo-box').remove();

                //点击动态发布
            }).delegate('.book-limit-parent .baby-news-btn','click',function(e){
                var $target=$(e.currentTarget),$parent=$target.closest('.page'),tweetData,record,status=$parent.attr('data-status');

                if(status != 'success'){
                    fnAssemble.message('正在加载页面,请稍后！');
                    return;
                }
                record = self.createTweetRecord(e);
                if(record.content.text == ''){
                    fnAssemble.message('请填写内容！');
                    return;
                }
                console.log('创建动态 ',record);
                self.xhrTweetCreate(record,function(id){
                    record.id = id;
                    tweetData = self.buildTweetData(record);
                    self.emptyData(e);
                    $parent.find('.baby-news-list').prepend(fnAssemble.substitute(newsTpl,tweetData));
                });

                //点击删除图片
            }).delegate('.book-limit-parent .news-photo-del','click',function(e){
                var $target=$(e.currentTarget),$parent=$target.closest('.news-photo-box');

                $parent.remove();

            }).delegate('.book-limit-parent .baby-news-upimg input','change',function(e){
                self.uploadTweetPhoto(e);

            }).delegate('.book-limit-parent .baby-news-upvideo input','change',function(e){
                self.uploadTweetVideo(e);

            });



        },
        //清空发布框数据
        emptyData:function(e){
            var $target=$(e.currentTarget),$textarea=$target.closest('.news-pulisher-box').find('.baby-news-textarea'),
                $page=$target.closest('.page');

            $page.find('.easy-layer').hide();
            $page.find('.news-temp-content').html('');
            $textarea.val('');

        },
        //异步载入宝宝动态数据
        syncTweetUI:function(view,successCallback){
            var self=this,$book_wrapper=self.$book_wrapper,$pageL,$pageR,page,
                studentid=self.data.studentid,bookid=self.data.book.id,data,status,
                newsTpl=self.newsTpl;

            console.log('进入宝宝动态页面：',view);
            $pageL = $book_wrapper.find('.p'+view[0]);
            $pageR = $book_wrapper.find('.p'+view[1]);
            page = parseInt($pageL.attr('data-page'),10);
            status = $pageL.attr('data-status');



            //右边 绑定QQ表情
            self.bindQQface($pageR);

            if(status == 'success'){
                console.log('页面 '+page+' 数据已经获取');
                return;
            }
            console.log('准备获取第 '+page+' 页 ');
            data = {
                studentid:studentid,
                bookid:bookid,
                _page:page+1,
                _pagesize:6
            }
            //show loading
            $('.book-tweet-wrapper[data-page="'+page+'"]').find('.baby-news-list').html('<div class="baby-news-loading">正在载入动态...</div>');
            self.xhrTweetList(data,renderTweetUI);

            function renderTweetUI(tweetList){
                var tweet,arrL=[],arrR=[],len=tweetList.length,data;

                $pageL.attr('data-status','success');
                $pageR.attr('data-status','success');
                
                //$pageR.attr('data-status','success');
                for(var i=0;i<3;i++){
                    tweet = tweetList[i];
                    if(tweet){
                        data = self.buildTweetData(tweet);
                        arrL.push(fnAssemble.substitute(newsTpl,data));
                    }
                }
                for(var i=3;i<len;i++){
                    tweet = tweetList[i];
                    if(tweet){
                        data = self.buildTweetData(tweet);
                        arrR.push(fnAssemble.substitute(newsTpl,data));
                    }
                }
                console.log('arrL,arrR',arrL,arrR);
                console.log('$pageL:',$pageL);
                $pageL.find('.baby-news-list').html(arrL.join(''));
                $pageR.find('.baby-news-list').html(arrR.join(''));
                self.bindReadRaty($pageL);
                self.bindReadRaty($pageR);
                successCallback && successCallback();
                
            }

            
        },
        bindQQface:function($parent){
            var self=this,id,
                $emotion=$parent.find('.baby-news-emotion').eq(0),
                $textarea=$emotion.closest('.news-pulisher-box').find('.baby-news-textarea');
           
            id = self.random(1,1000);
            //绑定QQ表情
            $emotion.qqFace({
                id : 'facebox'+id, //表情盒子的ID
                assign:$textarea.attr('id'), //给那个控件赋值
                path:window.qqFacePath //表情存放的路径
            });
            
        },
        createTweetRecord:function(e){
            var self=this,
                pageid=self.data.pageCodeMap['tweet'],
                $target=$(e.currentTarget),$parent=$target.closest('.page'),
                images=[],videos=[],text,time,content,record,tweetData;

            $parent.find('.news-photo-box img').each(function(i,item){
                var url=item.src;

                images.push({url:url});
            });

            $parent.find('.news-video-box video').each(function(i,item){
                var url=item.src;

                videos.push({url:url});
            });
       
            text = $parent.find('.baby-news-textarea').val();
            time = new Date().getTime()/1000;

            content = {
                text : text,
                images:images,
                videos:videos,
                reviews:null,
                owner:4//家长
            };
            //..........bookArchives
            record = self.bookArchives.createEmptyCntRecord(pageid);
            record.content = content;
            record.createtime = time;

            return record;
            

        },
        buildTweetData:function(tweet){
            var self=this,data,content,avatar,time,photos='',videos='',uuid,txt,reviews,
                student=this.data.student,owner,identity;


            content = tweet.content || {};
            avatar = fnAssemble.getAvatar(student.avatar,'!32');
            time = new Date(tweet.createtime*1000).format("yyyy-MM-dd hh:mm:ss");
            photos = gatherPhotos(content.images);
            reviews = gatherReviews(content.reviews);
            videos = gatherVideos(content.videos);
            
            owner = content.owner;//区别老师和家长
            if(owner == 4){
                identity = '家长';
            }else{ 
                identity = '老师';
            }
            
            txt = fnAssemble.replace_em(content.text);
            uuid = tweet.id;
            data = {
                    uuid:uuid,
                    avatar:avatar,
                    txt:txt,
                    time:time,
                    photos:photos,
                    videos:videos,
                    reviews:reviews,
                    identity:identity,
                    owner:owner
            };

            return data;

            function gatherVideos(videos){
                var frag=[],item,big_url,url,videos= videos || [];
               
                for(var i=0;i<videos.length;i++){
                    frag.push('<video src="'+videos[i].url+'" preload="meta" class="uplaod-video-show" controls="controls"></video>');
                }

                return frag.join('');
                
            }

            function gatherPhotos(images){
                var frag=[],item,big_url,url;
                images = images || [];
                for(var i=0;i<images.length;i++){
                    item = images[i];
                    url = item.url;
                    big_url = fnAssemble.removePhotoSuffix(url);
                    frag.push('<a href="'+big_url+'" rel="group" target="_blank"><img src="'+item.url+'" ></a>');
                }

                return frag.join('');
                
            }
            function gatherReviews(reviews){
                var frag=[],item,tpl;

                tpl='<p class="baby-review-box">'+
                        '<span class="baby-review-name">'+
                            '<em class="baby-review-txt">{title}</em>:'+
                        '</span>'+
                        '<span class="baby-review-raty" data-score="{score}"></span>'+
                    '</p>';
                reviews = reviews || [];
                for(var i=0;i<reviews.length;i++){
                    item = reviews[i];
                    frag.push(fnAssemble.substitute(tpl,item));
                }

                return frag.join('');
            }
        },
        bindReadRaty:function($parent){
            var self=this;

            $parent.find('.baby-review-raty').each(function(i,item){
                var score = $(item).attr('data-score');

                ratyOptions.score = score;
                $(item).raty(ratyOptions);
            });
        },
        //uploadTweetVideo
        //上传Tweet视频
        uploadTweetVideo:function(event) {
            var self=this,frag,tpl,timestamp,
                $target = $(event.currentTarget),
                $page = $target.closest('.page'),
                $form = $target.closest('form'),
                value = $target.val(),
                layer=$target.closest('a').attr('data-layer'),
                $layer=$page.find(layer);

            if(!value){
                return;
            };
            timestamp = new Date().getTime();
            tpl='<span class="news-video-box" data-timestamp="{timestamp}"></span>';
            frag = tpl.replace('{timestamp}',timestamp);  
            $layer.find('.news-temp-content').append(frag);
            new Uploader($form, {
                $box:$layer.find('[data-timestamp='+timestamp+']'),
                mode:4,
                success: function(result) {
                    var url = result.url;
                    console.log('upload ok result',result);
                },
                close: function() {
                   this._$box.remove();
                },
                error: function(result) {
                    this._$box.remove();
                    console.warn('error ',result);
                    fnAssemble.message('上传失败！ '+result.message,'error');
                }
            }).submit();
     
          
        },
        //上传Tweet图片
        uploadTweetPhoto:function(event) {
            var self=this,frag,tpl,timestamp,
                $target = $(event.currentTarget),
                $page = $target.closest('.page'),
                $form = $target.closest('form'),
                value = $target.val(),
                layer=$target.closest('a').attr('data-layer'),
                $layer=$page.find(layer);

            if(!value){
                return;
            };
            timestamp = new Date().getTime();
            tpl='<span class="news-photo-box" data-timestamp="{timestamp}"></span>';
            //var frag='<img src="face/xx.jpg" class="baby-photo-thumb">';//temp
            frag = tpl.replace('{timestamp}',timestamp);  
            $layer.find('.news-temp-content').append(frag);
            new Uploader($form, {
                $box:$layer.find('[data-timestamp='+timestamp+']'),
                suffix:photoSuffix,
                preview:true,
                override:true,
                mode:1,
                success: function(result) {
                    var url = result.url;
                    console.log('upload ok result',result);

                    console.log('url: ',url);
                   
                },
                close: function() {
                   this._$box.remove();
                },
                error: function(result) {
                    this._$box.remove();
                    console.warn('error ',result);
                    fnAssemble.message('上传失败！ '+result.message,'error');
                }
            }).submit();
     
          
        },
        /* 宝宝动态 */
        xhrTweetList: function(data,successCallback,failCallback) {
            var self=this;

            Service.xhrTweetList(data,function(result){
                var tweetList = result.data || [];
    
                if(successCallback){successCallback.call(self,tweetList);}
                
            },function(result){
                if(result.status==404){
                    successCallback && successCallback.call(self,[]);
                }else{
                    fnAssemble.message(result.message,'error');
                    self.xhrFailCallback(result);
                }
            });
        },
        xhrTweetDel: function(data,successCallback,failCallback) {
            var self=this;

            Service.xhrTweetDel(data,function(result){
                fnAssemble.message('宝宝动态删除成功','success');
                if(successCallback){successCallback.call(self);}
                
            },function(result){
                fnAssemble.message(result.message,'error');
                self.xhrFailCallback();
            });
        },
        xhrTweetCreate: function(data,successCallback,failCallback) {
            var self=this;

            Service.xhrTweetCreate(data,function(result){
                var id = result.data && result.data.id;
                fnAssemble.message('宝宝动态创建成功','success');
                if(successCallback){successCallback.call(self,id);}
                
            },function(result){
                fnAssemble.message(result.message,'error');
                self.xhrFailCallback();
            });
        }
    };

    return Tweet;
});