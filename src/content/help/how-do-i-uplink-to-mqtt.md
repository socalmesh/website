---
title: "How do I uplink to MQTT"
description: "SUSHI's settings for connecting your node to the SoCal Mesh MQTT server so your messages and position reach the community maps."
author: "SUSHI"
date: 2024-11-08
updated: 2026-08-19
tags: ["mqtt", "getting-started"]
---

*Originally posted by SUSHI in the SoCal Mesh Discord on November 8, 2024, and reproduced here
as written. The username and password below are the shared public ones for our broker — they are
meant to be public.*

## Care and feeding of the parrot

To have your messages appear here set your Lora Settings as follows:

- **OK to MQTT** Enabled
- **Ignore MQTT** Enabled

To uplink set your MQTT Config as follows:

- **Server:** `mqtt.socalmesh.org`
- **Topic:** `msh/US/CA/socalmesh` (it is case sensitive)
- **Username:** `meshdev`
- **Password:** `large4cats`
- **Encryption** enabled
- **JSON output** disabled

In the primary channel settings **Enable Uplink**. **DO NOT DOWNLINK**

## Other notes

- Gateways that are wifi enabled rather than client connected seem to be the most reliable.
- If you are a gateway then please enable the map report option for your location if possible. This helps us to see how far meshages are traveling.
- Uplinking to this MQTT server still gets you on [Liam's map](https://meshtastic.liamcottle.net/) and the public [meshmap](https://meshmap.net) site. In fact this is the only way aside from hosting your own server that you can get onto both maps from your own uplink.

---

*Notes added later by the site maintainers, outside SUSHI's original post. His settings above are
still right; these are context and two corrections.*

*__How our broker is set up.__ It is configured in the open — the topics it carries and the
brokers it bridges to are all in
[socalmesh/mqtt-config](https://github.com/socalmesh/mqtt-config).*

*__On reaching both maps.__ Our broker does forward eligible traffic to meshmap and to Liam's
broker, so uplinking here is a convenient way onto both. Two caveats on the sentence above,
though: it is not the *only* way short of running your own server — other community brokers bridge
to those services too — and forwarding is not the same as being displayed, because each map
applies its own filters for position, key and freshness before a node shows up.*

*__Some field names have moved since 2024.__ What this article calls **Topic** is now **Root
Topic** in the MQTT module, and **JSON output** is **JSON Enabled** — and on iOS that toggle has
been removed altogether, which is fine, because off is the state you want. The setting names in
SUSHI's list are otherwise unchanged.*

*__And a caveat about the maps generally.__ A node generally only reaches the community maps if
its owner has enabled **OK to MQTT**, and plenty never do — so there are always many more nodes on
the air than the maps show. For which channel to run and the rest of the recommended settings, see
[Best practices for the SoCal Mesh](../best-practices/).*
