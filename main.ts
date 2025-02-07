import { Notice, Plugin, TFile } from 'obsidian';

export default class PasteImageIntoProperty extends Plugin {

	async onload() {
		this.registerDomEvent(document, "paste", (evt: ClipboardEvent) => this.handlePaste(evt), true);
	}

	handlePaste(evt: ClipboardEvent) {
		const activeEl = document.activeElement as HTMLElement;

		if (this.isValidFrontmatterField(activeEl))
			this.handleImagePaste(evt, activeEl);
	}

	isValidFrontmatterField(element: HTMLElement | null): boolean {
		if (!element)
			return false;
		return element.matches('.metadata-input-longtext.mod-truncate');//only text property fields
	}

	async handleImagePaste(evt: ClipboardEvent, target: HTMLElement) {
		if (!evt.clipboardData)
			return;

		if(evt.clipboardData.types[0] != 'Files')
			return;

		const items: DataTransferItemList = evt.clipboardData.items;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			if (item.kind === "file" && item.type.startsWith("image/")) {
				const file = item.getAsFile();
				if (file) {
					await this.saveImageAndWriteLink(file, target);
					evt.preventDefault();
					break;
				}
			}
		}
	}
	
	async saveImageAndWriteLink(file: File, target: HTMLElement) {
		const arrayBuffer = await file.arrayBuffer();
		const fileExtension = file.type.split("/")[1] || "png";
		const fileName = `Pasted image ${Date.now()}.${fileExtension}`;

		const activeFile = this.app.workspace.getActiveFile();
		if(!activeFile)
		{
			new Notice(`No active file!`);
			return;
		}
		
		const savePath = await this.app.fileManager.getAvailablePathForAttachment(fileName, activeFile.path);

		//store selected property before safing to ensure compatability with obsidian-paste-image-rename plugin
		const activeEl = document.activeElement as HTMLElement;
		const propertyName = activeEl.parentNode?.parentNode?.children[0].children[1].getAttribute("aria-label");

		const newFile = await this.app.vault.createBinary(savePath, arrayBuffer);

		await this.writeLinkIntoFrontmatter(activeFile, `[[${savePath}]]`, activeEl, propertyName, newFile);
	}
	
	async writeLinkIntoFrontmatter(activeFile: TFile, filePath: string, activeEl: HTMLElement, propertyName: string | null | undefined, newFile: TFile) {
		if(document.activeElement as HTMLElement == activeEl)
			activeEl.blur();
		await new Promise(resolve => setTimeout(resolve, 50));

		try {
			if (!propertyName)
				throw new Error("aria-label attribute not found on the expected element.");
			await this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
				frontmatter[propertyName] = filePath;
			});
			new Notice(`Image added to frontmatter: ${filePath}`);
		} catch (error) {
			await this.app.vault.delete(newFile);
			new Notice(`Failed to update frontmatter!\n${error}`);
			console.error("Error updating frontmatter:", error);
		}
	}
}