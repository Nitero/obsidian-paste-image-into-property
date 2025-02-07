# Paste image into property

Add images from the clipboard to frontmatter properties in live preview mode.

This functionality is currently missing in Obsidian as documented in this [feature request](https://forum.obsidian.md/t/paste-image-into-frontmatter-property/95877).

Compatible with the [paste imag rename](https://github.com/reorx/obsidian-paste-image-rename) plugin.

## How to use

- Create a text property in the frontmatter of a note and click into the text field.
- Paste an image from the clipboard with your systems shortcut.
- The image will be saved to the vault to the attachment path (dafault obsidan setting) and a link will be created.
- (Optionally show the image from the property using dataview in a table or inline query.)

![paste-image-into-property-example](https://github.com/user-attachments/assets/85b9a1d5-54a2-493c-a822-754e06dfeab9)

## Limitations

- Currently only supported in live preview mode
- Only supports pasting images into text properties (no lists or other types yet)
- Will completely replace the properties content (no insering at cursor position)
- No mobile support
