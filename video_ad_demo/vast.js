if (typeof document.vastFullsreenChangeEventListenersAdded === 'undefined') {
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange'].forEach(
        function(eventType) {
            document.addEventListener(eventType, function() {
                var fullScreenElementName = '';

                switch (eventType) {
                    case 'webkitfullscreenchange':
                        fullScreenElementName = 'webkitFullscreenElement';
                        break;
                    case 'mozfullscreenchange':
                        fullScreenElementName = 'mozFullScreenElement';
                        break;
                    case 'msfullscreenchange':
                        fullScreenElementName = 'msFullscreenElement';
                        break;
                    default:
                        fullScreenElementName = 'fullscreenElement';
                        break;
                }

                if (document[fullScreenElementName] !== null) {
                    //Fullscreen enabled
                    vastPlayerClass.lastFullscreenPlayer = document[fullScreenElementName].id;
                }

                if (vastPlayerClass.lastFullscreenPlayer !== '') {
                    vastPlayerClass.getInstanceById(vastPlayerClass.lastFullscreenPlayer).recalculateAdDimensions();
                }
            }, false)
        }
    );

    document.vastFullsreenChangeEventListenersAdded = true;
}

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
    instances: [],
    lastFullscreenPlayer: '',
    notCloned: ['notCloned', 'instances', 'lastFullscreenPlayer', 'getInstanceById', 'vastOptions', 'displayOptions'],

    getInstanceById: function(playerId) {
        for (var i = 0; i < this.instances.length; i++) {
            if (this.instances[i].videoPlayerId == playerId) {
                return this.instances[i];
            }
        }
        
        return null;
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

    recalculateAdDimensions: function() {
        var videoPlayer     = document.getElementById(this.videoPlayerId);
        var divClickThrough = document.getElementById('vast_clickthrough_layer_' + this.videoPlayerId);

        if (divClickThrough) {
            divClickThrough.style.width  = videoPlayer.offsetWidth + 'px';
            divClickThrough.style.height = videoPlayer.offsetHeight + 'px';
        }
    },

    /**
     * Parse the VAST Tag
     *
     * @param string vastTag
     */
    parseVastTag: function(vastTag) {
        var player = this;

        var xmlHttpReq;
        var xmlResponse;

        if (window.XMLHttpRequest) {
            xmlHttpReq = new XMLHttpRequest();

        } else {
            //IE
            xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xmlHttpReq.onreadystatechange = function() {
            if (!(xmlHttpReq.readyState == 4 && xmlHttpReq.status == 200)) {
                return;
            }

            xmlResponse = xmlHttpReq.responseXML;
            
            //Get impression tag
            var impression = xmlResponse.getElementsByTagName("Impression");
            if(impression != null) {
                player.registerImpressionEvents(impression);
            }

            //Set initial values
            player.vastOptions.skipoffset = false;
            player.vastOptions.adFinished = false;

            //Get Creative
            var creative = xmlResponse.getElementsByTagName("Creative");                

            //Currently only 1 creative and 1 linear is supported
            if ((typeof creative !== 'undefined') && creative.length) {
                var arrayCreativeLinears = creative[0].getElementsByTagName("Linear");

                if ((typeof arrayCreativeLinears !== 'undefined') && (arrayCreativeLinears != null) && arrayCreativeLinears.length) {
                    creativeLinear = arrayCreativeLinears[0];

                    //Extract the necessary data from the Linear node
                    player.vastOptions.skipoffset       = player.convertTimeStringToSeconds(creativeLinear.getAttribute('skipoffset'));
                    player.vastOptions.clickthroughUrl = player.getClickThroughUrlFromLinear(creativeLinear);
                    player.vastOptions.clicktracking    = player.getClickTrackingEvents(creativeLinear);
                    player.vastOptions.duration         = player.getDurationFromLinear(creativeLinear);
                    player.vastOptions.mediaFile       = player.getMediaFileFromLinear(creativeLinear);
                    
                    player.registerTrackingEvents();
                }

                if (typeof player.vastOptions.mediaFile !== 'undefined') {
                    player.preRoll();
                } else {
                    player.displayOptions.noVideoCallback();
                }
            } else {
                player.displayOptions.noVideoCallback();
            }
            player.displayOptions.loadedVastCallback();
        };

        xmlHttpReq.open("GET", vastTag, true);
        xmlHttpReq.withCredentials = true;
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

                videoPlayerTag.removeAttribute("controls"); //Remove Controls

                player.isCurrentlyPlayingAd = true;

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
            videoPlayerTag.removeEventListener('play', playVideoPlayer);
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

        videoPlayerTag.addEventListener('play', playVideoPlayer);
        videoPlayerTag.addEventListener('timeupdate', videoPlayerTimeUpdate);
    },

    onVastAdEnded: function() {
        //"this" is the HTML5 video tag, because it disptches the "ended" event
        var player = vastPlayerClass.getInstanceById(this.id);

        this.src = player.originalSrc;

        this.load();
        this.play();

        player.isCurrentlyPlayingAd = false;

        player.removeClickthrough();
        player.removeSkipButton();
        player.vastOptions.adFinished = true;
        player.displayOptions.videoEndedCallback();

        this.removeEventListener('ended', player.onVastAdEnded);
        this.setAttribute('controls', 'controls');
    },

    /**
     * Adds a Skip Button
     */
    addSkipButton: function() {
        var divSkipButton = document.createElement('div');
        divSkipButton.id = 'skip_button_' + this.videoPlayerId;
        divSkipButton.className = 'skip_button skip_button_disabled';

        document.getElementById('vast_video_wrapper_' + this.videoPlayerId).appendChild(divSkipButton);

        this.decreaseSkipOffset(this, this.vastOptions.skipoffset);
    },

    decreaseSkipOffset: function decreaseSkipOffset(player, seconds) {
        var sec = parseInt(seconds, 10);

        var btn = document.getElementById('skip_button_' + player.videoPlayerId);
        var videoPlayerTag = document.getElementById(player.videoPlayerId);

        if (btn) {
            if (sec >= 0) {
                //set the button label with the remaining seconds
                btn.innerHTML = player.displayOptions.skipButtonCaption.replace('[seconds]', sec);

            } else {
                //make the button clickable
                btn.innerHTML = '<a href="javascript:;" onclick="vastPlayerClass.getInstanceById(\'' + player.videoPlayerId + '\').pressSkipButton();">'
                    + player.displayOptions.skipButtonClickCaption
                    + '</a>';

                //removes the CSS class for a disabled button
                btn.className = btn.className.replace(/\bskip_button_disabled\b/,'');
            }

            sec = player.vastOptions.skipoffset - Math.floor(videoPlayerTag.currentTime);

        } else {
            sec = -1;
        }

        if (sec >= -1) {
            setTimeout(function () {
                decreaseSkipOffset(player, sec);
            }, 100);
        }
    },

    pressSkipButton: function() {
        this.removeSkipButton();
        this.displayOptions.videoEndedCallback();
        this.displayOptions.videoSkippedCallback();

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

    init: function(idVideoPlayer, vastTag, options) {
        this.vastOptions = {
            tracking:     [],
            stopTracking: []
        };

        this.displayOptions = {};
        
        this.videoPlayerId        = idVideoPlayer;
        this.originalSrc          = this.getCurrentSrc();
        this.isCurrentlyPlayingAd = false;

        var videoPlayer = document.getElementById(idVideoPlayer);

        //Default options
        this.displayOptions = {
            mediaType : 'video/mp4',//TODO: should be taken from the VAST Tag; consider removing it completely, since the supported format is browser-dependent
            skipButtonCaption: 'Skip ad in [seconds]',
            skipButtonClickCaption: 'Skip ad &#9193;',
            loadedVastCallback: (function() {}),
            noVideoCallback: (function() {}),
            videoSkippedCallback: (function() {}),
            videoEndedCallback: (function() {})
        };
        for (var key in options) {
            this.displayOptions[key] = options[key];
        }

        //Create a Wrapper Div element
        var divVideoWrapper = document.createElement('div');
        divVideoWrapper.className = 'vast_video_wrapper';
        divVideoWrapper.id = 'vast_video_wrapper_' + idVideoPlayer;
        videoPlayer.parentNode.insertBefore(divVideoWrapper, videoPlayer);
        divVideoWrapper.appendChild(videoPlayer);

        videoPlayer.addEventListener('webkitfullscreenchange', this.recalculateAdDimensions, false);
        videoPlayer.addEventListener('fullscreenchange', this.recalculateAdDimensions, false);

        this.parseVastTag(vastTag);
    }
};