# Integration Notes

In order to set the video player, two things are required:

* An HTML5 <video> tag;
* A small script that to set the player.

### Example 1 - Simple Integration
```
<video id='my-video' controls style="width: 640px; height: 360px;">
	<source src='vid.mp4' type='video/mp4' />		
</video>

<script type="text/javascript">
	var testVideo = fluidPlayer('my-video', 'http://example.com/vast.xml');
</script>
```
### Example 2 - Setting Optional Parameters
```
<video id='my-video' controls style="width: 640px; height: 360px;">
	<source src='vid.mp4' type='video/mp4' />		
</video>

<script type="text/javascript">
	var testVideo = fluidPlayer(
        'my-video',
        'http://example.com/vast.xml',
        {
            timelinePreview: {
                file: 'thumbnails.vtt',
                type: 'VTT'
            },
            layout: 'default',
            vastLoadedCallback: function() {console.log('vast loaded')},
            noVastVideoCallback: function() {console.log('no vast')},
            vastVideoSkippedCallback: function() {console.log('vast skipped')},
            vastVideoEndedCallback: function() {console.log('vast ended')}
        }
    );
</script>
```
## Optional Parameters
* ```timelinePreview``` - Sets the timeline preview, visible when hovering over the progress bar. The provided ```file``` contains a description of the thumbnail images used for the preview. The ```type``` sets the format of the file. Currently only the VTT format is supported. The timeline preview only works if the ```default``` layout is chosen (see below).
* ```layout``` - Two options are available. The default layout is ```default```. It provides own skin to the player. The other option is ```browser```. There, the standard video player layout and behaviour, specific for each browser, is used. Notes: on iPhone devices the ```default``` layout is not available, so the player switches automatically to ```browser``` layout.
* ```skipButtonCaption``` - The text, displayed on the Skip button. The text can contain the placeholder ```[seconds]```. The default value is ```Skip ad in [seconds]```.
* ```skipButtonClickCaption``` - The text, displayed when the Skip button is available for clicking.
* ```vastTimeout``` - The number of milliseconds before the VAST Tag call timeouts. Default: ```5000```.
* Callback functions - can be used to execute custom code when some key events occur. Currently the following events are supported: ```vastLoadedCallback```, ```noVastVideoCallback```, ```vastVideoSkippedCallback``` and ```vastVideoEndedCallback```.
