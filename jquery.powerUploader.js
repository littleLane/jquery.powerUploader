/**
 * @Name:		基于webUploader上传插件封装组件
 * @Revison:	0.1
 * @Date:		1/12/2016
 * @Author:		zzl
 * @Use:		上传封装插件
 * @Description：对webUploader进行进一步的封装
 * */
(function ($, window) {
	var applicationPath = window.applicationPath === "" ? "" : window.applicationPath || "../..";
	var fileQueuedIndex = 0;
	
	//获取一个随机的5位十六进制
　　	function get5Random() {
　　		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
　　	}

　　	//初始化上传插件
    function initWebUpload(item, options) {
    	//检测浏览器的兼容性
        if (!WebUploader.Uploader.support()) {
            var error = "上传控件不支持您的浏览器！请尝试升级flash版本或者使用Chrome引擎的浏览器。<a target='_blank' href='http://se.360.cn'>下载页面</a>";
            
            if (window.console) {
                window.console.log(error);
            }
            
            $(item).text(error);
            
            return;
        }
        
        //默认参数
        var defaults = {
            hiddenInputId: "uploadifyHiddenInputId", 	//隐藏的input框装载文件id
            onAllComplete: function (event) {}, 		//当所有file都上传后执行的回调函数
            onComplete: function (event) {},			//每上传一个file的回调函数
            onProgress: function(event) {},				//上传过程事件
            innerOptions: {},
            fileNumLimit: 300,
            fileSizeLimit: 1000 * 1024 * 1024,
            fileSingleSizeLimit: 1000 * 1024 * 1024,
            btn: ["选择文件", "开始上传"],					//上传文件的按钮
            showProgress: true,							//显示上传进度条
            auto: true,
            duplicate: true,
            formData: {}
        };
 
        var opts = $.extend({}, defaults, options),		//综合参数
        	hdFileData = $("#" + opts.hiddenInputId),	//隐藏的input框装载文件id
        	target = $(item),							// 容器
        	pickerid = "";
        
        if (typeof guidGenerator36 != 'undefined'){		//设置一个唯一ID
            pickerid = guidGenerator36();
        } else {
            pickerid = get5Random();
        }
 
        var uploaderStrdiv  = '<div>';
        	uploaderStrdiv += 		'<ul id="webUploadFileList" class="webUploadFileList"></ul>';
        	uploaderStrdiv +=		'<div class="btns">';
        	
        	//设置按钮
        	opts.btn.forEach(function(key, val){
        		if(val == 0){
        			uploaderStrdiv +=			'<div id="' + pickerid + '">'+ key +'</div>';
        		}else{
        			uploaderStrdiv +=			'<a id="ctlBtn" class="webuploader-pick">'+ key +'</a>';
        		}
        	});
        	
        	uploaderStrdiv +=		'</div>';
            uploaderStrdiv += '</div>';
        
        target.append(uploaderStrdiv);
  
        var $list = target.find('#webUploadFileList'),	
            $btn = target.find('#ctlBtn'),				//这个留着，以便随时切换是否要手动上传
            state = 'pending',
            uploader,
        	jsonData = {
        		fileList: []
        	};
        
        var webuploaderoptions = $.extend({
            swf: "/common/js/webuploader/Uploader.swf",							//swf文件路径
            server: "/uploadMultiFile",			//文件接收服务端。
            pick: '#' + pickerid,												//选择文件的按钮(可选),内部根据当前运行是创建，可能是input元素，也可能是flash.
            resize: false,														//不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
            fileNumLimit: opts.fileNumLimit,
            fileSizeLimit: opts.fileSizeLimit,
            fileSingleSizeLimit: opts.fileSingleSizeLimit,
            auto: opts.auto,
            duplicate: opts.duplicate,
            chunked: opts.chunked,
            formData: opts.formData,
            accept: {}
        }, opts.innerOptions);
        
        webuploaderoptions.accept = {
        	extensions: opts.fileTypeExts,
        	mimeTypes: opts.fileMimeTypes
        }
        
        var uploader = WebUploader.create(webuploaderoptions);
        
　　　　　//回发时还原hiddenfiled的保持数据
　　　　　var fileDataStr = hdFileData.val();

　　　　　if (fileDataStr && opts.PostbackHold) {
　　　　　　　	jsonData = JSON.parse(fileDataStr);

　　　　　		$.each(jsonData.fileList, function (index, fileData) {
　　　　　　	var newid = get5Random();
　　　　　　		fileData.queueId = newid;
		　　		$list.append('<div id="' + newid + '" class="item"><div class="info">' + fileData.name + '</div><div class="state">上传完成</div><div class="del"></div></div>');
		　　	});
　　　　　　	
　　　　　　	hdFileData.val(JSON.stringify(jsonData));
　　　　　}
		
		//队列事件
	    uploader.on('fileQueued', function (file) {
	    	var strHtml  = "<li id='"+ file.id +"'>";
	    		strHtml += 		"<em class='order'>附件 "+ (++fileQueuedIndex) +"</em>.<a href='javascript:;' fileName='"+ file.name +"'>"+ file.name +"</a><em class='state'>等待上传...</em><i class='operate'>移除</i>";
	    		strHtml += "</li>";
	    	
	        $list.append(strHtml);
	        
	        //对文件列表中的单个文件进行操作
	        $(".operate").unbind("click").click(function(){
	        	var thisFile = $(this).parent("li"),
	        		thisFileId = thisFile.attr("id");
	        	
	        	if(state == "pending"){
	        		uploader.removeFile(thisFileId);
	        	}else if(state === 'done'){
	        		thisFile.remove();
	            }else if(state === 'error'){
	            	uploader.retry(uploader.getFile(thisFileId));
	            }
	        });
	    });
	 
	    //进度条事件
        uploader.on('uploadProgress', function (file, percentage) {
            var $li = target.find('#' + file.id),
                $percent = $li.find('.progress');
                
            var strHtml  = "<div class='webUpload_progress_box webUpload_progress' style='display:none;'>";
            	strHtml += 		"<p>";
            	strHtml += 			"<span class='progress_bar'><em class='progress'></em></span>";
            	strHtml += 			"<i class='percent'>0%</i>";
            	strHtml += 			"<i class='webuploader-pick cancel-btn'>取消上传</i>";
            	strHtml += 		"</p>";
            	strHtml += "</div>";
		
            // 避免重复创建
            if ($percent.length == 0) {
                $percent = $(strHtml).appendTo($li).find('.progress');
                
                $(".cancel-btn").unbind("click").click(function(){
                	var $parentLiGid = $(this).parents("li").attr("id");
                	var thisFile = uploader.getFile($parentLiGid);
                	
                	if(state === "uploading"){
                		uploader.stop(thisFile);
                		$(this).text("继续上传");
                		state = "paused";
                	}else if(state === "paused"){
                		uploader.upload(thisFile);
                	}
                });
                
                if(opts.showProgress){
                	$(".webUpload_progress_box").show();
                }
            }
 
            $li.find('em.state').text('上传中');
            $li.find('i.operate').text('');
            $li.find(".percent").text(Math.round(percentage * 100) + '%');
            $percent.css('width', percentage * 100 + '%');
            
            var fileEvent = {
                queueId: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                filePercent: percentage
            };
            
            opts.onProgress(fileEvent);
        });
        
        //上传成功事件
        uploader.on('uploadSuccess', function (file, response) {
        	state = 'done';
        	var $file = target.find('#' + file.id);
        	
        	$file.find('em.state').text('上传完成');
        	$file.find('i.operate').text('删除');
            
            var fileEvent = {
                queueId: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                filePath: response.filePath
            };
            
            jsonData.fileList.push(fileEvent)
            opts.onComplete(fileEvent);
 
        });
        
        //上传出错事件	
        uploader.on('uploadError', function (file) {
        	state = 'error';
        	var $file = target.find('#' + file.id);
        	
        	$file.find('em.state').text('上传出错');
        	$file.find('i.operate').text('重新上传');
        });
 
        //全部完成事件
        uploader.on('uploadComplete', function (file) {
        	state = 'complete';
        	//target.find('#' + file.id).find('.webUpload_progress_box').fadeOut();
            
            var fp = $("#" + opts.hiddenInputId);
            fp.val(JSON.stringify(jsonData));
            opts.onAllComplete(jsonData.fileList);
        });
        
        //上传显示状态
        uploader.on('all', function (type) {
            if (type === 'startUpload') {
                state = 'uploading';
            } else if (type === 'stopUpload') {
                state = 'paused';
            } else if (type === 'uploadFinished') {
                state = 'done';
            }
 
            if (state === 'uploading') {
                $btn.text('暂停上传');
            } else {
                $btn.text('开始上传');
            }
        });
 
        //按钮点击开始或暂停上传事件
        $btn.on('click', function () {
            if (state === 'uploading') {
                uploader.stop( uploader.getFiles("progress") );
            } else {
                uploader.upload("interrupt");
            }
        });
        
        //删除文件
        /*$list.on("click", ".del", function () {
            var $ele = $(this);
            var id = $ele.parent().attr("id");
            var deletefile = {};
            $.each(jsonData.fileList, function (index, item) {
                if (item && item.queueId === id) {
　　　　　　　　　　　　　　uploader.removeFile(uploader.getFile(id));// 不要遗漏
                    deletefile = jsonData.fileList.splice(index, 1)[0];
                    $("#" + opts.hiddenInputId).val(JSON.stringify(jsonData));
                    $.post(applicationi + "/Webploader/Delete", {  'filepathname': deletefile.filePath }, function (returndata) {
                        $ele.parent().remove();
                    });
                    return;
                }
            });
        });*/
    }
 
    $.fn.powerUploader = function (options) {
        var ele = this;
        initWebUpload(ele, options);
    }
})(jQuery, window);