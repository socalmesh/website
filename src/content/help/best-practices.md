---
title: "Best practices for the SoCal Mesh"
description: "The settings this community recommends — channel, device role, hop limit, broadcast intervals — and what actually makes a radio get heard."
author: "davie"
date: 2025-02-19
tags: ["settings", "best-practices", "getting-started"]
---

None of this is mandatory. These are the settings the people on this mesh have landed on after
running a lot of radios in a lot of places, and they exist for one reason: to keep the network
from talking over itself so your messages actually get through.

If you change one thing after reading this, change your hop limit. If you change nothing, you
will still be on the mesh.

## Which channel to set

**Start on LongFast, frequency slot 20.** That is where many of us are, and it is what your
radio is already close to out of the box.

**MediumFast slot 45 is an alternate.** A lot of us in SoCal do use it, and it is faster on the
air — but it is not always strong. Whether it works for you depends entirely on the area you
are trying to connect from. Try it if you can connect on it; come back to LongFast slot 20 if
you cannot.

Before you switch, look at [our live map](https://meshview.socalmesh.org) and see whether there
are MediumFast slot 45 nodes near you. One important catch when you do that: **the map only
shows nodes with "OK to MQTT" turned on.** There are many more nodes on this network than any
map displays, so an empty-looking area on the map is not proof that nobody is out there. Treat
the map as a floor, not a census — and ask on Discord, where someone in your area can usually
tell you what they are hearing.

Set **both** the preset and the frequency slot, not just one. A radio on the right preset with
the slot left at its default is on a different frequency from the rest of us, and radios on
different presets cannot hear each other at all.

We use the **default primary channel settings**. You do not need a separate pre-shared key, and
you do not need to pick a channel to join the public network. You are welcome to set your own
keys on your own devices for your own private channels — that is a separate thing from the
public mesh.

When your settings get into a state you cannot untangle, do a **factory reset** and start again
from default. It is not an admission of defeat; it is the fastest way back to a known-good radio.

### If you rename the primary channel

The default channel is particular about this, and getting it wrong quietly takes you off the
mesh:

- For the default LongFast channel to work, either leave its name alone entirely, or name it
  exactly `LongFast` — and change nothing else about it.
- LongFast also works as a **secondary** channel, if you name it `LongFast` and give it the key
  `AQ==`. That is the published default Meshtastic key, not a secret of ours.
- **If you change the primary channel in any way** — name, key, anything — set the frequency
  slot back to `20` yourself. Changing the channel can move you off it.

Slot `20` is the LongFast value for the **US** region. If you are running a different region,
the slot numbers are different — check your own region rather than copying ours.

## Device role

This is the setting people most often get wrong, and a wrong role hurts everyone around you,
not just you.

- **`CLIENT`** — the best all-round setting. **If you are unsure, use this.** It is also the
  right role for a "hop-out" node you have put somewhere a bit higher than where you sit.
- **`CLIENT_MUTE`** — the best choice for a **mobile** node. It does not forward other people's
  packets, which is what you want from something moving around in a car, but it still sends and
  receives your messages and still reports node info and position.
- **`ROUTER`** — only for a remote node on top of one of the highest peaks in your area. Very
  few nodes should ever be this. If your node is in your house, it is not this.
- **`REPEATER`** — **do not use it.** There are very few legitimate uses and it typically causes
  problems for the mesh around it.

## Hop limit

**Use 3 to 5.** You can try up to 7 now and then if you are chasing a specific contact, but
leaving it that high is not recommended — every extra hop is another copy of your message on
the air, and past a certain point you are adding congestion rather than reach.

## Broadcast intervals

Chatty nodes are the main cause of a congested mesh, and the defaults are chattier than a
permanent installation needs. Times are in seconds.

**Infrastructure nodes** — anything mounted and staying put:

| Setting | Seconds |
|---|---|
| Position | `86400` |
| Telemetry | `3600`–`7200` |
| Node info | `86400` |

**Mobile nodes** — anything that moves:

| Setting | Seconds |
|---|---|
| Position | `900` |
| Telemetry | `900` |
| Node info | `86400` |

A node bolted to a roof does not need to announce its position every fifteen minutes. It has
not moved.

## MQTT

If you want your traffic to reach the community maps, that is a separate set of settings and
they have their own guide: **[How do I uplink to MQTT](../how-do-i-uplink-to-mqtt/)**. Follow
that rather than guessing — the topic string is case sensitive, and there is one setting in
there you specifically should not turn on.

## What actually makes a radio get heard

The settings above are the easy part. This is the part that decides whether anyone hears you,
and most of it comes down to physics rather than configuration. Thanks to **@Coopersmith**,
whose field notes this section is built on.

**Receiving is easier than transmitting.** On a handheld with the antenna it shipped with, you
will see nodes appear in your node list long before those nodes can hear you. That list is good
news — it proves your settings are right and your receiver works — but it is not proof that you
are getting out.

**Antennas and height are the name of the game.** A better antenna makes the most of the signal
you have; height buys you line of sight. Those two things will do more for you than any setting
on this page.

**Line of sight matters enormously at these frequencies.** Glass and plastic are roughly
transparent to your signal. Almost anything else — walls, terrain, buildings, trees, a hill
between you and the next node — costs you signal, and Meshtastic transmits at very low power to
begin with. Given a good antenna and a clear view, the range is genuinely surprising.

**No confirmation does not mean it was not received.** Because of the way the mesh works, the
person you messaged may well have got it even when nothing comes back to you — including when
your radio reports it hit max transmissions. Silence is ambiguous, not negative.

**Every hop lowers your odds.** The more nodes your message has to pass through, the less likely
you are to establish real two-way conversation. This is the practical reason the hop limit
advice above is 3 to 5 and not "as high as it goes" — and the reason a well-placed node beats a
distant one.

## Where to ask

Come to **[Discord](https://discord.gg/ZF6b9nrv7n)**. It is a friendly and helpful group, and it
is the fastest way to get a real answer about your own area from someone who is on the air there.

Introduce yourself when you arrive — whether you have your first node in your hands or have not
bought anything yet. Plenty of people turn up to ask what to buy, and that is a perfectly good
reason to be there.

## Where these settings come from

Meshtastic's own documentation is the authority on what each setting does:
[the introduction](https://meshtastic.org/docs/introduction/) for how the network fits together,
and [Meshtastic Routing Issues and Deployment Scenarios](https://youtu.be/htjwtnjQkkE) if you
want to understand why roles and hop limits matter as much as they do.

This guide replaces the SoCal Mesh best-practices notes that used to live in a separate
repository. If something here is wrong, or has gone stale, say so on Discord and we will fix it.
