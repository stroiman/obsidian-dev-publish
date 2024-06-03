# Obsidian publish note to dev.to

Obsidian plugin that allows you to publish notes as articles on dev.to

> ![CAUTION]
> This plugin stores your dev.to API key unencrypted in the plugin configuration
> file, stored as part of your obsidian vault. If you don't fully understand the
> implications of this, don't use this plugin.
>
> This is important, I will repeat: Don't use this plugin if you don't fully
> understand the security implications!

This is very early release, but I think it _can_ be used, but you have to change

## Follow along in the development process

This was developed mostly 100% while live coding on
[twitch.tv/stroiman](https://twitch.tv/stroiman).

I will make the videos available on YouTube for posterity, just cutting out
pauses when I had to take a break, or answer the door.

The first episode was stopped, when I was ready to do a full test of the plugin
in obsidian, and could not avoid exposing my API key on the stream. What
happened next was:

1. I hardcoded my API key in the main.ts file, and publishing a new article
   worked the first time I tried it.
1. Before I could try, I had trouble finding my plugin in the list of community
   plugins. This was because I never changed the plugin id, causing it to
   collide with another experiment already present in my plugins folder.
   Assigning a new unique the id made the plugin available.
1. Updating an article did not work. The `update` method, which had been mocked
   in tests, was not implemented. The actual code to make the PUT request _was_
   in place, it was just the glue, binding the production code to the obsidian
   `requestUrl` method that was missing.
1. Once that was fixed, updating articles worked as well.
1. I realised that the frontmatter property used to save the id of a published
   article was called `medium-article-id`, which I renamed to `dev-article-id`.
1. I rewrote the command slightly, so it doesn't require you to be in "edit"
   mode to appear in the command pallete.
1. I changed the hardcoded title of created articles.
1. I changed the update function to only update the markdown (so a title change,
   and/or publish status/tags in DEV does not get overriden by an update).
1. I added the ability to set the API key in the settings, with warning messages.

## Support this work

You can support my work here:

<a href="https://www.buymeacoffee.com/stroiman" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
