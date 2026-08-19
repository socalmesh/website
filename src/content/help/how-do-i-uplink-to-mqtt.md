---
title: "How do I uplink to MQTT"
description: "SUSHI's settings for connecting your node to the SoCal Mesh MQTT server so your messages and position reach the community maps."
author: "SUSHI"
date: 2024-11-08
updated: 2026-08-19
tags: ["mqtt", "getting-started"]
---

*Originally posted by SUSHI in the SoCal Mesh Discord on November 8, 2024, and reproduced here
as written. The username and password below are the shared public ones for our broker, and they are
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

*Notes added later by the site maintainers, outside SUSHI's post. His settings above are still
right. These are context, plus one correction.*

*__How our broker is set up__, including the brokers it bridges to:
[socalmesh/mqtt-config](https://github.com/socalmesh/mqtt-config). Uplinking here does put you on
meshmap and Liam's map, because we share to both of them. It isn't the only route short of running
your own server, though. Other community brokers bridge there too.*

*__Two field names have moved since 2024.__ **Topic** is now **Root Topic**, and **JSON output** is
**JSON Enabled**. On iOS that toggle has gone altogether, which is no loss, since off is the state
you want anyway.*

*The maps only show nodes that uplink, so there are always more nodes on the air than they display.
For which channel to run and the rest of the recommended settings, see
[Best practices for the SoCal Mesh](../best-practices/).*
