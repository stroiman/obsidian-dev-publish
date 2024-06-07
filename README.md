# Obsidian publish note to DEV

Obsidian plugin that allows you to publish notes as articles on DEV (https://dev.to)

> [!NOTE]
> Articles are created in a draft state on DEV, so you can properly review them
> before making them public.

> [!CAUTION]
> This plugin stores your DEV api key unencrypted in the plugin configuration
> file, stored as part of your obsidian vault. If you don't fully understand the
> implications of this, don't use this plugin.
>
> This is important, I will repeat: Don't use this plugin if you don't fully
> understand the security implications!

## Implemented features

- Create a new article on DEV when running on the active note.
- Update the article on DEV with changes made since first creation.
- Title of the article is the first H1 heading in the not.
- Body of the article is everything _after_ the first H1 in the note.
- Resolve the `url` metadata of linked attributes.
- After creating a note, add a link in the frontmatter

### A note about the special meaning of H1

Obsidian uses markdown as its file format, and markdown has a special affinity
with HTML (after all, markdown is originally a tool that can generate HTML from
human readable text files).

According to the HTML standard, each page should have exactly **one** H1
element that is the actual title of the page (despite the fact that there is
also a `<title>` element on the page, but that is not shown ON the page, but
typically in the browser's header - and a default value for bookmark names).

When editing an article on DEV, their help text also says that the title of an
article will be rendered as H1, and you should avoid using H1 elements in the
body; that H2 should be the 'lowest' heading used in the body.

It is note required that the H1 is the first text on the page. In accordance
with that, I keep links to relevant notes during the writing at the very top of
the note in obsidian; before the H1. Links to supporting observations,
contradictory ideas, ideas I _may_ want to reflect on when writing this article.

That is why everything up to, and including, the first H1 in a note is
ignored, and why the heading text of the first H1 in the note is used as the
title when creating a note on DEV.

### Rendering of medialinks

When the plugin encounters a medialink in the note, it will try to find the
actual note that is being linked. If that note has a `url` property in the
frontmatter, that value will be used as the link `href`.

For example, the note you publish has the following:

```markdown
I need to explain more about [[Medialink|medialinks]].
```

And `Medialink.md` has the following contents:

```
---
url: http://example.com/medialink
---
...
```

Then the generated markdown published will be:

```markdown
I need to explain more about [medialinks](http://example.com/medialink).
```

p.s. I have not tested how this works, if you have configured Obsidian to use
markdown links instead of medialinks.

## Missing features

### Essential

- Handle images.
- Allows the user to specify tags (the DEV tags would probably be kept separate
  from Obsidian tags initially, but perhaps user configurable over time).
- Securely handle API keys through system keychain/secure storage (although some
  research seems to indicate that this is not possible).

So unfortunately, one essential feature seems to be impossible, let me know if
you happen to know how a way to securely handle secrets from Obsidian plugins.

### Nice to have

- Control published state from Obsidian. Right now, new articles are created as
  draft, allowing you to control everything before publishing.
- Suggestion from @Rooyca: Autopublish - configurable by the user

## Follow along in the development process

This was developed mostly 100% while live coding on
[twitch.tv/stroiman](https://twitch.tv/stroiman).

I will make the videos available on YouTube for posterity, just cutting out
pauses when I had to take a break, or the door bell was ringing.

The first episode was stopped, when I was ready to do a full test of the plugin
in obsidian, and could not avoid exposing my API key on the stream. What
happened next was:

1. I hardcoded my API key in the main.ts file, and publishing a new article
   worked the first time I tried it.
1. Updating an article did not work. The `update` method, which had been mocked
   in tests, was not implemented. The actual code to make the PUT request _was_
   in place, it was just the glue, binding the production code to the obsidian
   `requestUrl` method that was missing.
1. I updated the manifest to give the plugin a unique ID and helpful name and
   description.
1. Once that was fixed, updating articles worked as well.
1. I realised that the frontmatter property used to save the id of a published
   article was called `medium-article-id`, which I renamed to `dev-article-id`.
1. I rewrote the command slightly, so it doesn't require you to be in "edit"
   mode to appear in the command pallete.
1. I changed the hardcoded title of created articles.
1. I changed the update function to only update the markdown (so a title change,
   and/or publish status/tags in DEV does not get overriden by an update).
1. I added the ability to set the API key in the settings, with a warning.

## Support this work

You can support my work here:

<a href="https://www.buymeacoffee.com/stroiman" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
