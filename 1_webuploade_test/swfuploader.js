(function(){
	/*
	Queue Plug-in
	
	Features:
		*Adds a cancelQueue() method for cancelling the entire queue.
		*All queued files are uploaded when startUpload() is called.
		*If false is returned from uploadComplete then the queue upload is stopped.
		 If false is not returned (strict comparison) then the queue upload is continued.
		*Adds a QueueComplete event that is fired when all the queued files have finished uploading.
		 Set the event handler with the queue_complete_handler setting.
		
	*/

	if (typeof(SWFUpload) === "function") {
		SWFUpload.queue = {};
		
		SWFUpload.prototype.initSettings = (function (oldInitSettings) {
			return function () {
				if (typeof(oldInitSettings) === "function") {
					oldInitSettings.call(this);
				}
				
				this.queueSettings = {};
				
				this.queueSettings.queue_cancelled_flag = false;
				this.queueSettings.queue_upload_count = 0;
				
				this.queueSettings.user_upload_complete_handler = this.settings.upload_complete_handler;
				this.queueSettings.user_upload_start_handler = this.settings.upload_start_handler;
				this.settings.upload_complete_handler = SWFUpload.queue.uploadCompleteHandler;
				this.settings.upload_start_handler = SWFUpload.queue.uploadStartHandler;
				
				this.settings.queue_complete_handler = this.settings.queue_complete_handler || null;
			};
		})(SWFUpload.prototype.initSettings);

		SWFUpload.prototype.startUpload = function (fileID) {
			

			this.queueSettings.queue_cancelled_flag = false;
			this.callFlash("StartUpload", [fileID]);
		};

		SWFUpload.prototype.cancelQueue = function () {
			this.queueSettings.queue_cancelled_flag = true;
			this.stopUpload();
			
			var stats = this.getStats();
			while (stats.files_queued > 0) {
				this.cancelUpload();
				stats = this.getStats();
			}
		};
		
		SWFUpload.queue.uploadStartHandler = function (file) {
			var returnValue;
			if (typeof(this.queueSettings.user_upload_start_handler) === "function") {
				returnValue = this.queueSettings.user_upload_start_handler.call(this, file);
			}
			
			// To prevent upload a real "FALSE" value must be returned, otherwise default to a real "TRUE" value.
			returnValue = (returnValue === false) ? false : true;
			
			this.queueSettings.queue_cancelled_flag = !returnValue;

			return returnValue;
		};
		
		SWFUpload.queue.uploadCompleteHandler = function (file) {
			var user_upload_complete_handler = this.queueSettings.user_upload_complete_handler;
			var continueUpload;
			
			if (file.filestatus === SWFUpload.FILE_STATUS.COMPLETE) {
				this.queueSettings.queue_upload_count++;
			}

			if (typeof(user_upload_complete_handler) === "function") {
				continueUpload = (user_upload_complete_handler.call(this, file) === false) ? false : true;
			} else if (file.filestatus === SWFUpload.FILE_STATUS.QUEUED) {
				// If the file was stopped and re-queued don't restart the upload
				continueUpload = false;
			} else {
				continueUpload = true;
			}
			
			if (continueUpload) {
				var stats = this.getStats();
				if (stats.files_queued > 0 && this.queueSettings.queue_cancelled_flag === false) {
					this.startUpload();
				} else if (this.queueSettings.queue_cancelled_flag === false) {
					this.queueEvent("queue_complete_handler", [this.queueSettings.queue_upload_count]);
					this.queueSettings.queue_upload_count = 0;
				} else {
					this.queueSettings.queue_cancelled_flag = false;
					this.queueSettings.queue_upload_count = 0;
				}
			}
		};
	}
	/*
		Cookie Plug-in
		
		This plug in automatically gets all the cookies for this site and adds them to the post_params.
		Cookies are loaded only on initialization.  The refreshCookies function can be called to update the post_params.
		The cookies will override any other post params with the same name.
	*/

	if (typeof(SWFUpload) === "function") {
		SWFUpload.prototype.initSettings = function (oldInitSettings) {
			return function (userSettings) {
				if (typeof(oldInitSettings) === "function") {
					oldInitSettings.call(this, userSettings);
				}
				
				this.refreshCookies(false);	// The false parameter must be sent since SWFUpload has not initialzed at this point
			};
		}(SWFUpload.prototype.initSettings);
		
		// refreshes the post_params and updates SWFUpload.  The sendToFlash parameters is optional and defaults to True
		SWFUpload.prototype.refreshCookies = function (sendToFlash) {
			if (sendToFlash === undefined) {
				sendToFlash = true;
			}
			sendToFlash = !!sendToFlash;
			
			// Get the post_params object
			var postParams = this.settings.post_params;
			
			// Get the cookies
			var i, cookieArray = document.cookie.split(';'), caLength = cookieArray.length, c, eqIndex, name, value;
			for (i = 0; i < caLength; i++) {
				c = cookieArray[i];
				
				// Left Trim spaces
				while (c.charAt(0) === " ") {
					c = c.substring(1, c.length);
				}
				eqIndex = c.indexOf("=");
				if (eqIndex > 0) {
					name = c.substring(0, eqIndex);
					value = c.substring(eqIndex + 1);
					postParams[name] = value;
				}
			}
			
			if (sendToFlash) {
				this.setPostParams(postParams);
			}
		};

	}



	/*
	A simple class for displaying file information and progress
	Note: This is a demonstration only and not part of SWFUpload.
	Note: Some have had problems adapting this class in IE7. It may not be suitable for your application.
	*/

	// Constructor
	// file is a SWFUpload file object
	// targetID is the HTML element id attribute that the FileProgress HTML structure will be added to.
	// Instantiating a new FileProgress object with an existing file will reuse/update the existing DOM elements
	function FileProgress(file, targetID) {
		console.log('FileProgress ',file, targetID)
		this.fileProgressID = file.id;

		this.opacity = 100;
		this.height = 0;
		

		this.fileProgressWrapper = document.getElementById(this.fileProgressID);
		if (!this.fileProgressWrapper) {
			this.fileProgressWrapper = document.createElement("div");
			this.fileProgressWrapper.className = "progressWrapper";
			this.fileProgressWrapper.id = this.fileProgressID;

			this.fileProgressElement = document.createElement("div");
			this.fileProgressElement.className = "progressContainer";

			var progressCancel = document.createElement("a");
			progressCancel.className = "progressCancel";
			progressCancel.href = "javascript:;";
			progressCancel.style.visibility = "hidden";
			progressCancel.appendChild(document.createTextNode(" "));

			var progressText = document.createElement("div");
			progressText.className = "progressName";
			//progressText.appendChild(document.createTextNode(file.name));
			progressText.innerHTML = '<span class="progress-icon progress-img-icon"></span>'+file.name;

			var progressBar = document.createElement("div");
			progressBar.className = "progressBarInProgress";

			var progressStatus = document.createElement("div");
			progressStatus.className = "progressBarStatus";
			progressStatus.innerHTML = "&nbsp;";

			var progressFileSize = document.createElement("div");
			progressFileSize.className = "progressFileSize";
			progressFileSize.innerHTML = formatSize(file.size);

			//var progressImaWrap = document.createElement("div");
			//progressImaWrap.className = "progressImgWrap";

			this.fileProgressElement.appendChild(progressCancel);
			this.fileProgressElement.appendChild(progressText);
			this.fileProgressElement.appendChild(progressFileSize);
			this.fileProgressElement.appendChild(progressStatus);
			this.fileProgressElement.appendChild(progressBar);
			//this.fileProgressElement.appendChild(progressImaWrap);

			this.fileProgressWrapper.appendChild(this.fileProgressElement);

			document.getElementById(targetID).appendChild(this.fileProgressWrapper);
		} else {
			this.fileProgressElement = this.fileProgressWrapper.firstChild;
			this.reset();
		}

		this.height = this.fileProgressWrapper.offsetHeight;
		this.setTimer(null);


	}
	/*FileProgress.prototype.setImage = function (image) {
		var imgWrapElement = this.fileProgressElement.childNodes[4];
		console.log('image ',image,imgWrapElement)
		var img = document.createElement('img');
		img.src = image.url+'!small.240';
		console.log('img ',img)
		
		imgWrapElement.style.display = 'block';
		imgWrapElement.appendChild(img);

	};*/
	FileProgress.prototype.setTimer = function (timer) {
		this.fileProgressElement["FP_TIMER"] = timer;
	};
	FileProgress.prototype.getTimer = function (timer) {
		return this.fileProgressElement["FP_TIMER"] || null;
	};

	FileProgress.prototype.reset = function () {
		this.fileProgressElement.className = "progressContainer";

		this.fileProgressElement.childNodes[3].innerHTML = "&nbsp;";
		this.fileProgressElement.childNodes[3].className = "progressBarStatus";
		
		this.fileProgressElement.childNodes[4].className = "progressBarInProgress";
		this.fileProgressElement.childNodes[4].style.width = "0%";
		
		this.appear();	
	};

	FileProgress.prototype.setProgress = function (percentage) {
		this.fileProgressElement.className = "progressContainer progress-pending";
		this.fileProgressElement.childNodes[4].className = "progressBarInProgress";
		this.fileProgressElement.childNodes[4].style.width = percentage + "%";

		this.appear();	
	};
	FileProgress.prototype.setComplete = function () {
		this.fileProgressElement.className = "progressContainer progress-complete";
		this.fileProgressElement.childNodes[4].className = "progressBarComplete";
		this.fileProgressElement.childNodes[4].style.width = "";
		var progressSuccess = document.createElement('div');
		progressSuccess.className = 'progressSuccess';
		this.fileProgressElement.appendChild(progressSuccess);
		/*var oSelf = this;
		this.setTimer(setTimeout(function () {
			oSelf.disappear();
		}, 10000));*/
	};
	FileProgress.prototype.setError = function () {
		this.fileProgressElement.className = "progressContainer progress-error";
		this.fileProgressElement.childNodes[4].className = "progressBarError";
		this.fileProgressElement.childNodes[4].style.width = "";

		var oSelf = this;
		/*this.setTimer(setTimeout(function () {
			oSelf.disappear();
		}, 5000));*/
	};
	FileProgress.prototype.setCancelled = function () {
		this.fileProgressElement.className = "progressContainer";
		this.fileProgressElement.childNodes[4].className = "progressBarError";
		this.fileProgressElement.childNodes[4].style.width = "";

		var oSelf = this;
		this.setTimer(setTimeout(function () {
			oSelf.disappear();
		}, 800));
	};
	FileProgress.prototype.setStatus = function (status) {
		this.fileProgressElement.childNodes[3].innerHTML = status;
	};

	// Show/Hide the cancel button
	FileProgress.prototype.toggleCancel = function (show, swfUploadInstance) {
		this.fileProgressElement.childNodes[0].style.visibility = show ? "visible" : "hidden";
		if (swfUploadInstance) {
			var fileID = this.fileProgressID;
			this.fileProgressElement.childNodes[0].onclick = function () {
				swfUploadInstance.cancelUpload(fileID);
				return false;
			};
		}
	};

	FileProgress.prototype.appear = function () {
		if (this.getTimer() !== null) {
			clearTimeout(this.getTimer());
			this.setTimer(null);
		}
		
		if (this.fileProgressWrapper.filters) {
			try {
				this.fileProgressWrapper.filters.item("DXImageTransform.Microsoft.Alpha").opacity = 100;
			} catch (e) {
				// If it is not set initially, the browser will throw an error.  This will set it if it is not set yet.
				this.fileProgressWrapper.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=100)";
			}
		} else {
			this.fileProgressWrapper.style.opacity = 1;
		}
			
		this.fileProgressWrapper.style.height = "";
		
		this.height = this.fileProgressWrapper.offsetHeight;
		this.opacity = 100;
		this.fileProgressWrapper.style.display = "";
		
	};

	// Fades out and clips away the FileProgress box.
	FileProgress.prototype.disappear = function () {

		var reduceOpacityBy = 15;
		var reduceHeightBy = 4;
		var rate = 30;	// 15 fps

		if (this.opacity > 0) {
			this.opacity -= reduceOpacityBy;
			if (this.opacity < 0) {
				this.opacity = 0;
			}

			if (this.fileProgressWrapper.filters) {
				try {
					this.fileProgressWrapper.filters.item("DXImageTransform.Microsoft.Alpha").opacity = this.opacity;
				} catch (e) {
					// If it is not set initially, the browser will throw an error.  This will set it if it is not set yet.
					this.fileProgressWrapper.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=" + this.opacity + ")";
				}
			} else {
				this.fileProgressWrapper.style.opacity = this.opacity / 100;
			}
		}

		if (this.height > 0) {
			this.height -= reduceHeightBy;
			if (this.height < 0) {
				this.height = 0;
			}

			this.fileProgressWrapper.style.height = this.height + "px";
		}

		if (this.height > 0 || this.opacity > 0) {
			var oSelf = this;
			this.setTimer(setTimeout(function () {
				oSelf.disappear();
			}, rate));
		} else {
			this.fileProgressWrapper.style.display = "none";
			this.setTimer(null);
		}
	};


	/* This is an example of how to cancel all the files queued up.  It's made somewhat generic.  Just pass your SWFUpload
	object in to this method and it loops through cancelling the uploads. */
	function cancelQueue(instance) {
		//document.getElementById(instance.customSettings.cancelButtonId).disabled = true;
		instance.stopUpload();
		var stats;
		
		do {
			stats = instance.getStats();
			instance.cancelUpload();
		} while (stats.files_queued !== 0);
		
	}

	/* **********************
	   Event Handlers
	   These are my custom event handlers to make my
	   web application behave the way I went when SWFUpload
	   completes different tasks.  These aren't part of the SWFUpload
	   package.  They are part of my application.  Without these none
	   of the actions SWFUpload makes will show up in my application.
	   ********************** */
	function fileDialogStart() {
		/* I don't need to do anything here */
	}
	function fileQueued(file) {
		console.log('fileQueued ',file)
		try {
			// You might include code here that prevents the form from being submitted while the upload is in
			// progress.  Then you'll want to put code in the Queue Complete handler to "unblock" the form
			var progress = new FileProgress(file, this.customSettings.progressTarget);
			progress.setStatus("排队中");
			progress.toggleCancel(true, this);

		} catch (ex) {
			this.debug(ex);
		}

	}

	function fileQueueError(file, errorCode, message) {
		console.warn('fileQueueError ',file, errorCode, message)
		try {
			if (errorCode === SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED) {
				console.warn('You have attempted to queue too many files ',message)
				//alert("You have attempted to queue too many files.\n" + (message === 0 ? "You have reached the upload limit." : "You may select " + (message > 1 ? "up to " + message + " files." : "one file.")));
				alert("您选择的文件过多.\n" + (message == 0 ? "超过了上传的限制." : "最多可以选择 " + (message > 1 ? " " + message + " 文件." : "1个文件.")));
				
				return;
			}

			var progress = new FileProgress(file, this.customSettings.progressTarget);
			progress.setError();
			progress.toggleCancel(false);

			switch (errorCode) {
			case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
				progress.setStatus("File is too big.");
				this.debug("Error Code: File too big, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
				progress.setStatus("Cannot upload Zero Byte files.");
				this.debug("Error Code: Zero byte file, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			case SWFUpload.QUEUE_ERROR.INVALID_FILETYPE:
				progress.setStatus("Invalid File Type.");
				this.debug("Error Code: Invalid File Type, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			case SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED:
				//alert("You have selected too many files.  " +  (message > 1 ? "You may only add " +  message + " more files" : "You cannot add any more files."));
				console.warn('You have selected too many files ',message)
				alert("您选择的文件过多.  " +  (message > 1 ? "最多还可以选择 " +  message + " 个文件" : "不能再添加文件了."));
				
				break;
			default:
				if (file !== null) {
					progress.setStatus("Unhandled Error");
				}
				this.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			}
		} catch (ex) {
	        this.debug(ex);
	    }
	}

	function fileDialogComplete(numFilesSelected, numFilesQueued) {
		console.log('fileDialogComplete' ,numFilesSelected, numFilesQueued,this.getStats().files_queued,this)
		try {
			if (this.getStats().files_queued > 0) {
				this.customSettings.numFilesQueued = this.customSettings.numFilesQueued+numFilesQueued;
				this._syncProgressQueueStatus();
				
				//document.getElementById(this.customSettings.cancelButtonId).disabled = false;
			}
			
			/* I want auto start and I can do that here */
			//this.startUpload();
		} catch (ex)  {
	        this.debug(ex);
		}
	}

	function uploadStart(file) {
		console.log('uploadStart ',file)
		try {
			/* I don't want to do any file validation or anything,  I'll just update the UI and return true to indicate that the upload should start */
			var progress = new FileProgress(file, this.customSettings.progressTarget);
			progress.setStatus("开始上传");
			progress.toggleCancel(true, this);//>>>>??
		}
		catch (ex) {
		}
		
		return true;
	}

	function uploadProgress(file, bytesLoaded, bytesTotal) {
		console.log('uploadProgress ',file, bytesLoaded, bytesTotal)
		try {
			var percent = Math.ceil((bytesLoaded / bytesTotal) * 100);

			var progress = new FileProgress(file, this.customSettings.progressTarget);
			progress.setProgress(percent);
			console.log('percent',percent,bytesLoaded, bytesTotal)
			progress.setStatus("正在上传");
		} catch (ex) {
			this.debug(ex);
		}
	}

	function uploadSuccess(file, serverData) {
		var stats = this.getStats(),fileData,self = this;
		/*var _file = this.getFile(file.index);
		console.log(11,_file)*/
		/*var reader = new FileReader();

        reader.onload = function( evt ){
        	var $img = document.createElement('img');
            $img.src = evt.target.result;
            document.body.appendChild($img)
        }
        reader.readAsDataURL(file);*/
        console.log('--------------file serverData-------------- ' ,file,serverData)

		try {
			var result = JSON.parse(serverData);
			var data = result.data;
			console.log('server file data ',data);
			console.warn(result,data.message,data.code);
			if(parseInt(result.code) >200 ){
				self._failed.push(file);
				var progress = new FileProgress(file, this.customSettings.progressTarget);
				progress.setError();
				progress.toggleCancel(false);
				return;
			}else{
				fileData = data;
				fileData.name = file.name;
				
			}
			
		}catch(ex){
			console.warn(ex)
		}
		try {
			var progress = new FileProgress(file, this.customSettings.progressTarget);
		
			progress.setComplete();
			progress.setStatus("上传完成");

			progress.toggleCancel(false);
			//
			this._fileList.push(fileData);
			


		} catch (ex) {
			this.debug(ex);
		}
	}
	/*
	stats:{
		files_queued
		in_progress
		queue_errors	
		successful_uploads	
		upload_cancelled	
		upload_errors
	}
		
	 */
	function uploadComplete(file) {
		var stats = this.getStats();
		console.log('uploadComplete ',file);
		this._syncProgressQueueStatus();
		try {
			/*  I want the next upload to continue automatically so I'll call startUpload here */
			if (this.getStats().files_queued === 0) {
				if(this._failed.length>0){
					this._queueUploadFail && this._queueUploadFail(this._failed);
				}else{
					(this._fileList.length>0) && this._queueUploadSuccess && this._queueUploadSuccess(this._fileList);
				}
				
				//if(this.getStats().successful_uploads === this._fileList.length){
				console.log('total file upload complete',this._fileList);
				this._queueUploadComplete && this._queueUploadComplete(this._fileList);
				//}
				//document.getElementById(this.customSettings.cancelButtonId).disabled = true;
			} else {	
				this.startUpload();
			}
		} catch (ex) {
			this.debug(ex);
		}

	}

	function uploadError(file, errorCode, message) {
		try {
			console.warn('uploadError ',file, errorCode, message)
			var progress = new FileProgress(file, this.customSettings.progressTarget);
			progress.setError();
			progress.toggleCancel(false);
			//console.log('this._failed',this._failed,this)
			console.log('errorCode' ,errorCode)
			if(!this._failed){
				this._failed = [];
			}
			if(errorCode != SWFUpload.UPLOAD_ERROR.FILE_CANCELLED){
				this._failed.push(file);
			}
				

			switch (errorCode) {
			case SWFUpload.UPLOAD_ERROR.HTTP_ERROR:
				progress.setStatus("Upload Error: " + message);
				this.debug("Error Code: HTTP Error, File name: " + file.name + ", Message: " + message);
				break;
			case SWFUpload.UPLOAD_ERROR.MISSING_UPLOAD_URL:
				progress.setStatus("Configuration Error");
				this.debug("Error Code: No backend file, File name: " + file.name + ", Message: " + message);
				break;
			case SWFUpload.UPLOAD_ERROR.UPLOAD_FAILED:
				progress.setStatus("Upload Failed.");
				this.debug("Error Code: Upload Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			case SWFUpload.UPLOAD_ERROR.IO_ERROR:
				progress.setStatus("Server (IO) Error");
				this.debug("Error Code: IO Error, File name: " + file.name + ", Message: " + message);
				break;
			case SWFUpload.UPLOAD_ERROR.SECURITY_ERROR:
				progress.setStatus("Security Error");
				this.debug("Error Code: Security Error, File name: " + file.name + ", Message: " + message);
				break;
			case SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED:
				progress.setStatus("Upload limit exceeded.");
				this.debug("Error Code: Upload Limit Exceeded, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			case SWFUpload.UPLOAD_ERROR.SPECIFIED_FILE_ID_NOT_FOUND:
				progress.setStatus("File not found.");
				this.debug("Error Code: The file was not found, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			case SWFUpload.UPLOAD_ERROR.FILE_VALIDATION_FAILED:
				progress.setStatus("Failed Validation.  Upload skipped.");
				this.debug("Error Code: File Validation Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			case SWFUpload.UPLOAD_ERROR.FILE_CANCELLED:
				if (this.getStats().files_queued === 0) {
					//document.getElementById(this.customSettings.cancelButtonId).disabled = true;
				}
				
				//更新待上传文件个数
				this.customSettings.numFilesQueued--;
				this._syncProgressQueueStatus();
				progress.setStatus("取消上传");
				progress.setCancelled();
				break;
			case SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED:
				progress.setStatus("Stopped");
				break;
			default:
				progress.setStatus("Unhandled Error: " + error_code);
				this.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
				break;
			}
		} catch (ex) {
	        this.debug(ex);
	    }
	}

	 /**
     * 格式化文件大小, 输出成带单位的字符串
     * @method formatSize
     * @grammar Base.formatSize( size ) => String
     * @grammar Base.formatSize( size, pointLength ) => String
     * @grammar Base.formatSize( size, pointLength, units ) => String
     * @param {Number} size 文件大小
     * @param {Number} [pointLength=2] 精确到的小数点数。
     * @param {Array} [units=[ 'B', 'K', 'M', 'G', 'TB' ]] 单位数组。从字节，到千字节，一直往上指定。如果单位数组里面只指定了到了K(千字节)，同时文件大小大于M, 此方法的输出将还是显示成多少K.
     * @example
     * console.log( Base.formatSize( 100 ) );    // => 100B
     * console.log( Base.formatSize( 1024 ) );    // => 1.00K
     * console.log( Base.formatSize( 1024, 0 ) );    // => 1K
     * console.log( Base.formatSize( 1024 * 1024 ) );    // => 1.00M
     * console.log( Base.formatSize( 1024 * 1024 * 1024 ) );    // => 1.00G
     * console.log( Base.formatSize( 1024 * 1024 * 1024, 0, ['B', 'KB', 'MB'] ) );    // => 1024MB
     */
	function formatSize( size, pointLength, units ) {
            var unit;

            units = units || [ 'B', 'K', 'M', 'G', 'TB' ];

            while ( (unit = units.shift()) && size > 1024 ) {
                size = size / 1024;
            }

            return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) +
                    unit;
	}

	/*------------------------*/
	window['PhotoUploader'] = PhotoUploader;
	function PhotoUploader(options){
		var orc = $('#orc');
		var options = options || {};
		var defs = {
			button_cursor : SWFUpload.CURSOR.HAND,
			file_post_name:'photo',//Filedata
			// Backend Settings
			upload_url: "http://school.igrow.cn/api/album/upload",
			post_params: {

				//"albumid":"105"
				//"PHPSESSID":"8o3scgpukts6hpknb4d7ap1ca0"

			},

			// File Upload Settings
			file_size_limit : "1024000",	// 100MB
			file_types : "*.jpg;*.gif;*.png;*.jpeg",//"" "*.*"
			file_types_description : "Image Files",
			file_upload_limit : "20",
			file_queue_limit : "0",

			// Event Handler Settings (all my handlers are in the Handler.js file)
			file_dialog_start_handler : fileDialogStart,
			file_queued_handler : fileQueued,
			file_queue_error_handler : fileQueueError,
			file_dialog_complete_handler : fileDialogComplete,
			upload_start_handler : uploadStart,
			upload_progress_handler : uploadProgress,
			upload_error_handler : uploadError,
			upload_success_handler : uploadSuccess,
			upload_complete_handler : uploadComplete,

			// Button Settings
			button_image_url : "http://assets.haoyuyuan.com/vendor/plugins/igrow/swfuploader/images/choose-btn-bg.png",
			button_placeholder_id : "uploadBtnPlaceholder",
			button_width: 112,
			button_height: 30,
			
			// Flash Settings
			flash_url : "http://assets.haoyuyuan.com/vendor/plugins/igrow/swfuploader/swfupload/swfupload.swf",
			

			custom_settings : {
				progressTarget : "progressQueuelist",
				progressQueueStatus:"progressQueueStatus",
				startQueueBtn:"startQueueBtn",
				cancelQueueBtn:"cancelQueueBtn",
				numFilesQueued:0
				
				//cancelButtonId : "btnCancel1"
			},
			
			// Debug Settings
			debug: false
		
		};
		for(var param in defs){
			if(options[param]){
				defs[param] = options[param];
			}
		}
		if($('#orc').attr('name')){
			defs['post_params'][$('#orc').attr('name')] = $('#orc').attr('value');
		}
		
		console.log(' swfupload 参数配置 ',defs,options)
		var uploader = new SWFUpload(defs);
		
		uploader.$progressQueueStatus = document.getElementById('progressQueueStatus');
		uploader._syncProgressQueueStatus = function(){
			
			var successful_uploads = this._fileList?this._fileList.length:0;
			var numFilesQueued = this.customSettings?this.customSettings.numFilesQueued:0;
			
			document.getElementById('progressQueueStatus').innerHTML = '共'+numFilesQueued+'张，已上传'+successful_uploads+'张('+'一次最多上传'+defs['file_upload_limit']+'张照片)';
		};
		uploader._syncProgressQueueStatus();
		uploader._queueUploadComplete = options.queueUploadComplete || function(fileList){
			console.log('complete queue ',fileList)
		};
		uploader._queueUploadFail = options.queueUploadFail || function(fileList){
			console.warn('fail queue',fileList)
		};
		uploader._queueUploadSuccess = options.queueUploadSuccess || function(fileList){
			console.log('success queue',fileList)
		};
		uploader._beforeStartUpload = options.beforeStartUpload || function(){return true;};
		uploader.iStartUpload = function(){
			if( !this._beforeStartUpload() ){
				return;
			}
			console.log('post_params --------',this.settings.post_params)
			this._fileList = [];
			this._failed = [];
			this.customSettings._failed = [];
			this.startUpload();
		};
		document.getElementById('startQueueBtn').onclick = function(){
			
			var stats = uploader.getStats();
			var files_queued = stats.files_queued;
			console.log('startQueueBtn=====stats ',stats)
			if(files_queued>0){
				document.getElementById('startQueueBtn').style.display = 'none';
				uploader.iStartUpload();
			}else{
				alert('请先选择文件');
			}
				


			
		};
		/*document.getElementById('cancelQueueBtn') && document.getElementById('cancelQueueBtn').onclick = function(){
			cancelQueue(uploader);
		};*/
		//共13张（3.10M），已上传4张

		
		return uploader;

			

	}


})();