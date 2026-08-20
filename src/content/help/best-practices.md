---
title: "Best practices for the SoCal Mesh"
description: "The settings this community recommends: channel, device role, hop limit and broadcast intervals, plus what actually makes a radio get heard."
author: "davie"
date: 2025-02-19
tags: ["settings", "best-practices", "getting-started"]
---

None of this is mandatory. These are the settings people on this mesh have settled on after
running a lot of radios in a lot of places. The point of them is to stop the network talking over
itself, so your messages get through.

If you check one thing after reading this, check your device role. It's the setting people get
wrong most often, and the one that affects everyone around you. If you change nothing at all,
you'll still be on the mesh.

## Which channel to set

**Start on LongFast, frequency slot 20.** That's where many of us are, and it's the factory
default. Set your region to US and a new radio is already there: LongFast with the frequency slot
left alone works out to 20 on its own. For most people there's nothing else to change.

**MediumFast slot 45 is an alternate.** A lot of us in SoCal do use it, and it's faster on the
air. It isn't always strong, though, and whether it works for you depends on the area you're
trying to connect from. Try it if you can connect on it. Go back to LongFast slot 20 if you can't.

**LongTurbo slot 14 is an experiment.** It is a wider 500 kHz channel that carries a little more
than LongFast for roughly 3 dB less reach, and like LongFast it works out its own slot: 14. We are
only starting to test it, and our guess is that it becomes the default here eventually. It needs
firmware 2.7.17 or newer, and some older phone apps do not list the preset yet. Add it if you want
to help test, but do not make it the only channel on your only radio. Note that Meshtastic has said
it is considering a new default for version 3.0 without naming which one, so treat the "it becomes
the default" part as our expectation rather than anybody's announcement.

Before you switch, look at [our live map](https://meshview.socalmesh.org) and see if there are
MediumFast slot 45 nodes near you. One catch when you do: **the maps only show nodes that uplink
to MQTT**, which is the "OK to MQTT" setting, and plenty of people never turn it on. There are far
more nodes on this network than any map displays. So an empty patch on the map isn't proof that
nobody's out there. Use the map as a floor rather than a headcount, and ask on Discord, where
somebody nearby can tell you what they're really hearing.

Set both the preset and the frequency slot, not just one. Type the slot number in rather than
leaving it at `0`, for the reason in the next section. Radios on different presets can't hear each
other at all, whatever the slot says.

We use the **default primary channel settings**. You don't need a separate pre-shared key, and you
don't need to pick a channel to join the public network. Set your own keys on your own devices if
you want private channels. That's a separate thing from the public mesh.

If your settings get into a state you can't untangle, do a **factory reset** and start again from
default. It's not giving up. It's the quickest way back to a radio you can trust.

### If you rename the primary channel

The default channel is fussy about this, and getting it wrong takes you off the mesh quietly.

- For the default LongFast channel to work, either leave its name alone or name it exactly
  `LongFast`. Change nothing else about it.
- **Set the frequency slot yourself instead of trusting the default.** With the slot left at `0`,
  the radio works out its frequency from the name of the primary channel. So renaming the primary
  can move you onto a different frequency. Changing the key doesn't. On a factory-fresh radio that
  calculation lands on slot 20 for LongFast and slot 45 for MediumFast, which is why it often
  seems fine with nothing set. Typing the number in is what makes it reliable.
- Slot `20` is the LongFast value for the **US** region. It isn't a universal "put it back to 20".
  If you're joining MediumFast slot 45, the slot is `45`. Other regions use different numbers
  again.

You may also see advice to add LongFast as a **secondary** channel called `LongFast` with the key
`AQ==`. Be clear about what that does. Every secondary channel shares the primary's preset and
frequency slot, so this won't let a MediumFast radio hear the LongFast mesh over the air. It only
decrypts LongFast traffic that reaches you some other way, like over MQTT. (`AQ==` is the
published default key, not a secret of ours.)

## Device role

This is the setting people most often get wrong, and a wrong role hurts everyone around you rather
than just you.

- **`CLIENT`** is the best all-round setting, and the default. **If you're unsure, use this.** It's
  also what you want out in the backcountry, where your radio might be the only thing another node
  can reach.
- **`CLIENT_BASE`** is for a node you've mounted somewhere with a view, like an attic or a roof,
  that should prefer your own nearby nodes. This is the current role for that job. Older guides,
  including the one this page grew out of, said to use `CLIENT` for a "hop-out" node like this.
  That advice is older than `CLIENT_BASE`.
- **`CLIENT_MUTE`** is for a node that shouldn't relay anyone else's traffic. Think of one sitting
  right next to a stronger node of yours, or one of several you keep in the same place. It still
  sends and receives your messages, and still reports its node info and position. It isn't the
  automatic answer for anything that moves. A radio out on a hike is more use as `CLIENT`.
- **`ROUTER`** is only for a node somewhere genuinely strategic, meaning a mountain peak rather
  than a tall building. Meshtastic now says to avoid it unless you've worked the placement out
  with the rest of the mesh. There's also `ROUTER_LATE`, for filling in a dead spot you know about.
- **`REPEATER`**: **don't use it.** It usually causes problems for the mesh around it, and it's
  been deprecated since firmware 2.7.11.

You'll see a couple of other roles in the list, `CLIENT_HIDDEN` among them. If you don't already
know you need one, you don't.

## Hop limit

**Leave it at 3.** That's the firmware default, 7 is the maximum, and Meshtastic's own line is
that 3 really is fine. You'll see 3 to 5 recommended around here, and some bigger meshes do run
their infrastructure a little higher.

Turning it up isn't the free win it looks like. Every extra hop is another copy of your message on
the air, so past a point you're buying congestion instead of reach. A badly placed node can also
pick up a packet and spend its hops before it gets anywhere useful. People then raise their hop
count to compensate, which makes things worse for everybody. If your messages aren't landing, a
better antenna or a better-placed node will do far more for you than another hop.

## Broadcast intervals

Chatty nodes are the main cause of a congested mesh, and the defaults are chattier than a
permanent installation needs. Times are in seconds.

**Infrastructure nodes**, meaning anything mounted and staying put:

| Setting | Seconds |
|---|---|
| Position | `86400` |
| Telemetry | `3600` to `7200` |
| Node info | `86400` |

**Mobile nodes**, meaning anything that moves:

| Setting | Seconds |
|---|---|
| Position | `900` |
| Telemetry | `900` to `1800` |
| Node info | `86400` |

A node bolted to a roof doesn't need to announce its position every fifteen minutes. It hasn't
moved.

Two things those tables can't tell you. **Smart position broadcast is on by default**, so a moving
node reports its position more often than the interval suggests. Treat the number as a ceiling for
a radio sitting still. Also, Meshtastic's own defaults have shifted since these recommendations
were written: telemetry now defaults to 1800 seconds and node info to 10800, and firmware from
2.4.0 onwards stretches the intervals out by itself once a mesh passes about forty online nodes.
Where our number is shorter than the firmware's, go with the longer one. Nothing breaks if you do.
The mesh just gets quieter.

## MQTT

Getting your traffic onto the community maps takes a separate set of settings, and they have their
own guide: **[How do I uplink to MQTT](../how-do-i-uplink-to-mqtt/)**. Follow that rather than
guessing. The topic string is case sensitive, and there's one setting in there you specifically
shouldn't turn on.

## What actually makes a radio get heard

The settings above are the easy part. This is the part that decides whether anyone hears you, and
most of it is physics rather than configuration. Thanks to **@Coopersmith**, whose field notes this
section is built on.

**Receiving is easier than transmitting.** On a handheld with the antenna it came with, you'll see
nodes appear in your node list long before those nodes can hear you. That list is good news. It
proves your settings are right and your receiver works. It doesn't prove you're getting out.

**Antennas and height are the name of the game.** A better antenna makes the most of the signal
you have. Height buys you line of sight. Those two will do more for you than any setting on this
page.

**Line of sight matters enormously at these frequencies.** Glass and plastic are roughly
transparent to your signal. Almost anything else costs you: walls, terrain, buildings, trees, a
hill between you and the next node. These radios don't have much to spare either, since a typical
one transmits around 22 dBm, a fraction of a watt. Give it a good antenna and a clear view, though,
and the range is surprising.

**No confirmation doesn't mean it wasn't received.** Because of how the mesh works, the person you
messaged may well have got it even when nothing comes back to you, including when your radio says
it hit max transmissions. Silence is ambiguous rather than bad news.

**Every hop lowers your odds.** The more nodes your message has to pass through, the less likely
you are to get a real two-way conversation going. That's the practical reason the hop limit advice
above is a low number instead of "as high as it goes", and the reason one well-placed node beats a
distant one.

## Where to ask

Come to **[Discord](../../discord/)**. It's a friendly, helpful group, and it's the
fastest way to get a real answer about your own area from someone who's on the air there.

Introduce yourself when you arrive, whether you've got your first node in your hands or haven't
bought anything yet. Plenty of people turn up to ask what to buy. That's a perfectly good reason to
be there.

## Where these settings come from

Meshtastic's own documentation is the authority on what each setting does. Start with
[the introduction](https://meshtastic.org/docs/introduction/) for how the network fits together,
and watch [Meshtastic Routing Issues and Deployment Scenarios](https://youtu.be/htjwtnjQkkE) if you
want to know why roles and hop limits matter as much as they do.

This page is where the SoCal Mesh best-practices notes live now. They started out in a separate
repository. If something here is wrong or has gone stale, say so on Discord and we'll fix it,
which is a good deal easier now it's on the site.
