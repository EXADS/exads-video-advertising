# EXADS Video Advertising

## What is VAST
The IAB Digital Video Ad Serving Template (VAST) specification is a universal XML schema for serving ads to digital video players, and describes expected video player behavior when executing VAST-formatted ad responses.

In short, VAST makes it possible for an ad provider to serve ads to various video players using a universal way of communication which all these players understand.

A thorough description of the overall idea behind VAST, as well as the full VAST specification, can be found here: [VAST 3.0](http://www.iab.com/guidelines/digital-video-ad-serving-template-vast-3-0/).

## How VAST Works
1. VAST Request: The video player makes a call to the ad server for a VAST response.
2. VAST Inline Response: The ad server responds with a VAST Inline response that contains all the media files and tracking URIs required to display and track the ad.
3. Tracking URIs Pinged: The video player requests tracking resources from the tracking URIs provided when associated events occur in the ad.

## Events and Statistics
Currently the system tracks 3 events when a VAST ad is being processed:
* Selecting a specific In-stream ad to display: the exact timing of the event depends on the video player, but most often it is triggered when the site visitor presses the player Play button. In the ExoClick statistics a new Video Impression is registered.
* 10 seconds being watched at normal speed: when this event takes place, the video player notifies the ad provider. Then the CPV charge is triggered. This event is displayed in the ExoClick statistics as a Video View.
* Clicking on the In-stream ad: the video player notifies the ad provider, so a standard click event is registered. The ExoClick statistics displays it as a standard Click.

## VAST for Advertisers

### In-Stream Campaign Generation in ExoClick
The steps in generating an In-stream campaign are similar to the generation of any other campaign type. Nevertheless, there are a few specific settings if the new **In-Stream** ad format is selected:
* Configuring the pricing: a new pricing model, called CPV (Cost-Per-View) is the only available model. The Adveritser sets the cost, which is triggered when 10 seconds of the video ad are displayed to the visitor at normal speed.
* When setting one or more variations, the Advertiser uploads a single video file for each variation. Further below there is a description of the video file requirements.

### Video Ad Requirements

* Preferable Video Format
  * Type: MPEG-4 video (video/mp4)
  * Video Codec: H.264
  * Audio Codec MPEG-4 AAC
* Video File Size: Currently the uploaded video files are limited to 50MB.
* Aspect Ratio: Popular video players automatically resize the video so that it fits to their dimensions while keeping the ratio. Nevertheless, a ratio matching the player ratio (if known) is preferable.
* Resolution: No limitation.
* Maximum Duration: No limitation, although at least 10 seconds are required for the CPV model to count a 10-second view.

## VAST for Publishers

### Structure of the VAST XML
The VAST XML is the response to the video player, containing a set of instructions, so that the player knows which ads to display and how to display them. [Here](https://github.com/EXADS/exads-video-advertising/blob/master/sample_vast_tag.xml) is a sample structure of a VAST XML response.
The VAST specification is very flexible regarding ad types, ways of displaying them and registering events. Currently we support the following instructions, represented in the sample XML:
* Displaying an In-stream video ad before the actual video. The information about the ad is placed in the **Creative** section.
* Optionally displaying a SKIP button, which can be initially disabled for a given number of seconds. This is set in the **Linear skipoffset** attribute.
* URI to the actual video file: the **MediaFile** element.
* URL, used to redirect the user upon clicking on the video ad: the **ClickThrough** element.
* URL(s), used by the video player to report various actions that took place while playing the video: the **Tracking** element(s). Currently we register the event of displaying 10 seconds of the video at normal speed.
* **Error**: this URL is used by the video player to report various problems while trying to display an ad. The VAST-compatible players automatically replace the **[ERRORCODE]** placeholder with an appropriate error code.

### In-Stream Ad Zone Generation in ExoClick
A Publisher in ExoClick is able to create In-stream ad zones, used for displaying the In-stream campaigns by the VAST-compatible video players. The steps to create an In-stream ad zone are similar to those of any other zones and one new setting is presented:
* Ability to set an optional Skip button, as well as the interval during which the button is disabled for clicking.

When the Publisher generates the ad zone, the system presents 2 options for setting the ad zone on a Publisher website:
* A unique VAST tag is presented. It looks similar to:
```
http://syndication.exoclick.com/splash.php?type=18&idzone=0000000
```
The advertiser can use the provided URL for setting the video player request and display a VAST ad. The exact integration is specific to each video player, so the player documentation should be followed.
* For a website using a single JW Player, an easier approach may be to use a javascript code block, provided by the ExoClick system, to automatically set the VAST tag to the player. The code block looks like this:
```
<script type="text/javascript" src="http://syndication.exoclick.com/instream-tag.php?idzone=0000000"></script>
```
**Note: The automatic integration is in a beta stage. If it does not work for you, you can proceed with the generic approach of integrating the VAST Tag by following the JW Player documentation.**

## FAQ
##### I'm getting an empty VAST response, is this normal?
Yes, this is normal. When there is no video ad to show, our ad-server replies with an empty VAST XML, as per the VAST 3.0 standard. In such cases, your video player should simply play the content video without an ad.

We are not displaying a video ad on every single video play, so this behaviour is normal and to be expected.

## Changelog
* A full list of changes and updates can be found in the project [CHANGELOG](https://github.com/EXADS/exads-video-advertising/blob/master/CHANGELOG.md)
