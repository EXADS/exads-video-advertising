# EXADS Video Advertising

## Preferable Video Format
* Type: MPEG-4 video (video/mp4)
* Video Codec: H.264
* Audio Codec MPEG-4 AAC


## Log File Format

### video_views.log

1. date (Y-m-d H:i:s)
2. user_ip (IPv4)
3. country (3-letter ISO)
4. idlanguage (int)
5. site_hostname (varchar)
6. idadvertiser (int)
7. idpublisher (int)
8. idsite (int)
9. idzone (int)
10. idcategory (int)
11. idcampaign (int)
12. idvariation (int)
13. idos (int)
14. idbrowser (int)
15. iddevice (int)
16. idcarrier (int)
17. idisp (int)
18. sub (int)
19. value (float)
20. publisher_rate (int)
21. publisher_currency (3-letter ISO)
22. campaign_currency (3-letter ISO)
23. exchange_to_publisher (float) -> Currency exchange rate to be used to convert from the campaign currency to the publisher currency
24. exchange_to_network (float) -> Currency exchange rate to be used to convert from the campaign currency to USD
25. ad_type (int)
26. ad_format (varchar)
27. idnetwork (int)
28. country_original (3-letter ISO)
29. http_x_forwarded_for (IPv4)
30. idproduct_category (int)
31. pricing_model (int)
32. https (int)
33. screen_resolution (varchar)
34. user_id (varchar)
35. url_hash (varchar)
36. impression_status (int)
37. impression_invalid_reason (int)
38. referer_site_hostname (varchar)
39. adblock (int)
40. idoffer (int)
41. idlanding_page (int)
42. video_event (int) - 2: "10 seconds being watched"
43. errorcode (int)

IMPORTANT:
- "video_event" - Currently we support only a "10 seconds being watched" event, but more types may be added in the future.

### video_hits.log (The same fields as impressions.log)
1. date (Y-m-d H:i:s)
2. user_ip (IPv4)
3. country (3-letter ISO)
4. idlanguage (int)
5. site_hostname (varchar)
6. idadvertiser (int)
7. idpublisher (int)
8. idsite (int)
9. idzone (int)
10. idcategory (int)
11. idcampaign (int)
12. idvariation (int)
13. idos (int)
14. idbrowser (int)
15. iddevice (int)
16. idcarrier (int)
17. idisp (int)
18. sub (int)
19. value (float)
20. publisher_rate (int)
21. publisher_currency (3-letter ISO)
22. campaign_currency (3-letter ISO)
23. exchange_to_publisher (float) -> Currency exchange rate to be used to convert from the campaign currency to the publisher currency
24. exchange_to_network (float) -> Currency exchange rate to be used to convert from the campaign currency to USD
25. ad_type (int)
26. ad_format (varchar)
27. idnetwork (int)
28. country_original (3-letter ISO)
29. http_x_forwarded_for (IPv4)
30. idproduct_category (int)
31. pricing_model (int)
32. https (int)
33. screen_resolution (varchar)
34. user_id (varchar)
35. url_hash (varchar)
36. impression_status (int)
37. impression_invalid_reason (int)
38. referer_site_hostname (varchar)
39. adblock (int)
40. idoffer (int)
41. idlanding_page (int)
