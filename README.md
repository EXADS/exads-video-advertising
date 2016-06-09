# EXADS Video Advertising

## Preferable Video Format
* Type: MPEG-4 video (video/mp4)
* Video Codec: H.264
* Audio Codec MPEG-4 AAC

## VAST Tag Integration
Each video player supporting VAST has its own way of integrating with a VAST tag, so the player documentation should be checked.

The VAST tag is a URL to a XML file. Since the file structure should always follow the strict VAST specification, the same VAST tag may be used with all video players supporting VAST.

The URL to a VAST tag, provided by ExoClick, looks like this:
```
http://syndication.exoclick.com/splash.php?type=18&idzone=0000000&vast_tag=1
```
Alternatively, if the web page uses jwPlayer 6+ and there is a single player instance on the page, a javascript code block similar to this one may be placed to automatically set the VAST tag:
```
<script type="text/javascript" src="http://syndication.exoclick.com/splash.php?type=18&idzone=0000000"></script>
```
