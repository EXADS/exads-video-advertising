/*
 * HTML5VAST - Play VAST 3.0 Ads on HTML5 Video
 * http://html5vast.com
 * Sadan Nasir
 * version 1.3 2015-04-15
 * Creative Commons Attribution-NonCommercial 4.0 International License
 * http://creativecommons.org/licenses/by-nc/4.0/
*/
 
	var obj_vast;
	var video_player_ids = [];
	
	function html5vast(video_player_id, vast_url, options){
		if (video_player_ids.indexOf(video_player_id) === -1) {
			video_player_ids.push(video_player_id);
		}
		
		var video_player = document.getElementById(video_player_id);
		
		//Default options
		var html5vast_options = {
			'media_type' : 'video/mp4',
			'media_bitrate_min' : 200,
			'media_bitrate_max' : 1200,
			'ad_caption': 'Advertisement',
			'skip_button_caption': 'Skip ad in [seconds]',
			'skip_button_click_caption': 'Skip ad &#9193;'
		};
		for(var key in options){
			html5vast_options[key] = options[key];
		}
		
		//Create Wrapper Div
		var wrapper_div = document.createElement('div');
		wrapper_div.className = 'h5vwrapper';
		wrapper_div.id = 'h5vwrapper_'+video_player_id;
		video_player.parentNode.insertBefore(wrapper_div,video_player);
		wrapper_div.appendChild(video_player);

		video_player.addEventListener('webkitfullscreenchange', recalculateAdDimensions, false);
		video_player.addEventListener('fullscreenchange', recalculateAdDimensions, false);
		
		
		obj_vast = h5vReadFile(vast_url,html5vast_options);
		
		h5vPreRoll(video_player_id, html5vast_options);
	}
	
	document.onfullscreenchange = function ( event ) { 
		recalculateAdDimensions();
	};
	
	document.onmozfullscreenchange = function ( event ) { 
		recalculateAdDimensions();
	};
	
	function recalculateAdDimensions()
	{
		for (var i = 0; i < video_player_ids.length; i++) {
			video_player_id = video_player_ids[i];
			
			var video_player = document.getElementById(video_player_id);
			var caption_div = document.getElementById('h5vcaption_'+video_player_id);
			
			caption_div.style.left = (video_player.offsetWidth / 2) - (document.getElementsByClassName("h5vcaption")[0].offsetWidth / 2) + 'px';
		}
	}
	
	//Parse VAST XML
	function h5vReadFile(vast_url, options){
		//Read XML file
		var xmlHttpReq; var xmlDoc;
		if (window.XMLHttpRequest){
			xmlHttpReq=new XMLHttpRequest();
		}
		else{
		  xmlHttpReq=new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlHttpReq.open("GET",vast_url,false);
		xmlHttpReq.send();
		xmlDoc=xmlHttpReq.responseXML;
		
		obj_vast = {};
		
		//Get impression tag
		var impression = xmlDoc.getElementsByTagName("Impression");
		if(impression != null){
			//obj_vast.impression_url = impression[0].childNodes[0].nodeValue;
			obj_vast.impression = impression;
		}
		
		//Set initial values
		obj_vast.skipoffset = false;
		obj_vast.ad_finished = false;
		
		//Get Creative
		var creative = xmlDoc.getElementsByTagName("Creative");				
		var media_files;
		var tracking_events;
		
		for(var i=0;i<creative.length;i++){
			var creative_linear = creative[i].getElementsByTagName("Linear");
			if(creative_linear != null){
				for(var j=0;j<creative_linear.length;j++){
					//Skip Offset
					var skip_offset = creative_linear[j].getAttribute('skipoffset');
					
					obj_vast.skipoffset = convertTimeStringToSeconds(skip_offset);
					
					//Get media files
					var creative_linear_mediafiles = creative_linear[j].getElementsByTagName("MediaFiles");
					if(creative_linear_mediafiles!=null){
						for(var k=0;k<creative_linear_mediafiles.length;k++){
							var creative_linear_mediafiles_mediafile = creative_linear_mediafiles[k].getElementsByTagName("MediaFile");
							if(creative_linear_mediafiles_mediafile!=null){
								media_files = creative_linear_mediafiles_mediafile;
							}
						}
					}
					
					//Get Clickthrough URL
					var creative_linear_videoclicks = creative_linear[j].getElementsByTagName("VideoClicks");
					if(creative_linear_videoclicks!=null){
						for(var k=0;k<creative_linear_videoclicks.length;k++){
							var creative_linear_videoclicks_clickthrough = creative_linear_videoclicks[k].getElementsByTagName("ClickThrough")[0].childNodes[0].nodeValue;
							var creative_linear_videoclicks_clickthrough_tracking = creative_linear_videoclicks[k].getElementsByTagName("ClickTracking");
							if(creative_linear_videoclicks_clickthrough!=null){
								obj_vast.clickthrough_url = creative_linear_videoclicks_clickthrough;
							}
							if(creative_linear_videoclicks_clickthrough_tracking!=null){
								obj_vast.clickthrough_tracking = creative_linear_videoclicks_clickthrough_tracking;
							}
						}
					}
					
					//Get Tracking Events
					var creative_linear_trackingevents = creative_linear[j].getElementsByTagName("TrackingEvents");
					if(creative_linear_trackingevents!=null){
						for(var k=0;k<creative_linear_trackingevents.length;k++){
								var creative_linear_trackingevents_tracking = creative_linear_trackingevents[k].getElementsByTagName("Tracking");
								if(creative_linear_trackingevents_tracking!=null){
									tracking_events = creative_linear_trackingevents_tracking;
								}
						}
					}
					
					//Get AD Duration
					
					var creative_linear_duration =  creative_linear[j].getElementsByTagName("Duration")[0];
					if(creative_linear_duration!=null){
						obj_vast.duration = creative_linear_duration.childNodes[0].nodeValue;
						var arrD = obj_vast.duration.split(':');
						var strSecs = (+arrD[0]) * 60 * 60 + (+arrD[1]) * 60 + (+arrD[2]);
						obj_vast.duration = strSecs;
					}
					
				}
			}
		}
		
		var fallback_media_file;
						
		for(var i=0;i<media_files.length;i++){
			if (!media_files[i].getAttribute('type') || !media_files[i].getAttribute('bitrate')) {
				fallback_media_file = media_files[i].childNodes[0].nodeValue;
			}
			
			if(media_files[i].getAttribute('type')==options.media_type){
				if((media_files[i].getAttribute('bitrate')>options.media_bitrate_min) && (media_files[i].getAttribute('bitrate')<options.media_bitrate_max)){
					obj_vast.media_file=media_files[i].childNodes[0].nodeValue;
				}
			}
		}
		
		if (!obj_vast.media_file) {
			obj_vast.media_file = fallback_media_file;
		}
		
		//Tracking events
		for(var i=0;i<tracking_events.length;i++){
				if(tracking_events[i].getAttribute('event')=="start"){
						if(obj_vast.tracking_start != null){
							obj_vast.tracking_start += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_start =tracking_events[i].childNodes[0].nodeValue;
						}						
						obj_vast.tracking_start_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="progress"){
						if (typeof obj_vast.tracking_progress === 'undefined') {
							obj_vast.tracking_progress = [];
						}
						if (typeof obj_vast.tracking_progress_tracked === 'undefined') {
							obj_vast.tracking_progress_tracked = [];
						}
						if (typeof obj_vast.tracking_progress_offset === 'undefined') {
							obj_vast.tracking_progress_offset = [];
						}
						
						if (obj_vast.tracking_progress[i] != null){
							obj_vast.tracking_progress[i] += " " + tracking_events[i].childNodes[0].nodeValue;
						} else {
							obj_vast.tracking_progress[i] = tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_progress_tracked[i] = false;
						obj_vast.tracking_progress_offset[i] = convertTimeStringToSeconds(tracking_events[i].getAttribute('offset'));
				}
				if(tracking_events[i].getAttribute('event')=="firstQuartile"){
						if(obj_vast.tracking_first_quartile != null){
							obj_vast.tracking_first_quartile += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_first_quartile =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_first_quartile_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="midpoint"){
						if(obj_vast.tracking_midpoint != null){
							obj_vast.tracking_midpoint += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_midpoint =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_midpoint_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="thirdQuartile"){
						if(obj_vast.tracking_third_quartile != null){
							obj_vast.tracking_third_quartile += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_third_quartile =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_third_quartile_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="complete"){
						if(obj_vast.tracking_complete != null){
							obj_vast.tracking_complete += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_complete =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_complete_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="mute"){
						if(obj_vast.tracking_mute != null){
							obj_vast.tracking_mute += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_mute =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_mute_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="unmute"){
						if(obj_vast.tracking_unmute != null){
							obj_vast.tracking_unmute += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_unmute =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_unmute_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="pause"){
						if(obj_vast.tracking_pause != null){
							obj_vast.tracking_pause += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_pause =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_pause_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="resume"){
						if(obj_vast.tracking_resume != null){
							obj_vast.tracking_resume += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_resume =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_resume_tracked=false;
				}
				if(tracking_events[i].getAttribute('event')=="fullscreen"){
						if(obj_vast.tracking_fullscreen != null){
							obj_vast.tracking_fullscreen += " "+tracking_events[i].childNodes[0].nodeValue;
						}else{
							obj_vast.tracking_fullscreen =tracking_events[i].childNodes[0].nodeValue;
						}
						obj_vast.tracking_fullscreen_tracked=false;
				}
		}
		
		return obj_vast;
	}
	
	//Preroll 
	function h5vPreRoll(video_player_id, options){
		var video_player = document.getElementById(video_player_id);
		
		
		//Video play event
		var prev_src = h5vGetCurrentSrc(video_player_id);
		var video_player_play = function(event) { 
				
				//Change source to PreRoll
				video_player.src = obj_vast.media_file;
				video_player.load();
				
				//On content load
				var video_player_loaded = function(event){
					//Get the actual duration from the video file if it is not present in the VAST XML
					if (obj_vast.duration == null) {
						obj_vast.duration = video_player.duration;
					}
					
					h5vAddClickthrough(video_player_id,obj_vast);
					h5vAddCaption(video_player_id,options.ad_caption);	
					
					if (obj_vast.skipoffset !== false) {
						h5vAddSkipButton(video_player_id,options.skip_button_caption, options.skip_button_click_caption, obj_vast.skipoffset);	
					}
					
					video_player.removeAttribute("controls"); //Remove Controls
					
					video_player.play();							
					
					//Fire impression(s)
					if (
						(obj_vast.impression != null)
						&& (typeof obj_vast.impression.length !== 'unknown')
					) {
						for(var k=0;k<obj_vast.impression.length;k++){
							h5vAddPixel(obj_vast.impression[k].childNodes[0].nodeValue); 
						}
					}
					video_player.removeEventListener('loadedmetadata',video_player_loaded);
				}
				
				//On PreRoll End
				var video_player_ended = function(event){
					h5vVideoPlayerEnded(video_player, 'h5vskipbutton_' + video_player.id, prev_src);
					video_player.removeEventListener('ended', video_player_ended);
				}
				
				video_player.addEventListener('loadedmetadata', video_player_loaded);
				video_player.addEventListener('ended', video_player_ended);						
				video_player.removeEventListener('play', video_player_play);					
		}
		
		
		//Ping Tracking URIs
		
		var video_player_timeupdate  = function(event){
			if (obj_vast.ad_finished) {
				video_player.removeEventListener('timeupdate', video_player_timeupdate);
				return;
			}
			
			var img_track = new Image();
			var current_time =Math.floor(video_player.currentTime);
			
			if((current_time==0)){ //Start				
				
				if(obj_vast.tracking_start_tracked ==false){
					if(obj_vast.tracking_start != null){
						var arrTrack = obj_vast.tracking_start.split(" ");
						for(var i=0;i<arrTrack.length;i++){
							var img_track = new Image();
							img_track.src=arrTrack[i];
						}
					}
					obj_vast.tracking_start_tracked=true;
				}				
			}
			
			//obj_vast.tracking_progress_offset[i]
			if (obj_vast.tracking_progress_offset && obj_vast.tracking_progress_offset.length) { //Progress
				obj_vast.tracking_progress_offset.forEach(function(currentValue, index, arr) {
					if (current_time == (Math.floor(currentValue))) {
						if (obj_vast.tracking_progress_tracked[index] ==false) {
							if (obj_vast.tracking_progress[index] != null) {
								var arrTrack = obj_vast.tracking_progress[index].split(" ");
								for (var i = 0; i < arrTrack.length; i++){
									var img_track = new Image();
									img_track.src=arrTrack[i];
								}
							}
							obj_vast.tracking_progress_tracked[index] = true;
						}
					}
				});
			}
			
			if((current_time==(Math.floor(obj_vast.duration/4)))){ //First Quartile			
				if(obj_vast.tracking_first_quartile_tracked ==false){
					if(obj_vast.tracking_first_quartile != null){
						var arrTrack = obj_vast.tracking_first_quartile.split(" ");
						for(var i=0;i<arrTrack.length;i++){
							var img_track = new Image();
							img_track.src=arrTrack[i];
						}
					}
					obj_vast.tracking_first_quartile_tracked=true;
				}
			}
			if((current_time==(Math.floor(obj_vast.duration/2)))){ //Mid Point
				if(obj_vast.tracking_midpoint_tracked ==false){
					if(obj_vast.tracking_midpoint != null){
						var arrTrack = obj_vast.tracking_midpoint.split(" ");
						for(var i=0;i<arrTrack.length;i++){
							var img_track = new Image();
							img_track.src=arrTrack[i];
						}
					}
					obj_vast.tracking_midpoint_tracked=true;
				}
			}
			if((current_time==((Math.floor(obj_vast.duration/2)) + (Math.floor(obj_vast.duration/4))))){ //Third Quartile
				if(obj_vast.tracking_third_quartile_tracked ==false){
					if(obj_vast.tracking_third_quartile != null){
						var arrTrack = obj_vast.tracking_third_quartile.split(" ");
						for(var i=0;i<arrTrack.length;i++){
							var img_track = new Image();
							img_track.src=arrTrack[i];
						}
					}
					obj_vast.tracking_third_quartile_tracked=true;
				}
			}
			
			if((current_time>=(obj_vast.duration-1))){ //End
				if(obj_vast.tracking_complete_tracked ==false){
					if(obj_vast.tracking_complete != null){
						var arrTrack = obj_vast.tracking_complete.split(" ");
						for(var i=0;i<arrTrack.length;i++){
							var img_track = new Image();
							img_track.src=arrTrack[i];
						}
					}
					obj_vast.tracking_complete_tracked=true;
				}
				video_player.removeEventListener('timeupdate', video_player_timeupdate);
				obj_vast.ad_finished = true;
			}
			
				
		}
		video_player.addEventListener('play', video_player_play);
		video_player.addEventListener('timeupdate', video_player_timeupdate);
		
		video_player.ontimeupdate = function() {video_player_timeupdate()};
	}
	
	function h5vVideoPlayerEnded(video_player, button_id, src){
		video_player.src = src;
		video_player.load();
		video_player.play();
		h5vRemoveClickthrough(video_player.id);
		h5vRemoveCaption(video_player.id);
		h5vRemoveSkipButton(button_id);
		
		obj_vast.ad_finished = true;
		
		video_player.setAttribute("controls","controls"); //Add Controls back in
	}
	
	//Add Caption
	function h5vAddCaption(video_player_id, caption_text){
		var video_player = document.getElementById(video_player_id);
		var wrapper_div = document.getElementById('h5vwrapper_'+video_player_id);
		
		//Create Caption div
		var caption_div = document.createElement('div');
		caption_div.className = 'h5vcaption';
		caption_div.id='h5vcaption_'+video_player_id;
		caption_div.innerHTML=caption_text;
		wrapper_div.appendChild(caption_div);			
		//Adjust style
		var caption_div_left = (video_player.offsetWidth/2)-(document.getElementsByClassName("h5vcaption")[0].offsetWidth/2)+'px';
		caption_div.style.left=caption_div_left;
	}
	
	//Add a Skip Button
	function h5vAddSkipButton(video_player_id, skip_text, skip_button_click_caption, seconds){
		var video_player = document.getElementById(video_player_id);
		var wrapper_div = document.getElementById('h5vwrapper_'+video_player_id);
		
		//Create the skip button div
		var skip_div = document.createElement('div');
		skip_div.className = 'h5vskipbutton h5vskipbutton_disabled';
		skip_div.id = 'h5vskipbutton_' + video_player_id;
		
		wrapper_div.appendChild(skip_div);
		
		h5vDecreaseSkipOffset('h5vskipbutton_' + video_player_id, video_player_id, skip_text, skip_button_click_caption, seconds);
	}
	
	function h5vDecreaseSkipOffset(button_id, video_player_id, label, click_label, seconds)
	{
		var sec = parseInt(seconds, 10);
		
		var btn = document.getElementById(button_id);
		
		if (btn) {
			if (sec >= 0) {
				//set the button label with the remaining seconds
				btn.innerHTML = label.replace('[seconds]', sec);
				
			} else {
				//make the button clickable
				btn.innerHTML = '<a href="javascript:;" onclick="h5vPressSkipButton(\'' + button_id + '\', \'' + video_player_id + '\');">'
					+ click_label
					+ '</a>';
				
				//removes the CSS class for a disabled button
				btn.className = btn.className.replace(/\bh5vskipbutton_disabled\b/,'');
			}
			
		} else {
			sec = -1;
		}
		
		sec--;
		
		setTimeout(function () {
			if (sec >= -1) {
				h5vDecreaseSkipOffset(button_id, video_player_id, label, click_label, sec);
			}
		}, 1000);
	}
	
	function h5vPressSkipButton(button_id, video_player_id){
		h5vRemoveSkipButton(button_id);
		h5vVideoPlayerEnded(document.getElementById(video_player_id), button_id, h5vGetCurrentSrc(video_player_id));
	}
	
	function h5vRemoveSkipButton(button_id){
		btn = document.getElementById(button_id);
		if (btn) {
			btn.parentElement.removeChild(btn);
		}
	}

	
	//Remove Caption
	function h5vRemoveCaption(video_player_id){
		var elem = document.getElementById('h5vcaption_'+video_player_id);
		elem.parentNode.removeChild(elem);
	}
	
	//Add Clickthrough
	function h5vAddClickthrough(video_player_id,obj_vast){
		var video_player = document.getElementById(video_player_id);
		var wrapper_div = document.getElementById('h5vwrapper_'+video_player_id);
		//Create Clickthrough div
		var clickt_div = document.createElement('div');
		clickt_div.className = 'h5vclickt';
		clickt_div.id='h5vclickt_'+video_player_id;
		clickt_div.style.position='absolute';
		clickt_div.style.cursor = 'pointer';
		clickt_div.style.left=0;
		clickt_div.style.top=0;
		clickt_div.style.width=video_player.offsetWidth+'px';
		clickt_div.style.height=(video_player.offsetHeight - 50)+'px';
		//clickt_div.innerHTML="<a href='' style='width:100%;height:100%;'></a>";
		wrapper_div.appendChild(clickt_div);
		//Bind Onclick
		var clickt_obj = document.getElementById('h5vclickt_'+video_player_id);
		clickt_obj.onclick = function(){
			window.open(obj_vast.clickthrough_url);
			
			//Clickthorugh Tracking
			if(obj_vast.clickthrough_tracking !=null){
				for(var k=0;k<obj_vast.clickthrough_tracking.length;k++){
					var img_track = new Image();
					img_track.src=obj_vast.clickthrough_tracking[k].childNodes[0].nodeValue;
				}
			}
		};
	}
	
	//Remove Clickthrough
	function h5vRemoveClickthrough(video_player_id){
		var elem = document.getElementById('h5vclickt_'+video_player_id);
		elem.parentNode.removeChild(elem);
	}
	
	//Get current video source src
	function h5vGetCurrentSrc(video_player_id){			
		return document.getElementById(video_player_id).getElementsByTagName("source")[0].getAttribute("src");
	}
	
	//Add pixel for firing impressions, tracking etc
	function h5vAddPixel(pixel_url){
		var image = new Image(1,1); 
		image.src = pixel_url;
	}
	
	function convertTimeStringToSeconds(str){
		if (str && str.match(/^(\d){2}(:[0-5][0-9]){2}(.(\d){3})?$/)) {
			var time_parts = str.split(':');
			return ((parseInt(time_parts[0], 10)) * 3600) + ((parseInt(time_parts[1], 10)) * 60) + (parseInt(time_parts[2], 10));
		}
		
		return false;
	}