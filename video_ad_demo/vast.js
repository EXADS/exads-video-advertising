vastPlayer = function(idVideoPlayer, vastTag, options) {
    var inArray = function(needle, haystack) {
        var length = haystack.length;

        for (var i = 0; i < length; i++) {
            if (haystack[i] == needle) {
                return true;
            }
        }

        return false;
    };
    
    var copy = vastPlayerClass.constructor();
    for (var attr in vastPlayerClass) {
        if (vastPlayerClass.hasOwnProperty(attr) && !inArray(attr, vastPlayerClass.notCloned)) {
            copy[attr] = vastPlayerClass[attr];
        }
    }

    vastPlayerClass.instances.push(copy);

    copy.init(idVideoPlayer, vastTag, options);

    return copy;
}

var vastPlayerClass = {
    defaultIconUrl: '//fonts.googleapis.com/icon?family=Material+Icons',
    defaultControlsStylesheet: 'styles/default_layout.css',
    instances: [],
    notCloned: ['notCloned', 'defaultIconUrl', 'defaultControlsStylesheet',
        'instances', 'getInstanceById', 'requestStylesheet', 'vastOptions',
        'displayOptions', 'getClickedBarOffsetX', 'controlMaterialIconsMapping',
        'controlMaterialIconsGetMappedIcon'],

    getInstanceById: function(playerId) {
        for (var i = 0; i < this.instances.length; i++) {
            if (this.instances[i].videoPlayerId == playerId) {
                return this.instances[i];
            }
        }
        
        return null;
    },

    requestStylesheet: function(cssId, url) {
        if (!document.getElementById(cssId)) {
            var head   = document.getElementsByTagName('head')[0];
            var link   = document.createElement('link');

            link.id    = cssId;
            link.rel   = 'stylesheet';
            link.type  = 'text/css';
            link.href  = url;
            link.media = 'all';

            head.appendChild(link);
        }
    },

    getCurrentVideoDuration: function() {
        var videoPlayerTag = document.getElementById(this.videoPlayerId);

        if (videoPlayerTag) {
            return videoPlayerTag.duration;
        }

        return 0;
    },
    
    getClickThroughUrlFromLinear: function(linear) {
        var videoClicks = linear.getElementsByTagName('VideoClicks');

        if (videoClicks.length) {//There should be exactly 1 node
            var clickThroughs = videoClicks[0].getElementsByTagName('ClickThrough');

            if (clickThroughs.length) {//There should be exactly 1 node
                return clickThroughs[0].childNodes[0].nodeValue;
            }
        }

        return false;
    },

    getTrackingFromLinear: function(linear) {
        var trackingEvents = linear.getElementsByTagName('TrackingEvents');

        if (trackingEvents.length) {//There should be no more than one node
            return trackingEvents[0].getElementsByTagName('Tracking');
        }

        return [];
    },

    getDurationFromLinear: function(linear) {
        var duration = linear.getElementsByTagName('Duration');

        if (duration.length && (typeof duration[0].childNodes[0] !== 'undefined')) {//There should be exactly 1 Duration node and it should have a value
            return this.convertTimeStringToSeconds(duration[0].childNodes[0].nodeValue);
        }

        return false;
    },

    getMediaFilesFromLinear: function(linear) {
        var mediaFiles = linear.getElementsByTagName('MediaFiles');

        if (mediaFiles.length) {//There should be exactly 1 MediaFiles node
            return mediaFiles[0].getElementsByTagName('MediaFile');
        }

        return [];
    },

    getMediaFileFromLinear: function(linear) {
        var fallbackMediaFile;
        var mediaFiles = this.getMediaFilesFromLinear(linear);

        for (var i = 0; i < mediaFiles.length; i++) {
            if (!mediaFiles[i].getAttribute('type')) {
                fallbackMediaFile = mediaFiles[i].childNodes[0].nodeValue;
            }

            if (mediaFiles[i].getAttribute('type') == this.displayOptions.mediaType) {
                return mediaFiles[i].childNodes[0].nodeValue;
            }
        }

        return fallbackMediaFile;
    },

    registerTrackingEvents: function() {
        trackingEvents = this.getTrackingFromLinear(creativeLinear);
        var eventType = '';
        var oneEventOffset = 0;

        for (var i = 0; i < trackingEvents.length; i++) {
            eventType = trackingEvents[i].getAttribute('event');

            switch (eventType) {
                case 'start':
                case 'firstQuartile':
                case 'midpoint':
                case 'thirdQuartile':
                case 'complete':
                    if (typeof this.vastOptions.tracking[eventType] === 'undefined') {
                        this.vastOptions.tracking[eventType] = [];
                    }

                    if (typeof this.vastOptions.stopTracking[eventType] === 'undefined') {
                        this.vastOptions.stopTracking[eventType] = [];
                    }
                    this.vastOptions.tracking[eventType].push(trackingEvents[i].childNodes[0].nodeValue);
                    this.vastOptions.stopTracking[eventType] = false;

                    break;

                case 'progress':
                    if (typeof this.vastOptions.tracking[eventType] === 'undefined') {
                        this.vastOptions.tracking[eventType] = [];
                    }

                    oneEventOffset = this.convertTimeStringToSeconds(trackingEvents[i].getAttribute('offset'));

                    if (typeof this.vastOptions.tracking[eventType][oneEventOffset] === 'undefined') {
                        this.vastOptions.tracking[eventType][oneEventOffset] = {
                            elements: [],
                            stopTracking: false
                        };
                    }

                    this.vastOptions.tracking[eventType][oneEventOffset].elements.push(trackingEvents[i].childNodes[0].nodeValue);

                    break;

                default:
                    break;
            }
        }
    },

    registerImpressionEvents: function(impressionTags) {
        if (impressionTags.length) {
            this.vastOptions.impression = [];

            for (var i = 0; i < impressionTags.length; i++) {
                this.vastOptions.impression.push(impressionTags[i].childNodes[0].nodeValue);
            }
        }
    },

    getClickTrackingEvents: function(linear) {
        var result = [];

        var videoClicks = linear.getElementsByTagName('VideoClicks');

        if (videoClicks.length) {//There should be exactly 1 node
            var clickTracking = videoClicks[0].getElementsByTagName('ClickTracking');

            if (clickTracking.length) {
                for (var i = 0; i < clickTracking.length; i++) {
                    result.push(clickTracking[i].childNodes[0].nodeValue);
                }
            }
        }

        return result;
    },

    callUris: function(uris) {
        for (var i = 0; i < uris.length; i++) {
            new Image().src = uris[i];
        }
    },

    recalculateAdDimensions: function(idVideoPlayer) {
        if ((!idVideoPlayer) && (typeof this.videoPlayerId !== 'undefined')) {
            idVideoPlayer = this.videoPlayerId;
        }

        var videoPlayer     = document.getElementById(idVideoPlayer);
        var divClickThrough = document.getElementById('vast_clickthrough_layer_' + idVideoPlayer);

        if (divClickThrough) {
            divClickThrough.style.width  = videoPlayer.offsetWidth + 'px';
            divClickThrough.style.height = videoPlayer.offsetHeight + 'px';
        }
    },

    prepareVast: function() {
        var player = this;

        player.initialStart = true;
        player.parseVastTag(player.vastOptions.vastTagUrl);
    },

    toggleLoader: function(showLoader) {
        if (this.displayOptions.layout === 'browser') {
            //The browser handles all the layout of the video tag
            return;
        }

        var loaderDiv = document.getElementById('vast_video_loading_' + this.videoPlayerId);

        if (showLoader) {
            loaderDiv.style.display = 'table';
        } else {
            loaderDiv.style.display = 'none';
        }
    },

    /**
     * Parse the VAST Tag
     *
     * @param string vastTag
     */
    parseVastTag: function(vastTag) {
        var player = this;
        var videoPlayerTag = document.getElementById(player.videoPlayerId);

        var xmlHttpReq;
        var xmlResponse;

        xmlHttpReq = new XMLHttpRequest();

        var playVideo = function() {
            player.toggleLoader(false);
            videoPlayerTag.play();
        };

        xmlHttpReq.onreadystatechange = function() {
            if ((xmlHttpReq.readyState === 4) && (xmlHttpReq.status !== 200)) {
                //The response returned an error. Proceeding with the main video.
                playVideo();
                return;
            }

            if (!((xmlHttpReq.readyState === 4) && (xmlHttpReq.status === 200))) {
                return;
            }

            xmlResponse = xmlHttpReq.responseXML;
            
            //Get impression tag
            var impression = xmlResponse.getElementsByTagName('Impression');
            if(impression != null) {
                player.registerImpressionEvents(impression);
            }

            //Set initial values
            player.vastOptions.skipoffset = false;
            player.vastOptions.adFinished = false;

            //Get Creative
            var creative = xmlResponse.getElementsByTagName('Creative');

            //Currently only 1 creative and 1 linear is supported
            if ((typeof creative !== 'undefined') && creative.length) {
                var arrayCreativeLinears = creative[0].getElementsByTagName('Linear');

                if ((typeof arrayCreativeLinears !== 'undefined') && (arrayCreativeLinears != null) && arrayCreativeLinears.length) {
                    creativeLinear = arrayCreativeLinears[0];

                    //Extract the necessary data from the Linear node
                    player.vastOptions.skipoffset      = player.convertTimeStringToSeconds(creativeLinear.getAttribute('skipoffset'));
                    player.vastOptions.clickthroughUrl = player.getClickThroughUrlFromLinear(creativeLinear);
                    player.vastOptions.clicktracking   = player.getClickTrackingEvents(creativeLinear);
                    player.vastOptions.duration        = player.getDurationFromLinear(creativeLinear);
                    player.vastOptions.mediaFile       = player.getMediaFileFromLinear(creativeLinear);
                    
                    player.registerTrackingEvents();
                }

                if (typeof player.vastOptions.mediaFile !== 'undefined') {
                    player.preRoll();
                } else {
                    //Play the main video
                    playVideo();
                    player.displayOptions.noVastVideoCallback();
                }
            } else {
                //Play the main video
                playVideo();
                player.displayOptions.noVastVideoCallback();
            }
            player.displayOptions.vastLoadedCallback();
        };

        player.toggleLoader(true);

        xmlHttpReq.open("GET", vastTag, true);
        xmlHttpReq.withCredentials = true;
        xmlHttpReq.timeout = player.displayOptions.vastTimeout;
        xmlHttpReq.send();
    },

    preRoll: function() {
        var player = this;
        var videoPlayerTag = document.getElementById(player.videoPlayerId);

        var playVideoPlayer = function() {
            //Load the PreRoll ad
            videoPlayerTag.src = player.vastOptions.mediaFile;
            videoPlayerTag.load();

            var switchPlayerToVastMode = function() {
                //Get the actual duration from the video file if it is not present in the VAST XML
                if (!player.vastOptions.duration) {
                    player.vastOptions.duration = videoPlayerTag.duration;
                }

                player.addClickthroughLayer(player.videoPlayerId);
                if (player.vastOptions.skipoffset !== false) {
                    player.addSkipButton();
                }

                videoPlayerTag.removeAttribute('controls'); //Remove the default Controls

                if (player.displayOptions.layout == 'default') {
                    var progressbarContainer = document.getElementById(player.videoPlayerId + '_vast_controls_progress_container');

                    if (progressbarContainer !== null) {
                        progressbarContainer.className = progressbarContainer.className.replace(/\bvast_slider\b/g, 'vast_ad_slider');
                    }
                }

                player.isCurrentlyPlayingAd = true;

                player.toggleLoader(false);
                videoPlayerTag.play();

                //Announce the impressions
                trackSingleEvent('impression');

                videoPlayerTag.removeEventListener('loadedmetadata',switchPlayerToVastMode);
            };

            /**
             * Handles the ending of the Pre-Roll ad
             */
            videoPlayerTag.addEventListener('loadedmetadata', switchPlayerToVastMode);
            videoPlayerTag.addEventListener('ended', player.onVastAdEnded);
        };

        var trackSingleEvent = function(eventType, eventSubType) {
            var trackingUris = [];

            switch (eventType) {
                case 'start':
                case 'firstQuartile':
                case 'midpoint':
                case 'thirdQuartile':
                case 'complete':
                    if (player.vastOptions.stopTracking[eventType] == false) {
                        if (player.vastOptions.tracking[eventType] != null) {
                            trackingUris = player.vastOptions.tracking[eventType];
                        }

                        player.vastOptions.stopTracking[eventType] = true;
                    }

                    break;

                case 'progress':
                    player.vastOptions.tracking['progress'][eventSubType].elements.forEach(function(currentValue, index) {
                        if (
                            (player.vastOptions.tracking['progress'][eventSubType].stopTracking == false) &&
                            (player.vastOptions.tracking['progress'][eventSubType].elements.length)
                        ) {
                            trackingUris = player.vastOptions.tracking['progress'][eventSubType].elements;
                        }

                        player.vastOptions.tracking['progress'][eventSubType].stopTracking = true;
                    });
                    break;

                case 'impression':
                    if (
                        (player.vastOptions.impression != null)
                        && (typeof player.vastOptions.impression.length !== 'unknown')
                    ) {
                        trackingUris = player.vastOptions.impression;
                    }
                    break;

                default:
                    break;
            }

            player.callUris(trackingUris);
        };

        /**
         * Sends requests to the tracking URIs
         */
        var videoPlayerTimeUpdate = function() {
            if (player.vastOptions.adFinished) {
                videoPlayerTag.removeEventListener('timeupdate', videoPlayerTimeUpdate);
                return;
            }

            var currentTime = Math.floor(videoPlayerTag.currentTime);

            if (currentTime == 0) {
                trackSingleEvent('start');
            }

            if (
                (typeof player.vastOptions.tracking['progress'] !== 'undefined') &&
                (player.vastOptions.tracking['progress'].length) &&
                (typeof player.vastOptions.tracking['progress'][currentTime] !== 'undefined')
            ) {
                trackSingleEvent('progress', currentTime);
            }

            if (currentTime == (Math.floor(player.vastOptions.duration / 4))) {
                trackSingleEvent('firstQuartile');
            }

            if (currentTime == (Math.floor(player.vastOptions.duration / 2))) {
                trackSingleEvent('midpoint');
            }

            if (currentTime == (Math.floor(player.vastOptions.duration * 3 / 4))) {
                trackSingleEvent('thirdQuartile');
            }

            if (currentTime >= (player.vastOptions.duration - 1 )) {
                trackSingleEvent('complete');

                videoPlayerTag.removeEventListener('timeupdate', videoPlayerTimeUpdate);
                player.vastOptions.adFinished = true;
            }
        };

        playVideoPlayer();

        videoPlayerTag.addEventListener('timeupdate', videoPlayerTimeUpdate);
    },

    switchToMainVideo: function() {
        var player = this;
        var videoPlayerTag = document.getElementById(player.videoPlayerId);

        videoPlayerTag.src = player.originalSrc;

        videoPlayerTag.load();
        videoPlayerTag.play();

        player.isCurrentlyPlayingAd = false;

        player.removeClickthrough();
        player.removeSkipButton();
        player.vastOptions.adFinished = true;
        player.displayOptions.vastVideoEndedCallback();

        if (player.displayOptions.layout == 'default') {
            var progressbarContainer = document.getElementById(player.videoPlayerId + '_vast_controls_progress_container');

            if (progressbarContainer !== null) {
                progressbarContainer.className = progressbarContainer.className.replace(/\bvast_ad_slider\b/g, 'vast_slider');
            }
        }

        videoPlayerTag.removeEventListener('ended', player.onVastAdEnded);

        if (player.displayOptions.layout === 'browser') {
            videoPlayerTag.setAttribute('controls', 'controls');
        }
    },

    onVastAdEnded: function() {
        //"this" is the HTML5 video tag, because it disptches the "ended" event
        vastPlayerClass.getInstanceById(this.id).switchToMainVideo();
    },

    /**
     * Adds a Skip Button
     */
    addSkipButton: function() {
        var videoPlayerTag = document.getElementById(this.videoPlayerId);

        var divSkipButton = document.createElement('div');
        divSkipButton.id = 'skip_button_' + this.videoPlayerId;
        divSkipButton.className = 'skip_button skip_button_disabled';
        divSkipButton.innerHTML = this.displayOptions.skipButtonCaption.replace('[seconds]', this.vastOptions.skipoffset);

        document.getElementById('vast_video_wrapper_' + this.videoPlayerId).appendChild(divSkipButton);

        videoPlayerTag.addEventListener('timeupdate', this.decreaseSkipOffset, false);
    },

    decreaseSkipOffset: function decreaseSkipOffset() {
        //"this" is the HTML5 video tag, because it disptches the "ended" event
        var videoPlayerTag = this;
        var player = vastPlayerClass.getInstanceById(videoPlayerTag.id);
        var sec = player.vastOptions.skipoffset - Math.floor(videoPlayerTag.currentTime);
        var btn = document.getElementById('skip_button_' + player.videoPlayerId);

        if (btn) {
            if (sec >= 1) {
                //set the button label with the remaining seconds
                btn.innerHTML = player.displayOptions.skipButtonCaption.replace('[seconds]', sec);

            } else {
                //make the button clickable
                btn.innerHTML = '<a href="javascript:;" onclick="vastPlayerClass.getInstanceById(\'' + player.videoPlayerId + '\').pressSkipButton();">'
                    + player.displayOptions.skipButtonClickCaption
                    + '</a>';

                //removes the CSS class for a disabled button
                btn.className = btn.className.replace(/\bskip_button_disabled\b/,'');

                videoPlayerTag.removeEventListener('timeupdate', player.decreaseSkipOffset);
            }
        } else {
            sec = 0;
            videoPlayerTag.removeEventListener('timeupdate', videoPlayerTag.decreaseSkipOffset);
        }
    },

    pressSkipButton: function() {
        this.removeSkipButton();
        this.displayOptions.vastVideoSkippedCallback();

        var event = document.createEvent('Event');
        event.initEvent('ended', false, true);
        document.getElementById(this.videoPlayerId).dispatchEvent(event);
    },

    removeSkipButton: function() {
        btn = document.getElementById('skip_button_' + this.videoPlayerId);
        if (btn) {
            btn.parentElement.removeChild(btn);
        }
    },

    /**
     * Makes the player open the ad URL on clicking
     */
    addClickthroughLayer: function() {
        var player = this;

        var videoPlayerTag = document.getElementById(player.videoPlayerId);
        var divWrapper = document.getElementById('vast_video_wrapper_' + player.videoPlayerId);

        var divClickThrough = document.createElement('div');
        divClickThrough.className = 'vast_clickthrough_layer';
        divClickThrough.id = 'vast_clickthrough_layer_' + player.videoPlayerId;
        divClickThrough.setAttribute(
            'style',
            'position: absolute; cursor: pointer; top: 0; left: 0; width: ' +
                    videoPlayerTag.offsetWidth + 'px; height: ' +
                    (videoPlayerTag.offsetHeight) + 'px; border: 1px solid red;'
        );

        divWrapper.appendChild(divClickThrough);

        //Bind the Onclick event
        var clickthroughLayer = document.getElementById('vast_clickthrough_layer_' + player.videoPlayerId);

        clickthroughLayer.onclick = function() {
            window.open(player.vastOptions.clickthroughUrl);

            //Tracking the Clickthorugh events
            if (typeof player.vastOptions.clicktracking !== 'undefined') {
                player.callUris(player.vastOptions.clicktracking);
            }
        };
    },

    /**
     * Remove the Clickthrough layer
     */
    removeClickthrough: function() {
        var clickthroughLayer = document.getElementById('vast_clickthrough_layer_' + this.videoPlayerId);
        clickthroughLayer.parentNode.removeChild(clickthroughLayer);
    },

    /**
     * Gets the src value of the first source element of the video tag.
     *
     * @returns string|null
     */
    getCurrentSrc: function() {
        var sources = document.getElementById(this.videoPlayerId).getElementsByTagName('source');

        if (sources.length) {
            return sources[0].getAttribute('src');
        }

        return null;
    },

    convertTimeStringToSeconds: function(str) {
        if (str && str.match(/^(\d){2}(:[0-5][0-9]){2}(.(\d){1,3})?$/)) {
            var timeParts = str.split(':');
            return ((parseInt(timeParts[0], 10)) * 3600) + ((parseInt(timeParts[1], 10)) * 60) + (parseInt(timeParts[2], 10));
        }

        return false;
    },

    onRecentWaiting: function() {
        //"this" is the HTML5 video tag, because it disptches the "ended" event
        var player = vastPlayerClass.getInstanceById(this.id);

        player.recentWaiting = true;

        setTimeout(function () {
            player.recentWaiting = false;
        }, 1000);
    },

    /**
     * Dispatches a custom pause event which is not present when seeking.
     */
    onVastPlayerPause: function() {
        //"this" is the HTML5 video tag, because it disptches the "ended" event
        var videoPlayerTag = this;

        setTimeout(function () {
            var player = vastPlayerClass.getInstanceById(videoPlayerTag.id);

            if (!player.recentWaiting) {
                var event = document.createEvent('CustomEvent');
                event.initEvent('vastplayerpause', false, true);
                videoPlayerTag.dispatchEvent(event);
            }
        }, 100);
    },

    /**
     * Maps the default names of the material icons, used in the default layout,
     * to their codes, so that compatibility with IE9 is achieved.
     *
     * @returns object
     */
    controlMaterialIconsMapping: function() {
        return {
            volume_up:       '&#xE050;',
            volume_off:      '&#xE04F;',
            play_arrow:      '&#xE037;',
            pause:           '&#xE034;',
            fullscreen:      '&#xE5D0;',
            fullscreen_exit: '&#xE5D1;',
            hourglass_empty: '&#xE88B;'
        };
    },

    controlMaterialIconsGetMappedIcon: function(iconName) {
        var mapObj = vastPlayerClass.controlMaterialIconsMapping();

        if (typeof mapObj[iconName] !== 'undefined') {
            return mapObj[iconName];
        }

        return '';
    },

    generateCustomControlTags: function() {
        var htmlResult = '<div class="vast_controls_left">' +
        '   <i class="material-icons vast_button" id="' + this.videoPlayerId + '_vast_control_playpause">play_arrow</i>' +
        '</div>' +
            '<div id="' + this.videoPlayerId + '_vast_controls_progress_container" class="vast_controls_progress_container vast_slider">' +
        '   <div class="vast_controls_progress">' +
        '      <div id="' + this.videoPlayerId + '_vast_control_currentprogress" class="vast_controls_currentprogress">' +
        '          <div id="' + this.videoPlayerId + '_vast_control_currentpos" class="vast_controls_currentpos"></div>' +
        '      </div>' +
        '   </div>' +
        '</div>' +
        '<div class="vast_controls_right">' +
        '   <i class="material-icons vast_button" id="' + this.videoPlayerId + '_vast_control_fullscreen">fullscreen</i>' +
        '   <div id="' + this.videoPlayerId + '_vast_control_volume_container" class="vast_control_volume_container vast_slider">' +
        '       <div id="' + this.videoPlayerId + '_vast_control_volume" class="vast_control_volume">' +
        '           <div id="' + this.videoPlayerId + '_vast_control_volume_currentpos" class="vast_control_volume_currentpos"></div>' +
        '       </div>' +
        '   </div>' +
        '   <i class="material-icons vast_button" id="' + this.videoPlayerId + '_vast_control_mute">volume_off</i>' +
        '</div>';

        var mapObj = vastPlayerClass.controlMaterialIconsMapping();

        var re = new RegExp('>' + Object.keys(mapObj).join('<\\/i>|>') + '<\\/i>', 'gi');
        htmlResult = htmlResult.replace(re, function(matched) {
            return '>' + mapObj[matched.replace(/>/, '').replace(/<\/i>/, '')] + '</i>';
        });

        return htmlResult;
    },

    controlPlayPauseToggle: function(videoPlayerId, isPlaying) {
        var playPauseButton = document.getElementById(videoPlayerId + '_vast_control_playpause');

        if (isPlaying) {
            playPauseButton.innerHTML = vastPlayerClass.controlMaterialIconsGetMappedIcon('pause');

        } else {
            playPauseButton.innerHTML = vastPlayerClass.controlMaterialIconsGetMappedIcon('play_arrow');
        }
    },

    contolProgressbarUpdate: function(videoPlayerId) {
        var player = vastPlayerClass.getInstanceById(videoPlayerId);
        var videoPlayerTag = document.getElementById(videoPlayerId);
        var currentProgressTag = document.getElementById(videoPlayerId + '_vast_control_currentprogress');

        currentProgressTag.style.width = (videoPlayerTag.currentTime / player.currentVideoDuration * 100) + '%';
    },

    contolVolumebarUpdate: function(videoPlayerId) {
        var player = vastPlayerClass.getInstanceById(videoPlayerId);

        if (player.displayOptions.layout === 'browser') {
            return;
        }

        var videoPlayerTag = document.getElementById(videoPlayerId);
        var volumeposTag = document.getElementById(videoPlayerId + '_vast_control_volume_currentpos');
        var volumebarTotalWidth = document.getElementById(videoPlayerId + '_vast_control_volume').clientWidth;
        var volumeposTagWidth = volumeposTag.clientWidth;
        var muteButtonTag = document.getElementById(videoPlayerId + '_vast_control_mute');

        if (videoPlayerTag.volume) {
            player.latestVolume = videoPlayerTag.volume;
        }

        if (videoPlayerTag.volume) {
            muteButtonTag.innerHTML = vastPlayerClass.controlMaterialIconsGetMappedIcon('volume_up');

        } else {
            muteButtonTag.innerHTML = vastPlayerClass.controlMaterialIconsGetMappedIcon('volume_off');
        }

        volumeposTag.style.left = (videoPlayerTag.volume * volumebarTotalWidth - (volumeposTagWidth / 2)) + 'px';
    },

    muteToggle: function(videoPlayerId) {
        var player = vastPlayerClass.getInstanceById(videoPlayerId);

        var videoPlayerTag = document.getElementById(videoPlayerId);
        

        if (videoPlayerTag.volume) {
            videoPlayerTag.volume = 0;

        } else {
            videoPlayerTag.volume = player.latestVolume;
        }
    },

    checkFullscreenSupport: function(videoPlayerId) {
        var videoPlayerTag = document.getElementById(videoPlayerId);

        if (videoPlayerTag.mozRequestFullScreen) {
            return {goFullscreen: 'mozRequestFullScreen', exitFullscreen: 'mozCancelFullScreen', isFullscreen: 'mozFullScreenElement'};

        } else if (videoPlayerTag.webkitRequestFullscreen) {
            return {goFullscreen: 'webkitRequestFullscreen', exitFullscreen: 'webkitExitFullscreen', isFullscreen: 'webkitFullscreenElement'};

        } else if (videoPlayerTag.msRequestFullscreen) {
            return {goFullscreen: 'msRequestFullscreen', exitFullscreen: 'msExitFullscreen', isFullscreen: 'msFullscreenElement'};

        } else if (videoPlayerTag.requestFullscreen) {
            return {goFullscreen: 'requestFullscreen', exitFullscreen: 'exitFullscreen', isFullscreen: 'fullscreenElement'};
        }

        return false;
    },

    fullscreenToggle: function(videoPlayerId) {
        var fullscreenTag = document.getElementById('vast_video_wrapper_' + videoPlayerId);
        var requestFullscreenFunctionNames = this.checkFullscreenSupport('vast_video_wrapper_' + videoPlayerId);
        var fullscreenButton = document.getElementById(videoPlayerId + '_vast_control_fullscreen');

        if (requestFullscreenFunctionNames) {
            var functionNameToExecute = '';

            if (document[requestFullscreenFunctionNames.isFullscreen] === null) {
                //Go fullscreen
                functionNameToExecute = 'videoPlayerTag.' + requestFullscreenFunctionNames.goFullscreen + '();';
                fullscreenButton.innerHTML = vastPlayerClass.controlMaterialIconsGetMappedIcon('fullscreen_exit');

            } else {
                //Exit fullscreen
                functionNameToExecute = 'document.' + requestFullscreenFunctionNames.exitFullscreen + '();';
                fullscreenButton.innerHTML = vastPlayerClass.controlMaterialIconsGetMappedIcon('fullscreen');
            }

            new Function('videoPlayerTag', functionNameToExecute)(fullscreenTag);

        } else {
            //The browser does not support the Fullscreen API, so a pseudo-fullscreen implementation is used
            if (fullscreenTag.className.search(/\bpseudo_fullscreen\b/g) !== -1) {
                fullscreenTag.className = fullscreenTag.className.replace(/\bpseudo_fullscreen\b/g, '');
                fullscreenButton.innerHTML = vastPlayerClass.controlMaterialIconsGetMappedIcon('fullscreen');

            } else {
                fullscreenTag.className += ' pseudo_fullscreen';
                fullscreenButton.innerHTML = vastPlayerClass.controlMaterialIconsGetMappedIcon('fullscreen_exit');
            }
        }

        this.recalculateAdDimensions();
    },

    getClickedBarOffsetX: function(evt, el) {
        var x = 0;

        while (el && !isNaN(el.offsetLeft)) {
            x += el.offsetLeft - el.scrollLeft;
            el = el.offsetParent;
        }

        return evt.clientX - x;
    },

    onProgressbarClick: function(videoPlayerId, event) {
        var player = vastPlayerClass.getInstanceById(videoPlayerId);

        if (player.isCurrentlyPlayingAd) {
            return;
        }

        var videoPlayerTag = document.getElementById(videoPlayerId);
        var totalWidth = document.getElementById(videoPlayerId + '_vast_controls_progress_container').clientWidth;
        var clickedX = vastPlayerClass.getClickedBarOffsetX(event, document.getElementById(videoPlayerId + '_vast_controls_progress_container'));

        if (totalWidth) {
            videoPlayerTag.currentTime = player.currentVideoDuration * clickedX / totalWidth;
        }
    },

    onVolumebarClick: function(videoPlayerId, event) {
        var videoPlayerTag = document.getElementById(videoPlayerId);
        var totalWidth = document.getElementById(videoPlayerId + '_vast_control_volume_container').clientWidth;
        var clickedX = vastPlayerClass.getClickedBarOffsetX(event, document.getElementById(videoPlayerId + '_vast_control_volume_container'));

        if (totalWidth) {
            var newVolume = clickedX / totalWidth;

            if (newVolume < 0.05) {
                newVolume = 0;

            } else if (newVolume > 0.95) {
                newVolume = 1;
            }

            videoPlayerTag.volume = newVolume;
        }
    },

    playPauseToggle: function(videoPlayerTag) {
        var player = vastPlayerClass.getInstanceById(videoPlayerTag.id);

        if (player.initialStart) {
            if (player.displayOptions.layout !== 'browser') { //The original player play/pause toggling is managed by the browser
                if (videoPlayerTag.paused) {
                    videoPlayerTag.play();
                } else {
                    videoPlayerTag.pause();
                }
            }
        } else {
            //trigger the loading of the VAST tag instead
            player.prepareVast();
        }
    },

    setCustomControls: function() {
        var player = this;
        var videoPlayerTag = document.getElementById(this.videoPlayerId);

        //Set the Play/Pause behaviour
        document.getElementById(this.videoPlayerId).addEventListener('click', function() {player.playPauseToggle(videoPlayerTag);}, false);
        document.getElementById(this.videoPlayerId + '_vast_control_playpause').addEventListener('click', function() {player.playPauseToggle(videoPlayerTag);}, false);

        document.getElementById(player.videoPlayerId).addEventListener('play', function() {
            player.controlPlayPauseToggle(player.videoPlayerId, true);
            player.contolVolumebarUpdate(player.videoPlayerId);
        }, false);

        document.getElementById(player.videoPlayerId).addEventListener('vastplayerpause', function() {
            player.controlPlayPauseToggle(player.videoPlayerId, false);
        }, false);

        //Set the progressbar
        videoPlayerTag.addEventListener('timeupdate', function(){
            player.contolProgressbarUpdate(player.videoPlayerId);
        });
        
        document.getElementById(player.videoPlayerId + '_vast_controls_progress_container').addEventListener('click', function(event) {
            player.onProgressbarClick(player.videoPlayerId, event);
        }, false);

        //Set the volume contols
        document.getElementById(player.videoPlayerId + '_vast_control_volume_container').addEventListener('click', function(event) {
            player.onVolumebarClick(player.videoPlayerId, event);
        }, false);

        videoPlayerTag.addEventListener('volumechange', function(){
            player.contolVolumebarUpdate(player.videoPlayerId);
        });

        document.getElementById(player.videoPlayerId + '_vast_control_mute').addEventListener('click', function(){
            player.muteToggle(player.videoPlayerId);
        });

        //Set the fullscreen control
        document.getElementById(player.videoPlayerId + '_vast_control_fullscreen').addEventListener('click', function(){
            player.fullscreenToggle(player.videoPlayerId);
        });
    },

    setDefaultLayout: function() {
        var player = this;

        //Load the icon css
        vastPlayerClass.requestStylesheet('defaultLayoutIcons', vastPlayerClass.defaultIconUrl);
        vastPlayerClass.requestStylesheet('defaultControlsStylesheet', vastPlayerClass.defaultControlsStylesheet);

        var videoPlayerTag = document.getElementById(player.videoPlayerId);

        //Remove the default Controls
        videoPlayerTag.removeAttribute('controls');

        var divVastControls = document.createElement('div');
        divVastControls.id = player.videoPlayerId + '_vast_controls_container';
        divVastControls.className = 'vast_controls_container';
        divVastControls.innerHTML = player.generateCustomControlTags();

        videoPlayerTag.parentNode.insertBefore(divVastControls, videoPlayerTag.nextSibling);

        //Create the loading cover
        var divLoading = document.createElement('div');
        divLoading.className = 'vast_video_loading';
        divLoading.id = 'vast_video_loading_' + player.videoPlayerId;
        divLoading.style.display = 'none';
        divLoading.innerHTML = '<i class="material-icons md-48">' + vastPlayerClass.controlMaterialIconsGetMappedIcon('hourglass_empty') + '</i>';

        videoPlayerTag.parentNode.insertBefore(divLoading, videoPlayerTag.nextSibling);

        //Wait for the volume bar to be rendered
        setTimeout(function() {
            player.contolVolumebarUpdate(player.videoPlayerId);
        }, 100);

        player.setCustomControls();
    },

    setLayout: function() {
        switch (this.displayOptions.layout) {
            case 'default':
                this.setDefaultLayout();
                break;

            case 'custom':
                //TODO
                break;

            case 'browser':
                var player = this;
                var videoPlayerTag = document.getElementById(player.videoPlayerId);
                videoPlayerTag.addEventListener('click', function() {console.log('test'); player.playPauseToggle(videoPlayerTag);}, false);
                break;
            default:
                break;
        }
    },

    handleFullscreen: function() {
        var videoPlayerId = this.videoPlayerId;
        var player = this;

        if (typeof document.vastFullsreenChangeEventListenersAdded === 'undefined') {
            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange'].forEach(
                function(eventType) {

                    if (typeof (document['on' + eventType]) === 'object') {
                        document.addEventListener(eventType, function(ev) {
                            player.recalculateAdDimensions(videoPlayerId);
                        }, false);
                    }
                }
            );

            document.vastFullsreenChangeEventListenersAdded = true;
        }
    },

    init: function(idVideoPlayer, vastTag, options) {
        var player = this;

        player.vastOptions = {
            vastTagUrl:   vastTag,
            tracking:     [],
            stopTracking: []
        };

        player.videoPlayerId        = idVideoPlayer;
        player.originalSrc          = player.getCurrentSrc();
        player.isCurrentlyPlayingAd = false;
        player.recentWaiting        = false;
        player.latestVolume         = 1;
        player.currentVideoDuration = 0;
        player.initialStart         = false;

        //Default options
        player.displayOptions = {
            mediaType : 'video/mp4',//TODO: should be taken from the VAST Tag; consider removing it completely, since the supported format is browser-dependent
            skipButtonCaption: 'Skip ad in [seconds]',
            skipButtonClickCaption: 'Skip ad &#9193;',
            layout: 'default', //options: browser, default, custom
            vastTimeout: 5000, //number of milliseconds before the VAST Tag call timeouts
            vastLoadedCallback: (function() {}),
            noVastVideoCallback: (function() {}),
            vastVideoSkippedCallback: (function() {}),
            vastVideoEndedCallback: (function() {})
        };

        //Overriding the default options
        for (var key in options) {
            player.displayOptions[key] = options[key];
        }

        var videoPlayer = document.getElementById(idVideoPlayer);

        //Create a Wrapper Div element
        var divVideoWrapper = document.createElement('div');
        divVideoWrapper.className = 'vast_video_wrapper';
        divVideoWrapper.id = 'vast_video_wrapper_' + idVideoPlayer;

        //Assign the height/width dimensions to the wrapper
        divVideoWrapper.style.height = videoPlayer.clientHeight + 'px';
        divVideoWrapper.style.width = videoPlayer.clientWidth + 'px';
        videoPlayer.style.height = '100%';
        videoPlayer.style.width = '100%';

        videoPlayer.parentNode.insertBefore(divVideoWrapper, videoPlayer);
        divVideoWrapper.appendChild(videoPlayer);

        videoPlayer.addEventListener('webkitfullscreenchange', player.recalculateAdDimensions, false);
        videoPlayer.addEventListener('fullscreenchange', player.recalculateAdDimensions, false);
        videoPlayer.addEventListener('waiting', player.onRecentWaiting, false);
        videoPlayer.addEventListener('pause', player.onVastPlayerPause, false);
        videoPlayer.addEventListener('durationchange', function() {player.currentVideoDuration = player.getCurrentVideoDuration();}, false);

        //Manually load the video duration if the video was loaded before adding the event listener
        player.currentVideoDuration = player.getCurrentVideoDuration();

        if (isNaN(player.currentVideoDuration)) {
            player.currentVideoDuration = 0;
        }

        player.setLayout();

        //Set the volume control state
        player.latestVolume = videoPlayer.volume;

        //Set the custom fullscreen behaviour
        player.handleFullscreen();
    }
};