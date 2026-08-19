/**
 * SoCal Mesh — site settings.
 *
 * This is the ONE file to edit when a link, name, or piece of wording changes.
 * Nothing here is code you need to understand; every value is plain text between quotes.
 *
 *   name        The site name. Shows in the header, the browser tab, and share previews.
 *   tagline     The one-line description under the big heading on the home page. Also used
 *               as the site description that Google and Discord show.
 *   url         Where the site lives once it is on socalmesh.org. Only a fallback — the
 *               deploy workflow fills in the real address automatically.
 *   discord     invite     = the link behind every "Join us on Discord" button.
 *               widgetId   = the Discord server id that powers the member widget.
 *               quickStart = the "Quick Start" post inside Discord.
 *               showWidget = set to false to remove the embedded widget from the home page.
 *   channels    The two channels the mesh runs on, shown near the top of the home page.
 *               recommended: true puts the highlighted "this is the one" styling on it.
 *   startHere   The numbered "new here?" steps on the home page.
 *   reddit      Our subreddit.
 *   flasher     The official Meshtastic web flasher (installs firmware from a browser).
 *   meshLinks   The "Other mesh communities" page, grouped by the technology each one runs.
 *   shortDescription  A one-line description used when the site is saved to a phone's home screen.
 *   themeColor  The colour a phone browser paints its toolbar with.
 *   maps        The community maps, in the order they appear on the site. The first one is
 *               also the hero's "See the live map" button. community: true = we run it.
 *   github      Our public GitHub org and the repos we point people at.
 *   communityLinks  The "Projects and links" cards at the bottom of the home page, in order.
 *               To add one: copy a block, change the name, url and blurb.
 *   meshtastic  Trademark lines we are required to show in the footer. Do not reword these.
 *
 * To change the Discord invite: replace the link inside the quotes on the `invite` line.
 */

/* Every address the site uses, written once. Everything below refers to these,
   so changing a link here changes it everywhere it appears on the site. */
const links = {
  discordInvite: 'https://discord.gg/ZF6b9nrv7n',
  discordQuickStart:
    'https://discord.com/channels/1197390116201697290/1197390117128646769/1220500317850964202',
  reddit: 'https://www.reddit.com/r/SoCalMesh/',
  flasher: 'https://flasher.meshtastic.org',
  githubOrg: 'https://github.com/socalmesh',
  mqttConfig: 'https://github.com/socalmesh/mqtt-config',
  /* The bot we call the parrot, which echoes mesh traffic into Discord. This is the
     upstream project it comes from, not our fork of it. */
  parrot: 'https://github.com/baymesh/rage-against-the-meshine',
  /* The software our own map at meshview.socalmesh.org runs on. */
  meshview: 'https://github.com/pablorevilla-meshtastic/meshview',
  meshSense: 'https://github.com/Affirmatech/MeshSense',
  meshtastic: 'https://meshtastic.org',
} as const;

export const site = {
  name: 'SoCal Mesh',
  tagline:
    'We are building an open source LoRa communications network in Southern California.',
  shortDescription:
    'A community of people building a Meshtastic radio network across Southern California.',
  url: 'https://socalmesh.org',
  themeColor: '#15161c',

  discord: {
    invite: links.discordInvite,
    widgetId: '1197390116201697290',
    quickStart: links.discordQuickStart,
    showWidget: true,
  },

  /* The two channels we run. Change a number here and the home page follows.
     The recommended one comes first, because that is the order the cards appear in. */
  channels: [
    {
      short: 'LF20',
      preset: 'LongFast',
      slot: 20,
      frequency: '906.875 MHz',
      recommended: true,
      headline: 'Start here.',
      blurb:
        'Where many of us are, and close to what your radio already ships with. Set this one first.',
    },
    {
      short: 'MF45',
      preset: 'MediumFast',
      slot: 45,
      frequency: '913.125 MHz',
      recommended: false,
      headline: 'The alternate.',
      blurb:
        'Faster on the air, and plenty of us in SoCal use it — but it is not always strong. Try it if you can connect; it depends on your area.',
    },
  ],

  /* The numbered steps under "New here?" on the home page. */
  startHere: [
    {
      title: 'Get a radio',
      body: 'Any Meshtastic-compatible LoRa radio for the US 915 MHz band. Ask on Discord before you buy — people will tell you what is working for them right now.',
    },
    {
      title: 'Flash it',
      body: 'The official web flasher installs the firmware straight from your browser. Use Chrome or Edge — it needs WebSerial.',
      link: { label: 'Meshtastic web flasher', url: links.flasher },
    },
    {
      title: 'Set the channel',
      body: 'Region US, preset LongFast, frequency slot 20. Both settings, not just one — see the channels above. Once you are on the air, MediumFast slot 45 is worth a try.',
    },
    {
      title: 'Say hello',
      body: 'Send a message on the primary channel, and come say hi on Discord so someone can confirm they heard you.',
    },
  ],

  /* The "Other mesh communities" page, grouped by the technology each one runs.
     Meshtastic radios and MeshCore radios cannot talk to each other — that is why
     the page keeps them under separate headings. */
  meshLinks: {
    meshtastic: [
      { name: 'Meshtastic', url: links.meshtastic, blurb: 'The project itself — firmware, apps, and the official documentation.' },
      { name: 'Bay Area Mesh', url: 'https://bayme.sh/', blurb: 'San Francisco Bay Area. Runs MediumFast slot 45 — the channel we treat as our alternate — and our brokers bridge to each other.' },
      { name: 'MtnMe.sh', url: 'https://mtnme.sh/', blurb: 'Wrote up their move from LongFast to MediumFast slot 45 in detail.' },
      { name: 'MSP Mesh', url: 'https://mspmesh.org/', blurb: 'Twin Cities, Minnesota. Also on MediumFast slot 45.' },
      { name: 'Puget Mesh', url: 'https://pugetmesh.org/', blurb: 'Seattle and Puget Sound. A substantial configuration guide, covering their LongFast default and their alternates.' },
      { name: 'Colorado Mesh', url: 'https://coloradomesh.org/', blurb: 'Statewide across Colorado — they used to be DenverMesh.' },
      { name: 'Freq51', url: 'https://freq51.net/', blurb: 'Utah and Idaho. MediumFast, but on slot 51 — a reminder to check the slot, not just the preset.' },
      { name: 'Are You Meshing With Us', url: 'https://areyoumeshingwith.us/', blurb: 'Florida, with a well-kept directory of regional LoRa settings.' },
      { name: 'Mesh Brisbane', url: 'https://wiki.mbug.com.au/', blurb: 'Australia. Same preset names, quite different frequencies — MediumFast slot 45 lands near 926 MHz there, not 913.' },
    ],
    meshcore: [
      { name: 'MeshCore', url: 'https://meshcore.co.uk/', blurb: 'The MeshCore project — different firmware, different network, same idea.' },
      { name: 'West Coast Mesh', url: 'https://wcmesh.com/', blurb: 'A MeshCore community here on the west coast, running settings of their own rather than the defaults. Their wiki is worth reading even if you run Meshtastic.' },
    ],
  },

  reddit: links.reddit,
  flasher: links.flasher,

  /* These are NOT all the same data source, which is why each blurb says what it is.
     Ours comes first — it is also the hero's "See the live map" button. */
  maps: [
    {
      name: 'meshview.socalmesh.org',
      url: 'https://meshview.socalmesh.org',
      blurb: 'Our live map — an instance of meshview that we run ourselves.',
      community: true,
    },
    {
      name: 'meshview.world',
      url: 'https://meshview.world/',
      blurb: 'Pulls together the meshview instances it knows about, ours among them, into one view.',
      community: false,
    },
    {
      name: 'meshmap.net',
      url: 'https://meshmap.net',
      blurb: 'The wider map we have found most dependable, and it covers other regions too.',
      community: false,
    },
    {
      name: 'meshtastic.liamcottle.net',
      url: 'https://meshtastic.liamcottle.net/',
      blurb: 'Another view of much the same idea, though it may show fewer nodes.',
      community: false,
    },
  ],

  github: {
    org: links.githubOrg,
    parrot: links.parrot,
    meshview: links.meshview,
    meshSense: links.meshSense,
    mqttConfig: links.mqttConfig,
  },

  communityLinks: [
    {
      name: 'GitHub organization',
      url: links.githubOrg,
      blurb: 'Everything we build in the open — the broker config and the guides.',
    },
    {
      name: 'MQTT server config',
      url: links.mqttConfig,
      blurb: 'How our community MQTT broker is set up, and the bridges it feeds.',
    },
    {
      name: 'meshview',
      url: links.meshview,
      blurb: 'The software behind our live map. We run our own instance of it.',
    },
    {
      name: 'Rage Against the Meshine',
      url: links.parrot,
      blurb: 'The project behind the parrot — the bot that echoes mesh traffic into our Discord.',
    },
    {
      name: 'MeshSense',
      url: links.meshSense,
      blurb: 'Connects to your own node over Bluetooth or Wi-Fi and shows you nodes, signal reports and traceroutes — the clearest way to see who is reaching whom.',
    },
    {
      name: 'r/SoCalMesh on Reddit',
      url: links.reddit,
      blurb: 'Our subreddit — longer posts, build photos, and questions that outlive a chat window.',
    },
    {
      name: 'Meshtastic web flasher',
      url: links.flasher,
      blurb: 'Install firmware on a new radio from your browser. Chrome or Edge only.',
    },
    {
      name: 'Discord Quick Start',
      url: links.discordQuickStart,
      blurb: 'The post to read first once you are in the server.',
    },
  ],

  meshtastic: {
    site: links.meshtastic,
    trademark:
      'Meshtastic® is a registered trademark of Meshtastic LLC. Meshtastic software components are released under various licenses, see GitHub for details. No warranty is provided - use at your own risk.',
    notAffiliated:
      'This site is not affiliated with or endorsed by the Meshtastic project.',
  },
} as const;

export type Site = typeof site;
