window.DirectUPL = {

    signReq: null,
    uploadReq: null,
    parseXml : function(xmlStr){ return new window.DOMParser().parseFromString(xmlStr, "text/xml");},

    postToJAJ: function(d, e, f, g, z){
        try{
            var urlRequest = new XMLHttpRequest();
            window.DirectUPL.signReq = urlRequest;

            urlRequest.onload = function() {
                try{
                    urlRequest.upload.removeEventListener("error", onFailed);
                    urlRequest.upload.removeEventListener("abort", onAborted);
                } catch(err){}

                if(window.DirectUPL.signReq == null){
                    return;
                }
                window.DirectUPL.signReq = null;

                try{
                    var result = (urlRequest.response != null) ? urlRequest.response : urlRequest.responseText;
                    f(result);
                } catch(err){}

                urlRequest = null;
            };

            var onAborted = function(){
                try{
                    urlRequest.upload.removeEventListener("error", onFailed);
                    urlRequest.upload.removeEventListener("abort", onAborted);

                } catch(err){}

                if(window.DirectUPL.signReq == null){
                    return;
                }
                window.DirectUPL.signReq = null;

                try{
                    if(z != null){
                        z('abort');
                    }
                } catch(err){}

                urlRequest = null;
            };
            var onFailed = function(event){
                try{
                    urlRequest.upload.removeEventListener("error", onFailed);
                    urlRequest.upload.removeEventListener("abort", onAborted);

                } catch(err){}

                if(window.DirectUPL.signReq == null){
                    return;
                }
                window.DirectUPL.signReq = null;


                try{
                    var msg = (event != null && (typeof event === 'string' || event instanceof String)) ? event : null;
                    if(msg == null) {
                        if(urlRequest && urlRequest.status){
                            msg = 'Status: '+ urlRequest.status;
                        }
                        if(urlRequest && urlRequest.statusText) {
                            if(msg == null){ msg = 'Status Text: ' + urlRequest.statusText; } else { msg += ', '+ urlRequest.statusText; }
                        }
                    }

                    if(urlRequest && (urlRequest.response || urlRequest.responseText)){
                        if(msg == null){msg = '';}

                        msg += ' Response: ' + ((urlRequest.response != null) ? urlRequest.response : urlRequest.responseText);
                    }
                    if(event && event.type){
                        if(msg == null){msg = '';}

                        msg += ' Type: ' + event.type
                    }

                    console.log("DPL_SIG err log: " + msg);
                } catch(err){}


                try{
                    if(z != null){
                        z('error');
                    }
                } catch(err){}

                urlRequest = null;
            };
            var data = '';
            if(typeof e === 'object'){
                var i = 0;
                for ( var key in e ) {
                    if(i>0){
                        data+='&';
                    }
                    i++;
                    data+= key + '=' + e[key];
                }
            } else {
                data = e;
            }

            try{

                urlRequest.upload.addEventListener("error", onFailed);
                urlRequest.upload.addEventListener("abort", onAborted);
                urlRequest.withCredentials = true;
                urlRequest.open("POST", d, true);
                urlRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                try{
                    urlRequest.setRequestHeader('X-CSRF-Token', getCsToken());
                } catch(err){}

                // urlRequest.responseType = g;
                urlRequest.send(data);
            } catch(err){}

        } catch(err){}

    },

    upload : function(callback, p)
    {
        var xhr = new XMLHttpRequest();

        window.DirectUPL.uploadReq = xhr;
        //--

        var tryCount = 0;
        var sigRes = null;

        var TRANSFER_FAILED_HANDLER = function(event){
            if(window.DirectUPL.uploadReq == null){
                return;
            }


            if(tryCount == 0 && typeof signatureSuccess !== "undefined"){

                tryCount = 1;

                if(xhr){
                    try{
                        xhr.upload.removeEventListener("error", TRANSFER_FAILED_HANDLER);
                        xhr.upload.removeEventListener("abort", TRANSFER_CANCELED_HANDLER);
                        xhr = null;


                    } catch (err){}

                    var xhr = new XMLHttpRequest();
                    window.DirectUPL.uploadReq = xhr;
                }

                setTimeout(function(){signatureSuccess(sigRes)}, 111);

                return;
            }


            window.DirectUPL.uploadReq = null;

            try {
                try{
                    var msg = (event != null && (typeof event === 'string' || event instanceof String)) ? event : null;
                    if(msg == null) {
                        if(xhr && xhr.status){
                            msg = 'Status: '+ xhr.status;
                        }
                        if(xhr && xhr.statusText) {
                            if(msg == null){ msg = 'Status Text: ' + xhr.statusText; } else { msg += ', '+ xhr.statusText; }
                        }
                    }

                    if(xhr && (xhr.response || xhr.responseText)){
                        if(msg == null){msg = '';}
                        msg += ' Response: ' + ((xhr.response != null) ? xhr.response : xhr.responseText);
                    }
                    if(event && event.type){
                        if(msg == null){msg = '';}

                        msg += ' Type: ' + event.type
                    }

                    console.log("S3 Error log: " + msg);
                } catch(err){}
                Sentry.captureException(new Error('S3 error: transfer failed'));
            }
            catch (e) {}

            try{ removeEvents(); } catch(err){}
            callback({error: 1});
        };
        var TRANSFER_CANCELED_HANDLER = function(event){
            if(window.DirectUPL.uploadReq == null){
                return;
            }
            window.DirectUPL.uploadReq = null;
            try{ removeEvents(); } catch(err){}

//            try {
//            	try{
//            		console.log("S3 Error log: " + (event != null && (typeof event === 'string' || event instanceof String)) ? event : event + ' ' + event.type);
//            	} catch(err){}
//    	        Sentry.captureException(new Error('S3 error: transfer aborded'));
//    	    }
//    	    catch (e) {}

            callback({abort: 1});
        };

        var removeEvents = function(){
            try{
                xhr.upload.removeEventListener("error", TRANSFER_FAILED_HANDLER);
                xhr.upload.removeEventListener("abort", TRANSFER_CANCELED_HANDLER);
            } catch (err){}

            xhr = null;
        };


        function signatureSuccess(r){

            if(window.DirectUPL.uploadReq == null){
                return;
            }

            sigRes = r;
            try{
                r = JSON.parse(r);
            } catch(err){}

            if(r && r != '' && r.data && r.data.url && r.data.inputs){



                var formData = new FormData();

                Object.keys(r.data.inputs).forEach(function(key) {
                    formData.append(key , r.data.inputs[key]);
//						console.log('Key : ' + key + ', Value : ' + r.data.inputs[key])
                });

                formData.append('file', p.blob);

                xhr.onload = function(){

                    if(window.DirectUPL.uploadReq == null){
                        return;
                    }
                    window.DirectUPL.uploadReq = null;

                    var resp = null;
                    try{
                        resp = (xhr.response != null) ? xhr.response : ((xhr.responseText != null) ? responseText : xhr.responseXML);

                    } catch(err){}

                    try{ removeEvents(); } catch(err){}

                    if(resp != null){

                        var xmlDoc = null;
                        try{
                            // xmlDoc = $.parseXML( resp )
                            xmlDoc = window.DirectUPL.parseXml(resp);

                        } catch(err){

                            callback({error: 1});
                            return;
                        }

                        if(xmlDoc != null){
                            var $uploadedXml = null;

                            try {
                                $uploadedXml = xmlDoc; //$( xmlDoc );
                            } catch(err){
                                callback({error: 1});
                                return;
                            }

                            var locLength = 0;
                            try{
                                locLength = $uploadedXml.getElementsByTagName('Location')[0].childNodes[0].nodeValue.length;
                            } catch(err){}

                            if($uploadedXml != null && locLength > 0){

                                var fileUploaded = {
                                    "url": $uploadedXml.getElementsByTagName('Location')[0].childNodes[0].nodeValue.replace("%2F", "/"),
                                    "s3_name": $uploadedXml.getElementsByTagName('Key')[0].childNodes[0].nodeValue //$uploadedXml.find("PostResponse>Key").text(),
                                };
                                callback(fileUploaded);
//	                            	callback($uploadedXml);
                            } else {

                                try {
                                    Sentry.captureException(new Error('S3 error: uploaded Xml null'));
                                }
                                catch (e) {}

                                callback({error: 1});
                            }
                        } else {

                            try {
                                Sentry.captureException(new Error('S3 error: response xml doc parsing'));
                            }
                            catch (e) {}

                            callback({error: 1});
                        }

                    } else {

                        try {
                            Sentry.captureException(new Error('S3 error: response null'));
                        }
                        catch (e) {}

                        callback({error: 1});
                    }
                };
                try{
                    xhr.upload.addEventListener("error", TRANSFER_FAILED_HANDLER);
                    xhr.upload.addEventListener("abort", TRANSFER_CANCELED_HANDLER);

                    xhr.open("POST", r.data.url, true);
//                    xhr.setRequestHeader("Content-Type", "application/octet-stream");
//                    xhr.responseType = "text";

                    xhr.send(formData);
                } catch(err){}



            } else {
                callback({error: 1});
            }
        };


        var signatureError = function(r){

            if(r == 'abort'){
                callback({abort: 1});
            } else {

                try {
                    Sentry.captureException(new Error('DPL_SIG error: ' + r));
                }
                catch (e) {
                    try{console.error("DPL_SIG: " + r);} catch(err){}
                }
                callback({error: 1});
            }

        };


        var sUrl = (typeof window.BeFunky !== "undefined") ? window.BeFunky.Params.siteUrl + 'api/direct-upload/' : 'https://upload.befunky.com/direct_upl.php';
        var csrf = getCsToken();
        var sparams = 'bucket='+p.bucket+'&content_type='+p.content_type+'&CSRFtoken='+csrf;
        if(p.filename && p.filename != null){
            sparams = sparams + '&filename=' + p.filename;
        }
        window.DirectUPL.postToJAJ(sUrl, sparams, signatureSuccess,'json',function(r){
            if(r == 'abort'){
                callback({abort: 1});
            } else {
                callback({abort: 1});
            }
        });


    }

};
