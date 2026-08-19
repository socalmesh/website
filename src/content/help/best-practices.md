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

If you check one thing after reading this, check your device role — it is the setting people get
wrong most often, and the one that affects everybody around you. If you change nothing at all, you
will still be on the mesh.

## Which channel to set

**Start on LongFast, frequency slot 20.** That is where many of us are, and it is what your
radio is already close to out of the box.

**MediumFast slot 45 is an alternate.** A lot of us in SoCal do use it, and it is faster on the
air — but it is not always strong. Whether it works for you depends entirely on the area you
are trying to connect from. Try it if you can connect on it; come back to LongFast slot 20 if
you cannot.

Before you switch, look at [our live map](https://meshview.socalmesh.org) and see whether there
are MediumFast slot 45 nodes near you. One important catch when you do that: **the maps only show
nodes that uplink to MQTT** — the "OK to MQTT" setting — and plenty of people never turn it on.
There are many more nodes on this network than any map displays, so an empty-looking patch is not
proof that nobody is out there. Treat the map as a floor, not a census — and ask on Discord, where
somebody in your area can tell you what they are actually hearing.

Set **both** the preset and the frequency slot, not just one — and type the slot number in rather
than leaving it at `0`, for the reason in the next section. Radios on different presets cannot
hear each other at all, however the slot is set.

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
- **Set the frequency slot explicitly rather than trusting the default.** When the slot is left
  at `0`, the radio works out its frequency by hashing the name of the primary channel — so
  renaming the primary can move you onto a different frequency. Changing the *key* does not.
  On a factory-fresh radio that hash happens to land on slot 20 for LongFast and slot 45 for
  MediumFast, which is why it often seems to work with nothing set; typing the number in is what
  makes it reliable.
- Slot `20` is the LongFast value for the **US** region. It is not a universal "put it back to
  20" — if you are joining MediumFast slot 45, the slot is `45`, and other regions use different
  numbers entirely.

You may also see advice to add LongFast as a **secondary** channel named `LongFast` with the key
`AQ==`. Be clear about what that does: every secondary channel shares the primary's preset and
frequency slot, so it does **not** let a MediumFast radio hear the LongFast mesh over the air. It
only decrypts LongFast-named traffic that reaches you some other way, such as over MQTT. (`AQ==`
is the published default key, not a secret of ours.)

## Device role

This is the setting people most often get wrong, and a wrong role hurts everyone around you,
not just you.

- **`CLIENT`** — the best all-round setting, and the default. **If you are unsure, use this.** It
  is also what you want out in the backcountry, where your radio might be the only thing another
  node can reach.
- **`CLIENT_BASE`** — for a node you have mounted somewhere with a view, an attic or a roof, that
  should favour your own nearby nodes. This is the current role for that job. Older guides —
  including the one this page replaces — said to use `CLIENT` for a "hop-out" node like this; that
  advice predates `CLIENT_BASE`.
- **`CLIENT_MUTE`** — for a node that should not relay anyone else's traffic: one sitting right
  next to a stronger node of your own, or one of several you keep in the same place. It still
  sends and receives your messages and still reports its node info and position. It is **not** the
  automatic answer for anything that moves — a radio out on a hike is more use as `CLIENT`.
- **`ROUTER`** — only for a node in a genuinely strategic spot, which means a mountain peak, not a
  tall building. Meshtastic now advises avoiding it unless the placement has been worked out with
  the rest of the mesh. `ROUTER_LATE` exists for filling in a known dead spot.
- **`REPEATER`** — **do not use it.** It typically causes problems for the mesh around it, and it
  is deprecated as of firmware 2.7.11.

There are a couple of other roles you will see in the list — `CLIENT_HIDDEN` among them. If you do
not already know you need one, you do not.

## Hop limit

**Leave it at 3.** That is the firmware default, 7 is the maximum, and Meshtastic's own position is
that 3 really is fine. You will see 3 to 5 recommended around here, and some larger meshes do run
their infrastructure a little higher.

Going up is not the free win it looks like. Every extra hop is another copy of your message on the
air, so past a certain point you are buying congestion rather than reach — and a badly placed node
can pick a packet up and spend its hops before it ever reaches a useful one. People then raise
their hop count in response, which makes it worse for everybody. If your messages are not landing,
a better antenna or a better-placed node will do far more for you than another hop.

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
| Telemetry | `900`–`1800` |
| Node info | `86400` |

A node bolted to a roof does not need to announce its position every fifteen minutes. It has not
moved.

Two things those tables cannot tell you. **Smart position broadcast is on by default**, so a
moving node reports its position more often than its interval suggests — the number is a ceiling
for a radio sitting still, not a promise. And Meshtastic's own defaults have shifted since these
recommendations were written: telemetry now defaults to 1800 seconds and node info to 10800, and
firmware from 2.4.0 onwards stretches these intervals further by itself once a mesh passes about
forty online nodes. Where our number is shorter than the firmware's, lean towards the longer one.
Nothing here breaks if you do; the mesh just gets quieter.

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
between you and the next node — costs you signal, and these radios have very little to spare:
a typical node transmits around 22 dBm, a fraction of a watt. Given a good antenna and a clear
view, the range is genuinely surprising.

**No confirmation does not mean it was not received.** Because of the way the mesh works, the
person you messaged may well have got it even when nothing comes back to you — including when
your radio reports it hit max transmissions. Silence is ambiguous, not negative.

**Every hop lowers your odds.** The more nodes your message has to pass through, the less likely
you are to establish real two-way conversation. That is the practical reason the hop limit advice
above is a low number rather than "as high as it goes" — and the reason one well-placed node beats
a distant one.

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

This page is the current home for the SoCal Mesh best-practices notes, which started life in a
separate repository. If something here is wrong, or has gone stale, say so on Discord and we will
fix it — that is a good deal easier now it lives on the site.
