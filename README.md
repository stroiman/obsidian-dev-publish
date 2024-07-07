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

## Usage

### Tags

Tags on DEV are taken from the `dev-tags` value in the frontmatter. If the value
is not an array, it will be ignored. Elements that are not strings will be
removed. DEV supports at most 4 tags. If you specify more than 4 tags, only the
first 4 will be used.

DEV shows tags prefixed with a hash (`#`). Don't add this yourself. The actual tag is the
text without the hash.

> [!NOTE]
> Obsidian tags are not used, as they can be used for different purposes. E.g. I
> use tags to indicate the purposes of notes, e.g. `project/article`, and I use
> links for grouping by topics. But on DEV, tags would correspond to topics.

### Images

It is not possible for the plugin to handle images completely. The DEV API does
not expose the capability of uploading images. This means that you need to
upload any images manually.

If you later need to update the article, you can now create a mapping from
embedded image links to the public URL where that resource is available.

Use the "Map embedded images to public URLs" command.

Note: It is intended to integrate this to the workflow of updating a published
article.

### Series

If the article is part of a series, you write the series name in the
`dev-series` metadata property.

TODO: Support this being a link to another note about the series itself, and
read the name from that note, the title, or a metadata property.

NOTE: At the time of writing this, I have not created a series on DEV, but I can
see that the value is set when editing the series for my unpublished test
articles.

### Mathjax support

Inline Mathjax, i.e. contained in single-`$`, like "This is our $CO_2$ report",
will be converted to `{% katex inline %}` supported by DEV.

Mathjax blocks, i.e. wrapped in double-`$`s, will be converted to `{% katex %}`
blocks.

As this is probably a niche case, and could mess up texts that use
`$`-characters, e.g. a finance report, you have to explicitly enable this by
setting `dev-enable-mathjax` in the frontmatter.

### Example

Given, `My portfolio.md` exists in the vault with the following contents

```markdown
---
url: https://example.com/my-portfolio
---

# My Portfolio

...
```

And, `My bio.md` doesn't exist in the vault, or it exists but doesn't have a
`url` metadata field,

When I publish the file:

```markdown
---
dev-tags:
  - javascript
  - tdd
---

related:
 - [[TDD MOC]]
 - [[Javascript MOC]]

# How I write TDD in JS

I am good at it.

See my portfolio at [[My portfolio]], and my [[My bio]]
```

Then the following article is created on DEV.

```json
{
  "tags": ["javascript", "tdd"],
  "title: "How I write TDD in JS",
  "markdown": "I am good at it\n\nSee my portfolio at [My
  portfolio](https://example.com/my-portfolio), and My bio"
}
```

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

> [!WARNING] 
> This feature does not work for medialinks in a footnote due to a [bug in the
> Obsidian API](https://github.com/obsidianmd/obsidian-api/issues/166).

## Desired features

### Essential

* Securely handle API keys through system keychain/secure storage (although some
  research seems to indicate that this is not possible).
* Better image handling. DEV doesn't support image upload through the API,
  requiring you to upload them manually, and configure the mapping in the
  frontmatter.
  * One possibility is to upload to another site, or AWS S3 instead.
* Control published state from Obsidian. Right now, new articles are created as
  draft, allowing you to control everything before publishing.
* Suggestion from @Rooyca: Autopublish - configurable by the user

So unfortunately, one essential feature seems to be impossible, let me know if
you happen to know how a way to securely handle secrets from Obsidian plugins.

## Filing a bug report

If creating a note doesn't work, first check, and double check that the
access token is valid.

If you wish to file a bug report, please copy the error message from the
Obsidian console logs. (Accessible through the Developer Tools).

It will be helpful if you can share the note that you wish to publish,
as well as any linked notes.

## Support this work

You can support my work here:

<a href="https://www.buymeacoffee.com/stroiman" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
