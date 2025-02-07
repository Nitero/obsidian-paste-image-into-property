import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	imageSavePath: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	imageSavePath: 'attachments',
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	isFrontmatterField(element: HTMLElement | null): boolean {
		if (!element)
			return false;
		return element.matches('.metadata-input-longtext.mod-truncate');
	}

	handlePaste(evt: ClipboardEvent) {
		const activeEl = document.activeElement as HTMLElement;

		if (this.isFrontmatterField(activeEl))
			this.handleFrontmatterImagePaste(evt, activeEl);
	}

	async handleFrontmatterImagePaste(evt: ClipboardEvent, target: HTMLElement) {
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
					await this.saveImageToVault(file, target);
					evt.preventDefault();
					break;
				}
			}
		}
	}
	
	async saveImageToVault(file: File, target: HTMLElement) {
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

		await this.insertImageIntoFrontmatter(activeFile, `[[${savePath}]]`, activeEl, propertyName, newFile);
	}
	
	async insertImageIntoFrontmatter(activeFile: TFile, filePath: string, activeEl: HTMLElement, propertyName: string | null | undefined, newFile: TFile) {
		if(document.activeElement as HTMLElement == activeEl)
			activeEl.blur();
		await new Promise(resolve => setTimeout(resolve, 50));

		try {
			if (propertyName == null)
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

	async onload() {
		await this.loadSettings();

		// this.addStatusBarItem().createEl('span');
		
		// this.app.workspace.on('editor-change', editor => 
		// 	console.log(editor.getDoc().getValue())
		// );

		// this.app.workspace.on('editor-paste', (evt, editor, info) => this.test(evt, editor, info));
		//-> doesnt register in property...

		this.registerDomEvent(document, "paste", (evt: ClipboardEvent) => this.handlePaste(evt), true);

		
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
